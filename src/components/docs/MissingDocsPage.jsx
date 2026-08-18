import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); return await r.json(); } catch { return {}; } };
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); return await r.json(); } catch (e) { return { error: e.message }; } };
const patch = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'PATCH', headers: h(), body: JSON.stringify(body) }); return await r.json(); } catch (e) { return { error: e.message }; } };
const del = async url => { try { const r = await fetch(apiURL(url), { method: 'DELETE', headers: h() }); return await r.json(); } catch { return {}; } };
const INR = n => 'Rs ' + parseFloat(n||0).toLocaleString('en-IN', {minimumFractionDigits:0,maximumFractionDigits:0});

const MODULES = [
  { id: 'vault',      label: 'Document Vault',          icon: '🗄️',  color: '#1B4FD8', desc: 'Bills, receipts, vouchers, source documents' },
  { id: 'loans',      label: 'Loan Agreements',          icon: '🏦',  color: '#059669', desc: 'Borrowing terms, EMI schedule, repayments' },
  { id: 'gratuity',   label: 'Gratuity Records',         icon: '👤',  color: '#7C3AED', desc: 'End-of-service benefit calculations' },
  { id: 'risks',      label: 'Risk Assessment',          icon: '⚠️',  color: '#DC2626', desc: 'Enterprise risk register with heat map' },
  { id: 'cost',       label: 'Cost Sheets',              icon: '📊',  color: '#D97706', desc: 'Product/service costing and margin analysis' },
  { id: 'contingent', label: 'Contingent Liabilities',   icon: '⚖️',  color: '#DC2626', desc: 'Legal cases, guarantees, potential obligations' },
  { id: 'agm',        label: 'AGM Minutes',              icon: '🏛️',  color: '#0284C7', desc: 'Annual/Extra-ordinary General Meeting records' },
  { id: 'board',      label: 'Board Meetings',           icon: '👔',  color: '#1B4FD8', desc: 'Board meeting agenda, decisions, action items' },
  { id: 'shareholders', label: 'Shareholder Register',   icon: '📋',  color: '#059669', desc: 'Share ownership, transfers, holdings' },
  { id: 'workingcap', label: 'Working Capital',          icon: '💹',  color: '#7C3AED', desc: 'Liquidity analysis and financial health ratios' },
];

// ── Sub-components for each module ──────────────────────────

