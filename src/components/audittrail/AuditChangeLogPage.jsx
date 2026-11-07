import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';

const hdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 16 };
const inp = { padding: '7px 10px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' };
const lab = { fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' };
const VERB = { POST: ['Created / ran', '#1B4FD8'], PUT: ['Updated', '#7C3AED'], PATCH: ['Updated', '#7C3AED'], DELETE: ['Deleted', '#DC2626'] };
const fmt = s => new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default function AuditChangeLogPage() {
  const [f, setF] = useState({ module: '', user: '', method: '', failed: false, from: '', to: '' });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [more, setMore] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (append, offset) => {
    setBusy(true);
    const qs = new URLSearchParams({ limit: 100, offset: offset || 0 });
    if (f.module) qs.set('module', f.module); if (f.user) qs.set('user', f.user); if (f.method) qs.set('method', f.method);
    if (f.failed) qs.set('failed', '1'); if (f.from) qs.set('from', f.from); if (f.to) qs.set('to', f.to);
    try {
      const r = await fetch(apiURL('/api/audit-trail?' + qs), { headers: hdr() });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j.error || ('Request failed (' + r.status + ')')); }
      else { setErr(null); setMeta(j); setMore(j.has_more); setRows(prev => append ? prev.concat(j.rows) : j.rows); }
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }, [f]);
  useEffect(() => { const t = setTimeout(() => load(false, 0), 300); return () => clearTimeout(t); }, [load]);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  if (err && !meta) return <div style={{ ...card, color: '#DC2626', fontSize: 14 }}>{err}</div>;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Who changed what</div>
        <div style={{ fontSize: 13, color: '#64748B', margin: '2px 0 4px' }}>Every create, update, delete and approval made through the app is recorded with the user, time and result. What was typed into forms is never stored.</div>
        {meta && <div style={{ fontSize: 13, color: '#475569', marginTop: 8 }}>Last 24 hours: <strong>{meta.last_24h.total}</strong> changes by <strong>{meta.last_24h.users}</strong> user(s); <strong style={{ color: meta.last_24h.failed ? '#DC2626' : 'inherit' }}>{meta.last_24h.failed}</strong> refused or failed.</div>}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 14, alignItems: 'flex-end' }}>
          <div><label style={lab}>Area</label><select style={inp} value={f.module} onChange={e => set('module', e.target.value)}><option value="">All</option>{meta && meta.modules.map(m => <option key={m.module} value={m.module}>{m.module} ({m.n})</option>)}</select></div>
          <div><label style={lab}>User email</label><input style={{ ...inp, width: 170 }} value={f.user} onChange={e => set('user', e.target.value)} placeholder="search" /></div>
          <div><label style={lab}>Action</label><select style={inp} value={f.method} onChange={e => set('method', e.target.value)}><option value="">All</option><option value="POST">Create / run</option><option value="PUT">Update</option><option value="PATCH">Update (partial)</option><option value="DELETE">Delete</option></select></div>
          <div><label style={lab}>From</label><input style={inp} type="date" value={f.from} onChange={e => set('from', e.target.value)} /></div>
          <div><label style={lab}>To</label><input style={inp} type="date" value={f.to} onChange={e => set('to', e.target.value)} /></div>
          <label style={{ fontSize: 13, display: 'flex', gap: 6, alignItems: 'center', paddingBottom: 6 }}><input type="checkbox" checked={f.failed} onChange={e => set('failed', e.target.checked)} /> Only refused or failed</label>
        </div>
      </div>
      <div style={card}>
        {rows.length === 0 ? <div style={{ fontSize: 13, color: '#64748B' }}>{busy ? 'Loading…' : 'No matching records.'}</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr>{['When', 'User', 'Action', 'Where', 'Record', 'Result'].map(h => <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: '#64748B', fontWeight: 600, borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
              <tbody>{rows.map(r => {
                const [vt, vc] = VERB[r.method] || [r.method, '#64748B']; const bad = r.status >= 400;
                return (
                  <tr key={r.id}>
                    <td style={{ padding: '6px 8px', whiteSpace: 'nowrap', color: '#475569' }}>{fmt(r.created_at)}</td>
                    <td style={{ padding: '6px 8px' }}>{r.user_email || 'unknown'}{r.user_role ? <span style={{ color: '#94A3B8' }}> · {r.user_role}</span> : null}</td>
                    <td style={{ padding: '6px 8px' }}><span style={{ color: vc, fontWeight: 700 }}>{vt}</span></td>
                    <td style={{ padding: '6px 8px', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{r.route}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#64748B' }}>{r.record_id ? r.record_id.slice(0, 8) : '-'}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: bad ? '#DC2626' : '#16A34A' }}>{bad ? 'Refused ' : 'OK '}{r.status}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
        {more && <button disabled={busy} onClick={() => load(true, rows.length)} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer' }}>Load more</button>}
      </div>
    </div>
  );
}
