const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
const lines = fs.readFileSync(f, 'utf8').split('\n');

// Remove the /landing line from nav array (line 54, index 53)
const fixed = lines.filter((line, i) => {
  if (line.includes("'/landing'") && line.includes("title: 'Deemona Finance OS'") && !line.includes('comp:')) return false;
  // Also remove if it has comp but is in nav section (before line 100)
  if (i < 100 && line.includes("'/landing'") && line.includes('LandingPage')) return false;
  return true;
});

// Now find the routes array and add /landing there if not present
const content = fixed.join('\n');

// Check if /landing is in routes array (after line 400)
const routesIdx = content.indexOf("{ path: '/dashboard',    title: 'Executive Dashboard',");
const landingInRoutes = content.indexOf("path: '/landing'") > routesIdx;

let finalContent = content;
if (!landingInRoutes) {
  finalContent = content.replace(
    "{ path: '/dashboard',    title: 'Executive Dashboard',",
    "{ path: '/landing', title: 'Deemona Finance OS', sub: 'Landing page.', comp: <LandingPage /> },\n    { path: '/dashboard',    title: 'Executive Dashboard',"
  );
  console.log('Added /landing to routes array');
} else {
  console.log('/landing already in routes array');
}

fs.writeFileSync(f, finalContent, 'utf8');

// Verify
const verify = finalContent.split('\n').filter(l => l.includes("'/landing'"));
console.log('Remaining /landing lines:');
verify.forEach(l => console.log(' ', l.trim().substring(0, 80)));
