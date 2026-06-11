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

export async function POST(req: NextRequest) {
  let body: { company_number?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawNumber = body.company_number?.toString().trim();
  if (!rawNumber) {
    return NextResponse.json({ error: "company_number is required." }, { status: 400 });
  }

  // Zero-pad to 8 digits (UK standard)
  const companyNumber = rawNumber.replace(/\s/g, "").toUpperCase().padStart(8, "0");

  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Config error." }, { status: 500 });
  }

  try {
    // Parallel: profile + officers + filing history
    const [profileRes, officersRes, filingRes] = await Promise.all([
      chFetch(`/company/${companyNumber}`, apiKey),
      chFetch(`/company/${companyNumber}/officers?items_per_page=10`, apiKey),
      chFetch(`/company/${companyNumber}/filing-history?items_per_page=5`, apiKey),
    ]);

    if (profileRes.status === 404) {
      return NextResponse.json({ error: "Company not found.", company_number: companyNumber }, { status: 404 });
    }

    if (!profileRes.ok) {
      return NextResponse.json({ error: "Companies House API error.", status: profileRes.status }, { status: 502 });
    }

    const profile = await profileRes.json();

    let officers: { name: string; role: string; appointed: string | null; resigned: boolean }[] = [];
    if (officersRes.ok) {
      const officersData = await officersRes.json();
      officers = (officersData.items || []).map((o: Record<string, unknown>) => ({
        name: o.name as string,
        role: o.officer_role as string,
        appointed: (o.appointed_on as string) || null,
        resigned: !!(o.resigned_on),
      }));
    }

    let recentFilings: { type: string; date: string; description: string }[] = [];
    if (filingRes.ok) {
      const filingData = await filingRes.json();
      recentFilings = (filingData.items || []).map((f: Record<string, unknown>) => ({
        type: f.type as string,
        date: f.date as string,
        description: (f.description as string) || "",
      }));
    }

    const addr = profile.registered_office_address || {};

    return NextResponse.json({
      company_number: companyNumber,
      company_name: profile.company_name || null,
      company_status: profile.company_status || null,
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
      },
      sic_codes: profile.sic_codes || [],
      accounts: profile.accounts
        ? {
            next_due: profile.accounts.next_due || null,
            last_made_up_to: profile.accounts.last_accounts?.made_up_to || null,
            overdue: profile.accounts.overdue || false,
          }
        : null,
      confirmation_statement: profile.confirmation_statement
        ? {
            next_due: profile.confirmation_statement.next_due || null,
            overdue: profile.confirmation_statement.overdue || false,
          }
        : null,
      officers: officers.filter((o) => !o.resigned),
      total_officers: officers.length,
      recent_filings: recentFilings,
      source: "companies_house",
    });
  } catch (err: unknown) {
    return NextResponse.json({
      error: "Failed to reach Companies House API.",
      detail: err instanceof Error ? err.message : "Unknown error",
    }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Use POST with { \"company_number\": \"12345678\" }" },
    { status: 405 }
  );
}
