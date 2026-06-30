import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";

export interface DnsRecordProps {
  hostedZone: route53.IHostedZone;
  recordName: string;
  distribution: cloudfront.IDistribution;
}

/**
 * Route53 A record alias that points the custom domain to the CloudFront distribution.
 */
export class DnsRecord extends Construct {
  public readonly record: route53.ARecord;

  constructor(scope: Construct, id: string, props: DnsRecordProps) {
    super(scope, id);

    this.record = new route53.ARecord(this, "AliasRecord", {
      zone: props.hostedZone,
      recordName: props.recordName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(props.distribution)
      ),
    });
  }
}
