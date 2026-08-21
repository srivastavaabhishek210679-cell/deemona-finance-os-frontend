const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Fix line 71 - the nav entry needs label and icon, not title/sub/comp
const oldNav = "{ path: '/ai-hub', title: 'AI Intelligence Hub', sub: 'Balance Sheet, Anomaly Detection, Chatbot, Scenarios, Operations, Filing Automation.', comp: <AIIntelligenceHub /> },\n    { path: '/auto-ingest', label: 'Auto-Ingest Hub'";

const newNav = "{ path: '/ai-hub', label: 'AI Intelligence Hub', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.476A3.75 3.75 0 0118 20.25H6a3.75 3.75 0 01-2.988-1.474l-.548-.476z' },\n          { path: '/auto-ingest', label: 'Auto-Ingest Hub'";

c = c.replace(oldNav, newNav);

fs.writeFileSync(f, c, 'utf8');
console.log('Fixed. ai-hub nav entries:');
c.split('\n').forEach((l,i) => { if (l.includes('ai-hub')) console.log((i+1)+':', l.trim()); });
