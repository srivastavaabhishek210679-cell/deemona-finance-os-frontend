const fs = require('fs');

// Wire all new dashboard pages into App.jsx
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Add imports
const imports = `import EnterpriseFinanceDashboard from './components/dashboards/EnterpriseFinanceDashboard';
import CollectionsDunningDashboard from './components/dashboards/CollectionsDunningDashboard';
`;

if (!c.includes('EnterpriseFinanceDashboard')) {
  const lastImport = c.lastIndexOf("import ");
  const end = c.indexOf('\n', lastImport) + 1;
  c = c.slice(0, end) + imports + c.slice(end);
  console.log('Imports added');
}

// Add routes
if (!c.includes("enterprise-finance")) {
  c = c.replace(
    "{ path: '/corporate-docs', title: 'Corporate Documents',",
    "{ path: '/enterprise-finance', title: 'Enterprise Financial Performance', sub: 'Consolidated P&L, KPIs, AR/AP, budget and operational overview.', comp: <EnterpriseFinanceDashboard /> },\n    { path: '/collections-dunning', title: 'Collections & Dunning', sub: 'Overdue invoices, collection performance and dunning actions.', comp: <CollectionsDunningDashboard /> },\n    { path: '/corporate-docs', title: 'Corporate Documents',"
  );
  console.log('Routes added');
}

// Add to nav - Intelligence group
if (!c.includes("Enterprise Finance")) {
  c = c.replace(
    "{ path: '/decision-center', label: 'Decision Center',",
    "{ path: '/enterprise-finance', label: 'Enterprise Finance', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },\n          { path: '/collections-dunning', label: 'Collections', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },\n          { path: '/decision-center', label: 'Decision Center',"
  );
  console.log('Nav added');
}

fs.writeFileSync(f, c, 'utf8');
console.log('Done');
console.log('Has EnterpriseFinanceDashboard:', c.includes('EnterpriseFinanceDashboard'));
console.log('Has enterprise-finance route:', c.includes("path: '/enterprise-finance'"));
