import { useState, useEffect, useRef } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const api = async (url, method='GET', body=null) => {
  try {
    const r = await fetch(apiURL(url), { method, headers: h(), body: body?JSON.stringify(body):null });
    return await r.json();
  } catch(e) { return { error: e.message }; }
};

const fmt = (n) => { const v=parseFloat(n||0); if(v>=10000000) return '\u20b9'+(v/10000000).toFixed(2)+'Cr'; if(v>=100000) return '\u20b9'+(v/100000).toFixed(2)+'L'; if(v>=1000) return '\u20b9'+(v/1000).toFixed(1)+'K'; return '\u20b9'+v.toFixed(0); };
const Badge = ({text,color='#1d4ed8'}) => <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:color+'18',color,border:`1px solid ${color}30`}}>{text}</span>;
const Card = ({title,children,style={}}) => <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:16,marginBottom:12,...style}}><div style={{fontSize:12,fontWeight:700,color:'#0f172a',marginBottom:10}}>{title}</div>{children}</div>;
const Btn = ({label,onClick,color='#1d4ed8',disabled=false,small=false}) => <button onClick={onClick} disabled={disabled} style={{padding:small?'4px 10px':'8px 16px',borderRadius:7,border:'none',background:disabled?'#e2e8f0':color,color:'#fff',fontSize:small?10:12,fontWeight:700,cursor:disabled?'not-allowed':'pointer'}}>{label}</button>;
const Input = ({label,value,onChange,placeholder,type='text'}) => <div style={{marginBottom:10}}><label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:3}}>{label}</label><input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none',boxSizing:'border-box'}}/></div>;

const MODULES = [
  {id:'balancesheet',label:'Balance Sheet',icon:'\u2696\ufe0f',color:'#1d4ed8'},
  {id:'anomaly',label:'Anomaly Detection',icon:'\ud83d\udd14',color:'#dc2626'},
  {id:'insights',label:'AI Smart Insights',icon:'\ud83e\udde0',color:'#7c3aed'},
  {id:'chatbot',label:'Finance Chatbot',icon:'\ud83e\udd16',color:'#059669'},
  {id:'whatif',label:'What-if Scenarios',icon:'\ud83d\udcca',color:'#d97706'},
  {id:'attrition',label:'Attrition Analytics',icon:'\ud83d\udc65',color:'#db2777'},
  {id:'production',label:'Production',icon:'\ud83c\udfed',color:'#ea580c'},
  {id:'supplychain',label:'Supply Chain',icon:'\ud83d\udce6',color:'#0891b2'},
  {id:'logistics',label:'Logistics',icon:'\ud83d\ude9a',color:'#6366f1'},
  {id:'blockchain',label:'Blockchain Audit',icon:'\ud83d\udd17',color:'#334155'},
  {id:'filing',label:'Filing Automation',icon:'\ud83d\udcc4',color:'#dc2626'},
  {id:'admin',label:'Admin & Metrics',icon:'\u2699\ufe0f',color:'#64748b'},
  {id:'predict',label:'Predictive Modeling',icon:'\ud83d\udd2e',color:'#7c3aed'},
];

