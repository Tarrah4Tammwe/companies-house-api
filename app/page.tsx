export default function Home() {
  return (
    <main style={{ fontFamily: "monospace", maxWidth: 760, margin: "60px auto", padding: "0 20px" }}>
      <h1>🏢 Companies House Enrichment API</h1>
      <p>Single-call structured data from Companies House. Company profile, officers, accounts status, and recent filings — all in one response.</p>

      <h2>Endpoints</h2>

      <h3>POST /api/enrich</h3>
      <p>Full enrichment by company number.</p>
      <pre style={{ background: "#f4f4f4", padding: 16, borderRadius: 6 }}>{`{
  "company_number": "12345678"
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
  "accounts": {
    "next_due": "2025-10-15",
    "last_made_up_to": "2024-01-31",
    "overdue": false
  },
  "confirmation_statement": {
    "next_due": "2026-01-20",
    "overdue": false
  },
  "officers": [
    { "name": "SMITH, Jane", "role": "director", "appointed": "2020-01-15", "resigned": false }
  ],
  "total_officers": 1,
  "recent_filings": [
    { "type": "CS01", "date": "2025-01-18", "description": "confirmation-statement-with-updates" }
  ],
  "source": "companies_house"
}`}</pre>

      <h3>GET /api/search?q=NAME&limit=5</h3>
      <p>Search companies by name. Returns up to 20 results.</p>

      <p>
        <a href="https://rapidapi.com" target="_blank" rel="noopener noreferrer">Subscribe on RapidAPI</a>
        {" · "}
        <a href="/api/health">Health check</a>
      </p>
    </main>
  );
}
