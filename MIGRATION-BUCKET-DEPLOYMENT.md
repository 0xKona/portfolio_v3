# Migration Plan: Replace CDK BucketDeployment with `aws s3 sync`

**Goal**: Move frontend asset deployment out of the flaky `Custom::CDKBucketDeployment` custom resource and use a direct `aws s3 sync` command instead. This is more reliable, faster, and easier to debug for Next.js sites.

## Why

- `BucketDeployment` frequently fails with "CloudFormation did not receive a response" even when files are successfully uploaded.
- Direct `s3 sync` gives clear progress, better error messages, and avoids custom resource timeouts.
- `--delete` flag keeps the S3 bucket clean.

---

## Step 1: Update the CDK Frontend Stack

### 1.1 Remove the BucketDeployment

In `packages/backend/lib/stacks/frontend-stack.ts`, remove or comment out the `BucketDeployment` block.

### 1.2 Add CloudFormation Outputs

Add these two outputs at the bottom of the stack (replace `distribution` with your actual CloudFront distribution variable if named differently):

```typescript
new cdk.CfnOutput(this, 'WebsiteBucketName', {
  value: websiteBucket.bucketName,
  description: 'Name of the S3 bucket hosting the static website',
});

new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
  value: distribution.distributionId,
  description: 'CloudFront distribution ID (for cache invalidation)',
});
```

### 1.3 Deploy the updated stack once

```bash
npm run deploy:prod
# or target just the frontend stack
npx cdk deploy FrontendStack-prod --context stage=prod
```

---

## Step 2: Create a Frontend Deploy Script

Create a new file: `scripts/deploy-frontend.sh`

```bash
#!/bin/bash
set -euo pipefail

STAGE=${1:-prod}
STACK_NAME="FrontendStack-${STAGE}"

echo "🚀 Deploying frontend to stage: $STAGE"

# Get outputs from CloudFormation
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='WebsiteBucketName'].OutputValue" \
  --output text)

DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

if [ "$BUCKET_NAME" = "None" ] || [ -z "$BUCKET_NAME" ]; then
  echo "❌ Could not find WebsiteBucketName output in stack $STACK_NAME"
  exit 1
fi

echo "📦 Syncing build output to s3://$BUCKET_NAME"
aws s3 sync packages/frontend/out "s3://$BUCKET_NAME" --delete

# Optional: Invalidate CloudFront cache
if [ "$DIST_ID" != "None" ] && [ -n "$DIST_ID" ]; then
  echo "🔄 Invalidating CloudFront distribution: $DIST_ID"
  aws cloudfront create-invalidation \
    --distribution-id "$DIST_ID" \
    --paths "/*" \
    --no-cli-pager
fi

echo "✅ Frontend deployment complete for stage: $STAGE"
```

Make it executable:

```bash
chmod +x scripts/deploy-frontend.sh
```

---

## Step 3: Update npm Scripts

In your root `package.json`, update/add the following scripts:

```json
{
  "scripts": {
    "deploy:prod": "npm run build && npm run deploy:prod --workspace=packages/backend && npm run deploy:frontend:prod",
    "deploy:frontend:prod": "bash scripts/deploy-frontend.sh prod"
  }
}
```

Note: The build step already runs `npm run build --workspace=packages/frontend`, so the `out/` folder should exist when the sync runs.

---

## Step 4: Test the New Flow

Run a full production deploy:

```bash
npm run deploy:prod
```

You should now see clear `upload:` progress from the `aws s3 sync` command instead of the custom resource logs.

---

## Optional Improvements

| Improvement | Command / Change | Benefit |
|---|---|---|
| Add cache control headers | `--cache-control "public, max-age=31536000"` | Better browser caching |
| Only invalidate changed paths | Use manifest or diff logic | Faster invalidations |
| Add to GitHub Actions / CI | Add step after `cdk deploy` | Automated & consistent |
| Dry-run first | `aws s3 sync ... --dryrun` | Safety check |
| Profile-specific region | Add `--region eu-west-2` if needed | Avoid region issues |

Example with cache headers:

```bash
aws s3 sync packages/frontend/out "s3://$BUCKET_NAME" \
  --delete \
  --cache-control "public, max-age=31536000, immutable"
```

---

## Rollback Plan

If you ever want to go back:

1. Re-add the `BucketDeployment` in CDK.
2. Remove the `deploy:frontend:prod` script.
3. Redeploy.
