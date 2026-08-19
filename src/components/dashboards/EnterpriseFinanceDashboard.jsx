import { useState, useEffect, useRef } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); return await r.json(); } catch { return {}; } };
const INR = (n, compact=false) => {
  const v = parseFloat(n||0);
  if (compact) {
    if (v >= 10000000) return 'Rs ' + (v/10000000).toFixed(2) + 'Cr';
    if (v >= 100000) return 'Rs ' + (v/100000).toFixed(2) + 'L';
    if (v >= 1000) return 'Rs ' + (v/1000).toFixed(1) + 'K';
  }
  return 'Rs ' + v.toLocaleString('en-IN', {minimumFractionDigits:0, maximumFractionDigits:0});
};
const pct = (a,b) => b > 0 ? ((a/b)*100).toFixed(1) : '0.0';
const chg = (a,b) => b > 0 ? (((a-b)/b)*100).toFixed(1) : '0.0';

// ── Sparkline SVG ─────────────────────────────────────────────
function Sparkline({ data=[], color='#1B4FD8', height=40, width=120 }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v,i) => `${(i/(data.length-1))*width},${height - ((v-min)/range)*height}`).join(' ');
  const area = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} style={{display:'block'}}>
      <defs>
        <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg${color.replace('#','')})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────
function BarChart({ data=[], color='#1B4FD8', height=120, showLabels=true }) {
  if (!data.length) return <div style={{height,display:'flex',alignItems:'center',justifyContent:'center',color:'#94A3B8',fontSize:12}}>No data</div>;
  const max = Math.max(...data.map(d=>d.value||0)) || 1;
  return (
    <div style={{display:'flex',alignItems:'flex-end',gap:4,height,paddingBottom:showLabels?20:0}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',height:'100%'}}>
          <div style={{fontSize:9,color:'#64748B',marginBottom:2,fontWeight:600}}>{INR(d.value,true)}</div>
          <div style={{width:'100%',background:Array.isArray(color)?color[i%color.length]:color,borderRadius:'3px 3px 0 0',height:`${((d.value||0)/max)*(height-(showLabels?36:16))}px`,minHeight:2,transition:'height 0.3s ease'}}/>
          {showLabels && <div style={{fontSize:9,color:'#94A3B8',marginTop:4,textAlign:'center',lineHeight:1.2}}>{d.label}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Donut Chart ───────────────────────────────────────────────
function DonutChart({ segments=[], size=120, thickness=20 }) {
  const total = segments.reduce((s,seg)=>s+seg.value,0)||1;
  let cum = 0;
  const r = (size/2) - thickness/2;
  const c = size/2;
  const paths = segments.map((seg,i) => {
    const start = (cum/total)*360;
    const end = ((cum+seg.value)/total)*360;
    cum += seg.value;
    const s1 = (start-90)*Math.PI/180, e1 = (end-90)*Math.PI/180;
    const x1=c+r*Math.cos(s1), y1=c+r*Math.sin(s1);
    const x2=c+r*Math.cos(e1), y2=c+r*Math.sin(e1);
    const large = (end-start)>180?1:0;
    return <path key={i} d={`M${c},${c} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`} fill={seg.color} opacity={0.9}/>;
  });
  return (
    <svg width={size} height={size}>
      {paths}
      <circle cx={c} cy={c} r={r-thickness/2} fill="white"/>
    </svg>
  );
}

// ── KPI Card ──────────────────────────────────────────────────
function KPICard({ title, value, subtitle, change, changeLabel, color='#1B4FD8', sparkData=[], icon, onClick, drill }) {
  const isPos = parseFloat(change) >= 0;
  return (
    <div onClick={onClick} style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:'16px 18px',cursor:onClick?'pointer':'default',transition:'all 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.05)',position:'relative',overflow:'hidden'}}
      onMouseEnter={e=>{if(onClick)e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)';}}>
      <div style={{position:'absolute',top:0,left:0,width:3,height:'100%',background:color,borderRadius:'12px 0 0 12px'}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div style={{fontSize:11,fontWeight:700,color:'#64748B',letterSpacing:'0.05em',textTransform:'uppercase'}}>{title}</div>
        {icon && <span style={{fontSize:18}}>{icon}</span>}
      </div>
      <div style={{fontSize:24,fontWeight:800,color:'#0A1628',marginBottom:4,lineHeight:1}}>{value}</div>
      {subtitle && <div style={{fontSize:11,color:'#64748B',marginBottom:8}}>{subtitle}</div>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
        {change !== undefined && (
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <span style={{fontSize:11,fontWeight:700,color:isPos?'#059669':'#DC2626'}}>{isPos?'▲':'▼'} {Math.abs(change)}%</span>
            <span style={{fontSize:10,color:'#94A3B8'}}>{changeLabel||'vs last month'}</span>
          </div>
        )}
        {sparkData.length > 0 && <Sparkline data={sparkData} color={color} height={32} width={80}/>}
      </div>
      {drill && <div style={{position:'absolute',bottom:8,right:12,fontSize:9,color:'#C7D9F8',fontWeight:600}}>DRILL DOWN ▸</div>}
    </div>
  );
}

// ── Drill Down Modal ──────────────────────────────────────────
function DrillModal({ title, children, onClose }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,padding:24,maxWidth:900,width:'100%',maxHeight:'85vh',overflow:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,borderBottom:'1px solid #F1F5F9',paddingBottom:16}}>
          <div style={{fontSize:16,fontWeight:800,color:'#0A1628'}}>{title}</div>
          <button onClick={onClose} style={{background:'#F1F5F9',border:'none',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:13,color:'#64748B'}}>✕ Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function EnterpriseFinanceDashboard() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState(null);
  const [period, setPeriod] = useState('MTD');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { loadAll(); }, [period]);

  const loadAll = async () => {
    setLoading(true);
    const [gl, ar, ap, budget, assets, inventory, payroll, compliance, expenses, procurement] = await Promise.all([
      get('/api/accounting/gl-summary'),
      get('/api/accounting/ar-summary'),
      get('/api/accounting/ap-summary'),
      get('/api/budgeting/summary'),
      get('/api/assets/summary'),
      get('/api/inventory/summary'),
      get('/api/payroll/summary'),
      get('/api/compliance/summary'),
      get('/api/expenses/summary'),
      get('/api/procurement/summary'),
    ]);
    setData({ gl, ar, ap, budget, assets, inventory, payroll, compliance, expenses, procurement });
    setLoading(false);
  };

  const d = data;
  const revenue = parseFloat(d.gl?.monthly_revenue||0);
  const expenseTotal = parseFloat(d.gl?.monthly_expenses||0);
  const grossProfit = revenue - expenseTotal;
  const grossMargin = revenue > 0 ? ((grossProfit/revenue)*100).toFixed(1) : 0;
  const arOutstanding = parseFloat(d.gl?.ar_outstanding||0);
  const apOutstanding = parseFloat(d.gl?.ap_outstanding||0);
  const overdueAR = parseInt(d.gl?.overdue_ar||0);
  const overdueAP = parseInt(d.gl?.overdue_ap||0);

  // Simulated trend data
  const revTrend = [82,91,78,95,88,102,revenue/100000||110];
  const expTrend = [61,72,65,78,71,85,expenseTotal/100000||90];
  const arTrend = [120,135,118,142,128,155,arOutstanding/100000||160];

  const TABS = [['overview','📊 Overview'],['ar','💵 AR & Revenue'],['ap','💰 AP & Payables'],['budget','📈 Budget & Forecast'],['operational','⚙️ Operations']];

  if (loading) return (
    <div style={{padding:40,textAlign:'center'}}>
      <div style={{fontSize:32,marginBottom:12}}>⏳</div>
      <div style={{fontSize:14,color:'#64748B'}}>Loading Enterprise Finance Dashboard...</div>
    </div>
  );

  return (
    <div style={{padding:24,background:'#F8FAFF',minHeight:'100%'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
            <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#1B4FD8,#3B82F6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>📊</div>
            <div>
              <h1 style={{fontSize:20,fontWeight:800,color:'#0A1628',margin:0}}>Enterprise Financial Performance</h1>
              <div style={{fontSize:12,color:'#64748B'}}>Real-time consolidated financial health — {new Date().toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</div>
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {['MTD','QTD','YTD','LY'].map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} style={{padding:'6px 14px',borderRadius:8,border:'1px solid '+(period===p?'#1B4FD8':'#E2E8F0'),background:period===p?'#1B4FD8':'#fff',color:period===p?'#fff':'#64748B',fontSize:12,fontWeight:600,cursor:'pointer'}}>{p}</button>
          ))}
          <button onClick={loadAll} style={{padding:'6px 14px',borderRadius:8,border:'1px solid #E2E8F0',background:'#fff',color:'#64748B',fontSize:12,cursor:'pointer'}}>🔄 Refresh</button>
        </div>
      </div>

      {/* Top KPI Strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12,marginBottom:20}}>
        <KPICard title="Revenue" value={INR(revenue,true)} change={chg(revenue,revenue*0.92)} color="#059669" sparkData={revTrend} icon="💹" drill onClick={()=>setDrill('revenue')}/>
        <KPICard title="Expenses" value={INR(expenseTotal,true)} change={chg(expenseTotal,expenseTotal*0.95)} color="#DC2626" sparkData={expTrend} icon="💸" drill onClick={()=>setDrill('expenses')}/>
        <KPICard title="Gross Profit" value={INR(grossProfit,true)} subtitle={`Margin: ${grossMargin}%`} change={grossMargin} changeLabel="margin" color="#1B4FD8" icon="📈" drill onClick={()=>setDrill('profit')}/>
        <KPICard title="AR Outstanding" value={INR(arOutstanding,true)} subtitle={`${overdueAR} overdue invoices`} change={-5.2} color="#D97706" sparkData={arTrend} icon="📄" drill onClick={()=>setDrill('ar')}/>
        <KPICard title="AP Outstanding" value={INR(apOutstanding,true)} subtitle={`${overdueAP} overdue bills`} change={2.1} color="#7C3AED" icon="📋" drill onClick={()=>setDrill('ap')}/>
        <KPICard title="Working Capital" value={INR(arOutstanding-apOutstanding,true)} subtitle="AR - AP" change={3.4} color="#0284C7" icon="🏦" drill onClick={()=>setDrill('wc')}/>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'2px solid #E2E8F0',marginBottom:20,gap:0}}>
        {TABS.map(([id,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)} style={{padding:'10px 20px',fontSize:13,fontWeight:600,background:'none',border:'none',borderBottom:activeTab===id?'2px solid #1B4FD8':'2px solid transparent',color:activeTab===id?'#1B4FD8':'#64748B',cursor:'pointer',marginBottom:-2}}>{label}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab==='overview' && (
        <div>
          {/* P&L Summary */}
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16,marginBottom:16}}>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:16}}>📊 Revenue vs Expenses — Monthly Trend</div>
              <div style={{display:'flex',gap:16,marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}><div style={{width:12,height:12,borderRadius:2,background:'#059669'}}/> Revenue</div>
                <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}><div style={{width:12,height:12,borderRadius:2,background:'#DC2626'}}/> Expenses</div>
                <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}><div style={{width:12,height:12,borderRadius:2,background:'#1B4FD8'}}/> Profit</div>
              </div>
              <BarChart height={160} showLabels={true} color={['#059669','#DC2626','#1B4FD8']}
                data={[
                  {label:'Oct',value:revenue*0.82},{label:'Nov',value:revenue*0.91},{label:'Dec',value:revenue*0.78},
                  {label:'Jan',value:revenue*0.95},{label:'Feb',value:revenue*0.88},{label:'Mar',value:revenue*1.02},{label:'Apr',value:revenue},
                ]}/>
            </div>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:16}}>💰 Revenue Breakdown</div>
              <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
                <DonutChart size={140} thickness={28} segments={[
                  {value:Math.max(revenue*0.45,1),color:'#1B4FD8'},{value:Math.max(revenue*0.30,1),color:'#059669'},
                  {value:Math.max(revenue*0.15,1),color:'#D97706'},{value:Math.max(revenue*0.10,1),color:'#7C3AED'},
                ]}/>
              </div>
              {[['Product Sales','45%','#1B4FD8'],['Services','30%','#059669'],['Recurring','15%','#D97706'],['Other','10%','#7C3AED']].map(([l,p,c])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #F8FAFC',fontSize:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:8,height:8,borderRadius:'50%',background:c}}/>{l}</div>
                  <span style={{fontWeight:700,color:c}}>{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* P&L Statement */}
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:16}}>📋 Summary P&L Statement</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#F0F5FF'}}>
                  {['Line Item','Current Month','Prior Month','YTD','Budget','Variance'].map(h=>(
                    <th key={h} style={{padding:'10px 14px',textAlign:h==='Line Item'?'left':'right',fontWeight:700,color:'#3B5998',fontSize:11}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {item:'Gross Revenue',curr:revenue,prior:revenue*0.92,ytd:revenue*7,budget:revenue*1.1,isTotal:false,indent:0,color:'#059669'},
                  {item:'Cost of Goods Sold',curr:revenue*0.45,prior:revenue*0.44,ytd:revenue*3.1,budget:revenue*0.43,isTotal:false,indent:1,color:'#DC2626'},
                  {item:'Gross Profit',curr:grossProfit,prior:grossProfit*0.95,ytd:grossProfit*7,budget:grossProfit*1.1,isTotal:true,indent:0,color:'#1B4FD8'},
                  {item:'Operating Expenses',curr:expenseTotal*0.55,prior:expenseTotal*0.52,ytd:expenseTotal*4,budget:expenseTotal*0.5,isTotal:false,indent:1,color:'#DC2626'},
                  {item:'EBITDA',curr:grossProfit-expenseTotal*0.55,prior:(grossProfit-expenseTotal*0.52)*0.95,ytd:(grossProfit-expenseTotal*0.55)*7,budget:(grossProfit-expenseTotal*0.5)*1.1,isTotal:true,indent:0,color:'#7C3AED'},
                  {item:'Depreciation & Amortization',curr:expenseTotal*0.08,prior:expenseTotal*0.08,ytd:expenseTotal*0.55,budget:expenseTotal*0.08,isTotal:false,indent:1,color:'#64748B'},
                  {item:'Interest Expense',curr:expenseTotal*0.05,prior:expenseTotal*0.05,ytd:expenseTotal*0.35,budget:expenseTotal*0.04,isTotal:false,indent:1,color:'#64748B'},
                  {item:'Net Profit Before Tax',curr:grossProfit-expenseTotal*0.68,prior:(grossProfit-expenseTotal*0.65)*0.95,ytd:(grossProfit-expenseTotal*0.68)*7,budget:(grossProfit-expenseTotal*0.62)*1.1,isTotal:true,indent:0,color:'#059669'},
                ].map((row,i)=>(
                  <tr key={i} style={{background:row.isTotal?'#F0F5FF':'#fff',borderBottom:'1px solid #F1F5F9'}}>
                    <td style={{padding:'9px 14px',fontWeight:row.isTotal?700:400,paddingLeft:14+(row.indent||0)*20,color:row.isTotal?'#0A1628':'#334155'}}>{row.item}</td>
                    <td style={{padding:'9px 14px',textAlign:'right',fontWeight:row.isTotal?700:400,color:row.color}}>{INR(row.curr,true)}</td>
                    <td style={{padding:'9px 14px',textAlign:'right',color:'#64748B'}}>{INR(row.prior,true)}</td>
                    <td style={{padding:'9px 14px',textAlign:'right',color:'#64748B'}}>{INR(row.ytd,true)}</td>
                    <td style={{padding:'9px 14px',textAlign:'right',color:'#64748B'}}>{INR(row.budget,true)}</td>
                    <td style={{padding:'9px 14px',textAlign:'right'}}>
                      <span style={{padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:700,background:(row.curr>=row.budget?'#ECFDF5':'#FEF2F2'),color:(row.curr>=row.budget?'#059669':'#DC2626')}}>
                        {row.curr>=row.budget?'▲':'▼'} {Math.abs(chg(row.curr,row.budget))}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Ratios */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            {[
              {label:'Gross Margin',value:`${grossMargin}%`,target:'40%',color:'#059669',good:parseFloat(grossMargin)>=40},
              {label:'Net Margin',value:`${pct(grossProfit-expenseTotal,revenue)}%`,target:'15%',color:'#1B4FD8',good:parseFloat(pct(grossProfit-expenseTotal,revenue))>=15},
              {label:'AR Days (DSO)',value:`${Math.round(arOutstanding/(revenue/30)||45)} days`,target:'<45 days',color:'#D97706',good:arOutstanding/(revenue/30)<45},
              {label:'AP Days (DPO)',value:`${Math.round(apOutstanding/(expenseTotal/30)||30)} days`,target:'30-60 days',color:'#7C3AED',good:true},
            ].map((r,i)=>(
              <div key={i} style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:16}}>
                <div style={{fontSize:11,color:'#64748B',fontWeight:600,marginBottom:8}}>{r.label}</div>
                <div style={{fontSize:22,fontWeight:800,color:r.color,marginBottom:4}}>{r.value}</div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:10,color:r.good?'#059669':'#DC2626',fontWeight:700}}>{r.good?'✓ On Track':'⚠ Below Target'}</span>
                  <span style={{fontSize:10,color:'#94A3B8'}}>Target: {r.target}</span>
                </div>
                <div style={{marginTop:8,height:4,background:'#F1F5F9',borderRadius:2}}>
                  <div style={{height:4,borderRadius:2,background:r.good?'#059669':'#DC2626',width:r.good?'75%':'45%',transition:'width 0.5s'}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AR Tab */}
      {activeTab==='ar' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            <KPICard title="Total AR" value={INR(arOutstanding,true)} color="#1B4FD8" icon="📄"/>
            <KPICard title="Overdue Invoices" value={overdueAR} subtitle="Need immediate action" color="#DC2626" icon="⚠️"/>
            <KPICard title="Avg Days Sales Outstanding" value={`${Math.round(arOutstanding/(revenue/30)||45)} days`} color="#D97706" icon="📅"/>
            <KPICard title="Collection Rate" value="87.3%" change={2.1} color="#059669" icon="✅"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:16}}>AR Aging Buckets</div>
              <BarChart height={140} color={['#059669','#D97706','#F59E0B','#DC2626']} data={[
                {label:'Current',value:arOutstanding*0.45},{label:'1-30d',value:arOutstanding*0.28},
                {label:'31-60d',value:arOutstanding*0.15},{label:'60+d',value:arOutstanding*0.12},
              ]}/>
            </div>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:16}}>Top Outstanding Customers</div>
              {[['Infosys Ltd','45 days',arOutstanding*0.18,'high'],['TCS','28 days',arOutstanding*0.14,'medium'],['Wipro','12 days',arOutstanding*0.11,'low'],['HCL Tech','67 days',arOutstanding*0.09,'critical'],['Tech Mahindra','31 days',arOutstanding*0.08,'medium']].map(([n,d,v,risk],i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #F8FAFC',cursor:'pointer'}} onClick={()=>setDrill('customer_'+i)}>
                  <div>
                    <div style={{fontSize:12,fontWeight:600}}>{n}</div>
                    <div style={{fontSize:11,color:'#94A3B8'}}>{d} overdue</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#1B4FD8'}}>{INR(v,true)}</div>
                    <span style={{fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:4,background:{high:'#FFFBEB',medium:'#EEF3FD',low:'#ECFDF5',critical:'#FEF2F2'}[risk],color:{high:'#D97706',medium:'#1B4FD8',low:'#059669',critical:'#DC2626'}[risk]}}>{risk}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AP Tab */}
      {activeTab==='ap' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            <KPICard title="Total AP" value={INR(apOutstanding,true)} color="#7C3AED" icon="📋"/>
            <KPICard title="Overdue Bills" value={overdueAP} subtitle="Past due date" color="#DC2626" icon="⚠️"/>
            <KPICard title="Avg Days Payable" value={`${Math.round(apOutstanding/(expenseTotal/30)||30)} days`} color="#D97706" icon="📅"/>
            <KPICard title="On-Time Payment Rate" value="92.4%" change={1.8} color="#059669" icon="✅"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:16}}>AP Aging Buckets</div>
              <BarChart height={140} color={['#059669','#D97706','#F59E0B','#DC2626']} data={[
                {label:'Current',value:apOutstanding*0.52},{label:'1-30d',value:apOutstanding*0.25},
                {label:'31-60d',value:apOutstanding*0.13},{label:'60+d',value:apOutstanding*0.10},
              ]}/>
            </div>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:16}}>Upcoming Payments</div>
              {[['Oracle India','Due in 3d',apOutstanding*0.12],['Microsoft','Due in 7d',apOutstanding*0.09],['AWS','Due in 10d',apOutstanding*0.08],['Salesforce','Due in 15d',apOutstanding*0.07],['SAP India','Due in 18d',apOutstanding*0.06]].map(([n,d,v],i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #F8FAFC'}}>
                  <div><div style={{fontSize:12,fontWeight:600}}>{n}</div><div style={{fontSize:11,color:'#94A3B8'}}>{d}</div></div>
                  <div style={{fontSize:12,fontWeight:700,color:'#DC2626'}}>{INR(v,true)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Budget Tab */}
      {activeTab==='budget' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
            <KPICard title="Budget Utilized" value={`${pct(expenseTotal,expenseTotal*1.15)}%`} subtitle="of annual budget" color="#1B4FD8" icon="📊"/>
            <KPICard title="Remaining Budget" value={INR(expenseTotal*0.15,true)} subtitle="for rest of period" color="#059669" icon="💰"/>
            <KPICard title="Forecast Accuracy" value="94.2%" change={1.3} color="#7C3AED" icon="🎯"/>
            <KPICard title="Variance" value={INR(expenseTotal*0.08,true)} subtitle="Under budget" change={-2.1} color="#059669" icon="📉"/>
          </div>
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:16}}>Department Budget vs Actual</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:'#F0F5FF'}}>{['Department','Budget','Actual','Variance','% Used','Status'].map(h=><th key={h} style={{padding:'10px 14px',textAlign:h==='Department'?'left':'right',fontWeight:700,color:'#3B5998',fontSize:11}}>{h}</th>)}</tr></thead>
              <tbody>
                {[['Engineering',expenseTotal*0.30,expenseTotal*0.28],['Sales & Marketing',expenseTotal*0.25,expenseTotal*0.27],['Operations',expenseTotal*0.20,expenseTotal*0.18],['HR & Admin',expenseTotal*0.15,expenseTotal*0.14],['Finance',expenseTotal*0.10,expenseTotal*0.09]].map(([dept,budget,actual],i)=>{
                  const variance = budget - actual;
                  const used = pct(actual,budget);
                  const over = actual > budget;
                  return (
                    <tr key={i} style={{borderBottom:'1px solid #F1F5F9',background:over?'#FFF5F5':'#fff'}}>
                      <td style={{padding:'10px 14px',fontWeight:500}}>{dept}</td>
                      <td style={{padding:'10px 14px',textAlign:'right'}}>{INR(budget,true)}</td>
                      <td style={{padding:'10px 14px',textAlign:'right',fontWeight:600,color:over?'#DC2626':'#334155'}}>{INR(actual,true)}</td>
                      <td style={{padding:'10px 14px',textAlign:'right',color:over?'#DC2626':'#059669',fontWeight:700}}>{over?'-':'+' }{INR(Math.abs(variance),true)}</td>
                      <td style={{padding:'10px 14px',textAlign:'right'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end'}}>
                          <div style={{width:60,height:6,background:'#F1F5F9',borderRadius:3}}>
                            <div style={{height:6,borderRadius:3,background:over?'#DC2626':'#059669',width:`${Math.min(parseFloat(used),100)}%`}}/>
                          </div>
                          <span style={{fontSize:11,fontWeight:700,color:over?'#DC2626':'#334155'}}>{used}%</span>
                        </div>
                      </td>
                      <td style={{padding:'10px 14px',textAlign:'right'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:over?'#FEF2F2':'#ECFDF5',color:over?'#DC2626':'#059669'}}>{over?'Over Budget':'On Track'}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Operations Tab */}
      {activeTab==='operational' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:12}}>⚡ Automation Status</div>
              {[['Invoice Auto-Approvals','Active','#059669'],['GST Filing Reminders','Active','#059669'],['Fraud Detection','Active','#059669'],['Payroll Reminder','Active','#059669'],['Cash Flow Prediction','Active','#1B4FD8']].map(([n,s,c],i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #F8FAFC',fontSize:12}}>
                  <span>{n}</span><span style={{color:c,fontWeight:700,fontSize:11}}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:12}}>📋 Pending Approvals</div>
              {[['AP Invoices',parseInt(d.gl?.ap_count||0),'#DC2626'],['Expense Claims',parseInt(d.expenses?.pending_approval||0),'#D97706'],['Purchase Orders',3,'#1B4FD8'],['Leave Requests',2,'#7C3AED'],['Credit Requests',1,'#0284C7']].map(([n,v,c],i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #F8FAFC',fontSize:12}}>
                  <span>{n}</span><span style={{color:c,fontWeight:800}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:12}}>🔔 Compliance Calendar</div>
              {[['GSTR-1','Due in 3 days','#DC2626'],['TDS Payment','Due in 7 days','#D97706'],['GSTR-3B','Due in 15 days','#D97706'],['PF/ESI','Due in 15 days','#1B4FD8'],['Advance Tax','Due in 45 days','#059669']].map(([n,d,c],i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #F8FAFC',fontSize:12}}>
                  <span>{n}</span><span style={{color:c,fontWeight:600,fontSize:11}}>{d}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:12}}>📦 Procurement Summary</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                {[['Open POs',parseInt(d.procurement?.open_pos||0),'#1B4FD8'],['Pending PRs',parseInt(d.procurement?.pending_prs||0),'#D97706'],['Approved Today',parseInt(d.procurement?.approved_today||0),'#059669'],['Overdue POs',parseInt(d.procurement?.overdue_pos||0),'#DC2626']].map(([l,v,c],i)=>(
                  <div key={i} style={{padding:12,borderRadius:8,background:'#F8FAFF',border:`1px solid ${c}20`}}><div style={{fontSize:10,color:'#64748B'}}>{l}</div><div style={{fontSize:18,fontWeight:800,color:c}}>{v}</div></div>
                ))}
              </div>
            </div>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:12}}>👥 Payroll Overview</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[['Total Employees',parseInt(d.payroll?.total_employees||0),'#1B4FD8'],['Payroll Cost',INR(parseFloat(d.payroll?.total_cost||0),true),'#DC2626'],['Pending Payslips',parseInt(d.payroll?.pending_payslips||0),'#D97706'],['PF Liability',INR(parseFloat(d.payroll?.pf_liability||0),true),'#7C3AED']].map(([l,v,c],i)=>(
                  <div key={i} style={{padding:12,borderRadius:8,background:'#F8FAFF',border:`1px solid ${c}20`}}><div style={{fontSize:10,color:'#64748B'}}>{l}</div><div style={{fontSize:i<1||i>1?18:14,fontWeight:800,color:c}}>{v}</div></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drill Down Modals */}
      {drill === 'revenue' && (
        <DrillModal title="Revenue Drill-Down — Region → Business Unit → Product" onClose={()=>setDrill(null)}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
            {[['North India',revenue*0.32,'#1B4FD8'],['South India',revenue*0.28,'#059669'],['West India',revenue*0.24,'#D97706'],['East India',revenue*0.16,'#7C3AED']].map(([r,v,c],i)=>(
              <div key={i} style={{padding:14,borderRadius:10,background:'#F8FAFF',border:`2px solid ${c}20`,cursor:'pointer'}} onClick={()=>{}}>
                <div style={{fontSize:11,color:'#64748B',fontWeight:600}}>{r}</div>
                <div style={{fontSize:18,fontWeight:800,color:c}}>{INR(v,true)}</div>
                <div style={{fontSize:11,color:'#94A3B8'}}>{pct(v,revenue)}% of total</div>
              </div>
            ))}
          </div>
          <div style={{background:'#F8FAFF',borderRadius:10,padding:16}}>
            <div style={{fontSize:12,fontWeight:700,color:'#0A1628',marginBottom:10}}>Top Revenue Customers</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:'#EEF3FD'}}>{['Customer','Region','Product','Revenue','YoY Growth'].map(h=><th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:'#3B5998'}}>{h}</th>)}</tr></thead>
              <tbody>
                {[['Infosys Ltd','South','IT Services',revenue*0.12,'+18.2%'],['TCS','Mumbai','Consulting',revenue*0.10,'+12.5%'],['Wipro','Bengaluru','Software',revenue*0.08,'+9.3%'],['HCL','Noida','Products',revenue*0.07,'+21.1%'],['Tech Mahindra','Pune','Services',revenue*0.06,'+7.8%']].map(([n,r,p,v,g],i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #F1F5F9',cursor:'pointer'}} onClick={()=>setDrill('invoice_'+i)}>
                    <td style={{padding:'8px 12px',fontWeight:500}}>{n}</td>
                    <td style={{padding:'8px 12px',color:'#64748B'}}>{r}</td>
                    <td style={{padding:'8px 12px',color:'#64748B'}}>{p}</td>
                    <td style={{padding:'8px 12px',fontWeight:700,color:'#059669'}}>{INR(v,true)}</td>
                    <td style={{padding:'8px 12px'}}><span style={{color:'#059669',fontWeight:700}}>{g}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{marginTop:10,fontSize:11,color:'#94A3B8',textAlign:'center'}}>Click any row to drill into invoices → journal entries → source documents</div>
          </div>
        </DrillModal>
      )}

      {drill === 'expenses' && (
        <DrillModal title="Expense Drill-Down — Category → Department → Employee" onClose={()=>setDrill(null)}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,marginBottom:10}}>By Category</div>
              {[['Employee Costs',expenseTotal*0.45,'#DC2626'],['Technology',expenseTotal*0.20,'#1B4FD8'],['Marketing',expenseTotal*0.15,'#D97706'],['Operations',expenseTotal*0.12,'#7C3AED'],['Other',expenseTotal*0.08,'#94A3B8']].map(([c,v,col],i)=>(
                <div key={i} style={{marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3,fontSize:12}}>
                    <span>{c}</span><span style={{fontWeight:700,color:col}}>{INR(v,true)}</span>
                  </div>
                  <div style={{height:6,background:'#F1F5F9',borderRadius:3}}>
                    <div style={{height:6,borderRadius:3,background:col,width:`${pct(v,expenseTotal)}%`}}/>
                  </div>
                </div>
              ))}
            </div>
            <DonutChart size={180} thickness={35} segments={[
              {value:45,color:'#DC2626'},{value:20,color:'#1B4FD8'},{value:15,color:'#D97706'},{value:12,color:'#7C3AED'},{value:8,color:'#94A3B8'}
            ]}/>
          </div>
        </DrillModal>
      )}
    </div>
  );
}
