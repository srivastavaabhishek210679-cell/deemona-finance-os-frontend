import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const api = async (url, method='GET', body=null) => {
  try { const r = await fetch(apiURL(url), { method, headers: h(), body: body?JSON.stringify(body):null }); return await r.json(); }
  catch(e) { return { error: e.message }; }
};

const SOURCE_ICONS = {
  oracle: '&#9728;', salesforce: '&#9729;', zoho: '&#9730;', hubspot: '&#9731;',
  sap: '&#9732;', odoo: '&#9733;', api: '&#9734;',
};

const AUTH_TYPES = [
  {id:'none',label:'No Auth'},
  {id:'api_key',label:'API Key / Bearer Token'},
  {id:'basic',label:'Basic Auth (Username/Password)'},
  {id:'bearer',label:'Bearer Token'},
  {id:'oauth2',label:'OAuth 2.0'},
];

const TARGET_TABLES = [
  'ar_invoices','ap_invoices','expenses','bank_transactions',
  'customers','vendors','employees','inventory_items','purchase_orders','crm_leads'
];

export default function UniversalPoller() {
  const [connections, setConnections] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [form, setForm] = useState({ name:'', source_type:'custom', base_url:'', auth_type:'none', auth_config:{}, headers:{}, endpoints:[{path:'',target_table:'ar_invoices',method:'GET',params:{}}], field_mapping:{}, target_table:'ar_invoices', poll_interval_seconds:60 });
  const [loading, setLoading] = useState({});
  const [logs, setLogs] = useState({});
  const [toast, setToast] = useState(null);
  const [activeConn, setActiveConn] = useState(null);

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),4000); };

  useEffect(() => {
    api('/api/poller/connections').then(r => setConnections(r.connections||[]));
    api('/api/poller/templates').then(r => setTemplates(r.templates||[]));
  }, []);

  const applyTemplate = (t) => {
    setSelectedTemplate(t);
    setForm(f => ({ ...f, name: t.name, source_type: t.source_type, base_url: t.base_url, auth_type: t.auth_type, endpoints: t.endpoints, field_mapping: t.field_mapping, poll_interval_seconds: t.poll_interval_seconds, target_table: t.endpoints?.[0]?.target_table || 'ar_invoices' }));
  };

  const save = async () => {
    const r = await api('/api/poller/connections', 'POST', form);
    if (r.connection) { setConnections(p => [r.connection, ...p]); setShowForm(false); showToast('Connection created!'); }
    else showToast('Error: ' + r.error, false);
  };

  const sync = async (id, name) => {
    setLoading(p => ({...p, [id]: true}));
    const r = await api(`/api/poller/connections/${id}/sync`, 'POST');
    setLoading(p => ({...p, [id]: false}));
    if (r.success) showToast(`${name}: ${r.records_inserted} records synced in ${r.duration_ms}ms`);
    else showToast(`Error: ${r.error}`, false);
    api('/api/poller/connections').then(r2 => setConnections(r2.connections||[]));
  };

  const test = async (id) => {
    setLoading(p => ({...p, [`test_${id}`]: true}));
    const r = await api(`/api/poller/connections/${id}/test`, 'POST');
    setLoading(p => ({...p, [`test_${id}`]: false}));
    if (r.success) showToast(`Test OK: ${r.total_fetched} records found`);
    else showToast(`Test failed: ${r.error}`, false);
  };

  const toggleActive = async (conn) => {
    await api(`/api/poller/connections/${conn.id}`, 'PUT', { is_active: !conn.is_active });
    api('/api/poller/connections').then(r => setConnections(r.connections||[]));
  };

  const loadLogs = async (id) => {
    setActiveConn(activeConn === id ? null : id);
    const r = await api(`/api/poller/connections/${id}/logs`);
    setLogs(p => ({...p, [id]: r.logs||[]}));
  };

  const statusColor = (s) => s==='success'?'#059669':s==='error'?'#dc2626':'#d97706';

  return (
    <div style={{padding:20,background:'#f0f4ff',minHeight:'100%'}}>
      {toast && <div style={{position:'fixed',top:20,right:20,zIndex:9999,padding:'10px 16px',borderRadius:8,background:toast.ok?'#f0fdf4':'#fef2f2',border:`1px solid ${toast.ok?'#bbf7d0':'#fecaca'}`,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',fontSize:12,fontWeight:600,color:toast.ok?'#16a34a':'#dc2626'}}>{toast.msg}</div>}

      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1e3a8a,#7c3aed)',borderRadius:12,padding:'16px 20px',marginBottom:14,color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontSize:17,fontWeight:900}}>Universal REST Poller</div>
          <div style={{fontSize:11,opacity:0.85}}>Connect any ERP, CRM, or REST API — auto-sync to Finance OS every 60 seconds</div>
        </div>
        <button onClick={()=>setShowForm(true)} style={{padding:'8px 16px',borderRadius:8,border:'none',background:'rgba(255,255,255,0.2)',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>+ Add Connection</button>
      </div>

      {/* Add Connection Form */}
      {showForm && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',padding:20,marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:800,color:'#0f172a',marginBottom:14}}>New Data Source Connection</div>

          {/* Template picker */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'#64748b',marginBottom:8}}>START FROM A TEMPLATE</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:8}}>
              {templates.map(t => (
                <div key={t.id} onClick={()=>applyTemplate(t)}
                  style={{padding:'10px 12px',borderRadius:8,border:`2px solid ${selectedTemplate?.id===t.id?'#7c3aed':'#e2e8f0'}`,background:selectedTemplate?.id===t.id?'#f5f3ff':'#fff',cursor:'pointer',textAlign:'center'}}>
                  <div style={{fontSize:11,fontWeight:700,color:selectedTemplate?.id===t.id?'#7c3aed':'#334155'}}>{t.name}</div>
                  <div style={{fontSize:9,color:'#94a3b8',marginTop:2,textTransform:'capitalize'}}>{t.source_type}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:3}}>CONNECTION NAME</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. NetSuite Production" style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:12,outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:3}}>BASE URL</label>
              <input value={form.base_url} onChange={e=>setForm(f=>({...f,base_url:e.target.value}))} placeholder="https://api.example.com" style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:12,outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:3}}>AUTH TYPE</label>
              <select value={form.auth_type} onChange={e=>setForm(f=>({...f,auth_type:e.target.value}))} style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}>
                {AUTH_TYPES.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:3}}>POLL INTERVAL (seconds)</label>
              <input type="number" value={form.poll_interval_seconds} onChange={e=>setForm(f=>({...f,poll_interval_seconds:parseInt(e.target.value)}))} style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:12,outline:'none',boxSizing:'border-box'}}/>
            </div>
          </div>

          {/* Auth config */}
          {form.auth_type === 'api_key' && (
            <div style={{marginTop:10}}>
              <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:3}}>API KEY / TOKEN</label>
              <input value={form.auth_config?.api_key||''} onChange={e=>setForm(f=>({...f,auth_config:{...f.auth_config,api_key:e.target.value}}))} placeholder="Enter API key or Bearer token" style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:12,outline:'none',boxSizing:'border-box'}}/>
            </div>
          )}
          {form.auth_type === 'basic' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:10}}>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:3}}>USERNAME</label>
                <input value={form.auth_config?.username||''} onChange={e=>setForm(f=>({...f,auth_config:{...f.auth_config,username:e.target.value}}))} style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:12,outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:3}}>PASSWORD</label>
                <input type="password" value={form.auth_config?.password||''} onChange={e=>setForm(f=>({...f,auth_config:{...f.auth_config,password:e.target.value}}))} style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:12,outline:'none',boxSizing:'border-box'}}/>
              </div>
            </div>
          )}

          {/* Endpoints */}
          <div style={{marginTop:12}}>
            <div style={{fontSize:11,fontWeight:700,color:'#64748b',marginBottom:6}}>API ENDPOINTS TO SYNC</div>
            {form.endpoints.map((ep,i) => (
              <div key={i} style={{display:'grid',gridTemplateColumns:'2fr 1fr 100px',gap:8,marginBottom:6}}>
                <input value={ep.path} onChange={e=>{const eps=[...form.endpoints];eps[i]={...eps[i],path:e.target.value};setForm(f=>({...f,endpoints:eps}));}} placeholder="/api/invoices" style={{padding:'7px 10px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}/>
                <select value={ep.target_table} onChange={e=>{const eps=[...form.endpoints];eps[i]={...eps[i],target_table:e.target.value};setForm(f=>({...f,endpoints:eps}));}} style={{padding:'7px 10px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>
                  {TARGET_TABLES.map(t=><option key={t}>{t}</option>)}
                </select>
                <button onClick={()=>setForm(f=>({...f,endpoints:f.endpoints.filter((_,j)=>j!==i)}))} style={{padding:'7px',borderRadius:7,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:11,cursor:'pointer'}}>Remove</button>
              </div>
            ))}
            <button onClick={()=>setForm(f=>({...f,endpoints:[...f.endpoints,{path:'',target_table:'ar_invoices',method:'GET',params:{}}]}))} style={{padding:'6px 12px',borderRadius:7,border:'1px solid #e2e8f0',background:'#fff',color:'#1d4ed8',fontSize:11,cursor:'pointer',fontWeight:600}}>+ Add Endpoint</button>
          </div>

          <div style={{display:'flex',gap:10,marginTop:16}}>
            <button onClick={save} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#7c3aed',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>Save Connection</button>
            <button onClick={()=>setShowForm(false)} style={{padding:'9px 20px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',fontSize:12,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Connections List */}
      {connections.length === 0 && !showForm && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',padding:40,textAlign:'center'}}>
          <div style={{fontSize:32,marginBottom:12}}>&#128279;</div>
          <div style={{fontSize:14,fontWeight:700,color:'#334155',marginBottom:6}}>No data sources connected</div>
          <div style={{fontSize:12,color:'#64748b',marginBottom:16}}>Connect NetSuite, Salesforce, SAP, Zoho, HubSpot, or any REST API</div>
          <button onClick={()=>setShowForm(true)} style={{padding:'10px 20px',borderRadius:8,border:'none',background:'#7c3aed',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>+ Add First Connection</button>
        </div>
      )}

      <div style={{display:'grid',gap:12}}>
        {connections.map(conn => (
          <div key={conn.id} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',overflow:'hidden'}}>
            <div style={{padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:40,height:40,borderRadius:8,background:'linear-gradient(135deg,#1e3a8a,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12,fontWeight:800,flexShrink:0}}>
                  {conn.source_type?.substring(0,3).toUpperCase()}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:'#0f172a'}}>{conn.name}</div>
                  <div style={{fontSize:10,color:'#64748b'}}>{conn.base_url?.substring(0,50)} &middot; Every {conn.poll_interval_seconds}s</div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{padding:'3px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:statusColor(conn.last_status)+'18',color:statusColor(conn.last_status)}}>
                  {conn.last_status||'pending'}
                </div>
                {conn.last_polled_at && <div style={{fontSize:10,color:'#94a3b8'}}>Last: {new Date(conn.last_polled_at).toLocaleTimeString('en-IN')}</div>}
                <div style={{fontSize:11,color:'#64748b'}}>{conn.records_synced||0} synced</div>
                <button onClick={()=>test(conn.id)} disabled={loading[`test_${conn.id}`]} style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',fontSize:10,cursor:'pointer',fontWeight:600}}>{loading[`test_${conn.id}`]?'Testing...':'Test'}</button>
                <button onClick={()=>sync(conn.id, conn.name)} disabled={loading[conn.id]} style={{padding:'5px 10px',borderRadius:6,border:'none',background:'#1d4ed8',color:'#fff',fontSize:10,cursor:'pointer',fontWeight:700}}>{loading[conn.id]?'Syncing...':'Sync Now'}</button>
                <div onClick={()=>toggleActive(conn)} style={{width:32,height:18,borderRadius:9,background:conn.is_active?'#059669':'#e2e8f0',cursor:'pointer',position:'relative',flexShrink:0}}>
                  <div style={{width:14,height:14,borderRadius:'50%',background:'#fff',position:'absolute',top:2,left:conn.is_active?16:2,transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                </div>
                <button onClick={()=>loadLogs(conn.id)} style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',fontSize:10,cursor:'pointer'}}>Logs</button>
              </div>
            </div>
            {activeConn === conn.id && logs[conn.id] && (
              <div style={{borderTop:'1px solid #e2e8f0',padding:'10px 16px',background:'#f8faff',maxHeight:200,overflowY:'auto'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#334155',marginBottom:6}}>Sync Logs</div>
                {logs[conn.id].length === 0 && <div style={{fontSize:11,color:'#94a3b8'}}>No logs yet</div>}
                {logs[conn.id].map((log,i) => (
                  <div key={i} style={{display:'flex',gap:12,padding:'4px 0',borderBottom:'1px solid #e2e8f0',fontSize:10}}>
                    <span style={{color:statusColor(log.status),fontWeight:700,minWidth:50}}>{log.status}</span>
                    <span style={{color:'#334155'}}>{log.records_inserted}/{log.records_fetched} records</span>
                    <span style={{color:'#64748b'}}>{log.duration_ms}ms</span>
                    <span style={{color:'#94a3b8'}}>{new Date(log.created_at).toLocaleString('en-IN')}</span>
                    {log.error && <span style={{color:'#dc2626',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{log.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:16,marginTop:14}}>
        <div style={{fontSize:12,fontWeight:700,color:'#0f172a',marginBottom:8}}>Supported Data Sources</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:8,fontSize:11,color:'#64748b'}}>
          {[['ERP Systems','NetSuite, SAP, Odoo, Microsoft Dynamics'],['CRM Systems','Salesforce, HubSpot, Zoho CRM, Pipedrive'],['Accounting','Zoho Books, QuickBooks, FreshBooks, Tally'],['Custom REST','Any REST API with JSON response']].map(([t,d],i)=>(
            <div key={i} style={{padding:'8px 10px',background:'#f8faff',borderRadius:7}}>
              <div style={{fontWeight:700,color:'#334155',marginBottom:2}}>{t}</div>
              <div>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
