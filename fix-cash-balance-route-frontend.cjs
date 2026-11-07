// Fixes the Cash Balance route: removes the misplaced entry from the sidebar list and registers the real route. Idempotent. Run in the frontend folder.
const fs=require('fs');const f='src/App.jsx';
if(!fs.existsSync(f)){console.error('Run from the frontend folder');process.exit(1);}
const raw=fs.readFileSync(f,'utf8');const crlf=raw.includes('\r\n');let s=raw.replace(/\r\n/g,'\n');
const routeLine="{ path: '/cash-balance', title: 'Cash Balance', sub: 'Enter your cash and bank balance. No bank data is stored.', comp: <CashBalancePage /> },";
// 1. remove every existing copy of the route line
const before=s;
s=s.replace(/^[ \t]*\{ path: '\/cash-balance', title:[^\n]*\n/gm,'');
// 2. insert it right before the real /statements route (the one with a title)
const re=/^([ \t]*)\{ path: '\/statements',\s+title:[^\n]*\n/m;
const m=s.match(re);
if(!m){console.error('statements route not found');process.exit(1);}
s=s.replace(re,(a,ind)=>ind+routeLine+'\n'+a);
if(s===before){console.log('Already correct');process.exit(0);}
fs.writeFileSync(f,crlf?s.replace(/\n/g,'\r\n'):s);console.log('Done: route fixed');
