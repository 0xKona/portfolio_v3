# Scripts Guide

Helper scripts live in `/scripts` (repo root). They are Python, run via [uv](https://docs.astral.sh/uv/) — dependencies are declared inline, so no virtualenv setup is needed. `uv` fetches them on first run.

Each script resolves the AWS account automatically (via STS) and targets a stage/region from environment variables:

| Var | Default |
|---|---|
| `STAGE` | `test` |
| `AWS_REGION` | `eu-west-2` |

The npm wrappers in the root `package.json` set `STAGE` for you.

---

## set-hmac-secret

Sets the leaderboard HMAC secret in SSM Parameter Store (`/<account>-portfolio-hmac-secret-<stage>`).

The CDK creates this parameter with a `CHANGE_ME` placeholder on first deploy. Run this to set a real value. The Lambda reads from SSM at cold start, so **no redeploy is needed** — the next invocation after a cold start picks up the new value automatically.

```bash
# Generate a random 32-byte hex secret
npm run set-hmac-secret:test
npm run set-hmac-secret:prod

# Or pass your own value (must match what the game client signs with)
STAGE=test uv run scripts/set-hmac-secret.py "my-shared-secret"
```

> Until a real secret is set, the Lambda **skips** signature verification (the placeholder triggers no-op mode). Set it before relying on leaderboard anti-tamper.

---

## sync-env-local

Pulls the frontend's `NEXT_PUBLIC_*` values from SSM and writes `packages/frontend/.env.local` (gitignored).

```bash
npm run sync-env:test
npm run sync-env:prod

# Or directly
STAGE=test uv run scripts/sync-env-local.py
```

Produces:

```
NEXT_PUBLIC_USER_POOL_ID=eu-west-2_xxxxxxxxx
NEXT_PUBLIC_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_HMAC_SECRET=<hex>
```

Run this after deploying (so the Cognito parameters exist) and after `set-hmac-secret` (so the game client and the Lambda share the same secret). Missing parameters are written as commented-out lines with a warning rather than failing.

| SSM parameter | Env var |
|---|---|
| `/<account>-portfolio-user-pool-id-<stage>` | `NEXT_PUBLIC_USER_POOL_ID` |
| `/<account>-portfolio-user-pool-client-id-<stage>` | `NEXT_PUBLIC_USER_POOL_CLIENT_ID` |
| `/<account>-portfolio-hmac-secret-<stage>` | `NEXT_PUBLIC_HMAC_SECRET` |

---

## Typical workflow

```bash
# 1. Deploy
npm run deploy:test

# 2. Set a real HMAC secret (no redeploy needed — Lambda reads from SSM at cold start)
npm run set-hmac-secret:test

# 3. Pull env vars for local frontend dev
npm run sync-env:test
```
