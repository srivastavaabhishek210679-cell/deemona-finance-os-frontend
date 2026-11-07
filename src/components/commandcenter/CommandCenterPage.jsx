import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';

const hdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 16 };
const inp = { padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, width: 90, boxSizing: 'border-box' };
const lab = { fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' };

export default function CommandCenterPage() {
  const [drop, setDrop] = useState(25);
  const [share, setShare] = useState(80);
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch(apiURL('/api/command-center?drop=' + (parseInt(drop, 10) || 25) + '&share=' + (parseInt(share, 10) || 80)), { headers: hdr() });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setErr(j.error || ('Request failed (' + r.status + ')')); else { setD(j); setErr(null); }
    } catch (e) { setErr(e.message); }
  }, [drop, share]);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [load]);
  useEffect(() => { const h = () => load(); window.addEventListener('deemona_data_change', h); return () => window.removeEventListener('deemona_data_change', h); }, [load]);

  return (
    <div style={{ maxWidth: 980 }}>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>The questions a CFO asks</div>
        <div style={{ fontSize: 13, color: '#64748B', margin: '2px 0 12px' }}>Each answer is calculated from your own invoices, bills and recent costs. No AI is used on this page, so the numbers can be checked.</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div><label style={lab}>Revenue drop to test (%)</label><input style={inp} type="number" min="1" max="90" value={drop} onChange={e => setDrop(e.target.value)} /></div>
          <div><label style={lab}>Customer share to find (%)</label><input style={inp} type="number" min="50" max="95" value={share} onChange={e => setShare(e.target.value)} /></div>
        </div>
        {d && <ul style={{ margin: '14px 0 0', paddingLeft: 18, fontSize: 12, color: '#64748B' }}>{d.assumptions.map((a, i) => <li key={i}>{a}</li>)}</ul>}
      </div>
      {err && <div style={{ ...card, color: '#DC2626', fontSize: 14 }}>{err}</div>}
      {!d && !err && <div style={{ color: '#64748B', padding: 8 }}>Loading…</div>}
      {d && d.cards.map(c => (
        <div key={c.key} style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1B4FD8', marginBottom: 6 }}>{c.question}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: c.needs_data ? '#B45309' : '#0F172A' }}>{c.headline}</div>
          {c.details.map((t, i) => <div key={i} style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>{t}</div>)}
          {c.table && (
            <div style={{ overflowX: 'auto', marginTop: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>{c.table.columns.map((h, i) => <th key={i} style={{ textAlign: i ? 'right' : 'left', padding: '6px 8px', color: '#64748B', fontWeight: 600, borderBottom: '1px solid #E2E8F0' }}>{h}</th>)}</tr></thead>
                <tbody>{c.table.rows.map((r, ri) => <tr key={ri}>{r.map((v, i) => <td key={i} style={{ textAlign: i ? 'right' : 'left', padding: '6px 8px', borderBottom: '1px solid #F1F5F9' }}>{v}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
