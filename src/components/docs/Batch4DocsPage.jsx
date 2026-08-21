import { useState } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const api = async (url) => {
  try { const r = await fetch(apiURL(url), { headers: h() }); return await r.json(); }
  catch(e) { return { error: e.message }; }
};

const Badge = ({text,color='#1d4ed8'}) => <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:color+'18',color,border:`1px solid ${color}30`}}>{text}</span>;

const CATEGORIES = {
  'Investment & Securities': {color:'#059669', icon:'&#128185;', docs:[
    {id:'share-allotment',name:'Share Allotment Letter',desc:'Formal letter to allottee for share issuance'},
    {id:'rights-issue-notice',name:'Rights Issue Notice',desc:'Notice to existing shareholders for rights entitlement'},
    {id:'bonus-issue-resolution',name:'Bonus Issue Resolution',desc:'Board resolution for capitalization of reserves'},
    {id:'buyback-offer',name:'Buyback Offer Document',desc:'Formal buyback offer under Section 68'},
    {id:'pas4-private-placement',name:'Private Placement (PAS-4)',desc:'Offer letter for private placement to max 200 persons'},
    {id:'convertible-note',name:'Convertible Note Agreement',desc:'Startup convertible note for seed/bridge financing'},
    {id:'esop-plan',name:'ESOP Plan Document',desc:'Employee stock option plan with vesting schedule'},
    {id:'valuation-report',name:'Valuation Report (Rule 11UA)',desc:'FMV valuation for Section 56(2)(viib) compliance'},
  ]},
  'ESG & Sustainability': {color:'#16a34a', icon:'&#127807;', docs:[
    {id:'brsr-report',name:'BRSR Report',desc:'SEBI-mandated Business Responsibility & Sustainability Report'},
    {id:'ghg-inventory',name:'GHG Emissions Inventory',desc:'Scope 1, 2, 3 carbon emissions under GHG Protocol'},
    {id:'esg-risk-assessment',name:'ESG Risk Assessment',desc:'TCFD-aligned climate and ESG risk register'},
    {id:'csr-report',name:'CSR Policy & Annual Report',desc:'Section 135 CSR policy and FY spending report'},
    {id:'carbon-certificate',name:'Carbon Footprint Certificate',desc:'Annual carbon footprint self-declaration certificate'},
    {id:'supplier-sustainability-code',name:'Supplier Sustainability Code',desc:'Vendor code for labour, environment, ethics compliance'},
  ]},
  'Legal & Contracts': {color:'#7c3aed', icon:'&#9878;', docs:[
    {id:'joint-venture-agreement',name:'Joint Venture Agreement',desc:'Comprehensive JV agreement with exit provisions'},
    {id:'franchise-agreement',name:'Franchise Agreement',desc:'Franchisor-franchisee agreement with territory rights'},
    {id:'technology-transfer-agreement',name:'Technology Transfer Agreement',desc:'IP licensing with FEMA compliance for cross-border'},
    {id:'arbitration-agreement',name:'Arbitration Agreement',desc:'Standalone arbitration clause under Arbitration Act 1996'},
  ]},
};

