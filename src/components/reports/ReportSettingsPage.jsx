import { useState, useEffect, useRef } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const api = async (url, method='GET', body=null) => {
  try {
    const r = await fetch(apiURL(url), { method, headers: h(), body: body?JSON.stringify(body):null });
    return await r.json();
  } catch(e) { return { error: e.message }; }
};

const REPORTS = [
  // Daily
  { id:'ar_aging',          label:'AR Aging Report',          icon:'📊', color:'#1d4ed8', cat:'daily',   desc:'AR buckets, overdue invoices, top debtors' },
  { id:'cash_position',     label:'Cash Position Brief',      icon:'💰', color:'#059669', cat:'daily',   desc:'Cash inflows, outflows, 7-day outlook' },
  { id:'compliance_alerts', label:'Compliance Alerts',        icon:'🏛️', color:'#7c3aed', cat:'daily',   desc:'Regulatory deadlines, overdue items' },
  // Weekly
  { id:'weekly_pl',         label:'Weekly P&L Report',        icon:'📈', color:'#059669', cat:'weekly',  desc:'Revenue, expenses, gross/net profit' },
  { id:'collections',       label:'Collections Summary',      icon:'💵', color:'#0891b2', cat:'weekly',  desc:'Collection rate, priority follow-ups' },
  { id:'ap_calendar',       label:'AP Payment Calendar',      icon:'📅', color:'#7c3aed', cat:'weekly',  desc:'Bills due this week and next 30 days' },
  // Monthly
  { id:'monthly_financial', label:'Monthly Financial Summary',icon:'📊', color:'#1d4ed8', cat:'monthly', desc:'Full P&L, balance metrics, headcount' },
  { id:'budget_vs_actual',  label:'Budget vs Actual',         icon:'📉', color:'#d97706', cat:'monthly', desc:'Department budget utilization & variance' },
  { id:'gst_summary',       label:'GST & Tax Summary',        icon:'🏛️', color:'#dc2626', cat:'monthly', desc:'GST output/input, net payable, filing status' },
  { id:'inventory',         label:'Inventory & Stock Report', icon:'📦', color:'#d97706', cat:'monthly', desc:'Stock levels, reorder alerts, valuation' },
  // Event-triggered
  { id:'overdue_alert',     label:'Overdue Invoice Alert',    icon:'⚠️', color:'#dc2626', cat:'event',   desc:'Fires when invoice crosses due date' },
  { id:'credit_breach',     label:'Credit Limit Breach',      icon:'🚨', color:'#dc2626', cat:'event',   desc:'Fires when customer exceeds credit limit' },
  { id:'large_transaction', label:'Large Transaction Alert',  icon:'💰', color:'#d97706', cat:'event',   desc:'Fires when transaction exceeds threshold' },
  { id:'import_summary',    label:'Import Success Summary',   icon:'⬆️', color:'#059669', cat:'event',   desc:'Fires after every successful data import' },
];

const CAT_LABELS = { daily:'🌅 Daily Reports', weekly:'📅 Weekly Reports', monthly:'📆 Monthly Reports', event:'⚡ Event-Triggered Alerts' };
const CAT_COLORS = { daily:'#1d4ed8', weekly:'#059669', monthly:'#7c3aed', event:'#dc2626' };
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function Badge({ text, color='#1d4ed8' }) {
  return <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:color+'18',color,border:`1px solid ${color}30`}}>{text}</span>;
}

