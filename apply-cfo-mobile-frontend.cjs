// Digital CFO page: usable on phones. Run from the frontend folder. Idempotent.
const fs=require('fs');const p='src/components/cfoagent/CFOAgentPage.jsx';
let s=fs.readFileSync(p,'utf8');
if(s.includes('/*cfo-mobile*/')){console.log('already patched');process.exit(0);}
const crlf=s.includes('\r\n');if(crlf)s=s.replace(/\r\n/g,'\n');
function rep(a,b){if(s.split(a).length!==2){console.log('ANCHOR NOT FOUND:',a.slice(0,70));process.exit(1);}s=s.replace(a,()=>b);}
rep(`  const [dashboard, setDashboard] = useState(null);`,
`  const [dashboard, setDashboard] = useState(null);
  /*cfo-mobile*/
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const on = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);`);
rep(`<div style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', gap: 20 }}>`,
`<div style={isMobile
      ? { padding: 12, display: 'flex', flexDirection: 'column', gap: 16 }
      : { padding: 24, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', gap: 20 }}>`);
rep(`gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, flexShrink: 0 }}>`,
`gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', gap: 12, flexShrink: 0 }}>`);
rep(`        background: 'var(--surface-1)', overflow: 'hidden',
        minHeight: 0,
      }}>`,
`        background: 'var(--surface-1)', overflow: 'hidden',
        minHeight: 0,
        ...(isMobile ? { height: '75vh', minHeight: 440 } : {}),
      }}>`);
fs.writeFileSync(p,crlf?s.replace(/\n/g,'\r\n'):s);console.log('patched',p);
