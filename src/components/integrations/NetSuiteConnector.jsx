import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const api = async (url, method='GET', body=null) => {
  try { const r = await fetch(apiURL(url), { method, headers: h(), body: body?JSON.stringify(body):null }); return await r.json(); }
  catch(e) { return { error: e.message }; }
};

export default function NetSuiteConnector() {
  const [connection, setConnection] = useState(null);
  const [entities, setEntities] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ account_id:'', consumer_key:'', consumer_secret:'', token_id:'', token_secret:'' });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState({});
  const [tab, setTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [selectedEntities, setSelectedEntities] = useState(['invoice','vendorbill','customer','vendor']);

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),4000); };

  const load = () => {
    api('/api/netsuite/config').then(r => { setConnection(r.connection); if (!r.connection) setShowForm(true); });
    api('/api/netsuite/entities').then(r => setEntities(r.entities||[]));
    api('/api/netsuite/sync-log').then(r => setLogs(r.logs||[]));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setLoading(p=>({...p,save:true}));
    const r = await api('/api/netsuite/config', 'POST', form);
    setLoading(p=>({...p,save:false}));
    if (r.success) { setConnection(r.connection); setShowForm(false); showToast('NetSuite credentials saved!'); }
    else showToast('Error: ' + r.error, false);
  };

  const test = async () => {
    setLoading(p=>({...p,test:true}));
    const r = await api('/api/netsuite/test', 'POST');
    setLoading(p=>({...p,test:false}));
    if (r.success) showToast('Connection successful! ' + r.message);
    else showToast('Failed: ' + r.error, false);
  };

  const sync = async (entity=null) => {
    const key = entity || 'all';
    setLoading(p=>({...p,[key]:true}));
    const body = entity ? {} : { entities: selectedEntities };
    const url = entity ? `/api/netsuite/sync/${entity}` : '/api/netsuite/sync';
    const r = await api(url, 'POST', body);
    setLoading(p=>({...p,[key]:false}));
    if (r.success || r.inserted !== undefined) {
      showToast(entity ? `${entity}: ${r.inserted} records synced` : `Full sync: ${r.total_inserted} records synced`);
      load();
    } else showToast('Sync error: ' + (r.error||'Unknown'), false);
  };

  const statusColor = (s) => s==='success'?'#059669':s==='error'?'#dc2626':'#d97706';

  return (
    <div style={{padding:20,background:'#f0f4ff',minHeight:'100%'}}>
      {toast && <div style={{position:'fixed',top:20,right:20,zIndex:9999,padding:'10px 16px',borderRadius:8,background:toast.ok?'#f0fdf4':'#fef2f2',border:`1px solid ${toast.ok?'#bbf7d0':'#fecaca'}`,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',fontSize:12,fontWeight:600,color:toast.ok?'#16a34a':'#dc2626'}}>{toast.msg}</div>}

      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#c8102e,#8b0000)',borderRadius:12,padding:'16px 20px',marginBottom:14,color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:48,height:48,background:'rgba(255,255,255,0.15)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:900}}>N</div>
          <div>
            <div style={{fontSize:17,fontWeight:900}}>Oracle NetSuite Connector</div>
            <div style={{fontSize:11,opacity:0.85}}>Real-time sync of invoices, bills, customers, vendors, employees — every 60 seconds</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          {connection && <button onClick={test} disabled={loading.test} style={{padding:'8px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.1)',color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>{loading.test?'Testing...':'Test Connection'}</button>}
          <button onClick={()=>setShowForm(true)} style={{padding:'8px 14px',borderRadius:8,border:'none',background:'rgba(255,255,255,0.2)',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>{connection?'Update Credentials':'Configure'}</button>
        </div>
      </div>

      {/* Credentials form */}
      {showForm && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',padding:24,marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:800,color:'#0f172a',marginBottom:4}}>NetSuite OAuth 1.0a Credentials</div>
          <div style={{fontSize:11,color:'#64748b',marginBottom:16}}>Go to NetSuite → Setup → Integration → Manage Integrations → Create Integration with Token-Based Authentication</div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[
              ['account_id','Account ID','1234567 or 1234567-sb2 (sandbox)','text'],
              ['consumer_key','Consumer Key','From NetSuite Integration record','text'],
              ['consumer_secret','Consumer Secret','From NetSuite Integration record','password'],
              ['token_id','Token ID','From Setup > Users/Roles > Access Tokens','text'],
              ['token_secret','Token Secret','From Setup > Users/Roles > Access Tokens','password'],
            ].map(([key,label,placeholder,type])=>(
              <div key={key}>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:3}}>{label.toUpperCase()}</label>
                <input type={type} value={form[key]||''} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder={placeholder} style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none',boxSizing:'border-box'}}/>
              </div>
            ))}
          </div>

          <div style={{background:'#fffbeb',border:'1px solid #fde047',borderRadius:8,padding:'10px 14px',marginTop:14,fontSize:11,color:'#78350f'}}>
            <strong>Setup Steps:</strong> 1) Create Integration in NetSuite with OAuth 1.0a enabled &rarr; 2) Generate Access Token via Setup &rarr; Users/Roles &rarr; Access Tokens &rarr; 3) Copy all 5 credentials above &rarr; 4) Click Save
          </div>

          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button onClick={save} disabled={loading.save||!form.account_id||!form.consumer_key} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#c8102e',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>{loading.save?'Saving...':'Save Credentials'}</button>
            {connection && <button onClick={()=>setShowForm(false)} style={{padding:'9px 20px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',fontSize:12,cursor:'pointer'}}>Cancel</button>}
          </div>
        </div>
      )}

      {connection && (
        <div>
          {/* Status card */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:14}}>
            {[
              ['Account ID', connection.account_id, '#1d4ed8'],
              ['Status', connection.sync_status||'pending', statusColor(connection.sync_status)],
              ['Records Synced', (connection.records_synced||0).toLocaleString('en-IN'), '#059669'],
              ['Last Sync', connection.last_sync_at ? new Date(connection.last_sync_at).toLocaleTimeString('en-IN') : 'Never', '#d97706'],
            ].map(([l,v,c],i)=>(
              <div key={i} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'12px 14px',borderLeft:`4px solid ${c}`}}>
                <div style={{fontSize:9,color:'#64748b',fontWeight:700,textTransform:'uppercase',marginBottom:3}}>{l}</div>
                <div style={{fontSize:13,fontWeight:800,color:c,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
            {[['overview','Overview'],['sync','Sync Now'],['logs','Sync Logs']].map(([id,label])=>(
              <button key={id} onClick={()=>setTab(id)} style={{padding:'7px 14px',borderRadius:8,border:`2px solid ${tab===id?'#c8102e':'#e2e8f0'}`,background:tab===id?'#fef2f2':'#fff',color:tab===id?'#c8102e':'#64748b',fontSize:11,fontWeight:tab===id?700:400,cursor:'pointer'}}>{label}</button>
            ))}
          </div>

          {/* Overview */}
          {tab==='overview' && (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:12}}>
              {entities.map(e=>(
                <div key={e.id} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'14px 16px',borderLeft:`4px solid ${e.color}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:800,color:'#0f172a'}}>{e.label}</div>
                      <div style={{fontSize:10,color:'#64748b'}}>{e.endpoint} &rarr; {e.target_table}</div>
                    </div>
                    <div style={{fontSize:10,color:'#64748b',background:'#f8faff',padding:'2px 8px',borderRadius:4}}>{Object.keys(e.field_map).length} fields</div>
                  </div>
                  <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}>
                    {Object.entries(e.field_map).slice(0,4).map(([k,v])=>(
                      <span key={k} style={{fontSize:9,padding:'1px 6px',background:'#f0f4ff',borderRadius:3,color:'#1d4ed8'}}>{k}&rarr;{v}</span>
                    ))}
                    {Object.keys(e.field_map).length>4 && <span style={{fontSize:9,color:'#94a3b8'}}>+{Object.keys(e.field_map).length-4} more</span>}
                  </div>
                  <button onClick={()=>sync(e.id)} disabled={loading[e.id]} style={{width:'100%',padding:'7px 0',borderRadius:7,border:'none',background:loading[e.id]?'#e2e8f0':e.color,color:'#fff',fontSize:11,fontWeight:700,cursor:loading[e.id]?'not-allowed':'pointer'}}>
                    {loading[e.id]?'Syncing...':'Sync Now'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Sync Now */}
          {tab==='sync' && (
            <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:20}}>
              <div style={{fontSize:13,fontWeight:800,color:'#0f172a',marginBottom:4}}>Full Sync</div>
              <div style={{fontSize:11,color:'#64748b',marginBottom:16}}>Select entities to sync from NetSuite to Finance OS. Data syncs automatically every 60 seconds when active.</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8,marginBottom:16}}>
                {entities.map(e=>(
                  <label key={e.id} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',borderRadius:8,border:`2px solid ${selectedEntities.includes(e.id)?e.color:'#e2e8f0'}`,background:selectedEntities.includes(e.id)?e.color+'10':'#fff',cursor:'pointer'}}>
                    <input type="checkbox" checked={selectedEntities.includes(e.id)} onChange={ev=>setSelectedEntities(p=>ev.target.checked?[...p,e.id]:p.filter(x=>x!==e.id))} style={{accentColor:e.color}}/>
                    <span style={{fontSize:11,fontWeight:600,color:selectedEntities.includes(e.id)?e.color:'#334155'}}>{e.label}</span>
                  </label>
                ))}
              </div>
              <button onClick={()=>sync()} disabled={loading.all||!selectedEntities.length} style={{padding:'10px 24px',borderRadius:8,border:'none',background:loading.all?'#e2e8f0':'#c8102e',color:'#fff',fontSize:13,fontWeight:700,cursor:loading.all?'not-allowed':'pointer'}}>
                {loading.all?'Syncing...':'Start Full Sync'}
              </button>
            </div>
          )}

          {/* Logs */}
          {tab==='logs' && (
            <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',overflow:'hidden'}}>
              <div style={{padding:'10px 16px',borderBottom:'1px solid #e2e8f0',fontSize:12,fontWeight:700,color:'#0f172a',display:'flex',justifyContent:'space-between'}}>
                <span>Sync Logs</span>
                <button onClick={()=>api('/api/netsuite/sync-log').then(r=>setLogs(r.logs||[]))} style={{padding:'3px 10px',borderRadius:5,border:'1px solid #e2e8f0',background:'#fff',fontSize:10,cursor:'pointer',color:'#64748b'}}>Refresh</button>
              </div>
              {!logs.length && <div style={{padding:24,textAlign:'center',color:'#94a3b8',fontSize:12}}>No sync logs yet. Run a sync to see results.</div>}
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                <thead><tr style={{background:'#f8faff'}}>{['Entity','Fetched','Inserted','Duration','Status','Time'].map(h=><th key={h} style={{padding:'7px 12px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:10,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
                <tbody>{logs.map((l,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #f8faff',background:i%2===0?'#fff':'#fafbff'}}>
                    <td style={{padding:'7px 12px',fontWeight:600}}>{l.entity_type}</td>
                    <td style={{padding:'7px 12px',color:'#64748b'}}>{l.records_fetched}</td>
                    <td style={{padding:'7px 12px',color:'#059669',fontWeight:700}}>{l.records_inserted}</td>
                    <td style={{padding:'7px 12px',color:'#94a3b8'}}>{l.duration_ms}ms</td>
                    <td style={{padding:'7px 12px'}}><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:statusColor(l.status)+'18',color:statusColor(l.status)}}>{l.status}</span></td>
                    <td style={{padding:'7px 12px',color:'#94a3b8'}}>{new Date(l.created_at).toLocaleString('en-IN')}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
