// Digital Twin polish: readable risk/opportunity text, collections-aware verdict, honest cash labels.
// Run from the frontend repo root after the other twin patches:  node apply-twin-polish-frontend.cjs
const fs = require('fs'), path = require('path');
const file = path.join(process.cwd(), 'src', 'components', 'digitaltwin', 'DigitalTwinPage.jsx');
if (!fs.existsSync(file)) { console.error('Not found: ' + file + ' - run this from the frontend repo root.'); process.exit(1); }
const raw = fs.readFileSync(file, 'utf8');
const eol = raw.includes('\r\n') ? '\r\n' : '\n';
let s = raw.replace(/\r\n/g, '\n');
if (s.includes('collectionNote')) { console.log('Already applied - nothing to do.'); process.exit(0); }
if (!s.includes('computeProjection')) { console.error('Run apply-twin-compute-frontend.cjs first. No changes made.'); process.exit(1); }
function rep(from, to, label) {
  const i = s.indexOf(from);
  if (i < 0 || s.indexOf(from, i + 1) >= 0) { console.error('Could not place change: ' + label + '. No changes written.'); process.exit(1); }
  s = s.slice(0, i) + to + s.slice(i + from.length);
}
rep("fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{item}", "fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>{item}", 'text colour');
rep("icon: 'down' }", "icon: '>' }", 'recommendation icon');
rep('function computeProjection(inp) {', 'function computeProjection(inp, ctx) {', 'signature');
rep('const calc = computeProjection(inputs);', 'const calc = computeProjection(inputs, ctx);', 'call site');
rep("  const summary = 'Revenue grows from '",
`  const dso = ctx && ctx.position ? Number(ctx.position.dso_days) : NaN;
  let collectionNote = '';
  if (Number.isFinite(dso) && dso > 90) {
    if (verdict === 'POSITIVE') verdict = 'CAUTION';
    collectionNote = ' Caution: your books show customers taking about ' + Math.round(dso) + ' days to pay, so profit on paper may not turn into cash soon.';
  }
  const summary = 'Revenue grows from '`, 'verdict guard');
rep("no extra revenue is assumed from the new hires, office or product.';", "no extra revenue is assumed from the new hires, office or product.' + collectionNote;", 'summary note');
rep("{ label: 'Cash Flow', value: yr.cash_flow,", "{ label: 'Cash Flow (if collected)', value: yr.cash_flow,", 'cash label');
rep('Monthly Cash Flow  -  Year 1', 'Monthly result before collections  -  Year 1', 'chart title');
fs.writeFileSync(file, s.replace(/\n/g, eol), 'utf8');
console.log('Digital Twin polish applied.');
