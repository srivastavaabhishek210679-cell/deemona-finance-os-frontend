const fs = require("fs");

// Wire RealTimeReports into App.jsx
const appPath = "C:/deemona-finance-os/frontend/src/App.jsx";
let app = fs.readFileSync(appPath, "utf8");

if (!app.includes("RealTimeReports")) {
  app = app.replace(
    "import Batch4DocsPage",
    "import RealTimeReports from './components/reports/RealTimeReports';\nimport ReportCenter from './components/reports/ReportCenter';\nimport Batch4DocsPage"
  );
  app = app.replace(
    "{ path: '/governance-docs-batch4'",
    "{ path: '/report-center', title: 'Report Center', sub: 'All scheduled reports - send any on-demand', comp: <ReportCenter/> },\n      { path: '/realtime-reports', title: 'Real-Time Reports', sub: 'Live database reports', comp: <RealTimeReports/> },\n      { path: '/governance-docs-batch4'"
  );
  app = app.replace(
    "{ path: '/governance-docs-batch4', label: 'Investment & ESG Docs'",
    "{ path: '/report-center', label: 'Report Center', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },\n          { path: '/realtime-reports', label: 'Real-Time Reports', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },\n          { path: '/governance-docs-batch4', label: 'Investment & ESG Docs'"
  );
  fs.writeFileSync(appPath, app, "utf8");
  console.log("Wired. Has RealTimeReports:", app.includes("RealTimeReports"));
  console.log("Has ReportCenter:", app.includes("ReportCenter"));
} else {
  console.log("Already wired");
}
