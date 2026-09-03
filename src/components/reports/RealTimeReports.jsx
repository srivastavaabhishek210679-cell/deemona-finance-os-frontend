import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const api = async (url, method='GET', body=null) => {
  try {
    const r = await fetch(apiURL(url), { method, headers: h(), body: body ? JSON.stringify(body) : null });
    return await r.json();
  } catch(e) { return { error: e.message }; }
};

const fmt = (n) => {
  const v = parseFloat(n||0);
  if (v >= 10000000) return '\u20b9' + (v/10000000).toFixed(2) + 'Cr';
  if (v >= 100000) return '\u20b9' + (v/100000).toFixed(2) + 'L';
  if (v >= 1000) return '\u20b9' + v.toLocaleString('en-IN', {maximumFractionDigits:2});
  return '\u20b9' + v.toFixed(2);
};

const timeAgo = (iso) => {
  if (!iso) return 'No data yet';
  const diff = Math.floor((new Date() - new Date(iso)) / 1000);
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  return new Date(iso).toLocaleDateString('en-IN');
};

export function LastUpdatedWidget() {
  const [data, setData] = useState(null);
  const load = useCallback(() => {
    api('/api/dashboard/reports/last-updated').then(r => { if (!r.error) setData(r); });
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);
  if (!data) return null;
  return (
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',background:'#f0fdf4',borderRadius:8,border:'1px solid #bbf7d0',marginBottom:12,flexWrap:'wrap'}}>
      <div style={{display:'flex',alignItems:'center',gap:4}}>
        <span style={{width:7,height:7,borderRadius:'50%',background:'#16a34a',display:'inline-block'}}/>
        <span style={{fontSize:11,fontWeight:800,color:'#16a34a'}}>LIVE DATA</span>
      </div>
      <span style={{fontSize:10,color:'#64748b'}}>Server: {new Date(data.server_time).toLocaleTimeString('en-IN')}</span>
      {Object.entries(data.last_updated||{}).map(([k,v]) => (
        <span key={k} style={{fontSize:10,color:'#334155'}}>
          <span style={{color:'#64748b'}}>{k.replace(/_/g,' ')}: </span>
          <span style={{fontWeight:700,color:!v?'#dc2626':'#16a34a'}}>{timeAgo(v)}</span>
        </span>
      ))}
      <button onClick={load} style={{marginLeft:'auto',padding:'2px 8px',borderRadius:4,border:'1px solid #bbf7d0',background:'#fff',fontSize:10,cursor:'pointer',color:'#16a34a',fontWeight:700}}>Refresh</button>
    </div>
  );
}

const REPORTS = [
  {id:'balance_sheet',name:'Balance Sheet',icon:'BS',color:'#1d4ed8',desc:'Assets, Liabilities & Equity — current state'},
  {id:'profit_loss',name:'Profit & Loss',icon:'P&L',color:'#059669',desc:'Revenue, Expenses & Net Profit — this month'},
  {id:'cash_flow',name:'Cash Flow',icon:'CF',color:'#0891b2',desc:'Inflows & Outflows — last 30 days'},
  {id:'ar_aging',name:'AR Aging',icon:'AR',color:'#dc2626',desc:'Outstanding receivables by overdue period'},
  {id:'gst_summary',name:'GST Summary',icon:'GST',color:'#7c3aed',desc:'CGST, SGST, IGST — current month'},
  {id:'payroll_summary',name:'Payroll Summary',icon:'PAY',color:'#d97706',desc:'Employee count & salary totals — active staff'},
];

export default function RealTimeReports() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [emailSent, setEmailSent] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [serverTime, setServerTime] = useState(new Date());

  useEffect(() => {
    api('/api/dashboard/reports/last-updated').then(r => { if (!r.error) setLastUpdated(r); });
    const t = setInterval(() => setServerTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const generate = async (id, withEmail=false) => {
    setLoading(p => ({...p, [id]: true}));
    const r = await api('/api/dashboard/reports/generate', 'POST', { report_type: id, email: withEmail });
    setLoading(p => ({...p, [id]: false}));
    if (r.data) {
      setResults(p => ({...p, [id]: r}));
      if (withEmail) setEmailSent(p => ({...p, [id]: true}));
    }
  };

  const renderData = (data) => {
    if (!data) return null;
    return Object.entries(data)
      .filter(([k]) => !['generated_at','period'].includes(k))
      .map(([k,v],i) => (
        <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #f1f5f9',fontSize:11}}>
          <span style={{color:'#64748b',fontWeight:600,textTransform:'capitalize'}}>{k.replace(/_/g,' ')}</span>
          <span style={{fontWeight:800,color:'#0f172a'}}>{typeof v==='number'&&v>999?fmt(v):String(v)}</span>
        </div>
      ));
  };

  return (
    <div style={{padding:20,background:'#f0f4ff',minHeight:'100%'}}>
      <div style={{background:'linear-gradient(135deg,#059669,#0891b2)',borderRadius:12,padding:'16px 20px',marginBottom:14,color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontSize:17,fontWeight:900}}>Real-Time Report Generation</div>
          <div style={{fontSize:11,opacity:0.85}}>Live database reads — zero caching — data current to the second</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:22,fontWeight:900}}>{serverTime.toLocaleTimeString('en-IN')}</div>
          <div style={{fontSize:10,opacity:0.7}}>Live IST</div>
        </div>
      </div>

      {lastUpdated && (
        <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'12px 16px',marginBottom:14}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#16a34a',display:'inline-block'}}/>
            <span style={{fontSize:12,fontWeight:800,color:'#16a34a'}}>LIVE DATABASE STATUS</span>
            <span style={{fontSize:10,color:'#64748b',marginLeft:'auto'}}>Refreshes every 30s</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:8}}>
            {Object.entries(lastUpdated.last_updated||{}).map(([k,v]) => (
              <div key={k} style={{padding:'8px 10px',background:'#f8faff',borderRadius:7,border:'1px solid #e2e8f0'}}>
                <div style={{fontSize:9,color:'#64748b',fontWeight:700,textTransform:'uppercase',marginBottom:2}}>{k.replace(/_/g,' ')}</div>
                <div style={{fontSize:12,fontWeight:800,color:!v?'#dc2626':'#16a34a'}}>{timeAgo(v)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14}}>
        {REPORTS.map(report => (
          <div key={report.id} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',overflow:'hidden',borderTop:`3px solid ${report.color}`}}>
            <div style={{padding:'12px 14px',borderBottom:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:36,height:36,borderRadius:8,background:report.color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:10,fontWeight:900,flexShrink:0}}>{report.icon}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:800,color:'#0f172a'}}>{report.name}</div>
                  <div style={{fontSize:10,color:'#64748b'}}>{report.desc}</div>
                </div>
              </div>
              {results[report.id] && (
                <div style={{fontSize:9,color:'#16a34a',fontWeight:700,background:'#f0fdf4',padding:'2px 6px',borderRadius:4,whiteSpace:'nowrap'}}>
                  {new Date(results[report.id].generated_at).toLocaleTimeString('en-IN')}
                </div>
              )}
            </div>

            {results[report.id] && (
              <div style={{padding:'10px 14px',background:'#fafbff',borderBottom:'1px solid #e2e8f0',maxHeight:200,overflowY:'auto'}}>
                {renderData(results[report.id].data)}
                {results[report.id].data?.period && (
                  <div style={{fontSize:9,color:'#94a3b8',marginTop:4}}>Period: {results[report.id].data.period}</div>
                )}
              </div>
            )}

            <div style={{padding:'10px 14px',display:'flex',gap:8}}>
              <button onClick={() => generate(report.id)} disabled={loading[report.id]}
                style={{flex:1,padding:'8px 0',borderRadius:7,border:'none',background:loading[report.id]?'#e2e8f0':report.color,color:'#fff',fontSize:11,fontWeight:700,cursor:loading[report.id]?'not-allowed':'pointer'}}>
                {loading[report.id]?'Generating...' : results[report.id]?'Refresh Now':'Generate Now'}
              </button>
              <button onClick={() => generate(report.id, true)} disabled={loading[report.id]} title="Generate & Email to inbox"
                style={{padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',background:emailSent[report.id]?'#f0fdf4':'#fff',color:emailSent[report.id]?'#16a34a':'#64748b',fontSize:13,cursor:'pointer'}}>
                {emailSent[report.id]?'\u2713':'@'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop:14,padding:14,background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',fontSize:11,color:'#64748b',lineHeight:1.7}}>
        <strong style={{color:'#334155'}}>How real-time works:</strong> Every report reads directly from the live database the moment you click Generate. Zero caching. The timestamp is the exact second your report was created. Click the @ button to instantly receive the report in your inbox.
      </div>
    </div>
  );
}
