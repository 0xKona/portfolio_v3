import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";

export interface SiteCertificateProps {
  domainName: string;
  hostedZone: route53.IHostedZone;
}

/**
 * ACM certificate with DNS validation. Deployed in us-east-1 for CloudFront compatibility.
 */
export class SiteCertificate extends Construct {
  public readonly certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props: SiteCertificateProps) {
    super(scope, id);

    this.certificate = new acm.Certificate(this, "Certificate", {
      domainName: props.domainName,
      validation: acm.CertificateValidation.fromDns(props.hostedZone),
    });
  }
}