function DocumentVault() {
  const [docs, setDocs] = useState([]);
  const [stats, setStats] = useState([]);
  const [form, setForm] = useState({ title:'', document_type:'bill', vendor_name:'', amount:'', document_date:'', reference_number:'' });
  const [showing, setShowing] = useState(false);
  const load = async () => { const d = await get('/api/docs/vault'); setDocs(d.documents||[]); setStats(d.stats||[]); };
  useEffect(() => { load(); }, []);
  const save = async () => { await post('/api/docs/vault', form); setShowing(false); setForm({ title:'', document_type:'bill', vendor_name:'', amount:'', document_date:'', reference_number:'' }); load(); };

  const DOC_TYPES = ['bill','receipt','voucher','invoice','contract','bank_statement','other'];
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {stats.slice(0,4).map((s,i) => (
          <div key={i} style={{padding:'12px 14px',borderRadius:10,background:'#fff',border:'1px solid #C7D9F8'}}>
            <div style={{fontSize:11,color:'#64748B',fontWeight:600,textTransform:'capitalize'}}>{s.document_type}</div>
            <div style={{fontSize:18,fontWeight:800,color:'#1B4FD8'}}>{s.count} docs</div>
            <div style={{fontSize:11,color:'#64748B'}}>{INR(s.total)}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
        <button onClick={() => setShowing(true)} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#1B4FD8',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Add Document</button>
      </div>
      {showing && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:'#0A1628',marginBottom:14}}>Add Source Document</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[['title','Title *'],['vendor_name','Vendor Name'],['reference_number','Ref/Invoice No'],['amount','Amount (Rs)'],['document_date','Document Date']].map(([key,label]) => (
              <div key={key}>
                <label style={{fontSize:12,fontWeight:600,color:'#334155',display:'block',marginBottom:4}}>{label}</label>
                <input type={key==='amount'?'number':key==='document_date'?'date':'text'} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={{width:'100%',boxSizing:'border-box',padding:'8px 12px',borderRadius:8,border:'1px solid #C7D9F8',fontSize:13,outline:'none'}} />
              </div>
            ))}
            <div>
              <label style={{fontSize:12,fontWeight:600,color:'#334155',display:'block',marginBottom:4}}>Document Type</label>
              <select value={form.document_type} onChange={e=>setForm(p=>({...p,document_type:e.target.value}))} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #C7D9F8',fontSize:13,outline:'none',background:'#fff'}}>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ').toUpperCase()}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button onClick={save} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#1B4FD8',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Save</button>
            <button onClick={() => setShowing(false)} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E2E8F0',background:'#F8FAFC',color:'#334155',fontSize:13,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#F0F5FF'}}>
            {['Title','Type','Vendor','Amount','Date','Ref','Status'].map(h => <th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#3B5998',fontSize:11}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {docs.length===0 ? <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#94A3B8'}}>No documents yet. Add your first source document.</td></tr> :
            docs.map((d,i) => (
              <tr key={d.id} style={{borderTop:'1px solid #F1F5F9',background:i%2===0?'#fff':'#FAFBFF'}}>
                <td style={{padding:'10px 14px',fontWeight:500,color:'#0A1628'}}>{d.title}</td>
                <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,background:'#EEF3FD',color:'#1B4FD8',fontSize:10,fontWeight:700}}>{d.document_type}</span></td>
                <td style={{padding:'10px 14px',color:'#64748B'}}>{d.vendor_name||'—'}</td>
                <td style={{padding:'10px 14px',color:'#059669',fontWeight:600}}>{d.amount?INR(d.amount):'—'}</td>
                <td style={{padding:'10px 14px',color:'#64748B'}}>{d.document_date?new Date(d.document_date).toLocaleDateString('en-IN'):'—'}</td>
                <td style={{padding:'10px 14px',color:'#64748B',fontFamily:'monospace',fontSize:11}}>{d.reference_number||'—'}</td>
                <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:d.status==='verified'?'#ECFDF5':'#FFFBEB',color:d.status==='verified'?'#059669':'#D97706'}}>{d.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LoanAgreements() {
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState({});
  const [form, setForm] = useState({ lender_name:'', lender_type:'bank', loan_type:'term', principal_amount:'', interest_rate:'', tenure_months:'', emi_amount:'', disbursement_date:'', purpose:'' });
  const [showing, setShowing] = useState(false);
  const load = async () => { const d = await get('/api/docs/loans'); setLoans(d.loans||[]); setSummary(d.summary||{}); };
  useEffect(() => { load(); }, []);
  const save = async () => { await post('/api/docs/loans', form); setShowing(false); load(); };

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
        <div style={{padding:'14px 16px',borderRadius:10,background:'#fff',border:'1px solid #C7D9F8'}}><div style={{fontSize:11,color:'#64748B',fontWeight:600}}>ACTIVE LOANS</div><div style={{fontSize:22,fontWeight:800,color:'#1B4FD8'}}>{summary.total||0}</div></div>
        <div style={{padding:'14px 16px',borderRadius:10,background:'#fff',border:'1px solid #C7D9F8'}}><div style={{fontSize:11,color:'#64748B',fontWeight:600}}>TOTAL BORROWED</div><div style={{fontSize:22,fontWeight:800,color:'#059669'}}>{INR(summary.total_borrowed)}</div></div>
        <div style={{padding:'14px 16px',borderRadius:10,background:'#fff',border:'1px solid #C7D9F8'}}><div style={{fontSize:11,color:'#64748B',fontWeight:600}}>OUTSTANDING</div><div style={{fontSize:22,fontWeight:800,color:'#DC2626'}}>{INR(summary.total_outstanding)}</div></div>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
        <button onClick={() => setShowing(true)} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#059669',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Add Loan</button>
      </div>
      {showing && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:'#0A1628',marginBottom:14}}>New Loan Agreement</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[['lender_name','Lender Name *','text'],['principal_amount','Principal Amount *','number'],['interest_rate','Interest Rate (%)','number'],['tenure_months','Tenure (Months)','number'],['emi_amount','EMI Amount','number'],['disbursement_date','Disbursement Date','date'],['purpose','Purpose','text']].map(([key,label,type]) => (
              <div key={key}>
                <label style={{fontSize:12,fontWeight:600,color:'#334155',display:'block',marginBottom:4}}>{label}</label>
                <input type={type} value={form[key]||''} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={{width:'100%',boxSizing:'border-box',padding:'8px 12px',borderRadius:8,border:'1px solid #C7D9F8',fontSize:13,outline:'none'}} />
              </div>
            ))}
            <div>
              <label style={{fontSize:12,fontWeight:600,color:'#334155',display:'block',marginBottom:4}}>Lender Type</label>
              <select value={form.lender_type} onChange={e=>setForm(p=>({...p,lender_type:e.target.value}))} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #C7D9F8',fontSize:13,outline:'none',background:'#fff'}}>
                {['bank','nbfc','director','other'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button onClick={save} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#059669',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Save Loan</button>
            <button onClick={() => setShowing(false)} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E2E8F0',background:'#F8FAFC',color:'#334155',fontSize:13,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#F0F5FF'}}>
            {['Loan No','Lender','Type','Principal','Interest Rate','EMI','Outstanding','Status'].map(h => <th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#3B5998',fontSize:11}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {loans.length===0 ? <tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#94A3B8'}}>No loan agreements yet.</td></tr> :
            loans.map((l,i) => (
              <tr key={l.id} style={{borderTop:'1px solid #F1F5F9',background:i%2===0?'#fff':'#FAFBFF'}}>
                <td style={{padding:'10px 14px',fontFamily:'monospace',fontSize:11}}>{l.loan_number}</td>
                <td style={{padding:'10px 14px',fontWeight:500}}>{l.lender_name}</td>
                <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,background:'#EEF3FD',color:'#1B4FD8',fontSize:10,fontWeight:700}}>{l.loan_type}</span></td>
                <td style={{padding:'10px 14px',color:'#059669',fontWeight:600}}>{INR(l.principal_amount)}</td>
                <td style={{padding:'10px 14px',color:'#64748B'}}>{l.interest_rate}%</td>
                <td style={{padding:'10px 14px',color:'#1B4FD8'}}>{INR(l.emi_amount)}</td>
                <td style={{padding:'10px 14px',color:'#DC2626',fontWeight:600}}>{INR(l.outstanding_balance)}</td>
                <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:l.status==='active'?'#ECFDF5':'#FEF2F2',color:l.status==='active'?'#059669':'#DC2626'}}>{l.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RiskAssessment() {
  const [risks, setRisks] = useState([]);
  const [form, setForm] = useState({ title:'', risk_category:'financial', risk_description:'', likelihood:3, impact:3, mitigation_plan:'', owner:'', review_date:'' });
  const [showing, setShowing] = useState(false);
  const load = async () => { const d = await get('/api/docs/risks'); setRisks(d.risks||[]); };
  useEffect(() => { load(); }, []);
  const save = async () => { await post('/api/docs/risks', form); setShowing(false); load(); };

  const LEVEL_COLORS = { critical:'#DC2626', high:'#D97706', medium:'#F59E0B', low:'#059669' };
  const CATS = ['financial','operational','compliance','strategic','reputational','technology','legal'];

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {['critical','high','medium','low'].map(level => {
          const count = risks.filter(r => r.risk_level===level && r.status==='open').length;
          return <div key={level} style={{padding:'12px 14px',borderRadius:10,background:'#fff',border:`2px solid ${LEVEL_COLORS[level]}30`}}><div style={{fontSize:10,color:LEVEL_COLORS[level],fontWeight:700,textTransform:'uppercase'}}>{level} Risk</div><div style={{fontSize:22,fontWeight:800,color:LEVEL_COLORS[level]}}>{count}</div></div>;
        })}
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
        <button onClick={() => setShowing(true)} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#DC2626',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Add Risk</button>
      </div>
      {showing && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:'#0A1628',marginBottom:14}}>New Risk Assessment</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label style={{fontSize:12,fontWeight:600,color:'#334155',display:'block',marginBottom:4}}>Risk Title *</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} style={{width:'100%',boxSizing:'border-box',padding:'8px 12px',borderRadius:8,border:'1px solid #C7D9F8',fontSize:13,outline:'none'}} /></div>
            <div><label style={{fontSize:12,fontWeight:600,color:'#334155',display:'block',marginBottom:4}}>Category</label><select value={form.risk_category} onChange={e=>setForm(p=>({...p,risk_category:e.target.value}))} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #C7D9F8',fontSize:13,outline:'none',background:'#fff'}}>{CATS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label style={{fontSize:12,fontWeight:600,color:'#334155',display:'block',marginBottom:4}}>Likelihood (1-5): {form.likelihood}</label><input type="range" min={1} max={5} value={form.likelihood} onChange={e=>setForm(p=>({...p,likelihood:parseInt(e.target.value)}))} style={{width:'100%'}} /></div>
            <div><label style={{fontSize:12,fontWeight:600,color:'#334155',display:'block',marginBottom:4}}>Impact (1-5): {form.impact}</label><input type="range" min={1} max={5} value={form.impact} onChange={e=>setForm(p=>({...p,impact:parseInt(e.target.value)}))} style={{width:'100%'}} /></div>
            <div><label style={{fontSize:12,fontWeight:600,color:'#334155',display:'block',marginBottom:4}}>Risk Score</label><div style={{padding:'8px 12px',borderRadius:8,background:LEVEL_COLORS[form.likelihood*form.impact>=20?'critical':form.likelihood*form.impact>=12?'high':form.likelihood*form.impact>=6?'medium':'low']+'15',fontSize:18,fontWeight:800,color:LEVEL_COLORS[form.likelihood*form.impact>=20?'critical':form.likelihood*form.impact>=12?'high':form.likelihood*form.impact>=6?'medium':'low']}}>{form.likelihood * form.impact} / 25</div></div>
            <div><label style={{fontSize:12,fontWeight:600,color:'#334155',display:'block',marginBottom:4}}>Owner</label><input value={form.owner} onChange={e=>setForm(p=>({...p,owner:e.target.value}))} style={{width:'100%',boxSizing:'border-box',padding:'8px 12px',borderRadius:8,border:'1px solid #C7D9F8',fontSize:13,outline:'none'}} /></div>
            <div style={{gridColumn:'1/-1'}}><label style={{fontSize:12,fontWeight:600,color:'#334155',display:'block',marginBottom:4}}>Risk Description</label><textarea value={form.risk_description} onChange={e=>setForm(p=>({...p,risk_description:e.target.value}))} rows={2} style={{width:'100%',boxSizing:'border-box',padding:'8px 12px',borderRadius:8,border:'1px solid #C7D9F8',fontSize:13,outline:'none',resize:'vertical',fontFamily:'inherit'}} /></div>
            <div style={{gridColumn:'1/-1'}}><label style={{fontSize:12,fontWeight:600,color:'#334155',display:'block',marginBottom:4}}>Mitigation Plan</label><textarea value={form.mitigation_plan} onChange={e=>setForm(p=>({...p,mitigation_plan:e.target.value}))} rows={2} style={{width:'100%',boxSizing:'border-box',padding:'8px 12px',borderRadius:8,border:'1px solid #C7D9F8',fontSize:13,outline:'none',resize:'vertical',fontFamily:'inherit'}} /></div>
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button onClick={save} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#DC2626',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Save Risk</button>
            <button onClick={() => setShowing(false)} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E2E8F0',background:'#F8FAFC',color:'#334155',fontSize:13,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#F0F5FF'}}>{['Risk','Category','L','I','Score','Level','Owner','Status'].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#3B5998',fontSize:11}}>{h}</th>)}</tr></thead>
          <tbody>
            {risks.length===0 ? <tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#94A3B8'}}>No risks assessed yet.</td></tr> :
            risks.map((r,i) => (
              <tr key={r.id} style={{borderTop:'1px solid #F1F5F9',background:i%2===0?'#fff':'#FAFBFF'}}>
                <td style={{padding:'10px 14px',fontWeight:500,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.title}</td>
                <td style={{padding:'10px 14px',color:'#64748B',textTransform:'capitalize'}}>{r.risk_category}</td>
                <td style={{padding:'10px 14px',textAlign:'center',fontWeight:700}}>{r.likelihood}</td>
                <td style={{padding:'10px 14px',textAlign:'center',fontWeight:700}}>{r.impact}</td>
                <td style={{padding:'10px 14px',textAlign:'center',fontWeight:800,color:LEVEL_COLORS[r.risk_level]}}>{r.risk_score}</td>
                <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:LEVEL_COLORS[r.risk_level]+'15',color:LEVEL_COLORS[r.risk_level]}}>{r.risk_level}</span></td>
                <td style={{padding:'10px 14px',color:'#64748B'}}>{r.owner||'—'}</td>
                <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:r.status==='open'?'#FEF2F2':'#ECFDF5',color:r.status==='open'?'#DC2626':'#059669'}}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkingCapital() {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const load = async () => { const d = await get('/api/docs/working-capital'); setData(d); };
  useEffect(() => { load(); }, []);
  const saveSnapshot = async () => { setSaving(true); await post('/api/docs/working-capital/snapshot', {}); setSaving(false); load(); };

  if (!data) return <div style={{textAlign:'center',padding:40,color:'#94A3B8'}}>Loading...</div>;
  const c = data.current || {};
  const ca = c.currentAssets || {};
  const cl = c.currentLiabilities || {};
  const ratioColor = (val) => parseFloat(val) >= 2 ? '#059669' : parseFloat(val) >= 1 ? '#D97706' : '#DC2626';

  return (
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button onClick={saveSnapshot} disabled={saving} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#7C3AED',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>{saving?'Saving...':'📸 Save Snapshot'}</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:20}}>
        <div style={{padding:'16px',borderRadius:10,background:'#ECFDF5',border:'1px solid #A7F3D0',textAlign:'center'}}><div style={{fontSize:11,color:'#059669',fontWeight:700}}>CURRENT RATIO</div><div style={{fontSize:28,fontWeight:800,color:ratioColor(c.currentRatio)}}>{c.currentRatio||'—'}</div><div style={{fontSize:11,color:'#64748B'}}>Target: 2.0+</div></div>
        <div style={{padding:'16px',borderRadius:10,background:'#EEF3FD',border:'1px solid #C7D9F8',textAlign:'center'}}><div style={{fontSize:11,color:'#1B4FD8',fontWeight:700}}>QUICK RATIO</div><div style={{fontSize:28,fontWeight:800,color:ratioColor(c.quickRatio)}}>{c.quickRatio||'—'}</div><div style={{fontSize:11,color:'#64748B'}}>Target: 1.0+</div></div>
        <div style={{padding:'16px',borderRadius:10,background:parseFloat(c.nwc)>=0?'#ECFDF5':'#FEF2F2',border:`1px solid ${parseFloat(c.nwc)>=0?'#A7F3D0':'#FECACA'}`,textAlign:'center'}}><div style={{fontSize:11,color:parseFloat(c.nwc)>=0?'#059669':'#DC2626',fontWeight:700}}>NET WORKING CAPITAL</div><div style={{fontSize:22,fontWeight:800,color:parseFloat(c.nwc)>=0?'#059669':'#DC2626'}}>{INR(c.nwc)}</div></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:'#059669',marginBottom:14}}>Current Assets — {INR(c.totalCA)}</div>
          {Object.entries(ca).map(([key,val]) => (
            <div key={key} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F8FAFC'}}>
              <span style={{fontSize:12,color:'#334155',textTransform:'capitalize'}}>{key.replace(/_/g,' ')}</span>
              <span style={{fontSize:12,fontWeight:600,color:'#059669'}}>{INR(val)}</span>
            </div>
          ))}
        </div>
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:'#DC2626',marginBottom:14}}>Current Liabilities — {INR(c.totalCL)}</div>
          {Object.entries(cl).map(([key,val]) => (
            <div key={key} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F8FAFC'}}>
              <span style={{fontSize:12,color:'#334155',textTransform:'capitalize'}}>{key.replace(/_/g,' ')}</span>
              <span style={{fontSize:12,fontWeight:600,color:'#DC2626'}}>{INR(val)}</span>
            </div>
          ))}
        </div>
      </div>
      {data.history?.length > 0 && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginTop:16}}>
          <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:12}}>Historical Snapshots</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead><tr style={{background:'#F0F5FF'}}>{['Date','Total CA','Total CL','NWC','Current Ratio','Quick Ratio'].map(h=><th key={h} style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'#3B5998',fontSize:11}}>{h}</th>)}</tr></thead>
            <tbody>{data.history.map((s,i) => <tr key={s.id} style={{borderTop:'1px solid #F1F5F9'}}><td style={{padding:'8px 12px'}}>{new Date(s.snapshot_date).toLocaleDateString('en-IN')}</td><td style={{padding:'8px 12px',color:'#059669'}}>{INR(s.total_current_assets)}</td><td style={{padding:'8px 12px',color:'#DC2626'}}>{INR(s.total_current_liabilities)}</td><td style={{padding:'8px 12px',fontWeight:700,color:parseFloat(s.net_working_capital)>=0?'#059669':'#DC2626'}}>{INR(s.net_working_capital)}</td><td style={{padding:'8px 12px'}}>{s.current_ratio}</td><td style={{padding:'8px 12px'}}>{s.quick_ratio}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Simple table components for remaining modules ─────────────
function SimpleModule({ endpoint, title, fields, addFields, color }) {
  const [data, setData] = useState([]);
  const [form, setForm] = useState({});
  const [showing, setShowing] = useState(false);
  const load = async () => { const d = await get(endpoint); setData(d[Object.keys(d).find(k=>Array.isArray(d[k]))]||[]); };
  useEffect(() => { load(); }, []);
  const save = async () => { await post(endpoint, form); setShowing(false); setForm({}); load(); };

  return (
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
        <button onClick={() => setShowing(true)} style={{padding:'9px 20px',borderRadius:8,border:'none',background:color,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Add {title}</button>
      </div>
      {showing && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:'#0A1628',marginBottom:14}}>New {title}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {addFields.map(([key,label,type,opts]) => (
              <div key={key} style={key.includes('notes')||key.includes('description')||key.includes('plan')||key.includes('text')?{gridColumn:'1/-1'}:{}}>
                <label style={{fontSize:12,fontWeight:600,color:'#334155',display:'block',marginBottom:4}}>{label}</label>
                {type==='select' ? <select value={form[key]||''} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #C7D9F8',fontSize:13,outline:'none',background:'#fff'}}>{opts.map(o=><option key={o}>{o}</option>)}</select> :
                 type==='textarea' ? <textarea value={form[key]||''} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} rows={2} style={{width:'100%',boxSizing:'border-box',padding:'8px 12px',borderRadius:8,border:'1px solid #C7D9F8',fontSize:13,outline:'none',resize:'vertical',fontFamily:'inherit'}} /> :
                 <input type={type||'text'} value={form[key]||''} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))} style={{width:'100%',boxSizing:'border-box',padding:'8px 12px',borderRadius:8,border:'1px solid #C7D9F8',fontSize:13,outline:'none'}} />}
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button onClick={save} style={{padding:'9px 20px',borderRadius:8,border:'none',background:color,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Save</button>
            <button onClick={() => setShowing(false)} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E2E8F0',background:'#F8FAFC',color:'#334155',fontSize:13,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#F0F5FF'}}>{fields.map(f=><th key={f[0]} style={{padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#3B5998',fontSize:11}}>{f[1]}</th>)}</tr></thead>
          <tbody>
            {data.length===0 ? <tr><td colSpan={fields.length} style={{padding:40,textAlign:'center',color:'#94A3B8'}}>No {title.toLowerCase()} records yet.</td></tr> :
            data.map((row,i) => (
              <tr key={row.id||i} style={{borderTop:'1px solid #F1F5F9',background:i%2===0?'#fff':'#FAFBFF'}}>
                {fields.map(([key,label,fmt]) => (
                  <td key={key} style={{padding:'10px 14px',color:'#334155'}}>
                    {fmt==='money' ? <span style={{fontWeight:600,color:'#1B4FD8'}}>{INR(row[key])}</span> :
                     fmt==='date' ? (row[key]?new Date(row[key]).toLocaleDateString('en-IN'):'—') :
                     fmt==='badge' ? <span style={{padding:'2px 8px',borderRadius:6,background:'#EEF3FD',color:'#1B4FD8',fontSize:10,fontWeight:700}}>{row[key]||'—'}</span> :
                     (row[key]||'—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────
export default function MissingDocsPage() {
  const [activeModule, setActiveModule] = useState('vault');

  const renderModule = () => {
    switch (activeModule) {
      case 'vault': return <DocumentVault />;
      case 'loans': return <LoanAgreements />;
      case 'gratuity': return <SimpleModule endpoint="/api/docs/gratuity" title="Gratuity Record" color="#7C3AED"
        fields={[['employee_name','Employee'],['date_of_joining','Join Date','date'],['date_of_leaving','Leaving Date','date'],['years_of_service','Years'],['last_drawn_salary','Last Salary','money'],['gratuity_amount','Gratuity','money'],['status','Status','badge']]}
        addFields={[['employee_name','Employee Name *'],['date_of_joining','Date of Joining','date'],['date_of_leaving','Date of Leaving','date'],['last_drawn_salary','Last Drawn Salary (Rs)','number'],['remarks','Remarks','textarea']]} />;
      case 'risks': return <RiskAssessment />;
      case 'cost': return <SimpleModule endpoint="/api/docs/cost-sheets" title="Cost Sheet" color="#D97706"
        fields={[['title','Title'],['product_service','Product/Service'],['total_cost','Total Cost','money'],['selling_price','Selling Price','money'],['profit_margin','Margin %'],['cost_per_unit','Cost/Unit','money']]}
        addFields={[['title','Title *'],['product_service','Product/Service'],['period','Period'],['direct_material','Direct Material (Rs)','number'],['direct_labour','Direct Labour (Rs)','number'],['manufacturing_overhead','Mfg Overhead (Rs)','number'],['admin_overhead','Admin Overhead (Rs)','number'],['selling_overhead','Selling Overhead (Rs)','number'],['selling_price','Selling Price (Rs)','number'],['units_produced','Units Produced','number'],['notes','Notes','textarea']]} />;
      case 'contingent': return <SimpleModule endpoint="/api/docs/contingent-liabilities" title="Contingent Liability" color="#DC2626"
        fields={[['title','Title'],['liability_type','Type','badge'],['estimated_amount','Est. Amount','money'],['probability','Probability','badge'],['opposing_party','Opposing Party'],['status','Status','badge']]}
        addFields={[['title','Case/Liability Title *'],['liability_type','Type','select',['legal','guarantee','tax','contractual','other']],['estimated_amount','Estimated Amount (Rs)','number'],['probability','Probability','select',['probable','possible','remote']],['opposing_party','Opposing Party'],['legal_case_number','Case Number'],['court_jurisdiction','Court/Jurisdiction'],['legal_counsel','Legal Counsel'],['expected_resolution_date','Expected Resolution','date'],['description','Description','textarea'],['notes','Notes','textarea']]} />;
      case 'agm': return <SimpleModule endpoint="/api/docs/agm" title="AGM/EGM Record" color="#0284C7"
        fields={[['meeting_type','Type','badge'],['meeting_date','Date','date'],['chairman','Chairman'],['venue','Venue'],['status','Status','badge']]}
        addFields={[['meeting_type','Meeting Type','select',['AGM','EGM','Class Meeting']],['meeting_date','Meeting Date','date'],['venue','Venue'],['chairman','Chairman'],['company_secretary','Company Secretary'],['next_meeting_date','Next Meeting Date','date'],['notes','Notes/Agenda','textarea']]} />;
      case 'board': return <SimpleModule endpoint="/api/docs/board-meetings" title="Board Meeting" color="#1B4FD8"
        fields={[['meeting_number','Meeting No'],['meeting_date','Date','date'],['chairman','Chairman'],['mode','Mode','badge'],['status','Status','badge']]}
        addFields={[['meeting_date','Meeting Date *','date'],['venue','Venue'],['mode','Mode','select',['physical','virtual','hybrid']],['chairman','Chairman'],['minutes_text','Meeting Minutes/Notes','textarea']]} />;
      case 'shareholders': return <SimpleModule endpoint="/api/docs/shareholders" title="Shareholder" color="#059669"
        fields={[['folio_number','Folio'],['shareholder_name','Name'],['shareholder_type','Type','badge'],['shares_held','Shares'],['percentage_holding','Holding %'],['share_class','Class','badge'],['status','Status','badge']]}
        addFields={[['shareholder_name','Shareholder Name *'],['shareholder_type','Type','select',['individual','company','trust','foreign','huf']],['share_class','Share Class','select',['equity','preference','debenture']],['shares_held','No. of Shares','number'],['face_value','Face Value (Rs)','number'],['paid_up_value','Paid-up Value (Rs)','number'],['pan_number','PAN Number'],['email','Email'],['phone','Phone'],['date_of_acquisition','Date of Acquisition','date'],['address','Address','textarea']]} />;
      case 'workingcap': return <WorkingCapital />;
      default: return null;
    }
  };

  return (
    <div style={{padding:24,background:'#EEF3FD',minHeight:'100%'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:20,fontWeight:800,color:'#0A1628',marginBottom:4}}>Corporate Documents</h1>
        <div style={{fontSize:13,color:'#64748B'}}>Source documents, loans, gratuity, risk register, cost sheets, compliance records and governance documents.</div>
      </div>

      {/* Module selector */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:24}}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActiveModule(m.id)}
            style={{padding:'12px 10px',borderRadius:10,border:`2px solid ${activeModule===m.id?m.color:'#E2E8F0'}`,background:activeModule===m.id?m.color+'10':'#fff',cursor:'pointer',textAlign:'center',transition:'all 0.15s'}}>
            <div style={{fontSize:20,marginBottom:4}}>{m.icon}</div>
            <div style={{fontSize:11,fontWeight:700,color:activeModule===m.id?m.color:'#334155',lineHeight:1.3}}>{m.label}</div>
          </button>
        ))}
      </div>

      {/* Active module content */}
      <div style={{background:'#EEF3FD'}}>
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginBottom:16,display:'flex',alignItems:'center',gap:14}}>
          <div style={{width:40,height:40,borderRadius:10,background:MODULES.find(m=>m.id===activeModule)?.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
            {MODULES.find(m=>m.id===activeModule)?.icon}
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:'#0A1628'}}>{MODULES.find(m=>m.id===activeModule)?.label}</div>
            <div style={{fontSize:12,color:'#64748B'}}>{MODULES.find(m=>m.id===activeModule)?.desc}</div>
          </div>
        </div>
        {renderModule()}
      </div>
    </div>
  );
}
