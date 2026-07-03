import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as golambda from "@aws-cdk/aws-lambda-go-alpha";
import * as pipes from "@aws-cdk/aws-pipes-alpha";
import * as pipesSources from "@aws-cdk/aws-pipes-sources-alpha";
import * as pipesTargets from "@aws-cdk/aws-pipes-targets-alpha";
import * as path from "path";
import { Construct } from "constructs";
import { resourceName } from "../../naming";

export interface InvalidationPipelineProps {
  table: dynamodb.Table;
  domainName: string;
}

/** DynamoDB Stream → EventBridge Pipe (PROJECT# filter) → Invalidation Lambda + DLQ. */
export class InvalidationPipeline extends Construct {
  constructor(scope: Construct, id: string, props: InvalidationPipelineProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);
    const lambdaDir = path.join(__dirname, "../../../lambda");

    // SQS Dead Letter Queue for failed invalidation attempts.
    const dlq = new sqs.Queue(this, "DLQ", {
      queueName: resourceName(stack, "invalidation-dlq"),
      retentionPeriod: cdk.Duration.days(14),
    });

    // SSM parameter path where FrontendStack stores the distribution ID.
    const distributionIdParam = `/${resourceName(stack, "distribution-id")}`;

    // Invalidation Lambda — reads distribution ID from SSM at cold start.
    const fn = new golambda.GoFunction(this, "InvalidationFn", {
      entry: path.join(lambdaDir, "invalidation"),
      functionName: resourceName(stack, "invalidation"),
      description: "CloudFront cache invalidation + warming + lastPublished",
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(90),
      environment: {
        TABLE_NAME: props.table.tableName,
        DISTRIBUTION_ID_PARAM: distributionIdParam,
        DOMAIN_NAME: props.domainName,
      },
    });

    // Permissions: DynamoDB read/write (META record), CloudFront invalidation, SSM read.
    props.table.grantReadWriteData(fn);
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"],
        resources: ["*"],
      })
    );
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [
          `arn:aws:ssm:${stack.region}:${stack.account}:parameter${distributionIdParam}`,
        ],
      })
    );

    // EventBridge Pipe: DynamoDB Stream → filter → Lambda target.
    const source = new pipesSources.DynamoDBSource(props.table, {
      startingPosition: pipesSources.DynamoDBStartingPosition.LATEST,
      batchSize: 1,
      deadLetterTarget: dlq,
      maximumRetryAttempts: 3,
    });

    const target = new pipesTargets.LambdaFunction(fn, {});

    new pipes.Pipe(this, "Pipe", {
      pipeName: resourceName(stack, "invalidation-pipe"),
      description: "Routes PROJECT# DynamoDB stream events to invalidation Lambda",
      source,
      target,
      filter: new pipes.Filter([
        pipes.FilterPattern.fromObject({
          dynamodb: {
            NewImage: {
              PK: { S: [{ prefix: "PROJECT#" }] },
            },
          },
        }),
      ]),
    });
  }
}
