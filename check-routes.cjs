const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Find Routes block
const idx = c.indexOf('<Routes>');
console.log('Routes at:', idx);
console.log('Context:', JSON.stringify(c.substring(idx, idx+200)));
