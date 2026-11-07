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

const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 16 };
const input = { padding: '9px 11px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' };
const btn = (bg, fg) => ({ padding: '7px 14px', borderRadius: 8, border: 'none', background: bg, color: fg, fontSize: 13, fontWeight: 600, cursor: 'pointer' });
const PILL = { ok: ['#DCFCE7', '#166534', 'Healthy'], stale: ['#FEF3C7', '#92400E', 'Stale'], error: ['#FEE2E2', '#991B1B', 'Error'], waiting: ['#E0E7FF', '#3730A3', 'Waiting for data'], paused: ['#F1F5F9', '#475569', 'Paused'] };

const ago = v => {
  if (!v) return 'never';
  const s = Math.max(0, Math.round((Date.now() - new Date(v).getTime()) / 1000));
  if (s < 60) return s + ' sec ago';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' hr ago';
  return Math.round(s / 86400) + ' days ago';
};
const Pill = ({ status }) => { const p = PILL[status] || PILL.waiting; return <span style={{ padding: '2px 10px', borderRadius: 100, background: p[0], color: p[1], fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{p[2]}</span>; };

const SAMPLE = {
  invoice: `{
  "event_id": "INV-1001-v1",
  "entity": "ar_invoice",
  "data": {
    "invoice_number": "INV-1001",
    "customer_name": "Tata Consultancy",
    "date": "2026-11-05",
    "due_date": "2026-12-05",
    "amount": 100000,
    "gst_rate": 18
  }
}`,
  payment: `{
  "event_id": "PAY-77",
  "entity": "payment",
  "data": {
    "invoice_type": "ar",
    "invoice_number": "INV-1001",
    "amount": 50000,
    "payment_date": "2026-11-07"
  }
}`,
};

export default function DataSyncPage() {
  const [health, setHealth] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [events, setEvents] = useState([]);
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [fresh, setFresh] = useState(null); // { id, name, secret }
  const [copied, setCopied] = useState('');

  const load = useCallback(async () => {
    const [h, e, ev] = await Promise.all([call('GET', '/api/webhooks/health'), call('GET', '/api/webhooks/endpoints'), call('GET', '/api/webhooks/events')]);
    if (!h.error) setHealth(h);
    if (!e.error) setEndpoints(e.endpoints || []);
    if (!ev.error) setEvents(ev.events || []);
    if (h.error) setMsg({ ok: false, text: h.error });
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    const onChange = () => load();
    window.addEventListener('deemona_data_change', onChange);
    return () => { clearInterval(t); window.removeEventListener('deemona_data_change', onChange); };
  }, [load]);

  const copy = async (key, text) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(''), 1500); } catch { /* ignore */ }
  };
  const create = async () => {
    setMsg(null);
    if (!name.trim()) { setMsg({ ok: false, text: 'Give the endpoint a name.' }); return; }
    setBusy(true);
    const d = await call('POST', '/api/webhooks/endpoints', { name, source });
    setBusy(false);
    if (d.error) { setMsg({ ok: false, text: d.error }); return; }
    setFresh({ id: d.endpoint.id, name: d.endpoint.name, secret: d.secret });
    setName(''); setSource(''); load();
  };
  const rotate = async ep => {
    if (!window.confirm('Create a new secret for "' + ep.name + '"? The old one stops working immediately.')) return;
    const d = await call('POST', '/api/webhooks/endpoints/' + ep.id + '/rotate');
    if (d.error) setMsg({ ok: false, text: d.error }); else { setFresh({ id: ep.id, name: ep.name, secret: d.secret }); load(); }
  };
  const toggle = async ep => { await call('PATCH', '/api/webhooks/endpoints/' + ep.id, { is_active: !ep.is_active }); load(); };
  const remove = async ep => {
    if (!window.confirm('Delete "' + ep.name + '"? Systems still sending to it will be rejected.')) return;
    await call('DELETE', '/api/webhooks/endpoints/' + ep.id); load();
  };

  const urlFor = id => apiURL('/api/webhook-in/' + id);
  const sum = health && health.summary;

  return (
    <div style={{ padding: 24, maxWidth: 980 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div style={card}><div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>BOOKS LAST CHANGED</div>
          <div style={{ fontSize: 22, fontWeight: 800, margin: '6px 0' }}>{health && health.books && health.books.last_change ? ago(health.books.last_change) : '-'}</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>{health && health.books ? (health.books.ar || 0) + ' sales invoices, ' + (health.books.ap || 0) + ' bills' : ''}</div></div>
        <div style={card}><div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>DATA SOURCES</div>
          <div style={{ fontSize: 22, fontWeight: 800, margin: '6px 0' }}>{sum ? sum.total : '-'}</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>webhooks and connectors</div></div>
        <div style={card}><div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>NEED ATTENTION</div>
          <div style={{ fontSize: 22, fontWeight: 800, margin: '6px 0', color: sum && sum.attention ? '#B91C1C' : '#166534' }}>{sum ? sum.attention : '-'}</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>errors or stale syncs</div></div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Source health</div>
        {sum && sum.total === 0 && <div style={{ fontSize: 13, color: '#64748B' }}>No sources yet. Create a webhook endpoint below, or set up a connector under Data Integrations.</div>}
        {health && health.sources.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ textAlign: 'left', color: '#64748B' }}>
              <th style={{ padding: '6px 8px' }}>Source</th><th style={{ padding: '6px 8px' }}>Type</th><th style={{ padding: '6px 8px' }}>Last data</th><th style={{ padding: '6px 8px', textAlign: 'right' }}>Records</th><th style={{ padding: '6px 8px' }}>Status</th>
            </tr></thead>
            <tbody>
              {health.sources.map((s, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F1F5F9', verticalAlign: 'top' }}>
                  <td style={{ padding: 8 }}><div style={{ fontWeight: 600 }}>{s.name}</div>{s.detail && <div style={{ fontSize: 11, color: '#64748B' }}>{s.detail}</div>}{s.error && s.status !== 'ok' && <div style={{ fontSize: 11, color: '#B91C1C' }}>{s.error}</div>}</td>
                  <td style={{ padding: 8 }}>{s.kind}</td>
                  <td style={{ padding: 8 }}>{ago(s.last_at)}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{s.records}{s.failed ? <span style={{ color: '#B91C1C' }}> ({s.failed} failed)</span> : null}</td>
                  <td style={{ padding: 8 }}><Pill status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Real-time webhooks</div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>
          Let SAP, Zoho, Tally bridges, or any system push a change the moment it happens. Each endpoint has its own secret and only writes to your company. Supported records: customers, vendors, sales invoices, bills and payments.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
          <input style={input} maxLength={80} placeholder="Endpoint name, e.g. Zoho Books" value={name} onChange={e => setName(e.target.value)} />
          <input style={input} maxLength={60} placeholder="Source system (optional)" value={source} onChange={e => setSource(e.target.value)} />
          <div><button style={btn('#1B4FD8', '#fff')} disabled={busy} onClick={create}>{busy ? 'Creating…' : 'Create endpoint'}</button></div>
        </div>
        {msg && <div style={{ fontSize: 13, color: msg.ok ? '#15803D' : '#B91C1C', marginBottom: 10 }}>{msg.text}</div>}

        {fresh && (
          <div style={{ border: '1px solid #FCD34D', background: '#FFFBEB', borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Copy these now: the secret for "{fresh.name}" is shown only once</div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 2 }}>URL</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}><code style={{ flex: 1, padding: 8, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12, wordBreak: 'break-all' }}>{urlFor(fresh.id)}</code><button style={btn('#E2E8F0', '#0F172A')} onClick={() => copy('url', urlFor(fresh.id))}>{copied === 'url' ? 'Copied' : 'Copy'}</button></div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 2 }}>Secret (send as header <code>Authorization: Bearer &lt;secret&gt;</code>)</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><code style={{ flex: 1, padding: 8, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12, wordBreak: 'break-all' }}>{fresh.secret}</code><button style={btn('#E2E8F0', '#0F172A')} onClick={() => copy('sec', fresh.secret)}>{copied === 'sec' ? 'Copied' : 'Copy'}</button></div>
            <details><summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Example messages</summary>
              <div style={{ fontSize: 12, color: '#64748B', margin: '8px 0 2px' }}>New or updated sales invoice (use "ap_invoice" with "vendor_name" for bills)</div>
              <pre style={{ background: '#0F172A', color: '#E2E8F0', padding: 10, borderRadius: 8, fontSize: 12, overflowX: 'auto' }}>{SAMPLE.invoice}</pre>
              <div style={{ fontSize: 12, color: '#64748B', margin: '8px 0 2px' }}>Payment received or made</div>
              <pre style={{ background: '#0F172A', color: '#E2E8F0', padding: 10, borderRadius: 8, fontSize: 12, overflowX: 'auto' }}>{SAMPLE.payment}</pre>
              <div style={{ fontSize: 12, color: '#64748B' }}>Send up to 100 events at once as {'{ "events": [ … ] }'}. Re-sending the same event_id is safe: it is ignored.</div>
            </details>
            <div style={{ marginTop: 10 }}><button style={btn('#E2E8F0', '#0F172A')} onClick={() => setFresh(null)}>I have copied it</button></div>
          </div>
        )}

        {endpoints.length === 0 ? <div style={{ fontSize: 13, color: '#64748B' }}>No endpoints yet.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ textAlign: 'left', color: '#64748B' }}>
              <th style={{ padding: '6px 8px' }}>Name</th><th style={{ padding: '6px 8px' }}>Secret</th><th style={{ padding: '6px 8px' }}>Last received</th><th style={{ padding: '6px 8px', textAlign: 'right' }}>OK / failed</th><th></th>
            </tr></thead>
            <tbody>
              {endpoints.map(ep => (
                <tr key={ep.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: 8 }}><div style={{ fontWeight: 600 }}>{ep.name}{!ep.is_active && <span style={{ marginLeft: 6, fontSize: 11, color: '#64748B' }}>(paused)</span>}</div><div style={{ fontSize: 11, color: '#64748B' }}>{ep.source || ''}</div></td>
                  <td style={{ padding: 8 }}><code style={{ fontSize: 12 }}>{ep.secret_hint}</code></td>
                  <td style={{ padding: 8 }}>{ago(ep.last_received_at)}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{ep.events_ok} / {ep.events_failed}</td>
                  <td style={{ padding: 8, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button style={{ ...btn('transparent', '#1B4FD8'), padding: '4px 8px' }} onClick={() => copy('u' + ep.id, urlFor(ep.id))}>{copied === 'u' + ep.id ? 'Copied' : 'Copy URL'}</button>
                    <button style={{ ...btn('transparent', '#1B4FD8'), padding: '4px 8px' }} onClick={() => rotate(ep)}>New secret</button>
                    <button style={{ ...btn('transparent', '#475569'), padding: '4px 8px' }} onClick={() => toggle(ep)}>{ep.is_active ? 'Pause' : 'Resume'}</button>
                    <button style={{ ...btn('transparent', '#B91C1C'), padding: '4px 8px' }} onClick={() => remove(ep)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Recent webhook activity</div>
        {events.length === 0 ? <div style={{ fontSize: 13, color: '#64748B' }}>Nothing received yet.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ textAlign: 'left', color: '#64748B' }}><th style={{ padding: '6px 8px' }}>When</th><th style={{ padding: '6px 8px' }}>Endpoint</th><th style={{ padding: '6px 8px' }}>Record</th><th style={{ padding: '6px 8px' }}>Result</th></tr></thead>
            <tbody>
              {events.map(e => (
                <tr key={e.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: 8, whiteSpace: 'nowrap' }}>{ago(e.created_at)}</td>
                  <td style={{ padding: 8 }}>{e.endpoint_name || '-'}</td>
                  <td style={{ padding: 8 }}>{(e.entity || '').replace(/_/g, ' ')}</td>
                  <td style={{ padding: 8, color: e.status === 'ok' ? '#166534' : '#B91C1C' }}>{e.status === 'ok' ? 'OK: ' : 'Failed: '}{e.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
