/** Marketplace clients often send booleans as strings ("true" / "1"). */
export function coerceBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes";
  }
  return false;
}

export function parseLimit(
  raw: string | null | undefined,
  fallback = 5,
  max = 20
): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, max);
}

const MAX_SEARCH_QUERY = 160;

export function sanitiseSearchQuery(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const query = raw.trim();
  if (!query || query.length > MAX_SEARCH_QUERY) return null;
  if (/[\u0000-\u001F\u007F]/.test(query)) return null;
  return query;
}

export function readParam(
  body: Record<string, unknown> | null,
  searchParams: URLSearchParams,
  key: string
): unknown {
  if (body && body[key] !== undefined && body[key] !== null && body[key] !== "") {
    return body[key];
  }
  return searchParams.get(key);
}
