import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';

const hdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 16 };
const inp = { padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, width: 130, boxSizing: 'border-box' };
const lab = { fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' };
const TIER = { overdue: ['Overdue', '#DC2626'], discount: ['Take discount', '#16A34A'], due_soon: ['Due soon', '#D97706'], scheduled: ['Pay on due date', '#1B4FD8'], deferred: ['Pay later', '#7C3AED'] };

export default function PaymentPlanPage() {
  const [minCash, setMinCash] = useState('');
  const [hurdle, setHurdle] = useState(12);
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch(apiURL('/api/payment-plan?min_cash=' + (parseFloat(minCash) || 0) + '&hurdle=' + (parseFloat(hurdle) || 12)), { headers: hdr() });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setErr(j.error || ('Request failed (' + r.status + ')')); else { setD(j); setErr(null); }
    } catch (e) { setErr(e.message); }
  }, [minCash, hurdle]);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [load]);
  useEffect(() => { const h = () => load(); window.addEventListener('deemona_data_change', h); return () => window.removeEventListener('deemona_data_change', h); }, [load]);

  const tile = (t, v) => <div style={{ flex: '1 1 150px', background: '#F8FAFC', borderRadius: 10, padding: '10px 14px' }}><div style={{ fontSize: 12, color: '#64748B' }}>{t}</div><div style={{ fontSize: 18, fontWeight: 700 }}>{v}</div></div>;
  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Which bills to pay, and when</div>
        <div style={{ fontSize: 13, color: '#64748B', margin: '2px 0 12px' }}>Orders your approved bills so overdue ones go first, discounts worth more than your cost of money are taken, and the rest are paid on their due dates. Suggestions only: nothing is paid for you.</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div><label style={lab}>Keep at least this much cash (₹)</label><input style={inp} type="number" min="0" placeholder="0" value={minCash} onChange={e => setMinCash(e.target.value)} /></div>
          <div><label style={lab}>Your cost of money (% a year)</label><input style={inp} type="number" min="0" max="100" value={hurdle} onChange={e => setHurdle(e.target.value)} /></div>
        </div>
      </div>
      {err && <div style={{ ...card, color: '#DC2626' }}>{err}</div>}
      {!d && !err && <div style={{ color: '#64748B', padding: 8 }}>Loading…</div>}
      {d && (<>
        {d.warning && <div style={{ ...card, background: '#FEF2F2', borderColor: '#FCA5A5', color: '#991B1B', fontSize: 14 }}>{d.warning}</div>}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {tile('Approved bills', d.summary.bills + ' · ' + d.summary.total_inr)}
          {tile('To pay today', d.summary.pay_today_inr)}
          {tile('Discounts captured', d.summary.discount_savings_inr)}
          {tile('Lowest cash with this plan', d.lowest_cash_inr)}
        </div>
        <div style={card}>
          {d.rows.length === 0 ? <div style={{ fontSize: 13, color: '#64748B' }}>No approved bills are waiting to be paid.</div> : d.rows.map((r, i) => {
            const [t, c] = TIER[r.tier] || [r.tier, '#64748B'];
            return (
              <div key={i} style={{ display: 'flex', gap: 12, borderTop: i ? '1px solid #E2E8F0' : 'none', padding: '10px 0', alignItems: 'flex-start' }}>
                <span style={{ background: c + '1A', color: c, fontWeight: 700, fontSize: 11, borderRadius: 6, padding: '3px 8px', minWidth: 96, textAlign: 'center', marginTop: 2 }}>{t}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.party} · {r.ref}</div>
                  <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{r.reason}</div>
                  {r.saving_inr && <div style={{ fontSize: 13, color: '#16A34A', marginTop: 2 }}>Saves {r.saving_inr}</div>}
                </div>
                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><div style={{ fontWeight: 700 }}>{r.amount_inr}</div><div style={{ fontSize: 12, color: '#64748B' }}>Pay {r.pay_on_text}</div><div style={{ fontSize: 11, color: '#94A3B8' }}>Due {r.due_text}</div></div>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: '#64748B' }}>{d.note}</div>
      </>)}
    </div>
  );
}
