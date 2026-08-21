const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/intelligence/AIIntelligenceHub.jsx';
let c = fs.readFileSync(f, 'utf8');

// Add to MODULES array after predict
c = c.replace(
  "{id:'predict', label:'Predictive Modeling',",
  "{id:'marketcap', label:'Market Cap Reports', icon:'\ud83d\udcb9', color:'#059669'},\n  {id:'joinexit', label:'Joining & Exit Analytics', icon:'\ud83d\udc65', color:'#7c3aed'},\n  {id:'predict', label:'Predictive Modeling',"
);

// Add render cases
c = c.replace(
  "if (mod==='predict') return <PredictView",
  "if (mod==='marketcap') return <MarketCapView/>;\n      if (mod==='joinexit') return <JoinExitView showToast={showToast}/>;\n      if (mod==='predict') return <PredictView"
);

fs.writeFileSync(f, c, 'utf8');
console.log('Done');
console.log('Has marketcap in MODULES:', c.includes("id:'marketcap'"));
console.log('Has joinexit in MODULES:', c.includes("id:'joinexit'"));
console.log('Has MarketCapView render:', c.includes("return <MarketCapView"));
