import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { Construct } from "constructs";
import { BackendStack } from "./backend-stack";
import { StaticSiteBucket } from "../constructs/hosting-stack/static-site-bucket";
import { SiteCloudFrontDistribution } from "../constructs/hosting-stack/cloudfront-distribution";
import { DnsRecord } from "../constructs/hosting-stack/dns-record";
import { SiteDeployment } from "../constructs/hosting-stack/site-deployment";

export interface HostingStackProps extends cdk.StackProps {
  backend: BackendStack;
  certificate: acm.ICertificate;
  domainName: string;
  hostedZoneDomain: string;
}

export class HostingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: HostingStackProps) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromLookup(this, "Zone", {
      domainName: props.hostedZoneDomain,
    });

    // S3 bucket for static files
    const site = new StaticSiteBucket(this, "StaticSiteBucket");

    // CloudFront distribution
    const cdn = new SiteCloudFrontDistribution(this, "SiteDistribution", {
      bucket: site.bucket,
      certificate: props.certificate,
      domainName: props.domainName,
    });

    // Route53 alias record
    new DnsRecord(this, "DnsRecord", {
      hostedZone,
      recordName: props.domainName,
      distribution: cdn.distribution,
    });

    // Deploy frontend static files to S3
    new SiteDeployment(this, "SiteDeployment", {
      bucket: site.bucket,
      distribution: cdn.distribution,
    });
  }
}
