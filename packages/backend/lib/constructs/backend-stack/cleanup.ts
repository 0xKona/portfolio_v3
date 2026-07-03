import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as eventsTargets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as golambda from "@aws-cdk/aws-lambda-go-alpha";
import * as path from "path";
import { Construct } from "constructs";
import { resourceName } from "../../naming";

export interface CleanupProps {
  table: dynamodb.Table;
  bucketName: string;
}

/** Weekly scheduled Lambda that removes orphaned processed/ S3 objects. */
export class Cleanup extends Construct {
  constructor(scope: Construct, id: string, props: CleanupProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);
    const lambdaDir = path.join(__dirname, "../../../lambda");

    const fn = new golambda.GoFunction(this, "CleanupFn", {
      entry: path.join(lambdaDir, "cleanup"),
      functionName: resourceName(stack, "cleanup"),
      description: "Weekly cleanup of orphaned processed/ S3 objects",
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.minutes(5),
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.bucketName,
      },
    });

    // DynamoDB read access (GetItem to check project existence).
    props.table.grantReadData(fn);

    // S3 permissions: list bucket + delete objects under processed/ prefix.
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:ListBucket"],
        resources: [`arn:aws:s3:::${props.bucketName}`],
      })
    );
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:DeleteObject"],
        resources: [`arn:aws:s3:::${props.bucketName}/processed/*`],
      })
    );

    // Weekly schedule: Sunday 03:00 UTC.
    const rule = new events.Rule(this, "WeeklySchedule", {
      ruleName: resourceName(stack, "cleanup-schedule"),
      description: "Weekly trigger for orphaned S3 object cleanup",
      schedule: events.Schedule.cron({ minute: "0", hour: "3", weekDay: "SUN" }),
    });
    rule.addTarget(new eventsTargets.LambdaFunction(fn));
  }
}
