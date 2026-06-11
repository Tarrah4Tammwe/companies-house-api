import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Companies House Enrichment API",
    version: "1.0.0",
    endpoints: [
      { method: "POST", path: "/api/enrich", description: "Full company enrichment by company number" },
      { method: "GET", path: "/api/search?q=NAME&limit=5", description: "Search companies by name" },
    ],
    timestamp: new Date().toISOString(),
  });
}
