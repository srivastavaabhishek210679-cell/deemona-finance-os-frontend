const fs = require("fs");
const f = "C:/deemona-finance-os/frontend/src/App.jsx";
let c = fs.readFileSync(f, "utf8");

// Remove NSELiveRibbon import
c = c.replace("import NSELiveRibbon from './components/common/NSELiveRibbon';\n", "");

// Remove NSELiveRibbon usage
c = c.replace("        {/* NSE Live Ticker */}\n        <NSELiveRibbon />\n", "");

fs.writeFileSync(f, c, "utf8");
console.log("Removed. Has ribbon:", c.includes("NSELiveRibbon"));
