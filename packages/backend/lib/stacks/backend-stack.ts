import * as cdk from "aws-cdk-lib";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { Database } from "../constructs/backend-stack/database";
import { Auth } from "../constructs/backend-stack/auth";
import { ApiGateway } from "../constructs/backend-stack/api-gateway";
import { ImagePipeline } from "../constructs/backend-stack/image-pipeline";
import { InvalidationPipeline } from "../constructs/backend-stack/invalidation-pipeline";
import { Cleanup } from "../constructs/backend-stack/cleanup";
import { resourceName } from "../naming";

export interface BackendStackProps extends cdk.StackProps {
  domainName: string;
}

export class BackendStack extends cdk.Stack {
  public readonly database: Database;
  public readonly auth: Auth;
  public readonly apiGateway: ApiGateway;
  public readonly imagePipeline: ImagePipeline;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const bucketName = resourceName(this, "static-site");

    // HMAC secret for leaderboard score verification.
    // Created with a placeholder value — set the real value via scripts/set-hmac-secret.sh.
    const hmacParam = new ssm.StringParameter(this, "HmacSecretParam", {
      parameterName: `/${resourceName(this, "hmac-secret")}`,
      description: "HMAC shared secret for leaderboard score verification",
      stringValue: "CHANGE_ME",
    });

    this.database = new Database(this, "Database");
    this.auth = new Auth(this, "Auth");
    this.apiGateway = new ApiGateway(this, "ApiGateway", {
      userPool: this.auth.userPool,
      table: this.database.table,
      bucketName,
      hmacSecret: hmacParam.stringValue,
    });
    this.imagePipeline = new ImagePipeline(this, "ImagePipeline", {
      table: this.database.table,
      bucketName,
    });
    new InvalidationPipeline(this, "InvalidationPipeline", {
      table: this.database.table,
      domainName: props.domainName,
    });
    new Cleanup(this, "Cleanup", {
      table: this.database.table,
      bucketName,
    });
  }
}
