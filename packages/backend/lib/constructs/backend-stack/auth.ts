import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { resourceName } from "../../naming";

/** Cognito User Pool and App Client for dashboard authentication. */
export class Auth extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const stack = cdk.Stack.of(this);
    const stage = stack.node.tryGetContext("stage") ?? "test";
    const isProd = stage === "prod";

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: resourceName(stack, "user-pool"),
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolClient = this.userPool.addClient("Client", {
      userPoolClientName: resourceName(stack, "user-pool-client"),
      authFlows: { userSrp: true },
      generateSecret: false,
    });

    new ssm.StringParameter(this, "UserPoolIdParam", {
      parameterName: `/${resourceName(stack, "user-pool-id")}`,
      description: "Cognito User Pool ID for frontend auth",
      stringValue: this.userPool.userPoolId,
    });

    new ssm.StringParameter(this, "UserPoolClientIdParam", {
      parameterName: `/${resourceName(stack, "user-pool-client-id")}`,
      description: "Cognito User Pool Client ID for frontend auth",
      stringValue: this.userPoolClient.userPoolClientId,
    });
  }
}
