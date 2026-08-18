const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/automation/AutomationLogsPage.jsx';
let c = fs.readFileSync(f, 'utf8');

// Fix 1: Safe replace on automation_type in filter
c = c.replace(
  "logs.filter(l => l.automation_type === filter)",
  "logs.filter(l => (l.automation_type || '') === filter)"
);

// Fix 2: Safe replace in uniqueTypes
c = c.replace(
  "const uniqueTypes = [...new Set(logs.map(l => l.automation_type))];",
  "const uniqueTypes = [...new Set(logs.map(l => l.automation_type).filter(Boolean))];"
);

// Fix 3: Safe replace in type filter buttons
c = c.replace(
  "{uniqueTypes.map(type => (\n              <button key={type} onClick={() => setFilter(type)}",
  "{uniqueTypes.filter(Boolean).map(type => (\n              <button key={type} onClick={() => setFilter(type)}"
);

// Fix 4: Safe .replace() calls on automation_type in table
c = c.replace(
  /log\.automation_type\?\.replace\(/_g, "g, match => "(log.automation_type || '').replace("
);

// Safer: replace all ?.replace( patterns on automation_type
c = c.split('log.automation_type?.replace(').join("(log.automation_type||'').replace(");
c = c.split('log.automation_type?.toLowerCase()').join("(log.automation_type||'').toLowerCase()");

// Fix 5: Safe type badge in table
c = c.replace(
  "{log.automation_type?.replace(/_/g,' ')}",
  "{(log.automation_type||'unknown').replace(/_/g,' ')}"
);

// Fix 6: Safe color lookup
c = c.replace(
  "(TYPE_COLORS[log.automation_type]||'#64748B')+'15'",
  "(TYPE_COLORS[log.automation_type||'']||'#64748B')+'15'"
);
c = c.replace(
  "TYPE_COLORS[log.automation_type]||'#64748B'",
  "TYPE_COLORS[log.automation_type||'']||'#64748B'"
);

fs.writeFileSync(f, c, 'utf8');
console.log('Fixed null safety for automation_type');
