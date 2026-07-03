# /// script
# requires-python = ">=3.11"
# dependencies = ["boto3"]
# ///
"""Pulls frontend environment variables from SSM and writes packages/frontend/.env.local.

Usage:
    uv run scripts/sync-env-local.py

Environment:
    STAGE       - test (default) or prod
    AWS_REGION  - eu-west-2 (default)
"""

import os
from pathlib import Path

import boto3

stage = os.environ.get("STAGE", "test")
region = os.environ.get("AWS_REGION", "eu-west-2")

sts = boto3.client("sts", region_name=region)
account = sts.get_caller_identity()["Account"]
ssm = boto3.client("ssm", region_name=region)

# SSM parameter name suffix → frontend env var name.
PARAM_MAP = {
    "user-pool-id": "NEXT_PUBLIC_USER_POOL_ID",
    "user-pool-client-id": "NEXT_PUBLIC_USER_POOL_CLIENT_ID",
    "hmac-secret": "NEXT_PUBLIC_HMAC_SECRET",
}


def get_param(suffix: str) -> str:
    name = f"/{account}-portfolio-{suffix}-{stage}"
    try:
        resp = ssm.get_parameter(Name=name)
        return resp["Parameter"]["Value"]
    except ssm.exceptions.ParameterNotFound:
        print(f"  ⚠️  Parameter not found: {name}")
        return ""


env_lines = []
print(f"Reading SSM parameters for stage={stage} in {region}...\n")

for suffix, env_var in PARAM_MAP.items():
    value = get_param(suffix)
    if value:
        env_lines.append(f"{env_var}={value}")
        print(f"  ✓ {env_var}")
    else:
        env_lines.append(f"# {env_var}=  # not set in SSM")
        print(f"  ✗ {env_var} (missing)")

# Write to packages/frontend/.env.local relative to repo root.
repo_root = Path(__file__).resolve().parent.parent
env_path = repo_root / "packages" / "frontend" / ".env.local"
env_path.write_text("\n".join(env_lines) + "\n")

print(f"\n✅ Written to {env_path.relative_to(repo_root)}")
