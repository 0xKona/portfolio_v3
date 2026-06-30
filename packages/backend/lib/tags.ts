import * as cdk from "aws-cdk-lib";

export function applyTags(scope: cdk.App): void {
  cdk.Tags.of(scope).add("Application", "portfolio-v3");
  cdk.Tags.of(scope).add("ManagedBy", "CDK");
}
