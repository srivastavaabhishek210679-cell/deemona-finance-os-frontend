const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Fix 1: Change from 3x to 2x duplication with -50% translate
c = c.replace(
  "{[...stocks,...stocks,...stocks].map((st,i) => {",
  "{[...stocks,...stocks].map((st,i) => {"
);

// Fix 2: Fix translateX to -50% (correct for 2x duplication)
c = c.replace(
  "100% { transform: translateX(-33.33%); }",
  "100% { transform: translateX(-50%); }"
);

// Fix 3: Set speed to 40s so all 20 companies are visible while scrolling
c = c.replace(
  "animation:'nse-scroll 8s linear infinite'",
  "animation:'nse-scroll 40s linear infinite'"
);

fs.writeFileSync(f, c, 'utf8');
console.log('Fixed. 2x duplication, -50% translate, 40s duration');
