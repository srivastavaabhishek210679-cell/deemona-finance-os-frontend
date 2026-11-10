const fs=require('fs');
const f='src/components/accounting/AccountingPage.jsx';
let s=fs.readFileSync(f,'utf8');
if(s.includes('anomalyScannedAt')){console.log('already applied');process.exit(0);}
const crlf=s.includes('\r\n'); s=s.replace(/\r\n/g,'\n');
function rep(a,b){ if(!s.includes(a)){console.error('anchor missing: '+a.slice(0,50));process.exit(1);} s=s.replace(a,()=>b); }
rep("  const [anomalyLoading, setAnomalyLoading] = useState(false);\n","  const [anomalyLoading, setAnomalyLoading] = useState(false);\n  const [anomalyScannedAt, setAnomalyScannedAt] = useState(null);\n");
rep("      setAnomalies(res.anomalies || []);\n","      setAnomalies(res.anomalies || []);\n      setAnomalyScannedAt(new Date());\n");
rep("              Click Scan Now to detect anomalies in your accounts\n","              {anomalyScannedAt\n                ? 'Scan complete at ' + anomalyScannedAt.toLocaleTimeString() + ': no anomalies found'\n                : 'Click Scan Now to detect anomalies in your accounts'}\n");
if(crlf) s=s.replace(/\n/g,'\r\n');
fs.writeFileSync(f,s); console.log('applied');
