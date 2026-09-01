const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Find exact Layout function boundaries
const layoutStart = c.indexOf('function Layout(');
const layoutEnd = c.indexOf('\nfunction ', layoutStart + 10);
console.log('Layout from', layoutStart, 'to', layoutEnd);
console.log('Layout preview:', JSON.stringify(c.substring(layoutStart, layoutStart+200)));
