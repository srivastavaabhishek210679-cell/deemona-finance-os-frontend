const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Fix double brace on ai-hub line
c = c.replace(
  "          { { path: '/ai-hub'",
  "          { path: '/ai-hub'"
);

fs.writeFileSync(f, c, 'utf8');
console.log('Fixed. Verify:');
const lines = c.split('\n');
for (let i=67; i<=73; i++) console.log((i+1)+':', lines[i]);
