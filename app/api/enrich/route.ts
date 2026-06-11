import { NextRequest, NextResponse } from "next/server";

const CH_BASE = "https://api.company-information.service.gov.uk";

function getApiKey(): string {
  const key = process.env.COMPANIES_HOUSE_API_KEY;
  if (!key) throw new Error("COMPANIES_HOUSE_API_KEY environment variable is not set.");
  return key;
}

function chFetch(path: string, apiKey: string) {
  const credentials = Buffer.from(`${apiKey}:`).toString("base64");
  return fetch(`${CH_BASE}${path}`, {
    headers: { Authorization: `Basic ${credentials}`, Accept: "application/json" },
  });
}

// Normalise to 8-char zero-padded company number
// Handles: "1234567" → "01234567", "OC123456" → "OC123456", "SC123456" → "SC123456"
function normaliseCompanyNumber(raw: string): string {
  const cleaned = raw.replace(/\s/g, "").toUpperCase();
  // Alpha-prefix companies (SC, NI, OC, SO, NC, NF, R, IP, SP, RS, IC, etc.)
  if (/^[A-Z]{1,2}\d+$/.test(cleaned)) {
    const match = cleaned.match(/^([A-Z]{1,2})(\d+)$/);
    if (match) {
      return match[1] + match[2].padStart(8 - match[1].length, "0");
    }
  }
  // Pure numeric — pad to 8
  return cleaned.padStart(8, "0");
}

export async function POST(req: NextRequest) {
  let body: { company_number?: string; include_pscs?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawNumber = body.company_number?.toString().trim();
  if (!rawNumber) {
    return NextResponse.json({ error: "company_number is required." }, { status: 400 });
  }

  const companyNumber = normaliseCompanyNumber(rawNumber);
  const includePscs = body.include_pscs === true;

  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Config error." },
      { status: 500 }
    );
  }

  try {
    // Build parallel requests — always fetch profile + officers + filings
    // Optionally fetch PSCs
    const requests: Promise<Response>[] = [
      chFetch(`/company/${companyNumber}`, apiKey),
      chFetch(`/company/${companyNumber}/officers?items_per_page=10&register_view=false`, apiKey),
      chFetch(`/company/${companyNumber}/filing-history?items_per_page=5`, apiKey),
    ];
    if (includePscs) {
      requests.push(chFetch(`/company/${companyNumber}/persons-with-significant-control?items_per_page=10`, apiKey));
    }

    const responses = await Promise.all(requests);
    const [profileRes, officersRes, filingRes, pscRes] = responses;

    // Handle 404 and 429 on profile (most critical)
    if (profileRes.status === 404) {
      return NextResponse.json(
        { error: "Company not found.", company_number: companyNumber },
        { status: 404 }
      );
    }
    if (profileRes.status === 429) {
      return NextResponse.json(
        { error: "Companies House rate limit reached. Please retry after a moment." },
        { status: 429 }
      );
    }
    if (!profileRes.ok) {
      return NextResponse.json(
        { error: "Companies House API error.", ch_status: profileRes.status },
        { status: 502 }
      );
    }

    const profile = await profileRes.json();

    // Active officers only
    let activeOfficers: { name: string; role: string; appointed: string | null; nationality: string | null }[] = [];
    let totalOfficers = 0;
    if (officersRes.ok) {
      const officersData = await officersRes.json();
      totalOfficers = officersData.total_results || 0;
      activeOfficers = (officersData.items || [])
        .filter((o: Record<string, unknown>) => !o.resigned_on)
        .map((o: Record<string, unknown>) => ({
          name: o.name as string,
          role: o.officer_role as string,
          appointed: (o.appointed_on as string) || null,
          nationality: (o.nationality as string) || null,
        }));
    }

    // 5 most recent filings
    let recentFilings: { type: string; date: string; description: string; category: string }[] = [];
    if (filingRes.ok) {
      const filingData = await filingRes.json();
      recentFilings = (filingData.items || []).map((f: Record<string, unknown>) => ({
        type: f.type as string,
        date: f.date as string,
        description: (f.description as string) || "",
        category: (f.category as string) || "",
      }));
    }

    // PSCs (optional)
    let pscs: { name: string; kind: string; nature_of_control: string[]; notified_on: string | null }[] = [];
    if (includePscs && pscRes && pscRes.ok) {
      const pscData = await pscRes.json();
      pscs = (pscData.items || [])
        .filter((p: Record<string, unknown>) => !p.ceased_on)
        .map((p: Record<string, unknown>) => ({
          name: (p.name as string) || "Unknown",
          kind: (p.kind as string) || "",
          nature_of_control: (p.natures_of_control as string[]) || [],
          notified_on: (p.notified_on as string) || null,
        }));
    }

    // Registered address
    const addr = profile.registered_office_address || {};

    // Accounts — CH profile has two shapes depending on API version/company type
    // next_accounts.due_on is the correct field in live API
    const accountsObj = profile.accounts || null;
    const accounts = accountsObj
      ? {
          next_due:
            accountsObj.next_accounts?.due_on ||  // live API shape
            accountsObj.next_due ||               // fallback (some responses)
            null,
          last_made_up_to:
            accountsObj.last_accounts?.period_end_on ||
            accountsObj.last_accounts?.made_up_to ||
            null,
          account_type: accountsObj.last_accounts?.type || null,
          overdue: accountsObj.overdue || accountsObj.next_accounts?.overdue || false,
        }
      : null;

    // Confirmation statement
    const csObj = profile.confirmation_statement || null;
    const confirmationStatement = csObj
      ? {
          next_due: csObj.next_due || null,
          overdue: csObj.overdue || false,
        }
      : null;

    return NextResponse.json({
      company_number: companyNumber,
      company_name: profile.company_name || null,
      // CH returns company_status; "status" is an alias in older docs — handle both
      company_status: profile.company_status || profile.status || null,
      company_type: profile.type || null,
      incorporated_on: profile.date_of_creation || null,
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
      source: "companies_house",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: "Failed to reach Companies House API.",
        detail: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Method not allowed.",
      hint: 'POST { "company_number": "12345678" } — optionally include "include_pscs": true for persons with significant control.',
    },
    { status: 405 }
  );
}
