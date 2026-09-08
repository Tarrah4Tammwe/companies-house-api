import { isChConfigured } from "@/lib/ch-client";
import { corsPreflight, json } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ready = isChConfigured();
  return json({
    status: ready ? "ok" : "degraded",
    service: "Companies House Enrichment API",
    version: "1.2.0",
    ready,
    endpoints: [
      {
        method: "POST",
        path: "/api/enrich",
        description: "Full enrichment by company number. Supports include_pscs: true.",
      },
      {
        method: "GET",
        path: "/api/enrich?company_number=12345678",
        description: "Same as POST, via query string.",
      },
      {
        method: "GET",
        path: "/api/search?q=NAME&limit=5",
        description: "Search companies by name (max 20 results).",
      },
    ],
    timestamp: new Date().toISOString(),
  });
}

export async function OPTIONS() {
  return corsPreflight();
}
