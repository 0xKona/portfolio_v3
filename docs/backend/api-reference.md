# API Reference

REST API for portfolio_v3. Public reads are unauthenticated; writes require a Cognito JWT (except the leaderboard, which is HMAC-verified instead).

## Base URL

All API calls are same-origin through CloudFront:

```
https://v3-test.konarobinson.com/api/projects
https://v3-test.konarobinson.com/api/leaderboard
```

No CORS configuration needed — the frontend and API share the same domain.

## Authentication

Protected endpoints use a **Cognito User Pool JWT**. Send the ID token in the `Authorization` header:

```
Authorization: <id-token>
```

Obtain the token client-side via Amplify Auth / Cognito SRP against the User Pool. Missing or invalid tokens return `401`.

## Conventions

- All request and response bodies are JSON.
- Timestamps are ISO 8601 UTC strings (`2026-07-03T18:22:30Z`).
- Validation failures return `400` with `{ "message": "validation failed", "errors": [...] }`.
- `id` fields are UUID v4, client-generated for projects.

---

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/projects` | none | List published projects |
| GET | `/api/projects/{id}` | none | Get one project |
| POST | `/api/projects` | Cognito | Create a project |
| PUT | `/api/projects/{id}` | Cognito | Update a project |
| DELETE | `/api/projects/{id}` | Cognito | Delete a project |
| GET | `/api/leaderboard` | none | List scores (newest first) |
| POST | `/api/leaderboard` | HMAC | Submit a score |
| POST | `/api/images/upload-url` | Cognito | Get a presigned image upload URL |
| GET | `/api/images/status/{projectId}` | Cognito | Poll image processing status |

---

## Project object

```jsonc
{
  "id": "11111111-aaaa-bbbb-cccc-dddddddddddd", // UUID v4, immutable
  "name": "My Project",
  "desc": "Optional description",              // string | null
  "skills": ["Go", "React"],                    // string[]
  "githubUrl": "https://github.com/...",        // string | null
  "demoUrl": "https://...",                     // string | null
  "isFeatured": false,                          // boolean
  "status": "published",                        // "published" | "draft"
  "createdAt": "2026-07-03T18:22:30Z",          // immutable
  "updatedAt": "2026-07-03T18:22:30Z"
}
```

Notes:
- **Public GETs only return `status: "published"` projects.** Drafts are filtered out server-side.
- **Featured** projects (published + `isFeatured: true`) are indexed separately for a "featured" query.
- Images are **not** in the project object. Build image URLs from the `id` (see [Images](#images)).

### GET /api/projects

Returns published projects as a JSON array, newest first.

```
200 OK
[ { ...project }, { ...project } ]
```

### GET /api/projects/{id}

```
200 OK    { ...project }
404       { "message": "Project not found" }
```

Returns the project regardless of status when fetched by ID. (Public listing filters drafts; direct-by-ID does not — don't link draft IDs publicly.)

### POST /api/projects  🔒 Cognito

Request:

```jsonc
{
  "id": "11111111-aaaa-bbbb-cccc-dddddddddddd", // required, UUID v4
  "name": "My Project",                          // required
  "skills": ["Go"],                              // required, non-empty
  "desc": "…",                                   // optional
  "githubUrl": "…",                              // optional
  "demoUrl": "…"                                 // optional
}
```

New projects are created with `status: "draft"` and `isFeatured: false`. Use `PUT` to publish.

```
201 Created    { ...project }
400            { "message": "validation failed", "errors": [...] }
409            project with this id already exists
401            missing/invalid token
```

### PUT /api/projects/{id}  🔒 Cognito

Partial update — include only the fields you want to change. Any field omitted (or `null`) is left unchanged.

```jsonc
{
  "name": "…",
  "desc": "…",
  "skills": ["Go", "TypeScript"],
  "githubUrl": "…",
  "demoUrl": "…",
  "isFeatured": true,
  "status": "published"
}
```

```
200 OK    { ...project }
404       project not found
401       missing/invalid token
```

### DELETE /api/projects/{id}  🔒 Cognito

```
204 No Content
404            project not found
401            missing/invalid token
```

Deletes the record. Orphaned S3 images are swept by the weekly cleanup job.

---

## Leaderboard

### Score object

```jsonc
{
  "id": "…",              // UUID, server-generated
  "playerName": "Ada",    // alphanumeric, ≤ 20 chars
  "score": "1200",        // string
  "multiplier": "2",      // string
  "finalScore": "2400",   // string
  "game": null,           // string | null (future multi-game support)
  "createdAt": "…",
  "updatedAt": "…"
}
```

Score numeric fields are stored and returned as **strings**.

### GET /api/leaderboard

```
200 OK
[ { ...score }, ... ]   // newest first
```

### POST /api/leaderboard  🔒 HMAC

Public endpoint (no Cognito), protected by an HMAC-SHA256 signature to deter forged submissions.

Request:

```jsonc
{
  "playerName": "Ada",     // required, alphanumeric, ≤ 20 chars
  "score": "1200",         // required
  "multiplier": "2",       // required
  "finalScore": "2400",    // required
  "game": "snake",         // optional
  "signature": "<hex>"     // required — see below
}
```

**Signature** — HMAC-SHA256 over a `|`-joined message, hex-encoded, keyed with the shared secret:

```
message = `${playerName}|${score}|${multiplier}|${finalScore}`
signature = hex( HMAC_SHA256(key = HMAC_SECRET, message) )
```

The `HMAC_SECRET` is distributed to the game client as `NEXT_PUBLIC_HMAC_SECRET` (see [scripts.md](./scripts.md)). Because it ships in the client bundle, this is an anti-tamper deterrent, not a cryptographic boundary.

Reference (TypeScript, Web Crypto):

```ts
async function sign(payload: {
  playerName: string; score: string; multiplier: string; finalScore: string;
}, secret: string): Promise<string> {
  const message = `${payload.playerName}|${payload.score}|${payload.multiplier}|${payload.finalScore}`;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}
