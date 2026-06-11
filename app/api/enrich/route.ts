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
function normaliseCompanyNumber(raw: string): string {
  const cleaned = raw.replace(/\s/g, "").toUpperCase();
  if (/^[A-Z]{1,2}\d+$/.test(cleaned)) {
    const match = cleaned.match(/^([A-Z]{1,2})(\d+)$/);
    if (match) {
      return match[1] + match[2].padStart(8 - match[1].length, "0");
    }
  }
  return cleaned.padStart(8, "0");
}

// Human-readable labels for common CH filing type codes
const FILING_TYPE_LABELS: Record<string, string> = {
  "AA": "Annual accounts filed",
  "AA01": "Accounts type changed",
  "AAMD": "Amended accounts filed",
  "AD01": "Registered office address changed",
  "AD02": "Single alternative inspection location changed",
  "AD03": "Records moved to single alternative inspection location",
  "AD04": "Records moved to registered office",
  "AP01": "Director appointed",
  "AP02": "Corporate director appointed",
  "AP03": "Secretary appointed",
  "AP04": "Corporate secretary appointed",
  "AR01": "Annual return filed",
  "CH01": "Director details changed",
  "CH02": "Corporate director details changed",
  "CH03": "Secretary details changed",
  "CH04": "Corporate secretary details changed",
  "CS01": "Confirmation statement filed",
  "DS01": "Application to strike off",
  "DS02": "Withdrawal of strike off application",
  "MR01": "Charge created",
  "MR02": "Charge satisfied",
  "MR04": "Charge fully satisfied",
  "NM01": "Company name changed",
  "PSC01": "Person with significant control registered",
  "PSC02": "Relevant legal entity with significant control registered",
  "PSC03": "Other registrable person with significant control registered",
  "PSC04": "Person with significant control details changed",
  "PSC07": "Person with significant control ceased",
  "PSC08": "Notification of significant control statement",
  "PSC09": "Exemption from keeping register of persons with significant control",
  "RP04": "Second filing",
  "SH01": "Return of allotment of shares",
  "SH02": "Consolidation of shares",
  "SH03": "Purchase of own shares",
  "SH06": "Cancellation of shares",
  "SH07": "Share premium account cancelled",
  "SH08": "Class of shares changed",
  "SH10": "Particulars of variation of rights attached to shares",
  "SH19": "Statement of capital following an order made by court for reduction of capital",
  "TM01": "Director resigned",
  "TM02": "Secretary resigned",
  "DISS16": "Compulsory strike off action discontinued",
  "GAZ1": "First gazette notice for compulsory strike-off",
  "GAZ2": "Final gazette notice for compulsory strike-off",
  "GAZ1(A)": "First gazette notice for voluntary strike-off",
  "GAZ2(A)": "Final gazette notice for voluntary strike-off",
  "LIQD": "Liquidation",
  "600": "Appointment of liquidator",
};

