# Portfolio Website — Architecture

> Revised architecture following design review session — 2026-07-02

---

## Hosting & CDN

**Single CloudFront distribution** with cache behaviours by path:

| Path | Origin | Cache TTL |
|---|---|---|
| `/static/*` | S3 bucket (`static/` prefix) | Long (days/weeks) |
| `/images/*` | S3 bucket (`processed/` prefix) | Long (days/weeks) |
| `/api/projects*` | API Gateway | Long (24h+), invalidated on write |
| `/api/leaderboard*` | API Gateway | No cache |

`raw/` prefix has no CloudFront behaviour — never publicly routable, effectively private.

**Route 53** → CloudFront → custom domain.

**`www` redirect:** `www.konarobinson.com` added as an alternate domain on the existing CloudFront distribution. A CloudFront Function on the viewer request event redirects `www` requests to the apex domain (`https://konarobinson.com`). No extra bucket or distribution needed. Defined in `CloudFrontStack`.

---

## S3 Bucket Structure

Single bucket. Access controlled by CloudFront Origin Access Control (OAC) and prefix isolation:

```
s3://portfolio-bucket/
  static/                           ← Next.js static export, served via CloudFront
  raw/<projectId>/original.<ext>    ← private, no CloudFront behaviour, no public access
  processed/<projectId>/
    thumbnail.webp                  ← 400px wide, project list cards and previews
    optimised.webp                  ← 1200px wide, default project page display
    original.webp                   ← full quality, served on click-to-enlarge
```

All public access blocked at bucket level. CloudFront OAC is the only reader. `raw/` is inaccessible publicly by architecture — no CloudFront path exists for it.

**S3 lifecycle rule:** objects under `raw/` prefix expire after 7 days — processed originals are never needed again after the image pipeline completes. Configured on the bucket in CDK, zero maintenance required.

---

## Frontend (Next.js — Static Export → S3)

| Route | Type | Data source |
|---|---|---|
| `/` | Static shell | Client fetches `/api/projects?featured=true` |
| `/projects` | Static shell | Client fetches `/api/projects` |
| `/projects/[id]` | Static shell | Client fetches `/api/projects/{id}` |
| `/about` | Fully static | No data fetch |
| `/manager` | Static shell | Client fetches behind Cognito auth |
| `/login` | Static page | Cognito auth via Amplify Auth |
| `/reset-password` | Static page | Cognito auth via Amplify Auth |

**Note:** `next/image` is not used — static export does not support server-side image optimisation. Images are pre-processed by the image pipeline Lambda and served as WebP variants directly from S3/CloudFront. Standard `<img>` tags reference processed image URLs constructed from the known `projectId` pattern. Projects with no image or `imageProcessed: false` must be handled gracefully client-side — treat as a no-image state, not a broken state. Public GET returns all published projects regardless of image state.

---

## API (API Gateway REST — VTL direct DynamoDB integration)

| Endpoint | Method | Handler | Auth | Cache |
|---|---|---|---|---|
| `/api/projects` | GET | VTL → DynamoDB Query/Scan | None | CloudFront 24h+ |
| `/api/projects/{id}` | GET | VTL → DynamoDB GetItem | None | CloudFront 24h+ |
| `/api/projects` | POST | Go Lambda → DynamoDB PutItem | Cognito | None |
| `/api/projects/{id}` | PUT | Go Lambda → DynamoDB UpdateItem | Cognito | None |
| `/api/projects/{id}` | DELETE | Go Lambda → DynamoDB DeleteItem | Cognito | None |
| `/api/leaderboard` | GET | VTL → DynamoDB Query (sort by score) | None | None |
| `/api/leaderboard` | POST | Go Lambda → DynamoDB PutItem | None | None |
| `/api/images/upload-url` | POST | Go Lambda → S3 pre-signed URL | Cognito | None |
| `/api/images/status/{projectId}` | GET | VTL → DynamoDB GetItem | Cognito | None |

---

## Image Pipeline

**Upload and processing flow:**

> **Project ID generation:** `projectId` is generated client-side using `crypto.randomUUID()` the moment the user opens the new project form. No Lambda or network call required. The ID is included in the POST /api/projects body on submit. The projects Lambda validates it is a valid UUID format before writing, and uses `ConditionExpression: attribute_not_exists(PK)` to prevent overwrites.

