const fs = require('fs');
const file = 'C:\\deemona-finance-os\\frontend\\src\\App.jsx';
let c = fs.readFileSync(file, 'utf8');

// Add import if missing
if (!c.includes('DashboardPage')) {
  c = c.replace(
    "import DataExportPage from './components/dataexport/DataExportPage';",
    "import DataExportPage from './components/dataexport/DataExportPage';\nimport DashboardPage from './components/dashboard/DashboardPage';"
  );
}

// Add route if missing
if (!c.includes('/dashboard')) {
  c = c.replace(
    "{ path: '/admin',        title: 'Platform Admin',",
    "{ path: '/dashboard',    title: 'Executive Dashboard',   sub: 'Charts, KPIs, and financial analytics.',        comp: <DashboardPage /> },\n    { path: '/admin',        title: 'Platform Admin',"
  );
}

// Add to nav groups - Settings section
c = c.replace(
  "{ path: '/admin',        label: 'Platform Admin',",
  "{ path: '/dashboard',    label: 'Dashboard',          icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },\n      { path: '/admin',        label: 'Platform Admin',"
);

fs.writeFileSync(file, c, 'utf8');
console.log('Dashboard wired into App.jsx');
