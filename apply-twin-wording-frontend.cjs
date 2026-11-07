// Digital Twin: stop the AI commentary quoting raw field names and form defaults as facts.
// Run from the frontend repo root:  node apply-twin-wording-frontend.cjs
const fs = require('fs'), path = require('path');
const file = path.join(process.cwd(), 'src', 'components', 'digitaltwin', 'DigitalTwinPage.jsx');
if (!fs.existsSync(file)) { console.error('Not found: ' + file + ' - run this from the frontend repo root.'); process.exit(1); }
const raw = fs.readFileSync(file, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
let s = raw.replace(/\r\n/g, '\n');
if (s.includes('plain business English')) { console.log('Already applied - nothing to do.'); process.exit(0); }
const from = "          'Mention assumptions you relied on. Do not invent facts about the company.',";
const i = s.indexOf(from);
if (i < 0 || s.indexOf(from, i + 1) >= 0) { console.error('Could not place change. No changes written.'); process.exit(1); }
const to = from + "\n          'Write in plain business English. Never quote field names or code words such as total_investment, null, roi_3yr or payback_months; say \"no extra investment\" or \"not calculated\" instead. Figures in INPUTS (such as average salary) may be form defaults the user has not changed, so do not present them as facts about the company.',";
s = s.slice(0, i) + to + s.slice(i + from.length);
fs.writeFileSync(file, s.replace(/\n/g, eol), 'utf8');
console.log('Digital Twin commentary wording updated.');
