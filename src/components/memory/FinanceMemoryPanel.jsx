import { useState, useEffect, useRef, useCallback } from 'react';
import { apiURL } from '../../api.js';

const API = apiURL('/api/memory');
const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
});

async function apiGet(path) {
  const res = await fetch(`${API}${path}`, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST', headers: headers(), body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const MODULE_LABELS = {
  accounting:'Accounting',treasury:'Treasury',procurement:'Procurement',
  payroll:'Payroll',tax:'Tax & GST',compliance:'Compliance',
  crm:'CRM',inventory:'Inventory',assets:'Assets',
  projects:'Projects',expenses:'Expenses',budgeting:'Budgeting',
};

const TYPE_CONFIG = {
  approval:        { color:'#22C98A', bg:'#22C98A18', label:'Approval' },
  rejection:       { color:'#FF5C5C', bg:'#FF5C5C18', label:'Rejection' },
  anomaly:         { color:'#FF5C5C', bg:'#FF5C5C18', label:'Anomaly' },
  alert:           { color:'#F5A623', bg:'#F5A62318', label:'Alert' },
  recommendation:  { color:'#6C63FF', bg:'#6C63FF18', label:'AI Recommendation' },
  vendor_event:    { color:'#4FC3F7', bg:'#4FC3F718', label:'Vendor Event' },
  transaction:     { color:'#9B8FFF', bg:'#9B8FFF18', label:'Transaction' },
  ai_insight:      { color:'#6C63FF', bg:'#6C63FF18', label:'AI Insight' },
  decision:        { color:'#4FC3F7', bg:'#4FC3F718', label:'Decision' },
  audit_comment:   { color:'#8B89A8', bg:'#8B89A818', label:'Audit Comment' },
  policy_change:   { color:'#F5A623', bg:'#F5A62318', label:'Policy Change' },
  compliance_event:{ color:'#22C98A', bg:'#22C98A18', label:'Compliance' },
  contract_event:  { color:'#4FC3F7', bg:'#4FC3F718', label:'Contract' },
  simulation_result:{ color:'#6C63FF',bg:'#6C63FF18', label:'Digital Twin' },
};

function formatINR(amount) {
  if (!amount) return null;
  if (amount >= 1e7) return `₹${(amount/1e7).toFixed(2)}Cr`;
  if (amount >= 1e5) return `₹${(amount/1e5).toFixed(2)}L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const s = Math.floor((Date.now()-d.getTime())/1000);
  if (s<60) return 'just now';
  if (s<3600) return `${Math.floor(s/60)}m ago`;
  if (s<86400) return `${Math.floor(s/3600)}h ago`;
  if (s<604800) return `${Math.floor(s/86400)}d ago`;
  return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}

function Sparkline({ color='#6C63FF', data=[2,4,3,6,5,8,7,9] }) {
  const w=70, h=24;
  const min=Math.min(...data), max=Math.max(...data);
  const pts=data.map((v,i)=>{
    const x=(i/(data.length-1))*w;
    const y=h-((v-min)/(max-min||1))*h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{overflow:'visible'}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.9}/>
    </svg>
  );
}

// ── Stat card matching the reference design ───────────────────
function StatCard({ icon, label, value, subtitle, color, sparkData }) {
  return (
    <div style={{
      flex:1, padding:'16px 18px',
      background:'var(--surface-2)',
      border:'1px solid var(--border)',
      borderRadius:12,
      display:'flex', flexDirection:'column', gap:8,
    }}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{
          width:32,height:32,borderRadius:8,
          background:`${color}20`,
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:17,
        }}>{icon}</div>
        <Sparkline color={color} data={sparkData ?? [1,2,1,3,2,4,3,5]} />
      </div>
      <div>
        <div style={{fontSize:30,fontWeight:800,color,lineHeight:1}}>{value}</div>
        <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',marginTop:2}}>{label}</div>
        <div style={{fontSize:15,color:'var(--text-muted)',marginTop:1}}>{subtitle}</div>
      </div>
    </div>
  );
}

// ── Empty state matching the reference ───────────────────────
function EmptyState() {
  const features = [
    { icon:'📄', title:'AI captures everything', desc:'Decisions, comments, approvals and key financial events.' },
    { icon:'🔍', title:'Search instantly',        desc:'Use natural language to find anything in seconds.' },
    { icon:'✦',  title:'Get intelligent insights',desc:'AI connects the dots and surfaces what matters most.' },
  ];
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'32px 24px 16px'}}>
      {/* 3D-style illustration placeholder */}
      <div style={{
        width:140,height:120,marginBottom:20,
        display:'flex',alignItems:'center',justifyContent:'center',
        position:'relative',
      }}>
        {/* Glow */}
        <div style={{
          position:'absolute',width:100,height:100,borderRadius:'50%',
          background:'radial-gradient(circle, #6C63FF44 0%, transparent 70%)',
        }}/>
        {/* Stacked cards illustration */}
        <div style={{position:'relative',width:80,height:80}}>
          {[2,1,0].map(i=>(
            <div key={i} style={{
              position:'absolute',
              width:60+i*8,height:50+i*6,
              bottom:i*10,left:i*(-4)+10,
              background:`linear-gradient(135deg, #${i===0?'6C63FF':i===1?'5550CC':'4440AA'}, #9B8FFF)`,
              borderRadius:10,opacity:i===0?1:0.6,
              boxShadow:'0 4px 20px #6C63FF44',
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              {i===0 && <span style={{fontSize:22,opacity:0.9}}>🔍</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{fontSize:17,fontWeight:700,marginBottom:6}}>No memories recorded yet.</div>
      <div style={{fontSize:15,color:'var(--text-secondary)',marginBottom:28,textAlign:'center'}}>
        Memories are written automatically as your team uses the Finance OS.
      </div>

      {/* Feature highlights */}
      <div style={{
        display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,width:'100%',
        padding:'16px',
        background:'var(--surface-2)',
        border:'1px solid var(--border)',
        borderRadius:12,
      }}>
        {features.map(f=>(
          <div key={f.title} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
            <div style={{
              width:32,height:32,borderRadius:8,flexShrink:0,
              background:'#6C63FF18',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:15,
            }}>{f.icon}</div>
            <div>
              <div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{f.title}</div>
              <div style={{fontSize:15,color:'var(--text-muted)',lineHeight:1.5}}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MemoryBadge({ type }) {
  const cfg = TYPE_CONFIG[type] ?? { color:'#888', bg:'#88888818', label:type };
  return (
    <span style={{
      display:'inline-block',padding:'2px 8px',borderRadius:100,
      fontSize:15,fontWeight:600,letterSpacing:'0.02em',
      color:cfg.color,background:cfg.bg,whiteSpace:'nowrap',
    }}>{cfg.label}</span>
  );
}

function MemoryCard({ memory, onClick }) {
  const cfg = TYPE_CONFIG[memory.memoryType] ?? {};
  return (
    <button onClick={()=>onClick(memory)} style={{
      display:'block',width:'100%',textAlign:'left',
      padding:'14px 16px',
      background:'var(--surface-2)',
      border:'1px solid var(--border)',
      borderRadius:10,cursor:'pointer',
      transition:'border-color 0.15s,box-shadow 0.15s',
      marginBottom:8,
    }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=cfg.color??'#6C63FF';e.currentTarget.style.boxShadow=`0 0 0 3px ${cfg.bg??'#6C63FF11'}`}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none'}}
    >
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
        <MemoryBadge type={memory.memoryType}/>
        {memory.module&&<span style={{fontSize:15,color:'var(--text-muted)',fontWeight:500}}>{MODULE_LABELS[memory.module]??memory.module}</span>}
        {memory.isPinned&&<span style={{fontSize:11}}>📌</span>}
        <span style={{marginLeft:'auto',fontSize:15,color:'var(--text-muted)'}}>{timeAgo(memory.createdAt)}</span>
      </div>
      <div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',lineHeight:1.35,marginBottom:4}}>{memory.title}</div>
      <div style={{fontSize:15,color:'var(--text-secondary)',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{memory.summary}</div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginTop:8}}>
        {memory.amount&&<span style={{fontSize:15,fontWeight:700,color:cfg.color??'#6C63FF'}}>{formatINR(memory.amount)}</span>}
        <span style={{fontSize:15,color:'var(--text-muted)'}}>{memory.actorName}</span>
      </div>
    </button>
  );
}

function MemoryDetail({ memory, onClose }) {
  if(!memory) return null;
  const cfg=TYPE_CONFIG[memory.memoryType]??{color:'#888',bg:'#88888818'};
  const detailEntries=Object.entries(memory.detail??{}).filter(([k])=>!['tenantId'].includes(k));
  return (
    <div style={{position:'absolute',inset:0,zIndex:20,background:'var(--surface-2)',borderRadius:12,overflow:'auto',padding:24}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:20}}>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'var(--text-muted)',padding:0,lineHeight:1,flexShrink:0,marginTop:2}}>←</button>
        <div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:6}}>
            <MemoryBadge type={memory.memoryType}/>
            {memory.module&&<span style={{padding:'2px 8px',borderRadius:100,fontSize:15,fontWeight:500,background:'var(--surface-3)',color:'var(--text-secondary)'}}>{MODULE_LABELS[memory.module]??memory.module}</span>}
          </div>
          <h3 style={{margin:0,fontSize:17,fontWeight:700,lineHeight:1.3}}>{memory.title}</h3>
        </div>
      </div>
      <p style={{fontSize:15,lineHeight:1.7,color:'var(--text-secondary)',margin:'0 0 20px'}}>{memory.summary}</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
        {[['Entity',memory.entityRef],['Actor',`${memory.actorName} (${memory.actorType})`],['Amount',memory.amount?formatINR(memory.amount):null],['Date',new Date(memory.createdAt).toLocaleString('en-IN')]].filter(([,v])=>v).map(([label,value])=>(
          <div key={label} style={{padding:'10px 12px',background:'var(--surface-3)',borderRadius:8,border:'1px solid var(--border)'}}>
            <div style={{fontSize:15,color:'var(--text-muted)',marginBottom:3}}>{label}</div>
            <div style={{fontSize:15,fontWeight:600}}>{value}</div>
          </div>
        ))}
      </div>
      {memory.tags?.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:15,color:'var(--text-muted)',marginBottom:6}}>Tags</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {memory.tags.map(t=><span key={t} style={{padding:'3px 10px',borderRadius:100,fontSize:15,background:cfg.bg,color:cfg.color,fontWeight:500}}>#{t}</span>)}
          </div>
        </div>
      )}
      {detailEntries.length>0&&(
        <div>
          <div style={{fontSize:15,color:'var(--text-muted)',marginBottom:6}}>Full context</div>
          <div style={{borderRadius:8,border:'1px solid var(--border)',overflow:'hidden'}}>
            {detailEntries.map(([key,value],i)=>(
              <div key={key} style={{display:'flex',gap:12,padding:'8px 12px',background:i%2===0?'var(--surface-3)':'var(--surface-2)',fontSize:13}}>
                <span style={{color:'var(--text-muted)',flexShrink:0,minWidth:120,fontWeight:500}}>{key}</span>
                <span style={{color:'var(--text-primary)',wordBreak:'break-all'}}>{typeof value==='object'?JSON.stringify(value):String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AskPanel() {
  const [question,setQuestion]=useState('');
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [history,setHistory]=useState([]);
  const textareaRef=useRef(null);

  const EXAMPLES=[
    'Why did we reject Vendor Sharma Trading?',
    'Show all fraud alerts this month',
    'Which invoices were approved over ₹50 lakh?',
    'Has any budget been breached this quarter?',
  ];

  const ask=useCallback(async(q)=>{
    if(!q.trim()) return;
    setLoading(true);setResult(null);
    try {
      const res=await apiPost('/ask',{question:q,conversationHistory:history});
      setResult(res);
      setHistory(prev=>[...prev,{role:'user',content:q},{role:'assistant',content:res.answer}]);
    } catch(err){setResult({answer:`Error: ${err.message}`,sources:[],confidence:'low'});}
    finally{setLoading(false);}
  },[history]);

  const confColor={high:'#22C98A',medium:'#F5A623',low:'#FF5C5C'};

  return (
    <div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:15,color:'var(--text-muted)',marginBottom:6}}>Try asking</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {EXAMPLES.map(q=>(
            <button key={q} onClick={()=>{setQuestion(q);textareaRef.current?.focus();}} style={{
              padding:'4px 10px',borderRadius:100,fontSize:15,
              background:'#6C63FF18',color:'#9B8FFF',border:'1px solid #6C63FF30',
              cursor:'pointer',fontWeight:500,
            }}>{q.length>42?q.slice(0,42)+'...':q}</button>
          ))}
        </div>
      </div>
      <div style={{position:'relative'}}>
        <textarea ref={textareaRef} value={question} onChange={e=>setQuestion(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey))ask(question);}}
          placeholder="Ask anything about your financial history..."
          rows={3} style={{
            width:'100%',boxSizing:'border-box',padding:'12px 110px 12px 14px',
            borderRadius:10,fontSize:15,
            border:'1.5px solid var(--border)',
            background:'var(--surface-3)',color:'var(--text-primary)',
            resize:'vertical',fontFamily:'inherit',outline:'none',
          }}
          onFocus={e=>e.target.style.borderColor='#6C63FF'}
          onBlur={e=>e.target.style.borderColor='var(--border)'}
        />
        <button onClick={()=>ask(question)} disabled={loading||!question.trim()} style={{
          position:'absolute',right:10,bottom:10,padding:'6px 14px',borderRadius:8,
          background:loading||!question.trim()?'var(--surface-3)':'var(--accent)',
          color:loading||!question.trim()?'var(--text-muted)':'#fff',
          border:'none',cursor:loading||!question.trim()?'not-allowed':'pointer',
          fontSize:15,fontWeight:600,
        }}>{loading?'..':'Ask →'}</button>
      </div>
      <div style={{fontSize:15,color:'var(--text-muted)',marginTop:4}}>⌘ Enter to send</div>
      {result&&(
        <div style={{marginTop:16,padding:16,borderRadius:10,background:'var(--surface-3)',border:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
            <span style={{fontSize:15,fontWeight:700,color:confColor[result.confidence]??'#888'}}>{result.confidence?.toUpperCase()} CONFIDENCE</span>
            <span style={{fontSize:15,color:'var(--text-muted)'}}>· {result.sources?.length??0} sources</span>
            {history.length>2&&<button onClick={()=>{setHistory([]);setResult(null);}} style={{marginLeft:'auto',fontSize:15,color:'var(--text-muted)',background:'none',border:'none',cursor:'pointer'}}>Clear</button>}
          </div>
          <div style={{fontSize:15,lineHeight:1.7,color:'var(--text-primary)',whiteSpace:'pre-wrap'}}>{result.answer}</div>
        </div>
      )}
    </div>
  );
}

export default function FinanceMemoryPanel() {
  const [tab,setTab]=useState('feed');
  const [memories,setMemories]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selectedMemory,setSelectedMemory]=useState(null);
  const [filters,setFilters]=useState({module:'',type:'',importance:'1'});
  const [searchQuery,setSearchQuery]=useState('');
  const [searching,setSearching]=useState(false);

  const loadRecent=useCallback(async()=>{
    setLoading(true);
    try {
      const params=new URLSearchParams({limit:'30',minImportance:filters.importance});
      if(filters.module) params.set('module',filters.module);
      if(filters.type)   params.set('type',filters.type);
      const data=await apiGet(`/recent?${params}`);
      setMemories(data.results??[]);
    } catch{setMemories([]);}
    finally{setLoading(false);}
  },[filters]);

  useEffect(()=>{if(tab==='feed')loadRecent();},[tab,loadRecent]);

  useEffect(()=>{
    const t=setTimeout(async()=>{
      if(!searchQuery){loadRecent();return;}
      setSearching(true);
      try {
        const params=new URLSearchParams({q:searchQuery,limit:'20'});
        if(filters.module) params.set('module',filters.module);
        if(filters.type)   params.set('type',filters.type);
        const data=await apiGet(`/search?${params}`);
        setMemories(data.results??[]);
      } catch{setMemories([]);}
      finally{setSearching(false);}
    },350);
    return()=>clearTimeout(t);
  },[searchQuery]);

  const stats={
    total:memories.length,
    critical:memories.filter(m=>m.importance>=4).length,
    anomalies:memories.filter(m=>m.memoryType==='anomaly').length,
    approvals:memories.filter(m=>m.memoryType==='approval').length,
    rejections:memories.filter(m=>m.memoryType==='rejection').length,
  };

  const statCards=[
    {icon:'📋',label:'Total Memories', value:stats.total,    subtitle:'All time',       color:'#6C63FF', sparkData:[1,2,2,3,3,4,4,5]},
    {icon:'🔥',label:'Critical',       value:stats.critical, subtitle:'Needs attention', color:'#F5A623', sparkData:[1,3,2,4,3,5,4,6]},
    {icon:'🔴',label:'Anomalies',      value:stats.anomalies,subtitle:'Detected',        color:'#FF5C5C', sparkData:[1,2,1,3,1,2,1,3]},
    {icon:'✅',label:'Approved',       value:stats.approvals,subtitle:'Decisions',        color:'#22C98A', sparkData:[1,2,3,4,3,5,4,6]},
  ];

  const selectStyles={
    padding:'7px 32px 7px 10px',borderRadius:8,fontSize:15,fontWeight:500,
    border:'1px solid var(--border)',background:'var(--surface-3)',color:'var(--text-primary)',
    cursor:'pointer',outline:'none',
    appearance:'none',
    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B89A8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat:'no-repeat',backgroundPosition:'right 8px center',
  };

  return (
    <div style={{
      width:'100%',height:'100%',position:'relative',
      fontFamily:'var(--font)',
      background:'var(--surface-1)',
      borderRadius:14,overflow:'hidden',
      display:'flex',flexDirection:'column',
      border:'1px solid var(--border)',
    }}>
      {/* ── Header with icon ── */}
      <div style={{padding:'18px 20px 0',borderBottom:'1px solid var(--border)',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <div style={{
            width:36,height:36,borderRadius:10,
            background:'linear-gradient(135deg,#6C63FF,#9B8FFF)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:18,color:'#fff',flexShrink:0,
          }}>◈</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,lineHeight:1.2}}>Finance Memory</div>
            <div style={{fontSize:15,color:'var(--text-muted)'}}>Every decision, event, and insight — searchable forever</div>
          </div>
        </div>

        {/* Stat cards row */}
        <div style={{display:'flex',gap:10,marginBottom:16}}>
          {statCards.map(s=><StatCard key={s.label} {...s}/>)}
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:0}}>
          {[{id:'feed',label:'Memory Feed'},{id:'ask',label:'Ask Memory',badge:'AI'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              display:'flex',alignItems:'center',gap:6,
              padding:'8px 16px',fontSize:15,fontWeight:600,
              background:'none',border:'none',cursor:'pointer',
              borderBottom:tab===t.id?'2px solid #6C63FF':'2px solid transparent',
              color:tab===t.id?'#6C63FF':'var(--text-secondary)',
              marginBottom:-1,transition:'color 0.15s',
            }}>
              {t.label}
              {t.badge&&<span style={{fontSize:9,fontWeight:700,padding:'1px 5px',borderRadius:4,background:'#6C63FF',color:'#fff'}}>{t.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{flex:1,overflow:'auto',padding:16,position:'relative'}}>
        {selectedMemory&&<MemoryDetail memory={selectedMemory} onClose={()=>setSelectedMemory(null)}/>}

        {tab==='feed'&&(
          <>
            {/* Search bar */}
            <div style={{
              display:'flex',alignItems:'center',gap:8,
              padding:'9px 14px',marginBottom:10,
              background:'var(--surface-3)',border:'1.5px solid var(--border)',
              borderRadius:10,
            }}>
              <span style={{fontSize:15,color:'var(--text-muted)'}}>🔍</span>
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                placeholder="Search memories... (semantic + keyword)"
                style={{
                  flex:1,border:'none',outline:'none',background:'transparent',
                  fontSize:15,color:'var(--text-primary)',fontFamily:'inherit',
                }}
              />
              <span style={{fontSize:15,color:'var(--text-muted)',opacity:0.5}}>⊞</span>
            </div>

            {/* Filters */}
            <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
              <select value={filters.module} onChange={e=>setFilters(f=>({...f,module:e.target.value}))} style={selectStyles}>
                <option value="">All modules</option>
                {Object.entries(MODULE_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
              <select value={filters.type} onChange={e=>setFilters(f=>({...f,type:e.target.value}))} style={selectStyles}>
                <option value="">All types</option>
                {Object.entries(TYPE_CONFIG).map(([v,{label}])=><option key={v} value={v}>{label}</option>)}
              </select>
              <select value={filters.importance} onChange={e=>setFilters(f=>({...f,importance:e.target.value}))} style={selectStyles}>
                <option value="1">All priorities</option>
                <option value="3">Medium+</option>
                <option value="4">High+</option>
                <option value="5">Critical only</option>
              </select>
            </div>

            {loading||searching?(
              <div style={{textAlign:'center',padding:40,color:'var(--text-muted)',fontSize:14}}>
                {searching?'Searching memory...':'Loading...'}
              </div>
            ):memories.length===0?(
              <EmptyState/>
            ):(
              memories.map(m=><MemoryCard key={m.id} memory={m} onClick={setSelectedMemory}/>)
            )}
          </>
        )}

        {tab==='ask'&&<AskPanel/>}
      </div>
    </div>
  );
}

