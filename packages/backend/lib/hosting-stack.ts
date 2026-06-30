import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { BackendStack } from "./backend-stack";

interface HostingStackProps extends cdk.StackProps {
  backend: BackendStack;
}

export class HostingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: HostingStackProps) {
    super(scope, id, props);

    // Hosting resources will go here:
    // - S3 bucket for static site files
    // - CloudFront distribution
    // - API Gateway routing to backend Lambdas
    // - CloudFront invalidation on regeneration
  }
}