```

```
201 Created    { ...score }
400            validation failed
403            { "message": "invalid signature" }
```

> If `HMAC_SECRET` is unset on the Lambda (e.g. left as the deploy placeholder), signature verification is **skipped**. Set a real secret before relying on it — see [scripts.md](./scripts.md).

---

## Images

Image upload is a two-step, direct-to-S3 flow. The `projectId` is known up front, so upload and project creation can happen in any order.

```
1. POST /api/images/upload-url   → returns a presigned S3 PUT URL
2. PUT <uploadUrl>  (raw image bytes, direct to S3)
3. S3 event triggers processing → JPEG variants written to processed/
4. Poll GET /api/images/status/{projectId} until imageProcessed: true
```

### POST /api/images/upload-url  🔒 Cognito

Request:

```jsonc
{
  "projectId": "…",        // required, UUID v4, must exist
  "fileExtension": "png"   // required: jpg | jpeg | png | webp | gif
}
```

```
200 OK
{
  "uploadUrl": "https://…s3…?X-Amz-Signature=…",  // presigned PUT, 5 min expiry
  "projectId": "…",
  "key": "raw/<projectId>/original.png"
}
404    project not found
400    validation failed
401    missing/invalid token
```

Requesting a URL sets `imageProcessed: false` on the project (resets state for re-uploads).

**Uploading:** `PUT` the raw bytes to `uploadUrl` with header `Content-Type: <mime>`. The browser request is a cross-origin PUT; S3 CORS allows `PUT` from the site origin.

### GET /api/images/status/{projectId}  🔒 Cognito

Poll until processing finishes.

```
200 OK    { "projectId": "…", "imageProcessed": true }
404       { "message": "Project not found" }
```

### Processed image URLs

After processing, three JPEG variants exist under `processed/<projectId>/`:

| Variant | Max width | Quality |
|---|---|---|
| `thumbnail.jpg` | 400px | 80 |
| `optimised.jpg` | 1200px | 90 |
| `original.jpg` | full | 95 |

Once CloudFront `/images/*` routing is in place, reference them same-origin:

```
/images/<projectId>/thumbnail.jpg
/images/<projectId>/optimised.jpg
/images/<projectId>/original.jpg
```

Handle a missing image gracefully client-side (a project may have no image, or processing may be in progress).
