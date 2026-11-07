import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';

const hdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const call = async (method, body) => {
  try {
    const r = await fetch(apiURL('/api/autopilot'), { method, headers: hdr(), body: body ? JSON.stringify(body) : undefined });
    const t = await r.text(); let d = {}; try { d = JSON.parse(t); } catch { /* ignore */ }
    return r.ok ? d : { error: d.error || ('Request failed (' + r.status + ')') };
  } catch (e) { return { error: e.message }; }
};
const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 16 };
const lab = { fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' };
const inp = { padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, width: 110, boxSizing: 'border-box' };
const STATUS = { sent: ['#16A34A', 'Sent'], failed: ['#DC2626', 'Failed'], skipped: ['#D97706', 'Skipped'] };
const fmt = s => new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function AutopilotPage() {
  const [d, setD] = useState(null);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await call('GET');
    if (r.error) { setMsg({ bad: true, t: r.error }); return; }
    setD(r); setForm(f => f || r.settings);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (patch) => {
    setBusy(true); setMsg(null);
    const r = await call('PUT', { ...form, ...patch });
    setBusy(false);
    if (r.error) { setMsg({ bad: true, t: r.error }); return; }
    setForm(r.settings); setMsg({ t: 'Saved.' }); load();
  };

  if (!d || !form) return <div style={{ padding: 24, color: '#64748B' }}>{msg ? msg.t : 'Loading…'}</div>;
  const on = !!form.reminders_enabled;

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Automatic payment reminders</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>When on, Autopilot emails customers about overdue invoices once a day (7:30 am IST), inside the limits below. It never moves money, and every action is listed at the bottom of this page.</div>
          </div>
          <button disabled={busy} onClick={() => save({ reminders_enabled: !on })}
            style={{ padding: '10px 18px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#fff', background: on ? '#16A34A' : '#64748B' }}>
            {on ? 'ON · click to turn off' : 'OFF · click to turn on'}
          </button>
        </div>
        {!d.email_configured && <div style={{ marginTop: 12, fontSize: 13, color: '#B45309', background: '#FFFBEB', padding: '8px 12px', borderRadius: 8 }}>Email sending is not set up on the server (RESEND_API_KEY), so nothing will be sent even when this is on.</div>}
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Limits</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div><label style={lab}>Most reminders per day</label><input style={inp} type="number" min="1" max="50" value={form.daily_cap} onChange={e => setForm({ ...form, daily_cap: e.target.value })} /></div>
          <div><label style={lab}>Only when overdue by at least (days)</label><input style={inp} type="number" min="1" max="90" value={form.min_days_overdue} onChange={e => setForm({ ...form, min_days_overdue: e.target.value })} /></div>
          <div><label style={lab}>Same invoice again after (days)</label><input style={inp} type="number" min="3" max="30" value={form.repeat_every_days} onChange={e => setForm({ ...form, repeat_every_days: e.target.value })} /></div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button disabled={busy} onClick={() => save({})} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1B4FD8', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Save limits</button>
          {msg && <span style={{ fontSize: 13, color: msg.bad ? '#DC2626' : '#16A34A' }}>{msg.t}</span>}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Next run</div>
        <div style={{ fontSize: 13, color: '#64748B', margin: '2px 0 10px' }}>{d.sent_today} sent today · room for {d.room_today} more. These would be sent at the next run{on ? '' : ' if Autopilot were on'}:</div>
        {d.would_send.length === 0 ? <div style={{ fontSize: 13, color: '#64748B' }}>Nothing to send: no overdue invoice meets your limits.</div> :
          d.would_send.map((w, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, borderTop: i ? '1px solid #E2E8F0' : 'none', padding: '8px 0', fontSize: 13 }}>
              <div><strong>{w.party || 'Customer'}</strong> · {w.invoice_number} · {w.days_overdue} days overdue{!w.has_email && <span style={{ color: '#D97706' }}> · no email address, will be skipped</span>}</div>
              <div style={{ fontWeight: 600 }}>{w.amount_inr}</div>
            </div>
          ))}
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>What Autopilot has done</div>
        {d.actions.length === 0 ? <div style={{ fontSize: 13, color: '#64748B' }}>Nothing yet.</div> :
          d.actions.map(a => {
            const [c, t] = STATUS[a.status] || ['#64748B', a.status];
            return (
              <div key={a.id} style={{ display: 'flex', gap: 12, borderTop: '1px solid #E2E8F0', padding: '8px 0', fontSize: 13, alignItems: 'flex-start' }}>
                <span style={{ background: c + '1A', color: c, fontWeight: 700, fontSize: 11, borderRadius: 6, padding: '3px 8px', minWidth: 52, textAlign: 'center' }}>{t}</span>
                <div style={{ flex: 1 }}><strong>{a.party || 'Customer'}</strong> · {a.invoice_number} · {a.amount_inr}<div style={{ color: '#64748B' }}>{a.detail}</div></div>
                <div style={{ color: '#64748B', whiteSpace: 'nowrap' }}>{fmt(a.created_at)}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
