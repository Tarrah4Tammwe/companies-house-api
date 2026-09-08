const COMPANY_NUMBER_RE = /^[A-Z0-9]{8}$/;
const MAX_RAW_LENGTH = 16;

/**
 * Normalise a UK company number to the 8-character Companies House form.
 * Returns null when the input is not a plausible company number (rejects
 * path traversal, symbols, and over-long values before they can be placed
 * in an upstream URL path).
 */
export function normaliseCompanyNumber(raw: string): string | null {
  const cleaned = raw.replace(/[\s-]/g, "").toUpperCase();
  if (!cleaned || cleaned.length > MAX_RAW_LENGTH) return null;

  let normalised: string;

  if (/^[A-Z]{1,2}\d+$/.test(cleaned)) {
    const match = cleaned.match(/^([A-Z]{1,2})(\d+)$/);
    if (!match) return null;
    const prefix = match[1];
    const digits = match[2];
    const width = 8 - prefix.length;
    if (digits.length > width) return null;
    normalised = prefix + digits.padStart(width, "0");
  } else if (/^\d+$/.test(cleaned)) {
    if (cleaned.length > 8) return null;
    normalised = cleaned.padStart(8, "0");
  } else {
    return null;
  }

  return COMPANY_NUMBER_RE.test(normalised) ? normalised : null;
}
