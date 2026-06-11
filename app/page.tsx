export default function Home() {
  return (
    <main style={{ fontFamily: "monospace", maxWidth: 760, margin: "60px auto", padding: "0 20px" }}>
      <h1>🏢 Companies House Enrichment API</h1>
      <p>
        Single-call structured data from the UK Companies House API. Profile, active officers,
        accounts status, recent filings — and optionally persons with significant control (PSCs) —
        all in one response. Handles all company number formats including SC, NI, OC prefixes.
      </p>

      <h2>POST /api/enrich</h2>
      <pre style={{ background: "#f4f4f4", padding: 16, borderRadius: 6 }}>{`{
  "company_number": "12345678",
  "include_pscs": true
}`}</pre>

      <pre style={{ background: "#f4f4f4", padding: 16, borderRadius: 6 }}>{`{
  "company_number": "12345678",
  "company_name": "EXAMPLE LTD",
  "company_status": "active",
  "company_type": "ltd",
  "incorporated_on": "2020-01-15",
  "jurisdiction": "england-wales",
  "registered_address": {
    "line1": "1 Example Street",
    "locality": "London",
    "postcode": "SW1A 1AA",
    "country": "England"
  },
  "sic_codes": ["62012"],
  "has_been_liquidated": false,
  "has_insolvency_history": false,
  "has_charges": false,
  "accounts": {
    "next_due": "2025-10-15",
    "last_made_up_to": "2024-01-31",
    "account_type": "total-exemption-full",
    "overdue": false
  },
  "confirmation_statement": {
    "next_due": "2026-01-20",
    "overdue": false
  },
  "active_officers": [
    {
      "name": "SMITH, Jane",
      "role": "director",
      "appointed": "2020-01-15",
      "nationality": "British"
    }
  ],
  "total_officers": 1,
  "recent_filings": [
    {
      "type": "CS01",
      "date": "2025-01-18",
      "description": "confirmation-statement-with-updates",
      "category": "confirmation-statement"
    }
  ],
  "persons_with_significant_control": [
    {
      "name": "SMITH, Jane",
      "kind": "individual-person-with-significant-control",
      "nature_of_control": ["ownership-of-shares-75-to-100-percent"],
      "notified_on": "2020-01-15"
    }
  ],
  "source": "companies_house"
}`}</pre>

      <h2>GET /api/search?q=NAME&limit=5</h2>
      <p>Search companies by name. Returns up to 20 results with address and status.</p>

      <h2>Accepted company number formats</h2>
      <pre style={{ background: "#f4f4f4", padding: 16, borderRadius: 6 }}>{`12345678     England/Wales (padded to 8 digits)
1234567      Auto zero-padded → 01234567
SC123456     Scotland
NI123456     Northern Ireland
OC123456     LLP
R1234567     Royal Charter`}</pre>

      <p>
        <a href="https://rapidapi.com" target="_blank" rel="noopener noreferrer">Subscribe on RapidAPI</a>
        {" · "}
        <a href="/api/health">Health check</a>
      </p>
    </main>
  );
}
