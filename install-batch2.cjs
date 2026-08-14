const fs = require('fs');
const path = require('path');

const FRONTEND = 'C:/deemona-finance-os/frontend/src';
const BACKEND = 'C:/deemona-finance-os/backend/src';
const FEATURES = path.join(__dirname, 'features');

console.log('Installing Batch 2 features...\n');

// ── Backend: Copy new routes ──────────────────────────────────
const backendFiles = [
  ['whatsappRoutes.ts',  'routes/whatsappRoutes.ts'],
  ['currencyRoutes.ts',  'routes/currencyRoutes.ts'],
];

backendFiles.forEach(([src, dest]) => {
  const srcPath = path.join(FEATURES, src);
  const destPath = path.join(BACKEND.replace(/\//g,'\\'), ...dest.split('/'));
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log('✓ Backend:', src);
  }
});

// ── Backend: Wire new routes into index.ts ────────────────────
const indexFile = path.join(BACKEND.replace(/\//g,'\\'), 'index.ts');
let idx = fs.readFileSync(indexFile, 'utf8');

// Add currency router import and mount
if (!idx.includes('createCurrencyRouter')) {
  idx = idx.replace(
    "import { createWhatsAppRouter }",
    "import { createCurrencyRouter } from './routes/currencyRoutes';\nimport { createWhatsAppRouter }"
  );
  idx = idx.replace(
    "app.use('/api/whatsapp',",
    "app.use('/api/currency', createCurrencyRouter(pool));\napp.use('/api/whatsapp',"
  );
  fs.writeFileSync(indexFile, idx, 'utf8');
  console.log('✓ Currency router wired in backend');
}

// ── Frontend: Copy new components ────────────────────────────
const frontendFiles = [
  ['CustomReportBuilder.jsx', 'components/reports/CustomReportBuilder.jsx'],
];

frontendFiles.forEach(([src, dest]) => {
  const srcPath = path.join(FEATURES, src);
  const destPath = path.join(FRONTEND.replace(/\//g,'\\'), ...dest.split('/'));
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log('✓ Frontend:', src);
  }
});

// ── Frontend: Wire into App.jsx ───────────────────────────────
const appFile = path.join(FRONTEND.replace(/\//g,'\\'), 'App.jsx');
let app = fs.readFileSync(appFile, 'utf8');

// Imports
const imports = [
  ["import CustomReportBuilder from './components/reports/CustomReportBuilder';", 'CustomReportBuilder'],
];

imports.forEach(([imp, name]) => {
  if (!app.includes(name)) {
    app = app.replace(
      "import DashboardPage from './components/dashboard/DashboardPage';",
      "import DashboardPage from './components/dashboard/DashboardPage';\n" + imp
    );
    console.log('✓ Import:', name);
  }
});

// Routes
if (!app.includes('/reports')) {
  app = app.replace(
    "{ path: '/export',",
    "{ path: '/reports', title: 'Report Builder', sub: 'Custom reports with AI insights.', comp: <CustomReportBuilder /> },\n    { path: '/export',"
  );
  console.log('✓ Route: /reports');
}

// Nav
if (!app.includes('/reports')) {
  app = app.replace(
    "{ path: '/export',       label: 'Data Export',",
    "{ path: '/reports',       label: 'Report Builder',  icon: 'M9 17v-2m3 2v-4m3 4v-6M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z' },\n      { path: '/export',       label: 'Data Export',"
  );
  console.log('✓ Nav: Report Builder');
}

fs.writeFileSync(appFile, app, 'utf8');
console.log('\n✅ Batch 2 installed!');
