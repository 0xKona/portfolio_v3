import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Database } from "../constructs/backend-stack/database";
import { Auth } from "../constructs/backend-stack/auth";

export class BackendStack extends cdk.Stack {
  public readonly database: Database;
  public readonly auth: Auth;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.database = new Database(this, "Database");
    this.auth = new Auth(this, "Auth");
  }
}
