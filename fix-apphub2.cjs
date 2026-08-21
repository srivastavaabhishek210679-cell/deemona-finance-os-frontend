const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Fix all double braces on ai-hub lines
c = c.replace(/\{ \{ path: '\/ai-hub'/g, "{ path: '/ai-hub'");

fs.writeFileSync(f, c, 'utf8');
const count = (c.match(/\{ \{ path:/g)||[]).length;
console.log('Remaining double braces:', count);
const lines = c.split('\n');
for (let i=468; i<=474; i++) console.log((i+1)+':', lines[i]);
