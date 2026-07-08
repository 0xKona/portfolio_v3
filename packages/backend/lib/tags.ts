import * as cdk from "aws-cdk-lib";

export function applyTags(scope: cdk.App): void {
  const stage = scope.node.tryGetContext("stage") ?? "test";
  cdk.Tags.of(scope).add("Application", "portfolio-v3");
  cdk.Tags.of(scope).add("ManagedBy", "CDK");
  cdk.Tags.of(scope).add("Stage", stage);
}
