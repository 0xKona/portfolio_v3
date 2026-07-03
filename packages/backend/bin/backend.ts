#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { BackendStack } from "../lib/stacks/backend-stack";
import { CertificateStack } from "../lib/stacks/certificate-stack";
import { FrontendStack } from "../lib/stacks/frontend-stack";
import { applyTags } from "../lib/tags";

const app = new cdk.App();

applyTags(app);

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION ?? "eu-west-2";
const domainName = "v3-test.konarobinson.com";
const hostedZoneDomain = "konarobinson.com";

new BackendStack(app, "BackendStack", {
  env: { account, region },
});

// ACM cert for CloudFront must be in us-east-1. crossRegionReferences lets
// FrontendStack (app region) consume it. If the cert is ever replaced
// (domain/SAN change), let CertificateStack finish deploying before
// FrontendStack to avoid a stale cross-region export.
const cert = new CertificateStack(app, "CertificateStack", {
  env: { account, region: "us-east-1" },
  crossRegionReferences: true,
  domainName,
  hostedZoneDomain,
});

new FrontendStack(app, "FrontendStack", {
  env: { account, region },
  crossRegionReferences: true,
  certificate: cert.certificate,
  domainName,
  hostedZoneDomain,
});
