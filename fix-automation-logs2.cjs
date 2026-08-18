const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/automation/AutomationLogsPage.jsx';
let c = fs.readFileSync(f, 'utf8');

// Fix all unsafe automation_type accesses
c = c.split('log.automation_type?.replace(').join("(log.automation_type||'').replace(");
c = c.split('log.automation_type?.toLowerCase()').join("(log.automation_type||'').toLowerCase()");
c = c.split('l.automation_type === filter').join("(l.automation_type||'') === filter");
c = c.split('logs.map(l => l.automation_type))').join("logs.map(l => l.automation_type).filter(Boolean))");
c = c.split("TYPE_COLORS[log.automation_type]").join("TYPE_COLORS[log.automation_type||'']");
c = c.split("l.automation_type?.includes(").join("(l.automation_type||'').includes(");

// Add a v2 comment to force git to see change
c = '// v2 - null safe\n' + c;

fs.writeFileSync(f, c, 'utf8');
console.log('Fixed. Size:', c.length);
console.log('Has null-safe replace:', c.includes("(log.automation_type||'').replace(") || c.includes("(l.automation_type||'')"));
