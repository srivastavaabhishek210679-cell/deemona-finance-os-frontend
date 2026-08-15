const fs = require('fs');
const path = require('path');

const FRONTEND = 'C:/deemona-finance-os/frontend/src';
const FEATURES = path.join(__dirname, 'features');

console.log('Installing Batch 4 features...\n');

// ── Copy frontend files ───────────────────────────────────────
const files = [
  ['GSTPortalPage.jsx', 'components/tax/GSTPortalPage.jsx'],
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

// ── Append responsive CSS ─────────────────────────────────────
const cssFile = path.join(FRONTEND.replace(/\//g,'\\'), 'styles', 'global.css');
const cssAddition = path.join(FEATURES, 'responsive.css');
if (fs.existsSync(cssFile) && fs.existsSync(cssAddition)) {
  const existing = fs.readFileSync(cssFile, 'utf8');
  if (!existing.includes('Mobile Responsive Styles')) {
    const addition = fs.readFileSync(cssAddition, 'utf8');
    fs.writeFileSync(cssFile, existing + '\n\n' + addition, 'utf8');
    console.log('✓ Responsive CSS appended to global.css');
  } else {
    console.log('- Responsive CSS already present');
  }
}

// ── Wire into App.jsx ─────────────────────────────────────────
const appFile = path.join(FRONTEND.replace(/\//g,'\\'), 'App.jsx');
let app = fs.readFileSync(appFile, 'utf8');

// Import
if (!app.includes('GSTPortalPage')) {
  app = app.replace(
    "import DashboardPage from './components/dashboard/DashboardPage';",
    "import DashboardPage from './components/dashboard/DashboardPage';\nimport GSTPortalPage from './components/tax/GSTPortalPage';"
  );
  console.log('✓ Import: GSTPortalPage');
}

// Route
if (!app.includes('/gst-portal')) {
  app = app.replace(
    "{ path: '/tax',",
    "{ path: '/gst-portal', title: 'GST Portal', sub: 'File returns, track ITC, and manage compliance.', comp: <GSTPortalPage /> },\n    { path: '/tax',"
  );
  console.log('✓ Route: /gst-portal');
}

// Nav
if (!app.includes('/gst-portal')) {
  app = app.replace(
    "{ path: '/tax',          label: 'Tax & GST',",
    "{ path: '/gst-portal',   label: 'GST Portal',     icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },\n      { path: '/tax',          label: 'Tax & GST',"
  );
  console.log('✓ Nav: GST Portal');
}

fs.writeFileSync(appFile, app, 'utf8');

// ── Verify ────────────────────────────────────────────────────
const final = fs.readFileSync(appFile, 'utf8');
console.log('\nVerification:');
console.log('GSTPortalPage import:', final.includes('GSTPortalPage'));
console.log('/gst-portal route:', final.includes('/gst-portal'));

console.log('\n✅ Batch 4 installed!');
