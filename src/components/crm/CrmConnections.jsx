import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiDel } from '../../api.js';

const NAMES = { hubspot: 'HubSpot', zoho: 'Zoho CRM', salesforce: 'Salesforce' };
const card = { padding: 16, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 };
const btn = { padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: '#fff' };
const btn2 = { ...btn, background: 'transparent', color: 'var(--accent)', border: '1px solid var(--accent)' };
const inp = { padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, width: '100%', boxSizing: 'border-box' };

export default function CrmConnections({ onSynced }) {
  const [st, setSt] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState('');
  const [token, setToken] = useState('');
  const [region, setRegion] = useState('in');
  const [sandbox, setSandbox] = useState(false);
  const [help, setHelp] = useState(false);

  const load = useCallback(async () => { try { setSt(await apiGet('/api/crm-connect/status')); } catch (e) { setMsg({ bad: true, text: e.message }); } }, []);
  useEffect(() => {
    load();
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get('crm_connected')) { setMsg({ text: (NAMES[q.get('crm_connected')] || 'CRM') + ' connected. Importing your leads now.' }); setTimeout(() => { load(); onSynced && onSynced(); }, 6000); }
      else if (q.get('crm_error')) setMsg({ bad: true, text: q.get('crm_error') });
      if (q.get('crm_connected') || q.get('crm_error')) window.history.replaceState({}, '', window.location.pathname);
    } catch (e) { /* ignore */ }
  }, [load]);

  const run = async (key, fn) => { setBusy(key); setMsg(null); try { await fn(); } catch (e) { setMsg({ bad: true, text: (e.message || 'Failed').replace(/^\{"error":"|"\}$/g, '') }); } finally { setBusy(''); } };
  const connectHubspot = () => run('hubspot', async () => {
    const r = await apiPost('/api/crm-connect/hubspot', { token });
    if (r.error) throw new Error(r.error);
    setToken(''); setMsg({ text: r.sync && r.sync.ok ? 'HubSpot connected. Imported ' + r.sync.imported + ' records.' : 'HubSpot connected. ' + ((r.sync && r.sync.error) || '') });
    await load(); onSynced && onSynced();
  });
  const startOauth = (p) => run(p, async () => {
    const r = await apiPost('/api/crm-connect/' + p + '/start', p === 'zoho' ? { region } : { sandbox });
    if (r.error) throw new Error(r.error);
    window.location.href = r.url;
  });
  const sync = (p) => run('sync' + p, async () => {
    const r = await apiPost('/api/crm-connect/' + p + '/sync', {});
    if (r.error) throw new Error(r.error);
    setMsg({ text: 'Imported ' + r.imported + ' records from ' + NAMES[p] + '.' }); await load(); onSynced && onSynced();
  });
  const disconnect = (p) => { if (!window.confirm('Disconnect ' + NAMES[p] + '? Leads already imported stay in your CRM page.')) return; run('del' + p, async () => { await apiDel('/api/crm-connect/' + p); await load(); }); };

  const when = (d) => d ? new Date(d).toLocaleString() : 'never';
  const row = (p) => st && st.providers.find(x => x.provider === p) || {};
  const Status = ({ p }) => { const r = row(p); if (!r.connected) return <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not connected</span>;
    return <div style={{ fontSize: 12 }}><span style={{ color: r.status === 'error' ? '#FF5C5C' : '#22C98A', fontWeight: 700 }}>{r.status === 'error' ? 'Problem' : 'Connected'}</span>
      <span style={{ color: 'var(--text-muted)' }}> · last import {when(r.last_sync_at)} · {r.last_count} records</span>
      {r.status === 'error' && r.last_error ? <div style={{ color: '#FF5C5C', marginTop: 4 }}>{r.last_error}</div> : null}</div>; };
  const Actions = ({ p }) => row(p).connected ? (
    <div style={{ display: 'flex', gap: 8 }}>
      <button style={btn} disabled={!!busy} onClick={() => sync(p)}>{busy === 'sync' + p ? 'Importing...' : 'Import now'}</button>
      <button style={btn2} disabled={!!busy} onClick={() => disconnect(p)}>Disconnect</button>
    </div>) : null;
  const ours = (p) => !row(p).connected;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Connect your CRM</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 10 }}>Imports leads and deals into this page every 3 hours. Nothing is written back to your CRM.</div>
        <button style={{ ...btn2, marginLeft: 'auto', padding: '4px 10px', fontSize: 12 }} onClick={() => setHelp(!help)}>{help ? 'Hide setup help' : 'Setup help'}</button>
      </div>
      {msg ? <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 10, fontSize: 13, background: msg.bad ? '#FF5C5C18' : '#22C98A18', color: msg.bad ? '#C0392B' : '#16794F' }}>{msg.text}</div> : null}
      {help && st ? (
        <div style={{ ...card, marginBottom: 12, fontSize: 12, lineHeight: 1.6 }}>
          <div><b>HubSpot:</b> Settings, Integrations, Private Apps, create an app with the scopes crm.objects.deals.read, crm.objects.contacts.read and crm.schemas.deals.read, then paste its access token below.</div>
          <div><b>Zoho CRM:</b> in api-console.zoho.in (use your Zoho region), add a Server-based Application. Authorized redirect URI: <code>{st.redirect_uris.zoho}</code></div>
          <div><b>Salesforce:</b> Setup, App Manager, New Connected App, enable OAuth with scopes "api" and "refresh_token", callback URL: <code>{st.redirect_uris.salesforce}</code></div>
          <div style={{ color: 'var(--text-muted)' }}>For Zoho and Salesforce the app's client ID and secret are saved once on the server by the administrator; each company then signs in with its own CRM account.</div>
        </div>) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
        <div style={card}>
          <div style={{ fontWeight: 700 }}>HubSpot</div><Status p="hubspot" />
          {ours('hubspot') ? (<>
            <input style={inp} type="password" placeholder="Private app access token" value={token} onChange={e => setToken(e.target.value)} autoComplete="off" />
            <button style={btn} disabled={!!busy || token.length < 20} onClick={connectHubspot}>{busy === 'hubspot' ? 'Connecting...' : 'Connect HubSpot'}</button>
          </>) : <Actions p="hubspot" />}
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700 }}>Zoho CRM</div><Status p="zoho" />
          {ours('zoho') ? (<>
            <select style={inp} value={region} onChange={e => setRegion(e.target.value)}>
              <option value="in">India (zoho.in)</option><option value="us">US (zoho.com)</option><option value="eu">Europe (zoho.eu)</option><option value="au">Australia (zoho.com.au)</option><option value="jp">Japan (zoho.jp)</option>
            </select>
            <button style={btn} disabled={!!busy} onClick={() => startOauth('zoho')}>{busy === 'zoho' ? 'Opening...' : 'Connect Zoho CRM'}</button>
            {st && !row('zoho').configured ? <div style={{ fontSize: 11, color: '#C0392B' }}>Not set up on the server yet. See Setup help.</div> : null}
          </>) : <Actions p="zoho" />}
        </div>
        <div style={card}>
          <div style={{ fontWeight: 700 }}>Salesforce</div><Status p="salesforce" />
          {ours('salesforce') ? (<>
            <label style={{ fontSize: 12 }}><input type="checkbox" checked={sandbox} onChange={e => setSandbox(e.target.checked)} /> Sandbox account</label>
            <button style={btn} disabled={!!busy} onClick={() => startOauth('salesforce')}>{busy === 'salesforce' ? 'Opening...' : 'Connect Salesforce'}</button>
            {st && !row('salesforce').configured ? <div style={{ fontSize: 11, color: '#C0392B' }}>Not set up on the server yet. See Setup help.</div> : null}
          </>) : <Actions p="salesforce" />}
        </div>
      </div>
    </div>
  );
}
