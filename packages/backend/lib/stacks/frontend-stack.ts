import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
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
  api: apigateway.RestApi;
  userPoolId: string;
  userPoolClientId: string;
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
            : [`https://${props.domainName}`, "http://localhost:3000"],
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

    // -------------------------------------------------------------------------
    // CloudFront Function — URI rewrite for Next.js static export dynamic routes.
    //
    // Next.js static export only generates HTML for params known at build time.
    // Dynamic routes like /projects/[id] and /manager/[id] need their URIs
    // rewritten to the fallback HTML shell so client-side JS can hydrate and
    // fetch data at runtime.
    //
    // Pattern: if the URI matches a dynamic route and has no file extension,
    // rewrite it to the pre-rendered fallback page.
    // -------------------------------------------------------------------------
    const routingFunction = new cloudfront.Function(this, "RoutingFunction", {
      functionName: resourceName(this, "routing"),
      comment: "Rewrite dynamic route URIs to fallback HTML for Next.js static export",
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // Skip files with extensions (JS, CSS, images, fonts, etc.)
  if (uri.match(/\\.[a-z0-9]+$/i)) {
    return request;
  }

  // Dynamic route: /projects/<id> → /projects/__placeholder__.html
  if (uri.match(/^\\/projects\\/[^/]+$/)) {
    request.uri = '/projects/__placeholder__.html';
    return request;
  }

  // Dynamic route: /manager/<id> → /manager/new.html (the pre-rendered shell)
  if (uri.match(/^\\/manager\\/[^/]+$/)) {
    request.uri = '/manager/new.html';
    return request;
  }

  // Static pages: /signin → /signin.html, /projects → /projects.html, etc.
  if (!uri.endsWith('/') && !uri.includes('.')) {
    request.uri = uri + '.html';
    return request;
  }

  // Root path: / → /index.html (handled by defaultRootObject, but be safe)
  if (uri === '/') {
    request.uri = '/index.html';
  }

  return request;
}
      `),
    });

    // -------------------------------------------------------------------------
    // CloudFront Function — strip /images prefix for S3 origin path alignment.
    //
    // The /images/* behavior has originPath="/processed", so CloudFront would
    // request S3 key = processed + /images/<id>/<file>. We need to strip
    // the /images prefix so the final key is processed/<id>/<file>.
    // -------------------------------------------------------------------------
    const imagePathFunction = new cloudfront.Function(this, "ImagePathFunction", {
      functionName: resourceName(this, "image-path"),
      comment: "Strip /images prefix for S3 processed/ origin alignment",
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  request.uri = request.uri.replace(/^\\/images/, '');
  return request;
}
      `),
    });

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket, {
          originPath: "/static",
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        functionAssociations: [
          {
            function: routingFunction,
            eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      additionalBehaviors: {
        "/api/projects*": {
          origin: new origins.RestApiOrigin(props.api),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: new cloudfront.CachePolicy(this, "ProjectsCachePolicy", {
            cachePolicyName: resourceName(this, "projects-cache"),
            defaultTtl: cdk.Duration.hours(24),
            maxTtl: cdk.Duration.days(7),
            minTtl: cdk.Duration.seconds(0),
          }),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
        "/api/leaderboard*": {
          origin: new origins.RestApiOrigin(props.api),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
        "/api/images*": {
          origin: new origins.RestApiOrigin(props.api),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
        "/images/*": {
          origin: origins.S3BucketOrigin.withOriginAccessControl(bucket, {
            originPath: "/processed",
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          functionAssociations: [
            {
              function: imagePathFunction,
              eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            },
          ],
        },
      },
      defaultRootObject: "index.html",
      domainNames: [props.domainName],
      certificate: props.certificate,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      comment: resourceName(this, "cdn"),
      // Custom error responses: serve 404.html for genuinely missing resources.
      // The routing function handles dynamic routes before S3 is hit, so these
      // only fire for truly non-existent paths (e.g. typos, deleted assets).
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 404, responsePagePath: "/404.html" },
        { httpStatus: 404, responseHttpStatus: 404, responsePagePath: "/404.html" },
      ],
    });

    new route53.ARecord(this, "AliasRecord", {
      zone: hostedZone,
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    // Deploy frontend static export + runtime config.json to S3.
    // Both are in a single BucketDeployment to avoid prune conflicts
    // (separate deployments race, and the main one's --delete flag
    // removes config.json if it runs second).
    new s3deploy.BucketDeployment(this, "Deployment", {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, "../../../frontend/out")),
        s3deploy.Source.jsonData("config.json", {
          userPoolId: props.userPoolId,
          userPoolClientId: props.userPoolClientId,
        }),
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
