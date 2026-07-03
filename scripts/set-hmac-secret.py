# /// script
# requires-python = ">=3.11"
# dependencies = ["boto3"]
# ///
"""Sets the HMAC secret in SSM Parameter Store.

After running this, redeploy BackendStack so the Lambda picks up the new value.

Usage:
    uv run scripts/set-hmac-secret.py <secret>
    uv run scripts/set-hmac-secret.py              # generates a random 32-byte hex secret

Environment:
    STAGE       - test (default) or prod
    AWS_REGION  - eu-west-2 (default)
"""

import os
import secrets
import sys

import boto3

stage = os.environ.get("STAGE", "test")
region = os.environ.get("AWS_REGION", "eu-west-2")

sts = boto3.client("sts", region_name=region)
account = sts.get_caller_identity()["Account"]
param_name = f"/{account}-portfolio-hmac-secret-{stage}"

if len(sys.argv) >= 2:
    secret = sys.argv[1]
else:
    secret = secrets.token_hex(32)
    print(f"Generated random secret: {secret}")

ssm = boto3.client("ssm", region_name=region)
ssm.put_parameter(
    Name=param_name,
    Value=secret,
    Type="String",
    Overwrite=True,
)

print(f"\n✅ Set {param_name} in {region}")
print(f"\nNext steps:")
print(f"  1. Redeploy: cd packages/backend && npm run deploy:{stage}")
print(f"  2. Use the same secret in your frontend game code")
