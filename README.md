# Companies House Enrichment API

Single-call structured company data from the UK Companies House API. Profile, active officers,
accounts status, recent filings, and optionally persons with significant control (PSCs).

Handles all UK company number formats: standard 8-digit, SC/NI/OC/R prefixes, auto zero-padding.

## Endpoints

### `POST /api/enrich`

**Request:**
```json
{
  "company_number": "12345678",
  "include_pscs": true
}
```

`include_pscs` is optional (default false). When true, adds `persons_with_significant_control` to response.

**Accepted company number formats:**

| Input | Normalised | Description |
|-------|------------|-------------|
| `12345678` | `12345678` | Standard England/Wales |
| `1234567` | `01234567` | Auto zero-padded |
| `SC123456` | `SC123456` | Scotland |
| `NI123456` | `NI123456` | Northern Ireland |
| `OC123456` | `OC123456` | LLP |
| `R1234567` | `R1234567` | Royal Charter |

**Response:**
```json
{
  "company_number": "12345678",
  "company_name": "EXAMPLE LTD",
  "company_status": "active",
  "company_type": "ltd",
  "incorporated_on": "2020-01-15",
  "jurisdiction": "england-wales",
  "registered_address": {
    "line1": "1 Example Street",
    "line2": null,
    "locality": "London",
    "region": null,
    "postcode": "SW1A 1AA",
    "country": "England",
    "care_of": null,
    "po_box": null
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
  "confirmation_statement": { "next_due": "2026-01-20", "overdue": false },
  "active_officers": [
    { "name": "SMITH, Jane", "role": "director", "appointed": "2020-01-15", "nationality": "British" }
  ],
  "total_officers": 1,
  "recent_filings": [
    { "type": "CS01", "date": "2025-01-18", "description": "...", "category": "confirmation-statement" }
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
}
```

### `GET /api/search?q=NAME&limit=5`

Search companies by name. Returns up to 20 results.

### `GET /api/health`

Service status.

## Setup

1. Register for a free Companies House API key: https://developer.company-information.service.gov.uk/get-started
   (Instant — no approval wait)
2. Add to Vercel environment variables: `COMPANIES_HOUSE_API_KEY=your_key`
3. Deploy

```bash
npm install
# Create .env.local with COMPANIES_HOUSE_API_KEY=your_key
npm run dev
```

## Pricing

| Plan  | Requests/mo | Price  |
|-------|-------------|--------|
| Free  | 100         | $0     |
| Basic | 10,000      | $9/mo  |
| Pro   | 100,000     | $29/mo |
| Ultra | 500,000     | $79/mo |

## Why this API?

- **One call, full data** — parallel fetches for profile + officers + filings (+ PSCs optionally)
- **Correct accounts field mapping** — uses `next_accounts.due_on` which matches the live API response shape
- **Active officers only** — resigned officers filtered out automatically
- **PSC support** — persons with significant control via `include_pscs: true`
- **Risk signals** — `has_been_liquidated`, `has_insolvency_history`, `has_charges` in every response
- **All company number formats** — SC, NI, OC, R prefixes + auto zero-padding
- **Rate limit handling** — returns proper 429 with retry message
