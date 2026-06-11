# Companies House Enrichment API

Single-call structured company data from the UK Companies House official API. Returns profile, officers, accounts status, and recent filings in one request.

## Endpoints

### `POST /api/enrich`

Full company enrichment by company number.

**Request:**
```json
{ "company_number": "12345678" }
```

Zero-pads automatically (e.g. `1234567` → `01234567`).

**Response:**
```json
{
  "company_number": "12345678",
  "company_name": "EXAMPLE LTD",
  "company_status": "active",
  "company_type": "ltd",
  "incorporated_on": "2020-01-15",
  "jurisdiction": "england-wales",
  "registered_address": { "line1": "...", "locality": "London", "postcode": "SW1A 1AA" },
  "sic_codes": ["62012"],
  "accounts": { "next_due": "2025-10-15", "overdue": false },
  "confirmation_statement": { "next_due": "2026-01-20", "overdue": false },
  "officers": [{ "name": "SMITH, Jane", "role": "director", "appointed": "2020-01-15", "resigned": false }],
  "total_officers": 1,
  "recent_filings": [{ "type": "CS01", "date": "2025-01-18", "description": "..." }],
  "source": "companies_house"
}
```

### `GET /api/search?q=NAME&limit=5`

Search companies by name. Max 20 results.

### `GET /api/health`

Service status.

## Pricing

| Plan  | Requests/mo | Price  |
|-------|-------------|--------|
| Free  | 100         | $0     |
| Basic | 10,000      | $9/mo  |
| Pro   | 100,000     | $29/mo |
| Ultra | 500,000     | $79/mo |

## Setup

1. Get a free Companies House API key: https://developer.company-information.service.gov.uk
2. Add to Vercel env vars: `COMPANIES_HOUSE_API_KEY=your_key`
3. Deploy

```bash
npm install
# Create .env.local with COMPANIES_HOUSE_API_KEY=your_key
npm run dev
```

## Why this API?

- Companies House REST API is free but returns 30+ fields in multiple calls
- This API combines profile + officers + filings into one structured response
- Auto zero-pads company numbers
- Returns only useful fields — no parsing required
