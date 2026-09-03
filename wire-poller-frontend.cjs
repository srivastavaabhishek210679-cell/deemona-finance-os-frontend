const fs = require("fs");
const f = "C:/deemona-finance-os/frontend/src/App.jsx";
let c = fs.readFileSync(f, "utf8");
if (!c.includes("UniversalPoller")) {
  c = c.replace("import ReportCenter", "import UniversalPoller from './components/integrations/UniversalPoller';\nimport ReportCenter");
  c = c.replace("{ path: '/report-center'", "{ path: '/integrations', title: 'Data Integrations', sub: 'Connect ERP, CRM and REST APIs', comp: <UniversalPoller/> },\n      { path: '/report-center'");
  c = c.replace("{ path: '/report-center', label: 'Report Center'", "{ path: '/integrations', label: 'Data Integrations', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },\n          { path: '/report-center', label: 'Report Center'");
  fs.writeFileSync(f, c, "utf8");
  console.log("Frontend wired:", c.includes("UniversalPoller"));
}
