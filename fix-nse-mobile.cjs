const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Replace the entire ticker div and animation with a proper solution
c = c.replace(
  `        <div style={{flex:1,overflow:'hidden',position:'relative'}}>
          <div style={{
            display:'flex',
            animation:'nse-scroll 12s linear infinite',
            willChange:'transform',
          }}>
            {[...stocks,...stocks].map((st,i) => {`,
  `        <div style={{flex:1,overflow:'hidden',position:'relative'}}>
          <div style={{
            display:'flex',
            animation:'nse-scroll 6s linear infinite',
            willChange:'transform',
          }}>
            {[...stocks,...stocks].map((st,i) => {`
);

// Shrink each stock item for mobile
c = c.replace(
  "padding:'0 10px',borderRight:'1px solid #1e293b',height:26,flexShrink:0,whiteSpace:'nowrap'",
  "padding:'0 6px',borderRight:'1px solid #1e293b',height:26,flexShrink:0,whiteSpace:'nowrap'"
);

// Make font smaller
c = c.replace(
  "span style={{fontSize:10,fontWeight:700,color:'#94a3b8'}}>{st.name}</span>",
  "span style={{fontSize:9,fontWeight:700,color:'#94a3b8'}}>{st.name}</span>"
);
c = c.replace(
  "span style={{fontSize:11,fontWeight:800,color:up?'#4ade80':'#f87171'}}",
  "span style={{fontSize:10,fontWeight:800,color:up?'#4ade80':'#f87171'}}"
);
c = c.replace(
  "span style={{fontSize:9,color:up?'#4ade80':'#f87171',fontWeight:600}}",
  "span style={{fontSize:9,color:up?'#4ade80':'#f87171',fontWeight:600}}"
);

fs.writeFileSync(f, c, 'utf8');
console.log('Done - 6s speed, compact items');
