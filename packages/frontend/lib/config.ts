/**
 * Runtime configuration loader.
 *
 * In production (deployed to S3/CloudFront), fetches /config.json which is
 * deployed by CDK with resolved backend values (Cognito pool ID, client ID).
 *
 * In local dev, /config.json doesn't exist (404 from the Next.js dev server),
 * so it falls back to NEXT_PUBLIC_* env vars from .env.local.
 *
 * This pattern means the frontend build output is environment-agnostic —
 * the same bundle works for test and prod, only config.json differs.
 */

export interface AppConfig {
  userPoolId: string;
  userPoolClientId: string;
}

let cachedConfig: AppConfig | null = null;

export async function getConfig(): Promise<AppConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    const res = await fetch("/config.json");
    if (res.ok) {
      const json = await res.json();
      cachedConfig = {
        userPoolId: json.userPoolId,
        userPoolClientId: json.userPoolClientId,
      };
      return cachedConfig;
    }
  } catch {
    // fetch failed (e.g. SSR context, network error) — fall through to env vars
  }

  // Fallback: local dev reads from .env.local via NEXT_PUBLIC_* vars
  cachedConfig = {
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID ?? "",
    userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ?? "",
  };
  return cachedConfig;
}
