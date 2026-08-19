import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); return await r.json(); } catch { return {}; } };
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); return await r.json(); } catch (e) { return { error: e.message }; } };
const patch = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'PATCH', headers: h(), body: JSON.stringify(body) }); return await r.json(); } catch (e) { return { error: e.message }; } };
const INR = n => 'Rs ' + parseFloat(n||0).toLocaleString('en-IN');

const MODULES = [
  { id: 'charter',   label: 'Corporate Charter',    icon: '🏛️', color: '#1B4FD8', desc: 'MOA, AOA, CIN, PAN, TAN, GST registration documents' },
  { id: 'policies',  label: 'Policy Manuals',        icon: '📖', color: '#7C3AED', desc: 'HR, Finance, IT, Risk and Compliance policy documents' },
  { id: 'kyc',       label: 'AML / KYC Records',     icon: '🔍', color: '#DC2626', desc: 'Customer, vendor and employee KYC verification records' },
  { id: 'filings',   label: 'Regulatory Filings',    icon: '📋', color: '#059669', desc: 'GST, TDS, Income Tax, ROC, PF/ESIC filing tracker' },
];

const FF = ({ label, value, onChange, type='text', options, required, fullWidth, placeholder }) => {
  const s = { width:'100%', boxSizing:'border-box', padding:'8px 12px', borderRadius:8, border:'1px solid #C7D9F8', fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' };
  return (
    <div style={fullWidth ? { gridColumn:'1/-1' } : {}}>
      <label style={{fontSize:12,fontWeight:600,color:'#334155',display:'block',marginBottom:4}}>{label}{required && <span style={{color:'#DC2626'}}> *</span>}</label>
      {type==='select' ? <select value={value||''} onChange={e=>onChange(e.target.value)} style={s}><option value="">Select...</option>{options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}</select> :
       type==='textarea' ? <textarea value={value||''} onChange={e=>onChange(e.target.value)} rows={3} placeholder={placeholder} style={{...s,resize:'vertical'}} /> :
       <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s} />}
    </div>
  );
};

