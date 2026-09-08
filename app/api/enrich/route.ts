import { NextRequest } from "next/server";
import { unauthorizedIfLocked } from "@/lib/auth";
import { chFetch, getApiKey, retryAfterHeader } from "@/lib/ch-client";
import { coerceBoolean, readParam } from "@/lib/coerce";
import { normaliseCompanyNumber } from "@/lib/company-number";
import { resolveFilingDescription } from "@/lib/filings";
import { corsPreflight, json, jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Officer = {
  name: string;
  role: string;
  appointed: string | null;
  nationality: string | null;
};

type Filing = {
  type: string;
  date: string;
  description: string;
  category: string;
};

type Psc = {
  name: string;
  kind: string;
  nature_of_control: string[];
  notified_on: string | null;
};

async function readBody(req: NextRequest): Promise<Record<string, unknown> | null> {
  if (req.method === "GET") return {};
  try {
    const text = await req.text();
    if (!text.trim()) return {};
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function handleEnrich(req: NextRequest) {
  const locked = unauthorizedIfLocked(req);
  if (locked) return locked;

  const body = await readBody(req);
  if (body === null) {
    return jsonError("Invalid JSON body.", 400);
  }

  const searchParams = new URL(req.url).searchParams;
  const rawNumber = readParam(body, searchParams, "company_number");
  const rawText = rawNumber == null ? "" : String(rawNumber).trim();

  if (!rawText) {
    return jsonError("company_number is required.", 400);
  }

  const companyNumber = normaliseCompanyNumber(rawText);
  if (!companyNumber) {
    return jsonError("Invalid company_number.", 400);
  }

  const includePscs = coerceBoolean(readParam(body, searchParams, "include_pscs"));

  const apiKey = getApiKey();
  if (!apiKey) {
    return jsonError("Service is not configured.", 503);
  }

  try {
    const requests: Promise<Response>[] = [
      chFetch(`/company/${companyNumber}`, apiKey),
      chFetch(
        `/company/${companyNumber}/officers?items_per_page=100&start_index=0&register_view=false`,
        apiKey
      ),
      chFetch(`/company/${companyNumber}/filing-history?items_per_page=5`, apiKey),
    ];
    if (includePscs) {
      requests.push(
        chFetch(
          `/company/${companyNumber}/persons-with-significant-control?items_per_page=100`,
          apiKey
        )
      );
    }

    const responses = await Promise.all(requests);
    const [profileRes, officersRes, filingRes, pscRes] = responses;

    if (responses.some((r) => r.status === 429)) {
      const limited = responses.find((r) => r.status === 429);
      return jsonError("Rate limit reached. Please retry shortly.", 429, {
        "Retry-After": retryAfterHeader(limited),
      });
    }

    if (profileRes.status === 404) {
      return json({ error: "Company not found.", company_number: companyNumber }, 404);
    }
    if (profileRes.status === 401) {
      return jsonError("Service unavailable.", 503);
    }
    if (!profileRes.ok) {
      return jsonError("Unable to fetch company data.", 502);
    }

    const profile = await profileRes.json();

    // 404 on a sub-resource is a genuine empty set. Any other failure must not
    // look like a complete KYB payload with officers/filings/PSCs missing.
    if (!officersRes.ok && officersRes.status !== 404) {
      return jsonError("Unable to fetch company data.", 502);
    }
    if (!filingRes.ok && filingRes.status !== 404) {
      return jsonError("Unable to fetch company data.", 502);
    }
    if (includePscs && pscRes && !pscRes.ok && pscRes.status !== 404) {
      return jsonError("Unable to fetch company data.", 502);
    }

    let activeOfficers: Officer[] = [];
    let totalOfficers = 0;
    if (officersRes.ok) {
      const officersData = await officersRes.json();
      totalOfficers = officersData.total_results || 0;
      activeOfficers = (officersData.items || [])
        .filter((o: Record<string, unknown>) => !o.resigned_on)
        .map((o: Record<string, unknown>) => ({
          name: (o.name as string) || "",
          role: (o.officer_role as string) || "",
          appointed: (o.appointed_on as string) || null,
          nationality: (o.nationality as string) || null,
        }));
    }

    let recentFilings: Filing[] = [];
    if (filingRes.ok) {
      const filingData = await filingRes.json();
      recentFilings = (filingData.items || []).map((f: Record<string, unknown>) => ({
        type: (f.type as string) || "",
        date: (f.date as string) || "",
        description: resolveFilingDescription(
          (f.description as string) || "",
          f.description_values,
          (f.type as string) || ""
        ),
        category: (f.category as string) || "",
      }));
    }

    let pscs: Psc[] = [];
    if (includePscs && pscRes && pscRes.ok) {
      const pscData = await pscRes.json();
      pscs = (pscData.items || [])
        .filter((p: Record<string, unknown>) => !p.ceased_on)
        .map((p: Record<string, unknown>) => ({
          name: (p.name as string) || "Unknown",
          kind: (p.kind as string) || "",
          nature_of_control: Array.isArray(p.natures_of_control)
            ? (p.natures_of_control as string[])
            : [],
          notified_on: (p.notified_on as string) || null,
        }));
    }

    const addr = profile.registered_office_address || {};
    const accountsObj = profile.accounts || null;
    const accounts = accountsObj
      ? {
          next_due:
            accountsObj.next_accounts?.due_on || accountsObj.next_due || null,
          last_made_up_to:
            accountsObj.last_accounts?.period_end_on ||
            accountsObj.last_accounts?.made_up_to ||
            null,
          account_type: accountsObj.last_accounts?.type || null,
          overdue: accountsObj.overdue || accountsObj.next_accounts?.overdue || false,
        }
      : null;

    const csObj = profile.confirmation_statement || null;
    const confirmationStatement = csObj
      ? {
          next_due: csObj.next_due || null,
          last_made_up_to: csObj.last_made_up_to || null,
          overdue: csObj.overdue || false,
        }
      : null;

    return json({
      company_number: companyNumber,
      company_name: profile.company_name || null,
      company_status: profile.company_status || profile.status || null,
      company_type: profile.type || null,
      incorporated_on: profile.date_of_creation || null,
      dissolved_on: profile.date_of_cessation || null,
      jurisdiction: profile.jurisdiction || null,
      registered_address: {
        line1: addr.address_line_1 || null,
        line2: addr.address_line_2 || null,
        locality: addr.locality || null,
        region: addr.region || null,
        postcode: addr.postal_code || null,
        country: addr.country || null,
        care_of: addr.care_of || null,
        po_box: addr.po_box || null,
      },
      sic_codes: profile.sic_codes || [],
      has_been_liquidated: profile.has_been_liquidated ?? null,
      has_insolvency_history: profile.has_insolvency_history ?? null,
      has_charges: profile.has_charges ?? null,
      registered_office_is_in_dispute: profile.registered_office_is_in_dispute ?? false,
      accounts,
      confirmation_statement: confirmationStatement,
      active_officers: activeOfficers,
      total_officers: totalOfficers,
      recent_filings: recentFilings,
      ...(includePscs && { persons_with_significant_control: pscs }),
    });
  } catch {
    return jsonError("Unable to fetch company data.", 502);
  }
}

export async function POST(req: NextRequest) {
  return handleEnrich(req);
}

export async function GET(req: NextRequest) {
  return handleEnrich(req);
}

export async function OPTIONS() {
  return corsPreflight();
}
