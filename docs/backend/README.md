# Backend Documentation

AWS CDK backend for portfolio_v3. Serverless, single-region, pay-per-use.

## Contents

| Doc | For |
|---|---|
| [api-reference.md](./api-reference.md) | Frontend developers — endpoints, request/response schemas, auth |
| [deployment.md](./deployment.md) | Deploying and destroying the stacks |
| [scripts.md](./scripts.md) | Using the helper scripts in `/scripts` |

## Stack layout

Three CDK stacks, no circular dependencies:

```
BackendStack      → (no dependencies)
CertificateStack  → (no dependencies, us-east-1)
FrontendStack     → CertificateStack + BackendStack
```

| Stack | Region | Owns |
|---|---|---|
| `BackendStack` | `eu-west-2` | DynamoDB, Cognito, API Gateway, all Lambdas, EventBridge Pipe + Rule, SQS DLQ, SSM params |
| `CertificateStack` | `us-east-1` | ACM certificate (DNS-validated, required in us-east-1 for CloudFront) |
| `FrontendStack` | `eu-west-2` | S3 bucket, CloudFront distribution, OAC, Route 53 alias, static site deployment |

## What's in the backend

**Data** — single DynamoDB table (projects, leaderboard scores, a meta record) with two GSIs and a stream.

**Auth** — Cognito User Pool (single admin user) guards the dashboard. Public read endpoints need no auth.

**API** — API Gateway REST API. Public GETs go direct to DynamoDB via VTL (no Lambda). Writes and anything needing validation go through Go Lambdas (ARM64).

**Lambdas** (all Go, ARM64):

| Lambda | Trigger | Purpose |
|---|---|---|
| `projects` | API GW (POST/PUT/DELETE) | Validate + write project records |
| `leaderboard` | API GW (POST) | Validate + HMAC-verify + write scores |
| `image-upload-url` | API GW (POST) | Generate presigned S3 PUT URL |
| `image-processing` | S3 `raw/` upload | Generate JPEG variants → `processed/` |
| `invalidation` | DynamoDB stream → EventBridge Pipe | CloudFront invalidation + cache warming + `lastPublished` |
| `cleanup` | EventBridge weekly schedule | Delete orphaned `processed/` objects |

**Image pipeline** — presigned upload to `raw/` → S3 event → processing Lambda → 3 JPEG variants in `processed/` → `imageProcessed: true` on the record.

**Cache invalidation** — a project write hits the DynamoDB stream → EventBridge Pipe (filtered to `PROJECT#` keys) → invalidation Lambda invalidates and warms the CloudFront cache, then stamps `META#lastPublished`.

## Key resource identifiers (test)

| Resource | Value |
|---|---|
| Region / Account | `eu-west-2` / `202533526081` |
| DynamoDB table | `202533526081-portfolio-main-table-test` |
| S3 bucket | `202533526081-portfolio-static-site-test` |
| API base URL | `https://<api-id>.execute-api.eu-west-2.amazonaws.com/api` |

Resource names follow `<account>-portfolio-<slug>-<stage>` via `lib/naming.ts`.

## Conventions

- **Naming** — `resourceName(stack, "<slug>")` for any named resource.
- **Tags** — applied at the app root (`applyTags(app)`); no per-resource tagging.
- **Environments** — `--context stage=test|prod` (defaults to `test`).
- **Lambdas** — Go, ARM64/Graviton2, bundled via `@aws-cdk/aws-lambda-go-alpha`.

## Known gaps / not yet implemented

- **CloudFront path routing.** The distribution currently serves only the static site (default behavior → S3 `/static`). Planned `/api/*` → API Gateway and `/images/*` → S3 `processed/` behaviors are **not yet added**. Until they are, the frontend must call the API Gateway URL directly and build image URLs against the S3/`processed/` path. This also means the invalidation Lambda's cache-warming step is a no-op for `/api/*` until the behavior exists.
- **No API Gateway CORS.** Fine for same-origin serving through CloudFront (the intended setup), but a direct browser call to the API Gateway URL from another origin will be blocked. Server-side/curl calls are unaffected.
