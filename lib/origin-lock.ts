import { timingSafeEqual } from "crypto";

function secretsEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function firstHeader(headers: HeaderReader, names: string[]): string | null {
  for (const name of names) {
    const value = headers.get(name);
    if (value) return value;
  }
  return null;
}

export type HeaderReader = { get(name: string): string | null };

/**
 * Optional origin lock. Unset env vars keep RapidAPI/Zyla traffic working.
 * When a secret is configured, direct hits to the origin are rejected.
 *
 * - API_PROXY_SECRET / RAPIDAPI_PROXY_SECRET → X-RapidAPI-Proxy-Secret
 * - API_ACCESS_KEY → X-Api-Key or Bearer token
 */
export function isAuthorized(headers: HeaderReader): boolean {
  const proxySecret =
    process.env.API_PROXY_SECRET || process.env.RAPIDAPI_PROXY_SECRET;
  const accessKey = process.env.API_ACCESS_KEY;

  if (!proxySecret && !accessKey) return true;

  if (proxySecret) {
    const provided = firstHeader(headers, [
      "x-rapidapi-proxy-secret",
      "x-api-proxy-secret",
    ]);
    if (provided && secretsEqual(provided, proxySecret)) return true;
  }

  if (accessKey) {
    const headerKey = firstHeader(headers, [
      "x-api-key",
      "x-zyla-api-key",
    ]);
    const bearer = headers.get("authorization");
    const token = bearer?.toLowerCase().startsWith("bearer ")
      ? bearer.slice(7).trim()
      : null;
    if (headerKey && secretsEqual(headerKey, accessKey)) return true;
    if (token && secretsEqual(token, accessKey)) return true;
  }

  return false;
}
