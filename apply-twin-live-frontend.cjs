// Level 2 (Real-Time Twin), step 1: the Digital Twin follows the live data stream.
// - baseline (revenue, staff, expenses, cash context) refreshes itself when your books change, but never overwrites fields you typed
// - a live strip shows when the books last changed
// - a warning with a Re-run button appears if the books changed after your last simulation
// Idempotent. Run from the frontend folder.
const fs=require('fs');const f='src/components/digitaltwin/DigitalTwinPage.jsx';
if(!fs.existsSync(f)){console.error('Run from the frontend folder');process.exit(1);}
const raw=fs.readFileSync(f,'utf8');const crlf=raw.includes('\r\n');let s=raw.replace(/\r\n/g,'\n');
if(s.includes('/*twin-live*/')){console.log('Already applied');process.exit(0);}
function must(c,m){if(!c){console.error('Pattern not found: '+m);process.exit(1);}}
// 1. import useRef
const imp="import { useState, useCallback, useEffect } from 'react';";
must(s.includes(imp),'react import'); s=s.replace(imp,()=>"import { useState, useCallback, useEffect, useRef } from 'react';");
// 2. replace the one-time books loader
const a=s.indexOf("  const [ctx, setCtx] = useState(null);");
const endMark="    return () => { alive = false; };\n  }, []);\n";
const b=s.indexOf(endMark,a);
must(a>0&&b>a,'ctx loader');
const block=`  const [ctx, setCtx] = useState(null);
  const [fromBooks, setFromBooks] = useState({});
  const fromBooksRef = useRef({});
  useEffect(() => { fromBooksRef.current = fromBooks; }, [fromBooks]);
  const [live, setLive] = useState({ at: null, table: null });
  const [ranAt, setRanAt] = useState(0);
  const [changedAt, setChangedAt] = useState(0);
  // /*twin-live*/ Real figures from this company's books (GET /api/cfo/twin-context); null fields are never made up
  const loadCtx = useCallback((initial) => {
    return fetch(apiURL('/api/cfo/twin-context'), { headers: headers() })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d || !d.baseline) return;
        setCtx(d);
        const fill = {}, tag = {};
        if (d.baseline.annual_revenue != null) { fill.current_revenue = String(d.baseline.annual_revenue); tag.current_revenue = true; }
        if (d.baseline.employees != null) { fill.current_employees = String(d.baseline.employees); tag.current_employees = true; }
        if (d.baseline.monthly_opex != null) { fill.current_monthly_expenses = String(d.baseline.monthly_opex); tag.current_monthly_expenses = true; }
        if (initial) { setInputs(p => ({ ...p, ...fill })); setFromBooks(tag); return; }
        // live refresh: only update fields the user has not edited
        const keep = {};
        Object.keys(fill).forEach(k => { if (fromBooksRef.current[k]) keep[k] = fill[k]; });
        if (Object.keys(keep).length) setInputs(p => ({ ...p, ...keep }));
      })
      .catch(() => {});
  }, []);
  useEffect(() => { loadCtx(true); }, [loadCtx]);
  useEffect(() => {
    let t = null;
    const onChange = (e) => {
      const d = (e && e.detail) || {};
      setLive(p => ({ at: Date.now(), table: d.table || p.table }));
      setChangedAt(Date.now());
      clearTimeout(t);
      t = setTimeout(() => loadCtx(false), 2500);
    };
    window.addEventListener('deemona_data_change', onChange);
    return () => { window.removeEventListener('deemona_data_change', onChange); clearTimeout(t); };
  }, [loadCtx]);
  useEffect(() => { if (result) setRanAt(Date.now()); }, [result]);
`;
s=s.slice(0,a)+block+s.slice(b+endMark.length);
// 3. live strip before the tabs
const tabs="      {/* Tabs */}";
must(s.includes(tabs),'tabs marker');
const strip=`      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '-4px 0 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: live.at ? '#22C98A' : '#94A3B8' }} />
          {live.at
            ? 'Live: books updated at ' + new Date(live.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + (live.table ? ' (' + String(live.table).replace(/_/g, ' ') + ')' : '')
            : 'Connected to your books. The baseline refreshes automatically when they change.'}
        </span>
        {result && !result.error && changedAt > ranAt && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '3px 10px', borderRadius: 100, background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>
            Your books changed after this simulation
            <button onClick={runSimulation} style={{ padding: '2px 10px', borderRadius: 100, border: 'none', background: '#1B4FD8', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Re-run</button>
          </span>
        )}
      </div>

`;
s=s.replace(tabs,()=>strip+tabs);
fs.writeFileSync(f,crlf?s.replace(/\n/g,'\r\n'):s);console.log('Done');
