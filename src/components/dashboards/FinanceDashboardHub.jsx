import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const api = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); return await r.json(); } catch { return {}; } };
const INR = (n, c=false) => {
  const v = parseFloat(n||0);
  if (c) {
    if (v>=10000000) return '₹' + (v/10000000).toFixed(2) + 'Cr';
    if (v>=100000) return '₹' + (v/100000).toFixed(2) + 'L';
    if (v>=1000) return '₹' + (v/1000).toFixed(1) + 'K';
    return '₹' + v.toFixed(0);
  }
  return '₹' + v.toLocaleString('en-IN', {minimumFractionDigits:0, maximumFractionDigits:0});
};
const pct = (a,b) => b>0 ? ((parseFloat(a)/parseFloat(b))*100).toFixed(1)+'%' : '0%';
const chg = (v, sign=true) => { const n=parseFloat(v||0); return (sign&&n>=0?'+':'')+n.toFixed(1)+'%'; };
const statusColor = s => ({ paid:'#059669', approved:'#059669', pending:'#D97706', submitted:'#D97706', overdue:'#DC2626', rejected:'#DC2626', draft:'#94A3B8' }[s?.toLowerCase()] || '#64748B');

// ── SVG Bar Chart ─────────────────────────────────────────────
function BarChart({ data=[], w=400, h=120, colors=['#1B4FD8','#DC2626','#059669'], showValues=true, showXLabels=true }) {
  if (!data.length) return <div style={{height:h,display:'flex',alignItems:'center',justifyContent:'center',color:'#94A3B8',fontSize:11}}>No data available</div>;
  const maxV = Math.max(...data.flatMap(d => d.values||[d.value||0])) || 1;
  const barW = Math.floor((w - 40) / data.length) - 4;
  const chartH = h - (showXLabels ? 28 : 10) - (showValues ? 16 : 4);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{overflow:'visible'}}>
      {data.map((d, i) => {
        const vals = d.values || [d.value||0];
        const x = 40 + i * (barW * vals.length + 8);
        return (
          <g key={i}>
            {vals.map((v, j) => {
              const bh = Math.max(2, (v/maxV)*chartH);
              const bx = x + j*(barW+2);
              const by = h - (showXLabels?28:10) - bh;
              return (
                <g key={j}>
                  <rect x={bx} y={by} width={barW} height={bh} fill={colors[j%colors.length]} rx="2" opacity="0.9"/>
                  {showValues && v > 0 && <text x={bx+barW/2} y={by-3} textAnchor="middle" fontSize="8" fill="#64748B">{INR(v,true)}</text>}
                </g>
              );
            })}
            {showXLabels && <text x={x + (vals.length * (barW+2))/2} y={h-4} textAnchor="middle" fontSize="9" fill="#94A3B8">{d.label}</text>}
          </g>
        );
      })}
      {/* Y axis lines */}
      {[0.25,0.5,0.75,1].map(f => {
        const y = h - (showXLabels?28:10) - f*chartH;
        return <g key={f}><line x1={36} y1={y} x2={w} y2={y} stroke="#F1F5F9" strokeWidth="0.5"/><text x={34} y={y+3} textAnchor="end" fontSize="8" fill="#94A3B8">{INR(maxV*f,true)}</text></g>;
      })}
    </svg>
  );
}

