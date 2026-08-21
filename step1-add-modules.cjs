
const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/intelligence/AIIntelligenceHub.jsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Add new modules to MODULES array
c = c.replace(
  "{id:'predict', label:'Predictive Modeling', icon:'\ud83d\udd2e', color:'#7c3aed'},",
  "{id:'predict', label:'Predictive Modeling', icon:'\ud83d\udd2e', color:'#7c3aed'},\n  {id:'marketcap', label:'Market Cap Reports', icon:'\ud83d\udcb9', color:'#059669'},\n  {id:'joinexit', label:'Joining & Exit Analytics', icon:'\ud83d\udc65', color:'#7c3aed'},"
);

// 2. Add cases in main renderDashboard switch
c = c.replace(
  "if (mod==='predict') return <PredictView",
  "if (mod==='marketcap') return <MarketCapView/>;\n      if (mod==='joinexit') return <JoinExitView showToast={showToast}/>;\n      if (mod==='predict') return <PredictView"
);

// 3. Add useEffect loads
c = c.replace(
  "if (mod==='whatif') load('scenarios','/api/ai/whatif/scenarios');",
  "if (mod==='whatif') load('scenarios','/api/ai/whatif/scenarios');\n    if (mod==='joinexit') load('attrition','/api/ai/hr/attrition');"
);

fs.writeFileSync(f, c, 'utf8');
console.log('Step 1 done - modules added');
console.log('Has marketcap:', c.includes("id:'marketcap'"));
console.log('Has joinexit:', c.includes("id:'joinexit'"));
