import * as cdk from "aws-cdk-lib";

/**
 * Generates a standardized resource name.
 *
 * Format: <account>-portfolio-<resource-name>-<stage>
 * Example: 202533526081-portfolio-cdn-test
 *
 * Use for any resource property that accepts a human-readable name or
 * description: S3 `bucketName`, CloudFront `comment`, Lambda `description`,
 * DynamoDB `tableName` (where stable names are needed for IAM), SSM parameter
 * paths, etc.
 */
export function resourceName(stack: cdk.Stack, name: string): string {
  const account = stack.account;
  const stage = stack.node.tryGetContext("stage") ?? "test";
  return `${account}-portfolio-${name}-${stage}`;
}
