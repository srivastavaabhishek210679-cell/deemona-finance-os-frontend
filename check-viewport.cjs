const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Add viewport meta if not in index.html
const indexHtml = 'C:/deemona-finance-os/frontend/index.html';
let html = fs.readFileSync(indexHtml, 'utf8');
console.log('Has viewport meta:', html.includes('viewport'));
console.log('Viewport line:', html.match(/viewport[^>]*/)?.[0]);
