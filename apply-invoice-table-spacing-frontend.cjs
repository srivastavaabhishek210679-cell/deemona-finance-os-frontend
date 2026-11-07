// Accounting invoice tables: add space between the BALANCE and STATUS columns.
// Run from the frontend repo root:  node apply-invoice-table-spacing-frontend.cjs
const fs = require('fs'), path = require('path');
const p = path.join(process.cwd(), 'src', 'components', 'accounting', 'AccountingPage.jsx');
if (!fs.existsSync(p)) { console.error('Not found: ' + p); process.exit(1); }
const raw = fs.readFileSync(p, 'utf8'); const eol = raw.includes('\r\n') ? '\r\n' : '\n';
let s = raw.replace(/\r\n/g, '\n');
if (s.includes("paddingLeft: 14 }}>STATUS")) { console.log('Already applied - nothing to do.'); process.exit(0); }
function rep(a, b, label) { const i = s.indexOf(a); if (i < 0 || s.indexOf(a, i + 1) >= 0) { console.error('Could not place: ' + label + '. No changes written.'); process.exit(1); } s = s.slice(0, i) + b + s.slice(i + a.length); }
rep("        <span>STATUS</span>\n        <span />", "        <span style={{ paddingLeft: 14 }}>STATUS</span>\n        <span />", 'header');
rep("          <StatusBadge status={inv.status} />\n          <PayButton", "          <span style={{ paddingLeft: 14 }}><StatusBadge status={inv.status} /></span>\n          <PayButton", 'row');
fs.writeFileSync(p, s.replace(/\n/g, eol), 'utf8');
console.log('Spacing added between BALANCE and STATUS.');
