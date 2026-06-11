import { NextResponse } from "next/server";

export async function GET() {
  const configured = !!process.env.COMPANIES_HOUSE_API_KEY;
  return NextResponse.json({
    status: configured ? "ok" : "degraded",
    service: "Companies House Enrichment API",
    version: "1.1.0",
    credentials_configured: configured,
    endpoints: [
      { method: "POST", path: "/api/enrich", description: "Full enrichment by company number. Supports include_pscs: true." },
      { method: "GET",  path: "/api/search?q=NAME&limit=5", description: "Search companies by name (max 20 results)." },
    ],
    timestamp: new Date().toISOString(),
  });
}
