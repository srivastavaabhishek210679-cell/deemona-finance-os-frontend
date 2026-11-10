// Fixes the Accounting Agent tab ("Route not found"): the page called /api/agent/..., the backend serves /api/agents/accounting/... Idempotent. Run in the frontend folder.
const fs = require('fs');
const f = 'src/components/accounting/AccountingPage.jsx';
if (!fs.existsSync(f)) { console.error('Run this from the frontend folder'); process.exit(1); }
const raw = fs.readFileSync(f, 'utf8'); const bom = raw.charCodeAt(0) === 0xFEFF; const crlf = raw.includes('\r\n');
let s = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n');
const bad = "const AGENT_API = apiURL('/api/agent');", good = "const AGENT_API = apiURL('/api/agents/accounting');";
if (s.includes(good)) { console.log('no change', f); process.exit(0); }
if (!s.includes(bad)) { console.error('anchor not found in ' + f); process.exit(1); }
s = s.replace(bad, () => good);
fs.writeFileSync(f, (bom ? '﻿' : '') + (crlf ? s.replace(/\n/g, '\r\n') : s)); console.log('patched', f);
