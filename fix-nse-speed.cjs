const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Change scroll duration from 25s to 8s
c = c.replace(
  "animation:'nse-scroll 25s linear infinite'",
  "animation:'nse-scroll 8s linear infinite'"
);

fs.writeFileSync(f, c, 'utf8');
console.log('Speed updated to 8s');
