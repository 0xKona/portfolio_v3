import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Database } from "../constructs/backend-stack/database";

export class BackendStack extends cdk.Stack {
  public readonly database: Database;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.database = new Database(this, "Database");
  }
}
