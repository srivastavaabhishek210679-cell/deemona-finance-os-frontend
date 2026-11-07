// Level 4 (Prescriptive): "Recommended actions" card on the Cash Forecast page. Idempotent. Run from the frontend folder.
// Needs apply-recommendations-backend.cjs deployed first.
const fs = require('fs');
const f = 'src/components/forecast/CashForecastPage.jsx';
if (!fs.existsSync(f)) { console.error('Run from the frontend folder'); process.exit(1); }
const raw = fs.readFileSync(f, 'utf8'); const crlf = raw.includes('\r\n'); let s = raw.replace(/\r\n/g, '\n');
if (s.includes('function RecommendationsCard')) { console.log('Already applied'); process.exit(0); }
function must(c, m) { if (!c) { console.error('Pattern not found: ' + m); process.exit(1); } }
const comp = `function RecommendationsCard({ days }) {
  const [d, setD] = useState(null);
  const [e, setE] = useState(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch(apiURL('/api/recommendations?days=' + days), { headers: hdr() });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setE(j.error || 'Could not load recommendations'); else { setD(j); setE(null); }
    } catch (x) { setE(x.message); }
  }, [days]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const h = () => load(); window.addEventListener('deemona_data_change', h); return () => window.removeEventListener('deemona_data_change', h); }, [load]);
  const tone = { shortfall: '#DC2626', chase: '#1B4FD8', delay_bill: '#D97706', data: '#D97706', ok: '#16A34A' };
  const tag = { shortfall: 'Shortfall', chase: 'Chase', delay_bill: 'Delay bill', data: 'Set up', ok: 'All clear' };
  return (
    <div style={card}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Recommended actions</div>
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>What to do next, worked out from your open invoices and bills. Suggestions only: nothing is sent or changed for you.</div>
      {e && <div style={{ color: '#DC2626', fontSize: 13 }}>{e}</div>}
      {!d && !e && <div style={{ color: '#64748B', fontSize: 13 }}>Loading…</div>}
      {d && d.recommendations.map((r, i) => (
        <div key={i} style={{ borderTop: i ? '1px solid #E2E8F0' : 'none', padding: '10px 0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ background: tone[r.type] + '1A', color: tone[r.type], fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap', marginTop: 2 }}>{tag[r.type]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{r.title}</div>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{r.detail}</div>
            {r.effect && <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{r.effect}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

`;
const a = 'export default function CashForecastPage()';
must(s.includes(a), 'component anchor');
s = s.replace(a, () => comp + a);
const b = '      {data && (\n        <div style={card}>\n          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>What the forecast is built from</div>';
must(s.includes(b), 'built-from card');
s = s.replace(b, () => '      <RecommendationsCard days={days} />\n\n' + b);
fs.writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s); console.log('Done');
