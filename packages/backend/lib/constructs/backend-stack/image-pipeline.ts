import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as golambda from "@aws-cdk/aws-lambda-go-alpha";
import * as path from "path";
import { Construct } from "constructs";
import { resourceName } from "../../naming";

export interface ImagePipelineProps {
  table: dynamodb.ITable;
  bucketName: string;
}

/** Image-processing Lambda triggered by S3 events on raw/ prefix. */
export class ImagePipeline extends Construct {
  public readonly processingFn: lambda.IFunction;

  constructor(scope: Construct, id: string, props: ImagePipelineProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);
    const lambdaDir = path.join(__dirname, "../../../lambda");

    const fn = new golambda.GoFunction(this, "ProcessingFn", {
      entry: path.join(lambdaDir, "image-processing"),
      functionName: resourceName(stack, "image-processing"),
      description: "Generates JPEG variants from uploaded images",
      architecture: lambda.Architecture.ARM_64,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(30),
      ephemeralStorageSize: cdk.Size.mebibytes(512),
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.bucketName,
      },
    });

    // DynamoDB read/write for setting imageProcessed flag.
    props.table.grantReadWriteData(fn);

    // S3 read on raw/ and write on processed/.
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [`arn:aws:s3:::${props.bucketName}/raw/*`],
      })
    );
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject"],
        resources: [`arn:aws:s3:::${props.bucketName}/processed/*`],
      })
    );

    this.processingFn = fn;
  }
}
