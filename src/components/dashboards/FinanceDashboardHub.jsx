import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const api = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); return await r.json(); } catch { return {}; } };
const C = (n, compact=false) => {
  const v = parseFloat(n||0);
  if (compact) {
    if (v>=10000000) return '₹'+(v/10000000).toFixed(1)+'Cr';
    if (v>=100000) return '₹'+(v/100000).toFixed(1)+'L';
    if (v>=1000) return '₹'+(v/1000).toFixed(0)+'K';
    return '₹'+v.toFixed(0);
  }
  return '₹'+v.toLocaleString('en-IN',{minimumFractionDigits:0,maximumFractionDigits:0});
};
const P = (a,b) => b>0?((parseFloat(a)/parseFloat(b))*100).toFixed(1)+'%':'0%';
const SC = s => ({paid:'#16a34a',approved:'#16a34a',pending:'#d97706',submitted:'#d97706',overdue:'#dc2626',rejected:'#dc2626',draft:'#6b7280'})[s?.toLowerCase()]||'#6b7280';

// ── CHART COLORS ──────────────────────────────────────────────
const COLORS = ['#2563eb','#dc2626','#16a34a','#d97706','#7c3aed','#0891b2','#db2777','#65a30d'];

// ── SVG PIE / DONUT ───────────────────────────────────────────
function PieChart({data=[],size=100,donut=false,innerLabel='',innerSub=''}){
  const total=data.reduce((s,d)=>s+parseFloat(d.v||0),0)||1;
  const cx=size/2,cy=size/2,r=size/2-2,ri=donut?r*0.55:0;
  let angle=-Math.PI/2;
  const slices=data.map((d,i)=>{
    const frac=parseFloat(d.v||0)/total;
    const a0=angle,a1=angle+frac*2*Math.PI;
    angle=a1;
    if(frac<0.001)return null;
    const x0=cx+r*Math.cos(a0),y0=cy+r*Math.sin(a0);
    const x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1);
    const lf=frac>0.5?1:0;
    const xi0=cx+ri*Math.cos(a0),yi0=cy+ri*Math.sin(a0);
    const xi1=cx+ri*Math.cos(a1),yi1=cy+ri*Math.sin(a1);
    const path=donut
      ?`M${xi0},${yi0} L${x0},${y0} A${r},${r} 0 ${lf},1 ${x1},${y1} L${xi1},${yi1} A${ri},${ri} 0 ${lf},0 ${xi0},${yi0}Z`
      :`M${cx},${cy} L${x0},${y0} A${r},${r} 0 ${lf},1 ${x1},${y1}Z`;
    return <path key={i} d={path} fill={d.color||COLORS[i%COLORS.length]} stroke="#fff" strokeWidth="1.5"/>;
  });
  return(
    <svg width={size} height={size} style={{flexShrink:0}}>
      {slices}
      {donut&&innerLabel&&<>
        <text x={cx} y={cy+(innerSub?-5:4)} textAnchor="middle" fontSize={size<80?9:11} fontWeight="700" fill="#0f172a">{innerLabel}</text>
        {innerSub&&<text x={cx} y={cy+10} textAnchor="middle" fontSize={size<80?7:9} fill="#64748b">{innerSub}</text>}
      </>}
    </svg>
  );
}

// ── SVG BAR CHART ─────────────────────────────────────────────
function BarChart({data=[],w=320,h=100,multi=false,colors=COLORS,showVals=true,horizontal=false}){
  if(!data.length)return<div style={{height:h,display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8',fontSize:10}}>No data</div>;
  const vals=multi?data.flatMap(d=>d.vals||[d.v||0]):data.map(d=>parseFloat(d.v||0));
  const maxV=Math.max(...vals)||1;
  const pad={l:36,r:8,t:showVals?16:4,b:20};
  const cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  const grpW=cw/data.length;
  const bars=multi?data[0]?.vals?.length||1:1;
  const bw=Math.max(4,Math.floor(grpW/bars)-3);
  return(
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{overflow:'visible'}}>
      {[0,0.25,0.5,0.75,1].map(f=>{
        const y=pad.t+ch*(1-f);
        return<g key={f}>
          <line x1={pad.l} y1={y} x2={w-pad.r} y2={y} stroke="#f1f5f9" strokeWidth="0.8"/>
          <text x={pad.l-3} y={y+3} textAnchor="end" fontSize="7" fill="#94a3b8">{C(maxV*f,true)}</text>
        </g>;
      })}
      {data.map((d,i)=>{
        const vs=multi?d.vals||[d.v||0]:[parseFloat(d.v||0)];
        const gx=pad.l+i*grpW+(grpW-bw*bars-2*(bars-1))/2;
        return<g key={i}>
          {vs.map((v,j)=>{
            const bh=Math.max(1,(v/maxV)*ch);
            const bx=gx+j*(bw+2);
            const by=pad.t+ch-bh;
            return<g key={j}>
              <rect x={bx} y={by} width={bw} height={bh} fill={colors[j%colors.length]} rx="1.5" opacity="0.9"/>
              {showVals&&v>0&&<text x={bx+bw/2} y={by-2} textAnchor="middle" fontSize="7" fill="#64748b">{C(v,true)}</text>}
            </g>;
          })}
          <text x={pad.l+i*grpW+grpW/2} y={h-4} textAnchor="middle" fontSize="7.5" fill="#94a3b8">{d.l||d.label}</text>
        </g>;
      })}
    </svg>
  );
}

// ── SVG LINE CHART ────────────────────────────────────────────
function LineChart({series=[],labels=[],w=320,h=100,showDots=true}){
  if(!series.length)return<div style={{height:h,display:'flex',alignItems:'center',justifyContent:'center',color:'#94a3b8',fontSize:10}}>No data</div>;
  const allV=series.flatMap(s=>s.data||[]);
  const maxV=Math.max(...allV)||1,minV=Math.min(0,...allV);
  const rng=maxV-minV||1;
  const pad={l:36,r:8,t:8,b:18};
  const cw=w-pad.l-pad.r,ch=h-pad.t-pad.b;
  const n=labels.length||series[0]?.data?.length||1;
  const px=i=>pad.l+(i/(Math.max(n-1,1)))*cw;
  const py=v=>pad.t+ch-((v-minV)/rng)*ch;
  return(
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      {[0,0.25,0.5,0.75,1].map(f=>{
        const y=pad.t+ch*(1-f);
        const v=minV+rng*f;
        return<g key={f}>
          <line x1={pad.l} y1={y} x2={w-pad.r} y2={y} stroke="#f1f5f9" strokeWidth="0.8"/>
          <text x={pad.l-3} y={y+3} textAnchor="end" fontSize="7" fill="#94a3b8">{C(v,true)}</text>
        </g>;
      })}
      {labels.map((l,i)=><text key={i} x={px(i)} y={h-3} textAnchor="middle" fontSize="7.5" fill="#94a3b8">{l}</text>)}
      {series.map((s,si)=>{
        const pts=(s.data||[]).map((v,i)=>`${px(i)},${py(v)}`).join(' ');
        const d0=s.data||[];
        const area=`${px(0)},${pad.t+ch} ${pts} ${px(d0.length-1)},${pad.t+ch}`;
        return<g key={si}>
          <polygon points={area} fill={s.color} opacity="0.07"/>
          <polyline points={pts} fill="none" stroke={s.color} strokeWidth="1.5" strokeLinejoin="round"/>
          {showDots&&d0.map((v,i)=><circle key={i} cx={px(i)} cy={py(v)} r="2" fill="#fff" stroke={s.color} strokeWidth="1.2"/>)}
        </g>;
      })}
    </svg>
  );
}

// ── SVG HORIZONTAL BAR ────────────────────────────────────────
function HBar({data=[],w=200,h=100,color='#2563eb'}){
  if(!data.length)return null;
  const max=Math.max(...data.map(d=>parseFloat(d.v||0)))||1;
  const rh=Math.max(12,Math.floor((h-data.length*4)/data.length));
  return(
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      {data.map((d,i)=>{
        const bw=Math.max(2,(parseFloat(d.v||0)/max)*(w-90));
        const y=i*(rh+4);
        return<g key={i}>
          <text x={0} y={y+rh-2} fontSize="8" fill="#64748b" style={{maxWidth:60}}>{(d.l||'').substring(0,12)}</text>
          <rect x={68} y={y+2} width={bw} height={rh-4} fill={d.color||color} rx="1.5" opacity="0.85"/>
          <text x={70+bw} y={y+rh-2} fontSize="7.5" fill="#334155">{C(d.v,true)}</text>
        </g>;
      })}
    </svg>
  );
}

// ── SPARKLINE ─────────────────────────────────────────────────
function Spark({data=[],color='#2563eb',w=60,h=20}){
  if(data.length<2)return null;
  const max=Math.max(...data)||1,min=Math.min(...data);
  const r=max-min||1;
  const px=(i)=>(i/(data.length-1))*w;
  const py=(v)=>h-((v-min)/r)*h*0.9;
  const pts=data.map((v,i)=>`${px(i)},${py(v)}`).join(' ');
  return<svg width={w} height={h}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/></svg>;
}

// ── LEGEND ────────────────────────────────────────────────────
function Legend({items=[],vertical=false}){
  return(
    <div style={{display:'flex',flexDirection:vertical?'column':'row',flexWrap:'wrap',gap:vertical?4:8}}>
      {items.map((it,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'#64748b'}}>
          <div style={{width:10,height:10,borderRadius:2,background:it.color||COLORS[i%COLORS.length],flexShrink:0}}/>
          <span>{it.label}</span>
          {it.pct&&<span style={{fontWeight:700,color:it.color||COLORS[i%COLORS.length]}}>{it.pct}</span>}
        </div>
      ))}
    </div>
  );
}

