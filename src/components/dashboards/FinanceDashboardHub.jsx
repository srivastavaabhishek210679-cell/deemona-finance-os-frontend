import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar, ComposedChart, Scatter, ReferenceLine
} from 'recharts';
import { apiURL } from '../../api.js';

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
  {id:'budget', l:'20 · Budget vs Actual', color:PALETTE.emerald},
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
      default: return <ExecDash/>;
    }
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
