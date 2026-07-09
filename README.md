# Portfolio Website

Terminal-themed portfolio site, with a retro terminal aesthetic, project showcase, mini-game, and authenticated admin panel.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (static export), React 19, TypeScript, Tailwind CSS 4, JetBrains Mono, react-icons, embla-carousel |
| **Backend** | AWS CDK v2 (TypeScript), DynamoDB, Cognito, API Gateway REST + VTL, Lambda (TypeScript + Go), S3, CloudFront, EventBridge Pipes, ACM |
| **Infra** | S3 static hosting with OAC, CloudFront Functions (URI rewrites), multi-stage SSM parameters, S3 lifecycle rules |

## Architecture

```
┌─────────────┐     ┌──────────────────────────────────────────────┐
│  Browser     │───▶│  CloudFront (CDN)                            │
│  konarobinson│    │  ├─ /static/*        → S3 (Next.js export)   │
│  .com        │    │  ├─ /images/*        → S3 processed/         │
│              │    │  ├─ /api/*           → API Gateway           │
│              │    │  └─ CF Functions     → URI rewrites          │
└──────────────┘    └──────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
            ┌──────────────┐   ┌──────────────────┐
            │  API Gateway  │   │  S3 (processed/) │
            │  REST + VTL   │   │  (images)        │
            └──────┬───────┘   └──────────────────┘
                   │
         ┌─────────┼──────────┐
         ▼         ▼          ▼
   ┌─────────┐ ┌────────┐ ┌───────────┐
   │ DynamoDB │ │Cognito │ │ Lambda    │
   │(projects,│ │(auth)  │ │(image     │
   │ leader-  │ │        │ │ process,  │
   │ board)   │ │        │ │ cleanup,  │
   └─────────┘ └────────┘ │ invalid.,  │
                          │ leader-    │
                          │ board)     │
                          └───────────┘
```

The frontend is statically exported via `next build` and served from S3 through CloudFront. The API is powered by API Gateway backed by DynamoDB via VTL templates, with Lambda functions for non-trivial operations (image processing, cache invalidation, cleanup). Auth is handled by Cognito with the user pool config served as a runtime `config.json`.

## Packages

| Package | Description |
|---|---|
| `packages/frontend` | Next.js 16 app — terminal-themed portfolio, project showcase, mini-game, admin panel |
| `packages/backend` | AWS CDK stacks — DynamoDB, Cognito, API Gateway, Lambda, S3 + CloudFront deployment |

## Frontend Features

- Terminal-themed UI with custom command interface and retro aesthetic
- Project showcase with image carousels and filtering
- Mini-game with leaderboard (HMAC-signed scores)
- Authenticated admin panel for project CRUD and skill management
- Pixel-art iconography via `@hackernoon/pixel-icon-library`

## Deploy Stages

The CDK app supports two stages via the `stage` context variable:

| Stage | Domain | Description |
|---|---|---|
| `test` | `v3-test.konarobinson.com` | Staging / preview |
| `prod` | `konarobinson.com` | Production |

ACM certificates are provisioned in `us-east-1` (required by CloudFront) and referenced cross-region.

## Scripts

```sh
npm run dev              # Local dev server (Next.js)
npm run build            # Static export
npm run lint             # ESLint

# CDK
npm run synth            # cdk synth
npm run diff             # cdk diff
npm run deploy:test      # Full deploy → test stage
npm run deploy:prod      # Full deploy → prod stage
npm run deploy:frontend:test   # Frontend-only deploy → test
npm run deploy:frontend:prod   # Frontend-only deploy → prod
npm run destroy:test     # Teardown test stage
npm run destroy:prod     # Teardown prod stage

# Scripts (require Python + uv)
npm run set-hmac-secret:<stage>  # Set leaderboard HMAC secret
npm run sync-env:<stage>         # Sync SSM params to .env.local
```

## Local Dev Requirements

- Node.js
- AWS CLI with credentials for the target account
- CDK bootstrapped in the target account/region
- Python 3 + `uv` (for deployment scripts)
