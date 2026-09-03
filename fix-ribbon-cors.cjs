const fs = require("fs");
const f = "C:/deemona-finance-os/frontend/src/components/common/NSELiveRibbon.jsx";
let c = fs.readFileSync(f, "utf8");

// Fix: proxy fetch to backend to avoid CORS, and fix RAF reset on stock update
// Route yahoo finance through backend proxy
c = c.replace(
  "const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${s.sym}.NS?interval=1d&range=1d`);",
  "const r = await fetch(`https://deemona-finance-os-api.onrender.com/api/ai/market/quote?sym=${s.sym}`);"
);

// Fix RAF - dont reset posRef, keep scrolling even when stocks update
// The issue is useEffect dependency on stocks causes remount
// Remove stocks from RAF useEffect deps - use ref instead
c = c.replace(
  "  }, []);",
  "  // eslint-disable-next-line react-hooks/exhaustive-deps\n  }, []);  // intentionally no deps - RAF runs once"
);

// Also remove the stocks state update from inside RAF effect
// The posRef.current = 0 in measureAndStart is fine - only runs once

fs.writeFileSync(f, c, "utf8");
console.log("Done");