// ── 1. Corporate Charter ──────────────────────────────────────
function CorporateCharter() {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState({ document_type:'moa', document_title:'', document_number:'', issuing_authority:'', issue_date:'', effective_date:'', authorized_capital:'', paid_up_capital:'', main_objects:'', version:'1.0', notes:'' });
  const [showing, setShowing] = useState(false);
  const sf = k => v => setForm(p=>({...p,[k]:v}));
  const load = async () => { const d = await get('/api/docs3/charter'); setDocs(d.documents||[]); };
  useEffect(()=>{load();},[]);
  const save = async () => { const r = await post('/api/docs3/charter', form); if (!r.error) { setShowing(false); load(); } };

  const DOC_TYPES = [
    {v:'moa',l:'Memorandum of Association (MOA)'},
    {v:'aoa',l:'Articles of Association (AOA)'},
    {v:'certificate_of_incorporation',l:'Certificate of Incorporation'},
    {v:'pan',l:'PAN Card'},
    {v:'tan',l:'TAN Certificate'},
    {v:'gstin',l:'GST Registration Certificate'},
    {v:'cin',l:'Company Identification Number (CIN)'},
    {v:'llpin',l:'LLP Identification Number'},
    {v:'partnership_deed',l:'Partnership Deed'},
    {v:'trust_deed',l:'Trust Deed'},
    {v:'shop_establishment',l:'Shop & Establishment Certificate'},
    {v:'trade_license',l:'Trade License'},
    {v:'import_export_code',l:'Import Export Code (IEC)'},
    {v:'msme_registration',l:'MSME/Udyam Registration'},
    {v:'other',l:'Other'},
  ];

  const TYPE_COLORS = { moa:'#1B4FD8', aoa:'#7C3AED', certificate_of_incorporation:'#059669', pan:'#D97706', tan:'#0284C7', gstin:'#DC2626' };

  // Group by type
  const grouped = {};
  docs.forEach(d => { if (!grouped[d.document_type]) grouped[d.document_type] = []; grouped[d.document_type].push(d); });

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[['Total Documents',docs.length,'#1B4FD8'],['Active',docs.filter(d=>d.status==='active').length,'#059669'],['Expiring Soon',docs.filter(d=>d.expiry_date&&new Date(d.expiry_date)<new Date(Date.now()+30*86400000)).length,'#D97706'],['Document Types',Object.keys(grouped).length,'#7C3AED']].map(([l,v,c],i)=>(
          <div key={i} style={{padding:'12px 14px',borderRadius:10,background:'#fff',border:'1px solid #C7D9F8'}}><div style={{fontSize:11,color:'#64748B',fontWeight:600}}>{l}</div><div style={{fontSize:22,fontWeight:800,color:c}}>{v}</div></div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
        <button onClick={()=>setShowing(true)} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#1B4FD8',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Add Document</button>
      </div>
      {showing && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>Add Corporate Charter Document</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FF label="Document Type" value={form.document_type} onChange={sf('document_type')} type="select" options={DOC_TYPES} required />
            <FF label="Document Title" value={form.document_title} onChange={sf('document_title')} required />
            <FF label="Document Number" value={form.document_number} onChange={sf('document_number')} placeholder="CIN/PAN/GSTIN number" />
            <FF label="Issuing Authority" value={form.issuing_authority} onChange={sf('issuing_authority')} />
            <FF label="Issue Date" value={form.issue_date} onChange={sf('issue_date')} type="date" />
            <FF label="Effective Date" value={form.effective_date} onChange={sf('effective_date')} type="date" />
            <FF label="Authorized Capital (Rs)" value={form.authorized_capital} onChange={sf('authorized_capital')} type="number" />
            <FF label="Paid-up Capital (Rs)" value={form.paid_up_capital} onChange={sf('paid_up_capital')} type="number" />
            <FF label="Version" value={form.version} onChange={sf('version')} />
            <FF label="File Name" value={form.file_name} onChange={sf('file_name')} placeholder="e.g. MOA_v1.pdf" />
            <FF label="Main Objects / Purpose" value={form.main_objects} onChange={sf('main_objects')} type="textarea" fullWidth />
            <FF label="Notes" value={form.notes} onChange={sf('notes')} type="textarea" fullWidth />
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button onClick={save} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#1B4FD8',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Save</button>
            <button onClick={()=>setShowing(false)} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E2E8F0',background:'#F8FAFC',color:'#334155',fontSize:13,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}
      {Object.entries(grouped).length === 0 ? (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:60,textAlign:'center',color:'#94A3B8'}}>No corporate documents yet. Add your MOA, AOA, CIN and other registration documents.</div>
      ) : Object.entries(grouped).map(([type, typeDocs]) => (
        <div key={type} style={{marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:TYPE_COLORS[type]||'#64748B',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>{DOC_TYPES.find(t=>t.v===type)?.l||type.replace(/_/g,' ')}</div>
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:'#F0F5FF'}}>{['Title','Number','Issuing Authority','Issue Date','Version','Status'].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#3B5998',fontSize:11}}>{h}</th>)}</tr></thead>
              <tbody>{typeDocs.map((d,i)=>(
                <tr key={d.id} style={{borderTop:'1px solid #F1F5F9',background:i%2===0?'#fff':'#FAFBFF'}}>
                  <td style={{padding:'10px 14px',fontWeight:500}}>{d.document_title}</td>
                  <td style={{padding:'10px 14px',fontFamily:'monospace',fontSize:11,color:'#1B4FD8'}}>{d.document_number||'—'}</td>
                  <td style={{padding:'10px 14px',color:'#64748B'}}>{d.issuing_authority||'—'}</td>
                  <td style={{padding:'10px 14px',color:'#64748B'}}>{d.issue_date?new Date(d.issue_date).toLocaleDateString('en-IN'):'—'}</td>
                  <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,background:'#EEF3FD',color:'#1B4FD8',fontSize:10,fontWeight:700}}>v{d.version}</span></td>
                  <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:d.status==='active'?'#ECFDF5':'#FEF2F2',color:d.status==='active'?'#059669':'#DC2626'}}>{d.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 2. Policy Manuals ─────────────────────────────────────────
function PolicyManuals() {
  const [policies, setPolicies] = useState([]);
  const [summary, setSummary] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [form, setForm] = useState({ policy_name:'', policy_category:'hr', policy_owner:'', approving_authority:'', effective_date:'', next_review_date:'', scope:'', objective:'', policy_content:'', applicability:'all_employees' });
  const [showing, setShowing] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const sf = k => v => setForm(p=>({...p,[k]:v}));
  const load = async () => { const d = await get('/api/docs3/policies'); setPolicies(d.policies||[]); setSummary(d.summary||[]); };
  useEffect(()=>{load();},[]);
  const save = async () => { const r = await post('/api/docs3/policies', form); if (!r.error) { setShowing(false); load(); } };

  const CATS = ['hr','finance','it','operations','risk','compliance','safety','ethics','procurement','legal'];
  const CAT_COLORS = { hr:'#7C3AED', finance:'#1B4FD8', it:'#0284C7', operations:'#D97706', risk:'#DC2626', compliance:'#059669', safety:'#F59E0B', ethics:'#8B5CF6' };

  const filtered = activeCategory === 'all' ? policies : policies.filter(p => p.policy_category === activeCategory);

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
        <button onClick={()=>setActiveCategory('all')} style={{padding:'5px 12px',borderRadius:7,border:'1px solid '+(activeCategory==='all'?'#7C3AED':'#E2E8F0'),background:activeCategory==='all'?'#F5F3FF':'#fff',color:activeCategory==='all'?'#7C3AED':'#64748B',fontSize:12,fontWeight:600,cursor:'pointer'}}>All ({policies.length})</button>
        {summary.map(s=>(
          <button key={s.policy_category} onClick={()=>setActiveCategory(s.policy_category)} style={{padding:'5px 12px',borderRadius:7,border:'1px solid '+(activeCategory===s.policy_category?(CAT_COLORS[s.policy_category]||'#64748B'):'#E2E8F0'),background:activeCategory===s.policy_category?(CAT_COLORS[s.policy_category]||'#64748B')+'15':'#fff',color:activeCategory===s.policy_category?CAT_COLORS[s.policy_category]||'#64748B':'#64748B',fontSize:11,fontWeight:600,cursor:'pointer',textTransform:'capitalize'}}>
            {s.policy_category} ({s.count})
          </button>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
        <button onClick={()=>setShowing(true)} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#7C3AED',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Add Policy</button>
      </div>
      {showing && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>New Policy Manual</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FF label="Policy Name" value={form.policy_name} onChange={sf('policy_name')} required />
            <FF label="Category" value={form.policy_category} onChange={sf('policy_category')} type="select" options={CATS} />
            <FF label="Policy Owner" value={form.policy_owner} onChange={sf('policy_owner')} />
            <FF label="Approving Authority" value={form.approving_authority} onChange={sf('approving_authority')} />
            <FF label="Effective Date" value={form.effective_date} onChange={sf('effective_date')} type="date" />
            <FF label="Next Review Date" value={form.next_review_date} onChange={sf('next_review_date')} type="date" />
            <FF label="Applicability" value={form.applicability} onChange={sf('applicability')} type="select" options={['all_employees','management','specific_departments','board']} />
            <FF label="Scope" value={form.scope} onChange={sf('scope')} type="textarea" />
            <FF label="Objective" value={form.objective} onChange={sf('objective')} type="textarea" />
            <FF label="Policy Content" value={form.policy_content} onChange={sf('policy_content')} type="textarea" fullWidth placeholder="Full policy text..." />
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button onClick={save} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#7C3AED',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Save Policy</button>
            <button onClick={()=>setShowing(false)} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E2E8F0',background:'#F8FAFC',color:'#334155',fontSize:13,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {filtered.length===0?<div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:60,textAlign:'center',color:'#94A3B8'}}>No policies yet. Add your HR, Finance and IT policy documents.</div>:
        filtered.map(p=>(
          <div key={p.id} style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',overflow:'hidden'}}>
            <div onClick={()=>setExpanded(expanded===p.id?null:p.id)} style={{padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{padding:'4px 10px',borderRadius:20,background:(CAT_COLORS[p.policy_category]||'#64748B')+'15',color:CAT_COLORS[p.policy_category]||'#64748B',fontSize:10,fontWeight:700,textTransform:'uppercase'}}>{p.policy_category}</div>
                <div style={{fontWeight:700,color:'#0A1628',fontSize:13}}>{p.policy_name}</div>
                <div style={{fontSize:11,color:'#94A3B8'}}>v{p.version}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:p.status==='active'?'#ECFDF5':'#FFFBEB',color:p.status==='active'?'#059669':'#D97706'}}>{p.status}</span>
                <span style={{fontSize:16,color:'#94A3B8'}}>{expanded===p.id?'▲':'▼'}</span>
              </div>
            </div>
            {expanded===p.id && (
              <div style={{padding:'0 20px 16px',borderTop:'1px solid #F1F5F9'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginTop:12,marginBottom:12}}>
                  <div><div style={{fontSize:11,color:'#64748B'}}>Owner</div><div style={{fontSize:12,fontWeight:600}}>{p.policy_owner||'—'}</div></div>
                  <div><div style={{fontSize:11,color:'#64748B'}}>Effective Date</div><div style={{fontSize:12,fontWeight:600}}>{p.effective_date?new Date(p.effective_date).toLocaleDateString('en-IN'):'—'}</div></div>
                  <div><div style={{fontSize:11,color:'#64748B'}}>Next Review</div><div style={{fontSize:12,fontWeight:600,color:'#D97706'}}>{p.next_review_date?new Date(p.next_review_date).toLocaleDateString('en-IN'):'—'}</div></div>
                </div>
                {p.objective && <div style={{marginBottom:8}}><div style={{fontSize:11,color:'#64748B',fontWeight:600,marginBottom:4}}>OBJECTIVE</div><div style={{fontSize:12,color:'#334155'}}>{p.objective}</div></div>}
                {p.policy_content && <div style={{background:'#F8FAFC',padding:12,borderRadius:8,fontSize:12,color:'#334155',lineHeight:1.6,maxHeight:200,overflow:'auto'}}>{p.policy_content}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 3. AML/KYC Records ───────────────────────────────────────
function AMLKYCRecords() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [form, setForm] = useState({ entity_type:'customer', entity_name:'', pan_number:'', aadhaar_number:'', business_type:'', gstin:'', risk_category:'low', verification_date:'', verified_by:'', next_review_date:'', registered_address:'' });
  const [showing, setShowing] = useState(false);
  const [filter, setFilter] = useState('all');
  const sf = k => v => setForm(p=>({...p,[k]:v}));
  const load = async () => { const d = await get('/api/docs3/kyc'); setRecords(d.records||[]); setStats(d.stats||{}); };
  useEffect(()=>{load();},[]);
  const save = async () => { const r = await post('/api/docs3/kyc', form); if (!r.error) { setShowing(false); load(); } };

  const RISK_COLORS = { low:'#059669', medium:'#D97706', high:'#DC2626' };
  const STATUS_COLORS = { verified:'#059669', pending:'#D97706', rejected:'#DC2626', expired:'#94A3B8', under_review:'#1B4FD8' };
  const filtered = filter === 'all' ? records : records.filter(r => r.entity_type === filter);

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        {[['Total',stats.total,'#1B4FD8'],['Verified',stats.verified,'#059669'],['Pending',stats.pending,'#D97706'],['High Risk',stats.high_risk,'#DC2626'],['SAR Filed',stats.sar_filed,'#7C3AED']].map(([l,v,c],i)=>(
          <div key={i} style={{padding:'10px 12px',borderRadius:10,background:'#fff',border:'1px solid #C7D9F8'}}><div style={{fontSize:10,color:'#64748B',fontWeight:600}}>{l}</div><div style={{fontSize:20,fontWeight:800,color:c}}>{v||0}</div></div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
        {['all','customer','vendor','employee','director','shareholder'].map(t=>(
          <button key={t} onClick={()=>setFilter(t)} style={{padding:'5px 12px',borderRadius:7,border:'1px solid '+(filter===t?'#DC2626':'#E2E8F0'),background:filter===t?'#FEF2F2':'#fff',color:filter===t?'#DC2626':'#64748B',fontSize:11,fontWeight:600,cursor:'pointer',textTransform:'capitalize'}}>{t} ({t==='all'?records.length:records.filter(r=>r.entity_type===t).length})</button>
        ))}
        <button onClick={()=>setShowing(true)} style={{marginLeft:'auto',padding:'9px 20px',borderRadius:8,border:'none',background:'#DC2626',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Add KYC Record</button>
      </div>
      {showing && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>New KYC Record</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FF label="Entity Type" value={form.entity_type} onChange={sf('entity_type')} type="select" options={['customer','vendor','employee','director','shareholder']} />
            <FF label="Entity Name" value={form.entity_name} onChange={sf('entity_name')} required />
            <FF label="PAN Number" value={form.pan_number} onChange={sf('pan_number')} placeholder="ABCDE1234F" />
            <FF label="Aadhaar (last 4 digits)" value={form.aadhaar_number} onChange={sf('aadhaar_number')} placeholder="Will be masked" />
            <FF label="GSTIN" value={form.gstin} onChange={sf('gstin')} />
            <FF label="Business Type" value={form.business_type} onChange={sf('business_type')} />
            <FF label="Risk Category" value={form.risk_category} onChange={sf('risk_category')} type="select" options={['low','medium','high']} />
            <FF label="Verification Date" value={form.verification_date} onChange={sf('verification_date')} type="date" />
            <FF label="Verified By" value={form.verified_by} onChange={sf('verified_by')} />
            <FF label="Next Review Date" value={form.next_review_date} onChange={sf('next_review_date')} type="date" />
            <FF label="Registered Address" value={form.registered_address} onChange={sf('registered_address')} type="textarea" fullWidth />
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button onClick={save} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#DC2626',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Save KYC Record</button>
            <button onClick={()=>setShowing(false)} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E2E8F0',background:'#F8FAFC',color:'#334155',fontSize:13,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#F0F5FF'}}>{['Entity','Type','PAN','GSTIN','Risk','KYC Status','Verified By','Next Review'].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#3B5998',fontSize:11}}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.length===0?<tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#94A3B8'}}>No KYC records yet.</td></tr>:
            filtered.map((r,i)=>(
              <tr key={r.id} style={{borderTop:'1px solid #F1F5F9',background:i%2===0?'#fff':'#FAFBFF'}}>
                <td style={{padding:'10px 14px',fontWeight:500}}>{r.entity_name}</td>
                <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,background:'#EEF3FD',color:'#1B4FD8',fontSize:10,fontWeight:700,textTransform:'capitalize'}}>{r.entity_type}</span></td>
                <td style={{padding:'10px 14px',fontFamily:'monospace',fontSize:11}}>{r.pan_number||'—'}</td>
                <td style={{padding:'10px 14px',fontFamily:'monospace',fontSize:11}}>{r.gstin||'—'}</td>
                <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:(RISK_COLORS[r.risk_category]||'#64748B')+'15',color:RISK_COLORS[r.risk_category]||'#64748B',textTransform:'capitalize'}}>{r.risk_category}</span></td>
                <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:(STATUS_COLORS[r.kyc_status]||'#64748B')+'15',color:STATUS_COLORS[r.kyc_status]||'#64748B'}}>{r.kyc_status}</span></td>
                <td style={{padding:'10px 14px',color:'#64748B'}}>{r.verified_by||'—'}</td>
                <td style={{padding:'10px 14px',color:r.next_review_date&&new Date(r.next_review_date)<new Date()?'#DC2626':'#64748B',fontWeight:r.next_review_date&&new Date(r.next_review_date)<new Date()?700:'normal'}}>{r.next_review_date?new Date(r.next_review_date).toLocaleDateString('en-IN'):'—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 4. Regulatory Filings ─────────────────────────────────────
function RegulatoryFilings() {
  const [filings, setFilings] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [summary, setSummary] = useState([]);
  const [form, setForm] = useState({ filing_type:'gst_return', filing_subtype:'GSTR-3B', regulatory_body:'GST', filing_period:'', due_date:'', prepared_by:'', filing_mode:'online' });
  const [showing, setShowing] = useState(false);
  const [marking, setMarking] = useState(null);
  const [markForm, setMarkForm] = useState({ filing_date:'', acknowledgment_number:'', amount_paid:'', late_fee:'', filed_by:'' });
  const sf = k => v => setForm(p=>({...p,[k]:v}));
  const load = async () => { const d = await get('/api/docs3/filings'); setFilings(d.filings||[]); setUpcoming(d.upcoming||[]); setSummary(d.summary||[]); };
  useEffect(()=>{load();},[]);
  const save = async () => { const r = await post('/api/docs3/filings', form); if (!r.error) { setShowing(false); load(); } };
  const seed = async () => { await post('/api/docs3/filings/seed', { financial_year: '2024-25' }); load(); };
  const markFiled = async () => { await patch('/api/docs3/filings/'+marking, { filing_status:'filed', ...markForm }); setMarking(null); load(); };

  const STATUS_COLORS = { pending:'#D97706', filed:'#059669', late_filed:'#DC2626', not_applicable:'#94A3B8' };
  const BODY_COLORS = { GST:'#1B4FD8', IT_DEPT:'#7C3AED', MCA:'#059669', EPFO:'#D97706', ESIC:'#0284C7', SEBI:'#DC2626' };

  const FILING_TYPES = [
    {v:'gst_return',l:'GST Return'},{v:'tds_return',l:'TDS Return'},{v:'income_tax',l:'Income Tax'},
    {v:'roc_filing',l:'ROC/MCA Filing'},{v:'rbi_report',l:'RBI Report'},{v:'sebi_filing',l:'SEBI Filing'},
    {v:'pf_return',l:'PF Return'},{v:'esic_return',l:'ESIC Return'},{v:'professional_tax',l:'Professional Tax'},{v:'labour_return',l:'Labour Return'},
  ];

  const pendingCount = filings.filter(f=>f.filing_status==='pending').length;
  const overdueCount = filings.filter(f=>f.filing_status==='pending'&&new Date(f.due_date)<new Date()).length;
  const totalPenalties = filings.reduce((s,f)=>s+parseFloat(f.late_fee||0)+parseFloat(f.penalty||0),0);

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[['Total Filings',filings.length,'#1B4FD8'],['Pending',pendingCount,'#D97706'],['Overdue',overdueCount,'#DC2626'],['Total Penalties',INR(totalPenalties),'#DC2626']].map(([l,v,c],i)=>(
          <div key={i} style={{padding:'12px 14px',borderRadius:10,background:'#fff',border:'1px solid #C7D9F8'}}><div style={{fontSize:11,color:'#64748B',fontWeight:600}}>{l}</div><div style={{fontSize:i===3?14:22,fontWeight:800,color:c}}>{v}</div></div>
        ))}
      </div>

      {upcoming.length > 0 && (
        <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:12,padding:16,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:'#D97706',marginBottom:10}}>⚠️ Due in Next 30 Days</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {upcoming.map(u=>{
              const days = Math.ceil((new Date(u.due_date)-Date.now())/86400000);
              return <div key={u.id} style={{padding:'8px 12px',borderRadius:8,background:'#fff',border:'1px solid #FDE68A',fontSize:12}}>
                <span style={{fontWeight:700,color:'#D97706'}}>{u.filing_subtype||u.filing_type}</span>
                <span style={{color:'#64748B',marginLeft:6}}>{u.filing_period}</span>
                <span style={{marginLeft:8,padding:'2px 6px',borderRadius:4,background:days<=7?'#FEF2F2':'#FFFBEB',color:days<=7?'#DC2626':'#D97706',fontSize:10,fontWeight:700}}>{days}d left</span>
              </div>;
            })}
          </div>
        </div>
      )}

      {marking && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>Mark as Filed</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FF label="Filing Date" value={markForm.filing_date} onChange={v=>setMarkForm(p=>({...p,filing_date:v}))} type="date" required />
            <FF label="Acknowledgment Number" value={markForm.acknowledgment_number} onChange={v=>setMarkForm(p=>({...p,acknowledgment_number:v}))} />
            <FF label="Amount Paid (Rs)" value={markForm.amount_paid} onChange={v=>setMarkForm(p=>({...p,amount_paid:v}))} type="number" />
            <FF label="Late Fee (Rs)" value={markForm.late_fee} onChange={v=>setMarkForm(p=>({...p,late_fee:v}))} type="number" />
            <FF label="Filed By" value={markForm.filed_by} onChange={v=>setMarkForm(p=>({...p,filed_by:v}))} />
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button onClick={markFiled} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#059669',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Confirm Filed</button>
            <button onClick={()=>setMarking(null)} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E2E8F0',background:'#F8FAFC',color:'#334155',fontSize:13,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginBottom:14}}>
        <button onClick={seed} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #C7D9F8',background:'#F0F5FF',color:'#1B4FD8',fontSize:13,fontWeight:600,cursor:'pointer'}}>🌱 Seed Standard Filings</button>
        <button onClick={()=>setShowing(true)} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#059669',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Add Filing</button>
      </div>

      {showing && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>New Regulatory Filing</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FF label="Filing Type" value={form.filing_type} onChange={sf('filing_type')} type="select" options={FILING_TYPES} />
            <FF label="Filing Subtype" value={form.filing_subtype} onChange={sf('filing_subtype')} placeholder="GSTR-3B, Form 24Q, MGT-7..." />
            <FF label="Regulatory Body" value={form.regulatory_body} onChange={sf('regulatory_body')} type="select" options={['GST','IT_DEPT','MCA','EPFO','ESIC','SEBI','RBI','STATE_GOVT']} />
            <FF label="Filing Period" value={form.filing_period} onChange={sf('filing_period')} placeholder="April 2024, Q1 FY2024-25" />
            <FF label="Due Date" value={form.due_date} onChange={sf('due_date')} type="date" required />
            <FF label="Prepared By" value={form.prepared_by} onChange={sf('prepared_by')} />
            <FF label="Filing Mode" value={form.filing_mode} onChange={sf('filing_mode')} type="select" options={['online','offline','through_ca']} />
            <FF label="Reviewed By" value={form.reviewed_by} onChange={sf('reviewed_by')} />
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button onClick={save} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#059669',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Save Filing</button>
            <button onClick={()=>setShowing(false)} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E2E8F0',background:'#F8FAFC',color:'#334155',fontSize:13,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#F0F5FF'}}>{['Filing','Subtype','Body','Period','Due Date','Status','Amount Paid','Action'].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#3B5998',fontSize:11}}>{h}</th>)}</tr></thead>
          <tbody>
            {filings.length===0?<tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#94A3B8'}}>No filings yet. Click "Seed Standard Filings" to add common filings.</td></tr>:
            filings.map((f,i)=>{
              const isOverdue = f.filing_status==='pending' && new Date(f.due_date)<new Date();
              return (
                <tr key={f.id} style={{borderTop:'1px solid #F1F5F9',background:isOverdue?'#FFF5F5':i%2===0?'#fff':'#FAFBFF'}}>
                  <td style={{padding:'10px 14px',color:'#64748B',fontSize:11,textTransform:'capitalize'}}>{f.filing_type?.replace(/_/g,' ')}</td>
                  <td style={{padding:'10px 14px',fontWeight:600}}>{f.filing_subtype||'—'}</td>
                  <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,background:(BODY_COLORS[f.regulatory_body]||'#64748B')+'15',color:BODY_COLORS[f.regulatory_body]||'#64748B',fontSize:10,fontWeight:700}}>{f.regulatory_body}</span></td>
                  <td style={{padding:'10px 14px',color:'#64748B'}}>{f.filing_period||'—'}</td>
                  <td style={{padding:'10px 14px',color:isOverdue?'#DC2626':'#64748B',fontWeight:isOverdue?700:'normal'}}>{new Date(f.due_date).toLocaleDateString('en-IN')}{isOverdue&&<span style={{marginLeft:4,fontSize:10,color:'#DC2626'}}>OVERDUE</span>}</td>
                  <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:(STATUS_COLORS[f.filing_status]||'#64748B')+'15',color:STATUS_COLORS[f.filing_status]||'#64748B'}}>{f.filing_status?.replace(/_/g,' ')}</span></td>
                  <td style={{padding:'10px 14px',color:'#059669',fontWeight:600}}>{f.amount_paid>0?INR(f.amount_paid):'—'}</td>
                  <td style={{padding:'10px 14px'}}>
                    {f.filing_status==='pending' && <button onClick={()=>{setMarking(f.id);setMarkForm({filing_date:new Date().toISOString().split('T')[0],acknowledgment_number:'',amount_paid:'',late_fee:isOverdue?'200':'',filed_by:''});}} style={{padding:'4px 10px',borderRadius:6,border:'none',background:'#059669',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>Mark Filed</button>}
                    {f.filing_status==='filed' && <span style={{color:'#059669',fontSize:11}}>✓ {f.acknowledgment_number||'Filed'}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function Batch3DocsPage() {
  const [active, setActive] = useState('charter');
  const renderModule = () => {
    switch (active) {
      case 'charter':  return <CorporateCharter />;
      case 'policies': return <PolicyManuals />;
      case 'kyc':      return <AMLKYCRecords />;
      case 'filings':  return <RegulatoryFilings />;
      default: return null;
    }
  };
  return (
    <div style={{padding:24,background:'#EEF3FD',minHeight:'100%'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:20,fontWeight:800,color:'#0A1628',marginBottom:4}}>Governance & Regulatory Documents</h1>
        <div style={{fontSize:13,color:'#64748B'}}>Corporate charter, policy manuals, AML/KYC records and regulatory filing tracker.</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:24}}>
        {MODULES.map(m=>(
          <button key={m.id} onClick={()=>setActive(m.id)}
            style={{padding:'16px 12px',borderRadius:12,border:`2px solid ${active===m.id?m.color:'#E2E8F0'}`,background:active===m.id?m.color+'10':'#fff',cursor:'pointer',textAlign:'center',transition:'all 0.15s'}}>
            <div style={{fontSize:24,marginBottom:6}}>{m.icon}</div>
            <div style={{fontSize:12,fontWeight:700,color:active===m.id?m.color:'#334155',lineHeight:1.3,marginBottom:4}}>{m.label}</div>
            <div style={{fontSize:10,color:'#94A3B8',lineHeight:1.3}}>{m.desc}</div>
          </button>
        ))}
      </div>
      <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:14,marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:36,height:36,borderRadius:9,background:MODULES.find(m=>m.id===active)?.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{MODULES.find(m=>m.id===active)?.icon}</div>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:'#0A1628'}}>{MODULES.find(m=>m.id===active)?.label}</div>
          <div style={{fontSize:11,color:'#64748B'}}>{MODULES.find(m=>m.id===active)?.desc}</div>
        </div>
      </div>
      {renderModule()}
    </div>
  );
}
