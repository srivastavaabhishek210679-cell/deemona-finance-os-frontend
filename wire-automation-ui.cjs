const fs = require('fs');
const BACKEND = 'C:/deemona-finance-os/backend/src';
const FRONTEND = 'C:/deemona-finance-os/frontend/src';

// 1. Copy automationTestRoutes.ts to backend
const testRoutesSrc = __dirname + '/automationTestRoutes.ts';
const testRoutesDest = BACKEND.replace(/\//g,'\\') + '\\routes\\automationTestRoutes.ts';
fs.copyFileSync(testRoutesSrc, testRoutesDest);
console.log('✓ automationTestRoutes.ts copied to backend');

// 2. Wire into index.ts
const indexFile = BACKEND.replace(/\//g,'\\') + '\\index.ts';
let idx = fs.readFileSync(indexFile, 'utf8');

if (!idx.includes('createAutomationTestRouter')) {
  idx = idx.replace(
    "import { createMonitorSettingsRouter }",
    "import { createAutomationTestRouter } from './routes/automationTestRoutes';\nimport { createMonitorSettingsRouter }"
  );
  idx = idx.replace(
    "app.use('/api/monitor',",
    "app.use('/api/automation', createAutomationTestRouter(pool));\n  app.use('/api/monitor',"
  );
  fs.writeFileSync(indexFile, idx, 'utf8');
  console.log('✓ Automation test routes wired into index.ts');
}

// 3. Copy frontend page
const frontendSrc = __dirname + '/AutomationLogsPage.jsx';
const frontendDir = FRONTEND.replace(/\//g,'\\') + '\\components\\automation';
if (!fs.existsSync(frontendDir)) fs.mkdirSync(frontendDir, { recursive: true });
fs.copyFileSync(frontendSrc, frontendDir + '\\AutomationLogsPage.jsx');
console.log('✓ AutomationLogsPage.jsx copied to frontend');

// 4. Wire into App.jsx
const appFile = FRONTEND.replace(/\//g,'\\') + '\\App.jsx';
let app = fs.readFileSync(appFile, 'utf8');

if (!app.includes('AutomationLogsPage')) {
  app = app.replace(
    "import DriveMonitorPage from",
    "import AutomationLogsPage from './components/automation/AutomationLogsPage';\nimport DriveMonitorPage from"
  );
  // Add to routes array
  app = app.replace(
    "{ path: '/drive-monitor', title: 'Drive Monitor',",
    "{ path: '/automation-logs', title: 'Automation Center', sub: 'Monitor and test all automated workflows.', comp: <AutomationLogsPage /> },\n    { path: '/drive-monitor', title: 'Drive Monitor',"
  );
  // Add to AI Agents nav group
  app = app.replace(
    "{ path: '/automation',   label: 'Automation',",
    "{ path: '/automation-logs', label: 'Automation Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },\n      { path: '/automation',   label: 'Automation',"
  );
  fs.writeFileSync(appFile, app, 'utf8');
  console.log('✓ AutomationLogsPage wired into App.jsx');
}

console.log('\n✅ Automation UI setup complete!');
