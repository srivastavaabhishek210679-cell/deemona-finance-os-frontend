const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// The onboarding entry in nav array has 'title' instead of 'label'
// It appears around position 10071 (nav area)
// Find and remove it
const lines = c.split('\n');
const fixed = lines.filter(line => {
  // Remove line if it's the onboarding nav entry (has title not label, in nav section)
  if (line.includes("'/onboarding'") && line.includes("title: 'Setup Wizard'") && !line.includes('comp:')) {
    console.log('Removing nav line:', line.trim());
    return false;
  }
  return true;
});

c = fixed.join('\n');
fs.writeFileSync(f, c, 'utf8');

// Verify
const remaining = c.split('\n').filter(l => l.includes("'/onboarding'"));
console.log('Remaining /onboarding lines:');
remaining.forEach(l => console.log(' ', l.trim()));
