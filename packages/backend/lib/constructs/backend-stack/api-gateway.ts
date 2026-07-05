import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as golambda from "@aws-cdk/aws-lambda-go-alpha";
import * as fs from "fs";
import * as path from "path";
import { Construct } from "constructs";
import { resourceName } from "../../naming";

export interface ApiGatewayProps {
  userPool: cognito.IUserPool;
  table: dynamodb.ITable;
  bucketName: string;
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
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
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

    // --- Lambda functions (ARM64, Go) ---
    const lambdaDir = path.join(__dirname, "../../../lambda");

    const projectsFn = new golambda.GoFunction(this, "ProjectsFn", {
      entry: path.join(lambdaDir, "projects"),
      functionName: resourceName(stack, "projects"),
      description: "Projects POST/PUT/DELETE handler",
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.bucketName,
      },
    });
    props.table.grantReadWriteData(projectsFn);
    projectsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:ListBucket"],
        resources: [`arn:aws:s3:::${props.bucketName}`],
      })
    );
    projectsFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:DeleteObject"],
        resources: [`arn:aws:s3:::${props.bucketName}/raw/*`, `arn:aws:s3:::${props.bucketName}/processed/*`],
      })
    );

    const leaderboardFn = new golambda.GoFunction(this, "LeaderboardFn", {
      entry: path.join(lambdaDir, "leaderboard"),
      functionName: resourceName(stack, "leaderboard"),
      description: "Leaderboard POST handler",
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: props.table.tableName,
        HMAC_SECRET_PARAM: `/${resourceName(stack, "hmac-secret")}`,
      },
    });
    props.table.grantReadWriteData(leaderboardFn);
    leaderboardFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [
          `arn:aws:ssm:${stack.region}:${stack.account}:parameter/${resourceName(stack, "hmac-secret")}`,
        ],
      })
    );

    const imageUploadUrlFn = new golambda.GoFunction(this, "ImageUploadUrlFn", {
      entry: path.join(lambdaDir, "image-upload-url"),
      functionName: resourceName(stack, "image-upload-url"),
      description: "Image upload presigned URL generator",
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.bucketName,
      },
    });
    props.table.grantReadWriteData(imageUploadUrlFn);
    // Grant S3 PutObject for presigned URL generation on raw/ prefix.
    imageUploadUrlFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject"],
        resources: [`arn:aws:s3:::${props.bucketName}/raw/*`],
      })
    );

    // --- 3.6: POST /api/projects (Cognito auth) ---
    projectsResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(projectsFn),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        methodResponses: [{ statusCode: "200" }],
      }
    );

    // --- 3.7: PUT /api/projects/{id} (Cognito auth) ---
    projectByIdResource.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(projectsFn),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        methodResponses: [{ statusCode: "200" }],
      }
    );

    // --- 3.7: DELETE /api/projects/{id} (Cognito auth) ---
    projectByIdResource.addMethod(
      "DELETE",
      new apigateway.LambdaIntegration(projectsFn),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        methodResponses: [{ statusCode: "200" }],
      }
    );

    // --- 3.8: POST /api/leaderboard (public — HMAC verified in Lambda) ---
    leaderboardResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(leaderboardFn),
      { methodResponses: [{ statusCode: "200" }] }
    );

    // --- 3.9: POST /api/images/upload-url (Cognito auth) ---
    const uploadUrlResource = imagesResource.addResource("upload-url");
    uploadUrlResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(imageUploadUrlFn),
      {
        authorizer: this.authorizer,
        authorizationType: apigateway.AuthorizationType.COGNITO,
        methodResponses: [{ statusCode: "200" }],
      }
    );
  }
}
