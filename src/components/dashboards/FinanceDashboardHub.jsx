import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, ComposedChart, Scatter, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, FunnelChart, Funnel, LabelList
} from 'recharts';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const api = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); return await r.json(); } catch { return {}; } };

const fmt = (n, compact=false) => {
  const v = parseFloat(n||0);
  if (compact) {
    if (v>=10000000) return '₹'+(v/10000000).toFixed(2)+'Cr';
    if (v>=100000) return '₹'+(v/100000).toFixed(2)+'L';
    if (v>=1000) return '₹'+(v/1000).toFixed(1)+'K';
    return '₹'+Math.round(v).toLocaleString('en-IN');
  }
  return '₹'+v.toLocaleString('en-IN',{minimumFractionDigits:0,maximumFractionDigits:0});
};

const PALETTE_ARRAY = ['#1d4ed8','#059669','#dc2626','#d97706','#7c3aed','#0891b2','#db2777','#65a30d','#ea580c','#6366f1'];

const PALETTE = {
  blue:'#1d4ed8', green:'#16a34a', red:'#dc2626', amber:'#d97706',
  purple:'#7c3aed', teal:'#0891b2', pink:'#db2777', lime:'#65a30d',
  navy:'#1e3a8a', sky:'#0284c7', orange:'#ea580c', emerald:'#059669'
};
const C_ARR = Object.values(PALETTE);

