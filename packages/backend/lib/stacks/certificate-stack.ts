import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import { SiteCertificate } from "../constructs/certificate-stack/site-certificate";

export interface CertificateStackProps extends cdk.StackProps {
  domainName: string;
  hostedZoneDomain: string;
}

export class CertificateStack extends cdk.Stack {
  public readonly certificate: cdk.aws_certificatemanager.ICertificate;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromLookup(this, "Zone", {
      domainName: props.hostedZoneDomain,
    });

    const cert = new SiteCertificate(this, "SiteCert", {
      domainName: props.domainName,
      hostedZone,
    });

    this.certificate = cert.certificate;
  }
}