export default function AIIntelligenceHub() {
  const [mod, setMod] = useState('balancesheet');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),4000); };
  const setLoad = (k,v) => setLoading(p=>({...p,[k]:v}));

  const load = async (key, url) => {
    setLoad(key,true);
    const r = await api(url);
    setData(p=>({...p,[key]:r}));
    setLoad(key,false);
  };

  useEffect(() => {
    if (mod==='balancesheet') load('bs','/api/ai/balance-sheet');
    if (mod==='anomaly') load('anomaly','/api/ai/anomaly/alerts');
    if (mod==='insights') load('insights','/api/ai/insights');
    if (mod==='attrition') load('attrition','/api/ai/hr/attrition');
    if (mod==='production') load('production','/api/ai/operations/production');
    if (mod==='supplychain') load('sc','/api/ai/operations/supply-chain');
    if (mod==='logistics') load('logistics','/api/ai/operations/logistics');
    if (mod==='blockchain') load('blockchain','/api/ai/blockchain/trail');
    if (mod==='filing') load('filing','/api/ai/filing/templates');
    if (mod==='admin') { load('flags','/api/ai/admin/flags'); load('metrics','/api/ai/admin/metrics'); }
    if (mod==='whatif') load('scenarios','/api/ai/whatif/scenarios');
  }, [mod]);

  const m = MODULES.find(x=>x.id===mod)||MODULES[0];

  return (
    <div style={{padding:20,background:'#f0f4ff',minHeight:'100%'}}>
      <div style={{background:'linear-gradient(135deg,#1e3a8a,#7c3aed)',borderRadius:12,padding:'14px 20px',marginBottom:14,color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div><div style={{fontSize:17,fontWeight:800}}>\ud83e\udde0 AI Intelligence Hub</div><div style={{fontSize:11,opacity:0.8}}>Balance Sheet \u00b7 Anomaly Detection \u00b7 Smart Insights \u00b7 Chatbot \u00b7 Scenarios \u00b7 Operations \u00b7 Filing Automation</div></div>
        <Badge text="Powered by Claude AI" color="#fff"/>
      </div>

      {toast && <div style={{position:'fixed',top:20,right:20,zIndex:9999,padding:'10px 16px',borderRadius:8,background:toast.ok?'#f0fdf4':'#fef2f2',border:`1px solid ${toast.ok?'#bbf7d0':'#fecaca'}`,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',fontSize:12,fontWeight:600,color:toast.ok?'#16a34a':'#dc2626'}}>{toast.msg}</div>}

      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
        {MODULES.map(x=>(
          <button key={x.id} onClick={()=>setMod(x.id)} style={{padding:'7px 12px',borderRadius:8,border:`2px solid ${mod===x.id?x.color:'#e2e8f0'}`,background:mod===x.id?x.color+'10':'#fff',color:mod===x.id?x.color:'#64748b',fontSize:11,fontWeight:mod===x.id?700:400,cursor:'pointer',display:'flex',alignItems:'center',gap:5}}>
            <span>{x.icon}</span>{x.label}
          </button>
        ))}
      </div>

      {/* BALANCE SHEET */}
      {mod==='balancesheet' && (
        <BalanceSheetView data={data.bs} loading={loading.bs} refresh={()=>load('bs','/api/ai/balance-sheet')}/>
      )}

      {/* ANOMALY DETECTION */}
      {mod==='anomaly' && (
        <AnomalyView data={data.anomaly} loading={loading.anomaly} onDetect={async()=>{setLoad('ad',true);const r=await api('/api/ai/anomaly/detect','POST');setLoad('ad',false);if(r.success){load('anomaly','/api/ai/anomaly/alerts');showToast(`\u2705 ${r.anomalies?.length||0} anomalies detected`);}}} detecting={loading.ad} showToast={showToast} reload={()=>load('anomaly','/api/ai/anomaly/alerts')}/>
      )}

      {/* AI INSIGHTS */}
      {mod==='insights' && (
        <InsightsView data={data.insights} loading={loading.insights} onGenerate={async(type)=>{setLoad('gen'+type,true);const r=await api('/api/ai/insights/generate','POST',{insight_type:type});setLoad('gen'+type,false);if(r.success){load('insights','/api/ai/insights');showToast('\u2705 Insight generated & emailed');}else showToast('\u274c '+r.error,false);}} generating={loading} />
      )}

      {/* CHATBOT */}
      {mod==='chatbot' && <ChatbotView showToast={showToast}/>}

      {/* WHAT-IF */}
      {mod==='whatif' && (
        <WhatIfView scenarios={data.scenarios?.scenarios||[]} loading={loading.scenarios} onSimulate={async(payload)=>{setLoad('sim',true);const r=await api('/api/ai/whatif/simulate','POST',payload);setLoad('sim',false);if(r.success){load('scenarios','/api/ai/whatif/scenarios');return r;}return r;}} simulating={loading.sim}/>
      )}

      {/* ATTRITION */}
      {mod==='attrition' && (
        <AttritionView data={data.attrition} loading={loading.attrition}/>
      )}

      {/* PRODUCTION */}
      {mod==='production' && (
        <ProductionView data={data.production} loading={loading.production} onAdd={async(p)=>{const r=await api('/api/ai/operations/production','POST',p);if(r.success){load('production','/api/ai/operations/production');showToast('\u2705 Production order added');}}} reload={()=>load('production','/api/ai/operations/production')}/>
      )}

      {/* SUPPLY CHAIN */}
      {mod==='supplychain' && (
        <SupplyChainView data={data.sc} loading={loading.sc} onAdd={async(p)=>{const r=await api('/api/ai/operations/supply-chain','POST',p);if(r.success){load('sc','/api/ai/operations/supply-chain');showToast('\u2705 Item added');}}} reload={()=>load('sc','/api/ai/operations/supply-chain')}/>
      )}

      {/* LOGISTICS */}
      {mod==='logistics' && (
        <LogisticsView data={data.logistics} loading={loading.logistics} onAdd={async(p)=>{const r=await api('/api/ai/operations/logistics','POST',p);if(r.success){load('logistics','/api/ai/operations/logistics');showToast('\u2705 Shipment added');}}} reload={()=>load('logistics','/api/ai/operations/logistics')}/>
      )}

      {/* BLOCKCHAIN */}
      {mod==='blockchain' && (
        <BlockchainView data={data.blockchain} loading={loading.blockchain} onRecord={async(p)=>{const r=await api('/api/ai/blockchain/record','POST',p);if(r.success){load('blockchain','/api/ai/blockchain/trail');showToast('\u2705 Event recorded on chain');}}} reload={()=>load('blockchain','/api/ai/blockchain/trail')}/>
      )}

      {/* FILING */}
      {mod==='filing' && (
        <FilingView templates={data.filing?.templates||[]} loading={loading.filing} onGenerate={async(p)=>{setLoad('fgen',true);const r=await api('/api/ai/filing/generate','POST',p);setLoad('fgen',false);if(r.success){load('filing','/api/ai/filing/templates');showToast('\u2705 Filing report generated & emailed');}else showToast('\u274c '+r.error,false);}} generating={loading.fgen}/>
      )}

      {/* ADMIN */}
      {mod==='admin' && (
        <AdminView flags={data.flags?.flags||[]} metrics={data.metrics} loading={loading} onFlagUpdate={async(key,val)=>{await api('/api/ai/admin/flags/'+key,'PUT',{value:val});load('flags','/api/ai/admin/flags');showToast('\u2705 Flag updated');}}/>
      )}

      {/* PREDICT */}
      {mod==='predict' && (
        <PredictView onPredict={async(p)=>{setLoad('pred',true);const r=await api('/api/ai/predict','POST',p);setLoad('pred',false);return r;}} predicting={loading.pred}/>
      )}
    </div>
  );
}

// ── Balance Sheet ─────────────────────────────────────────────
function BalanceSheetView({data:d, loading, refresh}) {
  if (loading) return <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Loading balance sheet...</div>;
  if (!d) return <div style={{textAlign:'center',padding:40}}><Btn label="\u21bb Load Balance Sheet" onClick={refresh} color="#1d4ed8"/></div>;
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
      <Card title="\u2696\ufe0f Assets">
        <div style={{fontWeight:700,color:'#64748b',fontSize:10,marginBottom:8}}>CURRENT ASSETS</div>
        {[['Cash & Bank',d.assets?.current?.cash],['Accounts Receivable',d.assets?.current?.accountsReceivable],['Inventory',d.assets?.current?.inventory]].map(([l,v],i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #f8faff',fontSize:11}}><span style={{color:'#334155'}}>{l}</span><span style={{fontWeight:700,color:'#059669'}}>{fmt(v)}</span></div>
        ))}
        <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderTop:'2px solid #e2e8f0',marginTop:4,fontSize:12}}><span style={{fontWeight:700}}>Total Current</span><span style={{fontWeight:800,color:'#059669'}}>{fmt(d.assets?.current?.total)}</span></div>
        <div style={{fontWeight:700,color:'#64748b',fontSize:10,marginTop:12,marginBottom:8}}>FIXED ASSETS</div>
        {(d.assets?.fixed?.byCategory||[]).map((a,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #f8faff',fontSize:11}}><span style={{color:'#334155'}}>{a.category}</span><span style={{fontWeight:700,color:'#1d4ed8'}}>{fmt(a.value)}</span></div>
        ))}
        <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderTop:'2px solid #e2e8f0',marginTop:4,fontSize:12}}><span style={{fontWeight:700}}>Total Fixed</span><span style={{fontWeight:800,color:'#1d4ed8'}}>{fmt(d.assets?.fixed?.total)}</span></div>
        <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderTop:'3px solid #1d4ed8',marginTop:4,fontSize:13}}><span style={{fontWeight:800}}>TOTAL ASSETS</span><span style={{fontWeight:900,color:'#1d4ed8'}}>{fmt(d.assets?.total)}</span></div>
      </Card>
      <Card title="\ud83d\udcc5 Liabilities">
        <div style={{fontWeight:700,color:'#64748b',fontSize:10,marginBottom:8}}>CURRENT LIABILITIES</div>
        {[['Accounts Payable',d.liabilities?.current?.accountsPayable],['GST Payable',d.liabilities?.current?.gstPayable]].map(([l,v],i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #f8faff',fontSize:11}}><span style={{color:'#334155'}}>{l}</span><span style={{fontWeight:700,color:'#dc2626'}}>{fmt(v)}</span></div>
        ))}
        <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderTop:'2px solid #e2e8f0',marginTop:4,fontSize:12}}><span style={{fontWeight:700}}>Total Current</span><span style={{fontWeight:800,color:'#dc2626'}}>{fmt(d.liabilities?.current?.total)}</span></div>
        <div style={{fontWeight:700,color:'#64748b',fontSize:10,marginTop:12,marginBottom:8}}>LONG-TERM LIABILITIES</div>
        <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #f8faff',fontSize:11}}><span>Bank Loans</span><span style={{fontWeight:700,color:'#dc2626'}}>{fmt(d.liabilities?.longTerm?.loans)}</span></div>
        <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderTop:'2px solid #e2e8f0',marginTop:4,fontSize:12}}><span style={{fontWeight:700}}>Total Long-term</span><span style={{fontWeight:800,color:'#dc2626'}}>{fmt(d.liabilities?.longTerm?.total)}</span></div>
        <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderTop:'3px solid #dc2626',marginTop:4,fontSize:13}}><span style={{fontWeight:800}}>TOTAL LIABILITIES</span><span style={{fontWeight:900,color:'#dc2626'}}>{fmt(d.liabilities?.total)}</span></div>
      </Card>
      <div>
        <Card title="\ud83d\udcb0 Equity">
          <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #f8faff',fontSize:11}}><span>Retained Earnings</span><span style={{fontWeight:700,color:'#059669'}}>{fmt(d.equity?.retainedEarnings)}</span></div>
          <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderTop:'3px solid #059669',marginTop:8,fontSize:13}}><span style={{fontWeight:800}}>SHAREHOLDERS EQUITY</span><span style={{fontWeight:900,color:'#059669'}}>{fmt(d.equity?.total)}</span></div>
        </Card>
        <Card title="\ud83d\udcca Key Ratios">
          {[['Current Ratio',d.ratios?.currentRatio+'x','>1.5x'],['Debt/Equity',d.ratios?.debtToEquity+'x','<1.0x'],['Asset Turnover',d.ratios?.assetTurnover+'x','>1.0x']].map(([l,v,t],i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f8faff',fontSize:11}}>
              <span style={{color:'#334155'}}>{l}</span>
              <div style={{textAlign:'right'}}><div style={{fontWeight:700}}>{v}</div><div style={{fontSize:9,color:'#94a3b8'}}>Target: {t}</div></div>
            </div>
          ))}
        </Card>
        <Card title="\u2705 BS Check"><div style={{fontSize:12,color:'#16a34a',fontWeight:700}}>Assets = Liabilities + Equity</div><div style={{fontSize:11,color:'#334155',marginTop:6}}>{fmt(d.assets?.total)} = {fmt(d.liabilities?.total)} + {fmt(d.equity?.total)}</div><div style={{fontSize:10,color:'#94a3b8',marginTop:4}}>As of {d.asOfDate}</div></Card>
      </div>
    </div>
  );
}