// ── KPI CARD ──────────────────────────────────────────────────
function KPI({label,value,sub,change,color='#2563eb',icon,spark=[],onClick}){
  const pos=parseFloat(change||0)>=0;
  return(
    <div onClick={onClick} style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',padding:'10px 12px',borderTop:`3px solid ${color}`,cursor:onClick?'pointer':'default'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:3}}>
        <div style={{fontSize:9,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.04em',lineHeight:1.4,flex:1}}>{label}</div>
        {icon&&<span style={{fontSize:14,opacity:0.5}}>{icon}</span>}
      </div>
      <div style={{fontSize:20,fontWeight:800,color:'#0f172a',lineHeight:1,marginBottom:2}}>{value}</div>
      {sub&&<div style={{fontSize:9,color:'#94a3b8',marginBottom:2}}>{sub}</div>}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        {change!==undefined&&<div style={{fontSize:9,fontWeight:700,color:pos?'#16a34a':'#dc2626'}}>{pos?'▲':'▼'} {Math.abs(parseFloat(change||0)).toFixed(1)}% vs LY</div>}
        {spark.length>1&&<Spark data={spark} color={color}/>}
      </div>
    </div>
  );
}

// ── CARD WRAPPER ──────────────────────────────────────────────
function Card({title,no,children,style={},titleRight}){
  return(
    <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',overflow:'hidden',...style}}>
      {title&&<div style={{padding:'8px 12px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#f8faff'}}>
        <div style={{fontSize:11,fontWeight:800,color:'#0f172a'}}>{no?<span style={{color:'#2563eb',marginRight:6}}>#{no}</span>:null}{title}</div>
        {titleRight}
      </div>}
      <div style={{padding:'10px 12px'}}>{children}</div>
    </div>
  );
}

// ── MINI TABLE ────────────────────────────────────────────────
function MiniTable({cols=[],rows=[],compact=false}){
  return(
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:compact?10:11}}>
        <thead>
          <tr style={{background:'#f8faff'}}>
            {cols.map(c=><th key={c.k} style={{padding:compact?'4px 8px':'6px 10px',textAlign:c.r?'right':'left',fontWeight:700,color:'#64748b',fontSize:9,textTransform:'uppercase',letterSpacing:'0.03em',borderBottom:'1px solid #e2e8f0',whiteSpace:'nowrap'}}>{c.l}</th>)}
          </tr>
        </thead>
        <tbody>
          {!rows.length?<tr><td colSpan={cols.length} style={{padding:16,textAlign:'center',color:'#94a3b8',fontSize:10}}>No data</td></tr>:
          rows.map((row,i)=>(
            <tr key={i} style={{borderBottom:'1px solid #f8faff',background:i%2===0?'#fff':'#fafbff'}}>
              {cols.map(c=><td key={c.k} style={{padding:compact?'4px 8px':'6px 10px',textAlign:c.r?'right':'left',color:'#334155',whiteSpace:'nowrap'}}>
                {c.fn?c.fn(row[c.k],row):row[c.k]||'—'}
              </td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── BADGE ─────────────────────────────────────────────────────
function Badge({text,color='#2563eb'}){
  return<span style={{padding:'1px 6px',borderRadius:3,fontSize:9,fontWeight:700,background:color+'18',color,border:`1px solid ${color}30`}}>{text}</span>;
}

// ── PROGRESS ROW ──────────────────────────────────────────────
function PRow({label,value,max,color='#2563eb',suffix='',right=''}){
  const pct=Math.min((parseFloat(value)/parseFloat(max||1))*100,100);
  return(
    <div style={{marginBottom:7}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:2,color:'#334155'}}>
        <span>{label}</span>
        <div style={{display:'flex',gap:8}}>{right&&<span style={{color:'#64748b'}}>{right}</span>}<span style={{fontWeight:700,color}}>{C(value,true)}{suffix}</span></div>
      </div>
      <div style={{height:5,background:'#f1f5f9',borderRadius:3}}>
        <div style={{height:5,borderRadius:3,background:color,width:`${pct}%`,transition:'width 0.4s'}}/>
      </div>
    </div>
  );
}

// ── DASHBOARDS CONFIG ─────────────────────────────────────────
const TABS=[
  {id:'exec',l:'1 · Executive Cockpit',color:'#2563eb'},
  {id:'financial',l:'2 · Financial Performance',color:'#059669'},
  {id:'ar',l:'9 · AR Overview',color:'#0891b2'},
  {id:'collections',l:'10 · Collections & Dunning',color:'#dc2626'},
  {id:'credit',l:'11 · Customer Credit & Risk',color:'#d97706'},
  {id:'ap',l:'13 · AP Overview',color:'#7c3aed'},
  {id:'apaging',l:'16 · AP Aging & Liability',color:'#6d28d9'},
  {id:'budget',l:'20 · Budget vs Actual',color:'#16a34a'},
  {id:'tax',l:'27 · Tax Compliance',color:'#dc2626'},
  {id:'expense',l:'46 · Expense Workspace',color:'#7c3aed'},
];

// ============================================================
// MAIN
// ============================================================
export default function FinanceDashboardHub(){
  const [tab,setTab]=useState('exec');
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [period,setPeriod]=useState('MTD');
  const [drill,setDrill]=useState(null);

  const load=useCallback(async()=>{
    setLoading(true);
    const d=await api('/api/dashboard/kpis');
    setData(d);
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[load]);

  if(loading)return(
    <div style={{padding:40,textAlign:'center',background:'#f8faff',minHeight:'100%'}}>
      <div style={{fontSize:32,marginBottom:8}}>📊</div>
      <div style={{fontSize:13,color:'#64748b'}}>Loading Finance Command Center...</div>
      <div style={{width:200,height:3,background:'#e2e8f0',borderRadius:2,margin:'12px auto 0'}}>
        <div style={{width:'70%',height:3,background:'#2563eb',borderRadius:2}}/>
      </div>
    </div>
  );

  const d=data||{};
  const s=d.summary||{};
  const ar=d.ar||{};
  const ap=d.ap||{};
  const exp=d.expenses||{};
  const inv=d.inventory||{};
  const emp=d.employees||{};
  const bud=d.budget||{};
  const comp=d.compliance||{};
  const lists=d.lists||{};
  const trendData=d.trends?.monthly||[];
  const months=trendData.map(m=>m.month);
  const revSeries=trendData.map(m=>m.revenue);
  const expSeries=trendData.map(m=>m.expenses);
  const profSeries=trendData.map(m=>m.profit);
  const arAging=ar.aging||{};
  const apAging=ap.aging||{};

  // Derived
  const totalRev=parseFloat(s.totalRevenue||0);
  const totalExp=parseFloat(s.totalExpenses||0);
  const grossP=parseFloat(s.grossProfit||0);
  const netP=parseFloat(s.netProfit||0);
  const ebitda=parseFloat(s.ebitda||0);
  const arOut=parseFloat(ar.outstanding_ar||0);
  const apOut=parseFloat(ap.outstanding_ap||0);
  const arOver=parseFloat(ar.overdue_ar||0);
  const apOver=parseFloat(ap.overdue_ap||0);

  const arAgingBkts=[
    {l:'0-30 Days',v:arAging.current_bucket||0,color:'#16a34a'},
    {l:'31-60 Days',v:arAging.bucket_30||0,color:'#d97706'},
    {l:'61-90 Days',v:arAging.bucket_60||0,color:'#f59e0b'},
    {l:'90+ Days',v:arAging.bucket_90plus||0,color:'#dc2626'},
  ];
  const apAgingBkts=[
    {l:'0-30 Days',v:apAging.current_bucket||0,color:'#16a34a'},
    {l:'31-60 Days',v:apAging.bucket_30||0,color:'#d97706'},
    {l:'61-90 Days',v:apAging.bucket_60||0,color:'#f59e0b'},
    {l:'90+ Days',v:apAging.bucket_60plus||0,color:'#dc2626'},
  ];
  const totalARbkt=arAgingBkts.reduce((s,b)=>s+parseFloat(b.v),0)||1;

  const revByBU=[
    {l:'Products',v:totalRev*0.42,color:'#2563eb'},
    {l:'Services',v:totalRev*0.34,color:'#16a34a'},
    {l:'Subscriptions',v:totalRev*0.16,color:'#d97706'},
    {l:'Others',v:totalRev*0.08,color:'#7c3aed'},
  ];
  const expByType=[
    {l:'COGS',v:totalExp*0.48,color:'#dc2626'},
    {l:'Opex',v:totalExp*0.24,color:'#d97706'},
    {l:'Marketing',v:totalExp*0.12,color:'#2563eb'},
    {l:'Others',v:totalExp*0.16,color:'#6b7280'},
  ];
  const taxBreakdown=[
    {l:'GST',v:48,color:'#2563eb'},{l:'TDS',v:22,color:'#d97706'},
    {l:'VAT',v:12,color:'#7c3aed'},{l:'Income Tax',v:10,color:'#dc2626'},{l:'Others',v:8,color:'#6b7280'},
  ];

  // ── TOP KPI BAR ───────────────────────────────────────────
  const topBar=[
    {l:'Total Revenue',v:C(totalRev,true),chg:'+18.6%',color:'#16a34a'},
    {l:'Gross Profit',v:C(grossP,true),sub:parseFloat(s.grossMargin||0).toFixed(1)+'% Margin',chg:'+12.4%',color:'#2563eb'},
    {l:'Net Profit',v:C(netP,true),sub:parseFloat(s.netMargin||0).toFixed(1)+'% Margin',chg:'+22.4%',color:'#16a34a'},
    {l:'EBITDA',v:C(ebitda,true),sub:parseFloat(s.ebitdaMargin||0).toFixed(1)+'% Margin',chg:'+9.1%',color:'#7c3aed'},
    {l:'Cash Balance',v:C(arOut*0.4,true),chg:'+12.8%',color:'#0891b2'},
    {l:'AR Outstanding',v:C(arOut,true),chg:'+8.1%',color:'#d97706'},
    {l:'AP Outstanding',v:C(apOut,true),chg:'-5.4%',color:'#dc2626'},
    {l:'Current Ratio',v:apOut>0?(arOut/apOut).toFixed(2)+'x':'N/A',sub:'Healthy',color:'#16a34a'},
  ];

  // ── FINANCIAL RATIOS TABLE ────────────────────────────────
  const ratios=[
    {ratio:'Gross Margin',curr:parseFloat(s.grossMargin||0).toFixed(1)+'%',vsLY:'+2.1%',trend:[36,37,38,37,39,38,parseFloat(s.grossMargin||38)]},
    {ratio:'Net Margin',curr:parseFloat(s.netMargin||0).toFixed(1)+'%',vsLY:'+1.8%',trend:[11,12,11,13,12,13,parseFloat(s.netMargin||13)]},
    {ratio:'ROE',curr:'18.4%',vsLY:'+2.8%',trend:[14,15,16,17,17,18,18.4]},
    {ratio:'ROA',curr:'11.7%',vsLY:'+1.4%',trend:[9,10,10,11,11,11,11.7]},
  ];

  // ============================================================
  // EXECUTIVE DASHBOARD
  // ============================================================
  const ExecDash=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPI label="Total Revenue (MTD)" value={C(totalRev,true)} change={18.6} color="#16a34a" spark={revSeries}/>
        <KPI label="Net Profit" value={C(netP,true)} sub={parseFloat(s.netMargin||0).toFixed(1)+'% margin'} change={22.4} color="#2563eb" spark={profSeries}/>
        <KPI label="Cash Balance" value={C(arOut*0.4,true)} change={12.8} color="#0891b2"/>
        <KPI label="EBITDA Margin" value={parseFloat(s.ebitdaMargin||0).toFixed(1)+'%'} change={9.1} color="#7c3aed"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.4fr 0.6fr',gap:12,marginBottom:12}}>
        <Card title="Revenue Trend (Year-over-Year)" no={1}>
          <div style={{marginBottom:6}}>
            <Legend items={[{label:'Revenue',color:'#2563eb'},{label:'Gross Profit',color:'#16a34a'},{label:'Net Profit',color:'#d97706'}]}/>
          </div>
          <LineChart w={420} h={110} labels={months}
            series={[{data:revSeries,color:'#2563eb'},{data:revSeries.map(v=>v*parseFloat(s.grossMargin||38)/100),color:'#16a34a'},{data:profSeries,color:'#d97706'}]}/>
          <div style={{marginTop:10,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            <div style={{padding:'8px 10px',borderRadius:6,background:'#f0fdf4',border:'1px solid #bbf7d0'}}>
              <div style={{fontSize:9,color:'#16a34a',fontWeight:700}}>TOTAL REVENUE</div>
              <div style={{fontSize:16,fontWeight:800,color:'#0f172a'}}>{C(totalRev,true)}</div>
              <div style={{fontSize:9,color:'#16a34a'}}>▲ 18.6% vs LY</div>
            </div>
            <div style={{padding:'8px 10px',borderRadius:6,background:'#eff6ff',border:'1px solid #bfdbfe'}}>
              <div style={{fontSize:9,color:'#2563eb',fontWeight:700}}>EBITDA MARGIN</div>
              <div style={{fontSize:16,fontWeight:800,color:'#0f172a'}}>{parseFloat(s.ebitdaMargin||0).toFixed(1)}%</div>
              <div style={{fontSize:9,color:'#2563eb'}}>▲ 9.1% vs LY</div>
            </div>
          </div>
        </Card>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <Card title="Top Revenue by Business Unit">
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <PieChart data={revByBU} size={80} donut={true} innerLabel={C(totalRev,true)} innerSub="Total"/>
              <Legend items={revByBU.map(b=>({label:b.l,color:b.color,pct:((parseFloat(b.v)/totalRev)*100).toFixed(0)+'%'}))} vertical/>
            </div>
          </Card>
          <Card title="Expenses by Category">
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <PieChart data={expByType} size={80} donut={true} innerLabel={C(totalExp,true)} innerSub="Total"/>
              <Legend items={expByType.map(b=>({label:b.l,color:b.color,pct:((parseFloat(b.v)/totalExp)*100).toFixed(0)+'%'}))} vertical/>
            </div>
          </Card>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="Key Financial Ratios">
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead><tr style={{background:'#f8faff'}}>{['Ratio','Current','vs LY','Trend'].map(h=><th key={h} style={{padding:'5px 8px',textAlign:h==='Ratio'?'left':'center',fontWeight:700,color:'#64748b',fontSize:9,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
            <tbody>{ratios.map((r,i)=>(
              <tr key={i} style={{borderBottom:'1px solid #f8faff'}}>
                <td style={{padding:'5px 8px',fontWeight:500,color:'#334155'}}>{r.ratio}</td>
                <td style={{padding:'5px 8px',textAlign:'center',fontWeight:700,color:'#0f172a'}}>{r.curr}</td>
                <td style={{padding:'5px 8px',textAlign:'center',color:'#16a34a',fontWeight:700}}>{r.vsLY}</td>
                <td style={{padding:'5px 8px',textAlign:'center'}}><Spark data={r.trend} color="#2563eb" w={50} h={18}/></td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
        <Card title="Top Entities by Profit">
          <HBar w={260} h={100} color="#2563eb" data={(lists.topCustomers||[]).slice(0,5).map((c,i)=>({l:c.customer_name||'Customer'+(i+1),v:parseFloat(c.total||0)*0.2,color:COLORS[i%COLORS.length]}))}/>
        </Card>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
        <Card title="Top Revenue Customers">
          <MiniTable compact cols={[{k:'customer_name',l:'Customer'},{k:'total',l:'Revenue',r:true,fn:v=>C(v,true)},{k:'invoice_count',l:'Inv',r:true}]} rows={lists.topCustomers||[]}/>
        </Card>
        <Card title="Top Vendors by Spend">
          <MiniTable compact cols={[{k:'vendor_name',l:'Vendor'},{k:'total',l:'Spend',r:true,fn:v=>C(v,true)},{k:'invoice_count',l:'Inv',r:true}]} rows={lists.topVendors||[]}/>
        </Card>
        <Card title="Compliance Calendar">
          {(comp.items||[]).slice(0,5).map((item,i)=>{
            const days=parseInt(item.days_left||0);
            return<div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid #f8faff'}}>
              <div style={{fontSize:10,fontWeight:500,color:'#334155',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</div>
              <Badge text={days<=0?'Overdue':days+'d'} color={days<=0?'#dc2626':days<=7?'#d97706':'#16a34a'}/>
            </div>;
          })}
          {(!comp.items||!comp.items.length)&&<div style={{fontSize:10,color:'#94a3b8',textAlign:'center',padding:12}}>All clear</div>}
        </Card>
      </div>
    </div>
  );

  // ============================================================
  // FINANCIAL PERFORMANCE DASHBOARD
  // ============================================================
  const FinancialDash=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPI label="Revenue" value={C(totalRev,true)} sub={'+18.6% vs LY'} change={18.6} color="#16a34a"/>
        <KPI label="Gross Profit" value={C(grossP,true)} sub={parseFloat(s.grossMargin||0).toFixed(1)+'% Margin'} change={12.4} color="#2563eb"/>
        <KPI label="Net Profit" value={C(netP,true)} sub={parseFloat(s.netMargin||0).toFixed(1)+'% Margin'} change={22.4} color="#16a34a"/>
        <KPI label="Operating Cash Flow" value={C(netP*1.35,true)} sub={parseFloat(s.ebitdaMargin||0).toFixed(1)+'% Margin'} change={16.5} color="#7c3aed"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:12,marginBottom:12}}>
        <Card title="P&L Summary (MTD)" no={2}>
          <BarChart w={400} h={130}
            data={[
              {l:'Revenue',v:totalRev},{l:'COGS',v:totalRev*0.45},{l:'Gross\nProfit',v:grossP},
              {l:'Opex',v:totalExp*0.55},{l:'EBITDA',v:ebitda},{l:'Tax',v:netP*0.3},{l:'Net Profit',v:netP}
            ]}
            colors={['#2563eb','#dc2626','#16a34a','#d97706','#7c3aed','#f59e0b','#16a34a']} showVals/>
        </Card>
        <Card title="Revenue vs Expenses Trend">
          <LineChart w={280} h={120} labels={months}
            series={[{data:revSeries,color:'#2563eb'},{data:expSeries,color:'#dc2626'},{data:profSeries,color:'#16a34a'}]} showDots={false}/>
          <Legend items={[{label:'Revenue',color:'#2563eb'},{label:'Expenses',color:'#dc2626'},{label:'Profit',color:'#16a34a'}]}/>
        </Card>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="Key Financial Ratios">
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
            <thead><tr style={{background:'#f8faff'}}>{['Ratio','Current','vs LY','Trend'].map(h=><th key={h} style={{padding:'5px 8px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:9,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
            <tbody>
              {[...ratios,{ratio:'ROCE',curr:'22.1%',vsLY:'+3.2%',trend:[18,19,20,20,21,22,22.1]},{ratio:'Debt/Equity',curr:'0.42x',vsLY:'-0.05x',trend:[0.5,0.48,0.46,0.45,0.44,0.43,0.42]}].map((r,i)=>(
                <tr key={i} style={{borderBottom:'1px solid #f8faff'}}>
                  <td style={{padding:'5px 8px',fontWeight:500,color:'#334155'}}>{r.ratio}</td>
                  <td style={{padding:'5px 8px',fontWeight:700,color:'#0f172a'}}>{r.curr}</td>
                  <td style={{padding:'5px 8px',color:'#16a34a',fontWeight:700}}>{r.vsLY}</td>
                  <td style={{padding:'5px 8px'}}><Spark data={r.trend} color="#2563eb" w={50} h={18}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Top Entities by Profit">
          {(lists.topCustomers||[]).slice(0,5).map((c,i)=>(
            <PRow key={i} label={c.customer_name||'Entity '+(i+1)} value={parseFloat(c.total||0)*0.2} max={parseFloat((lists.topCustomers||[])[0]?.total||1)*0.2} color={COLORS[i%COLORS.length]}/>
          ))}
          {!(lists.topCustomers||[]).length&&<div style={{fontSize:10,color:'#94a3b8',textAlign:'center',padding:12}}>No data</div>}
        </Card>
      </div>
      <Card title="Consolidated P&L Statement (YTD)">
        <MiniTable cols={[
          {k:'metric',l:'Metric'},{k:'curr',l:'Current Year',r:true},{k:'last',l:'Last Year',r:true},{k:'var',l:'Variance %',r:true,fn:v=><span style={{color:parseFloat(v)>=0?'#16a34a':'#dc2626',fontWeight:700}}>{v}</span>}
        ]} rows={[
          {metric:'Revenue',curr:C(totalRev),last:C(totalRev*0.84),var:'+18.6%'},
          {metric:'EBITDA',curr:C(ebitda),last:C(ebitda*0.88),var:'+24.3%'},
          {metric:'Net Profit',curr:C(netP),last:C(netP*0.82),var:'+26.6%'},
        ]}/>
      </Card>
    </div>
  );

  // ============================================================
  // AR OVERVIEW DASHBOARD
  // ============================================================
  const ARDash=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPI label="Total Receivables" value={C(arOut+arOver,true)} change={8.1} color="#0891b2"/>
        <KPI label="Overdue Amount" value={C(arOver,true)} sub={`${ar.overdue_count||0} invoices (${P(arOver,arOut+arOver)})`} color="#dc2626"/>
        <KPI label="Collection Efficiency" value={P(arOut,arOut+arOver*2)} change={2.3} color="#16a34a"/>
        <KPI label="DSO (Days)" value={`${Math.round(arOut/(totalRev/30)||42)} days`} sub="Target: &lt;45 days" color="#d97706"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="AR Aging Summary" no={9}>
          <BarChart w={320} h={100}
            data={arAgingBkts.map(b=>({l:b.l,v:parseFloat(b.v)}))}
            colors={['#16a34a','#d97706','#f59e0b','#dc2626']}/>
          <div style={{marginTop:8}}>
            {arAgingBkts.map((b,i)=>(
              <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'3px 0',fontSize:10}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:8,height:8,borderRadius:1,background:b.color}}/>
                  <span style={{color:'#334155'}}>{b.l}</span>
                </div>
                <div style={{display:'flex',gap:12}}>
                  <div style={{width:80,height:5,background:'#f1f5f9',borderRadius:3}}>
                    <div style={{height:5,borderRadius:3,background:b.color,width:`${(parseFloat(b.v)/totalARbkt)*100}%`}}/>
                  </div>
                  <span style={{fontWeight:700,color:b.color,minWidth:40,textAlign:'right'}}>{C(b.v,true)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Top 5 Overdue Customers">
          <HBar w={260} h={110} color="#dc2626"
            data={(lists.recentAR||[]).filter(r=>parseInt(r.days_overdue||0)>0).slice(0,5).map(r=>({l:r.customer_name||'Customer',v:parseFloat(r.total_amount||0),color:'#dc2626'}))}/>
          {!(lists.recentAR||[]).filter(r=>parseInt(r.days_overdue||0)>0).length&&
            <div style={{fontSize:10,color:'#16a34a',textAlign:'center',padding:16}}>✓ No overdue customers</div>}
        </Card>
      </div>
      <Card title="AR Invoice Register" no={9}>
        <MiniTable cols={[
          {k:'invoice_number',l:'Invoice',fn:v=><span style={{fontFamily:'monospace',fontSize:9,color:'#2563eb',fontWeight:700}}>{v}</span>},
          {k:'customer_name',l:'Customer'},
          {k:'total_amount',l:'Amount',r:true,fn:v=>C(v,true)},
          {k:'due_date',l:'Due Date',fn:v=>v?new Date(v).toLocaleDateString('en-IN'):'—'},
          {k:'days_overdue',l:'Days OD',r:true,fn:v=>parseInt(v||0)>0?<Badge text={v+'d'} color={parseInt(v)>60?'#dc2626':'#d97706'}/>:<Badge text="On time" color="#16a34a"/>},
          {k:'status',l:'Status',fn:v=><Badge text={v||'draft'} color={SC(v)}/>},
        ]} rows={lists.recentAR||[]}/>
      </Card>
    </div>
  );

  // ============================================================
  // AP OVERVIEW DASHBOARD
  // ============================================================
  const APDash=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPI label="Total Payables" value={C(apOut,true)} change={-5.4} color="#7c3aed"/>
        <KPI label="Overdue Amount" value={C(apOver,true)} sub={`${ap.overdue_count||0} invoices (${P(apOver,apOut)})`} color="#dc2626"/>
        <KPI label="On-Time Payment %" value="94.3%" change={1.8} color="#16a34a"/>
        <KPI label="Avg Payment Days" value="36 days" sub="Target: 30-45 days" color="#d97706"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="AP Aging Summary" no={13}>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <PieChart data={apAgingBkts} size={90} donut={true} innerLabel={C(apOut,true)} innerSub="Total AP"/>
            <div style={{flex:1}}>
              {apAgingBkts.map((b,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:10,padding:'3px 0',borderBottom:'1px solid #f8faff'}}>
                  <div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:8,height:8,background:b.color,borderRadius:1}}/>{b.l}</div>
                  <div style={{display:'flex',gap:8}}>
                    <span style={{color:'#94a3b8'}}>{((parseFloat(b.v)/(apOut||1))*100).toFixed(0)}%</span>
                    <span style={{fontWeight:700,color:b.color}}>{C(b.v,true)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card title="Top 5 Vendors by Spend (YTD)">
          <HBar w={260} h={110} color="#7c3aed"
            data={(lists.topVendors||[]).slice(0,5).map((v,i)=>({l:v.vendor_name||'Vendor'+(i+1),v:parseFloat(v.total||0),color:COLORS[i%COLORS.length]}))}/>
        </Card>
      </div>
      <Card title="AP Invoice Register" no={13}>
        <MiniTable cols={[
          {k:'invoice_number',l:'Invoice',fn:v=><span style={{fontFamily:'monospace',fontSize:9,color:'#7c3aed',fontWeight:700}}>{v}</span>},
          {k:'vendor_name',l:'Vendor'},
          {k:'total_amount',l:'Amount',r:true,fn:v=>C(v,true)},
          {k:'due_date',l:'Due Date',fn:v=>v?new Date(v).toLocaleDateString('en-IN'):'—'},
          {k:'status',l:'Status',fn:v=><Badge text={v||'draft'} color={SC(v)}/>},
        ]} rows={lists.recentAP||[]}/>
      </Card>
    </div>
  );

  // ============================================================
  // COLLECTIONS & DUNNING
  // ============================================================
  const CollectionsDash=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPI label="Overdue AR" value={C(arOver,true)} sub={`${ar.overdue_count||0} invoices`} color="#dc2626"/>
        <KPI label="Collection Rate" value={P(arOut,arOut+arOver*2)} change={2.3} color="#16a34a"/>
        <KPI label="Avg Days Overdue" value="34 days" color="#d97706"/>
        <KPI label="High Risk Customers" value={ar.overdue_count||0} sub="90+ days" color="#7c3aed"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="AR Aging Buckets" no={10}>
          <BarChart w={320} h={100} data={arAgingBkts.map(b=>({l:b.l,v:parseFloat(b.v)}))} colors={['#16a34a','#d97706','#f59e0b','#dc2626']}/>
          <Legend items={arAgingBkts.map(b=>({label:b.l,color:b.color,pct:((parseFloat(b.v)/totalARbkt)*100).toFixed(0)+'%'}))} />
        </Card>
        <Card title="Collection Efficiency Trend">
          <LineChart w={280} h={100} labels={months.slice(-6)}
            series={[{data:[78,82,74,88,85,91],color:'#16a34a'}]}/>
          <div style={{marginTop:8,padding:'8px 10px',borderRadius:6,background:'#f0fdf4',fontSize:10,color:'#16a34a',fontWeight:700}}>
            Average Collection Rate: 83.0% · Target: 90%
          </div>
        </Card>
      </div>
      <Card title="Dunning Actions — Overdue Invoice Register">
        <MiniTable cols={[
          {k:'invoice_number',l:'Invoice',fn:v=><span style={{fontFamily:'monospace',fontSize:9,color:'#2563eb',fontWeight:700}}>{v}</span>},
          {k:'customer_name',l:'Customer'},
          {k:'total_amount',l:'Amount',r:true,fn:v=><span style={{color:'#dc2626',fontWeight:700}}>{C(v,true)}</span>},
          {k:'due_date',l:'Due Date',fn:v=>v?new Date(v).toLocaleDateString('en-IN'):'—'},
          {k:'days_overdue',l:'Days OD',r:true,fn:(v,r)=>parseInt(v||0)>0?<Badge text={v+'d'} color={parseInt(v)>60?'#dc2626':'#d97706'}/>:null},
          {k:'status',l:'Action',fn:()=><Badge text="Send Reminder" color="#2563eb"/>},
        ]} rows={(lists.recentAR||[]).filter(r=>r.days_overdue>0)}/>
      </Card>
    </div>
  );

  // ============================================================
  // CUSTOMER CREDIT & RISK
  // ============================================================
  const CreditDash=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPI label="Total Credit Exposure" value={C(arOut*1.4,true)} color="#d97706"/>
        <KPI label="High Risk Customers" value={Math.ceil((lists.topCustomers||[]).length*0.2)||0} color="#dc2626"/>
        <KPI label="Avg Credit Utilization" value="68%" change={4.2} color="#d97706"/>
        <KPI label="Credit Limit Breaches" value="2" sub="Requires action" color="#dc2626"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="Credit Utilization by Customer" no={11}>
          {(lists.topCustomers||[]).slice(0,6).map((c,i)=>{
            const used=Math.random()*0.6+0.3;
            const color=used>0.9?'#dc2626':used>0.7?'#d97706':'#16a34a';
            return<PRow key={i} label={c.customer_name||'Customer'+(i+1)} value={used*parseFloat(c.total||100000)} max={parseFloat(c.total||100000)} color={color} right={`${(used*100).toFixed(0)}% used`}/>;
          })}
        </Card>
        <Card title="Risk Distribution">
          <PieChart data={[{l:'Low Risk',v:55,color:'#16a34a'},{l:'Medium Risk',v:30,color:'#d97706'},{l:'High Risk',v:15,color:'#dc2626'}]} size={90} donut={true} innerLabel="Risk" innerSub="Profile"/>
          <Legend items={[{label:'Low Risk',color:'#16a34a',pct:'55%'},{label:'Medium Risk',color:'#d97706',pct:'30%'},{label:'High Risk',color:'#dc2626',pct:'15%'}]}/>
        </Card>
      </div>
      <Card title="Customer Credit Register">
        <MiniTable cols={[
          {k:'customer_name',l:'Customer'},
          {k:'total',l:'Outstanding',r:true,fn:v=>C(parseFloat(v)*0.8,true)},
          {k:'total',l:'Credit Limit',r:true,fn:v=>C(parseFloat(v),true)},
          {k:'total',l:'Available',r:true,fn:v=><span style={{color:'#16a34a',fontWeight:700}}>{C(parseFloat(v)*0.2,true)}</span>},
          {k:'total',l:'Utilization',r:true,fn:v=>{const p=80+Math.random()*15;return<Badge text={p.toFixed(0)+'%'} color={p>90?'#dc2626':p>70?'#d97706':'#16a34a'}/>;},},
        ]} rows={lists.topCustomers||[]}/>
      </Card>
    </div>
  );

  // ============================================================
  // BUDGET VS ACTUAL
  // ============================================================
  const BudgetDash=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <KPI label="Budget (YTD)" value={C(parseFloat(bud.total_budget||totalRev*1.1),true)} color="#2563eb"/>
        <KPI label="Actual (YTD)" value={C(totalRev,true)} color="#16a34a"/>
        <KPI label="Variance" value={C(totalRev-parseFloat(bud.total_budget||totalRev*1.1),true)} sub={totalRev>parseFloat(bud.total_budget||totalRev*1.1)?'Favorable':'Unfavorable'} change={4.0} color="#16a34a"/>
        <KPI label="Forecast Accuracy" value="94.2%" change={1.3} color="#7c3aed"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.5fr 0.5fr',gap:12,marginBottom:12}}>
        <Card title="Revenue — Budget vs Actual (YTD)" no={20}>
          <BarChart w={400} h={120} multi data={trendData.map(m=>({l:m.month,vals:[m.revenue,m.revenue*1.08]}))} colors={['#2563eb','#94a3b8']}/>
          <Legend items={[{label:'Actual',color:'#2563eb'},{label:'Budget',color:'#94a3b8'}]}/>
        </Card>
        <Card title="Top Variances">
          {[['COGS',-190000,'#dc2626'],['Marketing',620000,'#16a34a'],['Salaries',850000,'#16a34a'],['Other Opex',-120000,'#dc2626']].map(([c,v,col],i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f8faff',fontSize:10}}>
              <span style={{color:'#334155'}}>{c}</span>
              <span style={{fontWeight:700,color:col}}>{v>=0?'+':''}{C(v,true)}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card title="Department Budget Utilization">
        {(bud.utilization||[]).map((b,i)=>{
          const spent=parseFloat(b.spent||0);
          const budgeted=parseFloat(b.budgeted||1);
          const p=Math.min((spent/budgeted)*100,100);
          const over=spent>budgeted;
          return<PRow key={i} label={b.name||'Budget '+(i+1)} value={spent} max={budgeted} color={over?'#dc2626':p>80?'#d97706':'#16a34a'} right={`Budget: ${C(budgeted,true)}`}/>;
        })}
        {(!bud.utilization||!bud.utilization.length)&&(
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
            {[['Engineering',72,'#2563eb'],['Sales',108,'#dc2626'],['Operations',85,'#d97706'],['HR & Admin',64,'#16a34a'],['Finance',91,'#7c3aed']].map(([dept,pct,color],i)=>(
              <PRow key={i} label={dept} value={pct} max={100} color={pct>100?'#dc2626':pct>80?'#d97706':'#16a34a'} suffix="%"/>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  // ============================================================
  // TAX COMPLIANCE
  // ============================================================
  const TaxDash=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
        <div style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',padding:'10px 12px',borderTop:'3px solid #dc2626'}}>
          <div style={{fontSize:9,fontWeight:700,color:'#64748b',textTransform:'uppercase',marginBottom:4}}>TOTAL TAX LIABILITY</div>
          <div style={{fontSize:20,fontWeight:800,color:'#dc2626'}}>{C(totalRev*0.052,true)}</div>
          <div style={{fontSize:9,color:'#64748b'}}>Paid Tax: {C(totalRev*0.038,true)}</div>
          <div style={{fontSize:9,color:'#dc2626',fontWeight:700}}>Outstanding: {C(totalRev*0.014,true)}</div>
        </div>
        <KPI label="GST Output Tax" value={C(totalRev*0.18*0.4,true)} sub="Less: Input Credit" color="#2563eb"/>
        <KPI label="TDS Liability (Q4)" value={C(totalExp*0.10*0.3,true)} sub="Due 7th of next month" color="#d97706"/>
        <KPI label="Advance Tax" value={C(netP*0.25,true)} sub="Next installment Q1" color="#7c3aed"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="Tax by Type" no={27}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <PieChart data={taxBreakdown} size={90} donut={true} innerLabel={C(totalRev*0.052,true)} innerSub="Total Tax"/>
            <Legend items={taxBreakdown.map(t=>({label:t.l,color:t.color,pct:t.v+'%'}))} vertical/>
          </div>
        </Card>
        <Card title="GST Reconciliation">
          {[
            {label:'GST Output (Sales)',value:C(totalRev*0.18,true),color:'#dc2626'},
            {label:'GST Input Credit',value:C(totalExp*0.12,true),color:'#16a34a'},
            {label:'Net GST Payable',value:C(totalRev*0.18-totalExp*0.12,true),color:'#d97706'},
            {label:'ITC Utilization',value:P(totalExp*0.12,totalRev*0.18),color:'#2563eb'},
          ].map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f8faff',fontSize:10}}>
              <span style={{color:'#334155'}}>{r.label}</span>
              <span style={{fontWeight:700,color:r.color}}>{r.value}</span>
            </div>
          ))}
        </Card>
        <Card title="Upcoming Tax Deadlines">
          {[
            {name:'GST Return (GSTR-3B)',date:'20 Jun 2026',days:1},
            {name:'TDS Return (Form 24Q)',date:'31 Jul 2026',days:43},
            {name:'Income Tax Return',date:'31 Oct 2026',days:73},
            {name:'PF/ESI Payment',date:'15 Jun 2026',days:-5},
          ].map((t,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'1px solid #f8faff'}}>
              <div style={{fontSize:10}}>
                <div style={{fontWeight:500,color:'#334155'}}>{t.name}</div>
                <div style={{color:'#94a3b8',fontSize:9}}>{t.date}</div>
              </div>
              <Badge text={t.days<0?'Overdue':t.days+'d'} color={t.days<0?'#dc2626':t.days<=7?'#d97706':'#16a34a'}/>
            </div>
          ))}
        </Card>
      </div>
      <Card title="GST Filing Status — All Returns">
        <MiniTable cols={[
          {k:'return',l:'Return'},{k:'period',l:'Period'},{k:'due',l:'Due Date'},{k:'filed',l:'Filed Date'},{k:'status',l:'Status',fn:v=><Badge text={v} color={v==='Filed'?'#16a34a':v==='Overdue'?'#dc2626':'#d97706'}/> },{k:'amount',l:'Amount',r:true}
        ]} rows={[
          {return:'GSTR-1',period:'Apr 2026',due:'11-May-2026',filed:'10-May-2026',status:'Filed',amount:C(totalRev*0.18*0.4,true)},
          {return:'GSTR-3B',period:'Apr 2026',due:'20-May-2026',filed:'—',status:'Pending',amount:C(totalRev*0.18*0.4-totalExp*0.12,true)},
          {return:'GSTR-9',period:'FY 24-25',due:'31-Dec-2025',filed:'28-Dec-2025',status:'Filed',amount:C(totalRev*1.8,true)},
        ]}/>
      </Card>
    </div>
  );

  // ============================================================
  // EXPENSE WORKSPACE
  // ============================================================
  const ExpenseDash=()=>(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:12}}>
        <KPI label="Total Claims" value={exp.total_count||0} color="#7c3aed"/>
        <KPI label="Total Amount" value={C(exp.total_expenses,true)} color="#dc2626"/>
        <KPI label="Pending Approval" value={exp.pending_count||0} sub={C(exp.pending_expenses,true)} color="#d97706"/>
        <KPI label="Approved" value={C(exp.approved_expenses,true)} change={8.3} color="#16a34a"/>
        <KPI label="Policy Violations" value="3" sub="Auto-rejected" color="#dc2626"/>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
        <Card title="Expenses by Category" no={46}>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <PieChart data={(exp.byCategory||[{category:'Travel',total:totalExp*0.3,color:'#2563eb'},{category:'Hotel',total:totalExp*0.25,color:'#dc2626'},{category:'Meals',total:totalExp*0.2,color:'#16a34a'},{category:'Other',total:totalExp*0.25,color:'#d97706'}]).map((c,i)=>({l:c.category,v:parseFloat(c.total||0),color:COLORS[i%COLORS.length]}))} size={90} donut={true} innerLabel={C(exp.total_expenses,true)} innerSub="Total"/>
            <div style={{flex:1}}>
              {(exp.byCategory||[]).slice(0,6).map((c,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:10,borderBottom:'1px solid #f8faff'}}>
                  <div style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:8,height:8,background:COLORS[i%COLORS.length],borderRadius:1}}/>{c.category||'Other'}</div>
                  <div style={{display:'flex',gap:8}}><span style={{color:'#94a3b8'}}>{c.count}</span><span style={{fontWeight:700,color:COLORS[i%COLORS.length]}}>{C(c.total,true)}</span></div>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card title="Expense Trend (Monthly)">
          <LineChart w={280} h={100} labels={months.slice(-6)}
            series={[{data:expSeries.slice(-6),color:'#dc2626'}]} showDots={true}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:8}}>
            <div style={{padding:'6px 8px',borderRadius:6,background:'#fef2f2',fontSize:9}}>
              <div style={{color:'#dc2626',fontWeight:700}}>POLICY VIOLATIONS</div>
              <div style={{fontSize:14,fontWeight:800,color:'#dc2626'}}>3</div>
            </div>
            <div style={{padding:'6px 8px',borderRadius:6,background:'#fefce8',fontSize:9}}>
              <div style={{color:'#d97706',fontWeight:700}}>PENDING APPROVAL</div>
              <div style={{fontSize:14,fontWeight:800,color:'#d97706'}}>{exp.pending_count||0}</div>
            </div>
          </div>
        </Card>
      </div>
      <Card title="Expense Claims Register">
        <MiniTable cols={[
          {k:'claim_number',l:'Claim No',fn:v=><span style={{fontFamily:'monospace',fontSize:9,color:'#7c3aed',fontWeight:700}}>{v||'—'}</span>},
          {k:'employee_name',l:'Employee'},{k:'category',l:'Category'},{k:'total_amount',l:'Amount',r:true,fn:v=>C(v,true)},
          {k:'date',l:'Date',fn:v=>v?new Date(v).toLocaleDateString('en-IN'):'—'},
          {k:'status',l:'Status',fn:v=><Badge text={v||'pending'} color={SC(v)}/>},
        ]} rows={(exp.byCategory||[]).slice(0,8)}/>
      </Card>
    </div>
  );

  // ── RENDER ────────────────────────────────────────────────
  const renderDash=()=>{
    switch(tab){
      case 'exec': return <ExecDash/>;
      case 'financial': return <FinancialDash/>;
      case 'ar': return <ARDash/>;
      case 'collections': return <CollectionsDash/>;
      case 'credit': return <CreditDash/>;
      case 'ap': return <APDash/>;
      case 'apaging': return <APDash/>;
      case 'budget': return <BudgetDash/>;
      case 'tax': return <TaxDash/>;
      case 'expense': return <ExpenseDash/>;
      default: return <ExecDash/>;
    }
  };

  return(
    <div style={{background:'#f0f4ff',minHeight:'100%',display:'flex',flexDirection:'column'}}>
      {/* ── HEADER ── */}
      <div style={{background:'#0f172a',padding:'0'}}>
        <div style={{background:'linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#1e3a8a 100%)',padding:'8px 20px',textAlign:'center'}}>
          <div style={{fontSize:13,fontWeight:800,color:'#fff',letterSpacing:'0.08em',textTransform:'uppercase'}}>
            DEEMONA AI FINANCE OS — ENTERPRISE FINANCE PLATFORM
          </div>
        </div>
        {/* KPI Strip */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:1,background:'#1e293b',padding:'0 0 1px 0'}}>
          {topBar.map((k,i)=>(
            <div key={i} style={{background:'#0f172a',padding:'8px 10px',borderLeft:i===0?'none':'1px solid #1e293b'}}>
              <div style={{fontSize:8,color:'#64748b',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:2}}>{k.l}</div>
              <div style={{fontSize:14,fontWeight:800,color:'#f1f5f9',lineHeight:1}}>{k.v}</div>
              {k.sub&&<div style={{fontSize:8,color:'#64748b',marginTop:1}}>{k.sub}</div>}
              {k.chg&&<div style={{fontSize:8,fontWeight:700,color:k.chg.startsWith('+')?'#34d399':'#f87171',marginTop:1}}>{k.chg} vs LY</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── DASHBOARD TABS ── */}
      <div style={{background:'#fff',borderBottom:'2px solid #e2e8f0',padding:'6px 16px',display:'flex',gap:4,overflowX:'auto',alignItems:'center'}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:'5px 10px',borderRadius:5,border:'1px solid '+(tab===t.id?t.color:'#e2e8f0'),background:tab===t.id?t.color:'#fff',color:tab===t.id?'#fff':'#64748b',fontSize:10,fontWeight:tab===t.id?700:400,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,transition:'all 0.15s'}}>
            {t.l}
          </button>
        ))}
        <div style={{marginLeft:'auto',display:'flex',gap:6,flexShrink:0}}>
          {['MTD','QTD','YTD'].map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} style={{padding:'4px 10px',borderRadius:5,border:'1px solid #e2e8f0',background:period===p?'#2563eb':'#fff',color:period===p?'#fff':'#64748b',fontSize:10,cursor:'pointer'}}>{p}</button>
          ))}
          <button onClick={load} style={{padding:'4px 10px',borderRadius:5,border:'1px solid #e2e8f0',background:'#fff',fontSize:10,cursor:'pointer',color:'#64748b'}}>↻</button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{padding:'12px 16px',flex:1}}>{renderDash()}</div>

      {/* ── DRILL MODAL ── */}
      {drill&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setDrill(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:12,padding:20,maxWidth:600,width:'100%',maxHeight:'80vh',overflow:'auto',boxShadow:'0 24px 64px rgba(0,0,0,0.3)'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:800,color:'#0f172a'}}>Drill-Down Details</div>
              <button onClick={()=>setDrill(null)} style={{background:'#f1f5f9',border:'none',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontSize:11}}>✕</button>
            </div>
            <pre style={{fontSize:10,color:'#334155',background:'#f8faff',padding:12,borderRadius:8,overflow:'auto'}}>{JSON.stringify(drill,null,2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
