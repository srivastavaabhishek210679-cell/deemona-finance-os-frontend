import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';

const hdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const call = async (method, url, body) => {
  try {
    const r = await fetch(apiURL(url), { method, headers: hdr(), body: body ? JSON.stringify(body) : undefined });
    const t = await r.text(); let d = {}; try { d = JSON.parse(t); } catch { /* ignore */ }
    return r.ok ? d : { error: d.error || ('Request failed (' + r.status + ')') };
  } catch (e) { return { error: e.message }; }
};
const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const today = () => new Date().toISOString().split('T')[0];

const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 16 };
const input = { padding: '9px 11px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' };
const label = { fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' };

export default function CashBalancePage() {
  const [data, setData] = useState(null);
  const [asOf, setAsOf] = useState(today());
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    const d = await call('GET', '/api/cash-position');
    if (d.error) setMsg({ ok: false, text: d.error }); else setData(d);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setMsg(null);
    if (amount === '' || isNaN(Number(amount))) { setMsg({ ok: false, text: 'Enter the balance amount.' }); return; }
    setSaving(true);
    const d = await call('POST', '/api/cash-position', { as_of: asOf, amount: Number(amount), note });
    setSaving(false);
    if (d.error) { setMsg({ ok: false, text: d.error }); return; }
    setAmount(''); setNote(''); setMsg({ ok: true, text: 'Balance saved.' }); load();
  };
  const remove = async id => {
    if (!window.confirm('Remove this balance entry?')) return;
    const d = await call('DELETE', '/api/cash-position/' + id);
    if (d.error) setMsg({ ok: false, text: d.error }); else load();
  };

  const cur = data?.current;
  return (
    <div style={{ padding: 24, maxWidth: 860 }}>
      <div style={{ ...card, background: '#EEF2FF', borderColor: '#C7D2FE' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#4338CA', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Cash and bank balance today</div>
        <div style={{ fontSize: 34, fontWeight: 800, color: '#1E1B4B', margin: '6px 0' }}>{cur ? inr(cur.amount) : '…'}</div>
        {cur && cur.has_entry && (
          <div style={{ fontSize: 13, color: '#475569' }}>
            Balance you entered for {cur.entry_date}: {inr(cur.entry_amount)}, plus receipts less payments recorded since: {inr(cur.movement)}.
          </div>
        )}
        {cur && !cur.has_entry && (
          <div style={{ fontSize: 13, color: '#B45309' }}>No balance entered yet. Cash shows as ₹0 in the balance sheet, CFO agent and Digital Twin until you add one below.</div>
        )}
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Set your cash and bank balance</div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>
          Enter the total across your bank accounts and cash in hand as on a date. Receipts and payments you record in Accounting after that date are added automatically. Bank statements are not imported or stored.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div><label style={label}>Balance as on</label><input style={input} type="date" max={today()} value={asOf} onChange={e => setAsOf(e.target.value)} /></div>
          <div><label style={label}>Total balance (₹)</label><input style={input} type="number" step="0.01" placeholder="e.g. 1250000" value={amount} onChange={e => setAmount(e.target.value)} /></div>
          <div><label style={label}>Note (optional)</label><input style={input} maxLength={200} placeholder="e.g. All accounts, month end" value={note} onChange={e => setNote(e.target.value)} /></div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={save} disabled={saving} style={{ padding: '9px 18px', background: '#1B4FD8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save balance'}</button>
          {msg && <span style={{ fontSize: 13, color: msg.ok ? '#15803D' : '#B91C1C' }}>{msg.text}</span>}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Balance history</div>
        {data && data.entries.length === 0 && <div style={{ fontSize: 13, color: '#64748B' }}>No entries yet.</div>}
        {data && data.entries.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ textAlign: 'left', color: '#64748B' }}>
              <th style={{ padding: '6px 8px' }}>As on</th><th style={{ padding: '6px 8px', textAlign: 'right' }}>Balance</th><th style={{ padding: '6px 8px' }}>Note</th><th style={{ padding: '6px 8px' }}></th>
            </tr></thead>
            <tbody>
              {data.entries.map(e => (
                <tr key={e.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '8px' }}>{e.as_of}</td>
                  <td style={{ padding: '8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{inr(e.amount)}</td>
                  <td style={{ padding: '8px', color: '#64748B' }}>{e.note || ''}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}><button onClick={() => remove(e.id)} style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', fontSize: 12 }}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
