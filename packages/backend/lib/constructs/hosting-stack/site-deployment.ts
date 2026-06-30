import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as path from "path";

export interface SiteDeploymentProps {
  bucket: s3.IBucket;
  distribution: cloudfront.IDistribution;
}

/**
 * Syncs the frontend static export (out/) to S3 and invalidates CloudFront on deployment.
 */
export class SiteDeployment extends Construct {
  constructor(scope: Construct, id: string, props: SiteDeploymentProps) {
    super(scope, id);

    new s3deploy.BucketDeployment(this, "DeployFiles", {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, "../../../../frontend/out")),
      ],
      destinationBucket: props.bucket,
      distribution: props.distribution,
      distributionPaths: ["/*"],
    });
  }
}