// Description key -> human readable (CH uses hyphenated keys as description values)
const DESCRIPTION_KEY_LABELS: Record<string, string> = {
  "accounts-with-accounts-type-group": "Group accounts filed",
  "accounts-with-accounts-type-full": "Full accounts filed",
  "accounts-with-accounts-type-small": "Small company accounts filed",
  "accounts-with-accounts-type-total-exemption-full": "Total exemption full accounts filed",
  "accounts-with-accounts-type-total-exemption-small": "Total exemption small accounts filed",
  "accounts-with-accounts-type-micro-entity": "Micro-entity accounts filed",
  "accounts-with-accounts-type-dormant": "Dormant company accounts filed",
  "accounts-with-accounts-type-abbreviated": "Abbreviated accounts filed",
  "annual-return-company-with-made-up-date": "Annual return",
  "confirmation-statement-with-no-updates": "Confirmation statement — no changes",
  "confirmation-statement-with-updates": "Confirmation statement — with updates",
  "change-registered-office-company-with-date": "Registered office address changed",
  "change-person-director-company-with-change-date": "Director details changed",
  "termination-director-company-with-name-termination-date": "Director resigned",
  "appointment-person-director-company-with-name-date": "Director appointed",
  "appointment-person-secretary-company-with-name-date": "Secretary appointed",
  "termination-secretary-company-with-name-termination-date": "Secretary resigned",
  "capital-cancellation-shares": "Cancellation of shares",
  "capital-allotment-shares": "Allotment of shares",
  "capital-purchase-own-shares": "Purchase of own shares",
  "capital-reduction": "Reduction of capital",
  "capital-cancellation-shares-premium": "Cancellation of share premium",
  "persons-with-significant-control-statement-notification": "PSC statement filed",
  "notification-of-a-person-with-significant-control": "PSC registered",
  "cessation-of-a-person-with-significant-control": "PSC ceased",
  "change-of-name-company": "Company name changed",
  "gazette-filings-1": "First gazette notice for strike-off",
  "gazette-filings-2": "Final gazette notice for strike-off",
  "dissolution-voluntary": "Voluntary dissolution",
  "dissolution-compulsory": "Compulsory dissolution",
  "mortgage-charge-created": "Charge created",
  "mortgage-charge-satisfied": "Charge satisfied",
  "mortgage-charge-fully-satisfied": "Charge fully satisfied",
};

/**
 * Resolve a human-readable filing description.
 * Priority order:
 * 1. description_values interpolation (if present, produces richest text)
 * 2. DESCRIPTION_KEY_LABELS lookup on description key
 * 3. FILING_TYPE_LABELS lookup on type code
 * 4. Fall back to raw description key formatted as title case
 */
function resolveFilingDescription(
  descriptionKey: string,
  descriptionValues: Record<string, string>,
  typeCode: string
): string {
  // 1. Try to interpolate description_values into a readable sentence
  // CH description keys use {placeholders} that map to description_values fields
  // e.g. "appointment-person-director-company-with-name-date" with {officer_name: "SMITH, Jane", date: "2020-01-15"}
  if (descriptionKey && Object.keys(descriptionValues).length > 0) {
    // Common interpolation patterns
    const parts: string[] = [];
    if (descriptionValues.officer_name) parts.push(descriptionValues.officer_name);
    if (descriptionValues.company_name) parts.push(descriptionValues.company_name);

    const baseLabel =
      DESCRIPTION_KEY_LABELS[descriptionKey] ||
      FILING_TYPE_LABELS[typeCode];

    if (baseLabel) {
      return parts.length > 0 ? `${baseLabel}: ${parts.join(", ")}` : baseLabel;
    }
  }

  // 2. Direct description key lookup
  if (descriptionKey && DESCRIPTION_KEY_LABELS[descriptionKey]) {
    return DESCRIPTION_KEY_LABELS[descriptionKey];
  }

  // 3. Filing type code lookup
  if (typeCode && FILING_TYPE_LABELS[typeCode]) {
    return FILING_TYPE_LABELS[typeCode];
  }

  // 4. Format the raw key as readable text (replace hyphens with spaces, title case)
  if (descriptionKey) {
    return descriptionKey
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return typeCode || "Filing";
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

    // 5 most recent filings — with human-readable descriptions
    let recentFilings: { type: string; date: string; description: string; category: string }[] = [];
    if (filingRes.ok) {
      const filingData = await filingRes.json();
      recentFilings = (filingData.items || []).map((f: Record<string, unknown>) => ({
        type: f.type as string,
        date: f.date as string,
        description: resolveFilingDescription(
          (f.description as string) || "",
          (f.description_values as Record<string, string>) || {},
          (f.type as string) || ""
        ),
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

    const addr = profile.registered_office_address || {};

    const accountsObj = profile.accounts || null;
    const accounts = accountsObj
      ? {
          next_due:
            accountsObj.next_accounts?.due_on ||
            accountsObj.next_due ||
            null,
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
          overdue: csObj.overdue || false,
        }
      : null;

    return NextResponse.json({
      company_number: companyNumber,
      company_name: profile.company_name || null,
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
