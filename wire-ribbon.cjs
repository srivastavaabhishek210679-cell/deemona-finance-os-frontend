const fs = require("fs");

// Write NSELiveRibbon component
const ribbon = fs.readFileSync("C:/deemona-finance-os/frontend/src/components/common/NSELiveRibbon.jsx", "utf8");
console.log("Ribbon exists:", ribbon.length > 0);

// Wire into App.jsx
const appPath = "C:/deemona-finance-os/frontend/src/App.jsx";
let app = fs.readFileSync(appPath, "utf8");

// Remove old inline ribbon
const oldStart = app.indexOf("// \u2500\u2500 NSE Live Stock Ticker Ribbon");
const oldEnd = app.indexOf("// \u2500\u2500 Layout", oldStart);
if (oldStart > -1 && oldEnd > -1) {
  app = app.substring(0, oldStart) + app.substring(oldEnd);
  console.log("Removed old inline ribbon");
}

// Add import at top
if (!app.includes("NSELiveRibbon")) {
  app = app.replace(
    "import { BrowserRouter",
    "import NSELiveRibbon from './components/common/NSELiveRibbon';\nimport { BrowserRouter"
  );
  console.log("Import added:", app.includes("NSELiveRibbon"));
}

fs.writeFileSync(appPath, app, "utf8");
console.log("Done");
