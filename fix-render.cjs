const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/intelligence/AIIntelligenceHub.jsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(
  "{mod==='predict' && (",
  "{mod==='marketcap' && <MarketCapView/>}\n      {mod==='joinexit' && <JoinExitView showToast={showToast}/>}\n      {mod==='predict' && ("
);

fs.writeFileSync(f, c, 'utf8');
console.log('Has marketcap render:', c.includes("mod==='marketcap'"));
console.log('Has joinexit render:', c.includes("mod==='joinexit'"));