> **Ordering:** since `projectId` is known upfront, image upload and form filling can happen in any order or concurrently. No sequential dependency between project creation and image upload.

> **Abandoned uploads:** if a user uploads an image but never submits the project, `raw/` is cleaned up by the 7-day S3 lifecycle rule. `processed/` orphans are cleaned up by the weekly Cleanup Lambda (see below).

```
Dashboard requests upload URL
→ POST /api/images/upload-url (Cognito auth) → Go Lambda
→ Lambda sets imageProcessed: false on the DynamoDB project record (resets state for re-uploads)
→ Lambda generates pre-signed S3 PUT URL for raw/<projectId>/original.<ext> with 5 minute expiry
→ Dashboard uploads image directly to S3 via pre-signed URL (no Lambda in upload path)
→ Dashboard handles 403 response gracefully ("URL expired, please retry") — retrying requests a fresh URL
→ Image lands in raw/<projectId>/original.<ext>
→ S3 Event Notification triggers Image Processing Lambda
→ Lambda reads original, generates three WebP variants, writes to processed/<projectId>/
→ Lambda sets imageProcessed: true on the DynamoDB project record
→ Dashboard polls GET /api/images/status/{projectId} (no cache, Cognito auth) until imageProcessed: true
→ Dashboard shows "processing..." state until complete, then confirms publish
```

**Image variants:**

| Variant | Width | Format | Use case |
|---|---|---|---|
| `thumbnail.webp` | 400px | WebP | Project list cards, previews |
| `optimised.webp` | 1200px | WebP | Default project page display |
| `original.webp` | Full resolution | WebP lossless | Click-to-enlarge |

**Frontend URL pattern:**
```
/images/<projectId>/thumbnail.webp   ← project list
/images/<projectId>/optimised.webp   ← project page default
/images/<projectId>/original.webp    ← click to enlarge
```

DynamoDB project record stores only `projectId` — frontend constructs image URLs from the known pattern. No absolute URLs stored in the database.

**Image processing library:** `github.com/disintegration/imaging` (Go, no CGO, compiles cleanly to Lambda ARM64).

---

## Leaderboard POST — Go Lambda

Handles validation before writing to DynamoDB:

- Name length enforced (e.g. max 20 characters)
- Name character whitelist (alphanumeric only, no HTML/scripts)
- Score validated as a positive integer within a realistic game range
- **HMAC signature verification** — game client signs the score payload with a shared secret at game end; Lambda verifies the signature before writing, preventing arbitrary score submission from outside the game

> **Note:** HMAC secret stored in SSM Parameter Store, injected as a Lambda environment variable at deploy time. Not hardcoded in client or Lambda source.

---

## DynamoDB — Single Table Design

One table for all entity types. Access patterns drive the key design.

**Key structure:**

| Entity | PK | SK | GSI1PK | GSI1SK | GSI2PK | GSI2SK |
|---|---|---|---|---|---|---|
| Project | `PROJECT#<id>` | `PROJECT#<id>` | `PROJECT` | `<createdAt>` | `FEATURED` (if published + featured) | `<createdAt>` |
| Score | `GAMESCORE#<id>` | `GAMESCORE#<id>` | `GAMESCORE` | `<createdAt>` | — | — |
| Meta | `META` | `lastPublished` | — | — | — | — |

**GSI1** — query all projects or all scores by entity type, ordered by `createdAt`.

**GSI2** — sparse index. Only items where `isFeatured = true` AND `status = "published"` have `GSI2PK = "FEATURED"` written. Unfeatured or draft items have no GSI2 attributes and are automatically excluded. Query `FEATURED` PK with `ScanIndexForward: false` returns featured projects newest first.

**VTL public reads filter on `status = "published"`** — draft projects never reach the client. Implemented as a `FilterExpression` on the GSI1 query — runs after items are read, so draft items are billed but discarded. Negligible at portfolio scale. `status` is a DynamoDB reserved word — must use expression name alias `#st` in VTL to avoid cryptic errors.

---

