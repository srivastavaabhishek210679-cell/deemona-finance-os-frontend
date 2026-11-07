// Digital Twin: prefill from the company's books, ground the prompt in them, remove invented fallback numbers.
// Run from the frontend repo root:  node apply-twin-context-frontend.cjs   (idempotent, CRLF/BOM-aware)
const fs = require('fs'), path = require('path');
const file = path.join(process.cwd(), 'src', 'components', 'digitaltwin', 'DigitalTwinPage.jsx');
if (!fs.existsSync(file)) { console.error('Not found: ' + file + ' - run this from the frontend repo root.'); process.exit(1); }
const raw = fs.readFileSync(file, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
let s = raw.replace(/\r\n/g, '\n');
if (s.includes('twin-context')) { console.log('Already applied - nothing to do.'); process.exit(0); }
function rep(from, to, label) {
  const i = s.indexOf(from);
  if (i < 0 || s.indexOf(from, i + 1) >= 0) { console.error('Could not place change: ' + label + '. No changes written.'); process.exit(1); }
  s = s.slice(0, i) + to + s.slice(i + from.length);
}
rep("import { useState, useCallback } from 'react';", "import { useState, useCallback, useEffect } from 'react';", 'react import');
rep("  const set = (key, val) => setInputs(p => ({ ...p, [key]: val }));\n",
`  // Real figures from this company's books (GET /api/cfo/twin-context); null fields are never made up
  const [ctx, setCtx] = useState(null);
  const [fromBooks, setFromBooks] = useState({});
  useEffect(() => {
    let alive = true;
    fetch(apiURL('/api/cfo/twin-context'), { headers: headers() })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!alive || !d || !d.baseline) return;
        setCtx(d);
        const fill = {}, tag = {};
        if (d.baseline.annual_revenue != null) { fill.current_revenue = String(d.baseline.annual_revenue); tag.current_revenue = true; }
        if (d.baseline.employees != null) { fill.current_employees = String(d.baseline.employees); tag.current_employees = true; }
        if (d.baseline.monthly_opex != null) { fill.current_monthly_expenses = String(d.baseline.monthly_opex); tag.current_monthly_expenses = true; }
        setInputs(p => ({ ...p, ...fill }));
        setFromBooks(tag);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const set = (key, val) => { setFromBooks(p => ({ ...p, [key]: false })); setInputs(p => ({ ...p, [key]: val })); };
`, 'set()');
rep("        '- Monthly Operating Expenses: INR ' + parseFloat(inputs.current_monthly_expenses).toLocaleString('en-IN'),\n",
`        '- Monthly Operating Expenses: INR ' + parseFloat(inputs.current_monthly_expenses).toLocaleString('en-IN'),
        '',
        ctx ? 'COMPANY DATA FROM THE BOOKS (queried live - treat as ground truth; call your tools for anything else you need, such as ar_aging, budget_vs_actual or collection_efficiency, before projecting):' : 'No company books data was found; say so in the summary and treat the figures above as user-entered.',
        ctx ? JSON.stringify({ months_covered: ctx.months_covered, basis: ctx.basis, position: ctx.position }) : '',
`, 'prompt context');
rep("        'Use realistic Indian SME numbers in INR. Return only valid JSON, no markdown.',",
    "        'All projections are estimates derived from the data above: state the key assumptions in the summary and do not invent facts about the company. Return only valid JSON, no markdown.',", 'prompt tail');
rep("          parsed = { summary: aiText, revenue_year1: 0, profit_margin: 34, cash_runway_months: 8 };",
    "          parsed = { error: 'The reply could not be read as a projection. Please run the simulation again.' };", 'fallback 1');
rep("        parsed = { summary: rawText, revenue_year1: 0, profit_margin: 34, cash_runway_months: 8 };",
    "        parsed = { error: 'The reply could not be read as a projection. Please run the simulation again.' };", 'fallback 2');
rep("  }, [inputs]);", "  }, [inputs, ctx]);", 'deps');
const note = "fromBooks.%K ? 'From your books' + (ctx && ctx.months_covered ? ' (last ' + ctx.months_covered + ' completed month(s))' : '') : 'Typed by you or a sample value'";
rep('hint="Your current year\'s total revenue"', 'hint={' + note.replace('%K', 'current_revenue') + '}', 'hint revenue');
rep('hint="Full-time headcount today"', 'hint={' + note.replace('%K', 'current_employees') + '}', 'hint employees');
rep('hint="Total monthly burn rate"', 'hint={' + note.replace('%K', 'current_monthly_expenses') + '}', 'hint opex');
fs.writeFileSync(file, s.replace(/\n/g, eol), 'utf8');
console.log('Digital Twin updated: prefill from books, grounded prompt, no invented fallback.');
