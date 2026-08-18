const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let lines = fs.readFileSync(f, 'utf8').split('\n');

// Find the old nav section (line 178 area) and replace it
let navStart = -1;
let navEnd = -1;
let depth = 0;
let inNav = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<nav style=') && lines[i].includes('overflowY')) {
    navStart = i;
    inNav = true;
    depth = 0;
  }
  if (inNav) {
    // Count opening and closing tags
    const opens = (lines[i].match(/<nav|<div|<button|<span/g) || []).length;
    const closes = (lines[i].match(/<\/nav>|<\/div>|<\/button>|<\/span>/g) || []).length;
    depth += opens - closes;
    if (navStart !== i && lines[i].includes('</nav>')) {
      navEnd = i;
      break;
    }
  }
}

console.log('Old nav section:', navStart + 1, 'to', navEnd + 1);

if (navStart > 0 && navEnd > 0) {
  const newNav = [
    "      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>",
    "        <CollapsibleNav />",
    "      </nav>"
  ];
  lines.splice(navStart, navEnd - navStart + 1, ...newNav);
  console.log('✓ Replaced old nav with <CollapsibleNav />');
}

fs.writeFileSync(f, lines.join('\n'), 'utf8');

// Verify
const final = fs.readFileSync(f, 'utf8');
console.log('CollapsibleNav called in nav:', final.includes('<CollapsibleNav />'));
console.log('Old NAV_GROUPS.map still in Sidebar:', final.indexOf('NAV_GROUPS.map') > final.indexOf('function Sidebar'));