**Project fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | string | UUID, immutable |
| `name` | string | |
| `desc` | string? | nullable |
| `skills` | string[] | validated against `SKILL_ICON_NAMES` constant in frontend |
| `githubUrl` | string? | nullable |
| `demoUrl` | string? | nullable |
| `isFeatured` | boolean | controls GSI2 presence |
| `status` | `"published"` \| `"draft"` | controls GSI2 presence and public visibility |
| `createdAt` | ISO string | immutable |
| `updatedAt` | ISO string | |

Images are not stored in DynamoDB — frontend constructs image URLs from `projectId` using the known S3/CloudFront path pattern. Missing images handled gracefully client-side.

---

**Score fields:**

| Field | Type | Notes |
|---|---|---|
| `id` | string | UUID, immutable |
| `playerName` | string | validated by Lambda |
| `score` | string | raw game score |
| `multiplier` | string | score multiplier |
| `finalScore` | string | calculated final score |
| `game` | string? | nullable, for future multi-game support |
| `createdAt` | ISO string | |
| `updatedAt` | ISO string | |



---

## CORS

All API Gateway endpoints are cross-origin from the frontend. CORS must be explicitly configured on every resource and method — including `OPTIONS` preflight responses.

**Allowed origins by environment:**

| Environment | Domain | Allowed Origins |
|---|---|---|
| prod | `konarobinson.com` | `https://konarobinson.com`, `https://www.konarobinson.com` |
| test | `v3-test.konarobinson.com` | `https://v3-test.konarobinson.com` |

- Never use `*` as allowed origin — prevents auth headers from being sent, breaks authenticated endpoints
- `www.konarobinson.com` must be included in prod or redirected to apex at CloudFront level
- VTL integration responses must include `Access-Control-Allow-Origin` header — API Gateway does not add it automatically to non-preflight responses

**Environment config** is passed into CDK stacks via `--context env=prod` / `--context env=test`. Defaults to `test` if not specified. Domains, allowed origins, and any other environment-specific values are resolved from a config map in `bin/app.ts`.

---

## S3 CORS

The dashboard uploads images directly to S3 via pre-signed URL — a cross-origin PUT request from the browser directly to S3. S3 has its own CORS configuration separate from API Gateway and is not enabled by default.

**Required S3 CORS configuration:**

- Allowed origins: same as API Gateway — `https://konarobinson.com`, `https://www.konarobinson.com` (prod) / `https://v3-test.konarobinson.com` (test)
- Allowed method: `PUT` only — browser never reads directly from S3
- Allowed header: `Content-Type` — included in browser preflight automatically
- Reuses the environment config already defined for API Gateway CORS

Configured as a bucket property in CDK (`HostingStack`).

---

**EventBridge Pipe filter** — only trigger invalidation Lambda on project writes, not scores or meta:

```json
{
  "dynamodb": {
    "NewImage": {
      "PK": { "S": [{ "prefix": "PROJECT#" }] }
    }
  }
}
```

---

## Cache Invalidation Pipeline (async, post-write)

```
Go Lambda writes to DynamoDB (PROJECT#<id>)
→ DynamoDB Stream
→ EventBridge Pipe (filtered to PROJECT# writes only)
→ Invalidation Lambda (Go)
  → 1. Creates CloudFront invalidation for affected paths
  → 2. Polls until invalidation status = Completed (~5-30s)
  → 3. Warms cache by fetching affected endpoints via CloudFront domain (https://konarobinson.com/api/...)
       — must use CloudFront URL, not raw API Gateway URL, or cache remains cold
       — plain GET with no custom headers, CloudFront uses headers as part of cache key
  → 4. Writes lastPublished timestamp to META record in DynamoDB
```

Dashboard reads `lastPublished` to show publish status indicator.

SQS Dead Letter Queue (DLQ) on the Invalidation Lambda captures failures for inspection.

---

## Lambda Runtimes

All Lambdas written in **Go**, compiled for **Linux/ARM64 (Graviton2)**:

