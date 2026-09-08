const FILING_TYPE_LABELS: Record<string, string> = {
  AA: "Annual accounts filed",
  AA01: "Accounts type changed",
  AAMD: "Amended accounts filed",
  AD01: "Registered office address changed",
  AD02: "Single alternative inspection location changed",
  AD03: "Records moved to single alternative inspection location",
  AD04: "Records moved to registered office",
  AP01: "Director appointed",
  AP02: "Corporate director appointed",
  AP03: "Secretary appointed",
  AP04: "Corporate secretary appointed",
  AR01: "Annual return filed",
  CH01: "Director details changed",
  CH02: "Corporate director details changed",
  CH03: "Secretary details changed",
  CH04: "Corporate secretary details changed",
  CS01: "Confirmation statement filed",
  DS01: "Application to strike off",
  DS02: "Withdrawal of strike off application",
  MR01: "Charge created",
  MR02: "Charge satisfied",
  MR04: "Charge fully satisfied",
  NM01: "Company name changed",
  PSC01: "Person with significant control registered",
  PSC02: "Relevant legal entity with significant control registered",
  PSC03: "Other registrable person with significant control registered",
  PSC04: "Person with significant control details changed",
  PSC07: "Person with significant control ceased",
  PSC08: "Notification of significant control statement",
  PSC09: "Exemption from keeping register of persons with significant control",
  RP04: "Second filing",
  SH01: "Return of allotment of shares",
  SH02: "Consolidation of shares",
  SH03: "Purchase of own shares",
  SH06: "Cancellation of shares",
  SH07: "Share premium account cancelled",
  SH08: "Class of shares changed",
  SH10: "Particulars of variation of rights attached to shares",
  SH19: "Statement of capital following an order made by court for reduction of capital",
  TM01: "Director resigned",
  TM02: "Secretary resigned",
  DISS16: "Compulsory strike off action discontinued",
  GAZ1: "First gazette notice for compulsory strike-off",
  GAZ2: "Final gazette notice for compulsory strike-off",
  "GAZ1(A)": "First gazette notice for voluntary strike-off",
  "GAZ2(A)": "Final gazette notice for voluntary strike-off",
  LIQD: "Liquidation",
  "600": "Appointment of liquidator",
};

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

function asValues(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string" && v) out[k] = v;
  }
  return out;
}

/**
 * Resolve a human-readable filing description.
 * Priority: interpolated values → description key → type code → title-cased key.
 */
export function resolveFilingDescription(
  descriptionKey: string,
  descriptionValues: unknown,
  typeCode: string
): string {
  const values = asValues(descriptionValues);

  if (descriptionKey && Object.keys(values).length > 0) {
    const parts: string[] = [];
    if (values.officer_name) parts.push(values.officer_name);
    if (values.company_name) parts.push(values.company_name);
    if (values.date) parts.push(values.date);

    const baseLabel =
      DESCRIPTION_KEY_LABELS[descriptionKey] || FILING_TYPE_LABELS[typeCode];

    if (baseLabel) {
      return parts.length > 0 ? `${baseLabel}: ${parts.join(", ")}` : baseLabel;
    }
  }

  if (descriptionKey && DESCRIPTION_KEY_LABELS[descriptionKey]) {
    return DESCRIPTION_KEY_LABELS[descriptionKey];
  }

  if (typeCode && FILING_TYPE_LABELS[typeCode]) {
    return FILING_TYPE_LABELS[typeCode];
  }

  if (descriptionKey) {
    return descriptionKey
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return typeCode || "Filing";
}
