import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Backend resources will go here:
    // - DynamoDB table
    // - S3 bucket (images)
    // - Cognito User Pool
    // - Lambda functions
  }
}