| Lambda | Handles | Purpose |
|---|---|---|
| `projects` | POST, PUT, DELETE | Input validation + sanitisation + DynamoDB write/update/delete. DELETE also removes `raw/<projectId>/` and `processed/<projectId>/` S3 objects via batch delete after DynamoDB record is removed. |
| `leaderboard` | POST (extensible) | Score validation + HMAC verification + DynamoDB PutItem |
| `image-upload-url` | POST | Generates pre-signed S3 PUT URL for raw upload |
| `image-processing` | S3 event trigger | WebP variant generation + S3 write + DynamoDB imageProcessed flag. **Memory: 1024MB, Timeout: 30s, Ephemeral storage: 512MB** — large images decompress to 30MB+ in memory, default 128MB will OOM. |
| `invalidation` | EventBridge trigger | CloudFront invalidation + cache warming + lastPublished update |
| `cleanup` | EventBridge weekly schedule | Lists all projectIds under `processed/` prefix, checks for corresponding DynamoDB record, deletes orphaned `processed/<projectId>/` objects older than 1 day |

**Why Go:**
- Compiled binary, no runtime initialisation — 50-150ms cold starts natively
- No SnapStart required
- ARM64/Graviton2 — lower cost per invocation
- Strong typing, small binary size

---

## Auth & Dashboard

- **Cognito User Pool** — sole user
- `/manager` static shell, all data fetched client-side
- Dashboard reads via authenticated GET endpoints
- Dashboard writes via authenticated POST/PUT/DELETE endpoints (Go Lambda → DynamoDB)
- No server-side middleware — Next.js middleware does not work in static export
- Route protection is client-side: `/manager` renders a full-screen spinner on mount while Amplify Auth checks for a valid session — if none found, redirects immediately to `/login`. Shell content never renders for unauthenticated users.
- `/login` and `/reset-password` are static pages that call Cognito directly from the client

**Auth library: Amplify Auth (`aws-amplify/auth`)**
- Handles token storage, silent refresh, and session management automatically
- Only imported in `/manager`, `/login`, `/reset-password` — Next.js code splitting ensures zero impact on public page bundles
- Cognito User Pool ID and Client ID exposed as `NEXT_PUBLIC_` env vars baked into the static build at deploy time — this is expected and safe, they are not secrets
- Actual security enforced at the API layer via Cognito JWT authoriser on API Gateway

**Frontend environment variables (SSM → build):**

All `NEXT_PUBLIC_` values consumed by the frontend are stored in SSM Parameter Store by `BackendStack`. The frontend build reads them before `next build` runs. For local dev, copy the values into `packages/frontend/.env.local` (gitignored).

| SSM Parameter | Frontend env var | Purpose |
|---|---|---|
| `/<account>-portfolio-user-pool-id-<stage>` | `NEXT_PUBLIC_USER_POOL_ID` | Cognito User Pool ID |
| `/<account>-portfolio-user-pool-client-id-<stage>` | `NEXT_PUBLIC_USER_POOL_CLIENT_ID` | Cognito App Client ID |

Values only change if the Cognito pool is recreated — effectively static once deployed.

---

## Public Dynamic Features

**GitHub tracker** — client calls GitHub public API directly, no backend. Response cached in `sessionStorage` with a 5 minute TTL to prevent hitting the 60 requests/hour unauthenticated rate limit during active browsing sessions. Implemented in a `useGithubActivity` hook.

**Minigame leaderboard:**
- GET → API Gateway VTL → DynamoDB, no cache, near-instant (~5-20ms)
- POST → Go Lambda (validation + HMAC check) → DynamoDB, cold start acceptable in post-game context (~50-150ms)

---

## Infrastructure (CDK)

**Stack layout — no circular dependencies:**

```
BackendStack      → no dependencies
CertificateStack  → no dependencies (deploys to us-east-1)
FrontendStack     → CertificateStack
```

`FrontendStack` consumes the ACM certificate from `CertificateStack` via `crossRegionReferences`. Neither stack references the other back.

`CertificateStack` is a dedicated stack whose sole responsibility is ACM certificate issuance. It must deploy to `us-east-1` because CloudFront requires certificates in that region regardless of the application's home region. Keeping it separate (rather than nested inside `FrontendStack`) is the conventional CDK pattern for this constraint and is more stable under redeployment.

**Stack responsibilities:**

