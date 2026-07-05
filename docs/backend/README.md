# Backend Documentation

AWS CDK backend for portfolio_v3

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
| `image-upload-url` | API GW (POST) | Generate presigned S3 PUT URL (no project existence check) |
| `image-processing` | S3 `raw/` upload | Generate JPEG variants → `processed/` |
| `invalidation` | DynamoDB stream → EventBridge Pipe | CloudFront invalidation + cache warming + `lastPublished` |
| `cleanup` | EventBridge weekly schedule | Delete orphaned `processed/` objects |

**Image pipeline** — presigned upload to `raw/<projectId>/<imageId>.<ext>` → S3 event → processing Lambda → 3 JPEG variants per image (`<imageId>-thumbnail.jpg`, `<imageId>-optimised.jpg`, `<imageId>-original.jpg`) in `processed/<projectId>/` → `imageProcessed: true` on the record. Each upload generates a unique `imageId`; image order is managed by the `images` array on the project record.

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

## CloudFront path routing

All paths are served same-origin through CloudFront:

| Path | Origin | Cache |
|---|---|---|
| Default (`/*`) | S3 `static/` | Long (optimized) |
| `/api/projects*` | API Gateway | 24h, invalidated on project write |
| `/api/leaderboard*` | API Gateway | No cache |
| `/api/images*` | API Gateway | No cache |
| `/images/*` | S3 `processed/` | Long (optimized) |

No CORS needed — all API calls are same-origin from the frontend's perspective.

### Dynamic route routing (CloudFront Function)

A CloudFront Function (viewer-request) handles URI rewriting for Next.js static
export dynamic routes. Since `output: "export"` only generates HTML for params
known at build time, requests for dynamic paths (e.g. `/projects/<uuid>`) would
otherwise 404 against S3.

The function rewrites:

| Request URI | Rewritten to | Reason |
|---|---|---|
| `/projects/<any-id>` | `/projects/__placeholder__.html` | Dynamic route fallback shell |
| `/manager/<any-id>` | `/manager/new.html` | Dynamic route fallback shell |
| `/signin` | `/signin.html` | Static page without trailing slash |
| `/projects` | `/projects.html` | Static page without trailing slash |
| `/foo.js`, `/img.png` | unchanged | Files with extensions pass through |

The HTML shell loads, client-side JavaScript hydrates, and SWR fetches actual
data from the API. This means new projects work immediately without redeploying
the frontend — only the project data needs to exist in the API.

### Image path routing (CloudFront Function)

A second CloudFront Function (viewer-request) on the `/images/*` behaviour strips
the `/images/` prefix so the request maps to the `processed/` S3 prefix:

| Request URI | S3 key |
|---|---|
| `/images/<projectId>/<imageId>-thumbnail.jpg` | `processed/<projectId>/<imageId>-thumbnail.jpg` |
| `/images/<projectId>/<imageId>-optimised.jpg` | `processed/<projectId>/<imageId>-optimised.jpg` |
| `/images/<projectId>/<imageId>-original.jpg` | `processed/<projectId>/<imageId>-original.jpg` |