function Toggle({ value, onChange }) {
  return (
    <div onClick={()=>onChange(!value)} style={{width:38,height:22,borderRadius:11,background:value?'#1d4ed8':'#e2e8f0',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}>
      <div style={{position:'absolute',top:3,left:value?18:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
    </div>
  );
}

export default function ReportSettingsPage() {
  const [tab, setTab] = useState('reports');
  const [schedules, setSchedules] = useState({});
  const [sending, setSending] = useState({});
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [editReport, setEditReport] = useState(null);
  const [editForm, setEditForm] = useState({ email:'', frequency:'daily', time:'08:00', dayOfWeek:1, enabled:true, threshold:100000 });
  const [sseEvents, setSseEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  useEffect(() => {
    loadSchedules();
    loadHistory();
    connectSSE();
    return () => esRef.current?.close();
  }, []);

  const connectSSE = () => {
    const token = localStorage.getItem('token') ?? '';
    const es = new EventSource(apiURL('/api/events/stream') + `?token=${encodeURIComponent(token)}`);
    esRef.current = es;
    es.addEventListener('connected', () => setConnected(true));
    ['dashboard_refresh','overdue_alert','credit_breach','reorder_alert','import_complete'].forEach(evt => {
      es.addEventListener(evt, e => {
        const data = JSON.parse(e.data);
        setSseEvents(prev => [{ type:evt, ...data, time:new Date() }, ...prev.slice(0,49)]);
      });
    });
    es.onerror = () => setConnected(false);
  };

  const showToast = (msg, ok=true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const loadSchedules = async () => {
    const d = await api('/api/events/schedule');
    const map = {};
    (d.schedules||[]).forEach(s => { map[s.reportType] = s; });
    setSchedules(map);
  };

  const loadHistory = async () => {
    const d = await api('/api/events/history');
    setHistory(d.history||[]);
  };

  const sendNow = async (reportId) => {
    const sched = schedules[reportId];
    const email = sched?.email || prompt(`Enter email to send "${REPORTS.find(r=>r.id===reportId)?.label}":`);
    if (!email) return;
    setSending(p=>({...p,[reportId]:true}));
    const r = await api('/api/events/send-report','POST',{ reportType:reportId, email });
    setSending(p=>({...p,[reportId]:false}));
    if (r.success) { showToast(`✅ ${REPORTS.find(r2=>r2.id===reportId)?.label} sent to ${email}`); loadHistory(); }
    else showToast('❌ ' + (r.error||'Failed to send'), false);
  };

  const openEdit = (report) => {
    const existing = schedules[report.id];
    setEditForm({
      email: existing?.email || '',
      frequency: existing?.frequency || report.cat === 'event' ? 'event' : report.cat,
      time: existing?.time || '08:00',
      dayOfWeek: existing?.dayOfWeek ?? 1,
      enabled: existing?.enabled ?? true,
      threshold: existing?.threshold || 100000,
    });
    setEditReport(report);
  };

  const saveSchedule = async () => {
    if (!editForm.email) return showToast('❌ Please enter email', false);
    const r = await api('/api/events/schedule','POST',{ reportType: editReport.id, ...editForm });
    if (!r.error) {
      await loadSchedules();
      setEditReport(null);
      showToast(`✅ Schedule saved for ${editReport.label}`);
    } else showToast('❌ ' + r.error, false);
  };

  const toggleEnabled = async (reportId) => {
    const s = schedules[reportId];
    if (!s) return openEdit(REPORTS.find(r=>r.id===reportId));
    const r = await api('/api/events/schedule','POST',{ reportType:reportId, ...s, enabled:!s.enabled });
    if (!r.error) { await loadSchedules(); showToast(`${!s.enabled?'✅ Enabled':'⏸ Paused'}: ${REPORTS.find(r=>r.id===reportId)?.label}`); }
  };

  const cats = ['daily','weekly','monthly','event'];

  return (
    <div style={{padding:20,background:'#f0f4ff',minHeight:'100%'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)',borderRadius:12,padding:'16px 20px',marginBottom:14,color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:17,fontWeight:800,marginBottom:2}}>📧 Finance Intelligence Center</div>
          <div style={{fontSize:11,opacity:0.8}}>14 automated reports · Real-time alerts · Gmail delivery · Full schedule control</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.1)',padding:'6px 12px',borderRadius:20}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:connected?'#34d399':'#f87171',boxShadow:connected?'0 0 8px #34d399':'none'}}/>
          <span style={{fontSize:11,fontWeight:700}}>{connected?'Live Connected':'Reconnecting...'}</span>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{position:'fixed',top:20,right:20,zIndex:9999,padding:'10px 16px',borderRadius:8,background:toast.ok?'#f0fdf4':'#fef2f2',border:`1px solid ${toast.ok?'#bbf7d0':'#fecaca'}`,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',fontSize:12,fontWeight:600,color:toast.ok?'#16a34a':'#dc2626'}}>
          {toast.msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{display:'flex',gap:0,marginBottom:14,background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',overflow:'hidden'}}>
        {[['reports','📧 All Reports'],['schedule','⏰ Schedule'],['realtime','⚡ Live Events'],['history','📋 History']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:'10px 0',border:'none',background:tab===id?'#1d4ed8':'transparent',color:tab===id?'#fff':'#64748b',fontSize:11,fontWeight:tab===id?700:400,cursor:'pointer'}}>{label}</button>
        ))}
      </div>

      {/* ── REPORTS TAB ── */}
      {tab==='reports' && (
        <div>
          {cats.map(cat=>(
            <div key={cat} style={{marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <div style={{height:2,width:20,background:CAT_COLORS[cat],borderRadius:1}}/>
                <span style={{fontSize:12,fontWeight:800,color:CAT_COLORS[cat],textTransform:'uppercase',letterSpacing:'0.05em'}}>{CAT_LABELS[cat]}</span>
                <div style={{height:1,flex:1,background:'#e2e8f0'}}/>
                <Badge text={REPORTS.filter(r=>r.cat===cat).length+' reports'} color={CAT_COLORS[cat]}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
                {REPORTS.filter(r=>r.cat===cat).map(report=>{
                  const sched = schedules[report.id];
                  const isScheduled = !!sched;
                  return (
                    <div key={report.id} style={{background:'#fff',borderRadius:10,border:`1px solid ${isScheduled&&sched.enabled?report.color+'40':'#e2e8f0'}`,padding:'14px 16px',transition:'all 0.2s'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                        <div style={{display:'flex',gap:10,alignItems:'center',flex:1}}>
                          <div style={{width:34,height:34,borderRadius:8,background:report.color+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{report.icon}</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{report.label}</div>
                            <div style={{fontSize:10,color:'#94a3b8',marginTop:1}}>{report.desc}</div>
                          </div>
                        </div>
                        {report.cat!=='event' && (
                          <Toggle value={isScheduled&&sched.enabled} onChange={()=>toggleEnabled(report.id)}/>
                        )}
                      </div>

                      {/* Schedule info */}
                      {isScheduled && (
                        <div style={{padding:'6px 10px',borderRadius:6,background:'#f8faff',fontSize:10,color:'#64748b',marginBottom:8,display:'flex',gap:10,flexWrap:'wrap'}}>
                          <span>📧 {sched.email}</span>
                          <span>🕐 {sched.time}</span>
                          {sched.frequency==='weekly'&&<span>📅 {DAYS[sched.dayOfWeek||1]}</span>}
                          <Badge text={sched.enabled?'Active':'Paused'} color={sched.enabled?'#16a34a':'#94a3b8'}/>
                        </div>
                      )}

                      <div style={{display:'flex',gap:6}}>
                        <button onClick={()=>sendNow(report.id)} disabled={!!sending[report.id]}
                          style={{flex:1,padding:'6px 0',borderRadius:6,border:'none',background:sending[report.id]?'#94a3b8':report.color,color:'#fff',fontSize:10,fontWeight:700,cursor:'pointer'}}>
                          {sending[report.id]?'Sending...':'📧 Send Now'}
                        </button>
                        <button onClick={()=>openEdit(report)}
                          style={{padding:'6px 12px',borderRadius:6,border:`1px solid ${report.color}`,background:'transparent',color:report.color,fontSize:10,fontWeight:600,cursor:'pointer'}}>
                          ⚙️ {isScheduled?'Edit':'Schedule'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SCHEDULE TAB ── */}
      {tab==='schedule' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14}}>
            {[
              {l:'Total Scheduled',v:Object.keys(schedules).length,color:'#1d4ed8'},
              {l:'Active',v:Object.values(schedules).filter(s=>s.enabled).length,color:'#16a34a'},
              {l:'Paused',v:Object.values(schedules).filter(s=>!s.enabled).length,color:'#94a3b8'},
            ].map((k,i)=>(
              <div key={i} style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',padding:'10px 14px',borderLeft:`4px solid ${k.color}`}}>
                <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
                <div style={{fontSize:22,fontWeight:800,color:k.color}}>{k.v}</div>
              </div>
            ))}
          </div>
          <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',overflow:'hidden'}}>
            <div style={{padding:'10px 16px',background:'#f8faff',borderBottom:'1px solid #f1f5f9',fontSize:11,fontWeight:700,color:'#0f172a'}}>Active Report Schedules</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr style={{background:'#f8faff'}}>{['Report','Email','Frequency','Time','Status','Actions'].map(h=><th key={h} style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:10,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
              <tbody>
                {Object.entries(schedules).length===0 ? (
                  <tr><td colSpan={6} style={{padding:30,textAlign:'center',color:'#94a3b8'}}>No schedules configured. Go to Reports tab to set up automated delivery.</td></tr>
                ) : Object.entries(schedules).map(([id,s],i)=>{
                  const report = REPORTS.find(r=>r.id===id);
                  return (
                    <tr key={id} style={{borderBottom:'1px solid #f8faff',background:i%2===0?'#fff':'#fafbff'}}>
                      <td style={{padding:'8px 12px'}}><div style={{display:'flex',alignItems:'center',gap:6}}><span>{report?.icon}</span><span style={{fontWeight:500}}>{report?.label||id}</span></div></td>
                      <td style={{padding:'8px 12px',color:'#64748b'}}>{s.email}</td>
                      <td style={{padding:'8px 12px'}}><Badge text={s.frequency} color={CAT_COLORS[s.frequency]||'#64748b'}/></td>
                      <td style={{padding:'8px 12px',color:'#64748b'}}>{s.time}{s.frequency==='weekly'?` (${DAYS[s.dayOfWeek||1]})`:''}</td>
                      <td style={{padding:'8px 12px'}}><Badge text={s.enabled?'Active':'Paused'} color={s.enabled?'#16a34a':'#94a3b8'}/></td>
                      <td style={{padding:'8px 12px'}}>
                        <div style={{display:'flex',gap:6}}>
                          <button onClick={()=>openEdit(report||{id,label:id,icon:'📧',color:'#1d4ed8',cat:'daily',desc:''})} style={{padding:'3px 8px',borderRadius:5,border:'1px solid #e2e8f0',background:'#fff',fontSize:10,cursor:'pointer'}}>Edit</button>
                          <button onClick={()=>toggleEnabled(id)} style={{padding:'3px 8px',borderRadius:5,border:'none',background:s.enabled?'#fef2f2':'#f0fdf4',color:s.enabled?'#dc2626':'#16a34a',fontSize:10,cursor:'pointer'}}>{s.enabled?'Pause':'Enable'}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LIVE EVENTS TAB ── */}
      {tab==='realtime' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'#0f172a',marginBottom:12}}>How Event Bus Works</div>
            {[
              ['📥 Import Data','Upload CSV/Excel/Google Sheet via Data Ingest','#1d4ed8'],
              ['⚡ Events Fire','System checks overdue invoices, credit breaches, large transactions','#7c3aed'],
              ['📊 Dashboard Refreshes','All open Finance Hub tabs update automatically via SSE','#16a34a'],
              ['📧 Alerts Sent','Email alerts sent for overdue invoices, credit breaches','#dc2626'],
              ['📋 Log Created','All events logged in history for audit trail','#d97706'],
            ].map(([step,desc,color],i)=>(
              <div key={i} style={{display:'flex',gap:10,marginBottom:10,alignItems:'flex-start'}}>
                <div style={{width:26,height:26,borderRadius:'50%',background:color,color:'#fff',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</div>
                <div><div style={{fontSize:11,fontWeight:700,color:'#334155'}}>{step}</div><div style={{fontSize:10,color:'#64748b'}}>{desc}</div></div>
              </div>
            ))}
          </div>
          <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'#0f172a',marginBottom:4}}>
              Live Event Stream
              <span style={{marginLeft:8,fontSize:9,padding:'2px 6px',borderRadius:10,background:connected?'#f0fdf4':'#fef2f2',color:connected?'#16a34a':'#dc2626',fontWeight:700}}>{connected?'● LIVE':'○ OFFLINE'}</span>
            </div>
            <div style={{fontSize:10,color:'#94a3b8',marginBottom:10}}>Events appear here when data is imported or triggers fire</div>
            {sseEvents.length===0 ? (
              <div style={{textAlign:'center',padding:30,color:'#94a3b8'}}>
                <div style={{fontSize:28,marginBottom:8}}>📡</div>
                <div style={{fontSize:11}}>Waiting for events...</div>
                <div style={{fontSize:10,marginTop:4}}>Import data via Data Ingest to see live events</div>
              </div>
            ) : sseEvents.slice(0,15).map((ev,i)=>(
              <div key={i} style={{display:'flex',gap:8,padding:'7px 0',borderBottom:'1px solid #f8faff',alignItems:'flex-start'}}>
                <div style={{width:24,height:24,borderRadius:'50%',background:{dashboard_refresh:'#eff6ff',overdue_alert:'#fef2f2',credit_breach:'#fffbeb',reorder_alert:'#f5f3ff'}[ev.type]||'#f8faff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0}}>
                  {{dashboard_refresh:'📊',overdue_alert:'⚠️',credit_breach:'🚨',reorder_alert:'📦'}[ev.type]||'📌'}
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                    <Badge text={ev.type.replace(/_/g,' ')} color={{dashboard_refresh:'#1d4ed8',overdue_alert:'#dc2626',credit_breach:'#d97706',reorder_alert:'#7c3aed'}[ev.type]||'#64748b'}/>
                    <span style={{fontSize:9,color:'#94a3b8'}}>{new Date(ev.time).toLocaleTimeString('en-IN')}</span>
                  </div>
                  <div style={{fontSize:10,color:'#334155'}}>{ev.message||'Event received'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab==='history' && (
        <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',overflow:'hidden'}}>
          <div style={{padding:'10px 16px',background:'#f8faff',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#0f172a'}}>Report & Event History</div>
            <button onClick={loadHistory} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',fontSize:10,cursor:'pointer'}}>↻ Refresh</button>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead><tr style={{background:'#f8faff'}}>{['Time','Type','Status','Detail'].map(h=><th key={h} style={{padding:'7px 12px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:10,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
            <tbody>
              {history.length===0?<tr><td colSpan={4} style={{padding:30,textAlign:'center',color:'#94a3b8'}}>No history yet</td></tr>:
              history.map((h,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #f8faff',background:i%2===0?'#fff':'#fafbff'}}>
                  <td style={{padding:'7px 12px',color:'#64748b',whiteSpace:'nowrap',fontSize:10}}>{new Date(h.created_at).toLocaleString('en-IN')}</td>
                  <td style={{padding:'7px 12px'}}><Badge text={h.automation_type} color='#1d4ed8'/></td>
                  <td style={{padding:'7px 12px'}}><Badge text={h.status} color={h.status==='success'?'#16a34a':'#dc2626'}/></td>
                  <td style={{padding:'7px 12px',color:'#334155',maxWidth:300,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:10}}>{h.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── EDIT SCHEDULE MODAL ── */}
      {editReport && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setEditReport(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:14,padding:24,maxWidth:440,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:20}}>
              <div style={{width:40,height:40,borderRadius:10,background:editReport.color+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{editReport.icon}</div>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:'#0f172a'}}>{editReport.label}</div>
                <div style={{fontSize:11,color:'#94a3b8'}}>{editReport.desc}</div>
              </div>
            </div>

            {[{l:'Recipient Email(s)',k:'email',type:'email',placeholder:'finance@company.com, cfo@company.com'}].map(f=>(
              <div key={f.k} style={{marginBottom:12}}>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>{f.l}</label>
                <input type={f.type} value={editForm[f.k]||''} onChange={e=>setEditForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.placeholder}
                  style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none',boxSizing:'border-box'}}/>
              </div>
            ))}

            {editReport.cat !== 'event' && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                <div>
                  <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>FREQUENCY</label>
                  <select value={editForm.frequency} onChange={e=>setEditForm(p=>({...p,frequency:e.target.value}))}
                    style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly (1st)</option>
                  </select>
                </div>
                <div>
                  <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>TIME</label>
                  <input type="time" value={editForm.time} onChange={e=>setEditForm(p=>({...p,time:e.target.value}))}
                    style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none',boxSizing:'border-box'}}/>
                </div>
              </div>
            )}

            {editForm.frequency==='weekly' && (
              <div style={{marginBottom:12}}>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>DAY OF WEEK</label>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {DAYS.map((d,i)=>(
                    <button key={i} onClick={()=>setEditForm(p=>({...p,dayOfWeek:i}))}
                      style={{padding:'5px 10px',borderRadius:6,border:'1px solid '+(editForm.dayOfWeek===i?editReport.color:'#e2e8f0'),background:editForm.dayOfWeek===i?editReport.color+'18':'#fff',color:editForm.dayOfWeek===i?editReport.color:'#64748b',fontSize:10,cursor:'pointer',fontWeight:editForm.dayOfWeek===i?700:400}}>
                      {d.substring(0,3)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editReport.id==='large_transaction' && (
              <div style={{marginBottom:12}}>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>ALERT THRESHOLD (₹)</label>
                <input type="number" value={editForm.threshold||100000} onChange={e=>setEditForm(p=>({...p,threshold:parseInt(e.target.value)}))}
                  style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none',boxSizing:'border-box'}}/>
              </div>
            )}

            <div style={{display:'flex',gap:8,marginTop:16}}>
              <button onClick={()=>setEditReport(null)} style={{flex:1,padding:'9px 0',borderRadius:7,border:'1px solid #e2e8f0',background:'#fff',fontSize:12,cursor:'pointer',color:'#64748b'}}>Cancel</button>
              <button onClick={saveSchedule} style={{flex:2,padding:'9px 0',borderRadius:7,border:'none',background:editReport.color,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                💾 Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
