import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const api = async (url) => {
  try { const r = await fetch(apiURL(url), { headers: h() }); return await r.json(); }
  catch(e) { return { error: e.message }; }
};

const fmt = (n) => { const v=parseFloat(n||0); if(v>=10000000) return '\u20b9'+(v/10000000).toFixed(2)+'Cr'; if(v>=100000) return '\u20b9'+(v/100000).toFixed(2)+'L'; return '\u20b9'+v.toFixed(0); };
const Badge = ({text,color='#1d4ed8'}) => <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:color+'18',color,border:`1px solid ${color}30`}}>{text}</span>;

const CATEGORIES = {
  'Investment & Securities': {color:'#059669', icon:'\ud83d\udcb9', docs:[
    {id:'share-allotment',name:'Share Allotment Letter',desc:'Formal letter to allottee for share issuance'},
    {id:'rights-issue-notice',name:'Rights Issue Notice',desc:'Notice to existing shareholders for rights entitlement'},
    {id:'bonus-issue-resolution',name:'Bonus Issue Resolution',desc:'Board resolution for capitalization of reserves'},
    {id:'buyback-offer',name:'Buyback Offer Document',desc:'Formal buyback offer under Section 68'},
    {id:'pas4-private-placement',name:'Private Placement (PAS-4)',desc:'Offer letter for private placement to max 200 persons'},
    {id:'convertible-note',name:'Convertible Note Agreement',desc:'Startup convertible note for seed/bridge financing'},
    {id:'esop-plan',name:'ESOP Plan Document',desc:'Employee stock option plan with vesting schedule'},
    {id:'valuation-report',name:'Valuation Report (Rule 11UA)',desc:'FMV valuation for Section 56(2)(viib) compliance'},
  ]},
  'ESG & Sustainability': {color:'#16a34a', icon:'\ud83c\udf31', docs:[
    {id:'brsr-report',name:'BRSR Report',desc:'SEBI-mandated Business Responsibility & Sustainability Report'},
    {id:'ghg-inventory',name:'GHG Emissions Inventory',desc:'Scope 1, 2, 3 carbon emissions under GHG Protocol'},
    {id:'esg-risk-assessment',name:'ESG Risk Assessment',desc:'TCFD-aligned climate and ESG risk register'},
    {id:'csr-report',name:'CSR Policy & Annual Report',desc:'Section 135 CSR policy and FY spending report'},
    {id:'carbon-certificate',name:'Carbon Footprint Certificate',desc:'Annual carbon footprint self-declaration certificate'},
    {id:'supplier-sustainability-code',name:'Supplier Sustainability Code',desc:'Vendor code for labour, environment, ethics compliance'},
  ]},
  'Legal & Contracts': {color:'#7c3aed', icon:'\u2696\ufe0f', docs:[
    {id:'joint-venture-agreement',name:'Joint Venture Agreement',desc:'Comprehensive JV agreement with exit provisions'},
    {id:'franchise-agreement',name:'Franchise Agreement',desc:'Franchisor-franchisee agreement with territory rights'},
    {id:'technology-transfer-agreement',name:'Technology Transfer Agreement',desc:'IP licensing with FEMA compliance for cross-border'},
    {id:'arbitration-agreement',name:'Arbitration Agreement',desc:'Standalone arbitration clause under Arbitration Act 1996'},
  ]},
};

function DocSection({ fields, content, items, subsections, principles, esg_metrics }) {
  if (fields) return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 16px'}}>
      {fields.map((f,i)=>(
        <div key={i} style={{display:'flex',gap:8,padding:'5px 0',borderBottom:'1px solid #f8faff',fontSize:11}}>
          <span style={{color:'#64748b',minWidth:160,flexShrink:0}}>{f.label}:</span>
          <span style={{color:'#334155',fontWeight:600}}>{f.value}</span>
        </div>
      ))}
    </div>
  );
  if (items) return <ul style={{margin:'6px 0',paddingLeft:18}}>{items.map((item,i)=><li key={i} style={{fontSize:11,color:'#334155',marginBottom:4,lineHeight:1.5}}>{item}</li>)}</ul>;
  if (content) return <div style={{fontSize:11,color:'#334155',lineHeight:1.7,whiteSpace:'pre-line',background:'#f8faff',padding:'8px 12px',borderRadius:6}}>{content}</div>;
  if (subsections) return <div>{subsections.map((s,i)=><div key={i} style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:700,color:'#64748b',marginBottom:4}}>{s.name}</div>{s.fields?<DocSection fields={s.fields}/>:s.content?<DocSection content={s.content}/>:null}</div>)}</div>;
  if (principles) return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
      {principles.map((p,i)=>(
        <div key={i} style={{background:'#f8faff',borderRadius:8,padding:'10px 12px',borderLeft:`3px solid ${p.score>=80?'#059669':p.score>=60?'#d97706':'#dc2626'}`}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
            <span style={{fontSize:11,fontWeight:700,color:'#334155'}}>{p.id}: {p.name}</span>
            <span style={{fontSize:11,fontWeight:800,color:p.score>=80?'#059669':p.score>=60?'#d97706':'#dc2626'}}>{p.score}/100</span>
          </div>
          <div style={{height:4,background:'#e2e8f0',borderRadius:2,marginBottom:6}}><div style={{height:'100%',width:p.score+'%',background:p.score>=80?'#059669':p.score>=60?'#d97706':'#dc2626',borderRadius:2}}/></div>
          {p.disclosures.map((d,j)=><div key={j} style={{fontSize:10,color:'#64748b'}}>\u2022 {d}</div>)}
        </div>
      ))}
    </div>
  );
  return null;
}

