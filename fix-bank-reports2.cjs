const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Add imports
if (!c.includes('BankStatementImporter')) {
  c = c.replace(
    "import DashboardPage from './components/dashboard/DashboardPage';",
    "import BankStatementImporter from './components/treasury/BankStatementImporter';\nimport CustomReportBuilder from './components/reports/CustomReportBuilder';\nimport DashboardPage from './components/dashboard/DashboardPage';"
  );
  console.log('✓ Imports added');
} else {
  console.log('- Imports already present');
}

// Add bank-import route before treasury
if (!c.includes("'/bank-import'")) {
  c = c.replace(
    "{ path: '/treasury',     title: 'Treasury',",
    "{ path: '/bank-import',  title: 'Bank Import',    sub: 'Import CSV statements from Indian banks.', comp: <BankStatementImporter /> },\n    { path: '/treasury',     title: 'Treasury',"
  );
  console.log('✓ /bank-import route added');
} else {
  console.log('- /bank-import already present');
}

// Add reports route before budgeting
if (!c.includes("'/reports'")) {
  c = c.replace(
    "{ path: '/budgeting',    title: 'Budgeting',",
    "{ path: '/reports',      title: 'Custom Reports', sub: 'Build and export custom financial reports.', comp: <CustomReportBuilder /> },\n    { path: '/budgeting',    title: 'Budgeting',"
  );
  console.log('✓ /reports route added');
} else {
  console.log('- /reports already present');
}

fs.writeFileSync(f, c, 'utf8');
console.log('\nResults:');
console.log('BankStatementImporter:', c.includes('BankStatementImporter'));
console.log('CustomReportBuilder:', c.includes('CustomReportBuilder'));
console.log('/bank-import:', c.includes("'/bank-import'"));
console.log('/reports:', c.includes("'/reports'"));