function FieldTable({fields}) {
  return (
    <table style={{width:'100%',borderCollapse:'collapse',marginBottom:8}}>
      <tbody>
        {fields.map((f,i)=>(
          <tr key={i} style={{borderBottom:'1px solid #f1f5f9',background:i%2===0?'#fff':'#f8faff'}}>
            <td style={{padding:'7px 12px',fontSize:11,color:'#64748b',fontWeight:600,width:'38%',verticalAlign:'top'}}>{f.label}</td>
            <td style={{padding:'7px 12px',fontSize:11,color:'#0f172a',fontWeight:700}}>{f.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ItemList({items}) {
  return (
    <ul style={{margin:'4px 0 8px',paddingLeft:20}}>
      {items.map((item,i)=>(
        <li key={i} style={{fontSize:11,color:'#334155',marginBottom:5,lineHeight:1.6}}>{item}</li>
      ))}
    </ul>
  );
}

function Section({sec, index}) {
  return (
    <div style={{marginBottom:14,border:'1px solid #e2e8f0',borderRadius:8,overflow:'hidden'}}>
      <div style={{padding:'8px 14px',background:index%2===0?'#eff6ff':'#f0fdf4',borderBottom:'2px solid #e2e8f0'}}>
        <span style={{fontSize:12,fontWeight:800,color:'#1e3a8a'}}>{sec.title||sec.name}</span>
      </div>
      <div style={{padding:'12px 14px',background:'#fff'}}>
        {sec.fields && <FieldTable fields={sec.fields}/>}
        {sec.items && <ItemList items={sec.items}/>}
        {sec.requirements && <ItemList items={sec.requirements}/>}
        {sec.content && (
          <div style={{fontSize:11,color:'#334155',lineHeight:1.8,whiteSpace:'pre-line',background:'#f8faff',padding:'10px 14px',borderRadius:6,borderLeft:'3px solid #1d4ed8'}}>
            {sec.content}
          </div>
        )}
        {sec.subsections && sec.subsections.map((s,i)=>(
          <div key={i} style={{marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:'#475569',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.03em',borderBottom:'1px solid #e2e8f0',paddingBottom:3}}>{s.name}</div>
            {s.fields && <FieldTable fields={s.fields}/>}
            {s.content && <div style={{fontSize:11,color:'#334155',lineHeight:1.7,whiteSpace:'pre-line'}}>{s.content}</div>}
          </div>
        ))}
        {sec.principles && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {sec.principles.map((p,i)=>(
              <div key={i} style={{background:'#f8faff',borderRadius:7,padding:'8px 12px',border:'1px solid #e2e8f0',borderLeft:`3px solid ${p.score>=80?'#059669':p.score>=60?'#d97706':'#dc2626'}`}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:11,fontWeight:700,color:'#0f172a'}}>{p.id}: {p.name}</span>
                  <span style={{fontSize:13,fontWeight:900,color:p.score>=80?'#059669':p.score>=60?'#d97706':'#dc2626'}}>{p.score}</span>
                </div>
                <div style={{height:4,background:'#e2e8f0',borderRadius:2,marginBottom:5}}><div style={{height:'100%',width:p.score+'%',background:p.score>=80?'#059669':p.score>=60?'#d97706':'#dc2626',borderRadius:2}}/></div>
                {p.disclosures.map((d,j)=><div key={j} style={{fontSize:9,color:'#64748b',marginBottom:1}}>- {d}</div>)}
              </div>
            ))}
          </div>
        )}
        {sec.esg_metrics && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {Object.entries(sec.esg_metrics).map(([cat,metrics])=>(
              <div key={cat} style={{background:'#f8faff',borderRadius:7,padding:'10px 12px',border:'1px solid #e2e8f0'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#1e3a8a',marginBottom:6,textTransform:'capitalize'}}>{cat}</div>
                {Object.entries(metrics).map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',borderBottom:'1px solid #e2e8f0',fontSize:10}}>
                    <span style={{color:'#64748b'}}>{k.replace(/_/g,' ')}</span>
                    <span style={{fontWeight:700,color:'#334155'}}>{String(v)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function renderAIText(text) {
  if (!text) return null;
  return text.split('\n').map((line,i)=>{
    if (line.startsWith('# ')) return <h1 key={i} style={{fontSize:16,fontWeight:900,color:'#1e3a8a',margin:'14px 0 6px',borderBottom:'2px solid #1d4ed8',paddingBottom:5}}>{line.slice(2)}</h1>;
    if (line.startsWith('## ')) return <h2 key={i} style={{fontSize:13,fontWeight:800,color:'#1e3a8a',margin:'12px 0 5px',borderBottom:'1px solid #e2e8f0',paddingBottom:3}}>{line.slice(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={i} style={{fontSize:12,fontWeight:700,color:'#334155',margin:'10px 0 4px',textTransform:'uppercase',letterSpacing:'0.04em'}}>{line.slice(4)}</h3>;
    if (line.startsWith('**') && line.endsWith('**') && line.length>4) return <div key={i} style={{fontWeight:700,color:'#0f172a',margin:'4px 0',fontSize:12}}>{line.slice(2,-2)}</div>;
    if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} style={{paddingLeft:16,marginBottom:3,fontSize:11,color:'#334155'}}>- {line.slice(2)}</div>;
    if (line.match(/^\d+\. /)) return <div key={i} style={{paddingLeft:16,marginBottom:3,fontSize:11,color:'#334155'}}>{line}</div>;
    if (line.startsWith('RESOLVED THAT') || line.startsWith('FURTHER RESOLVED')) return <div key={i} style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:6,padding:'8px 12px',margin:'6px 0',fontWeight:600,color:'#14532d',fontSize:11}}>{line}</div>;
    if (line.startsWith('---') || line.startsWith('___')) return <hr key={i} style={{border:'none',borderTop:'1px solid #e2e8f0',margin:'10px 0'}}/>;
    if (!line.trim()) return <div key={i} style={{height:6}}/>;
    return <div key={i} style={{fontSize:11,color:'#334155',lineHeight:1.7,marginBottom:1}}>{line}</div>;
  });
}

function DocViewer({doc, onClose}) {
  if (!doc) return null;
  const c = doc.content;
  const co = doc.company || {};
  const isString = typeof c === 'string';
  const isObj = typeof c === 'object' && c !== null && !Array.isArray(c);

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.75)',zIndex:9999,display:'flex',alignItems:'flex-start',justifyContent:'center',padding:20,overflowY:'auto'}}>
      <div style={{background:'#fff',borderRadius:14,width:'100%',maxWidth:880,boxShadow:'0 30px 100px rgba(0,0,0,0.5)',marginBottom:20}}>

        {/* Header */}
        <div style={{background:'linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 60%,#0891b2 100%)',padding:'18px 24px',borderRadius:'14px 14px 0 0',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:17,fontWeight:900,color:'#fff',marginBottom:3,lineHeight:1.2}}>{doc.title}</div>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.7)'}}>{doc.doc_number||doc.certificate_number} &middot; {new Date(doc.generated_at).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={()=>window.print()} style={{padding:'7px 14px',borderRadius:7,border:'1px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.1)',color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>Print / PDF</button>
            <button onClick={onClose} style={{padding:'7px 14px',borderRadius:7,border:'none',background:'rgba(255,255,255,0.2)',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>Close</button>
          </div>
        </div>

        {/* Letterhead */}
        {co.name && (
          <div style={{padding:'12px 24px',background:'#f0f4ff',borderBottom:'2px solid #dbeafe',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:15,fontWeight:900,color:'#1e3a8a'}}>{co.name}</div>
              <div style={{fontSize:10,color:'#64748b',marginTop:2}}>CIN: {co.cin} &nbsp;|&nbsp; {co.registered_address}</div>
            </div>
            <div style={{textAlign:'right',fontSize:10,color:'#64748b'}}>
              <div>{co.email}</div>
              <div style={{color:'#1d4ed8'}}>{co.website}</div>
            </div>
          </div>
        )}

        {/* Key terms */}
        {(doc.key_terms||doc.terms||doc.details) && (
          <div style={{padding:'8px 24px',background:'#fafbff',borderBottom:'1px solid #e2e8f0',display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
            <span style={{fontSize:9,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em'}}>Key Terms</span>
            {Object.entries(doc.key_terms||doc.terms||doc.details||{}).filter(([,v])=>v).map(([k,v],i)=>(
              <div key={i} style={{fontSize:10,background:'#eff6ff',color:'#1d4ed8',padding:'3px 9px',borderRadius:4,border:'1px solid #dbeafe',fontWeight:600}}>
                {k.replace(/_/g,' ')}: <strong>{String(v)}</strong>
              </div>
            ))}
          </div>
        )}
        {doc.parties && Object.values(doc.parties).some(Boolean) && (
          <div style={{padding:'8px 24px',background:'#f0fdf4',borderBottom:'1px solid #bbf7d0',display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
            <span style={{fontSize:9,fontWeight:800,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.08em'}}>Parties</span>
            {Object.entries(doc.parties).map(([k,v],i)=>(
              <div key={i} style={{fontSize:10,background:'#dcfce7',color:'#14532d',padding:'3px 9px',borderRadius:4,border:'1px solid #bbf7d0',fontWeight:600}}>
                {k}: <strong>{typeof v==='object'?v.name||'—':String(v)}</strong>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{padding:24,maxHeight:'65vh',overflowY:'auto'}}>

          {isString && <div>{renderAIText(c)}</div>}

          {isObj && (
            <div>
              {c.header && (
                <div style={{textAlign:'center',padding:'12px 0',marginBottom:16,borderBottom:'2px solid #1d4ed8'}}>
                  <div style={{fontSize:16,fontWeight:900,color:'#1e3a8a',letterSpacing:'0.02em'}}>{c.header}</div>
                  {c.sub_header && <div style={{fontSize:10,color:'#64748b',marginTop:4,fontStyle:'italic'}}>{c.sub_header}</div>}
                  {c.regulatory_ref && <div style={{fontSize:10,color:'#7c3aed',marginTop:4,fontWeight:700}}>{c.regulatory_ref}</div>}
                </div>
              )}
              {c.important_notice && (
                <div style={{background:'#fef2f2',border:'2px solid #fecaca',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:11,color:'#dc2626',fontWeight:700,textAlign:'center'}}>
                  WARNING: {c.important_notice}
                </div>
              )}
              {c.policy_statement && (
                <div style={{background:'#eff6ff',borderLeft:'4px solid #1d4ed8',padding:'10px 14px',borderRadius:'0 8px 8px 0',marginBottom:14,fontSize:12,color:'#1e3a8a',fontStyle:'italic',lineHeight:1.7}}>{c.policy_statement}</div>
              )}
              {c.introduction && (
                <div style={{background:'#f0fdf4',borderLeft:'4px solid #059669',padding:'10px 14px',borderRadius:'0 8px 8px 0',marginBottom:14,fontSize:11,color:'#14532d',lineHeight:1.7}}>{c.introduction}</div>
              )}
              {(c.sections||[]).map((sec,i)=><Section key={i} sec={sec} index={i}/>)}
              {c.certificate_fields && (
                <div style={{border:'2px solid #1d4ed8',borderRadius:10,overflow:'hidden',marginBottom:14}}>
                  <div style={{background:'#1d4ed8',padding:'8px 16px'}}><span style={{color:'#fff',fontWeight:700,fontSize:12}}>Certificate Details</span></div>
                  <FieldTable fields={c.certificate_fields}/>
                </div>
              )}
              {c.declaration && (
                <div style={{background:'#f8faff',border:'1px solid #e2e8f0',borderRadius:8,padding:'14px 18px',marginTop:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#334155',marginBottom:8,borderBottom:'1px solid #e2e8f0',paddingBottom:6}}>Declaration & Signature Block</div>
                  <div style={{fontSize:11,color:'#334155',lineHeight:1.9,whiteSpace:'pre-line'}}>{c.declaration}</div>
                </div>
              )}
              {c.footer && <div style={{marginTop:14,padding:'8px 12px',background:'#f8faff',borderRadius:6,fontSize:10,color:'#64748b',fontStyle:'italic',borderTop:'1px solid #e2e8f0'}}>{c.footer}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:'10px 24px',background:'#f8faff',borderTop:'1px solid #e2e8f0',borderRadius:'0 0 14px 14px',display:'flex',justifyContent:'space-between',fontSize:10,color:'#94a3b8'}}>
          <span>Deemona AI Finance OS &middot; {doc.doc_number||doc.certificate_number}</span>
          <span>System-generated document &mdash; verify before legal use</span>
        </div>
      </div>
    </div>
  );
}

export default function Batch4DocsPage() {
  const [viewDoc, setViewDoc] = useState(null);
  const [loading, setLoading] = useState({});
  const [toast, setToast] = useState(null);
  const showToast = (msg,ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),4000); };

  const loadDoc = async (id) => {
    setLoading(p=>({...p,[id]:true}));
    const r = await api('/api/docs4/'+id);
    setLoading(p=>({...p,[id]:false}));
    if (r.error) showToast('Error: '+r.error,false);
    else { setViewDoc(r); showToast('Document generated!'); }
  };

  const totalDocs = Object.values(CATEGORIES).reduce((s,c)=>s+c.docs.length,0);

  return (
    <div style={{padding:20,background:'#f0f4ff',minHeight:'100%'}}>
      <div style={{background:'linear-gradient(135deg,#059669,#0891b2)',borderRadius:12,padding:'16px 20px',marginBottom:14,color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:17,fontWeight:800}}>Governance Documents &mdash; Batch 4</div>
          <div style={{fontSize:11,opacity:0.85}}>Investment &amp; Securities &middot; ESG &amp; Sustainability &middot; Legal &amp; Contracts</div>
        </div>
        <div style={{background:'rgba(255,255,255,0.2)',borderRadius:10,padding:'8px 16px',textAlign:'center'}}>
          <div style={{fontSize:26,fontWeight:900}}>{totalDocs}</div>
          <div style={{fontSize:10,opacity:0.85}}>Documents</div>
        </div>
      </div>

      {toast && <div style={{position:'fixed',top:20,right:20,zIndex:9998,padding:'10px 16px',borderRadius:8,background:toast.ok?'#f0fdf4':'#fef2f2',border:`1px solid ${toast.ok?'#bbf7d0':'#fecaca'}`,boxShadow:'0 4px 16px rgba(0,0,0,0.15)',fontSize:12,fontWeight:600,color:toast.ok?'#16a34a':'#dc2626'}}>{toast.msg}</div>}

      {Object.entries(CATEGORIES).map(([catName,cat])=>(
        <div key={catName} style={{marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,padding:'8px 14px',background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',borderLeft:`4px solid ${cat.color}`}}>
            <span dangerouslySetInnerHTML={{__html:cat.icon}} style={{fontSize:20}}/>
            <div style={{fontSize:13,fontWeight:800,color:'#0f172a'}}>{catName}</div>
            <Badge text={cat.docs.length+' Documents'} color={cat.color}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            {cat.docs.map(doc=>(
              <div key={doc.id} style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'14px 16px',borderTop:`3px solid ${cat.color}`,display:'flex',flexDirection:'column',gap:8}}>
                <div style={{fontSize:12,fontWeight:700,color:'#0f172a',lineHeight:1.4}}>{doc.name}</div>
                <div style={{fontSize:10,color:'#64748b',lineHeight:1.5,flex:1}}>{doc.desc}</div>
                <button onClick={()=>loadDoc(doc.id)} disabled={loading[doc.id]}
                  style={{padding:'8px 0',borderRadius:7,border:'none',background:loading[doc.id]?'#e2e8f0':cat.color,color:'#fff',fontSize:11,fontWeight:700,cursor:loading[doc.id]?'not-allowed':'pointer'}}>
                  {loading[doc.id]?'Generating...':'Generate Document'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:16}}>
        <div style={{fontSize:12,fontWeight:700,color:'#0f172a',marginBottom:8}}>About These Documents</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,fontSize:11}}>
          {[['Investment docs','Pre-filled with your company CIN, paid-up capital, and financial data','#059669'],['ESG reports','Use real employee count, asset data, and revenue from your Finance OS','#16a34a'],['Legal agreements','AI-generated by Claude for comprehensive Indian law compliance','#7c3aed']].map(([t,d,c],i)=>(
            <div key={i} style={{padding:'10px 12px',background:'#f8faff',borderRadius:8,borderLeft:`3px solid ${c}`}}>
              <div style={{fontWeight:700,color:c,marginBottom:3}}>{t}</div>
              <div style={{color:'#64748b'}}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {viewDoc && <DocViewer doc={viewDoc} onClose={()=>setViewDoc(null)}/>}
    </div>
  );
}
