import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Database } from "../constructs/backend-stack/database";
import { Auth } from "../constructs/backend-stack/auth";
import { ApiGateway } from "../constructs/backend-stack/api-gateway";

export class BackendStack extends cdk.Stack {
  public readonly database: Database;
  public readonly auth: Auth;
  public readonly apiGateway: ApiGateway;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.database = new Database(this, "Database");
    this.auth = new Auth(this, "Auth");
    this.apiGateway = new ApiGateway(this, "ApiGateway", {
      userPool: this.auth.userPool,
      table: this.database.table,
    });
  }
}
