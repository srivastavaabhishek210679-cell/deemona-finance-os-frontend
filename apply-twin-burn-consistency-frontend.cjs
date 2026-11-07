// Digital Twin: commentary must use the same monthly burn as the Year cards. Idempotent. Run in the frontend folder.
const fs=require('fs');const f='src/components/digitaltwin/DigitalTwinPage.jsx';
if(!fs.existsSync(f)){console.error('Run from the frontend folder');process.exit(1);}
const raw=fs.readFileSync(f,'utf8');const crlf=raw.includes('\r\n');let s=raw.replace(/\r\n/g,'\n');
if(s.includes('SAME_BURN_RULE')){console.log('Already applied');process.exit(0);}
const a="years: calc.years.map(y => ({ year: y.year, revenue: y.revenue, ebitda: y.ebitda, net_profit: y.net_profit }))";
if(!s.includes(a)){console.error('anchor 1 not found');process.exit(1);}
s=s.replace(a,()=>"years: calc.years.map(y => ({ year: y.year, revenue: y.revenue, ebitda: y.ebitda, net_profit: y.net_profit, monthly_burn: y.monthly_burn }))");
const b="'Mention assumptions you relied on. Do not invent facts about the company.',";
if(!s.includes(b)){console.error('anchor 2 not found');process.exit(1);}
s=s.replace(b,()=>b+"\n          /* SAME_BURN_RULE */ 'For monthly burn, runway and any year-by-year figure, quote ONLY the numbers in CALCULATED RESULT (monthly_burn per year). Never quote burn or runway figures returned by tools, because they use a different basis and would contradict the cards on this page.',");
fs.writeFileSync(f,crlf?s.replace(/\n/g,'\r\n'):s);console.log('Done');
