import { NextRequest, NextResponse } from "next/server";

const CH_BASE = "https://api.company-information.service.gov.uk";

function getApiKey(): string {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key) throw new Error("COMPANIES_HOUSE_API_KEY environment variable is not set.");
  return key;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "5"), 20);

  if (!query) {
    return NextResponse.json({ error: "q (search query) parameter is required." }, { status: 400 });
  }

  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Config error." }, { status: 500 });
  }

  const credentials = Buffer.from(`${apiKey}:`).toString("base64");

  try {
    const res = await fetch(
      `${CH_BASE}/search/companies?q=${encodeURIComponent(query)}&items_per_page=${limit}`,
      {
        headers: { Authorization: `Basic ${credentials}`, Accept: "application/json" },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Companies House search error.", status: res.status }, { status: 502 });
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

    return NextResponse.json({
      query,
      total_results: data.total_results || results.length,
      returned: results.length,
      results,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      error: "Failed to reach Companies House API.",
      detail: err instanceof Error ? err.message : "Unknown error",
    }, { status: 502 });
  }
}
