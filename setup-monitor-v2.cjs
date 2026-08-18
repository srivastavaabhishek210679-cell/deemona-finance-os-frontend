const fs = require('fs');
const path = require('path');
const BACKEND = 'C:/deemona-finance-os/backend/src';

// 1. Copy new monitor service
const monitorSrc = path.join(__dirname, 'driveMonitorMultiTenant.ts');
const monitorDest = path.join(BACKEND.replace(/\//g,'\\'), 'services', 'driveMonitorMultiTenant.ts');
fs.copyFileSync(monitorSrc, monitorDest);
console.log('✓ driveMonitorMultiTenant.ts copied');

// 2. Copy new routes
const routesSrc = path.join(__dirname, 'monitorSettingsRoutes.ts');
const routesDest = path.join(BACKEND.replace(/\//g,'\\'), 'routes', 'monitorSettingsRoutes.ts');
fs.copyFileSync(routesSrc, routesDest);
console.log('✓ monitorSettingsRoutes.ts copied');

// 3. Update index.ts
const indexFile = path.join(BACKEND.replace(/\//g,'\\'), 'index.ts');
let idx = fs.readFileSync(indexFile, 'utf8');

// Replace old monitor import with new multi-tenant one
if (!idx.includes('startMultiTenantMonitor')) {
  idx = idx.replace(
    "import { startMonitoringLoop } from './services/driveMonitor';",
    "import { startMultiTenantMonitor } from './services/driveMonitorMultiTenant';"
  );
  idx = idx.replace(
    "import { createMonitorRouter } from './routes/monitorRoutes';",
    "import { createMonitorSettingsRouter } from './routes/monitorSettingsRoutes';"
  );
  idx = idx.replace(
    "app.use('/api/monitor', createMonitorRouter());",
    "app.use('/api/monitor', createMonitorSettingsRouter(pool));"
  );
  idx = idx.replace(
    "startMonitoringLoop()",
    "startMultiTenantMonitor(pool)"
  );
  idx = idx.replace(
    "startMonitoringLoop();",
    "startMultiTenantMonitor(pool);"
  );
  fs.writeFileSync(indexFile, idx, 'utf8');
  console.log('✓ index.ts updated to use multi-tenant monitor');
} else {
  console.log('- index.ts already using multi-tenant monitor');
}

// 4. Copy frontend page
const frontendSrc = path.join(__dirname, 'DriveMonitorPageV2.jsx');
const frontendDir = 'C:/deemona-finance-os/frontend/src/components/monitor';
if (!fs.existsSync(frontendDir.replace(/\//g,'\\'))) {
  fs.mkdirSync(frontendDir.replace(/\//g,'\\'), { recursive: true });
}
const frontendDest = path.join(frontendDir.replace(/\//g,'\\'), 'DriveMonitorPage.jsx');
fs.copyFileSync(frontendSrc, frontendDest);
console.log('✓ DriveMonitorPage.jsx (v2) copied to frontend');

console.log('\n✅ Multi-tenant monitor setup complete!');
console.log('\nNext:');
console.log('1. cd C:/deemona-finance-os/backend && git add . && git commit -m "Add: multi-tenant Drive monitor" && git push');
console.log('2. cd C:/deemona-finance-os/frontend && git add . && git commit -m "Add: Drive Monitor settings UI for each tenant" && git push');
