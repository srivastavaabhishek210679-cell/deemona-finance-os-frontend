import { useState, useEffect, useRef, useCallback } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const api = async (url, method='GET', body=null) => {
  try {
    const r = await fetch(apiURL(url), { method, headers: h(), body: body ? JSON.stringify(body) : null });
    return await r.json();
  } catch (e) { return { error: e.message }; }
};

function Badge({ text, color='#1d4ed8' }) {
  return <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:color+'18',color,border:`1px solid ${color}30`}}>{text}</span>;
}

// ── SSE Hook ──────────────────────────────────────────────────
function useSSE() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token') ?? '';
    const url = apiURL('/api/events/stream') + `?token=${token}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener('connected', () => setConnected(true));

    es.addEventListener('dashboard_refresh', e => {
      const data = JSON.parse(e.data);
      setEvents(prev => [{ type: 'dashboard_refresh', ...data, time: new Date() }, ...prev.slice(0, 49)]);
    });

    es.addEventListener('overdue_alert', e => {
      const data = JSON.parse(e.data);
      setEvents(prev => [{ type: 'overdue_alert', ...data, time: new Date() }, ...prev.slice(0, 49)]);
    });

    es.addEventListener('credit_breach', e => {
      const data = JSON.parse(e.data);
      setEvents(prev => [{ type: 'credit_breach', ...data, time: new Date() }, ...prev.slice(0, 49)]);
    });

    es.addEventListener('reorder_alert', e => {
      const data = JSON.parse(e.data);
      setEvents(prev => [{ type: 'reorder_alert', ...data, time: new Date() }, ...prev.slice(0, 49)]);
    });

    es.onerror = () => setConnected(false);

    return () => es.close();
  }, []);

  return { events, connected };
}

export default function ReportSettingsPage() {
  const [tab, setTab] = useState('realtime');
  const [schedules, setSchedules] = useState([]);
  const [sending, setSending] = useState({});
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ email: '', reportType: 'ar_aging', frequency: 'daily', time: '08:00', dayOfWeek: 1 });
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const { events, connected } = useSSE();

  useEffect(() => {
    loadSchedules();
    loadHistory();
  }, []);

  const loadSchedules = async () => {
    const d = await api('/api/events/schedule');
    setSchedules(d.schedules || []);
  };

  const loadHistory = async () => {
    const d = await api('/api/events/history');
    setHistory(d.history || []);
  };

  const sendNow = async (reportType) => {
    const email = prompt('Send report to email:');
    if (!email) return;
    setSending(p => ({ ...p, [reportType]: true }));
    const r = await api('/api/events/send-report', 'POST', { reportType, email });
    setSending(p => ({ ...p, [reportType]: false }));
    setTestResult(r.success ? { ok: true, msg: `Report sent to ${email}` } : { ok: false, msg: r.error });
    setTimeout(() => setTestResult(null), 5000);
    loadHistory();
  };

  const saveSchedule = async () => {
    if (!form.email) return alert('Please enter email');
    setSaving(true);
    const r = await api('/api/events/schedule', 'POST', form);
    setSaving(false);
    if (!r.error) { loadSchedules(); setTestResult({ ok: true, msg: 'Schedule saved!' }); setTimeout(() => setTestResult(null), 3000); }
    else setTestResult({ ok: false, msg: r.error });
  };

  const EVENT_COLORS = { dashboard_refresh:'#1d4ed8', overdue_alert:'#dc2626', credit_breach:'#d97706', reorder_alert:'#7c3aed' };
  const EVENT_ICONS = { dashboard_refresh:'📊', overdue_alert:'⚠️', credit_breach:'🚨', reorder_alert:'📦' };

  const REPORTS = [
    { id:'ar_aging', label:'AR Aging Report', icon:'📊', desc:'Daily report showing AR aging buckets, overdue invoices and top debtors', color:'#1d4ed8' },
    { id:'weekly_pl', label:'Weekly P&L Report', icon:'📈', desc:'Weekly profit & loss summary with revenue, expenses and margins', color:'#16a34a' },
  ];

  return (
    <div style={{padding:20,background:'#f0f4ff',minHeight:'100%'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)',borderRadius:12,padding:'16px 20px',marginBottom:16,color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:17,fontWeight:800,marginBottom:2}}>Finance Intelligence Center</div>
          <div style={{fontSize:11,opacity:0.8}}>Real-time events · Automated alerts · Scheduled Gmail reports</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:8,height:8,borderRadius:'50%',background:connected?'#34d399':'#f87171',boxShadow:connected?'0 0 8px #34d399':'none'}}/>
          <span style={{fontSize:11,fontWeight:700}}>{connected?'Live Connected':'Connecting...'}</span>
        </div>
      </div>

      {/* Test Result Banner */}
      {testResult && (
        <div style={{padding:'10px 16px',borderRadius:8,background:testResult.ok?'#f0fdf4':'#fef2f2',border:`1px solid ${testResult.ok?'#bbf7d0':'#fecaca'}`,marginBottom:12,fontSize:12,fontWeight:600,color:testResult.ok?'#16a34a':'#dc2626'}}>
          {testResult.ok?'✅':'❌'} {testResult.msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{display:'flex',gap:0,marginBottom:16,background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',overflow:'hidden'}}>
        {[['realtime','⚡ Real-time Events'],['reports','📧 Gmail Reports'],['schedule','⏰ Report Schedule'],['history','📋 History']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:'10px 0',border:'none',background:tab===id?'#1d4ed8':'transparent',color:tab===id?'#fff':'#64748b',fontSize:11,fontWeight:tab===id?700:400,cursor:'pointer'}}>{label}</button>
        ))}
      </div>

      {/* Real-time Events Tab */}
      {tab === 'realtime' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            {[
              {l:'SSE Connection',v:connected?'Live':'Offline',color:connected?'#16a34a':'#dc2626'},
              {l:'Events Today',v:events.length,color:'#1d4ed8'},
              {l:'Alert Events',v:events.filter(e=>e.type.includes('alert')||e.type.includes('breach')).length,color:'#dc2626'},
              {l:'Dashboard Refreshes',v:events.filter(e=>e.type==='dashboard_refresh').length,color:'#7c3aed'},
            ].map((k,i)=>(
              <div key={i} style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',padding:'12px 14px',borderLeft:`4px solid ${k.color}`}}>
                <div style={{fontSize:9,color:'#94a3b8',fontWeight:700,textTransform:'uppercase',marginBottom:4}}>{k.l}</div>
                <div style={{fontSize:20,fontWeight:800,color:k.color}}>{k.v}</div>
              </div>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:16}}>
              <div style={{fontSize:12,fontWeight:700,color:'#0f172a',marginBottom:12}}>How Event Bus Works</div>
              {[
                ['1. Import Data','Upload CSV/Excel/Google Sheet via Data Ingest','#1d4ed8'],
                ['2. Events Fire','System checks for overdue invoices, credit breaches, reorder alerts','#7c3aed'],
                ['3. Dashboard Refreshes','All open Finance Hub tabs update automatically','#16a34a'],
                ['4. Alerts Sent','Gmail alerts for overdue invoices and breaches','#dc2626'],
                ['5. Log Created','All events logged in history for audit trail','#d97706'],
              ].map(([step,desc,color],i)=>(
                <div key={i} style={{display:'flex',gap:10,marginBottom:10,alignItems:'flex-start'}}>
                  <div style={{width:24,height:24,borderRadius:'50%',background:color,color:'#fff',fontSize:10,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</div>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:'#334155'}}>{step}</div>
                    <div style={{fontSize:10,color:'#64748b'}}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:16}}>
              <div style={{fontSize:12,fontWeight:700,color:'#0f172a',marginBottom:12}}>
                Live Event Stream
                <span style={{marginLeft:8,fontSize:10,color:'#94a3b8',fontWeight:400}}>Auto-updates when data is imported</span>
              </div>
              {events.length === 0 ? (
                <div style={{textAlign:'center',padding:30,color:'#94a3b8'}}>
                  <div style={{fontSize:24,marginBottom:8}}>📡</div>
                  <div style={{fontSize:12}}>Waiting for events...</div>
                  <div style={{fontSize:11,marginTop:4}}>Import data via Data Ingest to see events here</div>
                </div>
              ) : events.slice(0,10).map((ev,i)=>(
                <div key={i} style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid #f8faff',alignItems:'flex-start'}}>
                  <span style={{fontSize:16}}>{EVENT_ICONS[ev.type]||'📌'}</span>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                      <Badge text={ev.type.replace(/_/g,' ')} color={EVENT_COLORS[ev.type]||'#64748b'}/>
                      <span style={{fontSize:9,color:'#94a3b8'}}>{new Date(ev.time).toLocaleTimeString('en-IN')}</span>
                    </div>
                    <div style={{fontSize:11,color:'#334155'}}>{ev.message||JSON.stringify(ev).substring(0,60)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gmail Reports Tab */}
      {tab === 'reports' && (
        <div>
          <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:16,marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:'#0f172a',marginBottom:4}}>Setup Required</div>
            <div style={{fontSize:11,color:'#64748b',marginBottom:10}}>Add these to your Render backend environment variables:</div>
            <div style={{background:'#1e293b',borderRadius:8,padding:12,fontFamily:'monospace',fontSize:11,color:'#94a3b8'}}>
              <div><span style={{color:'#34d399'}}>GMAIL_USER</span>=your@gmail.com</div>
              <div><span style={{color:'#34d399'}}>GMAIL_APP_PASSWORD</span>=xxxx-xxxx-xxxx-xxxx</div>
            </div>
            <div style={{fontSize:10,color:'#94a3b8',marginTop:8}}>Get App Password: Google Account → Security → 2-Step Verification → App Passwords</div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            {REPORTS.map(r=>(
              <div key={r.id} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:20}}>
                <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:14}}>
                  <div style={{width:40,height:40,borderRadius:10,background:r.color+'18',border:`2px solid ${r.color}30`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{r.icon}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:'#0f172a'}}>{r.label}</div>
                    <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{r.desc}</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>sendNow(r.id)} disabled={sending[r.id]}
                    style={{flex:1,padding:'9px 0',borderRadius:7,border:'none',background:sending[r.id]?'#94a3b8':r.color,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>
                    {sending[r.id]?'Sending...':'📧 Send Now'}
                  </button>
                  <button onClick={()=>setTab('schedule')} style={{padding:'9px 14px',borderRadius:7,border:`1px solid ${r.color}`,background:'transparent',color:r.color,fontSize:12,fontWeight:600,cursor:'pointer'}}>⏰ Schedule</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {tab === 'schedule' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:16}}>⏰ Schedule Automated Report</div>
            {[
              {l:'Recipient Email',k:'email',type:'email',placeholder:'finance@company.com'},
            ].map(f=>(
              <div key={f.k} style={{marginBottom:12}}>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>{f.l}</label>
                <input type={f.type||'text'} value={form[f.k]||''} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.placeholder}
                  style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:12,outline:'none',boxSizing:'border-box'}}/>
              </div>
            ))}
            <div style={{marginBottom:12}}>
              <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>REPORT TYPE</label>
              <select value={form.reportType} onChange={e=>setForm(p=>({...p,reportType:e.target.value}))}
                style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}>
                {REPORTS.map(r=><option key={r.id} value={r.id}>{r.icon} {r.label}</option>)}
              </select>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>FREQUENCY</label>
                <select value={form.frequency} onChange={e=>setForm(p=>({...p,frequency:e.target.value}))}
                  style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>TIME</label>
                <input type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))}
                  style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:12,outline:'none',boxSizing:'border-box'}}/>
              </div>
            </div>
            {form.frequency === 'weekly' && (
              <div style={{marginBottom:12}}>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>DAY OF WEEK</label>
                <select value={form.dayOfWeek} onChange={e=>setForm(p=>({...p,dayOfWeek:parseInt(e.target.value)}))}
                  style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}>
                  {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d,i)=><option key={i} value={i}>{d}</option>)}
                </select>
              </div>
            )}
            <button onClick={saveSchedule} disabled={saving}
              style={{width:'100%',padding:'10px 0',borderRadius:8,border:'none',background:saving?'#94a3b8':'#1d4ed8',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>
              {saving?'Saving...':'💾 Save Schedule'}
            </button>
          </div>

          <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:16}}>Active Schedules</div>
            {schedules.length === 0 ? (
              <div style={{textAlign:'center',padding:30,color:'#94a3b8'}}>
                <div style={{fontSize:24,marginBottom:8}}>⏰</div>
                <div>No schedules configured yet</div>
                <div style={{fontSize:11,marginTop:4}}>Add a schedule to automate report delivery</div>
              </div>
            ) : schedules.map((s,i)=>(
              <div key={i} style={{padding:'12px 14px',borderRadius:8,background:'#f8faff',border:'1px solid #e2e8f0',marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <span style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{REPORTS.find(r=>r.id===s.reportType)?.label||s.reportType}</span>
                  <Badge text={s.frequency} color='#1d4ed8'/>
                </div>
                <div style={{fontSize:11,color:'#64748b'}}>📧 {s.email}</div>
                <div style={{fontSize:11,color:'#64748b'}}>🕐 {s.time} {s.frequency==='weekly'?['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][s.dayOfWeek]||'':''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',overflow:'hidden'}}>
          <div style={{padding:'12px 16px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f8faff'}}>
            <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>Event & Report History</div>
            <button onClick={loadHistory} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',fontSize:11,cursor:'pointer'}}>↻ Refresh</button>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead><tr style={{background:'#f8faff'}}>{['Time','Type','Status','Detail'].map(h=><th key={h} style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:10,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
            <tbody>
              {history.length===0?<tr><td colSpan={4} style={{padding:30,textAlign:'center',color:'#94a3b8'}}>No history yet</td></tr>:
              history.map((h,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #f8faff',background:i%2===0?'#fff':'#fafbff'}}>
                  <td style={{padding:'8px 12px',color:'#64748b',whiteSpace:'nowrap'}}>{new Date(h.created_at).toLocaleString('en-IN')}</td>
                  <td style={{padding:'8px 12px'}}><Badge text={h.automation_type} color='#1d4ed8'/></td>
                  <td style={{padding:'8px 12px'}}><Badge text={h.status} color={h.status==='success'?'#16a34a':'#dc2626'}/></td>
                  <td style={{padding:'8px 12px',color:'#334155',maxWidth:300,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
