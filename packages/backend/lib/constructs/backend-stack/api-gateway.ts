import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as fs from "fs";
import * as path from "path";
import { Construct } from "constructs";
import { resourceName } from "../../naming";

export interface ApiGatewayProps {
  userPool: cognito.IUserPool;
  table: dynamodb.ITable;
}

/** REST API with Cognito authorizer and VTL direct-to-DynamoDB integrations. */
export class ApiGateway extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    // REST API
    this.api = new apigateway.RestApi(this, "RestApi", {
      restApiName: resourceName(stack, "api"),
      description: "Portfolio v3 REST API",
      deployOptions: {
        stageName: "api",
        variables: { tableName: props.table.tableName },
      },
    });

    // Cognito authorizer — applied per-method where auth is required
    this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [props.userPool],
        authorizerName: resourceName(stack, "authorizer"),
      }
    );
    this.authorizer._attachToApi(this.api);

    // IAM role allowing API Gateway to call DynamoDB Query and GetItem
    const apiRole = new iam.Role(this, "DynamoDbRole", {
      roleName: resourceName(stack, "apigw-dynamodb-role"),
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    });
    props.table.grantReadData(apiRole);

    // Load VTL templates from the vtl/ directory
    const vtlDir = path.join(__dirname, "../../../vtl");
    const vtl = (filename: string) =>
      fs.readFileSync(path.join(vtlDir, filename), "utf-8");

    // --- Resources ---
    const apiResource = this.api.root.addResource("api");
    const projectsResource = apiResource.addResource("projects");
    const projectByIdResource = projectsResource.addResource("{id}");
    const leaderboardResource = apiResource.addResource("leaderboard");
    const imagesResource = apiResource.addResource("images");
    const imageStatusResource = imagesResource
      .addResource("status")
      .addResource("{projectId}");

    // --- 3.2: GET /api/projects (public) ---
    projectsResource.addMethod(
      "GET",
      new apigateway.AwsIntegration({
        service: "dynamodb",
        action: "Query",
        options: {
          credentialsRole: apiRole,
          requestTemplates: {
            "application/json": vtl("projects-get-request.vtl"),
          },
          integrationResponses: [
            {
              statusCode: "200",
              responseTemplates: {
                "application/json": vtl("projects-get-response.vtl"),
              },
            },
          ],
        },
      }),
      { methodResponses: [{ statusCode: "200" }] }
    );

    // --- 3.3: GET /api/projects/{id} (public) ---
    projectByIdResource.addMethod(
      "GET",
      new apigateway.AwsIntegration({
        service: "dynamodb",
        action: "GetItem",
        options: {
          credentialsRole: apiRole,
          requestTemplates: {
            "application/json": vtl("projects-getbyid-request.vtl"),
          },
          integrationResponses: [
            {
              statusCode: "200",
              responseTemplates: {
                "application/json": vtl("projects-getbyid-response.vtl"),
              },
            },
          ],
        },
      }),
      { methodResponses: [{ statusCode: "200" }] }
    );

    // --- 3.4: GET /api/leaderboard (public) ---
    leaderboardResource.addMethod(
      "GET",
      new apigateway.AwsIntegration({
        service: "dynamodb",
        action: "Query",
        options: {
          credentialsRole: apiRole,
          requestTemplates: {
            "application/json": vtl("leaderboard-get-request.vtl"),
          },
          integrationResponses: [
            {
              statusCode: "200",
              responseTemplates: {
                "application/json": vtl("leaderboard-get-response.vtl"),
              },
            },
          ],
        },
      }),
      { methodResponses: [{ statusCode: "200" }] }
    );

    // --- 3.5: GET /api/images/status/{projectId} (Cognito auth) ---
    imageStatusResource.addMethod(
      "GET",
      new apigateway.AwsIntegration({
        service: "dynamodb",
        action: "GetItem",
        options: {
          credentialsRole: apiRole,
          requestTemplates: {
            "application/json": vtl("image-status-get-request.vtl"),
          },
          integrationResponses: [
            {
              statusCode: "200",
              responseTemplates: {
                "application/json": vtl("image-status-get-response.vtl"),
              },
            },
          ],
        },
      }),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        methodResponses: [{ statusCode: "200" }],
      }
    );
  }
}
