// Digital Twin Phase 2: the numbers are calculated in code; the AI only writes commentary.
// Run from the frontend repo root AFTER apply-twin-context-frontend.cjs:  node apply-twin-compute-frontend.cjs
const fs = require('fs'), path = require('path');
const file = path.join(process.cwd(), 'src', 'components', 'digitaltwin', 'DigitalTwinPage.jsx');
if (!fs.existsSync(file)) { console.error('Not found: ' + file + ' - run this from the frontend repo root.'); process.exit(1); }
const raw = fs.readFileSync(file, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
let s = raw.replace(/\r\n/g, '\n');
if (s.includes('computeProjection')) { console.log('Already applied - nothing to do.'); process.exit(0); }
if (!s.includes('twin-context')) { console.error('Run apply-twin-context-frontend.cjs first. No changes made.'); process.exit(1); }
function rep(from, to, label) {
  const i = s.indexOf(from);
  if (i < 0 || s.indexOf(from, i + 1) >= 0) { console.error('Could not place change: ' + label + '. No changes written.'); process.exit(1); }
  s = s.slice(0, i) + to + s.slice(i + from.length);
}

// 1. the calculation (pure function, placed before the page component)
const calc = `// -- Projection maths (done in code, never by the AI) -----------
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function computeProjection(inp) {
  const n = v => { const x = parseFloat(v); return Number.isFinite(x) ? x : 0; };
  const rev0 = n(inp.current_revenue), emp0 = Math.round(n(inp.current_employees)), opexM = n(inp.current_monthly_expenses);
  const g = n(inp.revenue_growth_pct) / 100, infl = n(inp.inflation_pct) / 100, taxRate = n(inp.tax_rate_pct) / 100;
  const N = Math.min(5, Math.max(1, Math.round(n(inp.projection_years)) || 1));
  const hires = Math.max(0, Math.round(n(inp.new_hires))), sal = n(inp.avg_salary);
  const rent = inp.new_office ? n(inp.office_rent_monthly) : 0;
  const prod = inp.new_product ? n(inp.product_dev_cost) : 0;
  const r = Math.round;
  const years = [];
  for (let y = 1; y <= N; y++) {
    const revenue = rev0 * Math.pow(1 + g, y);
    const base = opexM * 12 * Math.pow(1 + infl, y);
    const hireCost = hires * sal * Math.pow(1 + infl, y - 1);
    const office = rent * 12 * Math.pow(1 + infl, y - 1);
    const oneOff = y === 1 ? prod : 0;
    const opex = base + hireCost + office + oneOff;
    const ebitda = revenue - opex;
    const tax = ebitda > 0 ? ebitda * taxRate : 0;
    const net = ebitda - tax;
    years.push({ year: y, revenue: r(revenue), gross_profit: null, operating_expenses: r(opex), ebitda: r(ebitda), tax: r(tax),
      net_profit: r(net), cash_flow: r(net), headcount: emp0 + hires, monthly_burn: r((opex - oneOff) / 12) });
  }
  const start = new Date().getMonth();
  const cash_flow_months = [];
  let breakEven = null;
  for (let m = 1; m <= 12; m++) {
    const rev = (rev0 / 12) * Math.pow(1 + g, m / 12);
    const cost = opexM * Math.pow(1 + infl, m / 12) + (hires * sal) / 12 + rent + (m === 1 ? prod : 0);
    const value = r(rev - cost);
    if (breakEven === null && value >= 0) breakEven = m;
    cash_flow_months.push({ month: MONTHS_SHORT[(start + m) % 12], value });
  }
  const first = years[0], last = years[N - 1], y3 = years[Math.min(3, N) - 1];
  const margin = y => (y.revenue > 0 ? Math.round((y.ebitda / y.revenue) * 1000) / 10 : 0);
  const total_investment = r(prod + hires * sal + rent * 12);
  let verdict = 'POSITIVE';
  if (last.ebitda < 0) verdict = 'NEGATIVE';
  else if (first.ebitda < 0 || margin(last) < 10) verdict = 'CAUTION';
  const summary = 'Revenue grows from ' + formatINR(rev0) + ' to ' + formatINR(last.revenue) + ' over ' + N + ' year(s). Year 1 EBITDA is ' + formatINR(first.ebitda) +
    '; by year ' + N + ' it is ' + formatINR(last.ebitda) + ' (' + margin(last) + '% margin). Extra spend in year 1 from this scenario: ' + formatINR(total_investment) + '. ' +
    'Calculated from your inputs: current expenses are assumed to include today\\'s payroll, and no extra revenue is assumed from the new hires, office or product.';
  return {
    summary, verdict, years, cash_flow_months, risks: [], opportunities: [], recommendations: [],
    key_metrics: {
      revenue_cagr: rev0 > 0 ? Math.round((Math.pow(last.revenue / rev0, 1 / N) - 1) * 1000) / 10 : 0,
      ebitda_margin_y3: margin(y3), payback_months: null, break_even_month: breakEven, total_investment, roi_3yr: null,
    },
  };
}

`;
rep('// -- Main Digital Twin ------------------------------------------', calc + '// -- Main Digital Twin ------------------------------------------', 'insert calc');

// 2. replace prompt + parsing with: calculate, then ask the AI only for commentary
const a = s.indexOf('      const prompt = [');
const bMarker = '      setResult(parsed);\n';
const b = s.indexOf(bMarker, a);
if (a < 0 || b < 0) { console.error('Could not find the prompt block. No changes written.'); process.exit(1); }
const block = `      const calc = computeProjection(inputs);
      let parsed = calc;
      try {
        const prompt = [
          'You are the commentary writer for the Digital Twin of Deemona AI Finance OS (an Indian ' + inputs.industry + ' company).',
          'The projection below was CALCULATED IN CODE from the company inputs. Do not recompute, change or restate any number differently.',
          '',
          'INPUTS: ' + JSON.stringify({ current_revenue: inputs.current_revenue, employees: inputs.current_employees, monthly_expenses: inputs.current_monthly_expenses,
            growth_pct: inputs.revenue_growth_pct, years: inputs.projection_years, new_hires: inputs.new_hires, avg_salary: inputs.avg_salary,
            new_office: inputs.new_office, office_rent_monthly: inputs.office_rent_monthly, new_product: inputs.new_product, product_dev_cost: inputs.product_dev_cost,
            inflation_pct: inputs.inflation_pct, tax_rate_pct: inputs.tax_rate_pct, custom: inputs.custom_assumption }),
          'CALCULATED RESULT: ' + JSON.stringify({ verdict: calc.verdict, years: calc.years.map(y => ({ year: y.year, revenue: y.revenue, ebitda: y.ebitda, net_profit: y.net_profit })), key_metrics: calc.key_metrics }),
          ctx ? 'COMPANY DATA FROM THE BOOKS (live): ' + JSON.stringify({ months_covered: ctx.months_covered, position: ctx.position }) : 'No company books data was found.',
          '',
          'Use your tools only if you need the company\\'s own data (ar_aging, collection_efficiency, budget_vs_actual). Then reply with ONLY this JSON, no markdown:',
          '{ "summary": "2-3 sentences on what this scenario means for this company", "risks": ["..","..",".."], "opportunities": ["..","..",".."], "recommendations": ["..","..",".."] }',
          'Mention assumptions you relied on. Do not invent facts about the company.',
        ].join('\\n');

        const res = await fetch(apiURL('/api/cfo/brief'), { method: 'POST', headers: headers(), body: JSON.stringify({ prompt }) });
        const rawText = await res.text();
        let data = null;
        try { data = JSON.parse(rawText); } catch {}
        if (!res.ok) {
          parsed = { ...calc, ai_note: 'AI commentary unavailable: ' + (data && data.error ? String(data.error).slice(0, 200) : 'HTTP ' + res.status) };
        } else {
          const aiText = (data && data.text) || rawText;
          const m = aiText.match(/\\{[\\s\\S]*\\}/);
          let ai = null;
          if (m) { try { ai = JSON.parse(m[0]); } catch {} }
          const list = v => (Array.isArray(v) ? v.map(String) : []);
          if (ai && (ai.summary || ai.risks || ai.recommendations)) {
            parsed = { ...calc, summary: (ai.summary ? ai.summary + '\\n\\n' : '') + calc.summary, risks: list(ai.risks), opportunities: list(ai.opportunities), recommendations: list(ai.recommendations) };
          } else {
            parsed = { ...calc, summary: calc.summary + '\\n\\nAI commentary: ' + String(aiText).slice(0, 1500) };
          }
        }
      } catch (e) {
        parsed = { ...calc, ai_note: 'AI commentary unavailable: ' + e.message };
      }
`;
s = s.slice(0, a) + block + s.slice(b);

// 3. renderer: hide rows with no data, show n/a, show AI note
rep("{ label: 'Monthly Burn', value: yr.monthly_burn, color: '#FF5C5C' },\n                        ].map(m => (",
    "{ label: 'Monthly Burn', value: yr.monthly_burn, color: '#FF5C5C' },\n                        ].filter(m => m.value != null).map(m => (", 'hide null rows');
rep("value={result.key_metrics.payback_months + ' mo'}", "value={result.key_metrics.payback_months != null ? result.key_metrics.payback_months + ' mo' : 'n/a'}", 'payback');
rep("value={'M' + result.key_metrics.break_even_month}", "value={result.key_metrics.break_even_month != null ? 'M' + result.key_metrics.break_even_month : 'Not in year 1'}", 'break-even');
rep("value={result.key_metrics.roi_3yr + '%'} color={result.key_metrics.roi_3yr >= 0 ? '#22C98A' : '#FF5C5C'}",
    "value={result.key_metrics.roi_3yr != null ? result.key_metrics.roi_3yr + '%' : 'n/a'} color={result.key_metrics.roi_3yr == null || result.key_metrics.roi_3yr >= 0 ? '#22C98A' : '#FF5C5C'}", 'roi');
rep("<div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)' }}>{result.summary}</div>",
    "<div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>{result.summary}</div>\n                    {result.ai_note && <div style={{ fontSize: 12, marginTop: 8, color: 'var(--text-muted)' }}>{result.ai_note}</div>}", 'summary');
fs.writeFileSync(file, s.replace(/\n/g, eol), 'utf8');
console.log('Digital Twin now calculates the projection in code; AI only adds commentary.');
