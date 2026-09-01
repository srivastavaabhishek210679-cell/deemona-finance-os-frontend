const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/auth/AuthPages.jsx';
let lines = fs.readFileSync(f, 'utf8').split('\n');

// Find the real start of the file (import statement)
let realStart = lines.findIndex(l => l.includes('import') && l.includes('api'));
console.log('Real file starts at line:', realStart+1);

// Remove BOM and get clean content from real start
let clean = lines.slice(realStart).join('\n');
clean = clean.replace(/^\uFEFF/, ''); // Remove BOM

fs.writeFileSync(f, clean, 'utf8');
console.log('Cleaned. New line 1:', clean.split('\n')[0]);
console.log('File size:', fs.statSync(f).size);
