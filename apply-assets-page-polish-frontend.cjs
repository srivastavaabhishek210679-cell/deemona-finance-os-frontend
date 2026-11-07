// Fixed Assets page: round depreciation/book value to whole rupees and add spacing between columns. Idempotent. Run in the frontend folder.
const fs=require('fs');const f='src/components/remaining/AllPages.jsx';
if(!fs.existsSync(f)){console.error('Run from the frontend folder');process.exit(1);}
const raw=fs.readFileSync(f,'utf8');const crlf=raw.includes('\r\n');let s=raw.replace(/\r\n/g,'\n');let n=0;
const rep=(a,b)=>{ if(s.includes(a)){s=s.split(a).join(b);n++;} };
rep("gridTemplateColumns:'80px 1fr 100px 100px 120px 120px 100px 80px'","gridTemplateColumns:'80px 1fr 100px 100px 120px 120px 110px 90px',columnGap:12");
rep("{INR(dep)}","{INR(Math.round(dep))}");
rep("{INR(Math.max(0,bookVal))}","{INR(Math.round(Math.max(0,bookVal)))}");
if(!n){console.log('Already applied');process.exit(0);}
fs.writeFileSync(f,crlf?s.replace(/\n/g,'\r\n'):s);console.log('Done ('+n+' changes)');
