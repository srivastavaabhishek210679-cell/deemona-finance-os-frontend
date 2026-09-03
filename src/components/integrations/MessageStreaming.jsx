import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const api = async (url, method='GET', body=null) => {
  try { const r = await fetch(apiURL(url), { method, headers: h(), body: body?JSON.stringify(body):null }); return await r.json(); }
  catch(e) { return { error: e.message }; }
};

const TARGET_TABLES = ['ar_invoices','ap_invoices','expenses','bank_transactions','customers','vendors','employees','inventory_items','purchase_orders','crm_leads'];

export default function MessageStreaming() {
  const [templates, setTemplates] = useState([]);
  const [connections, setConnections] = useState([]);
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [form, setForm] = useState({ name:'', stream_type:'webhook', config:{}, topic_mappings:[] });
  const [loading, setLoading] = useState({});
  const [activeConn, setActiveConn] = useState(null);
  const [messages, setMessages] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),4000); };

  useEffect(() => {
    api('/api/stream-connections/templates').then(r => setTemplates(r.templates||[]));
    api('/api/stream-connections/connections').then(r => setConnections(r.connections||[]));
    api('/api/stream-connections/stats').then(r => setStats(r));
  }, []);

  const applyTemplate = (t) => {
    setSelectedTemplate(t);
    setForm(f => ({ ...f, name: t.name, stream_type: t.stream_type, topic_mappings: t.topic_mappings || [] }));
  };

  const save = async () => {
    const r = await api('/api/stream-connections/connections', 'POST', form);
    if (r.connection) { setConnections(p => [r.connection, ...p]); setShowForm(false); showToast('Stream connection created!'); }
    else showToast('Error: ' + r.error, false);
  };

  const test = async (id) => {
    setLoading(p => ({...p, [`test_${id}`]: true}));
    const r = await api(`/api/stream-connections/connections/${id}/test`, 'POST');
    setLoading(p => ({...p, [`test_${id}`]: false}));
    if (r.success) showToast('Connection config valid! ' + r.checks?.length + ' checks passed');
    else showToast('Config issues: ' + r.checks?.filter(c=>!c.pass).map(c=>c.check).join(', '), false);
  };

  const toggleActive = async (conn) => {
    await api(`/api/stream-connections/connections/${conn.id}`, 'PUT', { is_active: !conn.is_active });
    api('/api/stream-connections/connections').then(r => setConnections(r.connections||[]));
  };

  const loadMessages = async (id) => {
    setActiveConn(activeConn===id?null:id);
    const r = await api(`/api/stream-connections/connections/${id}/messages`);
    setMessages(p => ({...p, [id]: r.messages||[]}));
  };

  const copyWebhook = (id) => {
    const url = `${apiURL('/api/stream-connections/webhook')}/${id}`;
    navigator.clipboard?.writeText(url);
    showToast('Webhook URL copied!');
  };

  const getWebhookUrl = (id) => `${apiURL('/api/stream-connections/webhook')}/${id}`;

  const statusColor = (s) => s==='connected'?'#059669':s==='error'?'#dc2626':'#d97706';

  return (
    <div style={{padding:20,background:'#f0f4ff',minHeight:'100%'}}>
      {toast && <div style={{position:'fixed',top:20,right:20,zIndex:9999,padding:'10px 16px',borderRadius:8,background:toast.ok?'#f0fdf4':'#fef2f2',border:`1px solid ${toast.ok?'#bbf7d0':'#fecaca'}`,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',fontSize:12,fontWeight:600,color:toast.ok?'#16a34a':'#dc2626'}}>{toast.msg}</div>}

      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#0f172a,#1e3a8a)',borderRadius:12,padding:'16px 20px',marginBottom:14,color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontSize:17,fontWeight:900}}>Message Streaming Connectors</div>
          <div style={{fontSize:11,opacity:0.85}}>Kafka, RabbitMQ, Azure Service Bus, AWS SQS, Google Pub/Sub — real-time financial data streaming</div>
        </div>
        <button onClick={()=>setShowForm(true)} style={{padding:'8px 16px',borderRadius:8,border:'none',background:'rgba(255,255,255,0.15)',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>+ Add Stream</button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10,marginBottom:14}}>
          {[
            ['Total Streams', connections.length, '#1d4ed8'],
            ['Active', connections.filter(c=>c.is_active).length, '#059669'],
            ['Messages', connections.reduce((s,c)=>s+(c.messages_processed||0),0).toLocaleString('en-IN'), '#7c3aed'],
            ['Stream Types', [...new Set(connections.map(c=>c.stream_type))].length, '#d97706'],
          ].map(([l,v,c],i)=>(
            <div key={i} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'12px 14px',borderLeft:`4px solid ${c}`}}>
              <div style={{fontSize:9,color:'#64748b',fontWeight:700,textTransform:'uppercase',marginBottom:3}}>{l}</div>
              <div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',padding:20,marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:800,color:'#0f172a',marginBottom:14}}>New Message Stream Connection</div>

          {/* Template picker */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'#64748b',marginBottom:8}}>SELECT STREAM TYPE</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:8}}>
              {templates.map(t=>(
                <div key={t.id} onClick={()=>applyTemplate(t)} style={{padding:'12px',borderRadius:8,border:`2px solid ${selectedTemplate?.id===t.id?t.color:'#e2e8f0'}`,background:selectedTemplate?.id===t.id?t.color+'10':'#fff',cursor:'pointer',textAlign:'center'}}>
                  <div style={{width:36,height:36,borderRadius:8,background:t.color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:16,fontWeight:900,margin:'0 auto 6px'}}>{t.icon}</div>
                  <div style={{fontSize:11,fontWeight:700,color:selectedTemplate?.id===t.id?t.color:'#334155'}}>{t.name}</div>
                  <div style={{fontSize:9,color:'#94a3b8',marginTop:2}}>{t.description?.substring(0,30)}</div>
                </div>
              ))}
            </div>
          </div>

          {selectedTemplate && (
            <div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:3}}>CONNECTION NAME</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder={`My ${selectedTemplate.name} Connection`} style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:12,outline:'none',boxSizing:'border-box'}}/>
              </div>

              {/* Config fields */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                {(selectedTemplate.config_fields||[]).map(field=>(
                  <div key={field.key}>
                    <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:3}}>{field.label.toUpperCase()}</label>
                    {field.type==='textarea'?(
                      <textarea value={form.config[field.key]||''} onChange={e=>setForm(f=>({...f,config:{...f.config,[field.key]:e.target.value}}))} placeholder={field.placeholder} rows={3} style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none',boxSizing:'border-box',resize:'vertical'}}/>
                    ):field.type==='boolean'?(
                      <select value={form.config[field.key]?'true':'false'} onChange={e=>setForm(f=>({...f,config:{...f.config,[field.key]:e.target.value==='true'}}))} style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>
                        <option value="false">No</option><option value="true">Yes</option>
                      </select>
                    ):(
                      <input type={field.type} value={form.config[field.key]||''} onChange={e=>setForm(f=>({...f,config:{...f.config,[field.key]:e.target.value}}))} placeholder={field.placeholder} style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none',boxSizing:'border-box'}}/>
                    )}
                  </div>
                ))}
              </div>

              {/* Topic mappings */}
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:'#64748b',marginBottom:6}}>TOPIC TO TABLE MAPPINGS</div>
                {(form.topic_mappings||[]).map((m,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:8,marginBottom:6}}>
                    <input value={m.topic} onChange={e=>{const tm=[...form.topic_mappings];tm[i]={...tm[i],topic:e.target.value};setForm(f=>({...f,topic_mappings:tm}));}} placeholder="topic.name or *" style={{padding:'7px 10px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}/>
                    <select value={m.target_table} onChange={e=>{const tm=[...form.topic_mappings];tm[i]={...tm[i],target_table:e.target.value};setForm(f=>({...f,topic_mappings:tm}));}} style={{padding:'7px 10px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>
                      {TARGET_TABLES.map(t=><option key={t}>{t}</option>)}
                    </select>
                    <button onClick={()=>setForm(f=>({...f,topic_mappings:f.topic_mappings.filter((_,j)=>j!==i)}))} style={{padding:'7px 10px',borderRadius:7,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:11,cursor:'pointer'}}>X</button>
                  </div>
                ))}
                <button onClick={()=>setForm(f=>({...f,topic_mappings:[...f.topic_mappings,{topic:'',target_table:'ar_invoices',field_mapping:{}}]}))} style={{padding:'6px 12px',borderRadius:7,border:'1px solid #e2e8f0',background:'#fff',color:'#1d4ed8',fontSize:11,cursor:'pointer',fontWeight:600}}>+ Add Topic Mapping</button>
              </div>

              {/* Webhook note */}
              {selectedTemplate.webhook_note && (
                <div style={{background:'#fffbeb',border:'1px solid #fde047',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:11,color:'#78350f'}}>
                  <strong>Setup Note:</strong> {selectedTemplate.webhook_note}
                </div>
              )}
            </div>
          )}

          <div style={{display:'flex',gap:10,marginTop:12}}>
            <button onClick={save} disabled={!form.name||!selectedTemplate} style={{padding:'9px 20px',borderRadius:8,border:'none',background:form.name&&selectedTemplate?'#1e3a8a':'#e2e8f0',color:'#fff',fontSize:12,fontWeight:700,cursor:form.name&&selectedTemplate?'pointer':'not-allowed'}}>Save Connection</button>
            <button onClick={()=>{setShowForm(false);setSelectedTemplate(null);}} style={{padding:'9px 20px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',fontSize:12,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Connections */}
      {!connections.length && !showForm && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',padding:40,textAlign:'center'}}>
          <div style={{fontSize:32,marginBottom:10}}>&#128257;</div>
          <div style={{fontSize:14,fontWeight:700,color:'#334155',marginBottom:6}}>No stream connections yet</div>
          <div style={{fontSize:12,color:'#64748b',marginBottom:16}}>Connect Kafka, RabbitMQ, Azure Service Bus, AWS SQS, or any webhook source</div>
          <button onClick={()=>setShowForm(true)} style={{padding:'10px 20px',borderRadius:8,border:'none',background:'#1e3a8a',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>+ Add First Stream</button>
        </div>
      )}

      <div style={{display:'grid',gap:12}}>
        {connections.map(conn=>{
          const tmpl = templates.find(t=>t.id===conn.stream_type);
          return (
            <div key={conn.id} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',overflow:'hidden'}}>
              <div style={{padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:40,height:40,borderRadius:8,background:tmpl?.color||'#1e3a8a',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18,fontWeight:900,flexShrink:0}}>{tmpl?.icon||conn.stream_type[0].toUpperCase()}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:'#0f172a'}}>{conn.name}</div>
                    <div style={{fontSize:10,color:'#64748b'}}>{conn.stream_type} &middot; {conn.messages_processed||0} messages &middot; {(conn.topic_mappings||[]).length} topics</div>
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  <div style={{padding:'3px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:statusColor(conn.status)+'18',color:statusColor(conn.status)}}>{conn.status||'disconnected'}</div>
                  {conn.last_message_at && <div style={{fontSize:10,color:'#94a3b8'}}>Last: {new Date(conn.last_message_at).toLocaleTimeString('en-IN')}</div>}
                  <button onClick={()=>copyWebhook(conn.id)} style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',color:'#7c3aed',fontSize:10,cursor:'pointer',fontWeight:600}}>Copy Webhook URL</button>
                  <button onClick={()=>test(conn.id)} disabled={loading[`test_${conn.id}`]} style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',fontSize:10,cursor:'pointer',fontWeight:600}}>{loading[`test_${conn.id}`]?'Testing...':'Test Config'}</button>
                  <div onClick={()=>toggleActive(conn)} style={{width:32,height:18,borderRadius:9,background:conn.is_active?'#059669':'#e2e8f0',cursor:'pointer',position:'relative',flexShrink:0}}>
                    <div style={{width:14,height:14,borderRadius:'50%',background:'#fff',position:'absolute',top:2,left:conn.is_active?16:2,transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                  </div>
                  <button onClick={()=>loadMessages(conn.id)} style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',fontSize:10,cursor:'pointer'}}>Messages</button>
                </div>
              </div>

              {/* Webhook URL */}
              <div style={{padding:'6px 16px',background:'#f8faff',borderTop:'1px solid #e2e8f0',display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontSize:9,fontWeight:700,color:'#64748b',flexShrink:0}}>WEBHOOK URL:</span>
                <code style={{fontSize:10,color:'#1d4ed8',background:'#eff6ff',padding:'2px 8px',borderRadius:4,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{getWebhookUrl(conn.id)}</code>
                <button onClick={()=>copyWebhook(conn.id)} style={{padding:'3px 8px',borderRadius:4,border:'1px solid #dbeafe',background:'#fff',color:'#1d4ed8',fontSize:9,cursor:'pointer',flexShrink:0}}>Copy</button>
              </div>

              {activeConn===conn.id && (
                <div style={{borderTop:'1px solid #e2e8f0',padding:'10px 16px',background:'#f8faff',maxHeight:200,overflowY:'auto'}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#334155',marginBottom:6}}>Recent Messages</div>
                  {!(messages[conn.id]||[]).length && <div style={{fontSize:11,color:'#94a3b8'}}>No messages yet. Configure your source to POST to the webhook URL above.</div>}
                  {(messages[conn.id]||[]).map((m,i)=>(
                    <div key={i} style={{display:'flex',gap:10,padding:'4px 0',borderBottom:'1px solid #e2e8f0',fontSize:10}}>
                      <span style={{color:'#7c3aed',fontWeight:700,minWidth:80,overflow:'hidden',textOverflow:'ellipsis'}}>{m.topic}</span>
                      <span style={{color:'#334155',minWidth:80}}>{m.target_table}</span>
                      <span style={{color:'#059669',fontWeight:600}}>{m.status}</span>
                      <span style={{color:'#94a3b8'}}>{new Date(m.created_at).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Architecture info */}
      <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:16,marginTop:14}}>
        <div style={{fontSize:12,fontWeight:700,color:'#0f172a',marginBottom:10}}>How Message Streaming Works</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10}}>
          {[
            ['1. Connect', 'Choose your streaming platform (Kafka, RabbitMQ, etc.) and configure connection details.','#1d4ed8'],
            ['2. Copy Webhook URL', 'Each connection gets a unique webhook URL. Configure your stream forwarder to POST to this URL.','#7c3aed'],
            ['3. Map Topics', 'Map each topic/queue to a Finance OS table (invoices, expenses, payments, employees, etc.).','#059669'],
            ['4. Stream Live', 'Every message arrives in real-time, gets mapped, inserted into DB, and appears in dashboards within 2 seconds.','#d97706'],
          ].map(([t,d,c],i)=>(
            <div key={i} style={{padding:'10px 12px',background:'#f8faff',borderRadius:8,borderLeft:`3px solid ${c}`}}>
              <div style={{fontSize:11,fontWeight:800,color:c,marginBottom:3}}>{t}</div>
              <div style={{fontSize:10,color:'#64748b',lineHeight:1.5}}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
