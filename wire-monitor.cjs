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

// Add nav item
if (!c.includes('Drive Monitor')) {
  c = c.replace(
    "{ path: '/marketplace',  label: 'Marketplace',",
    "{ path: '/drive-monitor', label: 'Drive Monitor', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },\n      { path: '/marketplace',  label: 'Marketplace',"
  );
  console.log('Nav item added');
}

fs.writeFileSync(f, c, 'utf8');
console.log('Done. DriveMonitorPage:', c.includes('DriveMonitorPage'));
console.log('Drive Monitor nav:', c.includes('Drive Monitor'));
