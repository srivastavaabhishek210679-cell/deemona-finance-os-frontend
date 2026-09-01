import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const api = async (url, method='GET', body=null) => {
  try {
    const r = await fetch(apiURL(url), { method, headers: h(), body: body?JSON.stringify(body):null });
    return await r.json();
  } catch(e) { return { error: e.message }; }
};

const Badge = ({text, color='#1d4ed8'}) => <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:color+'18',color,border:`1px solid ${color}30`}}>{text}</span>;
const Toggle = ({value, onChange}) => (
  <div onClick={()=>onChange(!value)} style={{width:40,height:22,borderRadius:11,background:value?'#1d4ed8':'#e2e8f0',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}>
    <div style={{position:'absolute',top:3,left:value?20:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
  </div>
);

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DATA_TYPES = ['Auto-detect','SALES_INVOICES','PURCHASE_INVOICES','EXPENSES','INVENTORY','PAYROLL','CUSTOMERS','VENDORS','BANK_TRANSACTIONS','ASSETS'];


function SlackTeamsTab({api}) {
  const [slackConfig, setSlackConfig] = React.useState(null);
  const [teamsConfig, setTeamsConfig] = React.useState(null);
  const [logs, setLogs] = React.useState([]);
  React.useEffect(()=>{
    api('/api/auto-ingest/slack/config').then(r=>setSlackConfig(r));
    api('/api/auto-ingest/teams/config').then(r=>setTeamsConfig(r));
    api('/api/auto-ingest/logs').then(r=>setLogs((r.logs||[]).filter(l=>l.channel==='slack'||l.channel==='teams')));
  },[]);

  const Card = ({name,color,config}) => (
    <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',overflow:'hidden',marginBottom:14}}>
      <div style={{padding:'10px 14px',background:color,display:'flex',alignItems:'center',gap:8}}>
        <span style={{color:'#fff',fontWeight:800,fontSize:13}}>{name}</span>
        <span style={{marginLeft:'auto',padding:'2px 8px',background:'rgba(255,255,255,0.2)',borderRadius:4,fontSize:10,color:'#fff',fontWeight:600}}>Webhook</span>
      </div>
      <div style={{padding:14}}>
        <div style={{fontSize:10,fontWeight:700,color:'#64748b',marginBottom:4}}>WEBHOOK URL (paste into {name})</div>
        <div style={{background:'#f8faff',borderRadius:6,padding:'8px 10px',fontSize:11,color:'#334155',fontFamily:'monospace',wordBreak:'break-all',border:'1px solid #e2e8f0',marginBottom:6}}>{config?.webhook_url||'Loading...'}</div>
        <button onClick={()=>navigator.clipboard?.writeText(config?.webhook_url||'')} style={{padding:'5px 10px',borderRadius:5,border:'1px solid #e2e8f0',background:'#fff',fontSize:10,cursor:'pointer',color:'#1d4ed8',fontWeight:600,marginBottom:12}}>Copy URL</button>
        <div style={{fontSize:10,fontWeight:700,color:'#64748b',marginBottom:6}}>SETUP STEPS</div>
        {(config?.setup_steps||[]).map((s,i)=><div key={i} style={{fontSize:11,color:'#334155',marginBottom:3,padding:'4px 8px',background:'#f8faff',borderRadius:4,borderLeft:'3px solid '+color}}>{s}</div>)}
        <div style={{marginTop:10,fontSize:10,fontWeight:700,color:'#64748b',marginBottom:4}}>FINANCIAL KEYWORDS DETECTED</div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{(config?.keywords_detected||[]).map((k,i)=><span key={i} style={{padding:'2px 8px',background:'#f0f4ff',color:'#1d4ed8',borderRadius:4,fontSize:10,fontWeight:600}}>{k}</span>)}</div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <Card name="Slack" color="#4A154B" config={slackConfig}/>
        <Card name="Microsoft Teams" color="#6264A7" config={teamsConfig}/>
      </div>
      <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',overflow:'hidden'}}>
        <div style={{padding:'10px 14px',borderBottom:'1px solid #e2e8f0',fontSize:12,fontWeight:700,color:'#0f172a'}}>Recent Slack & Teams Captures</div>
        {!logs.length?<div style={{padding:24,textAlign:'center',color:'#94a3b8',fontSize:12}}>No messages captured yet. Configure webhooks above.</div>:(
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead><tr style={{background:'#f8faff'}}>{['Channel','Message','Time','Status'].map(h=><th key={h} style={{padding:'7px 12px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:10,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
            <tbody>{logs.map((l,i)=>(
              <tr key={i} style={{borderBottom:'1px solid #f8faff'}}>
                <td style={{padding:'7px 12px'}}><span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:l.channel==='slack'?'#f3e8ff':'#ede9fe',color:l.channel==='slack'?'#7c3aed':'#6264A7'}}>{(l.channel||'').toUpperCase()}</span></td>
                <td style={{padding:'7px 12px',color:'#334155',maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.message}</td>
                <td style={{padding:'7px 12px',color:'#94a3b8'}}>{new Date(l.created_at).toLocaleString('en-IN')}</td>
                <td style={{padding:'7px 12px'}}><span style={{padding:'2px 6px',borderRadius:4,fontSize:10,background:'#f0fdf4',color:'#16a34a',fontWeight:700}}>{l.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AutoIngestHub() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [webhooks, setWebhooks] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [emailRules, setEmailRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState({});

  // Forms
  const [whForm, setWhForm] = useState({ name:'', data_type:'', description:'' });
  const [schForm, setSchForm] = useState({ name:'', source_type:'url', source_url:'', format:'csv', data_type:'', frequency:'daily', time:'08:00', day_of_week:1 });
  const [emForm, setEmForm] = useState({ name:'', from_email:'', subject_contains:'', data_type:'' });

  useEffect(() => { loadAll(); }, []);

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),4000); };

  const loadAll = async () => {
    const [s,w,sc,em,l] = await Promise.all([
      api('/api/auto-ingest/stats'),
      api('/api/auto-ingest/webhooks'),
      api('/api/auto-ingest/schedules'),
      api('/api/auto-ingest/email-rules'),
      api('/api/auto-ingest/logs'),
    ]);
    setStats(s);
    setWebhooks(w.webhooks||[]);
    setSchedules(sc.schedules||[]);
    setEmailRules(em.rules||[]);
    setLogs(l.logs||[]);
  };

  const createWebhook = async () => {
    if (!whForm.name) return showToast('❌ Name required', false);
    const r = await api('/api/auto-ingest/webhooks','POST', whForm);
    if (r.success) { showToast('✅ Webhook created'); setWhForm({name:'',data_type:'',description:''}); loadAll(); }
    else showToast('❌ '+r.error, false);
  };

  const deleteWebhook = async (id) => {
    await api(`/api/auto-ingest/webhooks/${id}`,'DELETE');
    showToast('Webhook deleted'); loadAll();
  };

  const createSchedule = async () => {
    if (!schForm.name||!schForm.source_url) return showToast('❌ Name and URL required', false);
    const r = await api('/api/auto-ingest/schedules','POST', schForm);
    if (r.success) { showToast('✅ Schedule created'); setSchForm({name:'',source_type:'url',source_url:'',format:'csv',data_type:'',frequency:'daily',time:'08:00',day_of_week:1}); loadAll(); }
    else showToast('❌ '+r.error, false);
  };

  const runScheduleNow = async (id, name) => {
    setLoading(p=>({...p,[id]:true}));
    const r = await api(`/api/auto-ingest/schedules/${id}/run`,'POST');
    setLoading(p=>({...p,[id]:false}));
    if (r.success) { showToast(`✅ ${name}: ${r.inserted} records imported`); loadAll(); }
    else showToast('❌ '+(r.error||'Failed'), false);
  };

  const deleteSchedule = async (id) => {
    await api(`/api/auto-ingest/schedules/${id}`,'DELETE');
    showToast('Schedule deleted'); loadAll();
  };

  const createEmailRule = async () => {
    if (!emForm.name) return showToast('❌ Name required', false);
    const r = await api('/api/auto-ingest/email-rules','POST', emForm);
    if (r.success) { showToast('✅ Email rule created'); setEmForm({name:'',from_email:'',subject_contains:'',data_type:''}); loadAll(); }
    else showToast('❌ '+r.error, false);
  };

  const deleteEmailRule = async (id) => {
    await api(`/api/auto-ingest/email-rules/${id}`,'DELETE');
    showToast('Email rule deleted'); loadAll();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('✅ Copied to clipboard');
  };

  const CHANNELS = [
    { id:'webhook', icon:'🔗', label:'Webhook API', desc:'External systems push data via HTTP POST', color:'#1d4ed8', count:stats.webhooks?.count||0, activity:stats.webhooks?.calls||0, actLabel:'total calls' },
    { id:'schedule', icon:'⏰', label:'Scheduled URL Sync', desc:'Auto-fetch Google Sheets, CSV endpoints, APIs on schedule', color:'#059669', count:stats.schedules?.count||0, activity:stats.schedules?.runs||0, actLabel:'total runs' },
    { id:'email', icon:'📧', label:'Email Attachment', desc:'Monitor Gmail inbox and auto-import file attachments', color:'#7c3aed', count:stats.emailRules?.count||0, activity:stats.emailRules?.processed||0, actLabel:'processed' },
    { id:'logs', icon:'📋', label:'Activity Log', desc:'All auto-ingest events across all channels', color:'#334155', count:stats.recentActivity?.logs||0, activity:stats.recentActivity?.records||0, actLabel:'records (30d)' },
  ];

  return (
    <div style={{padding:20,background:'#f0f4ff',minHeight:'100%'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)',borderRadius:12,padding:'16px 20px',marginBottom:14,color:'#fff'}}>
        <div style={{fontSize:17,fontWeight:800,marginBottom:4}}>⚡ Auto-Ingest Hub</div>
        <div style={{fontSize:11,opacity:0.8}}>Zero-touch data ingestion · Webhook API · Scheduled sync · Email attachments · Google Drive</div>
      </div>

      {toast && (
        <div style={{position:'fixed',top:20,right:20,zIndex:9999,padding:'10px 16px',borderRadius:8,background:toast.ok?'#f0fdf4':'#fef2f2',border:`1px solid ${toast.ok?'#bbf7d0':'#fecaca'}`,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',fontSize:12,fontWeight:600,color:toast.ok?'#16a34a':'#dc2626'}}>
          {toast.msg}
        </div>
      )}

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
        {CHANNELS.map(c=>(
          <div key={c.id} onClick={()=>setTab(c.id)} style={{background:'#fff',borderRadius:10,border:`1px solid ${tab===c.id?c.color:'#e2e8f0'}`,padding:'12px 14px',borderLeft:`4px solid ${c.color}`,cursor:'pointer',transition:'all 0.2s'}}>
            <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:20}}>{c.icon}</span>
              <div style={{fontSize:11,fontWeight:700,color:'#0f172a'}}>{c.label}</div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div><div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase'}}>Configured</div><div style={{fontSize:18,fontWeight:800,color:c.color}}>{c.count}</div></div>
              <div style={{textAlign:'right'}}><div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase'}}>{c.actLabel}</div><div style={{fontSize:18,fontWeight:800,color:'#334155'}}>{c.activity}</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,marginBottom:14,background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',overflow:'hidden'}}>
        {[['overview','📊 Overview'],['webhook','🔗 Webhooks'],['schedule','⏰ Schedules'],['email','📧 Email'],['logs','📋 Logs']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:'10px 0',border:'none',background:tab===id?'#1d4ed8':'transparent',color:tab===id?'#fff':'#64748b',fontSize:11,fontWeight:tab===id?700:400,cursor:'pointer'}}>{label}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab==='overview' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:14}}>Auto-Ingest Channels</div>
            {[
              ['🔗','Webhook API','Any external system pushes CSV/JSON/XML data via HTTP POST to your unique webhook URL. Instant import, no manual steps.','#1d4ed8',webhooks.length],
              ['⏰','Scheduled URL Sync','Auto-fetch Google Sheets, public CSV endpoints, or any URL on a daily/weekly schedule. Fully automatic.','#059669',schedules.length],
              ['📧','Email Attachments','Monitor your Gmail inbox for emails with file attachments. Auto-imports Excel, CSV, PDF attachments.','#7c3aed',emailRules.length],
              ['📁','Google Drive Monitor','Already running — monitors your Drive folder every 5 minutes and auto-imports new files.','#dc2626',1],
            ].map(([icon,title,desc,color,count],i)=>(
              <div key={i} style={{display:'flex',gap:12,padding:'10px 0',borderBottom:i<3?'1px solid #f8faff':'none'}}>
                <div style={{width:36,height:36,borderRadius:8,background:color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{icon}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{title}</div>
                    <Badge text={count>0?count+' configured':'Not configured'} color={count>0?'#16a34a':'#94a3b8'}/>
                  </div>
                  <div style={{fontSize:10,color:'#64748b',lineHeight:1.4}}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:12}}>Quick Setup Guide</div>
              {[
                ['1','Create a Webhook','Go to Webhooks tab → Create → Copy URL → Give to your ERP/system'],
                ['2','Schedule a Sheet','Go to Schedules tab → Add Google Sheet URL → Set daily time'],
                ['3','Setup Email Ingest','Go to Email tab → Add Gmail rule → Add GMAIL_ACCESS_TOKEN to Render env'],
                ['4','Drive Monitor','Already running → Configure in Drive Monitor page → Drop files in folder'],
              ].map(([step,title,desc],i)=>(
                <div key={i} style={{display:'flex',gap:10,marginBottom:10,alignItems:'flex-start'}}>
                  <div style={{width:24,height:24,borderRadius:'50%',background:'#1d4ed8',color:'#fff',fontSize:11,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{step}</div>
                  <div><div style={{fontSize:11,fontWeight:700,color:'#334155'}}>{title}</div><div style={{fontSize:10,color:'#64748b'}}>{desc}</div></div>
                </div>
              ))}
            </div>
            <div style={{background:'#f0fdf4',borderRadius:10,border:'1px solid #bbf7d0',padding:16}}>
              <div style={{fontSize:12,fontWeight:700,color:'#16a34a',marginBottom:8}}>✅ What Happens After Auto-Import</div>
              {['AI auto-detects data type (AR, AP, Expenses etc.)','AI maps all column names automatically','Data saved to correct DB tables','All 37 dashboards update in real-time','Email notification sent with import summary','Full audit log maintained'].map((item,i)=>(
                <div key={i} style={{fontSize:11,color:'#334155',marginBottom:4}}>• {item}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {tab==='webhook' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:14}}>Create Webhook Endpoint</div>
            <div style={{background:'#eff6ff',borderRadius:8,padding:12,marginBottom:14,fontSize:11,color:'#1e3a8a'}}>
              <div style={{fontWeight:700,marginBottom:4}}>🔗 How Webhooks Work</div>
              External systems (Tally, SAP, custom apps) POST data to your webhook URL. Any format (CSV, JSON, XML) is auto-detected and imported. No manual steps needed.
            </div>
            {[{l:'Webhook Name',k:'name',ph:'e.g. Tally Sales Export'},{l:'Description',k:'description',ph:'What data this webhook receives'}].map(f=>(
              <div key={f.k} style={{marginBottom:10}}>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>{f.l}</label>
                <input value={whForm[f.k]||''} onChange={e=>setWhForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph}
                  style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none',boxSizing:'border-box'}}/>
              </div>
            ))}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>DATA TYPE (Optional)</label>
              <select value={whForm.data_type||''} onChange={e=>setWhForm(p=>({...p,data_type:e.target.value}))}
                style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>
                {DATA_TYPES.map(t=><option key={t} value={t===DATA_TYPES[0]?'':t}>{t}</option>)}
              </select>
            </div>
            <button onClick={createWebhook} style={{width:'100%',padding:'10px 0',borderRadius:8,border:'none',background:'#1d4ed8',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
              🔗 Create Webhook
            </button>
          </div>
          <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:12}}>Active Webhooks ({webhooks.length})</div>
            {webhooks.length===0?(
              <div style={{textAlign:'center',padding:30,color:'#94a3b8'}}>
                <div style={{fontSize:28,marginBottom:8}}>🔗</div>
                <div>No webhooks yet. Create one to start receiving data from external systems.</div>
              </div>
            ):webhooks.map((w,i)=>(
              <div key={i} style={{padding:'12px 14px',borderRadius:8,background:'#f8faff',border:'1px solid #e2e8f0',marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{w.name}</div>
                  <button onClick={()=>deleteWebhook(w.id)} style={{padding:'2px 8px',borderRadius:5,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:10,cursor:'pointer'}}>Delete</button>
                </div>
                {w.data_type&&<div style={{marginBottom:4}}><Badge text={w.data_type} color='#1d4ed8'/></div>}
                <div style={{fontSize:10,color:'#64748b',marginBottom:6}}>{w.description||'No description'}</div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <code style={{fontSize:9,background:'#1e293b',color:'#34d399',padding:'4px 8px',borderRadius:5,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{w.webhook_url}</code>
                  <button onClick={()=>copyToClipboard(w.webhook_url)} style={{padding:'4px 8px',borderRadius:5,border:'1px solid #e2e8f0',background:'#fff',fontSize:10,cursor:'pointer',flexShrink:0}}>Copy</button>
                </div>
                <div style={{fontSize:10,color:'#94a3b8',marginTop:4}}>{w.total_calls||0} calls · {w.last_called_at?'Last: '+new Date(w.last_called_at).toLocaleString('en-IN'):'Never called'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedules Tab */}
      {tab==='schedule' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:14}}>Add Scheduled Sync</div>
            <div style={{background:'#f0fdf4',borderRadius:8,padding:12,marginBottom:14,fontSize:11,color:'#14532d'}}>
              <div style={{fontWeight:700,marginBottom:4}}>⏰ Supported Sources</div>
              Google Sheets URL, any public CSV/JSON/XML endpoint, REST API URLs. Data is fetched automatically at your chosen time.
            </div>
            {[{l:'Schedule Name',k:'name',ph:'e.g. Daily Sales Sheet'},{l:'Source URL',k:'source_url',ph:'https://docs.google.com/spreadsheets/d/... or https://api.example.com/data.csv'}].map(f=>(
              <div key={f.k} style={{marginBottom:10}}>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>{f.l}</label>
                <input value={schForm[f.k]||''} onChange={e=>setSchForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph}
                  style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none',boxSizing:'border-box'}}/>
              </div>
            ))}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>FORMAT</label>
                <select value={schForm.format} onChange={e=>setSchForm(p=>({...p,format:e.target.value}))}
                  style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>
                  {['csv','json','xml','excel'].map(f=><option key={f} value={f}>{f.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>FREQUENCY</label>
                <select value={schForm.frequency} onChange={e=>setSchForm(p=>({...p,frequency:e.target.value}))}
                  style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>
                  {['hourly','daily','weekly'].map(f=><option key={f} value={f}>{f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>TIME</label>
                <input type="time" value={schForm.time} onChange={e=>setSchForm(p=>({...p,time:e.target.value}))}
                  style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>DATA TYPE</label>
                <select value={schForm.data_type||''} onChange={e=>setSchForm(p=>({...p,data_type:e.target.value}))}
                  style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>
                  {DATA_TYPES.map(t=><option key={t} value={t===DATA_TYPES[0]?'':t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button onClick={createSchedule} style={{width:'100%',padding:'10px 0',borderRadius:8,border:'none',background:'#059669',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
              ⏰ Create Schedule
            </button>
          </div>
          <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:12}}>Active Schedules ({schedules.length})</div>
            {schedules.length===0?(
              <div style={{textAlign:'center',padding:30,color:'#94a3b8'}}>
                <div style={{fontSize:28,marginBottom:8}}>⏰</div>
                <div>No schedules yet. Add a Google Sheet or URL to auto-sync data.</div>
              </div>
            ):schedules.map((s,i)=>(
              <div key={i} style={{padding:'12px 14px',borderRadius:8,background:'#f8faff',border:'1px solid #e2e8f0',marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{s.name}</div>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>runScheduleNow(s.id,s.name)} disabled={loading[s.id]}
                      style={{padding:'3px 8px',borderRadius:5,border:'none',background:loading[s.id]?'#94a3b8':'#059669',color:'#fff',fontSize:10,cursor:'pointer'}}>
                      {loading[s.id]?'Running...':'▶ Run Now'}
                    </button>
                    <button onClick={()=>deleteSchedule(s.id)} style={{padding:'3px 8px',borderRadius:5,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:10,cursor:'pointer'}}>Delete</button>
                  </div>
                </div>
                <div style={{fontSize:10,color:'#64748b',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.source_url}</div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  <Badge text={s.frequency} color='#059669'/>
                  <Badge text={s.time} color='#64748b'/>
                  <Badge text={s.format?.toUpperCase()} color='#1d4ed8'/>
                  <Badge text={s.last_status||'pending'} color={s.last_status==='success'?'#16a34a':s.last_status==='error'?'#dc2626':'#94a3b8'}/>
                </div>
                <div style={{fontSize:10,color:'#94a3b8',marginTop:4}}>{s.total_runs||0} runs · {s.last_run_at?'Last: '+new Date(s.last_run_at).toLocaleString('en-IN'):'Never run'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email Tab */}
      {tab==='email' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:14}}>Email Attachment Rules</div>
            <div style={{background:'#fffbeb',borderRadius:8,padding:12,marginBottom:14,fontSize:11,color:'#78350f'}}>
              <div style={{fontWeight:700,marginBottom:4}}>⚠️ Setup Required</div>
              Add <code style={{background:'#fef3c7',padding:'1px 4px',borderRadius:3}}>GMAIL_ACCESS_TOKEN</code> to Render env. Get it from Google OAuth playground at oauth2.googleapis.com with Gmail readonly scope.
            </div>
            {[
              {l:'Rule Name',k:'name',ph:'e.g. Vendor Invoice Emails'},
              {l:'From Email (optional)',k:'from_email',ph:'accounts@vendor.com or leave blank for all'},
              {l:'Subject Contains (optional)',k:'subject_contains',ph:'Invoice, Report, Statement'},
            ].map(f=>(
              <div key={f.k} style={{marginBottom:10}}>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>{f.l}</label>
                <input value={emForm[f.k]||''} onChange={e=>setEmForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph}
                  style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none',boxSizing:'border-box'}}/>
              </div>
            ))}
            <div style={{marginBottom:14}}>
              <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>DATA TYPE</label>
              <select value={emForm.data_type||''} onChange={e=>setEmForm(p=>({...p,data_type:e.target.value}))}
                style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>
                {DATA_TYPES.map(t=><option key={t} value={t===DATA_TYPES[0]?'':t}>{t}</option>)}
              </select>
            </div>
            <button onClick={createEmailRule} style={{width:'100%',padding:'10px 0',borderRadius:8,border:'none',background:'#7c3aed',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
              📧 Create Email Rule
            </button>
          </div>
          <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:12}}>Active Email Rules ({emailRules.length})</div>
            <div style={{background:'#f0fdf4',borderRadius:8,padding:12,marginBottom:12,fontSize:11}}>
              <div style={{fontWeight:700,color:'#16a34a',marginBottom:4}}>How it works:</div>
              <div style={{color:'#334155'}}>Every 5 minutes, the system checks your Gmail for unread emails matching these rules. Any file attachments (CSV, Excel, PDF, XML) are automatically imported and marked as read.</div>
            </div>
            {emailRules.length===0?(
              <div style={{textAlign:'center',padding:30,color:'#94a3b8'}}>
                <div style={{fontSize:28,marginBottom:8}}>📧</div>
                <div>No email rules yet. Add a rule to auto-import email attachments.</div>
              </div>
            ):emailRules.map((r,i)=>(
              <div key={i} style={{padding:'12px 14px',borderRadius:8,background:'#f8faff',border:'1px solid #e2e8f0',marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{r.name}</div>
                  <button onClick={()=>deleteEmailRule(r.id)} style={{padding:'2px 8px',borderRadius:5,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:10,cursor:'pointer'}}>Delete</button>
                </div>
                {r.from_email&&<div style={{fontSize:10,color:'#64748b'}}>📨 From: {r.from_email}</div>}
                {r.subject_contains&&<div style={{fontSize:10,color:'#64748b'}}>Subject contains: "{r.subject_contains}"</div>}
                {r.data_type&&<div style={{marginTop:4}}><Badge text={r.data_type} color='#7c3aed'/></div>}
                <div style={{fontSize:10,color:'#94a3b8',marginTop:4}}>{r.total_processed||0} files processed · {r.last_processed_at?'Last: '+new Date(r.last_processed_at).toLocaleString('en-IN'):'Never processed'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {tab==='logs' && (
        <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',overflow:'hidden'}}>
          <div style={{padding:'10px 16px',background:'#f8faff',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#0f172a'}}>Auto-Ingest Activity Log ({logs.length})</div>
            <button onClick={loadAll} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',fontSize:10,cursor:'pointer'}}>↻ Refresh</button>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead><tr style={{background:'#f8faff'}}>{['Time','Channel','Source','Data Type','Records','Status'].map(h=><th key={h} style={{padding:'7px 12px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:10,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
            <tbody>
              {logs.length===0?<tr><td colSpan={6} style={{padding:30,textAlign:'center',color:'#94a3b8'}}>No activity yet. Auto-ingest events will appear here.</td></tr>:
              logs.slice(0,50).map((l,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #f8faff',background:i%2===0?'#fff':'#fafbff'}}>
                  <td style={{padding:'7px 12px',color:'#64748b',fontSize:10,whiteSpace:'nowrap'}}>{new Date(l.created_at).toLocaleString('en-IN')}</td>
                  <td style={{padding:'7px 12px'}}><Badge text={l.source_type} color={{webhook:'#1d4ed8',schedule:'#059669',email:'#7c3aed',drive:'#dc2626'}[l.source_type]||'#64748b'}/></td>
                  <td style={{padding:'7px 12px',color:'#334155',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.source_name||'—'}</td>
                  <td style={{padding:'7px 12px'}}>{l.data_type?<Badge text={l.data_type} color='#64748b'/>:'—'}</td>
                  <td style={{padding:'7px 12px',fontWeight:700,color:'#1d4ed8'}}>{l.records_inserted||0}</td>
                  <td style={{padding:'7px 12px'}}><Badge text={l.status} color={l.status==='success'?'#16a34a':'#dc2626'}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
