import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const hdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 16 };
const BAND = { High: '#DC2626', Medium: '#D97706', Low: '#16A34A' };

function Row({ name, sub, score, band, reasons, extra }) {
  const c = BAND[band] || '#64748B';
  return (
    <div style={{ display: 'flex', gap: 14, borderTop: '1px solid #E2E8F0', padding: '10px 0', alignItems: 'flex-start' }}>
      <div style={{ minWidth: 64, textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 800, color: c }}>{score}</div><div style={{ fontSize: 11, fontWeight: 700, color: c }}>{band}</div></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{name} <span style={{ fontWeight: 400, color: '#64748B' }}>· {sub}</span></div>
        {extra && <div style={{ fontSize: 12, color: '#94A3B8' }}>{extra}</div>}
        <ul style={{ margin: '4px 0 0', paddingLeft: 18, fontSize: 13, color: '#475569' }}>{reasons.map((t, i) => <li key={i}>{t}</li>)}</ul>
      </div>
    </div>
  );
}

export default function RiskPage() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(apiURL('/api/risk'), { headers: hdr() });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) setErr(j.error || ('Request failed (' + r.status + ')')); else setD(j);
      } catch (e) { setErr(e.message); }
    })();
  }, []);
  if (err) return <div style={{ ...card, color: '#DC2626' }}>{err}</div>;
  if (!d) return <div style={{ color: '#64748B', padding: 8 }}>Loading…</div>;
  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Where the risk is</div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{d.note} High means 50 or more, Medium 25 to 49.</div>
        {d.flags.length > 0 && <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 13, color: '#991B1B' }}>{d.flags.map((f, i) => <li key={i}><strong>{f.name}</strong>: {f.text}</li>)}</ul>}
      </div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Revenue risk</div>
        <Row name="Overall" sub={d.revenue.top_customers.map(t => t.name + ' ' + t.share_pct + '%').join(', ') || 'no revenue yet'} score={d.revenue.score} band={d.revenue.band} reasons={d.revenue.reasons.length ? d.revenue.reasons : ['Revenue is spread across customers and not falling.']} />
      </div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Customers: risk of paying late</div>
        {d.customers.length === 0 ? <div style={{ fontSize: 13, color: '#64748B' }}>No customers with open or past invoices.</div> : d.customers.map(c => <Row key={c.id} name={c.name} sub={'owes ' + c.owed_inr} score={c.score} band={c.band} reasons={c.reasons} extra={c.confidence} />)}
      </div>
      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Vendors: supply, tax and payment-control risk</div>
        {d.vendors.length === 0 ? <div style={{ fontSize: 13, color: '#64748B' }}>No vendor bills recorded yet.</div> : d.vendors.map(v => <Row key={v.id} name={v.name} sub={'12-month spend ' + v.spend_inr} score={v.score} band={v.band} reasons={v.reasons.length ? v.reasons : ['No risk signals found.']} />)}
        {d.vendor_hygiene && d.vendor_hygiene.idle_vendors > 0 && <div style={{ fontSize: 13, color: '#64748B', borderTop: '1px solid #E2E8F0', paddingTop: 10, marginTop: 6 }}>{d.vendor_hygiene.idle_vendors} vendor(s) have no bills yet, so they are not scored. {d.vendor_hygiene.missing_pan > 0 && d.vendor_hygiene.missing_pan + ' have no PAN'}{d.vendor_hygiene.missing_pan > 0 && d.vendor_hygiene.missing_gstin > 0 && ' and '}{d.vendor_hygiene.missing_gstin > 0 && d.vendor_hygiene.missing_gstin + ' have no GSTIN'}{(d.vendor_hygiene.missing_pan > 0 || d.vendor_hygiene.missing_gstin > 0) && ' on record. Add them before the first bill so TDS and input tax credit are handled correctly.'}</div>}
      </div>
    </div>
  );
}
