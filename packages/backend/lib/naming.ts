import * as cdk from "aws-cdk-lib";

/**
 * Generates a standardized resource name.
 * Format: <account-number>-portfolio_v3-<resource-name>-<stage>
 */
export function resourceName(stack: cdk.Stack, name: string): string {
  const account = stack.account;
  const stage = stack.node.tryGetContext("stage") ?? "test";
  return `${account}-portfolio-${name}-${stage}`;
}
