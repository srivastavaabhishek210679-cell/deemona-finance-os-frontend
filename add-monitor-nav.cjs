const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Add import
if (!c.includes('DriveMonitorPage')) {
  c = c.replace(
    "import DashboardPage from './components/dashboard/DashboardPage';",
    "import DriveMonitorPage from './components/monitor/DriveMonitorPage';\nimport DashboardPage from './components/dashboard/DashboardPage';"
  );
  console.log('Import added');
}

// Add to routes array
if (!c.includes("'/drive-monitor'")) {
  c = c.replace(
    "{ path: '/dashboard',    title: 'Executive Dashboard',",
    "{ path: '/drive-monitor', title: 'Drive Monitor', sub: 'Autonomous Google Drive financial file monitoring.', comp: <DriveMonitorPage /> },\n    { path: '/dashboard',    title: 'Executive Dashboard',"
  );
  console.log('Route added');
}

// Add to Enterprise nav group
if (!c.includes("label: 'Drive Monitor'")) {
  c = c.replace(
    "{ path: '/audit-trail',  label: 'Audit Trail',",
    "{ path: '/drive-monitor', label: 'Drive Monitor', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },\n      { path: '/audit-trail',  label: 'Audit Trail',"
  );
  console.log('Nav item added to Enterprise group');
}

fs.writeFileSync(f, c, 'utf8');
console.log('Done.');
console.log('DriveMonitorPage import:', c.includes('DriveMonitorPage'));
console.log('/drive-monitor route:', c.includes("'/drive-monitor'"));
console.log('Drive Monitor nav:', c.includes("label: 'Drive Monitor'"));
