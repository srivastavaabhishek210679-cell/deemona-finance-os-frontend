import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const api = async (url, method='GET', body=null) => {
  try {
    const r = await fetch(apiURL(url), { method, headers: h(), body: body?JSON.stringify(body):null });
    return await r.json();
  } catch(e) { return { error: e.message }; }
};

const timeAgo = (iso) => {
  if (!iso) return null;
  const diff = Math.floor((new Date() - new Date(iso)) / 1000);
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  return new Date(iso).toLocaleDateString('en-IN');
};

const CATEGORY_COLORS = {
  'AI Reports': '#7c3aed',
  'Financial': '#1d4ed8',
  'Tax & Compliance': '#059669',
  'Operations': '#d97706',
};

export default function ReportCenter() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState({});
  const [sent, setSent] = useState({});
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),4000); };

  useEffect(() => {
    api('/api/dashboard/reports/schedule').then(r => {
      if (r.scheduled) setReports(r.scheduled);
    });
  }, []);

  const trigger = async (id) => {
    setLoading(p => ({...p, [id]: true}));
    const r = await api('/api/dashboard/reports/trigger', 'POST', { report_id: id });
    setLoading(p => ({...p, [id]: false}));
    if (r.success) {
      setSent(p => ({...p, [id]: new Date().toISOString()}));
      showToast('Report sent to ' + r.sent_to);
      // refresh schedule
      api('/api/dashboard/reports/schedule').then(r2 => { if (r2.scheduled) setReports(r2.scheduled); });
    } else {
      showToast('Error: ' + (r.error || 'Failed'), false);
    }
  };

  const getCategory = (id) => {
    if (['ai_insights','anomaly_detection'].includes(id)) return 'AI Reports';
    if (['balance_sheet','weekly_pl','monthly_financial','monthly_budget'].includes(id)) return 'Financial';
    if (['filing_gstr3b','monthly_gst','daily_compliance','weekly_ap'].includes(id)) return 'Tax & Compliance';
    return 'Operations';
  };

  const filtered = filter === 'all' ? reports : reports.filter(r => getCategory(r.id) === filter);

  return (
    <div style={{padding:20,background:'#f0f4ff',minHeight:'100%'}}>
      {toast && <div style={{position:'fixed',top:20,right:20,zIndex:9999,padding:'10px 16px',borderRadius:8,background:toast.ok?'#f0fdf4':'#fef2f2',border:`1px solid ${toast.ok?'#bbf7d0':'#fecaca'}`,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',fontSize:12,fontWeight:600,color:toast.ok?'#16a34a':'#dc2626'}}>{toast.msg}</div>}

      <div style={{background:'linear-gradient(135deg,#1e3a8a,#7c3aed)',borderRadius:12,padding:'16px 20px',marginBottom:14,color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontSize:17,fontWeight:900}}>Report Center</div>
          <div style={{fontSize:11,opacity:0.85}}>All 14 scheduled reports — trigger any report on-demand for fresh live data</div>
        </div>
        <div style={{background:'rgba(255,255,255,0.15)',borderRadius:10,padding:'8px 16px',textAlign:'center'}}>
          <div style={{fontSize:26,fontWeight:900}}>{reports.length}</div>
          <div style={{fontSize:10,opacity:0.8}}>Reports</div>
        </div>
      </div>

      {/* Info banner */}
      <div style={{background:'#fffbeb',border:'1px solid #fde047',borderRadius:10,padding:'10px 16px',marginBottom:14,fontSize:12,color:'#78350f',display:'flex',gap:10,alignItems:'flex-start'}}>
        <span style={{fontSize:16,flexShrink:0}}>&#9889;</span>
        <div>
          <strong>Scheduled reports run automatically</strong> but may be up to 24hrs old. Click <strong>"Send Now"</strong> on any report to instantly generate it with live current data and email it to your inbox — regardless of the schedule.
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
        {['all','AI Reports','Financial','Tax & Compliance','Operations'].map(f => (
          <button key={f} onClick={()=>setFilter(f)}
            style={{padding:'6px 14px',borderRadius:8,border:`2px solid ${filter===f?'#1d4ed8':'#e2e8f0'}`,background:filter===f?'#eff6ff':'#fff',color:filter===f?'#1d4ed8':'#64748b',fontSize:11,fontWeight:filter===f?700:400,cursor:'pointer'}}>
            {f === 'all' ? 'All Reports' : f}
          </button>
        ))}
      </div>

      {/* Report Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:12}}>
        {filtered.map(report => {
          const cat = getCategory(report.id);
          const color = CATEGORY_COLORS[cat] || '#64748b';
          const lastSent = sent[report.id] || report.last_sent;
          return (
            <div key={report.id} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',overflow:'hidden',borderTop:`3px solid ${color}`}}>
              <div style={{padding:'12px 14px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                  <div style={{fontSize:12,fontWeight:800,color:'#0f172a'}}>{report.name}</div>
                  <span style={{padding:'2px 7px',borderRadius:4,fontSize:9,fontWeight:700,background:color+'18',color,border:`1px solid ${color}30`,whiteSpace:'nowrap',marginLeft:6}}>{cat}</span>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:10}}>
                  <div style={{color:'#64748b'}}>
                    <span style={{marginRight:8}}>&#128197; {report.schedule}</span>
                  </div>
                  <div style={{color:lastSent?'#16a34a':'#dc2626',fontWeight:700}}>
                    {lastSent ? 'Last: ' + timeAgo(lastSent) : 'Never sent'}
                  </div>
                </div>
              </div>
              <div style={{padding:'0 14px 12px',display:'flex',gap:8}}>
                <button onClick={() => trigger(report.id)} disabled={loading[report.id]}
                  style={{flex:1,padding:'8px 0',borderRadius:7,border:'none',background:loading[report.id]?'#e2e8f0':color,color:'#fff',fontSize:11,fontWeight:700,cursor:loading[report.id]?'not-allowed':'pointer',transition:'opacity 0.2s',opacity:loading[report.id]?0.7:1}}>
                  {loading[report.id] ? 'Sending...' : sent[report.id] ? 'Sent! Send Again' : 'Send Now (Live Data)'}
                </button>
              </div>
              {sent[report.id] && (
                <div style={{padding:'6px 14px',background:'#f0fdf4',borderTop:'1px solid #bbf7d0',fontSize:10,color:'#16a34a',fontWeight:600}}>
                  &#10003; Sent to your inbox at {new Date(sent[report.id]).toLocaleTimeString('en-IN')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!filtered.length && (
        <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>No reports found. Loading...</div>
      )}
    </div>
  );
}
