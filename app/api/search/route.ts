import { NextRequest } from "next/server";
import { unauthorizedIfLocked } from "@/lib/auth";
import { chFetch, getApiKey, retryAfterHeader } from "@/lib/ch-client";
import { parseLimit, sanitiseSearchQuery } from "@/lib/coerce";
import { corsPreflight, json, jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const locked = unauthorizedIfLocked(req);
  if (locked) return locked;

  const { searchParams } = new URL(req.url);
  const query = sanitiseSearchQuery(searchParams.get("q"));
  const limit = parseLimit(searchParams.get("limit"), 5, 20);

  if (!query) {
    return jsonError("q (search query) parameter is required.", 400);
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return jsonError("Service is not configured.", 503);
  }

  try {
    const res = await chFetch(
      `/search/companies?q=${encodeURIComponent(query)}&items_per_page=${limit}`,
      apiKey
    );

    if (res.status === 429) {
      return jsonError("Rate limit reached. Please retry shortly.", 429, {
        "Retry-After": retryAfterHeader(res),
      });
    }
    if (res.status === 401) {
      return jsonError("Service unavailable.", 503);
    }
    if (!res.ok) {
      return jsonError("Unable to search companies.", 502);
    }

    const data = await res.json();

    const results = (data.items || []).map((item: Record<string, unknown>) => {
      const addr = (item.address as Record<string, unknown>) || {};
      return {
        company_number: item.company_number,
        company_name: item.title,
        company_status: item.company_status,
        company_type: item.company_type,
        incorporated_on: item.date_of_creation,
        address_snippet: item.address_snippet || null,
        registered_address: {
          line1: addr.address_line_1 || null,
          locality: addr.locality || null,
          postcode: addr.postal_code || null,
        },
      };
    });

    return json({
      query,
      total_results: data.total_results || results.length,
      returned: results.length,
      results,
    });
  } catch {
    return jsonError("Unable to search companies.", 502);
  }
}

export async function OPTIONS() {
  return corsPreflight();
}
