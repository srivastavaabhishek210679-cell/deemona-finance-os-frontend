const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/auth/AuthPages.jsx';
let c = fs.readFileSync(f, 'utf8');

// Find register form - look for useState patterns
const hasTerms = c.includes('termsAccepted');
console.log('Has terms already:', hasTerms);
if (hasTerms) { console.log('Already done'); process.exit(0); }

// Find password state in register section
const registerIdx = c.indexOf('Register') > 0 ? c.indexOf('Register') : 0;
console.log('File size:', c.length);

// Show register-related content
const passIdx = c.indexOf("setPassword]");
console.log('Password state at:', passIdx);
console.log('Context:', c.substring(passIdx-50, passIdx+100));
