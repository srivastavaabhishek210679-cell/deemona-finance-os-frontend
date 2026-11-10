// Cash Forecast page: explain that salaries and statutory payments are now included. Run from the frontend folder. Idempotent.
const fs = require('fs'); const p = 'src/components/forecast/CashForecastPage.jsx';
let s = fs.readFileSync(p, 'utf8'); const bom = s.charCodeAt(0) === 0xFEFF; if (bom) s = s.slice(1);
const crlf = s.includes('\r\n'); if (crlf) s = s.replace(/\r\n/g, '\n');
if (s.includes('/*payroll-tax-ui*/')) { console.log('already patched'); process.exit(0); }
function rep(a, b) { if (s.split(a).length !== 2) { console.log('ANCHOR NOT FOUND:', a.slice(0, 80)); process.exit(1); } s = s.replace(a, () => b); }
rep('Other monthly costs not in bills, e.g. salaries (₹)', 'Other monthly costs not in bills or payroll (₹)');
rep("{data.counts.receivables} open sales invoice(s) and {data.counts.payables} approved bill(s), by due date.",
    "{data.counts.receivables} open sales invoice(s) and {data.counts.payables} approved bill(s), by due date{data.counts.payroll_and_tax_items > 0 ? ', plus salaries, PF/ESIC, TDS, professional tax and GST coming due' : ''}.");
rep("<div style={{ fontSize: 12, color: '#64748B', marginTop: 12 }}>{data.note} Every number",
    "{/*payroll-tax-ui*/}\n          {(data.basis || []).map((b, i) => <div key={i} style={{ fontSize: 12, color: '#475569', marginTop: i === 0 ? 12 : 4 }}>• {b}</div>)}\n          {(!data.basis || data.basis.length === 0) && <div style={{ fontSize: 12, color: '#B45309', marginTop: 12 }}>Salaries and taxes are not in this forecast yet: no payroll run or employees are recorded. Run payroll, or enter a monthly amount above.</div>}\n          <div style={{ fontSize: 12, color: '#64748B', marginTop: 12 }}>{data.note} Every number");
fs.writeFileSync(p, (bom ? '﻿' : '') + (crlf ? s.replace(/\n/g, '\r\n') : s)); console.log('patched', p);
