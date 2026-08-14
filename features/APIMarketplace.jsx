import { useState } from 'react';

const ENDPOINTS = [
  { method: 'GET',  path: '/api/accounting/ar',            desc: 'List all AR invoices',           auth: true,  rate: '100/min' },
  { method: 'POST', path: '/api/accounting/ar',            desc: 'Create AR invoice',              auth: true,  rate: '50/min' },
  { method: 'GET',  path: '/api/accounting/ap',            desc: 'List all AP invoices',           auth: true,  rate: '100/min' },
  { method: 'GET',  path: '/api/treasury/accounts',        desc: 'Get bank accounts',              auth: true,  rate: '100/min' },
  { method: 'GET',  path: '/api/treasury/transactions',    desc: 'List bank transactions',         auth: true,  rate: '100/min' },
  { method: 'GET',  path: '/api/payroll/employees',        desc: 'List all employees',             auth: true,  rate: '100/min' },
  { method: 'POST', path: '/api/payroll/run',              desc: 'Run payroll calculation',        auth: true,  rate: '5/min' },
  { method: 'GET',  path: '/api/crm/leads',               desc: 'Get CRM pipeline leads',         auth: true,  rate: '100/min' },
  { method: 'POST', path: '/api/crm/leads',               desc: 'Create new CRM lead',            auth: true,  rate: '50/min' },
  { method: 'GET',  path: '/api/projects',                 desc: 'List all projects',              auth: true,  rate: '100/min' },
  { method: 'GET',  path: '/api/tax/filings',             desc: 'Get GST filing calendar',        auth: true,  rate: '100/min' },
  { method: 'GET',  path: '/api/forecasting/cash-flow',   desc: '90-day cash flow forecast',      auth: true,  rate: '20/min' },
  { method: 'POST', path: '/api/cfo/brief',               desc: 'Ask Digital CFO a question',     auth: true,  rate: '10/min' },
  { method: 'POST', path: '/api/document-ai/extract',     desc: 'Extract data from invoice image',auth: true,  rate: '20/min' },
  { method: 'POST', path: '/api/whatsapp/send',           desc: 'Send WhatsApp message',          auth: true,  rate: '30/min' },
  { method: 'GET',  path: '/api/statements/pl',           desc: 'Get P&L statement',              auth: true,  rate: '50/min' },
  { method: 'GET',  path: '/api/statements/balance-sheet',desc: 'Get balance sheet',              auth: true,  rate: '50/min' },
  { method: 'POST', path: '/api/currency/convert',        desc: 'Convert currency amounts',       auth: true,  rate: '200/min' },
  { method: 'GET',  path: '/api/compliance',              desc: 'Get compliance calendar',        auth: true,  rate: '100/min' },
  { method: 'POST', path: '/api/automation/trigger',      desc: 'Trigger an automation workflow', auth: true,  rate: '20/min' },
];

const WEBHOOKS = [
  { event: 'invoice.created',   desc: 'Fired when a new invoice is created' },
  { event: 'invoice.paid',      desc: 'Fired when an invoice is marked paid' },
  { event: 'payroll.approved',  desc: 'Fired when payroll run is approved' },
  { event: 'lead.stage.changed',desc: 'Fired when CRM lead stage changes' },
  { event: 'compliance.due',    desc: 'Fired 7 days before compliance deadline' },
  { event: 'expense.approved',  desc: 'Fired when expense claim is approved' },
  { event: 'po.approved',       desc: 'Fired when purchase order is approved' },
  { event: 'cash.alert',        desc: 'Fired when cash position drops below threshold' },
];

const SDKS = [
  { lang: 'JavaScript', icon: '🟨', install: 'npm install @deemona/finance-sdk', example: `const deemona = require('@deemona/finance-sdk');\nconst client = new deemona.Client({ apiKey: 'dk_live_...' });\nconst invoices = await client.accounting.ar.list();` },
  { lang: 'Python', icon: '🐍', install: 'pip install deemona-finance', example: `import deemona\nclient = deemona.Client(api_key='dk_live_...')\ninvoices = client.accounting.ar.list()` },
  { lang: 'PHP', icon: '🐘', install: 'composer require deemona/finance-sdk', example: `$client = new Deemona\\Client(['api_key' => 'dk_live_...']);\n$invoices = $client->accounting->ar->list();` },
  { lang: 'cURL', icon: '🔧', install: 'Available on all platforms', example: `curl -X GET https://deemona-finance-os-api.onrender.com/api/accounting/ar \\\n  -H "Authorization: Bearer dk_live_..." \\\n  -H "Content-Type: application/json"` },
];