| Stack | Region | Owns |
|---|---|---|
| `BackendStack` | app region | DynamoDB, Cognito, API Gateway, all Lambdas, EventBridge Pipe, DLQ, SSM |
| `CertificateStack` | `us-east-1` | ACM certificate (DNS validated against the Route 53 zone) |
| `FrontendStack` | app region | S3 bucket, CloudFront distribution, OAC, Route 53 alias record, site deployment |

**Project folder structure:**

```
/
├── packages/
│   ├── frontend/                        ← Next.js app
│   │   ├── pages/
│   │   ├── components/
│   │   └── ...
│   │
│   └── backend/
│       ├── bin/
│       │   └── app.ts                   ← CDK entry point
│       ├── lib/
│       │   ├── stacks/
│       │   │   ├── frontend-stack.ts      ← S3, CloudFront, Route53, site deployment
│       │   │   ├── backend-stack.ts       ← API Gateway, DynamoDB, Cognito, Lambdas, EventBridge
│       │   │   └── certificate-stack.ts   ← ACM certificate (us-east-1)
│       │   └── constructs/
│       │       ├── certificate-stack/
│       │       │   └── site-certificate.ts
│       │       ├── api-gateway.ts       ← API Gateway + all VTL/Lambda integrations
│       │       ├── database.ts          ← DynamoDB table, GSI, stream config
│       │       ├── auth.ts              ← Cognito User Pool + App Client
│       │       ├── image-pipeline.ts    ← S3 event, image processing Lambda
│       │       ├── invalidation-pipeline.ts ← EventBridge Pipe, invalidation Lambda, DLQ
│       │       └── cleanup.ts           ← EventBridge schedule, cleanup Lambda
│       ├── lambda/
│       │   ├── projects/
│       │   │   └── main.go              ← handles POST, PUT, DELETE
│       │   ├── leaderboard/
│       │   │   └── main.go              ← handles POST (extensible for other methods)
│       │   ├── image-upload-url/
│       │   │   └── main.go
│       │   ├── image-processing/
│       │   │   └── main.go
│       │   ├── invalidation/
│       │   │   └── main.go
│       │   └── cleanup/
│       │       └── main.go              ← orphaned S3 object cleanup
│       ├── vtl/
│       │   ├── projects-get-request.vtl
│       │   ├── projects-get-response.vtl
│       │   ├── projects-getbyid-request.vtl
│       │   ├── projects-getbyid-response.vtl
│       │   ├── leaderboard-get-request.vtl
│       │   └── leaderboard-get-response.vtl
│       └── cdk.json
│
├── package.json                         ← monorepo root (workspaces)
└── cdk.json
```

**CDK resource summary:**

| Resource | Purpose |
|---|---|
| S3 Bucket (single) | Static export (`static/`), raw uploads (`raw/`), processed images (`processed/`) |
| CloudFront Function (www redirect) | Viewer request redirect from `www.konarobinson.com` → `konarobinson.com` (prod only) |
| CloudFront Distribution | CDN, routing, caching, OAC for S3 |
| Route 53 | Custom domain |
| API Gateway REST API | All endpoints, VTL + Lambda integrations |
| DynamoDB — Single Table | All entities (projects, scores, meta), streams enabled |
| Cognito User Pool | Dashboard auth |
| EventBridge Pipe | DynamoDB Stream → Invalidation Lambda (PROJECT# filter) |
| projects Lambda (Go/ARM64) | POST/PUT/DELETE validation + DynamoDB writes |
| leaderboard Lambda (Go/ARM64) | Score validation + HMAC + DynamoDB write |
| image-upload-url Lambda (Go/ARM64) | Pre-signed S3 PUT URL generation |
| image-processing Lambda (Go/ARM64) | WebP variant generation + S3 write + DynamoDB flag |
| invalidation Lambda (Go/ARM64) | CloudFront invalidation + cache warming + lastPublished |
| cleanup Lambda (Go/ARM64) | Weekly orphaned S3 object cleanup |
| EventBridge Scheduler | Weekly trigger for cleanup Lambda |
| SQS DLQ | Invalidation Lambda failure capture |
| IAM Roles | API Gateway → DynamoDB, Lambda → S3 + CloudFront + DynamoDB |

---

## Cost

**~$0.50/month** (Route 53 hosted zone only). Everything else within permanent free tier at portfolio traffic levels.
