const fs = require("fs");

// Find FinanceDashboardHub
const hubPath = "C:/deemona-finance-os/frontend/src/components/dashboards/FinanceDashboardHub.jsx";
if (!fs.existsSync(hubPath)) { console.log("Hub not found"); process.exit(0); }

let hub = fs.readFileSync(hubPath, "utf8");
if (hub.includes("useLiveRefresh")) { console.log("Already patched"); process.exit(0); }

// Add import at top
const firstImport = hub.indexOf("import ");
hub = hub.substring(0, firstImport) + 
  "import { useLiveRefresh } from '../../hooks/useLiveRefresh';\n" + 
  hub.substring(firstImport);

// Find the main component function and add hook after first useState
// Look for "const [" pattern to insert after
const insertAfter = "const [activeTab";
const idx = hub.indexOf(insertAfter);
if (idx > -1) {
  // Find end of that line
  const lineEnd = hub.indexOf("\n", idx);
  // Find the load function name
  const hasLoadKPIs = hub.includes("loadKPIs");
  const hasFetchData = hub.includes("fetchData");
  const loadFn = hasLoadKPIs ? "loadKPIs" : hasFetchData ? "fetchData" : null;
  
  if (loadFn) {
    hub = hub.substring(0, lineEnd+1) + 
      "  useLiveRefresh([], " + loadFn + ");\n" + 
      hub.substring(lineEnd+1);
    console.log("Patched with:", loadFn);
  } else {
    // Just add a refresh key approach
    hub = hub.substring(0, lineEnd+1) + 
      "  useLiveRefresh([], () => setRefreshKey && setRefreshKey(k=>k+1));\n" + 
      hub.substring(lineEnd+1);
    console.log("Patched with refreshKey");
  }
}

fs.writeFileSync(hubPath, hub, "utf8");
console.log("Done. Has useLiveRefresh:", hub.includes("useLiveRefresh"));
