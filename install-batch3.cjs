const fs = require('fs');
const path = require('path');

const FRONTEND = 'C:/deemona-finance-os/frontend/src';
const FEATURES = path.join(__dirname, 'features');

console.log('Installing Batch 3 features...\n');

// Copy frontend files
const files = [
  ['AuditTrailPage.jsx',   'components/audit/AuditTrailPage.jsx'],
  ['MultiCompanyPage.jsx', 'components/admin/MultiCompanyPage.jsx'],
  ['APIMarketplace.jsx',   'components/marketplace/APIMarketplace.jsx'],
];

files.forEach(([src, dest]) => {
  const srcPath = path.join(FEATURES, src);
  const destPath = path.join(FRONTEND.replace(/\//g,'\\'), ...dest.split('/'));
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log('✓ Copied:', src);
  } else {
    console.log('✗ Missing:', srcPath);
  }
});

// Wire into App.jsx
const appFile = path.join(FRONTEND.replace(/\//g,'\\'), 'App.jsx');
let app = fs.readFileSync(appFile, 'utf8');

// Imports
const imports = [
  ["import AuditTrailPage from './components/audit/AuditTrailPage';", 'AuditTrailPage'],
  ["import MultiCompanyPage from './components/admin/MultiCompanyPage';", 'MultiCompanyPage'],
  ["import NewAPIMarketplace from './components/marketplace/APIMarketplace';", 'NewAPIMarketplace'],
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
const routes = [
  { path: '/audit-trail',   title: 'Audit Trail',        sub: 'Complete event history and change log.',        comp: 'AuditTrailPage' },
  { path: '/companies',     title: 'Multi-Company',      sub: 'Manage subsidiaries, branches, and group P&L.', comp: 'MultiCompanyPage' },
  { path: '/api-portal',    title: 'API Marketplace',    sub: 'REST API, webhooks, SDKs, and playground.',     comp: 'NewAPIMarketplace' },
];

routes.forEach(r => {
  if (!app.includes("'" + r.path + "'")) {
    app = app.replace(
      "{ path: '/admin',        title: 'Platform Admin',",
      `{ path: '${r.path}', title: '${r.title}', sub: '${r.sub}', comp: <${r.comp} /> },\n    { path: '/admin',        title: 'Platform Admin',`
    );
    console.log('✓ Route:', r.path);
  }
});

// Nav items
const navItems = [
  { path: '/audit-trail',  label: 'Audit Trail',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { path: '/companies',    label: 'Multi-Company', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { path: '/api-portal',   label: 'API Portal',    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
];

navItems.forEach(item => {
  if (!app.includes("'" + item.path + "'")) {
    app = app.replace(
      "{ path: '/admin',        label: 'Platform Admin',",
      `{ path: '${item.path}', label: '${item.label}', icon: '${item.icon}' },\n      { path: '/admin',        label: 'Platform Admin',`
    );
    console.log('✓ Nav:', item.label);
  }
});

fs.writeFileSync(appFile, app, 'utf8');
console.log('\n✅ Batch 3 installed!');
