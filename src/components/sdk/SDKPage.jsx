import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { const r = await fetch(apiURL(url), { headers: h() }); return r.json(); };
const post = async (url, body) => { const r = await fetch(apiURL(url), { method:'POST', headers:h(), body:JSON.stringify(body) }); return r.json(); };
const del  = async url => { const r = await fetch(apiURL(url), { method:'DELETE', headers:h() }); return r.json(); };

const METHOD_COLORS = { GET:'#22C98A', POST:'#6C63FF', PUT:'#F5A623', DELETE:'#FF5C5C' };

export default function SDKPage() {
  const [tab, setTab] = useState('overview');
  const [keys, setKeys] = useState([]);
  const [docs, setDocs] = useState(null);
  const [usage, setUsage] = useState(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState(null);
  const [creating, setCreating] = useState(false);
  const [codeLang, setCodeLang] = useState('javascript');

  useEffect(()=>{
    get('/api/sdk/keys').then(d=>setKeys(d.keys||[]));
    get('/api/sdk/docs').then(setDocs);
    get('/api/sdk/usage').then(setUsage);
  },[]);

  const createKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    const d = await post('/api/sdk/keys', { name: newKeyName, permissions:['read','write'] });
    setNewKey(d); setCreating(false);
    setKeys(prev=>[...prev, { name:newKeyName, key_prefix:d.prefix, permissions:d.permissions, is_active:true, created_at:new Date() }]);
    setNewKeyName('');
  };

  const revokeKey = async (id) => {
    await del(`/api/sdk/keys/${id}`);
    setKeys(prev=>prev.filter(k=>k.id!==id));
  };

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, margin:0, marginBottom:6 }}>Developer SDK / Open API</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', margin:0 }}>Access all finance data programmatically — integrate Deemona with your apps, ERP, and workflows</p>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['overview','🚀 Overview'],['keys','🔑 API Keys'],['docs','📚 API Docs'],['examples','💻 Code Examples']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'10px 20px', fontSize:14, fontWeight:600, background:'none', border:'none', cursor:'pointer', borderBottom:tab===id?'2px solid #6C63FF':'2px solid transparent', color:tab===id?'#6C63FF':'var(--text-secondary)', marginBottom:-1 }}>{label}</button>
        ))}
      </div>

      {tab==='overview' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
            {[
              { label:'API Requests Today', value:usage?.requests_today||0, color:'#22C98A' },
              { label:'Requests This Month', value:usage?.requests_month||0, color:'#6C63FF' },
              { label:'Rate Limit', value:usage?.rate_limit||'1000/hr', color:'#F5A623' },
            ].map(k=>(
              <div key={k.label} style={{ padding:'14px 16px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:22, fontWeight:800, color:k.color }}>{k.value}</div>
                <div style={{ fontSize:13, color:'var(--text-muted)' }}>{k.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ padding:20, borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Base URL</div>
              <code style={{ display:'block', background:'var(--surface-3)', padding:12, borderRadius:8, fontSize:13, fontFamily:'monospace', wordBreak:'break-all' }}>
                {docs?.base_url || 'https://deemona-finance-os-api.onrender.com'}
              </code>
            </div>
            <div style={{ padding:20, borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Authentication</div>
              <code style={{ display:'block', background:'var(--surface-3)', padding:12, borderRadius:8, fontSize:13, fontFamily:'monospace' }}>
                Authorization: Bearer dm_your_api_key
              </code>
            </div>
          </div>

          <div style={{ marginTop:20, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[
              { icon:'📊', title:'Financial Statements', desc:'P&L, Balance Sheet, Cash Flow via API' },
              { icon:'◈', title:'Digital CFO', desc:'Ask financial questions programmatically' },
              { icon:'📄', title:'Invoice OCR', desc:'Process invoices via REST API' },
              { icon:'🔮', title:'Forecasting', desc:'Get 90-day cash and revenue forecasts' },
              { icon:'⚡', title:'Webhooks', desc:'Get notified on financial events' },
              { icon:'🛡', title:'Audit Data', desc:'Pull anomalies and audit trail' },
            ].map(f=>(
              <div key={f.title} style={{ padding:16, borderRadius:10, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:24, marginBottom:6 }}>{f.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:3 }}>{f.title}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='keys' && (
        <div style={{ maxWidth:700 }}>
          {newKey && (
            <div style={{ marginBottom:20, padding:16, borderRadius:12, background:'#22C98A12', border:'2px solid #22C98A30' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#22C98A', marginBottom:8 }}>API Key Created — Save it now!</div>
              <code style={{ display:'block', background:'var(--surface-3)', padding:12, borderRadius:8, fontSize:13, fontFamily:'monospace', wordBreak:'break-all' }}>{newKey.key}</code>
              <div style={{ fontSize:12, color:'#FF5C5C', marginTop:6 }}>This key will not be shown again. Copy it now.</div>
              <button onClick={()=>navigator.clipboard?.writeText(newKey.key)} style={{ marginTop:8, padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700, background:'#22C98A', color:'#fff', border:'none', cursor:'pointer' }}>Copy Key</button>
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            <input value={newKeyName} onChange={e=>setNewKeyName(e.target.value)} placeholder="Key name (e.g. Production App)" style={{ flex:1, padding:'10px 14px', borderRadius:9, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-primary)', fontSize:13 }} onKeyDown={e=>e.key==='Enter'&&createKey()} />
            <button onClick={createKey} disabled={!newKeyName.trim()||creating} style={{ padding:'10px 20px', borderRadius:9, fontSize:13, fontWeight:700, background:(!newKeyName.trim()||creating)?'var(--surface-3)':'linear-gradient(135deg,#6C63FF,#9B8FFF)', color:(!newKeyName.trim()||creating)?'var(--text-muted)':'#fff', border:'none', cursor:(!newKeyName.trim()||creating)?'not-allowed':'pointer' }}>
              {creating?'Creating...':'+ Generate Key'}
            </button>
          </div>

          {keys.length===0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-muted)', border:'2px dashed var(--border)', borderRadius:12 }}>
              <div style={{ fontSize:32, marginBottom:10 }}>🔑</div>
              <div>No API keys yet. Create one above.</div>
            </div>
          ) : (
            <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
              {keys.map((k,i)=>(
                <div key={i} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700 }}>{k.name}</div>
                    <code style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'monospace' }}>{k.key_prefix}</code>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ padding:'2px 8px', borderRadius:100, fontSize:11, fontWeight:600, background:'#22C98A20', color:'#22C98A' }}>Active</span>
                    {k.id && <button onClick={()=>revokeKey(k.id)} style={{ padding:'4px 10px', borderRadius:6, fontSize:12, background:'#FF5C5C15', color:'#FF5C5C', border:'1px solid #FF5C5C30', cursor:'pointer' }}>Revoke</button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab==='docs' && docs && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(480px,1fr))', gap:10 }}>
            {docs.endpoints?.map((ep,i)=>(
              <div key={i} style={{ display:'flex', gap:10, padding:'10px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-2)', alignItems:'flex-start' }}>
                <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:800, background:(METHOD_COLORS[ep.method]||'#6C63FF')+'20', color:METHOD_COLORS[ep.method]||'#6C63FF', flexShrink:0, letterSpacing:'0.03em' }}>{ep.method}</span>
                <div style={{ flex:1 }}>
                  <code style={{ fontSize:12, fontFamily:'monospace', color:'var(--text-primary)' }}>{ep.path}</code>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{ep.description}</div>
                  {ep.params?.length>0 && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Params: {ep.params.join(', ')}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='examples' && docs && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {Object.keys(docs.code_examples||{}).map(lang=>(
              <button key={lang} onClick={()=>setCodeLang(lang)} style={{ padding:'6px 16px', borderRadius:8, fontSize:13, fontWeight:600, background:codeLang===lang?'#6C63FF':'var(--surface-2)', color:codeLang===lang?'#fff':'var(--text-secondary)', border:'1px solid var(--border)', cursor:'pointer' }}>{lang}</button>
            ))}
          </div>
          <pre style={{ padding:20, borderRadius:12, background:'var(--surface-0)', border:'1px solid var(--border)', fontSize:13, fontFamily:'monospace', overflowX:'auto', lineHeight:1.6, color:'var(--text-primary)' }}>
            {docs.code_examples?.[codeLang]}
          </pre>
          <button onClick={()=>navigator.clipboard?.writeText(docs.code_examples?.[codeLang]||'')} style={{ marginTop:10, padding:'6px 16px', borderRadius:8, fontSize:12, background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-secondary)', cursor:'pointer' }}>Copy Code</button>
        </div>
      )}
    </div>
  );
}