function DocViewer({ doc, onClose }) {
  if (!doc) return null;
  const c = doc.content;
  const sections = Array.isArray(c) ? c : (c?.sections || []);

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9999,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'20px',overflowY:'auto'}}>
      <div style={{background:'#fff',borderRadius:12,width:'100%',maxWidth:900,boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)',padding:'16px 20px',borderRadius:'12px 12px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{color:'#fff',fontSize:15,fontWeight:800}}>{doc.title}</div>
            <div style={{color:'rgba(255,255,255,0.7)',fontSize:10,marginTop:2}}>
              {doc.doc_number||doc.certificate_number} \u00b7 {doc.company?.name} \u00b7 {new Date(doc.generated_at).toLocaleDateString('en-IN')}
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>window.print()} style={{padding:'6px 12px',borderRadius:7,border:'1px solid rgba(255,255,255,0.3)',background:'transparent',color:'#fff',fontSize:11,cursor:'pointer'}}>\ud83d\udda8\ufe0f Print</button>
            <button onClick={onClose} style={{padding:'6px 12px',borderRadius:7,border:'none',background:'rgba(255,255,255,0.2)',color:'#fff',fontSize:11,cursor:'pointer'}}>\u2715 Close</button>
          </div>
        </div>

        {/* Company Banner */}
        {doc.company && (
          <div style={{padding:'10px 20px',background:'#f8faff',borderBottom:'1px solid #e2e8f0',display:'flex',gap:16,fontSize:11}}>
            <span style={{fontWeight:700,color:'#0f172a'}}>{doc.company.name}</span>
            <span style={{color:'#64748b'}}>CIN: {doc.company.cin}</span>
            <span style={{color:'#64748b'}}>{doc.company.registered_address?.substring(0,50)}</span>
          </div>
        )}

        {/* Key Terms Banner */}
        {(doc.key_terms||doc.terms||doc.details) && (
          <div style={{padding:'10px 20px',background:'#eff6ff',borderBottom:'1px solid #dbeafe',display:'flex',gap:12,flexWrap:'wrap'}}>
            {Object.entries(doc.key_terms||doc.terms||doc.details||{}).map(([k,v],i)=>(
              <div key={i} style={{fontSize:10}}><span style={{color:'#64748b'}}>{k}: </span><span style={{fontWeight:700,color:'#1d4ed8'}}>{String(v)}</span></div>
            ))}
          </div>
        )}

        {/* AI Content (plain text) */}
        {typeof c === 'string' && (
          <div style={{padding:20,fontSize:11,color:'#334155',lineHeight:1.8,whiteSpace:'pre-line',maxHeight:'70vh',overflowY:'auto'}}>
            {c}
          </div>
        )}

        {/* Structured Content */}
        {typeof c === 'object' && !Array.isArray(c) && (
          <div style={{padding:20,maxHeight:'70vh',overflowY:'auto'}}>
            {c.header && <div style={{fontSize:15,fontWeight:800,color:'#0f172a',textAlign:'center',marginBottom:4}}>{c.header}</div>}
            {c.sub_header && <div style={{fontSize:11,color:'#64748b',textAlign:'center',marginBottom:4}}>{c.sub_header}</div>}
            {c.important_notice && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'8px 12px',fontSize:11,color:'#dc2626',fontWeight:600,marginBottom:12}}>{c.important_notice}</div>}
            {c.introduction && <div style={{fontSize:11,color:'#334155',lineHeight:1.7,marginBottom:14,padding:'8px 12px',background:'#f0fdf4',borderRadius:8}}>{c.introduction}</div>}
            {c.policy_statement && <div style={{fontSize:11,color:'#334155',lineHeight:1.7,marginBottom:14,padding:'10px 14px',background:'#eff6ff',borderRadius:8,borderLeft:'4px solid #1d4ed8'}}>{c.policy_statement}</div>}
            {(c.sections||sections).map((sec,i)=>(
              <div key={i} style={{marginBottom:16,padding:'12px 14px',background:i%2===0?'#fff':'#f8faff',borderRadius:8,border:'1px solid #e2e8f0'}}>
                <div style={{fontSize:12,fontWeight:700,color:'#0f172a',marginBottom:8,paddingBottom:6,borderBottom:'2px solid #e2e8f0'}}>{sec.title||sec.name}</div>
                <DocSection {...sec}/>
              </div>
            ))}
            {c.certificate_fields && (
              <div style={{padding:'12px 14px',background:'#f8faff',borderRadius:8,border:'1px solid #e2e8f0',marginBottom:14}}>
                {c.certificate_fields.map((f,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #e2e8f0',fontSize:11}}>
                    <span style={{color:'#64748b',fontWeight:600}}>{f.label}</span>
                    <span style={{color:'#334155',fontWeight:700,textAlign:'right',maxWidth:'60%'}}>{f.value}</span>
                  </div>
                ))}
              </div>
            )}
            {c.declaration && <div style={{padding:'12px 14px',background:'#f0fdf4',borderRadius:8,border:'1px solid #bbf7d0',fontSize:11,color:'#334155',lineHeight:1.7,whiteSpace:'pre-line'}}>{c.declaration}</div>}
            {c.footer && <div style={{marginTop:14,padding:'8px 12px',background:'#f8faff',borderRadius:6,fontSize:10,color:'#64748b',fontStyle:'italic'}}>{c.footer}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Batch4DocsPage() {
  const [viewDoc, setViewDoc] = useState(null);
  const [loading, setLoading] = useState({});
  const [toast, setToast] = useState(null);
  const [params, setParams] = useState({});
  const [showParams, setShowParams] = useState(null);

  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),4000); };

  const loadDoc = async (id) => {
    setLoading(p=>({...p,[id]:true}));
    const r = await api('/api/docs4/'+id);
    setLoading(p=>({...p,[id]:false}));
    if (r.error) showToast('\u274c Error: '+r.error, false);
    else setViewDoc(r);
  };

  const totalDocs = Object.values(CATEGORIES).reduce((s,c)=>s+c.docs.length, 0);

  return (
    <div style={{padding:20,background:'#f0f4ff',minHeight:'100%'}}>
      <div style={{background:'linear-gradient(135deg,#059669,#16a34a)',borderRadius:12,padding:'16px 20px',marginBottom:14,color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:17,fontWeight:800}}>\ud83d\udcbc Governance Documents — Batch 4</div>
          <div style={{fontSize:11,opacity:0.85}}>Investment & Securities \u00b7 ESG & Sustainability \u00b7 Legal & Contracts</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontSize:28,fontWeight:900}}>{totalDocs}</div>
          <div style={{fontSize:11,opacity:0.8}}>Documents</div>
        </div>
      </div>

      {toast && <div style={{position:'fixed',top:20,right:20,zIndex:9999,padding:'10px 16px',borderRadius:8,background:toast.ok?'#f0fdf4':'#fef2f2',border:`1px solid ${toast.ok?'#bbf7d0':'#fecaca'}`,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',fontSize:12,fontWeight:600,color:toast.ok?'#16a34a':'#dc2626'}}>{toast.msg}</div>}

      {Object.entries(CATEGORIES).map(([catName, cat])=>(
        <div key={catName} style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <span style={{fontSize:22}}>{cat.icon}</span>
            <div style={{fontSize:14,fontWeight:800,color:'#0f172a'}}>{catName}</div>
            <Badge text={cat.docs.length+' Documents'} color={cat.color}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            {cat.docs.map(doc=>(
              <div key={doc.id} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'14px 16px',borderTop:`3px solid ${cat.color}`,display:'flex',flexDirection:'column',gap:8}}>
                <div style={{fontSize:12,fontWeight:700,color:'#0f172a',lineHeight:1.3}}>{doc.name}</div>
                <div style={{fontSize:10,color:'#64748b',lineHeight:1.4,flex:1}}>{doc.desc}</div>
                <button
                  onClick={()=>loadDoc(doc.id)}
                  disabled={loading[doc.id]}
                  style={{padding:'7px 0',borderRadius:7,border:'none',background:loading[doc.id]?'#e2e8f0':cat.color,color:'#fff',fontSize:11,fontWeight:700,cursor:loading[doc.id]?'not-allowed':'pointer',transition:'opacity 0.2s'}}>
                  {loading[doc.id]?'\ud83d\udd04 Generating...':'\ud83d\udcc4 Generate Document'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:16,marginTop:8}}>
        <div style={{fontSize:12,fontWeight:700,color:'#0f172a',marginBottom:8}}>\ud83d\udce7 All documents are auto-emailed after generation</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,fontSize:11,color:'#64748b'}}>
          <div>\u2705 <strong>Investment docs</strong> are pre-filled with company data from your Finance OS</div>
          <div>\u2705 <strong>ESG reports</strong> use real employee and asset data from your modules</div>
          <div>\u2705 <strong>Legal docs</strong> are AI-generated with Claude for legal comprehensiveness</div>
        </div>
      </div>

      {viewDoc && <DocViewer doc={viewDoc} onClose={()=>setViewDoc(null)}/>}
    </div>
  );
}
