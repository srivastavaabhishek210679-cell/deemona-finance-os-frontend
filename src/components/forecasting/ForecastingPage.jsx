import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { const r = await fetch(apiURL(url), { headers: h() }); return r.json(); };
const post = async (url, body) => { const r = await fetch(apiURL(url), { method:'POST', headers:h(), body:JSON.stringify(body) }); return r.json(); };

function INR(n) { const v=parseFloat(n||0); if(v>=1e7) return 'Rs '+(v/1e7).toFixed(2)+' Cr'; if(v>=1e5) return 'Rs '+(v/1e5).toFixed(2)+' L'; return 'Rs '+v.toLocaleString('en-IN'); }

function SparkBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value/max)*100) : 0;
  return <div style={{ height:6, borderRadius:3, background:'var(--surface-3)', overflow:'hidden', marginTop:4 }}><div style={{ height:'100%', width:pct+'%', background:color||'#1B4FD8', borderRadius:3 }}/></div>;
}

function ForecastTable({ rows, columns }) {
  return (
    <div style={{ borderRadius:10, border:'1px solid var(--border)', overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${columns.length},1fr)`, background:'var(--surface-3)', padding:'10px 14px' }}>
        {columns.map(c=><div key={c} style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.04em' }}>{c}</div>)}
      </div>
      {rows.map((row,i)=>(
        <div key={i} style={{ display:'grid', gridTemplateColumns:`repeat(${columns.length},1fr)`, padding:'10px 14px', borderTop:'1px solid var(--border)', background: row.highlight ? '#6C63FF08' : 'transparent' }}>
          {row.cells.map((cell,j)=><div key={j} style={{ fontSize:13, fontWeight:j===0?600:400, color:row.color||'var(--text-primary)' }}>{cell}</div>)}
        </div>
      ))}
    </div>
  );
}

export default function ForecastingPage() {
  const [tab, setTab] = useState('cashflow');
  const [cashForecast, setCashForecast] = useState(null);
  const [revForecast, setRevForecast] = useState(null);
  const [expForecast, setExpForecast] = useState(null);
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState({});
  const [insightLoading, setInsightLoading] = useState(false);
  const [days, setDays] = useState(90);
  const [months, setMonths] = useState(6);

  const load = async (type) => {
    setLoading(p=>({...p,[type]:true}));
    if (type==='cashflow') { const d = await get(`/api/forecasting/cash-flow?days=${days}`); setCashForecast(d); }
    if (type==='revenue')  { const d = await get(`/api/forecasting/revenue?months=${months}`); setRevForecast(d); }
    if (type==='expenses') { const d = await get(`/api/forecasting/expenses?months=${months}`); setExpForecast(d); }
    setLoading(p=>({...p,[type]:false}));
  };

  const getInsights = async () => {
    setInsightLoading(true); setInsights('');
    const d = await post('/api/forecasting/ai-insights', { cash_forecast:cashForecast, revenue_forecast:revForecast, expense_forecast:expForecast });
    setInsights(d.insights||''); setInsightLoading(false);
  };

  useEffect(()=>{ load('cashflow'); load('revenue'); load('expenses'); },[]);

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, margin:0, marginBottom:6 }}>Forecasting Engine</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', margin:0 }}>Predictive analytics for cash flow, revenue, and expenses — powered by your real financial data</p>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['cashflow','💧 Cash Flow'],['revenue','📈 Revenue'],['expenses','📉 Expenses'],['insights','🤖 AI Insights']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'10px 20px', fontSize:14, fontWeight:600, background:'none', border:'none', cursor:'pointer', borderBottom:tab===id?'2px solid #6C63FF':'2px solid transparent', color:tab===id?'#1B4FD8':'var(--text-secondary)', marginBottom:-1 }}>{label}</button>
        ))}
      </div>

      {/* Cash Flow Forecast */}
      {tab==='cashflow' && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:20, alignItems:'center' }}>
            <select value={days} onChange={e=>setDays(parseInt(e.target.value))} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-primary)', fontSize:13 }}>
              <option value={30}>30 days</option><option value={60}>60 days</option><option value={90}>90 days</option>
            </select>
            <button onClick={()=>load('cashflow')} style={{ padding:'8px 20px', borderRadius:8, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#1B4FD8,#3B82F6)', color:'#fff', border:'none', cursor:'pointer' }}>Refresh</button>
          </div>

          {loading.cashflow && <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>Computing forecast...</div>}

          {cashForecast && !loading.cashflow && (
            <div>
              {/* KPIs */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
                {[
                  { label:'Current Cash',   value:INR(cashForecast.current_cash),  color:'#22C98A' },
                  { label:'Monthly Burn',   value:INR(cashForecast.monthly_burn),  color:'#FF5C5C' },
                  { label:'Runway',         value:cashForecast.runway_months+' mo',color:cashForecast.runway_months<3?'#FF5C5C':cashForecast.runway_months<6?'#F5A623':'#22C98A' },
                  { label:'Critical Dates', value:cashForecast.summary?.critical_dates||0, color:cashForecast.summary?.critical_dates>0?'#FF5C5C':'#22C98A' },
                ].map(k=>(
                  <div key={k.label} style={{ padding:'14px 16px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:20, fontWeight:800, color:k.color }}>{k.value}</div>
                    <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Expected flows */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
                <div style={{ padding:16, borderRadius:12, background:'#22C98A08', border:'1px solid #22C98A30' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#22C98A', marginBottom:4 }}>Expected Inflows (AR)</div>
                  <div style={{ fontSize:22, fontWeight:800 }}>{INR(cashForecast.summary?.ar_expected)}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>From pending invoices</div>
                </div>
                <div style={{ padding:16, borderRadius:12, background:'#FF5C5C08', border:'1px solid #FF5C5C30' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#FF5C5C', marginBottom:4 }}>Expected Outflows (AP)</div>
                  <div style={{ fontSize:22, fontWeight:800 }}>{INR(cashForecast.summary?.ap_expected)}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>Pending vendor payments</div>
                </div>
              </div>

              {/* Forecast table */}
              <ForecastTable
                columns={['Date','Day','Opening','Inflows','Outflows','Net','Closing','Alert']}
                rows={cashForecast.forecast?.slice(0,15).map(f=>({
                  cells: [f.date, f.day, INR(f.opening), INR(f.inflows), INR(f.outflows), INR(f.net), INR(f.closing), f.is_negative?'🔴 Negative':f.is_low?'🟡 Low':''],
                  color: f.is_negative?'#FF5C5C':f.is_low?'#F5A623':'var(--text-primary)',
                  highlight: f.is_low||f.is_negative,
                }))||[]}
              />
            </div>
          )}
        </div>
      )}

      {/* Revenue Forecast */}
      {tab==='revenue' && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:20, alignItems:'center' }}>
            <select value={months} onChange={e=>setMonths(parseInt(e.target.value))} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-primary)', fontSize:13 }}>
              <option value={3}>3 months</option><option value={6}>6 months</option><option value={12}>12 months</option>
            </select>
            <button onClick={()=>load('revenue')} style={{ padding:'8px 20px', borderRadius:8, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#22C98A,#1AAF74)', color:'#fff', border:'none', cursor:'pointer' }}>Refresh</button>
          </div>

          {revForecast && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
                <div style={{ padding:'14px 16px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:'#22C98A' }}>{INR(revForecast.avg_monthly_revenue)}</div>
                  <div style={{ fontSize:13, color:'var(--text-muted)' }}>Avg Monthly Revenue</div>
                </div>
                <div style={{ padding:'14px 16px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:20, fontWeight:800, color: revForecast.growth_rate>=0?'#22C98A':'#FF5C5C' }}>{revForecast.growth_rate>0?'+':''}{revForecast.growth_rate}%</div>
                  <div style={{ fontSize:13, color:'var(--text-muted)' }}>Monthly Growth Rate</div>
                </div>
                <div style={{ padding:'14px 16px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:'#1B4FD8' }}>{INR(revForecast.pipeline_value)}</div>
                  <div style={{ fontSize:13, color:'var(--text-muted)' }}>Weighted Pipeline</div>
                </div>
              </div>

              <ForecastTable
                columns={['Month','Conservative','Predicted','Optimistic','Pipeline']}
                rows={revForecast.forecast?.map((f,i)=>({
                  cells:[f.month_name, INR(f.conservative), INR(f.predicted_revenue), INR(f.optimistic), INR(f.pipeline_contribution)],
                  highlight: i===0,
                }))||[]}
              />

              {/* Simple bar chart */}
              <div style={{ marginTop:20, padding:16, borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:12 }}>Revenue Trend</div>
                {revForecast.forecast?.slice(0,6).map((f,i)=>(
                  <div key={i} style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:2 }}>
                      <span style={{ color:'var(--text-secondary)' }}>{f.month_name}</span>
                      <span style={{ fontWeight:600 }}>{INR(f.predicted_revenue)}</span>
                    </div>
                    <SparkBar value={f.predicted_revenue} max={Math.max(...(revForecast.forecast?.map(x=>x.optimistic)||[1]))} color='#22C98A' />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expense Forecast */}
      {tab==='expenses' && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:20, alignItems:'center' }}>
            <select value={months} onChange={e=>setMonths(parseInt(e.target.value))} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-primary)', fontSize:13 }}>
              <option value={3}>3 months</option><option value={6}>6 months</option><option value={12}>12 months</option>
            </select>
            <button onClick={()=>load('expenses')} style={{ padding:'8px 20px', borderRadius:8, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#FF5C5C,#E53935)', color:'#fff', border:'none', cursor:'pointer' }}>Refresh</button>
          </div>

          {expForecast && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                <div style={{ padding:'14px 16px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:'#FF5C5C' }}>{INR(expForecast.avg_monthly_expenses)}</div>
                  <div style={{ fontSize:13, color:'var(--text-muted)' }}>Avg Monthly Expenses</div>
                </div>
                <div style={{ padding:'14px 16px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:'#1B4FD8' }}>{INR(expForecast.avg_payroll)}</div>
                  <div style={{ fontSize:13, color:'var(--text-muted)' }}>Monthly Payroll</div>
                </div>
              </div>

              <ForecastTable
                columns={['Month','Payroll','Operations','Total Expenses']}
                rows={expForecast.forecast?.map((f,i)=>({
                  cells:[f.month_name, INR(f.payroll), INR(f.operations), INR(f.predicted_expenses)],
                  highlight:i===0,
                }))||[]}
              />
            </div>
          )}
        </div>
      )}

      {/* AI Insights */}
      {tab==='insights' && (
        <div style={{ maxWidth:800 }}>
          <div style={{ marginBottom:16, padding:16, borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-secondary)' }}>
            AI analyzes your cash flow, revenue, and expense forecasts together to identify risks, opportunities, and recommended actions.
          </div>
          <button onClick={getInsights} disabled={insightLoading} style={{ marginBottom:20, padding:'12px 28px', borderRadius:10, fontSize:14, fontWeight:700, background:insightLoading?'var(--surface-3)':'linear-gradient(135deg,#1B4FD8,#3B82F6)', color:insightLoading?'var(--text-muted)':'#fff', border:'none', cursor:insightLoading?'not-allowed':'pointer' }}>
            {insightLoading?'🤖 Analyzing all forecasts...':'🤖 Generate AI Insights'}
          </button>

          {insights && (
            <div style={{ padding:'20px 24px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)', fontSize:14, lineHeight:1.8, whiteSpace:'pre-wrap' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#22C98A', marginBottom:12, letterSpacing:'0.06em' }}>AI FORECAST ANALYSIS</div>
              {insights}
            </div>
          )}

          {!insights && !insightLoading && (
            <div style={{ textAlign:'center', padding:'60px 20px', border:'2px dashed var(--border)', borderRadius:12, color:'var(--text-muted)' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📊</div>
              <div style={{ fontSize:15, fontWeight:600 }}>AI Insights Ready</div>
              <div style={{ fontSize:13, marginTop:6 }}>Load Cash Flow, Revenue, and Expense forecasts first, then get AI analysis</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
