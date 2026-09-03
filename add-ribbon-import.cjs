const fs = require("fs");
const f = "C:/deemona-finance-os/frontend/src/App.jsx";
let c = fs.readFileSync(f, "utf8");

// Add import at top
c = c.replace(
  "import { BrowserRouter",
  "import NSELiveRibbon from './components/common/NSELiveRibbon';\nimport { BrowserRouter"
);

fs.writeFileSync(f, c, "utf8");
console.log("Done. Has import:", c.includes("from './components/common/NSELiveRibbon'"));
