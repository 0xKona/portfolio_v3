import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";
import { Construct } from "constructs";
import { resourceName } from "../naming";

export interface FrontendStackProps extends cdk.StackProps {
  certificate: acm.ICertificate;
  domainName: string;
  hostedZoneDomain: string;
  imageProcessingFn?: lambda.IFunction;
}

/** S3 bucket, CloudFront distribution (OAC), DNS alias record, and site deployment. */
export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const stage = this.node.tryGetContext("stage") ?? "test";

    const hostedZone = route53.HostedZone.fromLookup(this, "Zone", {
      domainName: props.hostedZoneDomain,
    });

    const bucket = new s3.Bucket(this, "Bucket", {
      bucketName: resourceName(this, "static-site"),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      // Expire raw/ uploads after 7 days — processed originals are never needed again.
      lifecycleRules: [
        { id: "expire-raw-uploads", prefix: "raw/", expiration: cdk.Duration.days(7) },
      ],
      // S3 CORS for presigned PUT uploads from the browser.
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: stage === "prod"
            ? ["https://konarobinson.com", "https://www.konarobinson.com"]
            : [`https://${props.domainName}`],
          allowedHeaders: ["Content-Type"],
        },
      ],
    });

    // S3 event notification: trigger image-processing Lambda on raw/ uploads.
    if (props.imageProcessingFn) {
      bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3n.LambdaDestination(props.imageProcessingFn),
        { prefix: "raw/" }
      );
    }

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket, {
          originPath: "/static",
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: "index.html",
      domainNames: [props.domainName],
      certificate: props.certificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      comment: resourceName(this, "cdn"),
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: "/404.html" },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: "/404.html" },
      ],
    });

    new route53.ARecord(this, "AliasRecord", {
      zone: hostedZone,
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    new s3deploy.BucketDeployment(this, "Deployment", {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, "../../../frontend/out")),
      ],
      destinationBucket: bucket,
      destinationKeyPrefix: "static",
      distribution,
      distributionPaths: ["/*"],
    });

    // Export distribution ID to SSM for the invalidation Lambda to read.
    new ssm.StringParameter(this, "DistributionIdParam", {
      parameterName: `/${resourceName(this, "distribution-id")}`,
      description: "CloudFront distribution ID for cache invalidation",
      stringValue: distribution.distributionId,
    });
  }
}
