# Deployment Guide

How to deploy and tear down the backend.

## Prerequisites

- **Node.js** + npm (CDK is TypeScript)
- **Go** ≥ 1.24 (Lambdas are Go, ARM64; bundled at synth time)
- **uv** (for the helper scripts in `/scripts`)
- **AWS credentials** for account `202533526081`, default region `eu-west-2`
- **CDK bootstrap** — the target account/regions must be bootstrapped once:
  ```bash
  npx cdk bootstrap aws://202533526081/eu-west-2
  npx cdk bootstrap aws://202533526081/us-east-1   # for the certificate stack
  ```

All commands below run from the repo root unless noted.

## Environments

Selected via CDK context `stage`, defaulting to `test`.

| Stage | Domain |
|---|---|
| `test` | `v3-test.konarobinson.com` |
| `prod` | `konarobinson.com` |

## Deploy

Root scripts build the frontend first, then deploy all three stacks:

```bash
npm run deploy:test     # test
npm run deploy:prod     # prod
```

Under the hood (from `packages/backend`):

```bash
cdk deploy --all --context stage=test --require-approval never
cdk deploy --all --context stage=prod --require-approval broadening
```

- `test` deploys without prompting.
- `prod` prompts when a change **broadens IAM or security-group** permissions.

First deploy takes a few minutes (ACM DNS validation + CloudFront distribution). Go Lambdas are compiled and bundled automatically during synth — no manual build step.

### First-time / post-deploy setup

1. **Set the HMAC secret** (created with a placeholder on first deploy):
   ```bash
   npm run set-hmac-secret:test
   ```
   Then redeploy so the Lambda picks up the value. See [scripts.md](./scripts.md).
2. **Create the Cognito dashboard user** — self-signup is disabled; create the admin user in the Cognito console or via `aws cognito-idp admin-create-user`.
3. **Sync frontend env vars** for local dev:
   ```bash
   npm run sync-env:test
   ```

## Inspect before deploying

```bash
npm run synth      # synthesize CloudFormation (also compiles Lambdas)
npm run diff       # diff against deployed stacks
```

Both run against `packages/backend`. Add `-- --context stage=prod` to target prod.

## Destroy

```bash
npm run destroy:test
npm run destroy:prod
```

Runs `cdk destroy --all --force`. Notes:

- **test** — the S3 bucket and DynamoDB table are set to `DESTROY` / `autoDeleteObjects`, so teardown is clean.
- **prod** — the DynamoDB table and Cognito pool use `RETAIN`; they survive `destroy` and must be removed manually if truly intended. This is deliberate — it protects production data.

## Stack dependency order

CDK resolves ordering automatically, but for reference:

```
CertificateStack (us-east-1)   ─┐
BackendStack (eu-west-2)        ─┼─→ FrontendStack (eu-west-2)
```

`FrontendStack` consumes the ACM certificate (cross-region reference) and the image-processing Lambda from `BackendStack`. The invalidation Lambda in `BackendStack` reads the CloudFront distribution ID from an SSM parameter written by `FrontendStack` at runtime — avoiding a circular dependency.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Need to perform AWS calls but no credentials configured` | Export AWS creds / set `AWS_PROFILE` |
| Certificate stack stuck `CREATE_IN_PROGRESS` | Waiting on DNS validation — the Route 53 record is created automatically; give it a few minutes |
| Go bundling fails | Check Go ≥ 1.24 is installed and on `PATH` |
| Leaderboard accepts any signature | `HMAC_SECRET` still the placeholder — run `set-hmac-secret` and redeploy |
| Frontend can't reach the API in the browser | CloudFront `/api/*` routing not yet wired; call the API Gateway URL directly for now |