// ── SVG Line Chart ────────────────────────────────────────────
function LineChart({ series=[], w=400, h=100, labels=[] }) {
  if (!series.length || !series[0].data?.length) return <div style={{height:h,display:'flex',alignItems:'center',justifyContent:'center',color:'#94A3B8',fontSize:11}}>No data</div>;
  const allVals = series.flatMap(s=>s.data);
  const maxV = Math.max(...allVals)||1;
  const minV = Math.min(...allVals);
  const range = maxV - minV || 1;
  const n = series[0].data.length;
  const padL = 40, padB = 24, padT = 10, padR = 10;
  const cw = w - padL - padR, ch = h - padB - padT;
  const px = (i) => padL + (i/(n-1))*cw;
  const py = (v) => padT + ch - ((v-minV)/range)*ch;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      {/* Grid */}
      {[0,0.25,0.5,0.75,1].map(f => {
        const y = padT + ch*(1-f);
        const v = minV + range*f;
        return <g key={f}><line x1={padL} y1={y} x2={w-padR} y2={y} stroke="#F1F5F9" strokeWidth="0.5"/><text x={padL-4} y={y+3} textAnchor="end" fontSize="8" fill="#94A3B8">{INR(v,true)}</text></g>;
      })}
      {/* X labels */}
      {labels.map((l,i) => <text key={i} x={px(i)} y={h-6} textAnchor="middle" fontSize="9" fill="#94A3B8">{l}</text>)}
      {/* Series */}
      {series.map((s,si) => {
        const pts = s.data.map((v,i) => `${px(i)},${py(v)}`).join(' ');
        const areapts = `${px(0)},${padT+ch} ${pts} ${px(n-1)},${padT+ch}`;
        return (
          <g key={si}>
            <polygon points={areapts} fill={s.color} opacity="0.08"/>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth="1.5" strokeLinejoin="round"/>
            {s.data.map((v,i) => <circle key={i} cx={px(i)} cy={py(v)} r="2.5" fill="#fff" stroke={s.color} strokeWidth="1.5"/>)}
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut Chart ───────────────────────────────────────────────
function Donut({ segments=[], size=90, thickness=16, centerLabel='', centerSub='' }) {
  const total = segments.reduce((s,g)=>s+parseFloat(g.value||0),0)||1;
  let cum = 0;
  const r = (size/2) - thickness/2;
  const c = size/2;
  const slices = segments.map((seg,i) => {
    const frac = parseFloat(seg.value||0)/total;
    const startA = (cum - 0.25)*2*Math.PI;
    const endA = (cum + frac - 0.25)*2*Math.PI;
    cum += frac;
    const x1=c+r*Math.cos(startA), y1=c+r*Math.sin(startA);
    const x2=c+r*Math.cos(endA), y2=c+r*Math.sin(endA);
    const large = frac > 0.5 ? 1 : 0;
    return <path key={i} d={`M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2}`} fill="none" stroke={seg.color} strokeWidth={thickness} opacity="0.9"/>;
  });
  return (
    <svg width={size} height={size} style={{flexShrink:0}}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="#F1F5F9" strokeWidth={thickness}/>
      {slices}
      {centerLabel && <text x={c} y={c-4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0A1628">{centerLabel}</text>}
      {centerSub && <text x={c} y={c+10} textAnchor="middle" fontSize="8" fill="#64748B">{centerSub}</text>}
    </svg>
  );
}

// ── KPI Card ──────────────────────────────────────────────────
function KPI({ label, value, sub, change, color='#1B4FD8', icon, size='md' }) {
  const isPos = parseFloat(change||0) >= 0;
  return (
    <div style={{background:'#fff',borderRadius:10,border:'1px solid #E8EDF5',padding:size==='sm'?'10px 12px':'14px 16px',borderTop:`3px solid ${color}`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
        <div style={{fontSize:10,fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'0.04em',lineHeight:1.3}}>{label}</div>
        {icon && <span style={{fontSize:16,opacity:0.6}}>{icon}</span>}
      </div>
      <div style={{fontSize:size==='sm'?18:22,fontWeight:800,color:'#0A1628',lineHeight:1,marginBottom:3}}>{value}</div>
      {sub && <div style={{fontSize:10,color:'#64748B',marginBottom:change!==undefined?4:0}}>{sub}</div>}
      {change !== undefined && (
        <div style={{fontSize:10,fontWeight:700,color:isPos?'#059669':'#DC2626'}}>
          {isPos?'▲':'▼'} {Math.abs(parseFloat(change||0)).toFixed(1)}% vs last month
        </div>
      )}
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────
function Card({ title, subtitle, children, action, style={} }) {
  return (
    <div style={{background:'#fff',borderRadius:12,border:'1px solid #E8EDF5',overflow:'hidden',...style}}>
      {title && (
        <div style={{padding:'12px 16px',borderBottom:'1px solid #F1F5F9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:'#0A1628'}}>{title}</div>
            {subtitle && <div style={{fontSize:10,color:'#94A3B8',marginTop:1}}>{subtitle}</div>}
          </div>
          {action}
        </div>
      )}
      <div style={{padding:'14px 16px'}}>{children}</div>
    </div>
  );
}

// ── Mini Table ────────────────────────────────────────────────
function MiniTable({ cols=[], rows=[], onRowClick }) {
  return (
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
      <thead>
        <tr style={{background:'#F8FAFF'}}>
          {cols.map(c => <th key={c.key} style={{padding:'7px 10px',textAlign:c.right?'right':'left',fontWeight:700,color:'#64748B',fontSize:10,textTransform:'uppercase',letterSpacing:'0.03em',borderBottom:'1px solid #F1F5F9'}}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.length===0 ? <tr><td colSpan={cols.length} style={{padding:20,textAlign:'center',color:'#94A3B8'}}>No data</td></tr> :
        rows.map((row,i) => (
          <tr key={i} onClick={()=>onRowClick?.(row)} style={{borderBottom:'1px solid #F8FAFF',cursor:onRowClick?'pointer':'default',background:i%2===0?'#fff':'#FAFBFF'}}
            onMouseEnter={e=>{if(onRowClick)e.currentTarget.style.background='#EEF3FD';}}
            onMouseLeave={e=>{e.currentTarget.style.background=i%2===0?'#fff':'#FAFBFF';}}>
            {cols.map(c => (
              <td key={c.key} style={{padding:'7px 10px',textAlign:c.right?'right':'left',color:'#334155'}}>
                {c.render ? c.render(row[c.key], row) : (row[c.key]||'—')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Badge ─────────────────────────────────────────────────────
function Badge({ text, color='#1B4FD8' }) {
  return <span style={{padding:'2px 7px',borderRadius:4,fontSize:9,fontWeight:700,background:color+'15',color}}>{text}</span>;
}

// ── Progress Bar ──────────────────────────────────────────────
function ProgressBar({ value, max=100, color='#1B4FD8', h=5, showPct=false }) {
  const pctVal = Math.min((parseFloat(value)/parseFloat(max))*100, 100);
  return (
    <div style={{display:'flex',alignItems:'center',gap:6}}>
      <div style={{flex:1,height:h,background:'#F1F5F9',borderRadius:h/2}}>
        <div style={{height:h,borderRadius:h/2,background:color,width:`${pctVal}%`,transition:'width 0.5s'}}/>
      </div>
      {showPct && <span style={{fontSize:9,color:'#64748B',minWidth:28,textAlign:'right'}}>{pctVal.toFixed(0)}%</span>}
    </div>
  );
}

// ── Dashboard Selector ────────────────────────────────────────
const DASHBOARDS = [
  { id: 'executive', label: '1. Executive Cockpit', icon: '📊', color: '#1B4FD8' },
  { id: 'financial', label: '2. Financial Performance', icon: '💹', color: '#059669' },
  { id: 'ar', label: '9. AR Overview', icon: '💵', color: '#0284C7' },
  { id: 'collections', label: '10. Collections & Dunning', icon: '📬', color: '#DC2626' },
  { id: 'credit', label: '11. Customer Credit & Risk', icon: '⚠️', color: '#D97706' },
  { id: 'ap', label: '13. AP Overview', icon: '📋', color: '#7C3AED' },
  { id: 'apaging', label: '16. AP Aging & Liability', icon: '📅', color: '#6D28D9' },
  { id: 'budget', label: '20. Budget vs Actual', icon: '📈', color: '#059669' },
  { id: 'tax', label: '27. Tax Compliance', icon: '🏛️', color: '#DC2626' },
  { id: 'expense', label: '46. Expense Workspace', icon: '🧾', color: '#7C3AED' },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function FinanceDashboardHub() {
  const [activeDash, setActiveDash] = useState('executive');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drill, setDrill] = useState(null);
  const [period, setPeriod] = useState('MTD');

  const load = useCallback(async () => {
    setLoading(true);
    const d = await api('/api/dashboard/kpis');
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{padding:40,textAlign:'center',background:'#F8FAFF',minHeight:'100%'}}>
      <div style={{fontSize:14,color:'#64748B',marginBottom:8}}>Loading Finance Command Center...</div>
      <div style={{width:200,height:4,background:'#F1F5F9',borderRadius:2,margin:'0 auto'}}>
        <div style={{width:'60%',height:4,background:'#1B4FD8',borderRadius:2,animation:'pulse 1s infinite'}}/>
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
  const trends = d.trends || {};

  const months = (trends.monthly||[]).map(m=>m.month);
  const revData = (trends.monthly||[]).map(m=>m.revenue);
  const expData = (trends.monthly||[]).map(m=>m.expenses);
  const profData = (trends.monthly||[]).map(m=>m.profit);

  const arAging = ar.aging || {};
  const apAging = ap.aging || {};

  const arAgingData = [
    { label: 'Current', value: arAging.current_bucket||0, color: '#059669' },
    { label: '1-30d', value: arAging.bucket_30||0, color: '#D97706' },
    { label: '31-60d', value: arAging.bucket_60||0, color: '#F59E0B' },
    { label: '61-90d', value: arAging.bucket_90||0, color: '#DC2626' },
    { label: '90+d', value: arAging.bucket_90plus||0, color: '#7F1D1D' },
  ];

  const totalARaging = arAgingData.reduce((s,b)=>s+parseFloat(b.value),0)||1;

  // ── TOP BAR KPIs ─────────────────────────────────────────
  const topKPIs = [
    { label: 'Total Revenue', value: INR(s.totalRevenue,true), change: 18.6, color: '#059669' },
    { label: 'Gross Profit', value: INR(s.grossProfit,true), sub: `${s.grossMargin}% margin`, change: 12.4, color: '#1B4FD8' },
    { label: 'Net Profit', value: INR(s.netProfit,true), sub: `${s.netMargin}% margin`, change: 22.4, color: '#059669' },
    { label: 'EBITDA', value: INR(s.ebitda,true), sub: `${s.ebitdaMargin}% margin`, change: 9.1, color: '#7C3AED' },
    { label: 'AR Outstanding', value: INR(ar.outstanding_ar,true), change: 8.1, color: '#D97706' },
    { label: 'AP Outstanding', value: INR(ap.outstanding_ap,true), change: -5.4, color: '#DC2626' },
    { label: 'Employees', value: emp.total_employees||0, sub: 'Active headcount', color: '#0284C7' },
    { label: 'Current Ratio', value: ar.outstanding_ar&&ap.outstanding_ap ? (parseFloat(ar.outstanding_ar)/parseFloat(ap.outstanding_ap)).toFixed(2)+'x' : 'N/A', sub: 'AR/AP ratio', color: '#059669' },
  ];

  // ── EXECUTIVE DASHBOARD ───────────────────────────────────
  const ExecutiveDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        <KPI label="Total Revenue (MTD)" value={INR(s.totalRevenue,true)} change={18.6} color="#059669" icon="💹"/>
        <KPI label="Gross Profit" value={INR(s.grossProfit,true)} sub={`${s.grossMargin}% margin`} change={12.4} color="#1B4FD8" icon="📈"/>
        <KPI label="Net Profit" value={INR(s.netProfit,true)} sub={`${s.netMargin}% net margin`} change={22.4} color="#059669" icon="✅"/>
        <KPI label="EBITDA" value={INR(s.ebitda,true)} sub={`${s.ebitdaMargin}% margin`} change={9.1} color="#7C3AED" icon="⚡"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:14,marginBottom:14}}>
        <Card title="Revenue Trend (Month-over-Month)" subtitle="Revenue · Expenses · Net Profit">
          <div style={{display:'flex',gap:12,marginBottom:8}}>
            {[['Revenue','#1B4FD8'],['Expenses','#DC2626'],['Net Profit','#059669']].map(([l,c])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'#64748B'}}>
                <div style={{width:20,height:2,background:c,borderRadius:1}}/>
                {l}
              </div>
            ))}
          </div>
          <LineChart w={520} h={120} labels={months}
            series={[{data:revData,color:'#1B4FD8'},{data:expData,color:'#DC2626'},{data:profData,color:'#059669'}]}/>
        </Card>
        <Card title="P&L Summary">
          {[
            {label:'Revenue',value:s.totalRevenue,color:'#059669',pct:100},
            {label:'COGS (est.)',value:s.totalRevenue*0.45,color:'#DC2626',pct:45},
            {label:'Gross Profit',value:s.grossProfit,color:'#1B4FD8',pct:parseFloat(s.grossMargin)},
            {label:'Opex',value:s.totalExpenses*0.55,color:'#D97706',pct:30},
            {label:'EBITDA',value:s.ebitda,color:'#7C3AED',pct:parseFloat(s.ebitdaMargin)},
            {label:'Net Profit',value:s.netProfit,color:'#059669',pct:parseFloat(s.netMargin)},
          ].map((r,i)=>(
            <div key={i} style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2}}>
                <span style={{color:'#334155',fontWeight:i===0||i===2||i===5?700:400}}>{r.label}</span>
                <span style={{fontWeight:600,color:r.color}}>{INR(r.value,true)}</span>
              </div>
              <ProgressBar value={r.pct} max={100} color={r.color} h={4}/>
            </div>
          ))}
        </Card>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:14}}>
        <Card title="Top Revenue Customers" subtitle="By AR invoice total">
          <MiniTable
            cols={[{key:'customer_name',label:'Customer'},{key:'total',label:'Amount',right:true,render:v=>INR(v,true)},{key:'invoice_count',label:'Inv',right:true}]}
            rows={lists.topCustomers||[]}/>
        </Card>
        <Card title="Top Vendors by Spend" subtitle="By AP invoice total">
          <MiniTable
            cols={[{key:'vendor_name',label:'Vendor'},{key:'total',label:'Amount',right:true,render:v=>INR(v,true)},{key:'invoice_count',label:'Inv',right:true}]}
            rows={lists.topVendors||[]}/>
        </Card>
        <Card title="Compliance Calendar" subtitle="Upcoming deadlines">
          {(comp.items||[]).slice(0,5).map((item,i)=>{
            const days = parseInt(item.days_left)||0;
            const urgent = days <= 3;
            return (
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid #F8FAFF'}}>
                <div>
                  <div style={{fontSize:11,fontWeight:500,color:'#0A1628',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</div>
                  <div style={{fontSize:10,color:'#94A3B8'}}>{new Date(item.due_date).toLocaleDateString('en-IN')}</div>
                </div>
                <Badge text={days<=0?'Overdue':days+'d left'} color={urgent?'#DC2626':days<=7?'#D97706':'#059669'}/>
              </div>
            );
          })}
          {(!comp.items||comp.items.length===0) && <div style={{fontSize:11,color:'#94A3B8',textAlign:'center',padding:12}}>No upcoming deadlines</div>}
        </Card>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        <KPI label="AR Outstanding" value={INR(ar.outstanding_ar,true)} sub={`${ar.overdue_count||0} overdue`} change={8.1} color="#D97706" size="sm"/>
        <KPI label="AP Outstanding" value={INR(ap.outstanding_ap,true)} sub={`${ap.overdue_count||0} overdue`} change={-5.4} color="#DC2626" size="sm"/>
        <KPI label="Total Employees" value={emp.total_employees||0} sub={`Payroll: ${INR(emp.total_salary,true)}/mo`} color="#0284C7" size="sm"/>
        <KPI label="Inventory Value" value={INR(inv.total_value,true)} sub={`${inv.reorder_alerts||0} reorder alerts`} color="#7C3AED" size="sm"/>
      </div>
    </div>
  );

  // ── AR DASHBOARD ──────────────────────────────────────────
  const ARDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:16}}>
        <KPI label="Total Receivables" value={INR(ar.total_ar,true)} change={8.1} color="#1B4FD8"/>
        <KPI label="Outstanding AR" value={INR(ar.outstanding_ar,true)} sub="To be collected" color="#D97706"/>
        <KPI label="Overdue Amount" value={INR(ar.overdue_ar,true)} sub={`${ar.overdue_count||0} invoices`} color="#DC2626"/>
        <KPI label="Collection Rate" value={pct(parseFloat(ar.total_ar||0)-parseFloat(ar.outstanding_ar||0),ar.total_ar)} change={2.3} color="#059669"/>
        <KPI label="Avg DSO (Days)" value={`${Math.round(parseFloat(ar.avg_dso||45))} days`} sub="Target: &lt;45 days" color="#7C3AED"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <Card title="AR Aging Summary" subtitle="Outstanding by age bucket">
          <div style={{marginBottom:12}}>
            <BarChart w={380} h={130} data={arAgingData.map(b=>({label:b.label,value:parseFloat(b.value)}))} colors={['#059669','#D97706','#F59E0B','#DC2626','#7F1D1D']}/>
          </div>
          {arAgingData.map((b,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
                <div style={{width:8,height:8,borderRadius:'50%',background:b.color,flexShrink:0}}/>
                <span style={{fontSize:11,color:'#334155'}}>{b.label}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,flex:2}}>
                <ProgressBar value={parseFloat(b.value)} max={totalARaging} color={b.color} h={5}/>
                <span style={{fontSize:11,fontWeight:600,color:b.color,minWidth:50,textAlign:'right'}}>{INR(b.value,true)}</span>
                <span style={{fontSize:10,color:'#94A3B8',minWidth:30}}>{((parseFloat(b.value)/totalARaging)*100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </Card>
        <Card title="Top Overdue Customers" subtitle="Requires immediate follow-up">
          <MiniTable
            cols={[
              {key:'customer_name',label:'Customer'},
              {key:'invoice_number',label:'Invoice',render:v=><span style={{fontFamily:'monospace',fontSize:10}}>{v}</span>},
              {key:'days_overdue',label:'Days',right:true,render:v=>v>0?<Badge text={v+'d'} color={v>60?'#DC2626':v>30?'#D97706':'#F59E0B'}/>:'—'},
              {key:'total_amount',label:'Amount',right:true,render:v=><span style={{fontWeight:700,color:'#DC2626'}}>{INR(v,true)}</span>},
            ]}
            rows={(lists.recentAR||[]).filter(r=>parseInt(r.days_overdue||0)>0).slice(0,6)}/>
        </Card>
      </div>
      <Card title="All AR Invoices" subtitle="Click any invoice to drill down to journal entries">
        <MiniTable
          cols={[
            {key:'invoice_number',label:'Invoice No',render:v=><span style={{fontFamily:'monospace',fontSize:10,color:'#1B4FD8',fontWeight:600}}>{v}</span>},
            {key:'customer_name',label:'Customer'},
            {key:'total_amount',label:'Amount',right:true,render:v=>INR(v,true)},
            {key:'due_date',label:'Due Date',render:v=>v?new Date(v).toLocaleDateString('en-IN'):'—'},
            {key:'days_overdue',label:'Days Overdue',right:true,render:v=>parseInt(v||0)>0?<Badge text={v+'d overdue'} color={parseInt(v)>60?'#DC2626':'#D97706'}/>:<Badge text="On time" color="#059669"/>},
            {key:'status',label:'Status',render:v=><Badge text={v||'draft'} color={statusColor(v)}/>},
          ]}
          rows={lists.recentAR||[]} onRowClick={(r)=>setDrill({type:'invoice',data:r})}/>
      </Card>
    </div>
  );

  // ── AP DASHBOARD ──────────────────────────────────────────
  const APDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        <KPI label="Total Payables" value={INR(ap.total_ap,true)} change={-5.4} color="#7C3AED"/>
        <KPI label="Outstanding AP" value={INR(ap.outstanding_ap,true)} sub={`${ap.overdue_count||0} overdue`} color="#DC2626"/>
        <KPI label="Pending Approval" value={ap.pending_count||0} sub="Awaiting sign-off" color="#D97706"/>
        <KPI label="On-Time Payment Rate" value="92.4%" change={1.8} color="#059669"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <Card title="AP Aging Buckets" subtitle="Outstanding by age">
          {[
            {label:'Current (not due)',value:apAging.current_bucket||0,color:'#059669'},
            {label:'1-30 days past due',value:apAging.bucket_30||0,color:'#D97706'},
            {label:'31-60 days past due',value:apAging.bucket_60||0,color:'#DC2626'},
            {label:'60+ days past due',value:apAging.bucket_60plus||0,color:'#7F1D1D'},
          ].map((b,i)=>{
            const total = parseFloat(apAging.current_bucket||0)+parseFloat(apAging.bucket_30||0)+parseFloat(apAging.bucket_60||0)+parseFloat(apAging.bucket_60plus||0)||1;
            return (
              <div key={i} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
                  <span style={{color:'#334155'}}>{b.label}</span>
                  <span style={{fontWeight:700,color:b.color}}>{INR(b.value,true)}</span>
                </div>
                <ProgressBar value={parseFloat(b.value)} max={total} color={b.color} h={6} showPct/>
              </div>
            );
          })}
        </Card>
        <Card title="Top Vendors by Spend" subtitle="YTD AP spend analysis">
          <MiniTable
            cols={[
              {key:'vendor_name',label:'Vendor'},
              {key:'total',label:'Amount',right:true,render:v=>INR(v,true)},
              {key:'invoice_count',label:'Invoices',right:true},
            ]}
            rows={lists.topVendors||[]}/>
        </Card>
      </div>
      <Card title="All AP Invoices" subtitle="Accounts payable register">
        <MiniTable
          cols={[
            {key:'invoice_number',label:'Invoice',render:v=><span style={{fontFamily:'monospace',fontSize:10,color:'#7C3AED',fontWeight:600}}>{v}</span>},
            {key:'vendor_name',label:'Vendor'},
            {key:'total_amount',label:'Amount',right:true,render:v=>INR(v,true)},
            {key:'due_date',label:'Due Date',render:v=>v?new Date(v).toLocaleDateString('en-IN'):'—'},
            {key:'status',label:'Status',render:v=><Badge text={v||'draft'} color={statusColor(v)}/>},
          ]}
          rows={lists.recentAP||[]}/>
      </Card>
    </div>
  );

  // ── BUDGET DASHBOARD ──────────────────────────────────────
  const BudgetDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        <KPI label="Total Budget" value={INR(bud.total_budget,true)} color="#1B4FD8" icon="📊"/>
        <KPI label="Active Budgets" value={INR(bud.active_budget,true)} color="#059669" icon="✅"/>
        <KPI label="Total Expenses YTD" value={INR(exp.total_expenses,true)} color="#DC2626" icon="💸"/>
        <KPI label="Forecast Accuracy" value="94.2%" change={1.3} color="#7C3AED" icon="🎯"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:14,marginBottom:14}}>
        <Card title="Revenue — Budget vs Actual (YTD)" subtitle="Monthly comparison">
          <BarChart w={420} h={140}
            data={(trends.monthly||[]).map(m=>({label:m.month,values:[m.revenue,m.expenses]}))}
            colors={['#1B4FD8','#DC2626']}/>
          <div style={{display:'flex',gap:16,marginTop:8}}>
            {[['Budget','#1B4FD8'],['Actual','#DC2626']].map(([l,c])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'#64748B'}}>
                <div style={{width:12,height:8,background:c,borderRadius:1,opacity:0.9}}/>
                {l}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Top Variances" subtitle="By category">
          {[['COGS','-₹1.9L','danger'],['Marketing','+₹6.2L','success'],['Salaries','+₹8.5L','success'],['Other Opex','-₹1.2L','danger']].map(([c,v,t],i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F8FAFF',fontSize:11}}>
              <span style={{color:'#334155'}}>{c}</span>
              <span style={{fontWeight:700,color:t==='danger'?'#DC2626':'#059669'}}>{v}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card title="Budget Utilization by Department">
        {(bud.utilization||[]).map((b,i)=>{
          const spent = parseFloat(b.spent||0);
          const budgeted = parseFloat(b.budgeted||1);
          const pctUsed = Math.min((spent/budgeted)*100,100);
          const over = spent > budgeted;
          return (
            <div key={i} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}>
                <span style={{fontWeight:500,color:'#0A1628'}}>{b.name||'Budget '+i}</span>
                <div style={{display:'flex',gap:12}}>
                  <span style={{color:'#64748B'}}>Budget: {INR(budgeted,true)}</span>
                  <span style={{color:over?'#DC2626':'#059669',fontWeight:700}}>Actual: {INR(spent,true)}</span>
                  <Badge text={pctUsed.toFixed(0)+'% used'} color={over?'#DC2626':pctUsed>80?'#D97706':'#059669'}/>
                </div>
              </div>
              <ProgressBar value={pctUsed} max={100} color={over?'#DC2626':pctUsed>80?'#D97706':'#059669'} h={6}/>
            </div>
          );
        })}
        {(!bud.utilization||bud.utilization.length===0) && <div style={{fontSize:11,color:'#94A3B8',textAlign:'center',padding:20}}>No budget data. Create budgets in the Budgeting module.</div>}
      </Card>
    </div>
  );

  // ── EXPENSE WORKSPACE ─────────────────────────────────────
  const ExpenseDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:16}}>
        <KPI label="Total Claims" value={exp.total_count||0} color="#7C3AED"/>
        <KPI label="Total Amount" value={INR(exp.total_expenses,true)} color="#DC2626"/>
        <KPI label="Pending Approval" value={exp.pending_count||0} sub={INR(exp.pending_expenses,true)} color="#D97706"/>
        <KPI label="Approved" value={INR(exp.approved_expenses,true)} change={8.3} color="#059669"/>
        <KPI label="MTD Expenses" value={INR(exp.mtd_expenses,true)} color="#1B4FD8"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <Card title="Expenses by Category" subtitle="Breakdown of all expense claims">
          {(exp.byCategory||[]).map((c,i)=>{
            const total = (exp.byCategory||[]).reduce((s,e)=>s+parseFloat(e.total||0),0)||1;
            const COLORS = ['#1B4FD8','#059669','#D97706','#DC2626','#7C3AED','#0284C7'];
            return (
              <div key={i} style={{marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:2}}>
                  <span style={{color:'#334155',textTransform:'capitalize'}}>{c.category||'Other'}</span>
                  <div style={{display:'flex',gap:8}}>
                    <span style={{color:'#94A3B8'}}>{c.count} claims</span>
                    <span style={{fontWeight:700,color:COLORS[i%COLORS.length]}}>{INR(c.total,true)}</span>
                  </div>
                </div>
                <ProgressBar value={parseFloat(c.total)} max={total} color={COLORS[i%COLORS.length]} h={5}/>
              </div>
            );
          })}
          {(!exp.byCategory||exp.byCategory.length===0) && <div style={{fontSize:11,color:'#94A3B8',textAlign:'center',padding:16}}>No expense data available</div>}
        </Card>
        <Card title="Policy Violations & Alerts">
          <div style={{padding:'10px 12px',borderRadius:8,background:'#ECFDF5',marginBottom:8,fontSize:11}}>
            <div style={{fontWeight:700,color:'#059669',marginBottom:2}}>✓ Expense Policy Active</div>
            <div style={{color:'#64748B'}}>Hotel: Rs 8,000/night · Meals: Rs 1,500/day · Travel: Rs 20,000/trip</div>
          </div>
          <div style={{padding:'10px 12px',borderRadius:8,background:'#FEF2F2',marginBottom:8,fontSize:11}}>
            <div style={{fontWeight:700,color:'#DC2626',marginBottom:4}}>⚠ Policy Violations This Month</div>
            {[['Hotel claim exceeds limit','Rs 12,000 vs Rs 8,000 allowed'],['Travel claim over limit','Rs 24,000 vs Rs 20,000 allowed']].map(([t,s],i)=>(
              <div key={i} style={{marginBottom:4}}><div style={{color:'#DC2626',fontWeight:500}}>{t}</div><div style={{color:'#94A3B8',fontSize:10}}>{s}</div></div>
            ))}
          </div>
          <div style={{padding:'10px 12px',borderRadius:8,background:'#FFFBEB',fontSize:11}}>
            <div style={{fontWeight:700,color:'#D97706',marginBottom:2}}>⏳ Pending Approvals</div>
            <div style={{color:'#64748B'}}>{exp.pending_count||0} claims worth {INR(exp.pending_expenses,true)} awaiting approval</div>
          </div>
        </Card>
      </div>
      <Card title="Expense Claims Register" subtitle="All employee expense claims">
        <MiniTable
          cols={[
            {key:'claim_number',label:'Claim No',render:v=><span style={{fontFamily:'monospace',fontSize:10,color:'#7C3AED',fontWeight:600}}>{v}</span>},
            {key:'employee_name',label:'Employee'},
            {key:'category',label:'Category',render:v=><span style={{textTransform:'capitalize'}}>{v||'Other'}</span>},
            {key:'total_amount',label:'Amount',right:true,render:v=>INR(v,true)},
            {key:'date',label:'Date',render:v=>v?new Date(v).toLocaleDateString('en-IN'):'—'},
            {key:'status',label:'Status',render:v=><Badge text={v||'draft'} color={statusColor(v)}/>},
          ]}
          rows={(exp.byCategory||[]).slice(0,8)}/>
      </Card>
    </div>
  );

  // ── TAX DASHBOARD ─────────────────────────────────────────
  const TaxDash = () => (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        <KPI label="Total Tax Liability" value={INR(s.totalRevenue*0.18*0.28,true)} color="#DC2626"/>
        <KPI label="GST Payable" value={INR(s.totalRevenue*0.18*0.4,true)} sub="Output - Input" color="#D97706"/>
        <KPI label="TDS Liability" value={INR(s.totalExpenses*0.10*0.3,true)} sub="Q4 FY 2024-25" color="#7C3AED"/>
        <KPI label="Income Tax Advance" value={INR(s.netProfit*0.25,true)} sub="Next installment" color="#1B4FD8"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <Card title="Tax Type Breakdown" subtitle="As % of total tax liability">
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <Donut size={110} thickness={20}
              segments={[
                {value:48,color:'#1B4FD8'},{value:22,color:'#D97706'},{value:12,color:'#7C3AED'},
                {value:10,color:'#DC2626'},{value:8,color:'#059669'}
              ]}
              centerLabel="Tax Mix" centerSub="FY 2024-25"/>
            <div style={{flex:1}}>
              {[['GST','48%','#1B4FD8'],['TDS','22%','#D97706'],['VAT','12%','#7C3AED'],['Income Tax','10%','#DC2626'],['PF/ESI','8%','#059669']].map(([l,p,c])=>(
                <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',fontSize:11}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:8,height:8,borderRadius:'50%',background:c}}/>{l}</div>
                  <span style={{fontWeight:700,color:c}}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card title="Upcoming Tax Deadlines">
          {[
            {name:'GST Return (GSTR-3B)',date:'20 Jun 2026',days:1,status:'Due'},
            {name:'TDS Return (Form 24Q)',date:'31 Jul 2026',days:43,status:'Upcoming'},
            {name:'Income Tax Return',date:'31 Oct 2026',days:73,status:'Planned'},
            {name:'PF/ESI Payment',date:'15 Jun 2026',days:-5,status:'Overdue'},
            {name:'Advance Tax Q1',date:'15 Jun 2026',days:-5,status:'Overdue'},
          ].map((t,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid #F8FAFF'}}>
              <div>
                <div style={{fontSize:11,fontWeight:500,color:'#0A1628'}}>{t.name}</div>
                <div style={{fontSize:10,color:'#94A3B8'}}>{t.date}</div>
              </div>
              <Badge text={t.status} color={t.days<0?'#DC2626':t.days<=7?'#D97706':'#059669'}/>
            </div>
          ))}
        </Card>
      </div>
      <Card title="GST Input vs Output Reconciliation">
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
          {[
            {label:'GST Output (Sales)',value:INR(s.totalRevenue*0.18,true),color:'#DC2626'},
            {label:'GST Input Credit (Purchase)',value:INR(s.totalExpenses*0.12,true),color:'#059669'},
            {label:'Net GST Payable',value:INR(s.totalRevenue*0.18-s.totalExpenses*0.12,true),color:'#D97706'},
            {label:'ITC Utilization',value:pct(s.totalExpenses*0.12,s.totalRevenue*0.18),color:'#1B4FD8'},
          ].map((k,i)=>(
            <div key={i} style={{padding:12,borderRadius:8,background:'#F8FAFF',border:`1px solid ${k.color}20`}}>
              <div style={{fontSize:10,color:'#64748B',marginBottom:4}}>{k.label}</div>
              <div style={{fontSize:18,fontWeight:800,color:k.color}}>{k.value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderDash = () => {
    switch(activeDash) {
      case 'executive': return <ExecutiveDash/>;
      case 'financial': return <ExecutiveDash/>;
      case 'ar': return <ARDash/>;
      case 'collections': return <ARDash/>;
      case 'credit': return <ARDash/>;
      case 'ap': return <APDash/>;
      case 'apaging': return <APDash/>;
      case 'budget': return <BudgetDash/>;
      case 'tax': return <TaxDash/>;
      case 'expense': return <ExpenseDash/>;
      default: return <ExecutiveDash/>;
    }
  };

  return (
    <div style={{background:'#F8FAFF',minHeight:'100%',display:'flex',flexDirection:'column'}}>
      {/* Top Header */}
      <div style={{background:'#0A1628',color:'#fff',padding:'12px 24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:36,height:36,borderRadius:8,background:'#1B4FD8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>📊</div>
            <div>
              <div style={{fontSize:16,fontWeight:800,letterSpacing:'-0.02em'}}>DEEMONA FINANCE COMMAND CENTER</div>
              <div style={{fontSize:11,color:'#94A3B8'}}>Enterprise Finance Platform · {new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {['MTD','QTD','YTD'].map(p=>(
              <button key={p} onClick={()=>setPeriod(p)} style={{padding:'5px 12px',borderRadius:6,border:'1px solid '+(period===p?'#3B82F6':'#2D3748'),background:period===p?'#1B4FD8':'transparent',color:period===p?'#fff':'#94A3B8',fontSize:11,fontWeight:600,cursor:'pointer'}}>{p}</button>
            ))}
            <button onClick={load} style={{padding:'5px 12px',borderRadius:6,border:'1px solid #2D3748',background:'transparent',color:'#94A3B8',fontSize:11,cursor:'pointer'}}>↻ Refresh</button>
          </div>
        </div>
        {/* Top KPI strip */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:8}}>
          {topKPIs.map((k,i)=>(
            <div key={i} style={{background:'#1A2744',borderRadius:8,padding:'8px 10px',borderLeft:`3px solid ${k.color}`}}>
              <div style={{fontSize:9,color:'#64748B',fontWeight:600,textTransform:'uppercase',marginBottom:3}}>{k.label}</div>
              <div style={{fontSize:14,fontWeight:800,color:'#fff',marginBottom:1}}>{k.value}</div>
              {k.sub && <div style={{fontSize:9,color:'#64748B'}}>{k.sub}</div>}
              {k.change !== undefined && <div style={{fontSize:9,fontWeight:700,color:parseFloat(k.change)>=0?'#34D399':'#F87171'}}>{parseFloat(k.change)>=0?'▲':'▼'} {Math.abs(k.change)}% vs LY</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Selector */}
      <div style={{background:'#fff',borderBottom:'1px solid #E8EDF5',padding:'8px 24px',display:'flex',gap:4,overflowX:'auto'}}>
        {DASHBOARDS.map(d=>(
          <button key={d.id} onClick={()=>setActiveDash(d.id)}
            style={{padding:'6px 12px',borderRadius:6,border:'1px solid '+(activeDash===d.id?d.color:'#E2E8F0'),background:activeDash===d.id?d.color+'10':'#fff',color:activeDash===d.id?d.color:'#64748B',fontSize:11,fontWeight:activeDash===d.id?700:400,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>
            {d.icon} {d.label}
          </button>
        ))}
      </div>

      {/* Dashboard Content */}
      <div style={{padding:'16px 24px',flex:1}}>
        {/* Current dashboard title */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div>
            <h2 style={{fontSize:15,fontWeight:800,color:'#0A1628',margin:0}}>{DASHBOARDS.find(d=>d.id===activeDash)?.label}</h2>
            <div style={{fontSize:11,color:'#94A3B8'}}>Real-time data · Drill-down enabled · Click any row to explore</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={{padding:'6px 14px',borderRadius:7,border:'1px solid #E2E8F0',background:'#fff',fontSize:11,color:'#64748B',cursor:'pointer'}}>📥 Export</button>
            <button style={{padding:'6px 14px',borderRadius:7,border:'1px solid #E2E8F0',background:'#fff',fontSize:11,color:'#64748B',cursor:'pointer'}}>📧 Email Report</button>
          </div>
        </div>
        {renderDash()}
      </div>

      {/* Drill-down modal */}
      {drill && (
        <div style={{position:'fixed',inset:0,background:'rgba(10,22,40,0.7)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:24}} onClick={()=>setDrill(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,padding:24,maxWidth:700,width:'100%',maxHeight:'80vh',overflow:'auto',boxShadow:'0 24px 64px rgba(0,0,0,0.3)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,borderBottom:'1px solid #F1F5F9',paddingBottom:12}}>
              <div style={{fontSize:14,fontWeight:800,color:'#0A1628'}}>Invoice Drill-Down: {drill.data?.invoice_number}</div>
              <button onClick={()=>setDrill(null)} style={{background:'#F1F5F9',border:'none',borderRadius:7,padding:'6px 12px',cursor:'pointer',fontSize:12}}>✕ Close</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:16}}>
              {[
                {label:'Customer',value:drill.data?.customer_name||drill.data?.vendor_name||'N/A'},
                {label:'Amount',value:INR(drill.data?.total_amount)},
                {label:'Due Date',value:drill.data?.due_date?new Date(drill.data.due_date).toLocaleDateString('en-IN'):'N/A'},
                {label:'Status',value:drill.data?.status||'N/A'},
                {label:'Days Overdue',value:parseInt(drill.data?.days_overdue||0)>0?drill.data.days_overdue+' days':'On time'},
              ].map((k,i)=>(
                <div key={i} style={{padding:10,borderRadius:8,background:'#F8FAFF'}}>
                  <div style={{fontSize:10,color:'#64748B'}}>{k.label}</div>
                  <div style={{fontSize:13,fontWeight:600,color:'#0A1628',marginTop:2}}>{k.value}</div>
                </div>
              ))}
            </div>
            <div style={{padding:14,borderRadius:8,background:'#EEF3FD',fontSize:11,color:'#1B4FD8'}}>
              <div style={{fontWeight:700,marginBottom:6}}>📋 Drill-Down Path:</div>
              <div>Invoice {drill.data?.invoice_number} → Journal Entries → GL Accounts → Source Documents</div>
              <div style={{marginTop:6,color:'#64748B'}}>Full transaction lineage available in the Accounting module → General Ledger</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
