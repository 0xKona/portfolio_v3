#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { BackendStack } from "../lib/backend-stack";
import { HostingStack } from "../lib/hosting-stack";

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "eu-west-2",
};

const backend = new BackendStack(app, "BackendStack", { env });

new HostingStack(app, "HostingStack", {
  env,
  backend,
});
