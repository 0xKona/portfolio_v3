const HMAC_SECRET = process.env.NEXT_PUBLIC_HMAC_SECRET ?? "";

export async function signScore(payload: {
  playerName: string;
  score: string;
  multiplier: string;
  finalScore: string;
}): Promise<string> {
  const message = `${payload.playerName}|${payload.score}|${payload.multiplier}|${payload.finalScore}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(HMAC_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );

  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
