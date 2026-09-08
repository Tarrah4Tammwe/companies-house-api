const CH_BASE = "https://api.company-information.service.gov.uk";
const FETCH_TIMEOUT_MS = 8000;

export function isChConfigured(): boolean {
  return Boolean(process.env.COMPANIES_HOUSE_API_KEY);
}

export function isSafeUpstreamPath(path: string): boolean {
  return path.startsWith("/") && !path.includes("..") && !path.includes("://");
}

export function getApiKey(): string | null {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  return key && key.trim() ? key : null;
}

export async function chFetch(path: string, apiKey: string): Promise<Response> {
  if (!isSafeUpstreamPath(path)) {
    throw new Error("Invalid upstream path.");
  }
  const credentials = Buffer.from(`${apiKey}:`).toString("base64");
  return fetch(`${CH_BASE}${path}`, {
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
    },
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
}

export function retryAfterHeader(res: Response | undefined): string {
  return res?.headers.get("retry-after") || "60";
}