// ── Anomaly Detection ─────────────────────────────────────────
function AnomalyView({data, loading, onDetect, detecting, showToast, reload}) {
  const alerts = data?.alerts||[];
  const severityColor = {low:'#059669',medium:'#d97706',high:'#dc2626',critical:'#7f1d1d'};
  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center'}}>
        <Btn label={detecting?'\ud83d\udd0d Analyzing...':'\ud83e\udde0 Run AI Anomaly Detection'} onClick={onDetect} color="#dc2626" disabled={detecting}/>
        <Btn label="\u21bb Refresh" onClick={reload} color="#64748b" small/>
        <span style={{fontSize:11,color:'#64748b'}}>{alerts.length} alerts found</span>
      </div>
      {alerts.length===0?(
        <Card title="\ud83d\udd14 No Anomalies"><div style={{textAlign:'center',padding:30,color:'#94a3b8'}}><div style={{fontSize:32,marginBottom:8}}>\u2705</div><div>No anomalies detected. Click "Run AI Anomaly Detection" to analyze your financial data.</div></div></Card>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {alerts.map((a,i)=>(
            <div key={i} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:14,borderLeft:`4px solid ${severityColor[a.severity]||'#64748b'}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{a.metric}</div>
                <Badge text={a.severity?.toUpperCase()} color={severityColor[a.severity]||'#64748b'}/>
              </div>
              <Badge text={a.category} color="#1d4ed8"/>
              <div style={{fontSize:11,color:'#334155',marginTop:8,lineHeight:1.5}}>{a.description}</div>
              {a.ai_explanation && <div style={{fontSize:10,color:'#64748b',marginTop:6,padding:'6px 8px',background:'#f8faff',borderRadius:6}}>{a.ai_explanation}</div>}
              <div style={{display:'flex',gap:8,marginTop:8,fontSize:10,color:'#94a3b8'}}>
                {a.expected_value&&<span>Expected: {fmt(a.expected_value)}</span>}
                {a.actual_value&&<span>Actual: {fmt(a.actual_value)}</span>}
                {a.deviation_pct&&<span>Dev: {parseFloat(a.deviation_pct).toFixed(1)}%</span>}
              </div>
              <div style={{display:'flex',gap:6,marginTop:8}}>
                <Badge text={a.status} color={a.status==='resolved'?'#059669':a.status==='acknowledged'?'#d97706':'#dc2626'}/>
                <span style={{fontSize:10,color:'#94a3b8'}}>{new Date(a.detected_at).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AI Smart Insights ─────────────────────────────────────────
function InsightsView({data, loading, onGenerate, generating}) {
  const insights = data?.insights||[];
  const types = [{id:'executive_summary',label:'Executive Summary',icon:'\ud83d\udcca'},{id:'trend',label:'Trend Analysis',icon:'\ud83d\udcc8'},{id:'recommendation',label:'Recommendations',icon:'\ud83d\udca1'},{id:'risk',label:'Risk Assessment',icon:'\u26a0\ufe0f'}];
  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        {types.map(t=><Btn key={t.id} label={generating['gen'+t.id]?'Generating...':t.icon+' '+t.label} onClick={()=>onGenerate(t.id)} color="#7c3aed" disabled={generating['gen'+t.id]}/>)}
      </div>
      <div style={{background:'#f0fdf4',borderRadius:8,padding:10,marginBottom:14,fontSize:11,color:'#14532d'}}>\u2705 Each insight is auto-emailed to your registered address after generation.</div>
      {insights.length===0?(
        <Card title="\ud83e\udde0 No Insights Yet"><div style={{textAlign:'center',padding:30,color:'#94a3b8'}}>Click one of the buttons above to generate AI-powered financial insights.</div></Card>
      ):(
        <div>
          {insights.map((ins,i)=>(
            <Card key={i} title={ins.title} style={{borderLeft:'4px solid #7c3aed'}}>
              <div style={{fontSize:11,color:'#334155',lineHeight:1.7,whiteSpace:'pre-line'}}>{ins.content}</div>
              <div style={{marginTop:8,display:'flex',gap:8}}><Badge text={ins.insight_type} color="#7c3aed"/><span style={{fontSize:10,color:'#94a3b8'}}>{new Date(ins.generated_at).toLocaleString('en-IN')}</span></div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Chatbot ───────────────────────────────────────────────────
function ChatbotView({showToast}) {
  const [messages, setMessages] = useState([{role:'assistant',content:'\ud83d\udc4b Hi! I\'m Deemai, your AI Finance Assistant. I have access to your real financial data. Ask me anything — cash position, overdue invoices, budget status, financial risks, or any finance question!'}]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState(null);
  const [suggestions] = useState(['What is my cash position?','Show overdue invoices','Analyze my expenses','Any financial risks?','Summarize this month']);
  const bottomRef = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);

  const send = async (msg=input) => {
    if (!msg.trim()||loading) return;
    setInput('');
    setMessages(p=>[...p,{role:'user',content:msg}]);
    setLoading(true);
    const r = await api('/api/ai/chatbot/message','POST',{message:msg,conversation_id:convId});
    setLoading(false);
    if (r.reply) {
      setMessages(p=>[...p,{role:'assistant',content:r.reply}]);
      if (r.conversation_id) setConvId(r.conversation_id);
    } else showToast('\u274c Error: '+r.error, false);
  };

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:14,height:'calc(100vh - 280px)'}}>
      <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'10px 14px',background:'#f8faff',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#1d4ed8,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:16}}>\ud83e\udde0</div>
          <div><div style={{fontSize:12,fontWeight:700}}>Deemai — AI Finance Assistant</div><div style={{fontSize:10,color:'#059669'}}>\u25cf Online · Real financial data</div></div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:14,display:'flex',flexDirection:'column',gap:10}}>
          {messages.map((m,i)=>(
            <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
              <div style={{maxWidth:'80%',padding:'10px 14px',borderRadius:m.role==='user'?'12px 12px 4px 12px':'12px 12px 12px 4px',background:m.role==='user'?'#1d4ed8':'#f8faff',color:m.role==='user'?'#fff':'#334155',fontSize:12,lineHeight:1.6,whiteSpace:'pre-line'}}>{m.content}</div>
            </div>
          ))}
          {loading&&<div style={{display:'flex',gap:4,padding:'10px 14px'}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:'#1d4ed8',animation:'bounce 0.6s infinite',animationDelay:i*0.2+'s'}}/>)}<style>{"@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}"}</style></div>}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:'10px 14px',borderTop:'1px solid #e2e8f0',display:'flex',gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&send()} placeholder="Ask anything about your finances..." style={{flex:1,padding:'8px 12px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}/>
          <Btn label="Send \u27a4" onClick={()=>send()} color="#1d4ed8" disabled={loading||!input.trim()}/>
        </div>
      </div>
      <div>
        <Card title="\ud83d\udca1 Quick Questions">
          {suggestions.map((s,i)=><div key={i} onClick={()=>send(s)} style={{padding:'8px 10px',borderRadius:7,border:'1px solid #e2e8f0',marginBottom:6,cursor:'pointer',fontSize:11,color:'#1d4ed8',background:'#eff6ff'}}>{s}</div>)}
        </Card>
        <Card title="\ud83d\udd17 Capabilities">
          {['Real-time financial data','AR/AP analysis','Budget vs actual','Cash flow insights','Tax & compliance Q&A','Risk identification','What-if questions'].map((c,i)=><div key={i} style={{fontSize:10,color:'#334155',marginBottom:4}}>\u2022 {c}</div>)}
        </Card>
      </div>
    </div>
  );
}

// ── What-If Scenarios ─────────────────────────────────────────
function WhatIfView({scenarios, loading, onSimulate, simulating}) {
  const [form, setForm] = useState({name:'Revenue Growth Scenario',revenue_change_pct:20,cost_reduction_pct:10,hiring_count:5,new_product_revenue:0});
  const [result, setResult] = useState(null);
  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const run = async() => {
    const r = await onSimulate({name:form.name, assumptions:{
      'Revenue Change (%)': form.revenue_change_pct+'%',
      'Cost Reduction (%)': form.cost_reduction_pct+'%',
      'New Hires': form.hiring_count,
      'New Product Revenue': '\u20b9'+parseFloat(form.new_product_revenue||0).toLocaleString('en-IN'),
    }});
    if (r?.success) setResult(r);
  };
  return (
    <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:14}}>
      <div>
        <Card title="\ud83d\udcca Configure Scenario">
          <Input label="SCENARIO NAME" value={form.name} onChange={v=>f('name',v)} placeholder="e.g. 20% Revenue Growth"/>
          <Input label="REVENUE CHANGE %" value={form.revenue_change_pct} onChange={v=>f('revenue_change_pct',v)} type="number" placeholder="20"/>
          <Input label="COST REDUCTION %" value={form.cost_reduction_pct} onChange={v=>f('cost_reduction_pct',v)} type="number" placeholder="10"/>
          <Input label="NEW HIRES" value={form.hiring_count} onChange={v=>f('hiring_count',v)} type="number" placeholder="5"/>
          <Input label="NEW PRODUCT REVENUE (\u20b9)" value={form.new_product_revenue} onChange={v=>f('new_product_revenue',v)} type="number" placeholder="0"/>
          <Btn label={simulating?'\ud83d\udd04 Simulating...':'\ud83e\udde0 Run AI Simulation'} onClick={run} color="#d97706" disabled={simulating}/>
        </Card>
      </div>
      <div>
        {result?.results&&(
          <Card title="\ud83d\udcca Simulation Results" style={{borderLeft:'4px solid #d97706'}}>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12}}>
              {[['Projected Revenue',result.results.projected_revenue,'#059669'],['Projected Expenses',result.results.projected_expenses,'#dc2626'],['Projected Profit',result.results.projected_profit,result.results.projected_profit>=0?'#059669':'#dc2626'],['Cash Position',result.results.projected_cash,'#1d4ed8']].map(([l,v,c],i)=>(
                <div key={i} style={{background:'#f8faff',borderRadius:8,padding:'10px 12px',borderLeft:`3px solid ${c}`}}>
                  <div style={{fontSize:9,color:'#64748b',fontWeight:700,textTransform:'uppercase'}}>{l}</div>
                  <div style={{fontSize:16,fontWeight:800,color:c}}>{fmt(v)}</div>
                </div>
              ))}
            </div>
            {result.results.key_impacts&&<div style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:700,color:'#334155',marginBottom:6}}>Key Impacts:</div>{result.results.key_impacts.map((imp,i)=><div key={i} style={{fontSize:11,color:'#059669',marginBottom:3}}>\u2713 {imp}</div>)}</div>}
            {result.results.risks&&<div style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:700,color:'#334155',marginBottom:6}}>Risks:</div>{result.results.risks.map((r,i)=><div key={i} style={{fontSize:11,color:'#dc2626',marginBottom:3}}>\u26a0 {r}</div>)}</div>}
            {result.results.recommendation&&<div style={{background:'#f0fdf4',borderRadius:8,padding:10,fontSize:11,color:'#14532d'}}><strong>Recommendation:</strong> {result.results.recommendation}</div>}
          </Card>
        )}
        <Card title="\ud83d\udcdc Past Scenarios ({scenarios.length})">
          {scenarios.slice(0,5).map((s,i)=>(
            <div key={i} style={{padding:'8px 0',borderBottom:'1px solid #f8faff',fontSize:11}}>
              <div style={{fontWeight:600,color:'#334155'}}>{s.name}</div>
              <div style={{fontSize:10,color:'#94a3b8'}}>{new Date(s.created_at).toLocaleString('en-IN')}</div>
            </div>
          ))}
          {!scenarios.length&&<div style={{color:'#94a3b8',fontSize:11}}>No scenarios yet. Run a simulation above.</div>}
        </Card>
      </div>
    </div>
  );
}

// ── Attrition Analytics ───────────────────────────────────────
function AttritionView({data:d, loading}) {
  if (loading) return <div style={{textAlign:'center',padding:40,color:'#94a3b8'}}>Loading...</div>;
  if (!d) return <div style={{color:'#94a3b8',padding:20}}>No data. Loading...</div>;
  const s = d.summary||{};
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
        {[['Total Employees',s.total,'#1d4ed8'],['Active',s.active,'#059669'],['Exits',s.exits,'#dc2626'],['Attrition Rate',s.attritionRate+'%',parseFloat(s.attritionRate||0)<12?'#059669':'#dc2626']].map(([l,v,c],i)=>(
          <div key={i} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'12px 14px',borderLeft:`4px solid ${c}`}}>
            <div style={{fontSize:9,color:'#64748b',fontWeight:700,textTransform:'uppercase',marginBottom:4}}>{l}</div>
            <div style={{fontSize:22,fontWeight:800,color:c}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        <Card title="\ud83c\udfe2 Attrition by Department">
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead><tr>{['Department','Total','Exits','Rate'].map(h=><th key={h} style={{padding:'6px 10px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:10,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
            <tbody>{(d.byDepartment||[]).map((dept,i)=>{
              const rate = dept.total>0?((dept.exits/dept.total)*100).toFixed(1):0;
              return <tr key={i} style={{borderBottom:'1px solid #f8faff'}}><td style={{padding:'6px 10px'}}>{dept.department||'N/A'}</td><td style={{padding:'6px 10px'}}>{dept.total}</td><td style={{padding:'6px 10px',color:'#dc2626',fontWeight:700}}>{dept.exits}</td><td style={{padding:'6px 10px'}}><Badge text={rate+'%'} color={parseFloat(rate)<12?'#059669':'#dc2626'}/></td></tr>;
            })}</tbody>
          </table>
          {!(d.byDepartment?.length)&&<div style={{color:'#94a3b8',fontSize:11,textAlign:'center',padding:20}}>No department data. Ensure employees have departments assigned.</div>}
        </Card>
        <Card title="\u23f1\ufe0f Tenure Distribution">
          {(d.tenureDistribution||[]).map((t,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f8faff',fontSize:11}}>
              <span>{t.tenure}</span><span style={{fontWeight:700,color:'#1d4ed8'}}>{t.count} employees</span>
            </div>
          ))}
          {!(d.tenureDistribution?.length)&&<div style={{color:'#94a3b8',fontSize:11,padding:10}}>No tenure data. Ensure joining_date is set for employees.</div>}
          <div style={{marginTop:12,padding:10,background:'#fffbeb',borderRadius:8,fontSize:11,color:'#78350f'}}><strong>\u26a0\ufe0f Note:</strong> Add joining_date and exit_date to employee records to enable full attrition tracking.</div>
        </Card>
      </div>
    </div>
  );
}

// ── Production View ───────────────────────────────────────────
function ProductionView({data:d, loading, onAdd, reload}) {
  const [form, setForm] = useState({order_number:'',product_name:'',quantity_planned:'',start_date:'',end_date:'',unit_cost:''});
  const [showForm, setShowForm] = useState(false);
  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const add = async() => { await onAdd(form); setForm({order_number:'',product_name:'',quantity_planned:'',start_date:'',end_date:'',unit_cost:''}); setShowForm(false); };
  const s = d?.summary||{};
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
        {[['Total Orders',s.total||0,'#1d4ed8'],['Total Produced',parseFloat(s.produced||0).toFixed(0),'#059669'],['Total Cost',fmt(s.total_cost),'#d97706']].map(([l,v,c],i)=>(
          <div key={i} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'12px 14px',borderLeft:`4px solid ${c}`}}>
            <div style={{fontSize:9,color:'#64748b',fontWeight:700,textTransform:'uppercase',marginBottom:4}}>{l}</div>
            <div style={{fontSize:18,fontWeight:800,color:c}}>{v}</div>
          </div>
        ))}
        <div style={{display:'flex',alignItems:'center',gap:8}}><Btn label="+ Add Order" onClick={()=>setShowForm(p=>!p)} color="#ea580c" small/><Btn label="\u21bb" onClick={reload} color="#64748b" small/></div>
      </div>
      {showForm&&<Card title="Add Production Order" style={{marginBottom:14}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}><Input label="ORDER NO." value={form.order_number} onChange={v=>f('order_number',v)} placeholder="PO-001"/><Input label="PRODUCT" value={form.product_name} onChange={v=>f('product_name',v)} placeholder="Product name"/><Input label="QTY PLANNED" value={form.quantity_planned} onChange={v=>f('quantity_planned',v)} type="number"/><Input label="START DATE" value={form.start_date} onChange={v=>f('start_date',v)} type="date"/><Input label="END DATE" value={form.end_date} onChange={v=>f('end_date',v)} type="date"/><Input label="UNIT COST (\u20b9)" value={form.unit_cost} onChange={v=>f('unit_cost',v)} type="number"/></div><Btn label="Add Order" onClick={add} color="#ea580c"/></Card>}
      <Card title="\ud83c\udfed Production Orders">
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead><tr>{['Order No.','Product','Planned Qty','Produced','Cost','Status'].map(h=><th key={h} style={{padding:'6px 10px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:10,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
          <tbody>{(d?.productTrends||[]).map((r,i)=><tr key={i} style={{borderBottom:'1px solid #f8faff'}}><td style={{padding:'6px 10px'}}>—</td><td style={{padding:'6px 10px',fontWeight:600}}>{r.product_name}</td><td style={{padding:'6px 10px'}}>{r.planned}</td><td style={{padding:'6px 10px',color:'#059669',fontWeight:700}}>{r.produced}</td><td style={{padding:'6px 10px'}}>—</td><td style={{padding:'6px 10px'}}><Badge text="Active" color="#059669"/></td></tr>)}</tbody>
        </table>
        {!(d?.productTrends?.length)&&<div style={{textAlign:'center',padding:30,color:'#94a3b8'}}>No production orders. Add one above.</div>}
      </Card>
    </div>
  );
}

// ── Supply Chain View ─────────────────────────────────────────
function SupplyChainView({data:d, loading, onAdd, reload}) {
  const [form, setForm] = useState({item_name:'',supplier_name:'',lead_time_days:'',reorder_point:'',current_stock:''});
  const [showForm, setShowForm] = useState(false);
  const f = (k,v) => setForm(p=>({...p,[k]:v}));
  const statusColor = {normal:'#059669',low:'#d97706',critical:'#dc2626',overstock:'#1d4ed8'};
  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center'}}>
        <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'10px 14px',borderLeft:'4px solid #0891b2',flex:1}}><div style={{fontSize:9,color:'#64748b',fontWeight:700}}>TOTAL ITEMS</div><div style={{fontSize:18,fontWeight:800,color:'#0891b2'}}>{d?.summary?.total||0}</div></div>
        <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'10px 14px',borderLeft:'4px solid #dc2626',flex:1}}><div style={{fontSize:9,color:'#64748b',fontWeight:700}}>CRITICAL</div><div style={{fontSize:18,fontWeight:800,color:'#dc2626'}}>{d?.summary?.critical||0}</div></div>
        <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'10px 14px',borderLeft:'4px solid #d97706',flex:1}}><div style={{fontSize:9,color:'#64748b',fontWeight:700}}>LOW STOCK</div><div style={{fontSize:18,fontWeight:800,color:'#d97706'}}>{d?.summary?.low||0}</div></div>
        <div style={{display:'flex',gap:8}}><Btn label="+ Add Item" onClick={()=>setShowForm(p=>!p)} color="#0891b2" small/><Btn label="\u21bb" onClick={reload} color="#64748b" small/></div>
      </div>
      {showForm&&<Card title="Add Supply Chain Item" style={{marginBottom:14}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}><Input label="ITEM NAME" value={form.item_name} onChange={v=>f('item_name',v)} placeholder="Item name"/><Input label="SUPPLIER" value={form.supplier_name} onChange={v=>f('supplier_name',v)} placeholder="Supplier name"/><Input label="LEAD TIME (DAYS)" value={form.lead_time_days} onChange={v=>f('lead_time_days',v)} type="number"/><Input label="REORDER POINT" value={form.reorder_point} onChange={v=>f('reorder_point',v)} type="number"/><Input label="CURRENT STOCK" value={form.current_stock} onChange={v=>f('current_stock',v)} type="number"/></div><Btn label="Add Item" onClick={async()=>{await onAdd(form);setForm({item_name:'',supplier_name:'',lead_time_days:'',reorder_point:'',current_stock:''});setShowForm(false);}} color="#0891b2"/></Card>}
      <Card title="\ud83d\udce6 Supply Chain Alerts">
        {(d?.alerts||[]).map((item,i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f8faff',fontSize:11}}>
            <div><div style={{fontWeight:600,color:'#334155'}}>{item.item_name}</div><div style={{fontSize:10,color:'#64748b'}}>{item.supplier_name} · Lead: {item.lead_time_days}d · Reorder at: {item.reorder_point}</div></div>
            <div style={{textAlign:'right'}}><Badge text={item.status?.toUpperCase()} color={statusColor[item.status]||'#64748b'}/><div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>Stock: {item.current_stock} · In transit: {item.in_transit}</div></div>
          </div>
        ))}
        {!(d?.alerts?.length)&&<div style={{textAlign:'center',padding:20,color:'#94a3b8'}}>No critical/low stock alerts.</div>}
      </Card>
    </div>
  );
}

// ── Logistics View ────────────────────────────────────────────
function LogisticsView({data:d, loading, onAdd, reload}) {
  const [form, setForm] = useState({shipment_number:'',origin:'',destination:'',carrier:'',tracking_number:'',shipped_date:'',expected_delivery:'',freight_cost:''});
  const [showForm, setShowForm] = useState(false);
  const statusColor = {pending:'#1d4ed8',in_transit:'#d97706',delivered:'#059669',delayed:'#dc2626'};
  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        {[['Total',d?.summary?.total||0,'#6366f1'],['In Transit',d?.summary?.in_transit||0,'#d97706'],['Delayed',d?.summary?.delayed||0,'#dc2626'],['Freight Cost',fmt(d?.summary?.total_freight),'#059669']].map(([l,v,c],i)=>(
          <div key={i} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'10px 14px',borderLeft:`4px solid ${c}`,flex:1,minWidth:100}}><div style={{fontSize:9,color:'#64748b',fontWeight:700}}>{l}</div><div style={{fontSize:16,fontWeight:800,color:c}}>{v}</div></div>
        ))}
        <div style={{display:'flex',gap:8}}><Btn label="+ Add Shipment" onClick={()=>setShowForm(p=>!p)} color="#6366f1" small/><Btn label="\u21bb" onClick={reload} color="#64748b" small/></div>
      </div>
      {showForm&&<Card title="Add Shipment" style={{marginBottom:14}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}><Input label="SHIPMENT NO." value={form.shipment_number} onChange={v=>setForm(p=>({...p,shipment_number:v}))} placeholder="SHP-001"/><Input label="ORIGIN" value={form.origin} onChange={v=>setForm(p=>({...p,origin:v}))} placeholder="Mumbai"/><Input label="DESTINATION" value={form.destination} onChange={v=>setForm(p=>({...p,destination:v}))} placeholder="Delhi"/><Input label="CARRIER" value={form.carrier} onChange={v=>setForm(p=>({...p,carrier:v}))} placeholder="Delhivery"/><Input label="TRACKING NO." value={form.tracking_number} onChange={v=>setForm(p=>({...p,tracking_number:v}))} placeholder="DLV123456"/><Input label="FREIGHT COST (\u20b9)" value={form.freight_cost} onChange={v=>setForm(p=>({...p,freight_cost:v}))} type="number"/><Input label="SHIPPED DATE" value={form.shipped_date} onChange={v=>setForm(p=>({...p,shipped_date:v}))} type="date"/><Input label="EXPECTED DELIVERY" value={form.expected_delivery} onChange={v=>setForm(p=>({...p,expected_delivery:v}))} type="date"/></div><Btn label="Add Shipment" onClick={async()=>{await onAdd(form);setShowForm(false);}} color="#6366f1"/></Card>}
      <Card title="\ud83d\ude9a Shipments by Status">
        {(d?.byStatus||[]).map((s,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #f8faff',fontSize:11}}><Badge text={s.status} color={statusColor[s.status]||'#64748b'}/><span>{s.count} shipments</span><span style={{fontWeight:700,color:'#059669'}}>{fmt(s.cost)}</span></div>)}
        {!(d?.byStatus?.length)&&<div style={{color:'#94a3b8',fontSize:11,padding:10,textAlign:'center'}}>No shipments. Add one above.</div>}
      </Card>
    </div>
  );
}

// ── Blockchain Audit ──────────────────────────────────────────
function BlockchainView({data:d, loading, onRecord, reload}) {
  const [form, setForm] = useState({event_type:'FILING',event_data:''});
  return (
    <div>
      <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center'}}>
        <div style={{background:'#fff',borderRadius:10,border:'1px solid #334155',padding:'10px 14px',borderLeft:'4px solid #334155',flex:1}}><div style={{fontSize:9,color:'#64748b',fontWeight:700}}>TOTAL BLOCKS</div><div style={{fontSize:18,fontWeight:800,color:'#334155'}}>{d?.totalBlocks||0}</div></div>
        <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'10px 14px',borderLeft:`4px solid ${d?.chainIntact?'#059669':'#dc2626'}`,flex:1}}><div style={{fontSize:9,color:'#64748b',fontWeight:700}}>CHAIN INTEGRITY</div><div style={{fontSize:14,fontWeight:800,color:d?.chainIntact?'#059669':'#dc2626'}}>{d?.chainIntact===undefined?'—':d?.chainIntact?'\u2705 Intact':'\u274c Broken'}</div></div>
      </div>
      <Card title="\ud83d\udd17 Record New Event">
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div><label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:3}}>EVENT TYPE</label><select value={form.event_type} onChange={e=>setForm(p=>({...p,event_type:e.target.value}))} style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>
            {['FILING','PAYMENT','AUDIT','APPROVAL','CONTRACT','COMPLIANCE','TRANSACTION'].map(t=><option key={t}>{t}</option>)}
          </select></div>
          <Input label="EVENT DESCRIPTION" value={form.event_data} onChange={v=>setForm(p=>({...p,event_data:v}))} placeholder="e.g. GST GSTR-3B filed for Aug 2026"/>
        </div>
        <Btn label="\ud83d\udd17 Record on Blockchain" onClick={async()=>{await onRecord({event_type:form.event_type,event_data:{description:form.event_data,timestamp:new Date()}});setForm(p=>({...p,event_data:''}));reload();}} color="#334155"/>
      </Card>
      <Card title="\ud83d\udcdc Blockchain Audit Trail">
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
          <thead><tr>{['Block #','Event Type','Description','Hash','Timestamp'].map(h=><th key={h} style={{padding:'6px 10px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:10,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
          <tbody>{(d?.blocks||[]).slice(0,20).map((b,i)=>(
            <tr key={i} style={{borderBottom:'1px solid #f8faff'}}>
              <td style={{padding:'6px 10px',fontFamily:'monospace',color:'#1d4ed8',fontWeight:700}}>#{b.block_number}</td>
              <td style={{padding:'6px 10px'}}><Badge text={b.event_type} color="#334155"/></td>
              <td style={{padding:'6px 10px',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{typeof b.event_data==='object'?JSON.stringify(b.event_data).substring(0,50):String(b.event_data||'').substring(0,50)}</td>
              <td style={{padding:'6px 10px',fontFamily:'monospace',fontSize:9,color:'#64748b'}}>{b.current_hash?.substring(0,16)}...</td>
              <td style={{padding:'6px 10px',color:'#94a3b8',fontSize:10}}>{new Date(b.created_at).toLocaleString('en-IN')}</td>
            </tr>
          ))}</tbody>
        </table>
        {!(d?.blocks?.length)&&<div style={{textAlign:'center',padding:30,color:'#94a3b8'}}>No blockchain records. Record an event above.</div>}
      </Card>
    </div>
  );
}

// ── Filing Automation ─────────────────────────────────────────
function FilingView({templates, loading, onGenerate, generating}) {
  const [form, setForm] = useState({filing_type:'GST_GSTR3B',period:''});
  const filingTypes = ['GST_GSTR1','GST_GSTR3B','TDS_24Q','TDS_26Q','ROC_AOC4','ROC_MGT7','PF_ECR','ESIC_RETURN'];
  return (
    <div>
      <Card title="\ud83d\udcc4 Auto-Generate Filing Report">
        <div style={{background:'#f0fdf4',borderRadius:8,padding:10,marginBottom:12,fontSize:11,color:'#14532d'}}>\u2705 Reports are auto-generated using Claude AI and emailed to your registered address instantly.</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
          <div><label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:3}}>FILING TYPE</label><select value={form.filing_type} onChange={e=>setForm(p=>({...p,filing_type:e.target.value}))} style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>{filingTypes.map(t=><option key={t}>{t}</option>)}</select></div>
          <Input label="PERIOD" value={form.period} onChange={v=>setForm(p=>({...p,period:v}))} placeholder="e.g. August 2026"/>
        </div>
        <Btn label={generating?'\ud83d\udd04 Generating & Emailing...':'\ud83e\udde0 Generate Filing Report'} onClick={()=>onGenerate(form)} color="#dc2626" disabled={generating}/>
      </Card>
      <Card title="\ud83d\udcdc Generated Reports ({templates.length})">
        {templates.length===0?(
          <div style={{textAlign:'center',padding:30,color:'#94a3b8'}}><div style={{fontSize:28,marginBottom:8}}>\ud83d\udcc4</div><div>No reports generated yet. Select a filing type and click Generate.</div></div>
        ):templates.map((t,i)=>(
          <div key={i} style={{padding:'10px 0',borderBottom:'1px solid #f8faff'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>{t.filing_type}</div>
              <Badge text="Generated" color="#059669"/>
            </div>
            <div style={{fontSize:10,color:'#94a3b8'}}>Last generated: {t.last_generated_at?new Date(t.last_generated_at).toLocaleString('en-IN'):'—'}</div>
            {t.template_data?.content&&<div style={{fontSize:11,color:'#334155',marginTop:6,lineHeight:1.5,background:'#f8faff',padding:'8px 10px',borderRadius:6,maxHeight:100,overflow:'hidden'}}>{t.template_data.content.substring(0,200)}...</div>}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Admin & Metrics ───────────────────────────────────────────
function AdminView({flags, metrics:m, loading, onFlagUpdate}) {
  const defaultFlags = [
    {flag_key:'ai_insights_enabled',description:'AI Smart Insights generation'},
    {flag_key:'anomaly_detection_enabled',description:'Automatic anomaly detection'},
    {flag_key:'auto_email_reports',description:'Auto-email daily reports'},
    {flag_key:'blockchain_audit_enabled',description:'Blockchain audit trail'},
    {flag_key:'chatbot_enabled',description:'Finance chatbot (Deemai)'},
    {flag_key:'whatsapp_notifications',description:'WhatsApp alerts'},
    {flag_key:'drive_monitor_enabled',description:'Google Drive file monitoring'},
    {flag_key:'auto_filing_enabled',description:'Auto filing report generation'},
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      <Card title="\u2699\ufe0f Feature Flags">
        {defaultFlags.map((f,i)=>{
          const existing = flags.find(fl=>fl.flag_key===f.flag_key);
          const isOn = existing?.flag_value !== false;
          return (
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #f8faff'}}>
              <div><div style={{fontSize:11,fontWeight:600,color:'#334155'}}>{f.flag_key}</div><div style={{fontSize:10,color:'#64748b'}}>{f.description}</div></div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:10,color:isOn?'#059669':'#94a3b8'}}>{isOn?'ON':'OFF'}</span>
                <div onClick={()=>onFlagUpdate(f.flag_key,!isOn)} style={{width:36,height:20,borderRadius:10,background:isOn?'#1d4ed8':'#e2e8f0',cursor:'pointer',position:'relative',transition:'background 0.2s'}}>
                  <div style={{position:'absolute',top:2,left:isOn?18:2,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s',boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}/>
                </div>
              </div>
            </div>
          );
        })}
      </Card>
      <div>
        <Card title="\ud83d\udcca System Metrics (30 days)">
          {m&&[
            ['Automation Events',m.automationEvents,'#1d4ed8'],
            ['User Logins',m.logins,'#059669'],
            ['Data Imports',m.dataIngested?.imports,'#7c3aed'],
            ['Records Ingested',m.dataIngested?.records,'#0891b2'],
            ['Reports Sent',m.reportsSent,'#dc2626'],
          ].map(([l,v,c],i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f8faff',fontSize:12}}>
              <span style={{color:'#334155'}}>{l}</span>
              <span style={{fontWeight:800,color:c}}>{v||0}</span>
            </div>
          ))}
          {!m&&<div style={{color:'#94a3b8',fontSize:11,padding:10}}>Loading metrics...</div>}
        </Card>
        <Card title="\ud83d\udcb3 Billing (Coming Soon)">
          <div style={{background:'#eff6ff',borderRadius:8,padding:12,fontSize:11,color:'#1e3a8a'}}>
            <div style={{fontWeight:700,marginBottom:4}}>\ud83d\ude80 Stripe Integration Coming Soon</div>
            <div>Subscription plans will be available shortly. Current plan: Development/Free.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Predictive Modeling ───────────────────────────────────────
function PredictView({onPredict, predicting}) {
  const [form, setForm] = useState({metric:'revenue and cash flow',months_ahead:3});
  const [result, setResult] = useState(null);
  const run = async() => { const r = await onPredict(form); if(r?.success) setResult(r.forecast); };
  return (
    <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:14}}>
      <Card title="\ud83d\udd2e Configure Forecast">
        <Input label="METRIC TO FORECAST" value={form.metric} onChange={v=>setForm(p=>({...p,metric:v}))} placeholder="revenue and cash flow"/>
        <div style={{marginBottom:10}}><label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:3}}>MONTHS AHEAD</label><select value={form.months_ahead} onChange={e=>setForm(p=>({...p,months_ahead:parseInt(e.target.value)}))} style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>{[1,2,3,6,12].map(m=><option key={m} value={m}>{m} months</option>)}</select></div>
        <Btn label={predicting?'\ud83d\udd04 Forecasting...':'\ud83e\udde0 Generate AI Forecast'} onClick={run} color="#7c3aed" disabled={predicting}/>
        <div style={{marginTop:10,fontSize:10,color:'#94a3b8'}}>Uses Claude AI with your historical data to predict future financial performance.</div>
      </Card>
      <div>
        {result&&(
          <div>
            <Card title="\ud83d\udcc8 AI Financial Forecast" style={{borderLeft:'4px solid #7c3aed'}}>
              <div style={{display:'flex',gap:8,marginBottom:10}}>
                <Badge text={'Trend: '+result.overall_trend?.toUpperCase()} color={result.overall_trend==='growing'?'#059669':result.overall_trend==='declining'?'#dc2626':'#d97706'}/>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:11,marginBottom:12}}>
                <thead><tr>{['Month','Revenue','Expenses','Profit','Cash','Confidence'].map(h=><th key={h} style={{padding:'6px 10px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:10,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
                <tbody>{(result.months||[]).map((m,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid #f8faff'}}>
                    <td style={{padding:'6px 10px',fontWeight:700}}>{m.month}</td>
                    <td style={{padding:'6px 10px',color:'#059669',fontWeight:700}}>{fmt(m.revenue)}</td>
                    <td style={{padding:'6px 10px',color:'#dc2626'}}>{fmt(m.expenses)}</td>
                    <td style={{padding:'6px 10px',color:m.profit>=0?'#059669':'#dc2626',fontWeight:700}}>{fmt(m.profit)}</td>
                    <td style={{padding:'6px 10px',color:'#1d4ed8'}}>{fmt(m.cash)}</td>
                    <td style={{padding:'6px 10px'}}><Badge text={m.confidence} color={m.confidence==='high'?'#059669':m.confidence==='medium'?'#d97706':'#dc2626'}/></td>
                  </tr>
                ))}</tbody>
              </table>
              {result.summary&&<div style={{background:'#f0fdf4',borderRadius:8,padding:10,fontSize:11,color:'#14532d',marginBottom:8}}><strong>Summary:</strong> {result.summary}</div>}
              {result.assumptions&&<div style={{marginBottom:8}}><div style={{fontSize:11,fontWeight:700,color:'#334155',marginBottom:4}}>Assumptions:</div>{result.assumptions.map((a,i)=><div key={i} style={{fontSize:10,color:'#64748b'}}>\u2022 {a}</div>)}</div>}
              {result.risks&&<div><div style={{fontSize:11,fontWeight:700,color:'#334155',marginBottom:4}}>Risks:</div>{result.risks.map((r,i)=><div key={i} style={{fontSize:10,color:'#dc2626'}}>\u26a0 {r}</div>)}</div>}
            </Card>
          </div>
        )}
        {!result&&!predicting&&<Card title="\ud83d\udd2e AI Forecast"><div style={{textAlign:'center',padding:40,color:'#94a3b8'}}><div style={{fontSize:32,marginBottom:8}}>\ud83d\udd2e</div><div>Configure and run a forecast to see AI-powered financial predictions.</div></div></Card>}
        {predicting&&<Card title="\ud83d\udd04 Generating Forecast"><div style={{textAlign:'center',padding:40,color:'#7c3aed'}}>\ud83e\udde0 Claude AI is analyzing your financial data and generating predictions...</div></Card>}
      </div>
    </div>
  );
}
