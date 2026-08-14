const fs = require('fs');
const path = require('path');

const FRONTEND = 'C:/deemona-finance-os/frontend/src';
const BACKEND = 'C:/deemona-finance-os/backend/src';
const FEATURES = path.join(__dirname, 'features');

console.log('Installing all features...\n');

// Copy frontend feature files
const frontendFiles = [
  ['BankStatementImporter.jsx', 'components/treasury/BankStatementImporter.jsx'],
  ['DocumentAIPage.jsx',        'components/documentai/DocumentAIPage.jsx'],
  ['OnboardingWizard.jsx',      'pages/OnboardingWizard.jsx'],
];

frontendFiles.forEach(([src, dest]) => {
  const srcPath = path.join(FEATURES, src);
  const destPath = path.join(FRONTEND.replace(/\//g,'\\'), ...dest.split('/'));
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log('✓ Copied:', src, '->', dest);
  } else {
    console.log('✗ Missing:', srcPath);
  }
});

// Wire new routes into App.jsx
const appFile = path.join(FRONTEND.replace(/\//g,'\\'), 'App.jsx');
let app = fs.readFileSync(appFile, 'utf8');

// Add imports
const newImports = [
  ["import BankStatementImporter from './components/treasury/BankStatementImporter';", "BankStatementImporter"],
  ["import OnboardingWizard from './pages/OnboardingWizard';", "OnboardingWizard"],
];

newImports.forEach(([imp, name]) => {
  if (!app.includes(name)) {
    app = app.replace(
      "import DashboardPage from './components/dashboard/DashboardPage';",
      "import DashboardPage from './components/dashboard/DashboardPage';\n" + imp
    );
    console.log('✓ Import added:', name);
  }
});

// Add routes
const newRoutes = [
  { path: '/bank-import', title: 'Bank Statement Import', sub: 'Import CSV statements from Indian banks.', comp: 'BankStatementImporter' },
];

newRoutes.forEach(r => {
  if (!app.includes(r.path + "'")) {
    app = app.replace(
      "{ path: '/treasury',    title: 'Treasury',",
      `{ path: '${r.path}', title: '${r.title}', sub: '${r.sub}', comp: <${r.comp} /> },\n    { path: '/treasury',    title: 'Treasury',`
    );
    console.log('✓ Route added:', r.path);
  }
});

// Add Bank Import to Treasury nav section
if (!app.includes('/bank-import')) {
  app = app.replace(
    "{ path: '/treasury',    label: 'Treasury',",
    "{ path: '/bank-import',  label: 'Bank Import',    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },\n      { path: '/treasury',    label: 'Treasury',"
  );
  console.log('✓ Bank Import nav added');
}

fs.writeFileSync(appFile, app, 'utf8');
console.log('\n✅ Frontend features installed!');
