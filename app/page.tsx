export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0A0F1E;
          color: #E2E8F0;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 15px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
        }

        .page { max-width: 860px; margin: 0 auto; padding: 60px 24px 100px; }

        .badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(37,99,235,0.15); border: 1px solid rgba(37,99,235,0.35);
          color: #60A5FA; font-size: 12px; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 4px 10px; border-radius: 20px;
          margin-bottom: 20px;
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #22C55E;
          box-shadow: 0 0 6px #22C55E; animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        h1 {
          font-size: clamp(28px, 5vw, 42px); font-weight: 700;
          color: #F8FAFC; letter-spacing: -0.02em; line-height: 1.15;
          margin-bottom: 16px;
        }
        h1 span { color: #2563EB; }
        .subtitle { font-size: 16px; color: #94A3B8; max-width: 580px; line-height: 1.7; }

        .meta {
          display: flex; flex-wrap: wrap; gap: 24px;
          margin-top: 28px; padding-top: 28px;
          border-top: 1px solid rgba(255,255,255,0.06);
          margin-bottom: 56px;
        }
        .meta-item { display: flex; flex-direction: column; gap: 3px; }
        .meta-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; }
        .meta-value { font-size: 14px; font-weight: 500; color: #CBD5E1; }

        .section { margin-bottom: 48px; }
        h2 {
          font-size: 13px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #475569; margin-bottom: 16px;
        }

        /* Endpoints grid */
        .endpoints-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 600px) { .endpoints-grid { grid-template-columns: 1fr; } }
        .endpoint-card {
          background: #111827; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 16px;
        }
        .endpoint-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .method {
          font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600;
          color: #fff; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .method-post { background: #2563EB; }
        .method-get { background: #059669; }
        .path { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #7DD3FC; }
        .endpoint-desc { font-size: 13px; color: #64748B; line-height: 1.5; }

        /* Code cards */
        .code-card {
          background: #111827; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; overflow: hidden;
        }
        .code-card-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 16px; border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
        }
        .code-lang { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; }
        .code-tag { font-size: 11px; font-weight: 500; color: #22C55E; background: rgba(34,197,94,0.1); padding: 2px 8px; border-radius: 10px; }
        .code-tag.opt { color: #94A3B8; background: rgba(148,163,184,0.1); }
        pre {
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 13px !important; line-height: 1.7;
          padding: 20px !important; overflow-x: auto;
          background: transparent !important; color: #CBD5E1;
        }
        .k { color: #7DD3FC; }
        .s { color: #86EFAC; }
        .t { color: #4ADE80; }
        .f { color: #F87171; }
        .n { color: #FCD34D; }
        .c { color: #94A3B8; font-style: italic; }

        /* Features grid */
        .features { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
        .feature {
          background: #111827; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 16px 18px;
        }
        .feature-icon { font-size: 18px; margin-bottom: 8px; }
        .feature-title { font-size: 13px; font-weight: 600; color: #E2E8F0; margin-bottom: 4px; }
        .feature-desc { font-size: 12px; color: #64748B; line-height: 1.5; }

        /* Format table */
        .format-table { width: 100%; border-collapse: collapse; }
        .format-table th { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #475569; padding: 8px 12px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.07); }
        .format-table td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; color: #CBD5E1; }
        .format-table tr:last-child td { border-bottom: none; }
        .format-table td:first-child { font-family: 'JetBrains Mono', monospace; color: #7DD3FC; }
        .format-table td:nth-child(2) { color: #94A3B8; }
        .format-table td:last-child { font-size: 12px; color: #475569; }

        .footer-links { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 48px; }
        .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; transition: all 0.15s; }
        .btn-primary { background: #2563EB; color: #fff; }
        .btn-primary:hover { background: #1D4ED8; }
        .btn-ghost { background: rgba(255,255,255,0.05); color: #94A3B8; border: 1px solid rgba(255,255,255,0.1); }
        .btn-ghost:hover { background: rgba(255,255,255,0.08); color: #E2E8F0; }

        @media (max-width: 600px) { .page { padding: 40px 16px 80px; } h1 { font-size: 26px; } }
      `}</style>

      <div className="page">
        <header>
          <div className="badge"><span className="badge-dot"></span>Live · Companies House</div>
          <h1>Companies House<br /><span>Enrichment</span> API</h1>
          <p className="subtitle">
            One call. Full company data. Profile, active officers, accounts status,
            recent filings, and persons with significant control — structured and ready to use.
          </p>
          <div className="meta">
            <div className="meta-item"><span className="meta-label">Source</span><span className="meta-value">Companies House Official</span></div>
            <div className="meta-item"><span className="meta-label">Calls per request</span><span className="meta-value">1 in, 3–4 out</span></div>
            <div className="meta-item"><span className="meta-label">Coverage</span><span className="meta-value">UK · All jurisdictions</span></div>
            <div className="meta-item"><span className="meta-label">Format</span><span className="meta-value">JSON · REST</span></div>
          </div>
        </header>

        <section className="section">
          <h2>Endpoints</h2>
          <div className="endpoints-grid">
            <div className="endpoint-card">
              <div className="endpoint-row">
                <span className="method method-post">POST</span>
                <span className="path">/api/enrich</span>
              </div>
              <p className="endpoint-desc">Full company enrichment by number. Profile + officers + filings + optional PSCs in one response.</p>
            </div>
            <div className="endpoint-card">
              <div className="endpoint-row">
                <span className="method method-get">GET</span>
                <span className="path">/api/search</span>
              </div>
              <p className="endpoint-desc">Search companies by name. Returns up to 20 results with status and address.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Request</h2>
          <div className="code-card">
            <div className="code-card-header">
              <span className="code-lang">JSON · POST /api/enrich</span>
              <span className="code-tag opt">include_pscs optional</span>
            </div>
            <pre>{`{
  `}<span className="k">&quot;company_number&quot;</span>{`: `}<span className="s">&quot;12345678&quot;</span>{`,
  `}<span className="k">&quot;include_pscs&quot;</span>{`: `}<span className="t">true</span>{`
}`}</pre>
          </div>
        </section>

        <section className="section">
          <h2>Response</h2>
          <div className="code-card">
            <div className="code-card-header">
              <span className="code-lang">JSON</span>
              <span className="code-tag">200 OK</span>
            </div>
            <pre>{`{
  `}<span className="k">&quot;company_number&quot;</span>{`: `}<span className="s">&quot;12345678&quot;</span>{`,
  `}<span className="k">&quot;company_name&quot;</span>{`: `}<span className="s">&quot;EXAMPLE LTD&quot;</span>{`,
  `}<span className="k">&quot;company_status&quot;</span>{`: `}<span className="s">&quot;active&quot;</span>{`,
  `}<span className="k">&quot;company_type&quot;</span>{`: `}<span className="s">&quot;ltd&quot;</span>{`,
  `}<span className="k">&quot;incorporated_on&quot;</span>{`: `}<span className="s">&quot;2020-01-15&quot;</span>{`,
  `}<span className="k">&quot;jurisdiction&quot;</span>{`: `}<span className="s">&quot;england-wales&quot;</span>{`,
  `}<span className="k">&quot;registered_address&quot;</span>{`: {
    `}<span className="k">&quot;line1&quot;</span>{`: `}<span className="s">&quot;1 Example Street&quot;</span>{`,
    `}<span className="k">&quot;locality&quot;</span>{`: `}<span className="s">&quot;London&quot;</span>{`,
    `}<span className="k">&quot;postcode&quot;</span>{`: `}<span className="s">&quot;SW1A 1AA&quot;</span>{`
  },
  `}<span className="k">&quot;sic_codes&quot;</span>{`: [`}<span className="s">&quot;62012&quot;</span>{`],
  `}<span className="k">&quot;has_been_liquidated&quot;</span>{`: `}<span className="f">false</span>{`,
  `}<span className="k">&quot;has_insolvency_history&quot;</span>{`: `}<span className="f">false</span>{`,
  `}<span className="k">&quot;has_charges&quot;</span>{`: `}<span className="f">false</span>{`,
  `}<span className="k">&quot;accounts&quot;</span>{`: {
    `}<span className="k">&quot;next_due&quot;</span>{`: `}<span className="s">&quot;2025-10-15&quot;</span>{`,
    `}<span className="k">&quot;last_made_up_to&quot;</span>{`: `}<span className="s">&quot;2024-01-31&quot;</span>{`,
    `}<span className="k">&quot;overdue&quot;</span>{`: `}<span className="f">false</span>{`
  },
  `}<span className="k">&quot;active_officers&quot;</span>{`: [{
    `}<span className="k">&quot;name&quot;</span>{`: `}<span className="s">&quot;SMITH, Jane&quot;</span>{`,
    `}<span className="k">&quot;role&quot;</span>{`: `}<span className="s">&quot;director&quot;</span>{`,
    `}<span className="k">&quot;appointed&quot;</span>{`: `}<span className="s">&quot;2020-01-15&quot;</span>{`
  }],
  `}<span className="k">&quot;persons_with_significant_control&quot;</span>{`: [{
    `}<span className="k">&quot;name&quot;</span>{`: `}<span className="s">&quot;SMITH, Jane&quot;</span>{`,
    `}<span className="k">&quot;nature_of_control&quot;</span>{`: [`}<span className="s">&quot;ownership-of-shares-75-to-100-percent&quot;</span>{`]
  }]
}`}</pre>
          </div>
        </section>

        <section className="section">
          <h2>What makes this different</h2>
          <div className="features">
            <div className="feature">
              <div className="feature-icon">⚡</div>
              <div className="feature-title">One call, full picture</div>
              <div className="feature-desc">Parallel requests to profile, officers, and filings endpoints — merged into one clean response.</div>
            </div>
            <div className="feature">
              <div className="feature-icon">🔍</div>
              <div className="feature-title">PSC support</div>
              <div className="feature-desc">Persons with significant control via <code>include_pscs: true</code>. Essential for KYB and AML workflows.</div>
            </div>
            <div className="feature">
              <div className="feature-icon">⚠️</div>
              <div className="feature-title">Risk signals</div>
              <div className="feature-desc">Liquidation, insolvency history, and charges flags in every response — no extra calls needed.</div>
            </div>
            <div className="feature">
              <div className="feature-icon">🏴󠁧󠁢󠁳󠁣󠁴󠁿</div>
              <div className="feature-title">All jurisdictions</div>
              <div className="feature-desc">SC, NI, OC, R prefixes handled. Numbers auto zero-padded to 8 digits.</div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>Accepted company number formats</h2>
          <div className="code-card">
            <table className="format-table">
              <thead>
                <tr><th>Input</th><th>Normalised</th><th>Jurisdiction</th></tr>
              </thead>
              <tbody>
                <tr><td>12345678</td><td>12345678</td><td>England / Wales</td></tr>
                <tr><td>1234567</td><td>01234567</td><td>Auto zero-padded</td></tr>
                <tr><td>SC123456</td><td>SC123456</td><td>Scotland</td></tr>
                <tr><td>NI123456</td><td>NI123456</td><td>Northern Ireland</td></tr>
                <tr><td>OC123456</td><td>OC123456</td><td>LLP</td></tr>
                <tr><td>R1234567</td><td>R1234567</td><td>Royal Charter</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="footer-links">
          <a className="btn btn-primary" href="https://rapidapi.com/tarrah4tammwe/api/companies-house-enrichment" target="_blank" rel="noopener noreferrer">
            Subscribe on RapidAPI
          </a>
          <a className="btn btn-ghost" href="/api/health">Health check</a>
        </div>
      </div>
    </>
  );
}
