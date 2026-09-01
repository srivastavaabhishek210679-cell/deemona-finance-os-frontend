const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/auth/AuthPages.jsx';
let c = fs.readFileSync(f, 'utf8');

// Remove BOM and leading whitespace/junk before import
c = c.replace(/^[\s\uFEFF\xA0]+/, '');

// Make sure it starts with import
console.log('Starts with:', c.substring(0,50));

fs.writeFileSync(f, c, 'utf8');
console.log('Done. Line 1:', c.split('\n')[0]);
