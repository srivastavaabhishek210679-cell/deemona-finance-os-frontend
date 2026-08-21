const fs = require('fs');
const path = 'C:/deemona-finance-os/frontend/src/components/intelligence/AIIntelligenceHub.jsx';
let c = fs.readFileSync(path, 'utf8');
// The file was written correctly - check actual content
console.log('File size:', c.length);
console.log('Has unicode escapes:', c.includes('\\\\u'));
console.log('Sample:', c.substring(100, 200));
