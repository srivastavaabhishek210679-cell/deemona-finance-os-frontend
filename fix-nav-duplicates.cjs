const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let lines = fs.readFileSync(f, 'utf8').split('\n');

// Track which nav paths we've seen and remove duplicates
const seenPaths = new Set();
const result = [];
let inNavSection = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Detect if we're in nav section (label: lines without comp:)
  const isNavItem = line.includes("label:") && line.includes("path:") && !line.includes("comp:") && !line.includes("title:");
  
  if (isNavItem) {
    const pathMatch = line.match(/path: '([^']+)'/);
    const labelMatch = line.match(/label: '([^']+)'/);
    if (pathMatch && labelMatch) {
      const key = pathMatch[1] + '|' + labelMatch[1];
      if (seenPaths.has(key)) {
        console.log('Removing duplicate:', labelMatch[1], 'at line', i+1);
        continue; // skip duplicate
      }
      seenPaths.add(key);
    }
  }
  result.push(line);
}

fs.writeFileSync(f, result.join('\n'), 'utf8');
const final = fs.readFileSync(f, 'utf8');

// Verify
const checks = ['Workflow Studio', 'Knowledge Graph', 'AI Agents', 'White Label'];
console.log('\nAfter fix:');
checks.forEach(name => {
  const count = (final.match(new RegExp("label: '" + name + "'", 'g')) || []).length;
  console.log(` ${name}: ${count} ${count === 1 ? '✓' : '⚠ ' + count}`);
});
