import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { resourceName } from "../../naming";

export interface ApiGatewayProps {
  userPool: cognito.IUserPool;
}

/** REST API with Cognito authorizer. Endpoints added in subsequent steps. */
export class ApiGateway extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    this.api = new apigateway.RestApi(this, "RestApi", {
      restApiName: resourceName(stack, "api"),
      description: "Portfolio v3 REST API",
      deployOptions: { stageName: "api" },
    });

    this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [props.userPool],
        authorizerName: resourceName(stack, "authorizer"),
      }
    );
    this.authorizer._attachToApi(this.api);

    // Root GET returns a static health check response (no auth required).
    this.api.root.addMethod(
      "GET",
      new apigateway.MockIntegration({
        integrationResponses: [
          { statusCode: "200", responseTemplates: { "application/json": '{"status":"ok"}' } },
        ],
        requestTemplates: { "application/json": '{"statusCode": 200}' },
      }),
      {
        methodResponses: [{ statusCode: "200" }],
      }
    );
  }
}
