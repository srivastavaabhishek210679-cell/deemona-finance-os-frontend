const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

const before = c.length;

// Add imports
if (!c.includes('OnboardingWizard')) {
  c = c.replace(
    "import DashboardPage from './components/dashboard/DashboardPage';",
    "import OnboardingWizard from './pages/OnboardingWizard';\nimport GSTPortalPage from './components/tax/GSTPortalPage';\nimport DashboardPage from './components/dashboard/DashboardPage';"
  );
}

// Find a route that definitely exists and add before it
const anchor = c.indexOf("path: '/accounting'");
if (anchor === -1) {
  console.log('ERROR: Could not find /accounting route anchor');
  process.exit(1);
}

// Add routes if missing
if (!c.includes("'/onboarding'")) {
  c = c.replace(
    "{ path: '/dashboard',",
    "{ path: '/onboarding', title: 'Onboarding', sub: 'Setup wizard.', comp: <OnboardingWizard onComplete={() => { window.location.href='/dashboard'; }} /> },\n    { path: '/dashboard',"
  );
}

if (!c.includes("'/gst-portal'")) {
  c = c.replace(
    "{ path: '/tax',",
    "{ path: '/gst-portal', title: 'GST Portal', sub: 'File GST returns and track ITC.', comp: <GSTPortalPage /> },\n    { path: '/tax',"
  );
}

// Add nav items
if (!c.includes("label: 'GST Portal'")) {
  c = c.replace(
    "{ path: '/tax',          label: 'Tax & GST',",
    "{ path: '/gst-portal',   label: 'GST Portal',     icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },\n      { path: '/tax',          label: 'Tax & GST',"
  );
}

fs.writeFileSync(f, c, 'utf8');

const after = c.length;
console.log('File size before:', before, '| after:', after);
console.log('OnboardingWizard import:', c.includes('OnboardingWizard'));
console.log('GSTPortalPage import:', c.includes('GSTPortalPage'));
console.log('/onboarding route:', c.includes("'/onboarding'"));
console.log('/gst-portal route:', c.includes("'/gst-portal'"));
console.log('GST Portal nav:', c.includes("label: 'GST Portal'"));