const METHOD_COLORS = {
  GET:    { bg: '#ECFDF5', color: '#059669' },
  POST:   { bg: '#EEF3FD', color: '#1B4FD8' },
  PATCH:  { bg: '#FFFBEB', color: '#D97706' },
  DELETE: { bg: '#FEF2F2', color: '#DC2626' },
};

export default function APIMarketplace() {
  const [activeTab, setActiveTab] = useState('endpoints');
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: 'Production Key', key: 'dk_live_' + 'x'.repeat(32), created: '1 Aug 2026', lastUsed: '11 Aug 2026', requests: 1247 },
    { id: 2, name: 'Test Key', key: 'dk_test_' + 'x'.repeat(32), created: '10 Aug 2026', lastUsed: '11 Aug 2026', requests: 89 },
  ]);
  const [showKey, setShowKey] = useState({});
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedSDK, setSelectedSDK] = useState(0);
  const [copied, setCopied] = useState('');
  const [searchEndpoint, setSearchEndpoint] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const createKey = () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    setTimeout(() => {
      setApiKeys(prev => [...prev, {
        id: prev.length + 1,
        name: newKeyName,
        key: 'dk_live_' + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
        created: new Date().toLocaleDateString('en-IN'),
        lastUsed: 'Never',
        requests: 0,
      }]);
      setNewKeyName('');
      setCreating(false);
    }, 1000);
  };

  const filteredEndpoints = ENDPOINTS.filter(e => {
    if (methodFilter !== 'All' && e.method !== methodFilter) return false;
    if (searchEndpoint && !e.path.includes(searchEndpoint) && !e.desc.toLowerCase().includes(searchEndpoint.toLowerCase())) return false;
    return true;
  });

  const TABS = [
    { id: 'endpoints', label: '🔌 API Endpoints', count: ENDPOINTS.length },
    { id: 'keys', label: '🔑 API Keys', count: apiKeys.length },
    { id: 'webhooks', label: '🪝 Webhooks', count: WEBHOOKS.length },
    { id: 'sdks', label: '📦 SDKs & Libraries' },
    { id: 'playground', label: '🎮 API Playground' },
  ];

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628', marginBottom: 4 }}>API Marketplace & Developer Portal</h1>
        <div style={{ fontSize: 13, color: '#64748B' }}>Build integrations with Deemona Finance OS using our REST API.</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'API Endpoints', value: ENDPOINTS.length, color: '#1B4FD8', icon: '🔌' },
          { label: 'Webhooks', value: WEBHOOKS.length, color: '#7C3AED', icon: '🪝' },
          { label: 'API Requests Today', value: '1,336', color: '#059669', icon: '📡' },
          { label: 'Uptime', value: '99.9%', color: '#D97706', icon: '⚡' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 10, background: '#fff', border: '1px solid #C7D9F8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{s.label}</div>
              <span>{s.icon}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Base URL banner */}
      <div style={{ padding: '12px 16px', borderRadius: 10, background: '#0A1628', color: '#fff', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>BASE URL</div>
          <code style={{ fontSize: 14, color: '#60A5FA' }}>https://deemona-finance-os-api.onrender.com</code>
        </div>
        <button onClick={() => copyToClipboard('https://deemona-finance-os-api.onrender.com', 'baseurl')} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
          {copied === 'baseurl' ? '✓ Copied!' : 'Copy URL'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #C7D9F8', marginBottom: 20 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #1B4FD8' : '2px solid transparent', color: activeTab === tab.id ? '#1B4FD8' : '#64748B', cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap' }}>
            {tab.label} {tab.count ? <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 10, background: activeTab === tab.id ? '#1B4FD8' : '#E2E8F0', color: activeTab === tab.id ? '#fff' : '#64748B', marginLeft: 4 }}>{tab.count}</span> : null}
          </button>
        ))}
      </div>

      {/* Endpoints tab */}
      {activeTab === 'endpoints' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedEndpoint ? '1fr 400px' : '1fr', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#fff', border: '1px solid #C7D9F8', borderRadius: 7 }}>
                <span>🔍</span>
                <input value={searchEndpoint} onChange={e => setSearchEndpoint(e.target.value)} placeholder="Search endpoints..." style={{ border: 'none', outline: 'none', fontSize: 12, width: '100%', fontFamily: 'inherit' }} />
              </div>
              {['All','GET','POST','PATCH','DELETE'].map(m => (
                <button key={m} onClick={() => setMethodFilter(m)} style={{ padding: '7px 14px', borderRadius: 7, border: `1px solid ${methodFilter===m?'#1B4FD8':'#E2E8F0'}`, background: methodFilter===m?'#EEF3FD':'#fff', color: methodFilter===m?'#1B4FD8':'#334155', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{m}</button>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
              {filteredEndpoints.map((ep, i) => {
                const mc = METHOD_COLORS[ep.method] || METHOD_COLORS.GET;
                return (
                  <div key={i} onClick={() => setSelectedEndpoint(selectedEndpoint?.path === ep.path ? null : ep)}
                    style={{ padding: '12px 16px', borderBottom: i < filteredEndpoints.length-1 ? '1px solid #F1F5F9' : 'none', cursor: 'pointer', background: selectedEndpoint?.path === ep.path ? '#EEF3FD' : 'transparent', transition: 'background 0.1s', display: 'flex', alignItems: 'center', gap: 12 }}
                    onMouseEnter={e => { if (selectedEndpoint?.path !== ep.path) e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={e => { if (selectedEndpoint?.path !== ep.path) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 800, background: mc.bg, color: mc.color, width: 42, textAlign: 'center', flexShrink: 0 }}>{ep.method}</span>
                    <code style={{ fontSize: 12, color: '#1B4FD8', flex: 1 }}>{ep.path}</code>
                    <span style={{ fontSize: 12, color: '#64748B', flex: 2 }}>{ep.desc}</span>
                    <span style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap' }}>⚡ {ep.rate}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedEndpoint && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden', alignSelf: 'flex-start' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #EEF3FD', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Endpoint Details</div>
                <button onClick={() => setSelectedEndpoint(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 18 }}>×</button>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 800, background: METHOD_COLORS[selectedEndpoint.method]?.bg, color: METHOD_COLORS[selectedEndpoint.method]?.color }}>{selectedEndpoint.method}</span>
                  <code style={{ fontSize: 12, color: '#1B4FD8' }}>{selectedEndpoint.path}</code>
                </div>
                <div style={{ fontSize: 13, color: '#334155', marginBottom: 14 }}>{selectedEndpoint.desc}</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <span style={{ padding: '3px 8px', borderRadius: 6, background: '#ECFDF5', color: '#059669', fontSize: 11, fontWeight: 700 }}>🔒 Auth Required</span>
                  <span style={{ padding: '3px 8px', borderRadius: 6, background: '#F0F9FF', color: '#0284C7', fontSize: 11, fontWeight: 700 }}>⚡ {selectedEndpoint.rate}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Example cURL</div>
                  <div style={{ background: '#0A1628', borderRadius: 8, padding: '12px 14px', position: 'relative' }}>
                    <code style={{ fontSize: 11, color: '#60A5FA', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
{`curl -X ${selectedEndpoint.method} \\
  https://deemona-finance-os-api.onrender.com${selectedEndpoint.path} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                    </code>
                    <button onClick={() => copyToClipboard(`curl -X ${selectedEndpoint.method} https://deemona-finance-os-api.onrender.com${selectedEndpoint.path} -H "Authorization: Bearer YOUR_API_KEY"`, selectedEndpoint.path)}
                      style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 10, cursor: 'pointer' }}>
                      {copied === selectedEndpoint.path ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Response Format</div>
                  <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 12px' }}>
                    <code style={{ fontSize: 11, color: '#059669', whiteSpace: 'pre-wrap' }}>
{`{
  "success": true,
  "data": [...],
  "total": 10,
  "page": 1
}`}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* API Keys tab */}
      {activeTab === 'keys' && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Your API Keys</div>
            {apiKeys.map((key, i) => (
              <div key={key.id} style={{ padding: '16px 18px', borderBottom: i < apiKeys.length-1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>{key.name}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#64748B' }}>{key.requests.toLocaleString()} requests</span>
                    <button onClick={() => { const k = {...showKey}; k[key.id] = !k[key.id]; setShowKey(k); }} style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: 11, cursor: 'pointer' }}>
                      {showKey[key.id] ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => copyToClipboard(key.key, 'key'+key.id)} style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid #C7D9F8', background: '#F0F5FF', color: '#1B4FD8', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                      {copied === 'key'+key.id ? '✓ Copied!' : 'Copy'}
                    </button>
                    <button onClick={() => setApiKeys(prev => prev.filter(k => k.id !== key.id))} style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontSize: 11, cursor: 'pointer' }}>Revoke</button>
                  </div>
                </div>
                <code style={{ fontSize: 12, color: showKey[key.id] ? '#1B4FD8' : '#94A3B8', background: '#F8FAFC', padding: '6px 10px', borderRadius: 6, display: 'block', fontFamily: 'monospace' }}>
                  {showKey[key.id] ? key.key : key.key.substring(0, 12) + '•'.repeat(32)}
                </code>
                <div style={{ marginTop: 6, fontSize: 11, color: '#94A3B8' }}>Created: {key.created} · Last used: {key.lastUsed}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 12 }}>Generate New API Key</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Key name (e.g. Production, Staging, Zapier)" style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={createKey} disabled={creating || !newKeyName.trim()} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: creating ? '#93B4EF' : '#1B4FD8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer' }}>
                {creating ? 'Generating...' : '+ Generate Key'}
              </button>
            </div>
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 7, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 11, color: '#DC2626' }}>
              ⚠️ Keep your API keys secret. Never share them publicly or commit to source code.
            </div>
          </div>
        </div>
      )}

      {/* Webhooks tab */}
      {activeTab === 'webhooks' && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Available Webhook Events</div>
            {WEBHOOKS.map((wh, i) => (
              <div key={i} style={{ padding: '12px 18px', borderBottom: i < WEBHOOKS.length-1 ? '1px solid #F1F5F9' : 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                <code style={{ fontSize: 12, color: '#7C3AED', background: '#F5F3FF', padding: '3px 8px', borderRadius: 5, flexShrink: 0 }}>{wh.event}</code>
                <span style={{ fontSize: 12, color: '#334155', flex: 1 }}>{wh.desc}</span>
                <button onClick={() => copyToClipboard(wh.event, 'wh'+i)} style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: 11, cursor: 'pointer' }}>
                  {copied === 'wh'+i ? '✓' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 10 }}>Register Webhook Endpoint</div>
            <input placeholder="https://your-app.com/webhooks/deemona" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', marginBottom: 10, fontFamily: 'inherit' }} />
            <button style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#1B4FD8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Register Endpoint</button>
          </div>
        </div>
      )}

      {/* SDKs tab */}
      {activeTab === 'sdks' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {SDKS.map((sdk, i) => (
              <button key={sdk.lang} onClick={() => setSelectedSDK(i)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: `2px solid ${selectedSDK===i?'#1B4FD8':'#E2E8F0'}`, background: selectedSDK===i?'#EEF3FD':'#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: selectedSDK===i?'#1B4FD8':'#334155' }}>
                <span style={{ fontSize: 20 }}>{sdk.icon}</span> {sdk.lang}
              </button>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>{SDKS[selectedSDK].lang} SDK</div>
              <code style={{ fontSize: 12, color: '#1B4FD8', background: '#EEF3FD', padding: '4px 10px', borderRadius: 6 }}>{SDKS[selectedSDK].install}</code>
            </div>
            <div style={{ background: '#0A1628', padding: 20 }}>
              <pre style={{ margin: 0, fontSize: 13, color: '#60A5FA', fontFamily: 'JetBrains Mono, Fira Code, monospace', lineHeight: 1.7 }}>{SDKS[selectedSDK].example}</pre>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: 12, color: '#92400E' }}>
            🚧 SDKs are currently in beta. The npm/pip packages are coming soon. Use the REST API directly in the meantime.
          </div>
        </div>
      )}

      {/* Playground tab */}
      {activeTab === 'playground' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>🎮</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#334155', marginBottom: 8 }}>API Playground</div>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Test API calls directly from your browser without writing code.</div>
          <div style={{ padding: '14px', borderRadius: 10, background: '#EEF3FD', border: '1px solid #C7D9F8', maxWidth: 500, margin: '0 auto', textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1B4FD8', marginBottom: 10 }}>Quick Test — Get AR Invoices</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select style={{ padding: '8px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, background: '#ECFDF5', color: '#059669', fontWeight: 700 }}>
                <option>GET</option><option>POST</option><option>PATCH</option>
              </select>
              <input defaultValue="/api/accounting/ar" style={{ flex: 1, padding: '8px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none' }} />
              <button style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: '#1B4FD8', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Send</button>
            </div>
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: '#94A3B8' }}>Full interactive playground coming soon. Use Postman or cURL in the meantime.</div>
        </div>
      )}
    </div>
  );
}
