import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { const r = await fetch(apiURL(url), { headers: h() }); return r.json(); };
const post = async (url, body) => { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); return r.json(); };

function INR(n) {
  const v = parseFloat(n||0);
  if (v>=1e7) return 'Rs '+(v/1e7).toFixed(2)+' Cr';
  if (v>=1e5) return 'Rs '+(v/1e5).toFixed(2)+' L';
  return 'Rs '+v.toLocaleString('en-IN');
}

function SeverityBadge({ sev }) {
  const c = { high:'#FF5C5C', medium:'#F5A623', low:'#22C98A' };
  return <span style={{ padding:'2px 8px', borderRadius:100, fontSize:10, fontWeight:700, background:(c[sev]||'#1B4FD8')+'20', color:c[sev]||'#1B4FD8' }}>{sev?.toUpperCase()}</span>;
}

function RiskGauge({ score }) {
  const color = score > 70 ? '#FF5C5C' : score > 40 ? '#F5A623' : '#22C98A';
  const label = score > 70 ? 'HIGH RISK' : score > 40 ? 'MEDIUM RISK' : 'LOW RISK';
  return (
    <div style={{ textAlign:'center', padding:'24px 20px', borderRadius:12, background:'var(--surface-2)', border:`2px solid ${color}40` }}>
      <div style={{ fontSize:48, fontWeight:900, color, marginBottom:4 }}>{score}</div>
      <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.1em', color }}>{label}</div>
      <div style={{ marginTop:12, height:8, borderRadius:4, background:'var(--surface-3)', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${score}%`, background:`linear-gradient(90deg, #22C98A, ${score>70?'#FF5C5C':'#F5A623'})`, borderRadius:4, transition:'width 0.5s' }} />
      </div>
      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>Risk Score / 100</div>
    </div>
  );
}

export default function AuditAgentPage() {
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [trail, setTrail] = useState([]);
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    get('/api/audit/dashboard').then(setDashboard);
    get('/api/audit/anomalies').then(setAnomalies);
    get('/api/audit/trail').then(d => setTrail(d.trail||[]));
  }, []);

  const runAnalysis = async () => {
    setAnalyzing(true); setAnalysis('');
    const data = await post('/api/audit/analyze', { module: 'all' });
    setAnalysis(data.analysis||'');
    setAnalyzing(false);
  };

  const filtered = anomalies?.anomalies?.filter(a => filter==='all' || a.severity===filter) || [];

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, margin:0, marginBottom:6 }}>Audit Agent</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', margin:0 }}>AI-powered anomaly detection, fraud alerts, and financial audit trail</p>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['dashboard','🛡 Risk Dashboard'],['anomalies','⚠ Anomalies'],['analysis','🤖 AI Analysis'],['trail','📋 Audit Trail']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'10px 20px', fontSize:14, fontWeight:600, background:'none', border:'none', cursor:'pointer', borderBottom: tab===id ? '2px solid #1B4FD8' : '2px solid transparent', color: tab===id ? '#1B4FD8' : 'var(--text-secondary)', marginBottom:-1 }}>{label}</button>
        ))}
      </div>

      {/* Risk Dashboard */}
      {tab === 'dashboard' && dashboard && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:20, marginBottom:24 }}>
            <RiskGauge score={dashboard.risk_score||0} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, alignContent:'start' }}>
              {[
                { label:'Duplicate Invoices',      value:dashboard.anomalies?.duplicate_invoices||0,    color:'#FF5C5C', icon:'🔄' },
                { label:'Large Payments',           value:dashboard.anomalies?.large_payments||0,         color:'#F5A623', icon:'💸' },
                { label:'Overdue AR',               value:dashboard.anomalies?.overdue_ar||0,             color:'#FF5C5C', icon:'⏰' },
                { label:'Pending Expenses',         value:dashboard.anomalies?.pending_expenses||0,       color:'#F5A623', icon:'📋' },
                { label:'High Value AP',            value:dashboard.anomalies?.high_value_ap||0,          color:'#4FC3F7', icon:'📄' },
                { label:'Total Anomalies',          value:dashboard.total_anomalies||0,                   color:dashboard.total_anomalies>5?'#FF5C5C':'#22C98A', icon:'⚡' },
              ].map(k => (
                <div key={k.label} style={{ padding:'14px 16px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>{k.icon} {k.label}</div>
                  <div style={{ fontSize:24, fontWeight:800, color:k.color }}>{k.value}</div>
                </div>
              ))}
            </div>
          </div>

          {dashboard.anomalies?.overdue_ar_amount > 0 && (
            <div style={{ padding:'14px 16px', borderRadius:10, background:'#FF5C5C12', border:'1px solid #FF5C5C30', marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#FF5C5C' }}>⚠ {INR(dashboard.anomalies.overdue_ar_amount)} in AR overdue more than 60 days — immediate collections action needed</div>
            </div>
          )}

          <button onClick={() => setTab('analysis')} style={{ padding:'10px 20px', borderRadius:10, fontSize:14, fontWeight:700, background:'linear-gradient(135deg,#1B4FD8,#3B82F6)', color:'#fff', border:'none', cursor:'pointer' }}>
            Run Full AI Audit Analysis
          </button>
        </div>
      )}

      {/* Anomalies */}
      {tab === 'anomalies' && anomalies && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            {[['all','All'],['high','High'],['medium','Medium'],['low','Low']].map(([val,label]) => (
              <button key={val} onClick={() => setFilter(val)} style={{ padding:'6px 16px', borderRadius:100, fontSize:13, fontWeight:600, background: filter===val ? '#1B4FD8' : 'var(--surface-2)', color: filter===val ? '#fff' : 'var(--text-secondary)', border:'1px solid var(--border)', cursor:'pointer' }}>{label}</button>
            ))}
            <span style={{ marginLeft:'auto', fontSize:13, color:'var(--text-muted)', alignSelf:'center' }}>{filtered.length} anomalies</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>✓</div>
              <div style={{ fontSize:16, fontWeight:600 }}>No anomalies detected</div>
              <div style={{ fontSize:13, marginTop:6 }}>Your financial data looks clean</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filtered.map((a, i) => (
                <div key={i} style={{ padding:'14px 16px', borderRadius:12, border:`1px solid ${a.severity==='high'?'#FF5C5C40':a.severity==='medium'?'#F5A62340':'var(--border)'}`, background:'var(--surface-2)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <SeverityBadge sev={a.severity} />
                      <span style={{ padding:'2px 8px', borderRadius:100, fontSize:10, fontWeight:600, background:'var(--surface-3)', color:'var(--text-secondary)' }}>{a.category}</span>
                      <span style={{ padding:'2px 8px', borderRadius:100, fontSize:10, fontWeight:600, background:'#1B4FD820', color:'#3B82F6' }}>{a.anomaly_type?.replace(/_/g,' ')}</span>
                    </div>
                    {a.amount && <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)' }}>{INR(a.amount)}</span>}
                  </div>
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:3 }}>
                    {a.invoice_number || a.vendor_name || a.customer_name || a.description?.substring(0,60)}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>{a.description || a.description2}</div>
                  {a.due_date && <div style={{ fontSize:11, color:'#FF5C5C', marginTop:4 }}>Due: {new Date(a.due_date).toLocaleDateString('en-IN')}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Analysis */}
      {tab === 'analysis' && (
        <div style={{ maxWidth:800 }}>
          <div style={{ marginBottom:16 }}>
            <button onClick={runAnalysis} disabled={analyzing} style={{ padding:'12px 24px', borderRadius:10, fontSize:14, fontWeight:700, background: analyzing ? 'var(--surface-3)' : 'linear-gradient(135deg,#1B4FD8,#3B82F6)', color: analyzing ? 'var(--text-muted)' : '#fff', border:'none', cursor: analyzing ? 'not-allowed':'pointer' }}>
              {analyzing ? '🔍 Analyzing all modules...' : '🤖 Run Full AI Audit Analysis'}
            </button>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:8 }}>Analyzes AP, AR, Payroll, Expenses, Projects and identifies risks, gaps, and recommendations</div>
          </div>

          {analysis && (
            <div style={{ padding:'20px 24px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)', fontSize:14, lineHeight:1.8, whiteSpace:'pre-wrap' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#22C98A', marginBottom:12, letterSpacing:'0.06em' }}>AI AUDIT REPORT</div>
              {analysis}
            </div>
          )}

          {!analysis && !analyzing && (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)', border:'2px dashed var(--border)', borderRadius:12 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🤖</div>
              <div style={{ fontSize:15, fontWeight:600, marginBottom:6 }}>AI Audit Engine Ready</div>
              <div style={{ fontSize:13 }}>Click above to run a comprehensive financial audit across all modules</div>
            </div>
          )}
        </div>
      )}

      {/* Audit Trail */}
      {tab === 'trail' && (
        <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
          <div style={{ padding:'14px 16px', background:'var(--surface-3)', fontSize:13, fontWeight:700, color:'var(--text-muted)' }}>
            AUDIT TRAIL — All Financial Activity
          </div>
          {trail.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>No activity recorded yet</div>
          ) : trail.map((entry, i) => (
            <div key={i} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <span style={{ padding:'2px 8px', borderRadius:100, fontSize:11, fontWeight:600, background:'#1B4FD820', color:'#3B82F6', flexShrink:0 }}>{entry.module}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{entry.reference}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(entry.updated_at||entry.date).toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:13, fontWeight:700 }}>{INR(entry.amount)}</div>
                <span style={{ padding:'2px 8px', borderRadius:100, fontSize:10, fontWeight:600, background: entry.status==='paid'||entry.status==='completed'||entry.status==='credit' ? '#22C98A20' : entry.status==='pending'||entry.status==='submitted' ? '#F5A62320' : 'var(--surface-3)', color: entry.status==='paid'||entry.status==='completed'||entry.status==='credit' ? '#22C98A' : entry.status==='pending'||entry.status==='submitted' ? '#F5A623' : 'var(--text-muted)' }}>{entry.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
