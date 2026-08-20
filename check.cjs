const fs = require('fs');
const path = 'C:/deemona-finance-os/frontend/src/components/reports/ReportSettingsPage.jsx';
const current = fs.readFileSync(path, 'utf8');
console.log('Current size:', current.length);
console.log('Has useCallback:', current.includes('useCallback'));
console.log('Has toggleEnabled:', current.includes('toggleEnabled'));
console.log('Has All Reports:', current.includes('All Reports'));
