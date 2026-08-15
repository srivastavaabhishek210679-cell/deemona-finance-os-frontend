const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Find the routes array anchor - use a unique string from routes section
const routesStart = c.indexOf("{ path: '/dashboard',    title: 'Executive Dashboard',");
const navStart = c.indexOf("{ path: '/dashboard',    label: 'Dashboard',");

console.log('Routes array position:', routesStart);
console.log('Nav array position:', navStart);
console.log('Onboarding currently in routes:', c.includes("title: 'Setup Wizard'"));
console.log('Onboarding currently in nav:', c.includes("label: 'Setup Wizard'") || c.includes("comp: <OnboardingWizard"));

// Remove onboarding from nav if it's there
if (navStart > 0) {
  const navSection = c.substring(navStart - 200, navStart + 50);
  console.log('Nav context:', navSection.substring(0, 100));
}

// Add to routes array if not there
if (!c.includes("title: 'Setup Wizard'")) {
  const anchor = "{ path: '/dashboard',    title: 'Executive Dashboard',";
  c = c.replace(anchor,
    "{ path: '/onboarding', title: 'Setup Wizard', sub: '5-step setup.', comp: <OnboardingWizard onComplete={() => { window.location.href = '/dashboard'; }} /> },\n    " + anchor
  );
  console.log('Added to routes array');
}

fs.writeFileSync(f, c, 'utf8');
console.log('Saved. Setup Wizard in file:', c.includes("title: 'Setup Wizard'"));
