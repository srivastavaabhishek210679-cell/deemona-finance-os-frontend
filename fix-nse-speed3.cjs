const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Replace animation with faster pixel-based speed
// 20 stocks * ~130px each = 2600px for one set
// At 150px/s speed: 2600/150 = ~17s but we want faster
// Use 8s for snappy feel - user can see all stocks cycle quickly
c = c.replace(
  "animation:'nse-scroll 20s linear infinite'",
  "animation:'nse-scroll 12s linear infinite'"
);

// Also increase font slightly and reduce padding to fit more stocks visible
c = c.replace(
  "padding:'0 16px',borderRight:'1px solid #1e293b',height:26,flexShrink:0,whiteSpace:'nowrap'",
  "padding:'0 10px',borderRight:'1px solid #1e293b',height:26,flexShrink:0,whiteSpace:'nowrap'"
);

fs.writeFileSync(f, c, 'utf8');
console.log('Speed set to 12s with tighter padding');
