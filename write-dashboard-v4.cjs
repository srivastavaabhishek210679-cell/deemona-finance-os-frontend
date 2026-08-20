const fs = require('fs');
const path = require('path');

const target = 'C:/deemona-finance-os/frontend/src/components/dashboards/FinanceDashboardHub.jsx';
const source = 'C:\Users\Abhishek\Downloads\FinanceDashboardHub.jsx';

const content = fs.readFileSync(source, 'utf8');
fs.writeFileSync(target, content, { encoding: 'utf8', flag: 'w' });

const written = fs.statSync(target).size;
const read = fs.statSync(source).size;
console.log('Source size:', read, 'bytes');
console.log('Written size:', written, 'bytes');
console.log('Match:', read === written ? 'YES âœ“' : 'NO âœ—');