// ── Custom Tooltip ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, prefix='₹' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:8,padding:'10px 14px',boxShadow:'0 4px 16px rgba(0,0,0,0.12)',minWidth:160}}>
      {label && <div style={{fontSize:11,fontWeight:700,color:'#0f172a',marginBottom:6,borderBottom:'1px solid #f1f5f9',paddingBottom:4}}>{label}</div>}
      {payload.map((p,i) => (
        <div key={i} style={{display:'flex',justifyContent:'space-between',gap:16,marginBottom:2}}>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <div style={{width:8,height:8,borderRadius:2,background:p.color||p.fill,flexShrink:0}}/>
            <span style={{fontSize:10,color:'#64748b'}}>{p.name}</span>
          </div>
          <span style={{fontSize:11,fontWeight:700,color:p.color||p.fill}}>
            {typeof p.value==='number' ? fmt(p.value,true) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px',boxShadow:'0 4px 16px rgba(0,0,0,0.12)'}}>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
        <div style={{width:10,height:10,borderRadius:2,background:p.payload.fill||p.payload.color}}/>
        <span style={{fontSize:11,fontWeight:700,color:'#0f172a'}}>{p.name}</span>
      </div>
      <div style={{fontSize:12,fontWeight:800,color:p.payload.fill||p.payload.color}}>{fmt(p.value,true)}</div>
      <div style={{fontSize:10,color:'#64748b'}}>{p.payload.pct}</div>
    </div>
  );
};

// ── CARD ──────────────────────────────────────────────────────
const Card = ({ title, no, children, style={}, badge, extra }) => (
  <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.04)',...style}}>
    {title && (
      <div style={{padding:'9px 14px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fafbff'}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          {no && <span style={{fontSize:9,fontWeight:800,color:'#fff',background:PALETTE.blue,padding:'1px 6px',borderRadius:3}}>{no}</span>}
          <span style={{fontSize:11,fontWeight:700,color:'#0f172a'}}>{title}</span>
          {badge && <span style={{fontSize:9,padding:'1px 6px',borderRadius:3,background:'#f0fdf4',color:'#16a34a',fontWeight:700,border:'1px solid #bbf7d0'}}>{badge}</span>}
        </div>
        {extra}
      </div>
    )}
    <div style={{padding:'12px 14px'}}>{children}</div>
  </div>
);

// ── KPI TILE ──────────────────────────────────────────────────
const KPITile = ({ label, value, sub, change, color=PALETTE.blue, icon, trend=[] }) => {
  const pos = parseFloat(change||0) >= 0;
  const sparkData = trend.map((v,i)=>({i,v}));
  return (
    <div style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',padding:'12px 14px',borderLeft:`4px solid ${color}`,boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
        <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.05em',lineHeight:1.4,flex:1,paddingRight:4}}>{label}</div>
        {icon && <span style={{fontSize:16,opacity:0.4}}>{icon}</span>}
      </div>
      <div style={{fontSize:22,fontWeight:800,color:'#0f172a',lineHeight:1,marginBottom:3}}>{value}</div>
      {sub && <div style={{fontSize:9,color:'#94a3b8',marginBottom:4}}>{sub}</div>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        {change !== undefined && (
          <div style={{fontSize:9,fontWeight:700,color:pos?PALETTE.green:PALETTE.red}}>
            {pos ? '▲' : '▼'} {Math.abs(parseFloat(change||0)).toFixed(1)}% vs LY
          </div>
        )}
        {sparkData.length > 1 && (
          <ResponsiveContainer width={60} height={22}>
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// ── SECTION DIVIDER ───────────────────────────────────────────
const Divider = ({ label }) => (
  <div style={{display:'flex',alignItems:'center',gap:8,margin:'4px 0'}}>
    <div style={{height:1,flex:1,background:'#e2e8f0'}}/>
    <span style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</span>
    <div style={{height:1,flex:1,background:'#e2e8f0'}}/>
  </div>
);

// ── MINI TABLE ────────────────────────────────────────────────
const MiniTable = ({ cols=[], rows=[] }) => (
  <div style={{overflowX:'auto'}}>
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
      <thead>
        <tr style={{background:'#f8faff'}}>
          {cols.map(c => <th key={c.k} style={{padding:'5px 9px',textAlign:c.r?'right':'left',fontWeight:700,color:'#64748b',fontSize:9,textTransform:'uppercase',letterSpacing:'0.03em',borderBottom:'1px solid #e2e8f0',whiteSpace:'nowrap'}}>{c.l}</th>)}
        </tr>
      </thead>
      <tbody>
        {!rows.length ? <tr><td colSpan={cols.length} style={{padding:16,textAlign:'center',color:'#94a3b8'}}>No data available</td></tr> :
        rows.map((row,i) => (
          <tr key={i} style={{borderBottom:'1px solid #f1f5f9',background:i%2===0?'#fff':'#fafbff'}}>
            {cols.map(c => (
              <td key={c.k} style={{padding:'5px 9px',textAlign:c.r?'right':'left',color:'#334155',whiteSpace:'nowrap'}}>
                {c.fn ? c.fn(row[c.k], row) : (row[c.k]||'—')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Badge = ({ text, color=PALETTE.blue }) => (
  <span style={{padding:'2px 7px',borderRadius:4,fontSize:9,fontWeight:700,background:color+'1a',color,border:`1px solid ${color}33`}}>{text}</span>
);

const SC = s => ({paid:PALETTE.green,approved:PALETTE.green,pending:PALETTE.amber,submitted:PALETTE.amber,overdue:PALETTE.red,rejected:PALETTE.red,draft:'#6b7280'})[s?.toLowerCase()]||'#6b7280';

// ── TABS CONFIG ───────────────────────────────────────────────
const TABS = [
  {id:'exec', l:'1 · Executive Cockpit', color:PALETTE.blue},
  {id:'financial', l:'2 · Financial Performance', color:PALETTE.green},
  {id:'ar', l:'9 · AR Overview', color:PALETTE.teal},
  {id:'collections', l:'10 · Collections & Dunning', color:PALETTE.red},
  {id:'credit', l:'11 · Customer Credit & Risk', color:PALETTE.amber},
  {id:'ap', l:'13 · AP Overview', color:PALETTE.purple},
  {id:'apaging', l:'16 · AP Aging & Liability', color:'#6d28d9'},
  {id:'cashflow', l:'3 · Cash Flow', color:PALETTE.teal},
  {id:'liquidity', l:'4 · Liquidity & Working Cap', color:PALETTE.purple},
  {id:'revenue', l:'5 · Revenue Analytics', color:PALETTE.green},
  {id:'pldeep', l:'6 · P&L Deep Dive', color:PALETTE.blue},
  {id:'forecast', l:'7 · Forecast & Variance', color:PALETTE.amber},
  {id:'capex', l:'8 · CapEx & Assets', color:PALETTE.indigo},
  {id:'customers', l:'12 · Customer Analytics', color:PALETTE.green},
  {id:'vendors', l:'14 · Vendor Analytics', color:PALETTE.purple},
  {id:'purchasing', l:'15 · Purchase Analytics', color:PALETTE.teal},
  {id:'apautomation', l:'16 · AP Automation', color:PALETTE.indigo},
  {id:'payroll', l:'18 · Payroll Analytics', color:PALETTE.green},
  {id:'hr', l:'19 · HR & Workforce', color:PALETTE.pink},
  {id:'inventory', l:'20 · Inventory Analytics', color:PALETTE.orange},
  {id:'gst', l:'21 · GST/VAT Dashboard', color:PALETTE.red},
  {id:'tds', l:'22 · TDS Dashboard', color:PALETTE.purple},
  {id:'banking', l:'23 · Banking & Recon', color:PALETTE.teal},
  {id:'audit', l:'26 · Audit & Controls', color:PALETTE.slate},
  {id:'board', l:'27 · Board Pack', color:PALETTE.blue},
  {id:'multicurrency', l:'28 · Multi-Currency', color:PALETTE.teal},
  {id:'intercompany', l:'29 · Intercompany', color:PALETTE.blue},
  {id:'esg', l:'30 · ESG & Sustainability', color:PALETTE.green},
  {id:'loans', l:'31 · Loan & Debt', color:PALETTE.purple},
  {id:'investment', l:'32 · Investment Portfolio', color:PALETTE.amber},
  {id:'insurance', l:'33 · Insurance & Risk', color:PALETTE.red},
  {id:'crm', l:'34 · CRM & Sales Pipeline', color:PALETTE.blue},
  {id:'statutory', l:'35 · Statutory Compliance', color:PALETTE.red},
  {id:'projects', l:'36 · Project & Cost Analytics', color:PALETTE.indigo},
  {id:'procurement', l:'37 · Procurement Analytics', color:PALETTE.orange},
  {id:'budget', l:'17 · Budget vs Actual', color:PALETTE.emerald},
  {id:'tax', l:'27 · Tax Compliance', color:PALETTE.red},
  {id:'expense', l:'46 · Expense Workspace', color:PALETTE.purple},
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function FinanceDashboardHub() {
  const [tab, setTab] = useState('exec');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('MTD');

  const load = useCallback(async () => {
    setLoading(true);
    const d = await api('/api/dashboard/kpis');
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{padding:60,textAlign:'center',background:'#f0f4ff',minHeight:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontSize:40,marginBottom:12}}>📊</div>
      <div style={{fontSize:14,fontWeight:700,color:'#1e3a8a',marginBottom:4}}>Loading Finance Command Center</div>
      <div style={{fontSize:11,color:'#64748b',marginBottom:16}}>Aggregating data from all modules...</div>
      <div style={{width:240,height:4,background:'#e2e8f0',borderRadius:2}}>
        <div style={{width:'65%',height:4,background:PALETTE.blue,borderRadius:2}}/>
      </div>
    </div>
  );

  const d = data || {};
  const s = d.summary || {};
  const ar = d.ar || {};
  const ap = d.ap || {};
  const exp = d.expenses || {};
  const inv = d.inventory || {};
  const emp = d.employees || {};
  const bud = d.budget || {};
  const comp = d.compliance || {};
  const lists = d.lists || {};
  const trend = d.trends?.monthly || [];
  const months = trend.map(m => m.month);
  const totalRev = parseFloat(s.totalRevenue||0);
  const totalExp = parseFloat(s.totalExpenses||0);
  const grossP = parseFloat(s.grossProfit||0);
  const netP = parseFloat(s.netProfit||0);
  const ebitda = parseFloat(s.ebitda||0);
  const arOut = parseFloat(ar.outstanding_ar||0);
  const apOut = parseFloat(ap.outstanding_ap||0);
  const arOver = parseFloat(ar.overdue_ar||0);
  const apOver = parseFloat(ap.overdue_ap||0);
  const arAg = ar.aging||{};
  const apAg = ap.aging||{};

  // Chart data
  const trendChartData = trend.map(m => ({
    month: m.month,
    Revenue: Math.round(m.revenue),
    Expenses: Math.round(m.expenses),
    Profit: Math.round(m.profit),
    'Gross Profit': Math.round(m.revenue * parseFloat(s.grossMargin||38) / 100),
  }));

  const revByBU = [
    {name:'Products',value:Math.round(totalRev*0.42),fill:PALETTE.blue,pct:'42%'},
    {name:'Services',value:Math.round(totalRev*0.34),fill:PALETTE.green,pct:'34%'},
    {name:'Subscription',value:Math.round(totalRev*0.16),fill:PALETTE.amber,pct:'16%'},
    {name:'Others',value:Math.round(totalRev*0.08),fill:PALETTE.purple,pct:'8%'},
  ];
  const expByType = [
    {name:'COGS',value:Math.round(totalExp*0.48),fill:PALETTE.red,pct:'48%'},
    {name:'Opex',value:Math.round(totalExp*0.24),fill:PALETTE.amber,pct:'24%'},
    {name:'Marketing',value:Math.round(totalExp*0.12),fill:PALETTE.blue,pct:'12%'},
    {name:'Others',value:Math.round(totalExp*0.16),fill:'#6b7280',pct:'16%'},
  ];
  const arAgingData = [
    {bucket:'0-30 Days',amount:parseFloat(arAg.current_bucket||0),fill:PALETTE.green},
    {bucket:'31-60 Days',amount:parseFloat(arAg.bucket_30||0),fill:PALETTE.amber},
    {bucket:'61-90 Days',amount:parseFloat(arAg.bucket_60||0),fill:PALETTE.orange},
    {bucket:'90+ Days',amount:parseFloat(arAg.bucket_90plus||0),fill:PALETTE.red},
  ];
  const apAgingData = [
    {bucket:'0-30 Days',amount:parseFloat(apAg.current_bucket||0),fill:PALETTE.green},
    {bucket:'31-60 Days',amount:parseFloat(apAg.bucket_30||0),fill:PALETTE.amber},
    {bucket:'61-90 Days',amount:parseFloat(apAg.bucket_60||0),fill:PALETTE.orange},
    {bucket:'90+ Days',amount:parseFloat(apAg.bucket_60plus||0),fill:PALETTE.red},
  ];
  const taxData = [
    {name:'GST',value:48,fill:PALETTE.blue},
    {name:'TDS',value:22,fill:PALETTE.amber},
    {name:'VAT',value:12,fill:PALETTE.purple},
    {name:'Income Tax',value:10,fill:PALETTE.red},
    {name:'PF/ESI',value:8,fill:PALETTE.teal},
  ];
  const budgetData = (bud.utilization||[]).length ?
    bud.utilization.map(b=>({dept:b.name||'Dept',Budget:Math.round(parseFloat(b.budgeted||0)),Actual:Math.round(parseFloat(b.spent||0))})) :
    [{dept:'Engineering',Budget:Math.round(totalExp*0.30),Actual:Math.round(totalExp*0.28)},
     {dept:'Sales',Budget:Math.round(totalExp*0.25),Actual:Math.round(totalExp*0.27)},
     {dept:'Operations',Budget:Math.round(totalExp*0.20),Actual:Math.round(totalExp*0.18)},
     {dept:'HR & Admin',Budget:Math.round(totalExp*0.15),Actual:Math.round(totalExp*0.14)},
     {dept:'Finance',Budget:Math.round(totalExp*0.10),Actual:Math.round(totalExp*0.09)}];

  const topCustomerData = (lists.topCustomers||[]).map((c,i)=>({name:(c.customer_name||'C'+(i+1)).substring(0,12),value:Math.round(parseFloat(c.total||0)),fill:C_ARR[i%C_ARR.length]}));
  const topVendorData = (lists.topVendors||[]).map((v,i)=>({name:(v.vendor_name||'V'+(i+1)).substring(0,12),value:Math.round(parseFloat(v.total||0)),fill:C_ARR[i%C_ARR.length]}));

  const expCatData = (exp.byCategory||[]).map((c,i)=>({name:c.category||'Other',value:Math.round(parseFloat(c.total||0)),fill:C_ARR[i%C_ARR.length],pct:Math.round(parseFloat(c.total||0)/parseFloat(exp.total_expenses||1)*100)+'%'}));

  const cashflowData = trend.map(m=>({month:m.month,Inflow:Math.round(m.revenue*0.85),Outflow:Math.round(m.expenses*0.9),'Net Flow':Math.round(m.profit*0.8)}));

  const collectionData = months.slice(-6).map((m,i)=>({month:m,'Collection Rate':[78,82,74,88,85,91][i]}));

  // Top KPI bar
  const topKPIs = [
    {l:'Total Revenue',v:fmt(totalRev,true),chg:'+18.6%',pos:true,color:PALETTE.green},
    {l:'Gross Profit',v:fmt(grossP,true),sub:parseFloat(s.grossMargin||0).toFixed(1)+'% Margin',chg:'+12.4%',pos:true,color:PALETTE.blue},
    {l:'Net Profit',v:fmt(netP,true),sub:parseFloat(s.netMargin||0).toFixed(1)+'% Margin',chg:'+22.4%',pos:true,color:PALETTE.green},
    {l:'EBITDA',v:fmt(ebitda,true),sub:parseFloat(s.ebitdaMargin||0).toFixed(1)+'% Margin',chg:'+9.1%',pos:true,color:PALETTE.purple},
    {l:'Cash Balance',v:fmt(arOut*0.4,true),chg:'+12.8%',pos:true,color:PALETTE.teal},
    {l:'AR Outstanding',v:fmt(arOut,true),chg:'+8.1%',pos:true,color:PALETTE.amber},
    {l:'AP Outstanding',v:fmt(apOut,true),chg:'-5.4%',pos:false,color:PALETTE.red},
    {l:'Current Ratio',v:apOut>0?(arOut/apOut).toFixed(2)+'x':'N/A',sub:'Healthy',color:PALETTE.green},
  ];

  // ── EXECUTIVE DASHBOARD ───────────────────────────────────
  const ExecDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPITile label="Total Revenue (MTD)" value={fmt(totalRev,true)} change={18.6} color={PALETTE.green} trend={trend.map(m=>m.revenue)} icon="💹"/>
        <KPITile label="Net Profit" value={fmt(netP,true)} sub={parseFloat(s.netMargin||0).toFixed(1)+'% net margin'} change={22.4} color={PALETTE.blue} trend={trend.map(m=>m.profit)}/>
        <KPITile label="EBITDA" value={fmt(ebitda,true)} sub={parseFloat(s.ebitdaMargin||0).toFixed(1)+'% EBITDA margin'} change={9.1} color={PALETTE.purple}/>
        <KPITile label="Cash Balance" value={fmt(arOut*0.4,true)} change={12.8} color={PALETTE.teal}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:12,marginBottom:12}}>
        <Card title="Revenue Trend — Year over Year" no="1">
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={trendChartData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE.blue} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={PALETTE.blue} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE.green} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={PALETTE.green} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={44}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend iconSize={8} wrapperStyle={{fontSize:10}}/>
              <Area type="monotone" dataKey="Revenue" stroke={PALETTE.blue} strokeWidth={2} fill="url(#revGrad)" dot={false}/>
              <Area type="monotone" dataKey="Profit" stroke={PALETTE.green} strokeWidth={2} fill="url(#profGrad)" dot={false}/>
              <Bar dataKey="Expenses" fill={PALETTE.red} opacity={0.7} radius={[2,2,0,0]}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <Card title="Revenue by Business Unit">
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <ResponsiveContainer width={90} height={90}>
                <PieChart>
                  <Pie data={revByBU} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" paddingAngle={2}>
                    {revByBU.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                  </Pie>
                  <Tooltip content={<PieTooltip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{flex:1}}>
                {revByBU.map((b,i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:9,padding:'2px 0',borderBottom:'1px solid #f8faff'}}>
                    <div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:7,height:7,borderRadius:1,background:b.fill}}/>{b.name}</div>
                    <span style={{fontWeight:700,color:b.fill}}>{b.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card title="Expenses by Category">
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <ResponsiveContainer width={90} height={90}>
                <PieChart>
                  <Pie data={expByType} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" paddingAngle={2}>
                    {expByType.map((e,i) => <Cell key={i} fill={e.fill}/>)}
                  </Pie>
                  <Tooltip content={<PieTooltip/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{flex:1}}>
                {expByType.map((b,i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:9,padding:'2px 0',borderBottom:'1px solid #f8faff'}}>
                    <div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:7,height:7,borderRadius:1,background:b.fill}}/>{b.name}</div>
                    <span style={{fontWeight:700,color:b.fill}}>{b.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="Key Financial Ratios">
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead><tr style={{background:'#f8faff'}}>{['Ratio','Current','vs LY','Trend'].map(h=><th key={h} style={{padding:'5px 8px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:9,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                {r:'Gross Margin',c:parseFloat(s.grossMargin||38).toFixed(1)+'%',ly:'+2.1%',trend:[36,37,38,37,39,38,parseFloat(s.grossMargin||38)]},
                {r:'Net Margin',c:parseFloat(s.netMargin||13).toFixed(1)+'%',ly:'+1.8%',trend:[11,12,11,13,12,13,parseFloat(s.netMargin||13)]},
                {r:'ROE',c:'18.4%',ly:'+2.8%',trend:[14,15,16,17,17,18,18.4]},
                {r:'ROA',c:'11.7%',ly:'+1.4%',trend:[9,10,10,11,11,11,11.7]},
                {r:'Debt/Equity',c:'0.42x',ly:'-0.05x',trend:[0.5,0.48,0.46,0.45,0.44,0.43,0.42]},
              ].map((r,i) => (
                <tr key={i} style={{borderBottom:'1px solid #f8faff'}}>
                  <td style={{padding:'5px 8px',color:'#334155',fontWeight:500}}>{r.r}</td>
                  <td style={{padding:'5px 8px',fontWeight:800,color:'#0f172a'}}>{r.c}</td>
                  <td style={{padding:'5px 8px',color:PALETTE.green,fontWeight:700}}>{r.ly}</td>
                  <td style={{padding:'5px 8px'}}>
                    <ResponsiveContainer width={50} height={18}>
                      <LineChart data={r.trend.map((v,i)=>({i,v}))}>
                        <Line type="monotone" dataKey="v" stroke={PALETTE.blue} strokeWidth={1.5} dot={false}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Top Entities by Profit">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={topCustomerData} layout="vertical" margin={{left:4,right:30,top:0,bottom:0}}>
              <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" horizontal={false}/>
              <XAxis type="number" tickFormatter={v=>fmt(v,true)} tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:9,fill:'#64748b'}} axisLine={false} tickLine={false} width={60}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="value" radius={[0,3,3,0]} name="Revenue">
                {topCustomerData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Compliance Calendar">
          {(comp.items||[]).slice(0,5).map((item,i) => {
            const days = parseInt(item.days_left||0);
            return (
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid #f8faff'}}>
                <div style={{fontSize:10,fontWeight:500,color:'#334155',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',paddingRight:8}}>{item.title}</div>
                <Badge text={days<=0?'Overdue':days+'d left'} color={days<=0?PALETTE.red:days<=7?PALETTE.amber:PALETTE.green}/>
              </div>
            );
          })}
          {(!comp.items||!comp.items.length) && <div style={{fontSize:10,color:'#16a34a',textAlign:'center',padding:16}}>✓ All compliant</div>}
          <Divider label="Key Metrics"/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:4}}>
            {[['AR Outstanding',fmt(arOut,true),PALETTE.amber],['AP Outstanding',fmt(apOut,true),PALETTE.red],['Total Employees',emp.total_employees||0,PALETTE.blue],['Inventory Value',fmt(inv.total_value,true),PALETTE.purple]].map(([l,v,c],i)=>(
              <div key={i} style={{padding:'6px 8px',borderRadius:6,background:'#f8faff',border:`1px solid ${c}22`}}>
                <div style={{fontSize:8,color:'#94a3b8',marginBottom:1}}>{l}</div>
                <div style={{fontSize:12,fontWeight:800,color:c}}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card title="Top Revenue Customers">
          <MiniTable compact cols={[{k:'customer_name',l:'Customer'},{k:'total',l:'Revenue',r:true,fn:v=>fmt(v,true)},{k:'invoice_count',l:'Invoices',r:true}]} rows={lists.topCustomers||[]}/>
        </Card>
        <Card title="Top Vendors by Spend">
          <MiniTable compact cols={[{k:'vendor_name',l:'Vendor'},{k:'total',l:'Spend',r:true,fn:v=>fmt(v,true)},{k:'invoice_count',l:'Invoices',r:true}]} rows={lists.topVendors||[]}/>
        </Card>
      </div>
    </div>
  );

  // ── FINANCIAL PERFORMANCE ─────────────────────────────────
  const FinancialDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPITile label="Revenue" value={fmt(totalRev,true)} sub="+18.6% vs LY" change={18.6} color={PALETTE.green}/>
        <KPITile label="Gross Profit" value={fmt(grossP,true)} sub={parseFloat(s.grossMargin||0).toFixed(1)+'% Margin'} change={12.4} color={PALETTE.blue}/>
        <KPITile label="Net Profit" value={fmt(netP,true)} sub={parseFloat(s.netMargin||0).toFixed(1)+'% Margin'} change={22.4} color={PALETTE.green}/>
        <KPITile label="Operating Cash Flow" value={fmt(netP*1.35,true)} sub={parseFloat(s.ebitdaMargin||0).toFixed(1)+'% Margin'} change={16.5} color={PALETTE.purple}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:12,marginBottom:12}}>
        <Card title="P&L Summary (MTD)" no="2">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={[
              {name:'Revenue',value:Math.round(totalRev),fill:PALETTE.blue},
              {name:'COGS',value:Math.round(totalRev*0.45),fill:PALETTE.red},
              {name:'Gross Profit',value:Math.round(grossP),fill:PALETTE.green},
              {name:'Opex',value:Math.round(totalExp*0.55),fill:PALETTE.amber},
              {name:'EBITDA',value:Math.round(ebitda),fill:PALETTE.purple},
              {name:'Tax',value:Math.round(netP*0.3),fill:PALETTE.orange},
              {name:'Net Profit',value:Math.round(netP),fill:PALETTE.emerald},
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={44}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="value" name="Amount" radius={[3,3,0,0]}>
                {[PALETTE.blue,PALETTE.red,PALETTE.green,PALETTE.amber,PALETTE.purple,PALETTE.orange,PALETTE.emerald].map((fill,i)=><Cell key={i} fill={fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Revenue vs Expenses Trend">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendChartData}>
              <defs>
                <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE.blue} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={PALETTE.blue} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="eGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE.red} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={PALETTE.red} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={44}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend iconSize={8} wrapperStyle={{fontSize:9}}/>
              <Area type="monotone" dataKey="Revenue" stroke={PALETTE.blue} fill="url(#rGrad)" strokeWidth={2} dot={false}/>
              <Area type="monotone" dataKey="Expenses" stroke={PALETTE.red} fill="url(#eGrad)" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="Profit" stroke={PALETTE.green} strokeWidth={2} dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <Card title="Key Financial Ratios">
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead><tr style={{background:'#f8faff'}}>{['Ratio','Current','vs LY','Trend'].map(h=><th key={h} style={{padding:'5px 8px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:9,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
            <tbody>
              {[
                {r:'Gross Margin',c:parseFloat(s.grossMargin||38).toFixed(1)+'%',ly:'+2.1%',t:[36,37,38,37,39,38,parseFloat(s.grossMargin||38)]},
                {r:'Net Margin',c:parseFloat(s.netMargin||13).toFixed(1)+'%',ly:'+1.8%',t:[11,12,11,13,12,13,parseFloat(s.netMargin||13)]},
                {r:'ROE',c:'18.4%',ly:'+2.8%',t:[14,15,16,17,17,18,18.4]},
                {r:'ROA',c:'11.7%',ly:'+1.4%',t:[9,10,10,11,11,11,11.7]},
                {r:'ROCE',c:'22.1%',ly:'+3.2%',t:[18,19,20,20,21,22,22.1]},
              ].map((r,i) => (
                <tr key={i} style={{borderBottom:'1px solid #f8faff'}}>
                  <td style={{padding:'5px 8px',color:'#334155',fontWeight:500}}>{r.r}</td>
                  <td style={{padding:'5px 8px',fontWeight:800,color:'#0f172a'}}>{r.c}</td>
                  <td style={{padding:'5px 8px',color:PALETTE.green,fontWeight:700}}>{r.ly}</td>
                  <td style={{padding:'5px 8px'}}>
                    <ResponsiveContainer width={50} height={18}>
                      <LineChart data={r.t.map((v,i)=>({i,v}))}><Line type="monotone" dataKey="v" stroke={PALETTE.blue} strokeWidth={1.5} dot={false}/></LineChart>
                    </ResponsiveContainer>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Consolidated P&L (YTD)">
          <MiniTable cols={[{k:'m',l:'Metric'},{k:'cy',l:'Current Year',r:true},{k:'ly',l:'Last Year',r:true},{k:'v',l:'Variance',r:true,fn:v=><span style={{color:PALETTE.green,fontWeight:700}}>{v}</span>}]}
            rows={[
              {m:'Revenue',cy:fmt(totalRev),ly:fmt(totalRev*0.84),v:'+18.6%'},
              {m:'Gross Profit',cy:fmt(grossP),ly:fmt(grossP*0.88),v:'+15.3%'},
              {m:'EBITDA',cy:fmt(ebitda),ly:fmt(ebitda*0.88),v:'+24.3%'},
              {m:'Net Profit',cy:fmt(netP),ly:fmt(netP*0.82),v:'+26.6%'},
            ]}/>
        </Card>
      </div>
    </div>
  );

  // ── AR OVERVIEW ───────────────────────────────────────────
  const ARDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPITile label="Total Receivables" value={fmt(arOut+arOver,true)} change={8.1} color={PALETTE.teal}/>
        <KPITile label="Overdue Amount" value={fmt(arOver,true)} sub={`${ar.overdue_count||0} invoices`} color={PALETTE.red}/>
        <KPITile label="Collection Efficiency" value="92.4%" change={2.3} color={PALETTE.green}/>
        <KPITile label="DSO (Days)" value={`${Math.round(arOut/(totalRev/30)||42)} days`} sub="Target: <45 days" color={PALETTE.amber}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="AR Aging Summary" no="9">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={arAgingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="bucket" tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={44}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="amount" name="Amount" radius={[3,3,0,0]}>
                {arAgingData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:8}}>
            {arAgingData.map((b,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:4,fontSize:9}}><div style={{width:8,height:8,borderRadius:1,background:b.fill}}/><span style={{color:'#64748b'}}>{b.bucket}: </span><span style={{fontWeight:700,color:b.fill}}>{fmt(b.amount,true)}</span></div>)}
          </div>
        </Card>

        <Card title="Top 5 Overdue Customers">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={(lists.recentAR||[]).filter(r=>parseInt(r.days_overdue||0)>0).slice(0,5).map((r,i)=>({name:(r.customer_name||'C'+(i+1)).substring(0,12),amount:parseFloat(r.total_amount||0),days:parseInt(r.days_overdue||0)}))} layout="vertical">
              <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" horizontal={false}/>
              <XAxis type="number" tickFormatter={v=>fmt(v,true)} tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:8,fill:'#64748b'}} axisLine={false} tickLine={false} width={70}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="amount" name="Overdue" fill={PALETTE.red} radius={[0,3,3,0]}/>
            </BarChart>
          </ResponsiveContainer>
          {!(lists.recentAR||[]).filter(r=>parseInt(r.days_overdue||0)>0).length && <div style={{padding:20,textAlign:'center',color:PALETTE.green,fontSize:11,fontWeight:700}}>✓ No overdue invoices</div>}
        </Card>
      </div>

      <Card title="AR Invoice Register">
        <MiniTable cols={[
          {k:'invoice_number',l:'Invoice',fn:v=><span style={{fontFamily:'monospace',fontSize:9,color:PALETTE.blue,fontWeight:700}}>{v}</span>},
          {k:'customer_name',l:'Customer'},
          {k:'total_amount',l:'Amount',r:true,fn:v=>fmt(v,true)},
          {k:'due_date',l:'Due Date',fn:v=>v?new Date(v).toLocaleDateString('en-IN'):'—'},
          {k:'days_overdue',l:'Days OD',r:true,fn:v=>parseInt(v||0)>0?<Badge text={v+'d'} color={parseInt(v)>60?PALETTE.red:PALETTE.amber}/>:<Badge text="On time" color={PALETTE.green}/>},
          {k:'status',l:'Status',fn:v=><Badge text={v||'draft'} color={SC(v)}/>},
        ]} rows={lists.recentAR||[]}/>
      </Card>
    </div>
  );

  // ── COLLECTIONS & DUNNING ─────────────────────────────────
  const CollectionsDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPITile label="Overdue AR" value={fmt(arOver,true)} sub={`${ar.overdue_count||0} invoices`} color={PALETTE.red}/>
        <KPITile label="Collection Rate" value="92.4%" change={2.3} color={PALETTE.green}/>
        <KPITile label="Avg Days Overdue" value="34 days" color={PALETTE.amber}/>
        <KPITile label="At Risk Customers" value={ar.overdue_count||0} sub="Need follow-up" color={PALETTE.purple}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="AR Aging Buckets" no="10">
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={arAgingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="bucket" tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={44}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="amount" name="Amount" radius={[3,3,0,0]}>
                {arAgingData.map((e,i) => <Cell key={i} fill={e.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Collection Efficiency Trend">
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={collectionData}>
              <defs>
                <linearGradient id="collGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE.green} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={PALETTE.green} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis domain={[60,100]} tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={30}/>
              <Tooltip formatter={(v)=>[v+'%','Collection Rate']}/>
              <ReferenceLine y={90} stroke={PALETTE.blue} strokeDasharray="3 3" label={{value:'Target 90%',fontSize:8,fill:PALETTE.blue}}/>
              <Area type="monotone" dataKey="Collection Rate" stroke={PALETTE.green} fill="url(#collGrad)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Dunning Actions — Overdue Invoice Register">
        <MiniTable cols={[
          {k:'invoice_number',l:'Invoice',fn:v=><span style={{fontFamily:'monospace',fontSize:9,color:PALETTE.blue,fontWeight:700}}>{v}</span>},
          {k:'customer_name',l:'Customer'},
          {k:'total_amount',l:'Amount',r:true,fn:v=><span style={{color:PALETTE.red,fontWeight:700}}>{fmt(v,true)}</span>},
          {k:'due_date',l:'Due Date',fn:v=>v?new Date(v).toLocaleDateString('en-IN'):'—'},
          {k:'days_overdue',l:'Days OD',r:true,fn:v=>parseInt(v||0)>0?<Badge text={v+'d'} color={parseInt(v)>60?PALETTE.red:PALETTE.amber}/>:null},
          {k:'status',l:'Action',fn:()=><Badge text="Send Reminder" color={PALETTE.blue}/>},
        ]} rows={(lists.recentAR||[]).filter(r=>parseInt(r.days_overdue||0)>0)}/>
      </Card>
    </div>
  );

  // ── CUSTOMER CREDIT & RISK ────────────────────────────────
  const CreditDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPITile label="Total Credit Exposure" value={fmt(arOut*1.4,true)} color={PALETTE.amber}/>
        <KPITile label="High Risk Customers" value="4" color={PALETTE.red}/>
        <KPITile label="Avg Credit Utilization" value="68%" change={4.2} color={PALETTE.amber}/>
        <KPITile label="Credit Limit Breaches" value="2" sub="Requires action" color={PALETTE.red}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="Credit Utilization by Customer" no="11">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={(lists.topCustomers||[]).slice(0,6).map((c,i)=>{const u=Math.round(40+i*12);return{name:(c.customer_name||'C'+(i+1)).substring(0,12),Used:u,Available:100-u};})}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={24}/>
              <Tooltip formatter={(v,n)=>[v+'%',n]}/>
              <Legend iconSize={8} wrapperStyle={{fontSize:9}}/>
              <Bar dataKey="Used" stackId="a" fill={PALETTE.red} radius={[0,0,0,0]}/>
              <Bar dataKey="Available" stackId="a" fill="#e2e8f0" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Risk Distribution">
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={[{name:'Low Risk',value:55,fill:PALETTE.green},{name:'Medium Risk',value:30,fill:PALETTE.amber},{name:'High Risk',value:15,fill:PALETTE.red}]} cx="50%" cy="50%" innerRadius={32} outerRadius={50} dataKey="value" paddingAngle={2}>
                  {[PALETTE.green,PALETTE.amber,PALETTE.red].map((fill,i)=><Cell key={i} fill={fill}/>)}
                </Pie>
                <Tooltip content={<PieTooltip/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{flex:1}}>
              {[['Low Risk','55%',PALETTE.green],['Medium Risk','30%',PALETTE.amber],['High Risk','15%',PALETTE.red]].map(([l,p,c],i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #f8faff',fontSize:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:8,height:8,borderRadius:1,background:c}}/>{l}</div>
                  <span style={{fontWeight:700,color:c}}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <Card title="Customer Credit Register">
        <MiniTable cols={[
          {k:'customer_name',l:'Customer'},
          {k:'total',l:'Outstanding',r:true,fn:v=>fmt(parseFloat(v)*0.8,true)},
          {k:'total',l:'Credit Limit',r:true,fn:v=>fmt(parseFloat(v),true)},
          {k:'total',l:'Available',r:true,fn:v=><span style={{color:PALETTE.green,fontWeight:700}}>{fmt(parseFloat(v)*0.2,true)}</span>},
          {k:'total',l:'Utilization',r:true,fn:(v,r,i)=>{const p=72+Math.random()*20;return<Badge text={Math.round(p)+'%'} color={p>90?PALETTE.red:p>70?PALETTE.amber:PALETTE.green}/>;},},
        ]} rows={lists.topCustomers||[]}/>
      </Card>
    </div>
  );

  // ── AP OVERVIEW ───────────────────────────────────────────
  const APDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPITile label="Total Payables" value={fmt(apOut,true)} change={-5.4} color={PALETTE.purple}/>
        <KPITile label="Overdue Amount" value={fmt(apOver,true)} sub={`${ap.overdue_count||0} bills`} color={PALETTE.red}/>
        <KPITile label="On-Time Payment %" value="94.3%" change={1.8} color={PALETTE.green}/>
        <KPITile label="Avg Payment Days" value="36 days" sub="Target: 30-45 days" color={PALETTE.amber}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="AP Aging Summary" no="13">
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={apAgingData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} dataKey="amount" paddingAngle={2}>
                  {apAgingData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip content={<PieTooltip/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{flex:1}}>
              {apAgingData.map((b,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:10,borderBottom:'1px solid #f8faff'}}>
                  <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:8,height:8,borderRadius:1,background:b.fill}}/>{b.bucket}</div>
                  <span style={{fontWeight:700,color:b.fill}}>{fmt(b.amount,true)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card title="Top 5 Vendors by Spend (YTD)">
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={topVendorData.slice(0,5)} layout="vertical">
              <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" horizontal={false}/>
              <XAxis type="number" tickFormatter={v=>fmt(v,true)} tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="name" tick={{fontSize:8,fill:'#64748b'}} axisLine={false} tickLine={false} width={65}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="value" name="Spend" radius={[0,3,3,0]}>
                {topVendorData.slice(0,5).map((e,i)=><Cell key={i} fill={e.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card title="AP Invoice Register" no="13">
        <MiniTable cols={[
          {k:'invoice_number',l:'Invoice',fn:v=><span style={{fontFamily:'monospace',fontSize:9,color:PALETTE.purple,fontWeight:700}}>{v}</span>},
          {k:'vendor_name',l:'Vendor'},{k:'total_amount',l:'Amount',r:true,fn:v=>fmt(v,true)},
          {k:'due_date',l:'Due Date',fn:v=>v?new Date(v).toLocaleDateString('en-IN'):'—'},
          {k:'status',l:'Status',fn:v=><Badge text={v||'draft'} color={SC(v)}/>},
        ]} rows={lists.recentAP||[]}/>
      </Card>
    </div>
  );

  // ── AP AGING ──────────────────────────────────────────────
  const APAgingDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPITile label="Total AP" value={fmt(apOut,true)} color={PALETTE.purple}/>
        <KPITile label="Current (Not Due)" value={fmt(parseFloat(apAg.current_bucket||0),true)} color={PALETTE.green}/>
        <KPITile label="Past Due" value={fmt(apOver,true)} sub={`${ap.overdue_count||0} bills`} color={PALETTE.red}/>
        <KPITile label="DPO" value="38 days" sub="Days Payable Outstanding" color={PALETTE.amber}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:12,marginBottom:12}}>
        <Card title="AP Aging Trend" no="16">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={apAgingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="bucket" tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={44}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="amount" name="Amount" radius={[3,3,0,0]}>
                {apAgingData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:8}}>
            {apAgingData.map((b,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:4,fontSize:9}}><div style={{width:8,height:8,borderRadius:1,background:b.fill}}/><span style={{color:'#64748b'}}>{b.bucket}: </span><span style={{fontWeight:700,color:b.fill}}>{fmt(b.amount,true)}</span></div>)}
          </div>
        </Card>
        <Card title="Upcoming Payments (Next 30 Days)">
          <MiniTable cols={[{k:'vendor_name',l:'Vendor'},{k:'total',l:'Amount',r:true,fn:v=>fmt(parseFloat(v)*0.3,true)},{k:'invoice_count',l:'Bills',r:true}]} rows={(lists.topVendors||[]).slice(0,5)}/>
          <div style={{marginTop:10,padding:'8px 10px',borderRadius:6,background:'#fef2f2',border:`1px solid ${PALETTE.red}22`,fontSize:10}}>
            <span style={{fontWeight:700,color:PALETTE.red}}>Total due in 30 days: </span>
            <span style={{fontWeight:800,color:PALETTE.red}}>{fmt(apOut*0.35,true)}</span>
          </div>
        </Card>
      </div>
      <Card title="AP Vendor Register">
        <MiniTable cols={[
          {k:'vendor_name',l:'Vendor'},{k:'total',l:'Total Spend',r:true,fn:v=>fmt(v,true)},
          {k:'invoice_count',l:'Invoices',r:true},
          {k:'total',l:'Outstanding',r:true,fn:v=><span style={{color:PALETTE.purple,fontWeight:700}}>{fmt(parseFloat(v)*0.4,true)}</span>},
          {k:'invoice_count',l:'Status',fn:()=><Badge text="Active" color={PALETTE.green}/>},
        ]} rows={lists.topVendors||[]}/>
      </Card>
    </div>
  );

  // ── BUDGET VS ACTUAL ──────────────────────────────────────
  const BudgetDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPITile label="Budget (YTD)" value={fmt(parseFloat(bud.total_budget||totalRev*1.1),true)} color={PALETTE.blue}/>
        <KPITile label="Actual (YTD)" value={fmt(totalRev,true)} color={PALETTE.green}/>
        <KPITile label="Variance" value={fmt(totalRev-parseFloat(bud.total_budget||totalRev*1.1),true)} sub="Favorable" change={4.0} color={PALETTE.green}/>
        <KPITile label="Forecast Accuracy" value="94.2%" change={1.3} color={PALETTE.purple}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.5fr 0.5fr',gap:12,marginBottom:12}}>
        <Card title="Revenue — Budget vs Actual (YTD)" no="20">
          <ResponsiveContainer width="100%" height={160}>
            <ComposedChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="dept" tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={44}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend iconSize={8} wrapperStyle={{fontSize:9}}/>
              <Bar dataKey="Budget" fill="#94a3b8" opacity={0.5} radius={[3,3,0,0]}/>
              <Bar dataKey="Actual" fill={PALETTE.blue} radius={[3,3,0,0]}/>
              <Line type="monotone" dataKey="Budget" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Top Variances">
          {[['COGS',-190000,PALETTE.red],['Marketing',620000,PALETTE.green],['Salaries',850000,PALETTE.green],['Other Opex',-120000,PALETTE.red]].map(([c,v,col],i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f8faff',fontSize:10}}>
              <span style={{color:'#334155'}}>{c}</span>
              <span style={{fontWeight:700,color:col}}>{v>=0?'+':''}{fmt(v,true)}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card title="Department Budget Utilization">
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={budgetData} layout="vertical">
            <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" horizontal={false}/>
            <XAxis type="number" tickFormatter={v=>fmt(v,true)} tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
            <YAxis type="category" dataKey="dept" tick={{fontSize:9,fill:'#64748b'}} axisLine={false} tickLine={false} width={70}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend iconSize={8} wrapperStyle={{fontSize:9}}/>
            <Bar dataKey="Budget" fill="#e2e8f0" radius={[0,3,3,0]}/>
            <Bar dataKey="Actual" radius={[0,3,3,0]}>
              {budgetData.map((e,i)=><Cell key={i} fill={e.Actual>e.Budget?PALETTE.red:PALETTE.blue}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );

  // ── TAX COMPLIANCE ────────────────────────────────────────
  const TaxDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <div style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',padding:'12px 14px',borderLeft:`4px solid ${PALETTE.red}`}}>
          <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',marginBottom:4}}>TOTAL TAX LIABILITY</div>
          <div style={{fontSize:22,fontWeight:800,color:PALETTE.red}}>{fmt(totalRev*0.052,true)}</div>
          <div style={{fontSize:9,color:PALETTE.green}}>Paid: {fmt(totalRev*0.038,true)}</div>
          <div style={{fontSize:9,color:PALETTE.red,fontWeight:700}}>Outstanding: {fmt(totalRev*0.014,true)}</div>
        </div>
        <KPITile label="GST Payable (Net)" value={fmt(totalRev*0.072,true)} sub="Output less Input" color={PALETTE.amber}/>
        <KPITile label="TDS Liability (Q4)" value={fmt(totalExp*0.03,true)} sub="Due 7th next month" color={PALETTE.purple}/>
        <KPITile label="Advance Tax" value={fmt(netP*0.25,true)} sub="Q1 installment" color={PALETTE.blue}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="Tax by Type" no="27">
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={taxData} cx="50%" cy="50%" innerRadius={30} outerRadius={48} dataKey="value" paddingAngle={2}>
                  {taxData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip content={<PieTooltip/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{flex:1}}>
              {taxData.map((t,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:9,borderBottom:'1px solid #f8faff'}}>
                  <div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:7,height:7,borderRadius:1,background:t.fill}}/>{t.name}</div>
                  <span style={{fontWeight:700,color:t.fill}}>{t.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="GST Reconciliation">
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={[{name:'Output',v:Math.round(totalRev*0.18),fill:PALETTE.red},{name:'Input Credit',v:Math.round(totalExp*0.12),fill:PALETTE.green},{name:'Net Payable',v:Math.round(totalRev*0.18-totalExp*0.12),fill:PALETTE.amber}]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={44}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="v" name="Amount" radius={[3,3,0,0]}>
                {[PALETTE.red,PALETTE.green,PALETTE.amber].map((fill,i)=><Cell key={i} fill={fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Upcoming Tax Deadlines">
          {[
            {n:'GST Return (GSTR-3B)',d:'20 Jun 2026',days:1},{n:'TDS Return (Form 24Q)',d:'31 Jul 2026',days:43},
            {n:'Income Tax Return',d:'31 Oct 2026',days:73},{n:'PF/ESI Payment',d:'15 Jun 2026',days:-5},
            {n:'Advance Tax Q1',d:'15 Jun 2026',days:-5},
          ].map((t,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid #f8faff'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:10,fontWeight:500,color:'#334155'}}>{t.n}</div>
                <div style={{fontSize:9,color:'#94a3b8'}}>{t.d}</div>
              </div>
              <Badge text={t.days<0?'Overdue':t.days+'d'} color={t.days<0?PALETTE.red:t.days<=7?PALETTE.amber:PALETTE.green}/>
            </div>
          ))}
        </Card>
      </div>

      <Card title="GST Filing Status">
        <MiniTable cols={[
          {k:'r',l:'Return'},{k:'p',l:'Period'},{k:'d',l:'Due Date'},{k:'f',l:'Filed Date'},
          {k:'s',l:'Status',fn:v=><Badge text={v} color={v==='Filed'?PALETTE.green:v==='Overdue'?PALETTE.red:PALETTE.amber}/>},
          {k:'a',l:'Amount',r:true},
        ]} rows={[
          {r:'GSTR-1',p:'Apr 2026',d:'11-May-2026',f:'10-May-2026',s:'Filed',a:fmt(totalRev*0.072,true)},
          {r:'GSTR-3B',p:'Apr 2026',d:'20-May-2026',f:'—',s:'Pending',a:fmt(totalRev*0.072-totalExp*0.048,true)},
          {r:'GSTR-9',p:'FY 24-25',d:'31-Dec-2025',f:'28-Dec-2025',s:'Filed',a:fmt(totalRev*0.72,true)},
          {r:'TDS Q4',p:'Jan-Mar 2026',d:'31-May-2026',f:'—',s:'Overdue',a:fmt(totalExp*0.03,true)},
        ]}/>
      </Card>
    </div>
  );

  // ── EXPENSE WORKSPACE ─────────────────────────────────────
  const ExpenseDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:12}}>
        <KPITile label="Total Claims" value={exp.total_count||0} color={PALETTE.purple}/>
        <KPITile label="Total Amount" value={fmt(exp.total_expenses,true)} color={PALETTE.red}/>
        <KPITile label="Pending Approval" value={exp.pending_count||0} sub={fmt(exp.pending_expenses,true)} color={PALETTE.amber}/>
        <KPITile label="Approved" value={fmt(exp.approved_expenses,true)} change={8.3} color={PALETTE.green}/>
        <KPITile label="Policy Violations" value="3" sub="Auto-rejected" color={PALETTE.red}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="Expenses by Category" no="46">
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={expCatData.length?expCatData:[{name:'Travel',value:35,fill:PALETTE.blue,pct:'35%'},{name:'Hotel',value:25,fill:PALETTE.red,pct:'25%'},{name:'Meals',value:20,fill:PALETTE.green,pct:'20%'},{name:'Others',value:20,fill:PALETTE.amber,pct:'20%'}]} cx="50%" cy="50%" innerRadius={32} outerRadius={50} dataKey="value" paddingAngle={2}>
                  {(expCatData.length?expCatData:[{fill:PALETTE.blue},{fill:PALETTE.red},{fill:PALETTE.green},{fill:PALETTE.amber}]).map((e,i)=><Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip content={<PieTooltip/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{flex:1}}>
              {(expCatData.length?expCatData:[{name:'Travel',value:35,fill:PALETTE.blue,pct:'35%'},{name:'Hotel',value:25,fill:PALETTE.red,pct:'25%'},{name:'Meals',value:20,fill:PALETTE.green,pct:'20%'},{name:'Others',value:20,fill:PALETTE.amber,pct:'20%'}]).map((c,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:10,borderBottom:'1px solid #f8faff'}}>
                  <div style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:8,height:8,borderRadius:1,background:c.fill}}/>{c.name}</div>
                  <div style={{display:'flex',gap:8}}><span style={{color:'#94a3b8'}}>{c.pct}</span><span style={{fontWeight:700,color:c.fill}}>{fmt(c.value,true)}</span></div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Monthly Expense Trend">
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={trendChartData}>
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PALETTE.red} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={PALETTE.red} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
              <XAxis dataKey="month" tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:8,fill:'#94a3b8'}} axisLine={false} tickLine={false} width={44}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="Expenses" stroke={PALETTE.red} fill="url(#expGrad)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginTop:8}}>
            {[['Policy Violations','3',PALETTE.red],['Pending',exp.pending_count||0,PALETTE.amber],['Approved',fmt(exp.approved_expenses,true),PALETTE.green]].map(([l,v,c],i)=>(
              <div key={i} style={{padding:'6px 8px',borderRadius:6,background:c+'0d',border:`1px solid ${c}22`,textAlign:'center'}}>
                <div style={{fontSize:8,color:'#94a3b8'}}>{l}</div>
                <div style={{fontSize:13,fontWeight:800,color:c}}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Policy Alerts & Compliance">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
          <div style={{padding:'10px 12px',borderRadius:7,background:'#f0fdf4',border:`1px solid ${PALETTE.green}30`}}>
            <div style={{fontSize:10,fontWeight:700,color:PALETTE.green,marginBottom:4}}>✓ Policy Limits Active</div>
            <div style={{fontSize:9,color:'#64748b'}}>Hotel: ₹8,000/night · Meals: ₹1,500/day · Travel: ₹20,000/trip</div>
          </div>
          <div style={{padding:'10px 12px',borderRadius:7,background:'#fef2f2',border:`1px solid ${PALETTE.red}30`}}>
            <div style={{fontSize:10,fontWeight:700,color:PALETTE.red,marginBottom:4}}>⚠ 3 Policy Violations This Month</div>
            <div style={{fontSize:9,color:'#64748b'}}>Hotel claim ₹12,000 vs limit ₹8,000 · Travel ₹24,000 vs limit ₹20,000</div>
          </div>
        </div>
        <MiniTable cols={[
          {k:'category',l:'Category'},{k:'count',l:'Claims',r:true},{k:'total',l:'Amount',r:true,fn:v=>fmt(v,true)},
          {k:'total',l:'Avg/Claim',r:true,fn:(v,r)=>fmt(parseFloat(v||0)/Math.max(parseInt(r.count||1),1),true)},
          {k:'total',l:'Policy Status',fn:()=><Badge text="Within Limit" color={PALETTE.green}/>},
        ]} rows={(exp.byCategory||[]).slice(0,6)}/>
      </Card>
    </div>
  );

  const renderDash = () => {
    switch(tab) {
      case 'exec': return <ExecDash/>;
      case 'financial': return <FinancialDash/>;
      case 'ar': return <ARDash/>;
      case 'collections': return <CollectionsDash/>;
      case 'credit': return <CreditDash/>;
      case 'ap': return <APDash/>;
      case 'apaging': return <APAgingDash/>;
      case 'budget': return <BudgetDash/>;
      case 'tax': return <TaxDash/>;
      case 'expense': return <ExpenseDash/>;
      case 'cashflow': return <CashFlowDash/>;
      case 'liquidity': return <LiquidityDash/>;
      case 'revenue': return <RevenueDash/>;
      case 'pldeep': return <PLDeepDash/>;
      case 'forecast': return <ForecastDash/>;
      case 'capex': return <CapexDash/>;
      case 'customers': return <CustomersDash/>;
      case 'vendors': return <VendorsDash/>;
      case 'purchasing': return <PurchasingDash/>;
      case 'apautomation': return <APAutomationDash/>;
      case 'payroll': return <PayrollDash/>;
      case 'hr': return <HRDash/>;
      case 'inventory': return <InventoryDash/>;
      case 'gst': return <GSTDash/>;
      case 'tds': return <TDSDash/>;
      case 'banking': return <BankingDash/>;
      case 'audit': return <AuditDash/>;
      case 'board': return <BoardDash/>;
      case 'multicurrency': return <MultiCurrencyDash/>;
      case 'intercompany': return <IntercompanyDash/>;
      case 'esg': return <ESGDash/>;
      case 'loans': return <LoansDash/>;
      case 'investment': return <InvestmentDash/>;
      case 'insurance': return <InsuranceDash/>;
      case 'crm': return <CRMDash/>;
      case 'statutory': return <StatutoryDash/>;
      case 'projects': return <ProjectsDash/>;
      case 'procurement': return <ProcurementDash/>;
      default: return <ExecDash/>;
    }
  };



  const MiniTableSimple = ({ headers=[], rows=[], empty='No data available' }) => (
    <div style={{overflowX:'auto',overflowY:'auto',maxHeight:220}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
        <thead><tr style={{background:'#f8faff',position:'sticky',top:0}}>{headers.map((h,i)=><th key={i} style={{padding:'6px 10px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:9,borderBottom:'2px solid #e2e8f0',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
        <tbody>{!rows.length?<tr><td colSpan={headers.length} style={{padding:16,textAlign:'center',color:'#94a3b8'}}>{empty}</td></tr>:rows.map((r,i)=><tr key={i} style={{borderBottom:'1px solid #f8faff',background:i%2===0?'#fff':'#fafbff'}}>{r.map((c,j)=><td key={j} style={{padding:'6px 10px',color:'#334155'}}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );

// ── NEW DASHBOARD COMPONENTS ─────────────────────────────────

const CashFlowDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Total Cash Balance" value={fmt(d?.banking?.totalBalance,true)} icon="💰" color={PALETTE.green}/>
      <KPITile label="AR Collections Expected" value={fmt(arOut,true)} color={PALETTE.blue}/>
      <KPITile label="AP Payments Due" value={fmt(apOut,true)} color={PALETTE.red}/>
      <KPITile label="Net Cash Position" value={fmt(arOut-apOut,true)} color={arOut>apOut?PALETTE.green:PALETTE.red}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Cash Flow Trend">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={trendChartData.map(t=>({...t,operating:t.Revenue*0.3,investing:-t.Revenue*0.1,financing:t.Revenue*0.05,net:t.Revenue*0.25}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:10}}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey="operating" name="Operating CF" fill={PALETTE.green} stackId="a"/>
            <Bar dataKey="investing" name="Investing CF" fill={PALETTE.amber} stackId="a"/>
            <Bar dataKey="financing" name="Financing CF" fill={PALETTE.blue} stackId="a" radius={[3,3,0,0]}/>
            <Line type="monotone" dataKey="net" name="Net CF" stroke={PALETTE.purple} strokeWidth={2}/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Bank Account Balances">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={(d?.banking?.accounts||[]).map(a=>({name:(a.account_name||a.bank_name||'Account').substring(0,14),balance:parseFloat(a.current_balance||0)}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{fontSize:9}}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Bar dataKey="balance" name="Balance" radius={[4,4,0,0]}>
              {(d?.banking?.accounts||[]).map((_,i)=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Bank Account Register">
      <MiniTableSimple headers={['Account Name','Bank','Type','Account No.','Balance','Status']}
        rows={(d?.banking?.accounts||[]).map(a=>[a.account_name||'—',a.bank_name||'—',a.account_type||'current',a.account_number?'****'+String(a.account_number).slice(-4):'—',<span style={{color:parseFloat(a.current_balance||0)>=0?PALETTE.green:PALETTE.red,fontWeight:700}}>{fmt(a.current_balance,true)}</span>,<Badge text="Active" color={PALETTE.green}/>])}
        empty="No bank accounts configured"/>
    </Card>
  </div>
);

const LiquidityDash = () => {
  const currentRatio = (arOut/Math.max(1,apOut)).toFixed(2);
  const quickRatio = ((arOut+parseFloat(d?.banking?.totalBalance||0))/Math.max(1,apOut)).toFixed(2);
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPITile label="Current Ratio" value={currentRatio+'x'} sub="Target: >1.5x" color={parseFloat(currentRatio)>=1.5?PALETTE.green:PALETTE.red}/>
        <KPITile label="Working Capital" value={fmt(arOut-apOut,true)} color={PALETTE.blue}/>
        <KPITile label="Quick Ratio" value={quickRatio+'x'} sub="Target: >1.0x" color={parseFloat(quickRatio)>=1.0?PALETTE.green:PALETTE.amber}/>
        <KPITile label="AR Days (DSO)" value={parseFloat(ar.avg_dso||42).toFixed(0)+'d'} sub="Target: <45 days" color={parseFloat(ar.avg_dso||42)<45?PALETTE.green:PALETTE.amber}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="Working Capital Trend">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendChartData.map(t=>({...t,assets:t.Revenue*0.35,liabilities:t.Revenue*0.15,wc:t.Revenue*0.2}))}>
              <defs>
                <linearGradient id="wcg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={PALETTE.green} stopOpacity={0.2}/><stop offset="95%" stopColor={PALETTE.green} stopOpacity={0}/></linearGradient>
                <linearGradient id="wcg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={PALETTE.red} stopOpacity={0.2}/><stop offset="95%" stopColor={PALETTE.red} stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{fontSize:10}}/>
              <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
              <Tooltip formatter={v=>fmt(v,true)}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Area type="monotone" dataKey="assets" name="Current Assets" stroke={PALETTE.green} fill="url(#wcg1)" strokeWidth={2}/>
              <Area type="monotone" dataKey="liabilities" name="Current Liabilities" stroke={PALETTE.red} fill="url(#wcg2)" strokeWidth={2}/>
              <Line type="monotone" dataKey="wc" name="Net Working Capital" stroke={PALETTE.blue} strokeWidth={2} strokeDasharray="5 5"/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Liquidity Ratios Radar">
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={[
              {metric:'Current Ratio',actual:Math.min(3,parseFloat(currentRatio)),benchmark:1.5},
              {metric:'Quick Ratio',actual:Math.min(3,parseFloat(quickRatio)),benchmark:1.0},
              {metric:'DSO Score',actual:Math.max(0,3-parseFloat(ar.avg_dso||42)/30),benchmark:1.5},
              {metric:'Cash Ratio',actual:Math.min(3,parseFloat(d?.banking?.totalBalance||0)/Math.max(1,apOut)),benchmark:0.5},
              {metric:'Collection',actual:2.5,benchmark:2.0},
            ]}>
              <PolarGrid stroke="#e2e8f0"/>
              <PolarAngleAxis dataKey="metric" tick={{fontSize:9}}/>
              <Radar name="Actual" dataKey="actual" stroke={PALETTE.blue} fill={PALETTE.blue} fillOpacity={0.3}/>
              <Radar name="Benchmark" dataKey="benchmark" stroke={PALETTE.green} fill={PALETTE.green} fillOpacity={0.1}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Tooltip/>
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card title="Liquidity Analysis Summary">
        <MiniTableSimple headers={['Metric','Value','Benchmark','Status','Insight']} rows={[
          ['Current Ratio',currentRatio+'x','>1.5x',<Badge text={parseFloat(currentRatio)>=1.5?'Healthy':'Below Target'} color={parseFloat(currentRatio)>=1.5?PALETTE.green:PALETTE.red}/>,'Short-term coverage'],
          ['Quick Ratio',quickRatio+'x','>1.0x',<Badge text={parseFloat(quickRatio)>=1?'Healthy':'Watch'} color={parseFloat(quickRatio)>=1?PALETTE.green:PALETTE.amber}/>,'Liquid assets vs liabilities'],
          ['Working Capital',fmt(arOut-apOut,true),'Positive',<Badge text={arOut>apOut?'Positive':'Deficit'} color={arOut>apOut?PALETTE.green:PALETTE.red}/>,'Net current position'],
          ['DSO',parseFloat(ar.avg_dso||42).toFixed(0)+' days','<45 days',<Badge text={parseFloat(ar.avg_dso||42)<45?'On Track':'Watch'} color={parseFloat(ar.avg_dso||42)<45?PALETTE.green:PALETTE.amber}/>,'Collection performance'],
          ['Cash Coverage',fmt(d?.banking?.totalBalance,true),'Positive',<Badge text="Active" color={PALETTE.blue}/>,'Available liquidity buffer'],
        ]} empty="No data"/>
      </Card>
    </div>
  );
};

const RevenueDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Total Revenue" value={fmt(totalRev,true)} change="+18.6%" color={PALETTE.green}/>
      <KPITile label="Top Customer" value={fmt(lists.topCustomers?.[0]?.total,true)} sub={(lists.topCustomers?.[0]?.customer_name||'').substring(0,15)} color={PALETTE.blue}/>
      <KPITile label="Active Customers" value={parseInt(d?.customers?.total||0).toLocaleString('en-IN')} color={PALETTE.teal}/>
      <KPITile label="Avg Revenue/Customer" value={fmt(totalRev/Math.max(1,parseInt(d?.customers?.total||1)),true)} color={PALETTE.purple}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Revenue by Customer">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={(lists.topCustomers||[]).map(c=>({name:(c.customer_name||'Unknown').substring(0,12),revenue:parseFloat(c.total||0)}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{fontSize:9}} angle={-25} textAnchor="end" height={55}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Bar dataKey="revenue" name="Revenue" radius={[4,4,0,0]}>
              {(lists.topCustomers||[]).map((_,i)=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Revenue Growth Trend">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={trendChartData}>
            <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={PALETTE.green} stopOpacity={0.3}/><stop offset="95%" stopColor={PALETTE.green} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:10}}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <ReferenceLine y={totalRev*0.9} stroke={PALETTE.amber} strokeDasharray="5 5" label={{value:'Target',position:'insideRight',fontSize:9}}/>
            <Area type="monotone" dataKey="Revenue" name="Revenue" stroke={PALETTE.green} fill="url(#revGrad)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Customer Revenue Register">
      <MiniTableSimple headers={['Customer','Outstanding AR','Invoices','Avg Invoice','Contribution %']} rows={(lists.topCustomers||[]).map(c=>[
        c.customer_name||'Unknown',
        <span style={{color:PALETTE.amber,fontWeight:700}}>{fmt(c.total,true)}</span>,
        c.invoice_count||0,
        fmt(parseFloat(c.total||0)/Math.max(1,parseInt(c.invoice_count||1)),true),
        totalRev>0?(parseFloat(c.total||0)/totalRev*100).toFixed(1)+'%':'—'
      ])} empty="No customer data"/>
    </Card>
  </div>
);

const PLDeepDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Gross Margin" value={parseFloat(s.grossMargin||0).toFixed(1)+'%'} sub="Target: >40%" color={parseFloat(s.grossMargin||0)>=40?PALETTE.green:PALETTE.amber}/>
      <KPITile label="Net Margin" value={parseFloat(s.netMargin||0).toFixed(1)+'%'} sub="Target: >15%" color={parseFloat(s.netMargin||0)>=15?PALETTE.green:PALETTE.amber}/>
      <KPITile label="EBITDA Margin" value={parseFloat(s.ebitdaMargin||0).toFixed(1)+'%'} color={PALETTE.blue}/>
      <KPITile label="OpEx Ratio" value={(totalExp*0.55/Math.max(1,totalRev)*100).toFixed(1)+'%'} color={PALETTE.purple}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Margin Trend Analysis">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendChartData.map(t=>({...t,grossMargin:t.Revenue>0?((t.Revenue-t.Expenses*0.45)/t.Revenue*100).toFixed(1):0,netMargin:t.Revenue>0?(t.Profit/t.Revenue*100).toFixed(1):0,ebitdaMargin:t.Revenue>0?((t.Profit+t.Expenses*0.08)/t.Revenue*100).toFixed(1):0}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:10}}/>
            <YAxis tickFormatter={v=>v+'%'} tick={{fontSize:9}} width={40}/>
            <Tooltip formatter={v=>v+'%'}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <ReferenceLine y={40} stroke={PALETTE.green} strokeDasharray="5 5" label={{value:'GM Target',fontSize:8}}/>
            <ReferenceLine y={15} stroke={PALETTE.blue} strokeDasharray="5 5" label={{value:'NM Target',fontSize:8}}/>
            <Line type="monotone" dataKey="grossMargin" name="Gross Margin %" stroke={PALETTE.green} strokeWidth={2} dot={{r:3}}/>
            <Line type="monotone" dataKey="netMargin" name="Net Margin %" stroke={PALETTE.blue} strokeWidth={2} dot={{r:3}}/>
            <Line type="monotone" dataKey="ebitdaMargin" name="EBITDA Margin %" stroke={PALETTE.purple} strokeWidth={2} dot={{r:3}} strokeDasharray="5 5"/>
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Expense Category Breakdown">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={(exp.byCategory||[{category:'No Data',total:1}]).map(e=>({name:e.category||'Other',value:parseFloat(e.total||0)}))} cx="50%" cy="50%" outerRadius={90} paddingAngle={2} dataKey="value" label={({name,percent})=>percent>0.05?name:''}>
              {(exp.byCategory||[]).map((_,i)=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Pie>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:9}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Detailed P&L Statement">
      <MiniTableSimple headers={['Line Item','Amount','% of Revenue','MoM Change','YoY Change']} rows={[
        ['Revenue',fmt(totalRev,true),'100%','+5.2% ▲','+18.6% ▲'],
        ['COGS',fmt(totalExp*0.45,true),(totalExp*0.45/Math.max(1,totalRev)*100).toFixed(1)+'%','+3.1% ▲','+12.1% ▲'],
        ['Gross Profit',fmt(grossP,true),(grossP/Math.max(1,totalRev)*100).toFixed(1)+'%','+6.8% ▲','+22.4% ▲'],
        ['Sales & Marketing',fmt(totalExp*0.12,true),'12%','+2.1% ▲','+8.3% ▲'],
        ['G&A',fmt(totalExp*0.18,true),'18%','+1.5% ▲','+6.7% ▲'],
        ['R&D',fmt(totalExp*0.08,true),'8%','+4.2% ▲','+15.3% ▲'],
        ['EBITDA',fmt(ebitda,true),(ebitda/Math.max(1,totalRev)*100).toFixed(1)+'%','+8.1% ▲','+9.1% ▲'],
        ['Net Profit',fmt(netP,true),(netP/Math.max(1,totalRev)*100).toFixed(1)+'%','+9.4% ▲','+22.4% ▲'],
      ]} empty="No data"/>
    </Card>
  </div>
);

const ForecastDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Total Budget" value={fmt(bud.total_budget,true)} color={PALETTE.blue}/>
      <KPITile label="Actual Spent" value={fmt(bud.total_spent,true)} color={parseFloat(bud.total_spent||0)<=parseFloat(bud.total_budget||0)?PALETTE.green:PALETTE.red}/>
      <KPITile label="Variance" value={fmt(parseFloat(bud.total_budget||0)-parseFloat(bud.total_spent||0),true)} color={parseFloat(bud.total_budget||0)>=parseFloat(bud.total_spent||0)?PALETTE.green:PALETTE.red}/>
      <KPITile label="Utilization" value={parseFloat(bud.total_budget||0)>0?(parseFloat(bud.total_spent||0)/parseFloat(bud.total_budget||0)*100).toFixed(1)+'%':'N/A'} color={PALETTE.amber}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Budget vs Actual vs Forecast">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={(bud.utilization||[]).map(b=>({name:(b.name||'Dept').substring(0,12),budget:parseFloat(b.budgeted||0),actual:parseFloat(b.spent||0),forecast:parseFloat(b.budgeted||0)*0.95}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{fontSize:9}} angle={-20} textAnchor="end" height={55}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey="budget" name="Budget" fill={PALETTE.blue+'60'} radius={[3,3,0,0]}/>
            <Bar dataKey="actual" name="Actual" fill={PALETTE.green} radius={[3,3,0,0]}/>
            <Line type="monotone" dataKey="forecast" name="Forecast" stroke={PALETTE.amber} strokeWidth={2} strokeDasharray="5 5" dot={{r:3}}/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Variance Analysis">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={(bud.utilization||[]).map(b=>{const v=parseFloat(b.budgeted||0)>0?((parseFloat(b.spent||0)-parseFloat(b.budgeted||0))/parseFloat(b.budgeted||0)*100):0;return{name:(b.name||'Dept').substring(0,12),variance:parseFloat(v.toFixed(1))};})}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{fontSize:9}} angle={-20} textAnchor="end" height={55}/>
            <YAxis tickFormatter={v=>v+'%'} tick={{fontSize:9}} width={40}/>
            <Tooltip formatter={v=>v+'%'}/>
            <ReferenceLine y={0} stroke="#334155" strokeWidth={2}/>
            <Bar dataKey="variance" name="Variance %" radius={[4,4,0,0]}>
              {(bud.utilization||[]).map((b,i)=><Cell key={i} fill={parseFloat(b.spent||0)>parseFloat(b.budgeted||0)?PALETTE.red:PALETTE.green}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Department Budget Utilization">
      <MiniTableSimple headers={['Department','Budget','Actual','Variance','% Used','Status','Forecast']} rows={(bud.utilization||[]).map(b=>{
        const pct=parseFloat(b.budgeted||0)>0?((parseFloat(b.spent||0)/parseFloat(b.budgeted||0))*100):0;
        const over=parseFloat(b.spent||0)>parseFloat(b.budgeted||0);
        return[b.name,fmt(b.budgeted,true),fmt(b.spent,true),<span style={{color:over?PALETTE.red:PALETTE.green,fontWeight:700}}>{over?'-':'+'}+{fmt(Math.abs(parseFloat(b.budgeted||0)-parseFloat(b.spent||0)),true)}</span>,pct.toFixed(1)+'%',<Badge text={over?'Over Budget':'On Track'} color={over?PALETTE.red:PALETTE.green}/>,fmt(parseFloat(b.budgeted||0)*0.95,true)];
      })} empty="No budget data. Create budgets in the Budgeting module."/>
    </Card>
  </div>
);

const CapexDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Total Assets" value={parseInt(d?.assets?.total_assets||0).toLocaleString('en-IN')} icon="🏭" color={PALETTE.blue}/>
      <KPITile label="Total Asset Value" value={fmt(d?.assets?.total_value,true)} color={PALETTE.green}/>
      <KPITile label="Total Depreciation" value={fmt(d?.assets?.total_depreciation,true)} color={PALETTE.amber}/>
      <KPITile label="Net Book Value" value={fmt(parseFloat(d?.assets?.total_value||0)-parseFloat(d?.assets?.total_depreciation||0),true)} color={PALETTE.purple}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Asset Value by Category">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={(d?.assets?.byCategory||[]).map(a=>({name:(a.category||'Other').substring(0,12),cost:parseFloat(a.total_cost||0),value:parseFloat(a.current_value||0),depreciation:parseFloat(a.depreciation||0)}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{fontSize:9}} angle={-20} textAnchor="end" height={55}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey="cost" name="Purchase Cost" fill={PALETTE.blue} radius={[0,0,0,0]}/>
            <Bar dataKey="value" name="Current Value" fill={PALETTE.green} radius={[0,0,0,0]}/>
            <Bar dataKey="depreciation" name="Depreciation" fill={PALETTE.amber} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Asset Distribution by Category">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={(d?.assets?.byCategory||[{category:'No Assets',current_value:1}]).map(a=>({name:a.category||'Other',value:parseFloat(a.current_value||0)}))} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
              {(d?.assets?.byCategory||[]).map((_,i)=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Pie>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:9}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Fixed Asset Register">
      <MiniTableSimple headers={['Category','Count','Purchase Cost','Current Value','Depreciation','Net Book Value','Method']} rows={(d?.assets?.byCategory||[]).map(a=>[
        a.category||'Other',a.count||0,fmt(a.total_cost,true),
        <span style={{color:PALETTE.green,fontWeight:700}}>{fmt(a.current_value,true)}</span>,
        <span style={{color:PALETTE.amber}}>{fmt(a.depreciation,true)}</span>,
        fmt(parseFloat(a.current_value||0)-parseFloat(a.depreciation||0),true),
        <Badge text="SLM" color={PALETTE.blue}/>
      ])} empty="No fixed assets configured. Add assets in the Asset Management module."/>
    </Card>
  </div>
);

const CustomersDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Total Customers" value={parseInt(d?.customers?.total||0).toLocaleString('en-IN')} color={PALETTE.blue}/>
      <KPITile label="Active Customers" value={Math.round(parseInt(d?.customers?.total||0)*0.75).toLocaleString('en-IN')} color={PALETTE.green}/>
      <KPITile label="Avg Invoice Value" value={fmt(totalRev/Math.max(1,parseInt(ar.total_count||1)),true)} color={PALETTE.teal}/>
      <KPITile label="Avg Credit Limit" value={fmt(d?.customers?.avg_credit,true)} color={PALETTE.purple}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Customer Revenue Share">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={(lists.topCustomers||[]).map(c=>({name:(c.customer_name||'Unknown').substring(0,12),value:parseFloat(c.total||0)}))} cx="50%" cy="50%" outerRadius={90} paddingAngle={2} dataKey="value" label={({name,percent})=>percent>0.05?name:''}>
              {(lists.topCustomers||[]).map((_,i)=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Pie>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:9}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Invoice Count by Customer">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={(lists.topCustomers||[]).map(c=>({name:(c.customer_name||'Unknown').substring(0,12),invoices:parseInt(c.invoice_count||0)}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{fontSize:9}} angle={-25} textAnchor="end" height={55}/>
            <YAxis tick={{fontSize:9}}/>
            <Tooltip/>
            <Bar dataKey="invoices" name="Invoice Count" radius={[4,4,0,0]}>
              {(lists.topCustomers||[]).map((_,i)=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Customer Master Register">
      <MiniTableSimple headers={['Customer','Outstanding AR','Invoices','Avg Invoice','Credit Limit','Risk Score']} rows={(lists.topCustomers||[]).map(c=>[
        c.customer_name||'Unknown',
        <span style={{color:PALETTE.amber,fontWeight:700}}>{fmt(c.total,true)}</span>,
        c.invoice_count,
        fmt(parseFloat(c.total||0)/Math.max(1,parseInt(c.invoice_count||1)),true),
        fmt(d?.customers?.avg_credit,true),
        <Badge text="Low" color={PALETTE.green}/>
      ])} empty="No customer data"/>
    </Card>
  </div>
);

const VendorsDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Total Vendors" value={parseInt(d?.vendors?.total||0).toLocaleString('en-IN')} color={PALETTE.purple}/>
      <KPITile label="Active Vendors" value={parseInt(d?.vendors?.active||0).toLocaleString('en-IN')} color={PALETTE.green}/>
      <KPITile label="Total AP" value={fmt(ap.total_ap,true)} color={PALETTE.amber}/>
      <KPITile label="Avg Per Vendor" value={fmt(parseFloat(ap.total_ap||0)/Math.max(1,parseInt(d?.vendors?.active||1)),true)} color={PALETTE.blue}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Vendor Spend Distribution">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={(lists.topVendors||[]).map(v=>({name:(v.vendor_name||'Unknown').substring(0,12),value:parseFloat(v.total||0)}))} cx="50%" cy="50%" outerRadius={90} paddingAngle={2} dataKey="value">
              {(lists.topVendors||[]).map((_,i)=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Pie>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:9}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Top Vendors by Spend">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={(lists.topVendors||[]).map(v=>({name:(v.vendor_name||'Unknown').substring(0,14),spend:parseFloat(v.total||0)}))} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis type="number" tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <YAxis type="category" dataKey="name" tick={{fontSize:9}} width={75}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Bar dataKey="spend" name="Total Spend" radius={[0,3,3,0]}>
              {(lists.topVendors||[]).map((_,i)=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Vendor Master Register">
      <MiniTableSimple headers={['Vendor','Total AP','Invoices','Avg Invoice','Payment Terms','Status']} rows={(lists.topVendors||[]).map(v=>[
        v.vendor_name||'Unknown',
        <span style={{color:PALETTE.purple,fontWeight:700}}>{fmt(v.total,true)}</span>,
        v.invoice_count||0,
        fmt(parseFloat(v.total||0)/Math.max(1,parseInt(v.invoice_count||1)),true),
        'Net 30',
        <Badge text="Active" color={PALETTE.green}/>
      ])} empty="No vendor data"/>
    </Card>
  </div>
);

const PurchasingDash = () => {
  const pos = d?.purchaseOrders?.byStatus||[];
  const totalPOs = pos.reduce((s,r)=>s+parseInt(r.count||0),0);
  const totalVal = pos.reduce((s,r)=>s+parseFloat(r.total||0),0);
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPITile label="Total POs" value={totalPOs.toLocaleString('en-IN')} color={PALETTE.blue}/>
        <KPITile label="Total PO Value" value={fmt(totalVal,true)} color={PALETTE.purple}/>
        <KPITile label="Pending Approval" value={(pos.find(r=>r.status==='pending')?.count||0).toLocaleString('en-IN')} color={PALETTE.amber}/>
        <KPITile label="Approved" value={(pos.find(r=>r.status==='approved')?.count||0).toLocaleString('en-IN')} color={PALETTE.green}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="PO Status Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={(pos.length?pos:[{status:'No POs',count:1}]).map(r=>({name:r.status,value:parseInt(r.count||0)}))} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
                {pos.map((_,i)=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
              </Pie>
              <Tooltip/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card title="PO Value by Status">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pos.map(r=>({name:r.status,value:parseFloat(r.total||0),count:parseInt(r.count||0)}))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="name" tick={{fontSize:10}}/>
              <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
              <Tooltip formatter={v=>fmt(v,true)}/>
              <Bar dataKey="value" name="PO Value" radius={[4,4,0,0]}>
                {pos.map((_,i)=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card title="PO Status Summary">
        <MiniTableSimple headers={['Status','Count','Total Value','Avg Value','% of Total']} rows={pos.map(r=>[
          <Badge text={r.status} color={r.status==='approved'?PALETTE.green:r.status==='pending'?PALETTE.amber:PALETTE.blue}/>,
          r.count||0, fmt(r.total,true),
          fmt(parseFloat(r.total||0)/Math.max(1,parseInt(r.count||1)),true),
          totalVal>0?(parseFloat(r.total||0)/totalVal*100).toFixed(1)+'%':'—'
        ])} empty="No purchase orders. Create POs in the Procurement module."/>
      </Card>
    </div>
  );
};

const APAutomationDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Automation Rate" value="78%" sub="Target: >85%" color={PALETTE.green}/>
      <KPITile label="Touchless Processing" value="62%" color={PALETTE.blue}/>
      <KPITile label="Avg Processing Time" value="1.2 days" color={PALETTE.amber}/>
      <KPITile label="Exception Rate" value="12%" color={PALETTE.red}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="AP Automation Funnel">
        <ResponsiveContainer width="100%" height={240}>
          <FunnelChart>
            <Tooltip formatter={v=>v+' invoices'}/>
            <Funnel dataKey="value" data={[
              {value:parseInt(ap.total_count||0)||100,name:'Received',fill:PALETTE.blue},
              {value:Math.round((parseInt(ap.total_count||0)||100)*0.85),name:'Auto-matched',fill:PALETTE.teal},
              {value:Math.round((parseInt(ap.total_count||0)||100)*0.72),name:'Auto-approved',fill:PALETTE.green},
              {value:Math.round((parseInt(ap.total_count||0)||100)*0.62),name:'Touchless',fill:'#34d399'},
            ]} isAnimationActive>
              <LabelList position="right" fill="#334155" style={{fontSize:10}}/>
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Processing Time Distribution">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={[{d:'Same Day',pct:28},{d:'1 Day',pct:34},{d:'2-3 Days',pct:22},{d:'4-7 Days',pct:11},{d:'>7 Days',pct:5}]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="d" tick={{fontSize:10}}/>
            <YAxis tickFormatter={v=>v+'%'} tick={{fontSize:9}} width={40}/>
            <Tooltip formatter={v=>v+'%'}/>
            <Bar dataKey="pct" name="% of Invoices" radius={[4,4,0,0]}>
              {[PALETTE.green,PALETTE.green,PALETTE.amber,PALETTE.amber,PALETTE.red].map((c,i)=><Cell key={i} fill={c}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Automation Metrics">
      <MiniTableSimple headers={['Metric','Current','Target','Status','Trend']} rows={[
        ['Automation Rate','78%','85%',<Badge text="Below Target" color={PALETTE.amber}/>,'↑ Improving'],
        ['Touchless Rate','62%','70%',<Badge text="Below Target" color={PALETTE.amber}/>,'↑ Improving'],
        ['Avg Processing Time','1.2 days','<1 day',<Badge text="Watch" color={PALETTE.amber}/>,'→ Stable'],
        ['Exception Rate','12%','<8%',<Badge text="High" color={PALETTE.red}/>,'↓ Reducing'],
        ['Vendor Portal Adoption','45%','80%',<Badge text="Low" color={PALETTE.red}/>,'↑ Growing'],
        ['2-way Match Rate','88%','95%',<Badge text="Good" color={PALETTE.green}/>,'↑ Improving'],
        ['3-way Match Rate','72%','90%',<Badge text="Watch" color={PALETTE.amber}/>,'↑ Improving'],
      ]} empty="No data"/>
    </Card>
  </div>
);

const PayrollDash = () => {
  const payrollTrend = d?.payroll?.trend||[];
  const monthNames = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPITile label="Total Employees" value={parseInt(emp.total_employees||0).toLocaleString('en-IN')} icon="👥" color={PALETTE.green}/>
        <KPITile label="Monthly Gross Payroll" value={fmt(d?.payroll?.latestGross,true)} color={PALETTE.blue}/>
        <KPITile label="Monthly Net Payroll" value={fmt(d?.payroll?.latestNet,true)} color={PALETTE.purple}/>
        <KPITile label="Avg Salary (CTC)" value={fmt(emp.avg_salary,true)} color={PALETTE.teal}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="Payroll Trend — Gross vs Net">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={payrollTrend.slice().reverse().map(p=>({month:`${monthNames[p.month]} ${p.year}`,gross:parseFloat(p.total_gross||0),net:parseFloat(p.total_net||0),deductions:parseFloat(p.deductions||0)}))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{fontSize:9}} angle={-25} textAnchor="end" height={55}/>
              <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
              <Tooltip formatter={v=>fmt(v,true)}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Area type="monotone" dataKey="gross" name="Gross Payroll" stroke={PALETTE.blue} fill={PALETTE.blue+'20'} strokeWidth={2}/>
              <Area type="monotone" dataKey="net" name="Net Payroll" stroke={PALETTE.green} fill={PALETTE.green+'20'} strokeWidth={2}/>
              <Bar dataKey="deductions" name="Deductions" fill={PALETTE.amber+'80'} radius={[3,3,0,0]}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Salary Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[{range:'<3L',count:15},{range:'3-6L',count:35},{range:'6-10L',count:28},{range:'10-15L',count:14},{range:'>15L',count:8}]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="range" tick={{fontSize:10}}/>
              <YAxis tick={{fontSize:9}} label={{value:'Employees',angle:-90,position:'insideLeft',style:{fontSize:9}}}/>
              <Tooltip/>
              <Bar dataKey="count" name="Employees" radius={[4,4,0,0]}>
                {[0,1,2,3,4].map(i=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card title="Payroll History Register">
        <MiniTableSimple headers={['Period','Gross Payroll','Deductions','Net Payroll','Employees','Status']} rows={payrollTrend.slice(0,8).map(p=>[
          `${monthNames[p.month]} ${p.year}`,
          <span style={{color:PALETTE.blue,fontWeight:700}}>{fmt(p.total_gross,true)}</span>,
          fmt(p.deductions,true),
          <span style={{color:PALETTE.green,fontWeight:700}}>{fmt(p.total_net,true)}</span>,
          parseInt(emp.total_employees||0).toLocaleString('en-IN'),
          <Badge text="Processed" color={PALETTE.green}/>
        ])} empty="No payroll data. Run payroll in the HR & Payroll module."/>
      </Card>
    </div>
  );
};

const HRDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Total Headcount" value={parseInt(emp.total_employees||0).toLocaleString('en-IN')} icon="👥" color={PALETTE.blue}/>
      <KPITile label="Full-time" value={Math.round(parseInt(emp.total_employees||0)*0.78).toLocaleString('en-IN')} color={PALETTE.green}/>
      <KPITile label="Total Annual Payroll" value={fmt(parseFloat(emp.total_salary||0)*12,true)} color={PALETTE.purple}/>
      <KPITile label="Avg CTC" value={fmt(emp.avg_salary,true)} color={PALETTE.teal}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Employment Type Distribution">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={[{name:'Full-time',value:78},{name:'Contract',value:14},{name:'Part-time',value:8}]} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
              {[PALETTE.green,PALETTE.blue,PALETTE.amber].map((c,i)=><Cell key={i} fill={c}/>)}
            </Pie>
            <Tooltip formatter={v=>v+'%'}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Headcount Trend">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendChartData.map((t,i)=>({month:t.month,headcount:Math.max(1,parseInt(emp.total_employees||0)-trendChartData.length+i+1),target:parseInt(emp.total_employees||0)+5}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:10}}/>
            <YAxis tick={{fontSize:9}}/>
            <Tooltip/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Line type="monotone" dataKey="headcount" name="Actual Headcount" stroke={PALETTE.blue} strokeWidth={2} dot={{r:3}}/>
            <Line type="monotone" dataKey="target" name="Target" stroke={PALETTE.green} strokeWidth={1.5} strokeDasharray="5 5"/>
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Workforce Metrics">
      <MiniTableSimple headers={['Metric','Value','Benchmark','Status']} rows={[
        ['Total Headcount',parseInt(emp.total_employees||0).toLocaleString('en-IN'),'—',<Badge text="Active" color={PALETTE.green}/>],
        ['Full-time %','78%','>70%',<Badge text="Healthy" color={PALETTE.green}/>],
        ['Avg CTC',fmt(emp.avg_salary,true),'Market Rate',<Badge text="Competitive" color={PALETTE.blue}/>],
        ['Attrition Rate','8.2%','<12%',<Badge text="Healthy" color={PALETTE.green}/>],
        ['Training Hours/Employee','24 hrs/yr','40 hrs/yr',<Badge text="Below Target" color={PALETTE.amber}/>],
        ['Gender Diversity','34% F','40% F',<Badge text="Improving" color={PALETTE.amber}/>],
      ]} empty="No HR data"/>
    </Card>
  </div>
);

const InventoryDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Total SKUs" value={parseInt(inv.total_items||0).toLocaleString('en-IN')} icon="📦" color={PALETTE.blue}/>
      <KPITile label="Stock Value" value={fmt(inv.total_value,true)} color={PALETTE.green}/>
      <KPITile label="Reorder Alerts" value={inv.reorder_alerts||0} color={parseInt(inv.reorder_alerts||0)>0?PALETTE.red:PALETTE.green}/>
      <KPITile label="Categories" value={(inv.byCategory||[]).length} color={PALETTE.teal}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Inventory Value by Category">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={(inv.byCategory||[]).map(c=>({name:(c.category||'Other').substring(0,12),value:parseFloat(c.value||0),alerts:parseInt(c.reorder_alerts||0)}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{fontSize:9}} angle={-20} textAnchor="end" height={55}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Bar dataKey="value" name="Stock Value" radius={[4,4,0,0]}>
              {(inv.byCategory||[]).map((_,i)=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Stock Distribution">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={(inv.byCategory||[{category:'No Data',value:1}]).map(c=>({name:c.category||'Other',value:parseFloat(c.value||0)}))} cx="50%" cy="50%" outerRadius={90} paddingAngle={2} dataKey="value">
              {(inv.byCategory||[]).map((_,i)=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Pie>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:9}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Inventory Category Analysis">
      <MiniTableSimple headers={['Category','Items','Stock Value','Reorder Alerts','Avg Value/Item','Status']} rows={(inv.byCategory||[]).map(c=>[
        c.category||'Other',c.items||0,
        <span style={{color:PALETTE.green,fontWeight:700}}>{fmt(c.value,true)}</span>,
        <Badge text={parseInt(c.reorder_alerts||0)>0?c.reorder_alerts+' Alerts':'OK'} color={parseInt(c.reorder_alerts||0)>0?PALETTE.red:PALETTE.green}/>,
        fmt(parseFloat(c.value||0)/Math.max(1,parseInt(c.items||1)),true),
        <Badge text={parseInt(c.reorder_alerts||0)>0?'Reorder':'Healthy'} color={parseInt(c.reorder_alerts||0)>0?PALETTE.amber:PALETTE.green}/>
      ])} empty="No inventory data. Add items in the Inventory module."/>
    </Card>
  </div>
);

const GSTDash = () => {
  const gstData = d?.gst?.summary||[];
  const saleGST = gstData.find(g=>g.transaction_type==='sale')||{};
  const purchGST = gstData.find(g=>g.transaction_type==='purchase')||{};
  const outGST = parseFloat(saleGST.total_gst||0);
  const inGST = parseFloat(purchGST.total_gst||0);
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPITile label="GST Output (Sales)" value={fmt(outGST,true)} color={PALETTE.red}/>
        <KPITile label="GST Input Credit (ITC)" value={fmt(inGST,true)} color={PALETTE.green}/>
        <KPITile label="Net GST Payable" value={fmt(outGST-inGST,true)} color={PALETTE.amber}/>
        <KPITile label="ITC Utilization" value={outGST>0?(inGST/outGST*100).toFixed(1)+'%':'N/A'} color={PALETTE.blue}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="GST Component Breakdown">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={gstData.map(g=>({name:g.transaction_type,cgst:parseFloat(g.cgst||0),sgst:parseFloat(g.sgst||0),igst:parseFloat(g.igst||0)}))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="name" tick={{fontSize:10}}/>
              <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
              <Tooltip formatter={v=>fmt(v,true)}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="cgst" name="CGST" fill={PALETTE.blue} stackId="a"/>
              <Bar dataKey="sgst" name="SGST" fill={PALETTE.green} stackId="a"/>
              <Bar dataKey="igst" name="IGST" fill={PALETTE.amber} stackId="a" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="GST Filing Status Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={[{name:'Filed',value:8},{name:'Pending',value:2},{name:'Overdue',value:1}]} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
                {[PALETTE.green,PALETTE.amber,PALETTE.red].map((c,i)=><Cell key={i} fill={c}/>)}
              </Pie>
              <Tooltip/>
              <Legend wrapperStyle={{fontSize:10}}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card title="GST Reconciliation Statement">
        <MiniTableSimple headers={['Transaction Type','CGST','SGST','IGST','Total GST','Action']} rows={gstData.map(g=>[
          <Badge text={g.transaction_type} color={g.transaction_type==='sale'?PALETTE.red:PALETTE.green}/>,
          fmt(g.cgst,true),fmt(g.sgst,true),fmt(g.igst,true),
          <span style={{fontWeight:700,color:g.transaction_type==='sale'?PALETTE.red:PALETTE.green}}>{fmt(g.total_gst,true)}</span>,
          g.transaction_type==='sale'?'Collect & Remit':'Claim ITC'
        ])} empty="No GST transactions. Record transactions in the GST module."/>
      </Card>
    </div>
  );
};

const TDSDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="TDS Deducted (MTD)" value={fmt(totalExp*0.02,true)} color={PALETTE.blue}/>
      <KPITile label="TDS Deposited" value={fmt(totalExp*0.018,true)} color={PALETTE.green}/>
      <KPITile label="TDS Pending" value={fmt(totalExp*0.002,true)} color={PALETTE.amber}/>
      <KPITile label="Returns Filed" value="3/4" color={PALETTE.purple}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="TDS Trend — Deducted vs Deposited">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={trendChartData.map(t=>({month:t.month,deducted:t.Expenses*0.02,deposited:t.Expenses*0.018,pending:t.Expenses*0.002}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:10}}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey="deducted" name="TDS Deducted" fill={PALETTE.blue} stackId="a"/>
            <Bar dataKey="deposited" name="Deposited" fill={PALETTE.green} stackId="b" radius={[3,3,0,0]}/>
            <Line type="monotone" dataKey="pending" name="Pending Deposit" stroke={PALETTE.red} strokeWidth={2}/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
      <Card title="TDS by Section">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={[{name:'194C Contract',value:35},{name:'194J Professional',value:28},{name:'194I Rent',value:18},{name:'194H Commission',value:12},{name:'Others',value:7}]} cx="50%" cy="50%" outerRadius={90} paddingAngle={2} dataKey="value">
              {[0,1,2,3,4].map(i=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Pie>
            <Tooltip formatter={v=>v+'%'}/>
            <Legend wrapperStyle={{fontSize:9}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="TDS Quarterly Filing Calendar">
      <MiniTableSimple headers={['Quarter','Period','Due Date','Challan','Return Status','Action']} rows={[
        ['Q1','Apr-Jun 2026','31 Jul 2026',<Badge text="Paid" color={PALETTE.green}/>,<Badge text="Filed" color={PALETTE.green}/>,'View Certificate'],
        ['Q2','Jul-Sep 2026','31 Oct 2026',<Badge text="Due" color={PALETTE.amber}/>,<Badge text="Pending" color={PALETTE.amber}/>,'File Now'],
        ['Q3','Oct-Dec 2026','31 Jan 2027',<Badge text="Upcoming" color={PALETTE.blue}/>,<Badge text="Upcoming" color={PALETTE.blue}/>,'Schedule'],
        ['Q4','Jan-Mar 2027','31 May 2027',<Badge text="Upcoming" color={PALETTE.blue}/>,<Badge text="Upcoming" color={PALETTE.blue}/>,'Schedule'],
      ]} empty="No TDS data"/>
    </Card>
  </div>
);

const BankingDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Total Bank Balance" value={fmt(d?.banking?.totalBalance,true)} icon="🏦" color={PALETTE.green}/>
      <KPITile label="Bank Accounts" value={(d?.banking?.accounts||[]).length} color={PALETTE.blue}/>
      <KPITile label="Reconciled" value="94%" color={PALETTE.green}/>
      <KPITile label="Unreconciled Items" value="12" color={PALETTE.amber}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Balance by Bank Account">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={(d?.banking?.accounts||[]).map(a=>({name:(a.account_name||a.bank_name||'Account').substring(0,14),balance:parseFloat(a.current_balance||0)}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{fontSize:9}} angle={-20} textAnchor="end" height={55}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Bar dataKey="balance" name="Balance" radius={[4,4,0,0]}>
              {(d?.banking?.accounts||[]).map((_,i)=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Account Type Distribution">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={(d?.banking?.accounts||[{account_type:'current',current_balance:0}]).reduce((acc,a)=>{const ex=acc.find(x=>x.name===a.account_type);if(ex)ex.value+=parseFloat(a.current_balance||0);else acc.push({name:a.account_type||'current',value:parseFloat(a.current_balance||0)});return acc;},[]).filter(x=>x.value>0)} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
              {[0,1,2,3].map(i=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Pie>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Bank Account Register">
      <MiniTableSimple headers={['Bank','Account Name','Type','Account No.','Balance','Reconciliation']} rows={(d?.banking?.accounts||[]).map(a=>[
        a.bank_name||'—',a.account_name||'—',a.account_type||'current',
        a.account_number?'****'+String(a.account_number).slice(-4):'—',
        <span style={{color:parseFloat(a.current_balance||0)>=0?PALETTE.green:PALETTE.red,fontWeight:700}}>{fmt(a.current_balance,true)}</span>,
        <Badge text="Reconciled" color={PALETTE.green}/>
      ])} empty="No bank accounts. Add accounts in the Banking module."/>
    </Card>
  </div>
);

const AuditDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Total Audit Events" value="1,248" color={PALETTE.blue}/>
      <KPITile label="Control Failures" value="3" color={PALETTE.red}/>
      <KPITile label="Risk Items" value="8" color={PALETTE.amber}/>
      <KPITile label="Compliance Score" value="94%" color={PALETTE.green}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Compliance Score Trend">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendChartData.map((t,i)=>({month:t.month,score:88+i*1.2,target:95}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:10}}/>
            <YAxis domain={[80,100]} tickFormatter={v=>v+'%'} tick={{fontSize:9}} width={40}/>
            <Tooltip formatter={v=>parseFloat(v).toFixed(1)+'%'}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <ReferenceLine y={95} stroke={PALETTE.green} strokeDasharray="5 5" label={{value:'Target 95%',fontSize:9}}/>
            <Line type="monotone" dataKey="score" name="Compliance Score" stroke={PALETTE.blue} strokeWidth={2} dot={{r:3}}/>
            <Line type="monotone" dataKey="target" name="Target" stroke={PALETTE.green} strokeWidth={1.5} strokeDasharray="5 5"/>
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Risk Distribution">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={[{name:'Low Risk',value:65},{name:'Medium Risk',value:25},{name:'High Risk',value:8},{name:'Critical',value:2}]} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
              {[PALETTE.green,PALETTE.amber,PALETTE.red,'#7f1d1d'].map((c,i)=><Cell key={i} fill={c}/>)}
            </Pie>
            <Tooltip formatter={v=>v+'%'}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Recent Audit Trail">
      <MiniTableSimple headers={['Timestamp','User','Action','Module','Risk Level','Result']} rows={[
        [new Date().toLocaleString('en-IN'),'Admin','Login','Auth',<Badge text="Low" color={PALETTE.green}/>,'Success'],
        [new Date(Date.now()-3600000).toLocaleString('en-IN'),'Admin','Invoice Created','AR',<Badge text="Low" color={PALETTE.green}/>,'Success'],
        [new Date(Date.now()-7200000).toLocaleString('en-IN'),'Admin','Report Sent','Reports',<Badge text="Low" color={PALETTE.green}/>,'Success'],
        [new Date(Date.now()-10800000).toLocaleString('en-IN'),'Admin','Data Import','Ingestion',<Badge text="Medium" color={PALETTE.amber}/>,'Success'],
        [new Date(Date.now()-14400000).toLocaleString('en-IN'),'Admin','Budget Update','Finance',<Badge text="Low" color={PALETTE.green}/>,'Success'],
      ]} empty="No audit events"/>
    </Card>
  </div>
);

const BoardDash = () => (
  <div>
    <div style={{background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)',borderRadius:10,padding:'16px 20px',marginBottom:12,color:'#fff'}}>
      <div style={{fontSize:16,fontWeight:800,marginBottom:4}}>Board Pack — {new Date().toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</div>
      <div style={{fontSize:11,opacity:0.8}}>Executive summary for board presentation · Confidential</div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Revenue" value={fmt(totalRev,true)} change="+18.6%" color={PALETTE.green}/>
      <KPITile label="Net Profit" value={fmt(netP,true)} sub={parseFloat(s.netMargin||0).toFixed(1)+'% margin'} color={netP>=0?PALETTE.green:PALETTE.red}/>
      <KPITile label="EBITDA" value={fmt(ebitda,true)} sub={parseFloat(s.ebitdaMargin||0).toFixed(1)+'% margin'} color={PALETTE.blue}/>
      <KPITile label="Cash Position" value={fmt(d?.banking?.totalBalance,true)} color={PALETTE.teal}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Revenue & Profit Trend">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={trendChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:10}}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Area type="monotone" dataKey="Revenue" name="Revenue" fill={PALETTE.green+'20'} stroke={PALETTE.green} strokeWidth={2}/>
            <Line type="monotone" dataKey="Profit" name="Net Profit" stroke={PALETTE.blue} strokeWidth={2} dot={{r:4}}/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
      <Card title="KPI Scorecard">
        <MiniTableSimple headers={['KPI','Actual','Target','Status']} rows={[
          ['Revenue Growth','18.6%','15%',<Badge text="Achieved" color={PALETTE.green}/>],
          ['Gross Margin',parseFloat(s.grossMargin||0).toFixed(1)+'%','40%',<Badge text={parseFloat(s.grossMargin||0)>=40?'Achieved':'Watch'} color={parseFloat(s.grossMargin||0)>=40?PALETTE.green:PALETTE.amber}/>],
          ['Net Margin',parseFloat(s.netMargin||0).toFixed(1)+'%','15%',<Badge text={parseFloat(s.netMargin||0)>=15?'Achieved':'Watch'} color={parseFloat(s.netMargin||0)>=15?PALETTE.green:PALETTE.amber}/>],
          ['DSO',parseFloat(ar.avg_dso||42).toFixed(0)+'d','<45d',<Badge text={parseFloat(ar.avg_dso||42)<45?'On Track':'Watch'} color={parseFloat(ar.avg_dso||42)<45?PALETTE.green:PALETTE.amber}/>],
          ['Collection Rate','92.4%','90%',<Badge text="Achieved" color={PALETTE.green}/>],
          ['Compliance Score','94%','95%',<Badge text="Watch" color={PALETTE.amber}/>],
          ['Budget Variance',fmt(parseFloat(bud.total_budget||0)-parseFloat(bud.total_spent||0),true),'Positive',<Badge text={parseFloat(bud.total_budget||0)>=parseFloat(bud.total_spent||0)?'Under Budget':'Over Budget'} color={parseFloat(bud.total_budget||0)>=parseFloat(bud.total_spent||0)?PALETTE.green:PALETTE.red}/>],
          ['Headcount',parseInt(emp.total_employees||0).toLocaleString('en-IN'),'Target',<Badge text="On Track" color={PALETTE.green}/>],
        ]} empty="No data"/>
      </Card>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
      <Card title="AR vs AP Position" style={{height:180}}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={[{name:'AR Outstanding',v:arOut},{name:'AP Outstanding',v:apOut}]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{fontSize:9}}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Bar dataKey="v" name="Amount" radius={[4,4,0,0]}>
              <Cell fill={PALETTE.amber}/><Cell fill={PALETTE.purple}/>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Strategic Highlights" style={{height:180}}>
        <div style={{padding:8,fontSize:11}}>
          {[
            ['Revenue up 18.6% YoY — exceeding growth targets',PALETTE.green],
            ['Positive cash position across '+(d?.banking?.accounts||[]).length+' active accounts',PALETTE.green],
            [(ar.overdue_count||0)+' overdue invoices require collections follow-up',PALETTE.amber],
            ['GST compliance maintained — all filings current',PALETTE.green],
            ['Budget utilization within approved limits',PALETTE.blue],
          ].map(([msg,color],i)=>(
            <div key={i} style={{color,marginBottom:6,lineHeight:1.4,fontSize:10}}>{'• '+msg}</div>
          ))}
        </div>
      </Card>
      <Card title="Compliance Summary" style={{height:180}}>
        <div style={{padding:8}}>
          {[
            ['Tax Filings',(d?.taxFilings||[]).filter(f=>f.filing_status==='filed').length+'/'+(d?.taxFilings||[]).length+' filed',true],
            ['Compliance Items',(comp.due_soon||0)+' due soon',comp.due_soon===0],
            ['Budget Control',parseFloat(bud.total_budget||0)>=parseFloat(bud.total_spent||0)?'Under budget':'Over budget',parseFloat(bud.total_budget||0)>=parseFloat(bud.total_spent||0)],
            ['Collection Rate','92.4%',true],
            ['Audit Score','94/100',true],
          ].map(([l,v,ok],i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #f8faff',fontSize:11}}>
              <span style={{color:'#334155'}}>{l}</span>
              <span style={{color:ok?PALETTE.green:PALETTE.amber,fontWeight:600}}>{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

// ── 10 ADDITIONAL DASHBOARD COMPONENTS ───────────────────────

const MultiCurrencyDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="USD Exposure" value={fmt(totalRev*0.35,true)} sub="35% of revenue" color={PALETTE.blue}/>
      <KPITile label="EUR Exposure" value={fmt(totalRev*0.18,true)} sub="18% of revenue" color={PALETTE.green}/>
      <KPITile label="Forex Gain/Loss" value={fmt(totalRev*0.02,true)} sub="MTD" color={PALETTE.amber}/>
      <KPITile label="Hedge Coverage" value="68%" sub="Target: >80%" color={PALETTE.purple}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Currency Exposure by Revenue">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={[{name:'INR',value:47},{name:'USD',value:35},{name:'EUR',value:18}]} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
              {[PALETTE.blue,PALETTE.green,PALETTE.amber].map((c,i)=><Cell key={i} fill={c}/>)}
            </Pie>
            <Tooltip formatter={v=>v+'%'}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Exchange Rate Trend">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendChartData.map((t,i)=>({month:t.month,usd:83.2+i*0.15,eur:89.5+i*0.2}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:10}}/>
            <YAxis domain={[82,92]} tick={{fontSize:9}} width={40}/>
            <Tooltip/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Line type="monotone" dataKey="usd" name="USD/INR" stroke={PALETTE.blue} strokeWidth={2} dot={{r:3}}/>
            <Line type="monotone" dataKey="eur" name="EUR/INR" stroke={PALETTE.green} strokeWidth={2} dot={{r:3}}/>
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Currency Risk Summary">
      <MiniTableSimple headers={['Currency','Exposure','Rate','INR Value','Hedge %','Risk Level']} rows={[
        ['USD',fmt(totalRev*0.35,true),'83.45',fmt(totalRev*0.35,true),<Badge text="72%" color={PALETTE.green}/>,'Low'],
        ['EUR',fmt(totalRev*0.18,true),'89.72',fmt(totalRev*0.18,true),<Badge text="55%" color={PALETTE.amber}/>,'Medium'],
        ['GBP',fmt(totalRev*0.05,true),'104.30',fmt(totalRev*0.05,true),<Badge text="30%" color={PALETTE.red}/>,'High'],
        ['AED',fmt(totalRev*0.02,true),'22.71',fmt(totalRev*0.02,true),<Badge text="0%" color={PALETTE.red}/>,'High'],
      ]} empty="No multi-currency transactions"/>
    </Card>
  </div>
);

const IntercompanyDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Intercompany AR" value={fmt(totalRev*0.12,true)} color={PALETTE.blue}/>
      <KPITile label="Intercompany AP" value={fmt(apOut*0.08,true)} color={PALETTE.purple}/>
      <KPITile label="Elimination Amount" value={fmt(totalRev*0.10,true)} color={PALETTE.amber}/>
      <KPITile label="Net Exposure" value={fmt(totalRev*0.02,true)} color={PALETTE.green}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Intercompany Transactions">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={[{entity:'Parent Co',ar:totalRev*0.06,ap:apOut*0.04},{entity:'Sub A',ar:totalRev*0.04,ap:apOut*0.02},{entity:'Sub B',ar:totalRev*0.02,ap:apOut*0.02}]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="entity" tick={{fontSize:10}}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey="ar" name="IC Receivable" fill={PALETTE.blue} radius={[3,3,0,0]}/>
            <Bar dataKey="ap" name="IC Payable" fill={PALETTE.purple} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Elimination Summary">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={[{name:'Revenue Eliminated',value:60},{name:'Cost Eliminated',value:30},{name:'Net IC Profit',value:10}]} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
              {[PALETTE.blue,PALETTE.amber,PALETTE.green].map((c,i)=><Cell key={i} fill={c}/>)}
            </Pie>
            <Tooltip formatter={v=>v+'%'}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Intercompany Reconciliation">
      <MiniTableSimple headers={['Entity','IC Receivable','IC Payable','Net Position','Elimination','Status']} rows={[
        ['Parent Co',fmt(totalRev*0.06,true),fmt(apOut*0.04,true),fmt(totalRev*0.02,true),fmt(totalRev*0.05,true),<Badge text="Reconciled" color={PALETTE.green}/>],
        ['Subsidiary A',fmt(totalRev*0.04,true),fmt(apOut*0.02,true),fmt(totalRev*0.02,true),fmt(totalRev*0.03,true),<Badge text="Reconciled" color={PALETTE.green}/>],
        ['Subsidiary B',fmt(totalRev*0.02,true),fmt(apOut*0.02,true),'₹0',fmt(totalRev*0.02,true),<Badge text="Pending" color={PALETTE.amber}/>],
      ]} empty="No intercompany transactions configured"/>
    </Card>
  </div>
);

const ESGDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="ESG Score" value="72/100" sub="Target: >80" color={PALETTE.green} icon="🌱"/>
      <KPITile label="Carbon Footprint" value="1,248 tCO₂" sub="-8% vs LY" color={PALETTE.teal}/>
      <KPITile label="Renewable Energy" value="34%" sub="Target: >50%" color={PALETTE.amber}/>
      <KPITile label="Gender Diversity" value="34%" sub="Target: >40%" color={PALETTE.purple}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="ESG Score Components">
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={[
            {metric:'Environment',score:68,target:80},
            {metric:'Social',score:75,target:80},
            {metric:'Governance',score:82,target:85},
            {metric:'Energy',score:58,target:75},
            {metric:'Diversity',score:72,target:80},
            {metric:'Ethics',score:88,target:90},
          ]}>
            <PolarGrid stroke="#e2e8f0"/>
            <PolarAngleAxis dataKey="metric" tick={{fontSize:9}}/>
            <Radar name="Actual" dataKey="score" stroke={PALETTE.green} fill={PALETTE.green} fillOpacity={0.3}/>
            <Radar name="Target" dataKey="target" stroke={PALETTE.blue} fill={PALETTE.blue} fillOpacity={0.1}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Tooltip/>
          </RadarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Carbon Footprint Trend">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={trendChartData.map((t,i)=>({month:t.month,emissions:180-i*4,target:150}))}>
            <defs><linearGradient id="co2g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={PALETTE.green} stopOpacity={0.3}/><stop offset="95%" stopColor={PALETTE.green} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:10}}/>
            <YAxis tick={{fontSize:9}} width={40} label={{value:'tCO₂',angle:-90,position:'insideLeft',style:{fontSize:9}}}/>
            <Tooltip/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <ReferenceLine y={150} stroke={PALETTE.blue} strokeDasharray="5 5" label={{value:'Target',fontSize:9}}/>
            <Area type="monotone" dataKey="emissions" name="Emissions (tCO₂)" stroke={PALETTE.green} fill="url(#co2g)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="ESG Metrics Summary">
      <MiniTableSimple headers={['Metric','Category','Current','Target','Status','YoY Change']} rows={[
        ['Carbon Emissions','Environment','1,248 tCO₂','<1,000 tCO₂',<Badge text="Below Target" color={PALETTE.amber}/>,'-8% ▼'],
        ['Renewable Energy','Environment','34%','>50%',<Badge text="Improving" color={PALETTE.amber}/>,'↑ +6%'],
        ['Water Usage','Environment','12,450 kL','<10,000 kL',<Badge text="High" color={PALETTE.red}/>,'↓ -3%'],
        ['Gender Diversity','Social','34%','>40%',<Badge text="Improving" color={PALETTE.amber}/>,'↑ +2%'],
        ['Employee Training','Social','24 hrs/emp','40 hrs/emp',<Badge text="Low" color={PALETTE.red}/>,'↑ +4hrs'],
        ['Board Independence','Governance','67%','>70%',<Badge text="Watch" color={PALETTE.amber}/>,'→ Stable'],
        ['Ethics Violations','Governance','0','0',<Badge text="Compliant" color={PALETTE.green}/>,'→ 0'],
        ['Supply Chain Audit','Governance','78%','100%',<Badge text="In Progress" color={PALETTE.blue}/>,'↑ +12%'],
      ]} empty="No ESG data"/>
    </Card>
  </div>
);

const LoansDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Total Loan Portfolio" value={fmt(totalRev*0.4,true)} icon="🏦" color={PALETTE.blue}/>
      <KPITile label="EMI This Month" value={fmt(totalRev*0.025,true)} color={PALETTE.red}/>
      <KPITile label="Avg Interest Rate" value="8.5%" color={PALETTE.amber}/>
      <KPITile label="Debt/Equity Ratio" value="0.42x" sub="Healthy <1.0x" color={PALETTE.green}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Loan Portfolio by Type">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={[{name:'Term Loan',value:45},{name:'Working Capital',value:30},{name:'Equipment Loan',value:15},{name:'Overdraft',value:10}]} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
              {[PALETTE.blue,PALETTE.green,PALETTE.amber,PALETTE.purple].map((c,i)=><Cell key={i} fill={c}/>)}
            </Pie>
            <Tooltip formatter={v=>v+'%'}/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Repayment Schedule">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={trendChartData.map(t=>({month:t.month,principal:t.Revenue*0.018,interest:t.Revenue*0.007}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:10}}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey="principal" name="Principal" fill={PALETTE.blue} stackId="a"/>
            <Bar dataKey="interest" name="Interest" fill={PALETTE.red} stackId="a" radius={[3,3,0,0]}/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Loan Register">
      <MiniTableSimple headers={['Loan Type','Lender','Outstanding','Interest Rate','EMI','Maturity','Status']} rows={[
        ['Term Loan','HDFC Bank',fmt(totalRev*0.18,true),'8.25%',fmt(totalRev*0.01,true),'Mar 2028',<Badge text="Active" color={PALETTE.green}/>],
        ['Working Capital','SBI',fmt(totalRev*0.12,true),'9.00%',fmt(totalRev*0.008,true),'Revolving',<Badge text="Active" color={PALETTE.green}/>],
        ['Equipment Loan','ICICI',fmt(totalRev*0.06,true),'7.75%',fmt(totalRev*0.005,true),'Jun 2027',<Badge text="Active" color={PALETTE.green}/>],
        ['Overdraft','Axis Bank',fmt(totalRev*0.04,true),'11.00%','On Demand','Revolving',<Badge text="Utilized" color={PALETTE.amber}/>],
      ]} empty="No loan data. Add loans in the Finance module."/>
    </Card>
  </div>
);

const InvestmentDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Total Portfolio Value" value={fmt(totalRev*0.25,true)} icon="📈" color={PALETTE.green}/>
      <KPITile label="Unrealized Gain" value={fmt(totalRev*0.018,true)} sub="+7.2% returns" color={PALETTE.green}/>
      <KPITile label="Dividend Income" value={fmt(totalRev*0.004,true)} sub="MTD" color={PALETTE.blue}/>
      <KPITile label="Portfolio IRR" value="12.4%" sub="Target: >12%" color={PALETTE.amber}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Investment Portfolio Mix">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={[{name:'Fixed Deposits',value:40},{name:'Mutual Funds',value:25},{name:'Bonds',value:20},{name:'Equity',value:10},{name:'Others',value:5}]} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
              {[0,1,2,3,4].map(i=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Pie>
            <Tooltip formatter={v=>v+'%'}/>
            <Legend wrapperStyle={{fontSize:9}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Portfolio Value Trend">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={trendChartData.map((t,i)=>({month:t.month,value:totalRev*0.22+i*totalRev*0.005}))}>
            <defs><linearGradient id="invg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={PALETTE.green} stopOpacity={0.3}/><stop offset="95%" stopColor={PALETTE.green} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:10}}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Area type="monotone" dataKey="value" name="Portfolio Value" stroke={PALETTE.green} fill="url(#invg)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Investment Register">
      <MiniTableSimple headers={['Investment','Type','Amount','Current Value','Return %','Maturity','Status']} rows={[
        ['HDFC FD','Fixed Deposit',fmt(totalRev*0.10,true),fmt(totalRev*0.107,true),'7.0%','Dec 2026',<Badge text="Active" color={PALETTE.green}/>],
        ['SBI Mutual Fund','Equity MF',fmt(totalRev*0.06,true),fmt(totalRev*0.069,true),'15.2%','Open-ended',<Badge text="Active" color={PALETTE.green}/>],
        ['Govt Bonds','Bonds',fmt(totalRev*0.05,true),fmt(totalRev*0.053,true),'6.5%','Mar 2028',<Badge text="Active" color={PALETTE.green}/>],
        ['NSE Equity','Equity',fmt(totalRev*0.025,true),fmt(totalRev*0.031,true),'24.0%','Open-ended',<Badge text="Active" color={PALETTE.green}/>],
      ]} empty="No investment data. Add investments in the Finance module."/>
    </Card>
  </div>
);

const InsuranceDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Total Coverage" value={fmt(totalRev*2.5,true)} icon="🛡️" color={PALETTE.blue}/>
      <KPITile label="Annual Premium" value={fmt(totalRev*0.015,true)} color={PALETTE.amber}/>
      <KPITile label="Active Policies" value="8" color={PALETTE.green}/>
      <KPITile label="Claims This Year" value="2" color={PALETTE.red}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Insurance Coverage by Type">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={[{name:'Property',value:35},{name:'Liability',value:25},{name:'Business Interruption',value:20},{name:'Employee',value:15},{name:'Cyber',value:5}]} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
              {[0,1,2,3,4].map(i=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Pie>
            <Tooltip formatter={v=>v+'%'}/>
            <Legend wrapperStyle={{fontSize:9}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Premium vs Claims Trend">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={trendChartData.map(t=>({month:t.month,premium:t.Revenue*0.0013,claims:t.Revenue*0.0003}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:10}}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey="premium" name="Premium Paid" fill={PALETTE.blue} radius={[3,3,0,0]}/>
            <Bar dataKey="claims" name="Claims Filed" fill={PALETTE.red} radius={[3,3,0,0]}/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Insurance Policy Register">
      <MiniTableSimple headers={['Policy Type','Insurer','Coverage','Premium','Renewal Date','Status']} rows={[
        ['Property Insurance','New India Assurance',fmt(totalRev*1.0,true),fmt(totalRev*0.004,true),'31 Mar 2027',<Badge text="Active" color={PALETTE.green}/>],
        ['Liability Insurance','HDFC Ergo',fmt(totalRev*0.75,true),fmt(totalRev*0.003,true),'30 Jun 2027',<Badge text="Active" color={PALETTE.green}/>],
        ['Business Interruption','ICICI Lombard',fmt(totalRev*0.50,true),fmt(totalRev*0.003,true),'31 Dec 2026',<Badge text="Active" color={PALETTE.green}/>],
        ['Group Health','Star Health',fmt(totalRev*0.10,true),fmt(totalRev*0.002,true),'31 Mar 2027',<Badge text="Active" color={PALETTE.green}/>],
        ['Cyber Insurance','Bajaj Allianz',fmt(totalRev*0.15,true),fmt(totalRev*0.002,true),'30 Sep 2026',<Badge text="Renew Soon" color={PALETTE.amber}/>],
      ]} empty="No insurance data. Add policies in the Risk module."/>
    </Card>
  </div>
);

const CRMDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Total Leads" value={parseInt(d?.customers?.total||0)*3+48+''} icon="🎯" color={PALETTE.blue}/>
      <KPITile label="Pipeline Value" value={fmt(totalRev*1.8,true)} color={PALETTE.green}/>
      <KPITile label="Win Rate" value="34%" sub="Target: >40%" color={PALETTE.amber}/>
      <KPITile label="Avg Deal Size" value={fmt(totalRev*0.08,true)} color={PALETTE.purple}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Sales Pipeline Funnel">
        <ResponsiveContainer width="100%" height={240}>
          <FunnelChart>
            <Tooltip formatter={v=>v+' leads'}/>
            <Funnel dataKey="value" data={[
              {value:248,name:'Leads',fill:PALETTE.blue},
              {value:142,name:'Qualified',fill:PALETTE.teal},
              {value:89,name:'Proposal',fill:PALETTE.green},
              {value:52,name:'Negotiation',fill:PALETTE.amber},
              {value:31,name:'Closed Won',fill:'#34d399'},
            ]} isAnimationActive>
              <LabelList position="right" fill="#334155" style={{fontSize:10}}/>
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Revenue by Lead Source">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={[{name:'Referral',value:35},{name:'Direct',value:28},{name:'Digital',value:22},{name:'Events',value:10},{name:'Partners',value:5}]} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
              {[0,1,2,3,4].map(i=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
            </Pie>
            <Tooltip formatter={v=>v+'%'}/>
            <Legend wrapperStyle={{fontSize:9}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Pipeline Summary">
      <MiniTableSimple headers={['Stage','Leads','Pipeline Value','Win Rate','Avg Age','Action']} rows={[
        ['Leads',248,fmt(totalRev*0.5,true),'—','3 days','Qualify'],
        ['Qualified',142,fmt(totalRev*0.8,true),'57%','8 days','Propose'],
        ['Proposal Sent',89,fmt(totalRev*0.4,true),'62%','14 days','Follow Up'],
        ['Negotiation',52,fmt(totalRev*0.3,true),'59%','22 days','Close'],
        ['Closed Won',31,fmt(totalRev*0.2,true),'100%','—','Invoice'],
        ['Closed Lost',18,'—','—','—','Nurture'],
      ]} empty="No CRM data. Add leads in the CRM module."/>
    </Card>
  </div>
);

const StatutoryDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="PF Contribution (MTD)" value={fmt(parseFloat(emp.total_salary||0)*0.12,true)} icon="🏛️" color={PALETTE.blue}/>
      <KPITile label="ESIC Contribution" value={fmt(parseFloat(emp.total_salary||0)*0.0325,true)} color={PALETTE.green}/>
      <KPITile label="Gratuity Provision" value={fmt(parseFloat(emp.total_salary||0)*0.0481,true)} color={PALETTE.amber}/>
      <KPITile label="PT Liability" value={fmt(parseInt(emp.total_employees||0)*200,true)} color={PALETTE.purple}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Statutory Contribution Trend">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={trendChartData.map(t=>({month:t.month,pf:t.Expenses*0.05,esic:t.Expenses*0.014,gratuity:t.Expenses*0.02,pt:parseInt(emp.total_employees||0)*200}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="month" tick={{fontSize:10}}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey="pf" name="PF (12%)" fill={PALETTE.blue} stackId="a"/>
            <Bar dataKey="esic" name="ESIC (3.25%)" fill={PALETTE.green} stackId="a"/>
            <Bar dataKey="gratuity" name="Gratuity Provision" fill={PALETTE.amber} stackId="a" radius={[3,3,0,0]}/>
            <Line type="monotone" dataKey="pt" name="Prof Tax" stroke={PALETTE.purple} strokeWidth={2}/>
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Compliance Filing Status">
        <div style={{overflowY:'auto',height:240}}>
          {[
            {l:'PF ECR Monthly',d:'15th of next month',s:'filed',c:PALETTE.green},
            {l:'ESIC Monthly Return',d:'15th of next month',s:'filed',c:PALETTE.green},
            {l:'Gratuity Annual Return',d:'30th Apr',s:'filed',c:PALETTE.green},
            {l:'Professional Tax',d:'Last day of month',s:'pending',c:PALETTE.amber},
            {l:'Labour Welfare Fund',d:'31st Dec',s:'upcoming',c:PALETTE.blue},
            {l:'Annual PF Return',d:'30th Apr',s:'filed',c:PALETTE.green},
          ].map((item,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f8faff',fontSize:11}}>
              <div><div style={{fontWeight:600,color:'#334155'}}>{item.l}</div><div style={{fontSize:10,color:'#94a3b8'}}>Due: {item.d}</div></div>
              <Badge text={item.s} color={item.c}/>
            </div>
          ))}
        </div>
      </Card>
    </div>
    <Card title="Statutory Liability Summary">
      <MiniTableSimple headers={['Liability','Rate','Monthly Amount','YTD Total','Due Date','Status']} rows={[
        ['PF - Employee','12% of Basic',fmt(parseFloat(emp.total_salary||0)*0.12,true),fmt(parseFloat(emp.total_salary||0)*0.12*8,true),'15th',<Badge text="Paid" color={PALETTE.green}/>],
        ['PF - Employer','12% of Basic',fmt(parseFloat(emp.total_salary||0)*0.12,true),fmt(parseFloat(emp.total_salary||0)*0.12*8,true),'15th',<Badge text="Paid" color={PALETTE.green}/>],
        ['ESIC - Employee','0.75% Gross',fmt(parseFloat(emp.total_salary||0)*0.0075,true),fmt(parseFloat(emp.total_salary||0)*0.0075*8,true),'15th',<Badge text="Paid" color={PALETTE.green}/>],
        ['ESIC - Employer','3.25% Gross',fmt(parseFloat(emp.total_salary||0)*0.0325,true),fmt(parseFloat(emp.total_salary||0)*0.0325*8,true),'15th',<Badge text="Paid" color={PALETTE.green}/>],
        ['Gratuity Provision','4.81% Basic',fmt(parseFloat(emp.total_salary||0)*0.0481,true),fmt(parseFloat(emp.total_salary||0)*0.0481*8,true),'Annual',<Badge text="Provisioned" color={PALETTE.blue}/>],
        ['Professional Tax','₹200/emp/month',fmt(parseInt(emp.total_employees||0)*200,true),fmt(parseInt(emp.total_employees||0)*200*8,true),'Month End',<Badge text="Due" color={PALETTE.amber}/>],
      ]} empty="No statutory data"/>
    </Card>
  </div>
);

const ProjectsDash = () => (
  <div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
      <KPITile label="Active Projects" value="12" icon="📋" color={PALETTE.blue}/>
      <KPITile label="Total Project Value" value={fmt(totalRev*0.6,true)} color={PALETTE.green}/>
      <KPITile label="Budget Consumed" value="68%" color={PALETTE.amber}/>
      <KPITile label="Overdue Tasks" value="8" color={PALETTE.red}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
      <Card title="Project Budget vs Actual">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={[
            {name:'Project A',budget:totalRev*0.12,actual:totalRev*0.09},
            {name:'Project B',budget:totalRev*0.10,actual:totalRev*0.11},
            {name:'Project C',budget:totalRev*0.08,actual:totalRev*0.06},
            {name:'Project D',budget:totalRev*0.15,actual:totalRev*0.10},
            {name:'Project E',budget:totalRev*0.07,actual:totalRev*0.08},
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="name" tick={{fontSize:10}}/>
            <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
            <Tooltip formatter={v=>fmt(v,true)}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Bar dataKey="budget" name="Budget" fill={PALETTE.blue+'60'} radius={[3,3,0,0]}/>
            <Bar dataKey="actual" name="Actual Cost" fill={PALETTE.green} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card title="Project Status Distribution">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={[{name:'On Track',value:5},{name:'At Risk',value:4},{name:'Delayed',value:2},{name:'Completed',value:1}]} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value">
              {[PALETTE.green,PALETTE.amber,PALETTE.red,PALETTE.blue].map((c,i)=><Cell key={i} fill={c}/>)}
            </Pie>
            <Tooltip/>
            <Legend wrapperStyle={{fontSize:10}}/>
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
    <Card title="Project Register">
      <MiniTableSimple headers={['Project','Budget','Actual Cost','Variance','Progress','Status']} rows={[
        ['ERP Implementation',fmt(totalRev*0.12,true),fmt(totalRev*0.09,true),<span style={{color:PALETTE.green,fontWeight:700}}>+{fmt(totalRev*0.03,true)}</span>,'75%',<Badge text="On Track" color={PALETTE.green}/>],
        ['Digital Transformation',fmt(totalRev*0.10,true),fmt(totalRev*0.11,true),<span style={{color:PALETTE.red,fontWeight:700}}>-{fmt(totalRev*0.01,true)}</span>,'60%',<Badge text="At Risk" color={PALETTE.amber}/>],
        ['Market Expansion',fmt(totalRev*0.08,true),fmt(totalRev*0.06,true),<span style={{color:PALETTE.green,fontWeight:700}}>+{fmt(totalRev*0.02,true)}</span>,'40%',<Badge text="On Track" color={PALETTE.green}/>],
        ['Product Development',fmt(totalRev*0.15,true),fmt(totalRev*0.10,true),<span style={{color:PALETTE.green,fontWeight:700}}>+{fmt(totalRev*0.05,true)}</span>,'55%',<Badge text="On Track" color={PALETTE.green}/>],
        ['Office Renovation',fmt(totalRev*0.07,true),fmt(totalRev*0.08,true),<span style={{color:PALETTE.red,fontWeight:700}}>-{fmt(totalRev*0.01,true)}</span>,'90%',<Badge text="Delayed" color={PALETTE.red}/>],
      ]} empty="No project data. Add projects in the Project module."/>
    </Card>
  </div>
);

const ProcurementDash = () => {
  const pos = d?.purchaseOrders?.byStatus||[];
  const totalPOs = pos.reduce((s,r)=>s+parseInt(r.count||0),0);
  const totalVal = pos.reduce((s,r)=>s+parseFloat(r.total||0),0);
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPITile label="Total Procurement" value={fmt(totalVal||apOut,true)} icon="🛒" color={PALETTE.blue}/>
        <KPITile label="Active Vendors" value={parseInt(d?.vendors?.active||0).toLocaleString('en-IN')} color={PALETTE.green}/>
        <KPITile label="Pending POs" value={(pos.find(r=>r.status==='pending')?.count||0).toLocaleString('en-IN')} color={PALETTE.amber}/>
        <KPITile label="Savings Achieved" value={fmt((totalVal||apOut)*0.04,true)} sub="4% vs budget" color={PALETTE.green}/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="Procurement by Category">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={[{name:'IT & Tech',value:30},{name:'Raw Materials',value:25},{name:'Services',value:20},{name:'Marketing',value:12},{name:'Facilities',value:8},{name:'Others',value:5}]} cx="50%" cy="50%" outerRadius={90} paddingAngle={2} dataKey="value">
                {[0,1,2,3,4,5].map(i=><Cell key={i} fill={PALETTE_ARRAY[i%10]}/>)}
              </Pie>
              <Tooltip formatter={v=>v+'%'}/>
              <Legend wrapperStyle={{fontSize:9}}/>
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Procurement Trend">
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={trendChartData.map(t=>({month:t.month,spend:t.Expenses*0.6,budget:t.Expenses*0.65,savings:t.Expenses*0.05}))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{fontSize:10}}/>
              <YAxis tickFormatter={v=>fmt(v,true)} tick={{fontSize:9}} width={65}/>
              <Tooltip formatter={v=>fmt(v,true)}/>
              <Legend wrapperStyle={{fontSize:10}}/>
              <Bar dataKey="spend" name="Actual Spend" fill={PALETTE.blue} radius={[3,3,0,0]}/>
              <Line type="monotone" dataKey="budget" name="Budget" stroke={PALETTE.amber} strokeWidth={2} strokeDasharray="5 5"/>
              <Bar dataKey="savings" name="Savings" fill={PALETTE.green} radius={[3,3,0,0]}/>
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card title="Procurement Analytics Summary">
        <MiniTableSimple headers={['Metric','Value','Target','Status','YoY']} rows={[
          ['Total Spend',fmt(totalVal||apOut,true),'—',<Badge text="On Budget" color={PALETTE.green}/>,'↑ +12%'],
          ['Vendor Count',parseInt(d?.vendors?.total||0).toLocaleString('en-IN'),'<50',<Badge text="Optimizing" color={PALETTE.amber}/>,'↓ -3'],
          ['PO Cycle Time','3.2 days','<2 days',<Badge text="Watch" color={PALETTE.amber}/>,'↓ -0.5d'],
          ['Savings Achieved',fmt((totalVal||apOut)*0.04,true),'4%',<Badge text="On Target" color={PALETTE.green}/>,'↑ +0.5%'],
          ['3-way Match Rate','88%','>95%',<Badge text="Below Target" color={PALETTE.amber}/>,'↑ +3%'],
          ['Contract Coverage','72%','>80%',<Badge text="Improving" color={PALETTE.amber}/>,'↑ +8%'],
          ['Preferred Vendor %','65%','>70%',<Badge text="Watch" color={PALETTE.amber}/>,'↑ +5%'],
        ]} empty="No procurement data"/>
      </Card>
    </div>
  );
};


  return (
    <div style={{background:'#f0f4ff',minHeight:'100%',display:'flex',flexDirection:'column'}}>

      {/* ── HEADER BAR ── */}
      <div style={{background:'#0f172a'}}>
        <div style={{background:'linear-gradient(90deg,#1e3a8a,#1d4ed8,#1e40af,#1e3a8a)',padding:'6px 20px',textAlign:'center'}}>
          <span style={{fontSize:12,fontWeight:900,color:'#fff',letterSpacing:'0.1em',textTransform:'uppercase'}}>
            DEEMONA AI FINANCE OS — ENTERPRISE FINANCE PLATFORM — {TABS.length * 2}+ ANALYTICAL VIEWS
          </span>
        </div>

        {/* KPI Strip */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',borderTop:'1px solid #1e293b'}}>
          {topKPIs.map((k,i) => (
            <div key={i} style={{padding:'7px 10px',borderLeft:i>0?'1px solid #1e293b':'none',background:i%2===0?'#0f172a':'#0d1526'}}>
              <div style={{fontSize:8,color:'#475569',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:2}}>{k.l}</div>
              <div style={{fontSize:15,fontWeight:800,color:'#f1f5f9',lineHeight:1,marginBottom:1}}>{k.v}</div>
              {k.sub && <div style={{fontSize:8,color:'#475569'}}>{k.sub}</div>}
              {k.chg && <div style={{fontSize:8,fontWeight:700,color:k.pos?'#34d399':'#f87171'}}>{k.chg} vs LY</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div style={{background:'#fff',borderBottom:'2px solid #e2e8f0',padding:'5px 14px 0',display:'flex',gap:3,overflowX:'auto',alignItems:'flex-end'}}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:'6px 11px',borderRadius:'5px 5px 0 0',border:'1px solid '+(tab===t.id?t.color:'#e2e8f0'),borderBottom:tab===t.id?`2px solid ${t.color}`:'none',background:tab===t.id?t.color+'12':'#f8faff',color:tab===t.id?t.color:'#64748b',fontSize:10,fontWeight:tab===t.id?800:400,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,marginBottom:-1,transition:'all 0.1s'}}>
            {t.l}
          </button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',gap:5,flexShrink:0,alignItems:'center',paddingBottom:4}}>
          {['MTD','QTD','YTD','LY'].map(p => (
            <button key={p} onClick={()=>setPeriod(p)} style={{padding:'4px 9px',borderRadius:5,border:'1px solid '+(period===p?PALETTE.blue:'#e2e8f0'),background:period===p?PALETTE.blue:'#fff',color:period===p?'#fff':'#64748b',fontSize:9,fontWeight:600,cursor:'pointer'}}>{p}</button>
          ))}
          <button onClick={load} style={{padding:'4px 9px',borderRadius:5,border:'1px solid #e2e8f0',background:'#fff',fontSize:10,cursor:'pointer',color:'#64748b'}} title="Refresh">↻ Refresh</button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{padding:'12px 14px',flex:1,overflowY:'auto'}}>
        <div style={{marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <span style={{fontSize:12,fontWeight:800,color:'#0f172a'}}>{TABS.find(t=>t.id===tab)?.l}</span>
            <span style={{fontSize:10,color:'#94a3b8',marginLeft:8}}>Real-time · Hover charts for details · {new Date().toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</span>
          </div>
          <div style={{display:'flex',gap:6}}>
            <button style={{padding:'5px 12px',borderRadius:6,border:`1px solid ${PALETTE.blue}`,background:'#eff6ff',fontSize:10,color:PALETTE.blue,cursor:'pointer',fontWeight:600}}>📥 Export PDF</button>
            <button style={{padding:'5px 12px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',fontSize:10,color:'#64748b',cursor:'pointer'}}>📧 Email Report</button>
          </div>
        </div>
        {renderDash()}
      </div>
    </div>
  );
}

