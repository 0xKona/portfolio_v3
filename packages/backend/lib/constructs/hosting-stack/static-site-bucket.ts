import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib";
import { resourceName } from "../../naming";

/**
 * S3 bucket that holds the static site files. Private access only — served via CloudFront.
 */
export class StaticSiteBucket extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    this.bucket = new s3.Bucket(this, "Bucket", {
      bucketName: resourceName(stack, "static-site-bucket"),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
  }
}
