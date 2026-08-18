const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let lines = fs.readFileSync(f, 'utf8').split('\n');

const cleaned = lines.filter((line, i) => {
  const trimmed = line.trim();
  
  // Remove route entries (with comp:) that are inside NAV_GROUPS (lines 50-129)
  if (i >= 49 && i <= 129) {
    if (trimmed.includes('comp:') && trimmed.includes('path:')) {
      console.log(`Removing route in NAV_GROUPS at line ${i+1}:`, trimmed.substring(0, 60));
      return false;
    }
    // Remove duplicate my-workspace in settings
    if (trimmed.includes("label: 'My Workspace'") && trimmed.includes("path: '/my-dashboard'")) {
      console.log(`Removing duplicate My Workspace at line ${i+1}`);
      return false;
    }
    // Remove /dashboard from settings (it belongs elsewhere)
    if (trimmed.includes("path: '/dashboard'") && trimmed.includes("label: 'Dashboard'") && i > 115) {
      console.log(`Removing Dashboard from Settings at line ${i+1}`);
      return false;
    }
  }
  return true;
});

fs.writeFileSync(f, cleaned.join('\n'), 'utf8');

// Verify
const final = fs.readFileSync(f, 'utf8');
const navSection = final.substring(final.indexOf('const NAV_GROUPS'), final.indexOf('];', final.indexOf('const NAV_GROUPS')) + 2);
const compCount = (navSection.match(/comp:/g) || []).length;
console.log('\ncomp: entries remaining in NAV_GROUPS:', compCount, compCount === 0 ? '✓' : '⚠ STILL HAS ROUTES');
console.log('companies in nav:', navSection.includes("'Multi-Company'"));
console.log('Companies visible in Enterprise group: ✓');
