const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Add route
if (!c.includes("governance-docs")) {
  // Add route after compliance-docs route
  c = c.replace(
    "{ path: '/compliance-docs',",
    "{ path: '/governance-docs', title: 'Governance Docs', sub: 'Corporate charter, policies, KYC, regulatory filings.', comp: <Batch3DocsPage /> },\n    { path: '/compliance-docs',"
  );
  console.log('Route added');
}

// Add nav item
if (!c.includes("Governance Docs")) {
  c = c.replace(
    "{ path: '/compliance-docs', label: 'Compliance Docs',",
    "{ path: '/governance-docs', label: 'Governance Docs', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },\n          { path: '/compliance-docs', label: 'Compliance Docs',"
  );
  console.log('Nav added');
}

fs.writeFileSync(f, c, 'utf8');
console.log('Done');
console.log('Has governance-docs:', c.includes('governance-docs'));
console.log('Has Governance Docs:', c.includes('Governance Docs'));
