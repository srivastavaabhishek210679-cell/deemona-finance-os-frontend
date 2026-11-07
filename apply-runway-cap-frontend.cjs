// Dashboard: show runway beyond 5 years as "5+ years" instead of a huge month count. Idempotent. Run from the frontend folder.
const fs=require('fs');const f='src/components/dashboard/DashboardPage.jsx';
if(!fs.existsSync(f)){console.error('Run from the frontend folder');process.exit(1);}
const raw=fs.readFileSync(f,'utf8');const crlf=raw.includes('\r\n');let s=raw.replace(/\r\n/g,'\n');
if(s.includes('/*runway-cap*/')){console.log('Already applied');process.exit(0);}
const a="{runwayDays != null ? 'Runway: about ' + (runwayDays / 30).toFixed(1) + ' months' : 'Runway: not available yet'}";
if(!s.includes(a)){console.error('runway text not found (apply the real-data patch first)');process.exit(1);}
s=s.replace(a,()=>"{/*runway-cap*/runwayDays != null ? (runwayDays / 30 > 60 ? 'Runway: 5+ years' : 'Runway: about ' + (runwayDays / 30).toFixed(1) + ' months') : 'Runway: not available yet'}");
fs.writeFileSync(f,crlf?s.replace(/\n/g,'\r\n'):s);console.log('Done: runway capped');
