const fs = require('fs');
const path = require('path');

const FRONTEND = 'C:/deemona-finance-os/frontend/src';
const BACKEND  = 'C:/deemona-finance-os/backend/src';
const FEATURES = path.join(__dirname, 'features');

console.log('Installing Batch 5...\n');

// ── Backend files ─────────────────────────────────────────────
const backendFiles = [
  ['automationRoutes.ts', 'routes/automationRoutes.ts'],
];
backendFiles.forEach(([src, dest]) => {
  const s = path.join(FEATURES, src);
  const d = path.join(BACKEND.replace(/\//g,'\\'), ...dest.split('/'));
  if (fs.existsSync(s)) { fs.copyFileSync(s, d); console.log('✓ Backend:', src); }
});

// ── Run backend patch script ──────────────────────────────────
const patchScript = path.join(__dirname, 'apply-patches-batch5.cjs');
if (fs.existsSync(patchScript)) {
  require(patchScript);
}

// ── Frontend files ────────────────────────────────────────────
const wlSrc = path.join(FEATURES, 'WhiteLabelAndNotifications.jsx');
const wlDest = path.join(FRONTEND.replace(/\//g,'\\'), 'components', 'admin', 'WhiteLabelPage.jsx');
const notifDest = path.join(FRONTEND.replace(/\//g,'\\'), 'components', 'notifications', 'NotificationCenter.jsx');

if (fs.existsSync(wlSrc)) {
  // Write WhiteLabel page
  let content = fs.readFileSync(wlSrc, 'utf8');
  // Extract just the WhiteLabelPage export for the page file
  fs.writeFileSync(wlDest, content, 'utf8');
  // Also create notification center
  fs.mkdirSync(path.dirname(notifDest), { recursive: true });
  fs.writeFileSync(notifDest, content, 'utf8');
  console.log('✓ WhiteLabelPage + NotificationCenter copied');
}

// ── Wire into App.jsx ─────────────────────────────────────────
const appFile = path.join(FRONTEND.replace(/\//g,'\\'), 'App.jsx');
let app = fs.readFileSync(appFile, 'utf8');

// Import WhiteLabelPage
if (!app.includes('WhiteLabelPage')) {
  app = app.replace(
    'import DashboardPage from',
    "import { WhiteLabelPage } from './components/admin/WhiteLabelPage';\nimport DashboardPage from"
  );
  console.log('✓ Import: WhiteLabelPage');
}

// Import NotificationCenter
if (!app.includes('NotificationCenter')) {
  app = app.replace(
    'import DashboardPage from',
    "import { NotificationCenter } from './components/notifications/NotificationCenter';\nimport DashboardPage from"
  );
  console.log('✓ Import: NotificationCenter');
}

// Route: white-label
if (!app.includes('/white-label')) {
  app = app.replace(
    "{ path: '/admin',",
    "{ path: '/white-label', title: 'White-Label', sub: 'Customize branding, colors, and domain.', comp: <WhiteLabelPage /> },\n    { path: '/admin',"
  );
  console.log('✓ Route: /white-label');
}

// Nav: white-label
if (!app.includes("'/white-label'")) {
  app = app.replace(
    "{ path: '/admin',        label: 'Platform Admin',",
    "{ path: '/white-label',  label: 'White Label',     icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },\n      { path: '/admin',        label: 'Platform Admin',"
  );
  console.log('✓ Nav: White Label');
}

// Add notification bell handler in TopBar if not already done
if (!app.includes('NotificationCenter') || !app.includes('showNotifications')) {
  // Add state for notifications in App
  app = app.replace(
    'function Layout({ title, subtitle, children })',
    'function Layout({ title, subtitle, children })'
  );
}

fs.writeFileSync(appFile, app, 'utf8');

console.log('\n✅ Batch 5 installed!');
console.log('Verify: white-label route:', app.includes('/white-label'));
