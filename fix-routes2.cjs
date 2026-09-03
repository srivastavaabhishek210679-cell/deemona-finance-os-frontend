const fs = require("fs");
const f = "C:/deemona-finance-os/frontend/src/App.jsx";
let lines = fs.readFileSync(f, "utf8").split("\n");

// Find and remove ONLY lines 135,136,137 (0-indexed) that have comp: inside sidebar items
// These are the 3 wrong routes inside Enterprise items[]
const toRemove = [];
for (let i=130; i<145; i++) {
  if (lines[i] && lines[i].includes("comp:") && lines[i].includes("title:")) {
    toRemove.push(i);
    console.log("Will remove line", i+1, ":", lines[i].trim().substring(0,80));
  }
}
// Remove in reverse order to preserve indices
toRemove.reverse().forEach(i => lines.splice(i, 1));

// Find routes array (const routes = [)
const routesIdx = lines.findIndex(l => l.trim() === "const routes = [");
console.log("Routes array at line:", routesIdx+1);
console.log("First route:", lines[routesIdx+1]?.trim().substring(0,60));

// Insert the 3 missing routes at start of routes array
lines.splice(routesIdx+1, 0,
  "    { path: '/integrations', title: 'Data Integrations', sub: 'Connect ERP, CRM and REST APIs', comp: <UniversalPoller/> },",
  "    { path: '/report-center', title: 'Report Center', sub: 'All scheduled reports - send any on-demand', comp: <ReportCenter/> },",
  "    { path: '/realtime-reports', title: 'Real-Time Reports', sub: 'Live database reports', comp: <RealTimeReports/> },"
);

fs.writeFileSync(f, lines.join("\n"), "utf8");
console.log("Done. Routes added at:", routesIdx+1);
