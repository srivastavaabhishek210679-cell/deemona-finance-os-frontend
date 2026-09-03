const fs = require("fs");
const f = "C:/deemona-finance-os/frontend/src/App.jsx";
let lines = fs.readFileSync(f, "utf8").split("\n");

// Line 136 (index 135) - remove route from sidebar items array
// Line 139 (index 138) - remove duplicate sidebar nav item
// Keep only the sidebar nav item (label+icon) not the route (title+comp)

// Remove line 136 (comp route wrongly in sidebar)
const routeInSidebarIdx = lines.findIndex(l => l.includes("path: '/integrations'") && l.includes("comp:"));
console.log("Route in sidebar at:", routeInSidebarIdx+1);
if (routeInSidebarIdx > -1) lines.splice(routeInSidebarIdx, 1);

// Now find the routes array and add the route there
const routesArrayIdx = lines.findIndex(l => l.includes("path: '/report-center'") && l.includes("comp:"));
console.log("Routes array at:", routesArrayIdx+1);
if (routesArrayIdx > -1) {
  lines.splice(routesArrayIdx, 0, "      { path: '/integrations', title: 'Data Integrations', sub: 'Connect ERP, CRM and REST APIs', comp: <UniversalPoller/> },");
}

fs.writeFileSync(f, lines.join("\n"), "utf8");
console.log("Fixed. Route moved to routes array");
