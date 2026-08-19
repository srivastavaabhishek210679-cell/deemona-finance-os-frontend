import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); return await r.json(); } catch { return {}; } };
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); return await r.json(); } catch (e) { return { error: e.message }; } };
const patch = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'PATCH', headers: h(), body: JSON.stringify(body) }); return await r.json(); } catch (e) { return { error: e.message }; } };
const INR = n => 'Rs ' + parseFloat(n||0).toLocaleString('en-IN', {minimumFractionDigits:0,maximumFractionDigits:0});

const MODULES = [
  { id: 'sox',          label: 'SOX Compliance',         icon: '🔒', color: '#1B4FD8' },
  { id: 'transfer',     label: 'Transfer Pricing',        icon: '🌍', color: '#7C3AED' },
  { id: 'leave',        label: 'Leave Encashment',        icon: '🌴', color: '#059669' },
  { id: 'empLoans',     label: 'Employee Loans',          icon: '💼', color: '#D97706' },
  { id: 'retirement',   label: 'Retirement Benefits',     icon: '🎯', color: '#DC2626' },
  { id: 'whistle',      label: 'Whistleblower',           icon: '🛡️', color: '#0284C7' },
  { id: 'dividend',     label: 'Dividend Declaration',    icon: '💰', color: '#059669' },
  { id: 'capex',        label: 'CapEx Register',          icon: '🏗️', color: '#1B4FD8' },
];

function FormField({ label, value, onChange, type='text', options, required, fullWidth }) {
  const s = { width:'100%', boxSizing:'border-box', padding:'8px 12px', borderRadius:8, border:'1px solid #C7D9F8', fontSize:13, outline:'none', background:'#fff', fontFamily:'inherit' };
  return (
    <div style={fullWidth?{gridColumn:'1/-1'}:{}}>
      <label style={{fontSize:12,fontWeight:600,color:'#334155',display:'block',marginBottom:4}}>{label}{required&&<span style={{color:'#DC2626'}}> *</span>}</label>
      {type==='select' ? <select value={value||''} onChange={e=>onChange(e.target.value)} style={s}>{options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}</select> :
       type==='textarea' ? <textarea value={value||''} onChange={e=>onChange(e.target.value)} rows={3} style={{...s,resize:'vertical'}} /> :
       <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} style={s} />}
    </div>
  );
}

function SOXCompliance() {
  const [controls, setControls] = useState([]);
  const [summary, setSummary] = useState([]);
  const [form, setForm] = useState({control_id:'',control_name:'',control_category:'financial_reporting',control_type:'preventive',control_frequency:'monthly',control_owner:'',description:'',test_procedure:''});
  const [showing, setShowing] = useState(false);
  const sf = k => v => setForm(p=>({...p,[k]:v}));
  const load = async () => { const d = await get('/api/docs2/sox'); setControls(d.controls||[]); setSummary(d.summary||[]); };
  useEffect(()=>{load();},[]);
  const save = async () => { await post('/api/docs2/sox', form); setShowing(false); load(); };

  const RESULT_COLORS = { effective:'#059669', ineffective:'#DC2626', not_tested:'#94A3B8' };
  const DEFICIENCY_COLORS = { none:'#059669', control_deficiency:'#D97706', significant_deficiency:'#DC2626', material_weakness:'#7C3AED' };

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
        {[['effective','Effective','#059669'],['ineffective','Ineffective','#DC2626'],['not_tested','Not Tested','#94A3B8']].map(([key,label,color])=>{
          const count = (summary.find(s=>s.test_result===key)||{}).count||0;
          return <div key={key} style={{padding:'12px 14px',borderRadius:10,background:'#fff',border:`2px solid ${color}30`}}><div style={{fontSize:10,color,fontWeight:700}}>{label}</div><div style={{fontSize:22,fontWeight:800,color}}>{count}</div></div>;
        })}
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
        <button onClick={()=>setShowing(true)} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#1B4FD8',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Add Control</button>
      </div>
      {showing && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:'#0A1628',marginBottom:14}}>New SOX Control</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FormField label="Control ID" value={form.control_id} onChange={sf('control_id')} required />
            <FormField label="Control Name" value={form.control_name} onChange={sf('control_name')} required />
            <FormField label="Category" value={form.control_category} onChange={sf('control_category')} type="select" options={['financial_reporting','it_general','entity_level','process_level']} />
            <FormField label="Type" value={form.control_type} onChange={sf('control_type')} type="select" options={['preventive','detective','corrective']} />
            <FormField label="Frequency" value={form.control_frequency} onChange={sf('control_frequency')} type="select" options={['daily','weekly','monthly','quarterly','annual']} />
            <FormField label="Control Owner" value={form.control_owner} onChange={sf('control_owner')} />
            <FormField label="Description" value={form.description} onChange={sf('description')} type="textarea" fullWidth />
            <FormField label="Test Procedure" value={form.test_procedure} onChange={sf('test_procedure')} type="textarea" fullWidth />
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button onClick={save} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#1B4FD8',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Save</button>
            <button onClick={()=>setShowing(false)} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E2E8F0',background:'#F8FAFC',color:'#334155',fontSize:13,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#F0F5FF'}}>{['Control ID','Name','Category','Type','Frequency','Owner','Test Result','Deficiency'].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#3B5998',fontSize:11}}>{h}</th>)}</tr></thead>
          <tbody>
            {controls.length===0?<tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#94A3B8'}}>No SOX controls defined yet.</td></tr>:
            controls.map((c,i)=>(
              <tr key={c.id} style={{borderTop:'1px solid #F1F5F9',background:i%2===0?'#fff':'#FAFBFF'}}>
                <td style={{padding:'10px 14px',fontFamily:'monospace',fontSize:11,fontWeight:700}}>{c.control_id}</td>
                <td style={{padding:'10px 14px',fontWeight:500,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.control_name}</td>
                <td style={{padding:'10px 14px',color:'#64748B',fontSize:11}}>{c.control_category?.replace(/_/g,' ')}</td>
                <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,background:'#EEF3FD',color:'#1B4FD8',fontSize:10,fontWeight:700}}>{c.control_type}</span></td>
                <td style={{padding:'10px 14px',color:'#64748B'}}>{c.control_frequency}</td>
                <td style={{padding:'10px 14px',color:'#64748B'}}>{c.control_owner||'—'}</td>
                <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:(RESULT_COLORS[c.test_result]||'#94A3B8')+'15',color:RESULT_COLORS[c.test_result]||'#94A3B8'}}>{c.test_result?.replace(/_/g,' ')}</span></td>
                <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:(DEFICIENCY_COLORS[c.deficiency_type]||'#059669')+'15',color:DEFICIENCY_COLORS[c.deficiency_type]||'#059669'}}>{c.deficiency_type?.replace(/_/g,' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CapExRegister() {
  const [assets, setAssets] = useState([]);
  const [totals, setTotals] = useState({});
  const [byCategory, setByCategory] = useState([]);
  const [form, setForm] = useState({asset_name:'',asset_category:'computer',department:'',budgeted_cost:'',actual_cost:'',vendor_name:'',purchase_date:'',useful_life_years:5,depreciation_method:'SLM',salvage_value:0,location:''});
  const [showing, setShowing] = useState(false);
  const sf = k => v => setForm(p=>({...p,[k]:v}));
  const load = async () => { const d = await get('/api/docs2/capex'); setAssets(d.assets||[]); setTotals(d.totals||{}); setByCategory(d.by_category||[]); };
  useEffect(()=>{load();},[]);
  const save = async () => { await post('/api/docs2/capex', form); setShowing(false); load(); };

  const CATS = ['land','building','machinery','vehicle','computer','furniture','intangible','other'];
  const CAT_COLORS = { computer:'#1B4FD8', machinery:'#D97706', vehicle:'#059669', building:'#7C3AED', furniture:'#0284C7', land:'#DC2626', intangible:'#F59E0B', other:'#94A3B8' };

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
        <div style={{padding:'14px 16px',borderRadius:10,background:'#fff',border:'1px solid #C7D9F8'}}><div style={{fontSize:11,color:'#64748B',fontWeight:600}}>TOTAL INVESTMENT</div><div style={{fontSize:20,fontWeight:800,color:'#1B4FD8'}}>{INR(totals.total_investment)}</div></div>
        <div style={{padding:'14px 16px',borderRadius:10,background:'#fff',border:'1px solid #C7D9F8'}}><div style={{fontSize:11,color:'#64748B',fontWeight:600}}>TOTAL DEPRECIATION</div><div style={{fontSize:20,fontWeight:800,color:'#DC2626'}}>{INR(totals.total_depreciation)}</div></div>
        <div style={{padding:'14px 16px',borderRadius:10,background:'#fff',border:'1px solid #C7D9F8'}}><div style={{fontSize:11,color:'#64748B',fontWeight:600}}>NET BLOCK</div><div style={{fontSize:20,fontWeight:800,color:'#059669'}}>{INR(totals.net_block)}</div></div>
      </div>
      {byCategory.length > 0 && (
        <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
          {byCategory.map(c=>(
            <div key={c.asset_category} style={{padding:'8px 14px',borderRadius:8,background:(CAT_COLORS[c.asset_category]||'#94A3B8')+'10',border:'1px solid '+(CAT_COLORS[c.asset_category]||'#94A3B8')+'30',fontSize:12}}>
              <span style={{fontWeight:700,color:CAT_COLORS[c.asset_category]||'#94A3B8',textTransform:'capitalize'}}>{c.asset_category}</span>
              <span style={{color:'#64748B',marginLeft:8}}>{c.count} assets | {INR(c.total_cost)}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
        <button onClick={()=>setShowing(true)} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#1B4FD8',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Add Asset</button>
      </div>
      {showing && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:'#0A1628',marginBottom:14}}>New CapEx Entry</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <FormField label="Asset Name" value={form.asset_name} onChange={sf('asset_name')} required />
            <FormField label="Category" value={form.asset_category} onChange={sf('asset_category')} type="select" options={CATS} />
            <FormField label="Department" value={form.department} onChange={sf('department')} />
            <FormField label="Vendor Name" value={form.vendor_name} onChange={sf('vendor_name')} />
            <FormField label="Budgeted Cost (Rs)" value={form.budgeted_cost} onChange={sf('budgeted_cost')} type="number" />
            <FormField label="Actual Cost (Rs)" value={form.actual_cost} onChange={sf('actual_cost')} type="number" />
            <FormField label="Purchase Date" value={form.purchase_date} onChange={sf('purchase_date')} type="date" />
            <FormField label="Useful Life (Years)" value={form.useful_life_years} onChange={sf('useful_life_years')} type="number" />
            <FormField label="Depreciation Method" value={form.depreciation_method} onChange={sf('depreciation_method')} type="select" options={['SLM','WDV']} />
            <FormField label="Salvage Value (Rs)" value={form.salvage_value} onChange={sf('salvage_value')} type="number" />
            <FormField label="Location" value={form.location} onChange={sf('location')} />
            <FormField label="Asset Tag" value={form.asset_tag} onChange={sf('asset_tag')} />
            <FormField label="Justification" value={form.justification} onChange={sf('justification')} type="textarea" fullWidth />
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button onClick={save} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#1B4FD8',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Save Asset</button>
            <button onClick={()=>setShowing(false)} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E2E8F0',background:'#F8FAFC',color:'#334155',fontSize:13,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#F0F5FF'}}>{['CapEx ID','Asset','Category','Cost','Annual Dep.','Book Value','Status','Approval'].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#3B5998',fontSize:11}}>{h}</th>)}</tr></thead>
          <tbody>
            {assets.length===0?<tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#94A3B8'}}>No capital assets registered yet.</td></tr>:
            assets.map((a,i)=>(
              <tr key={a.id} style={{borderTop:'1px solid #F1F5F9',background:i%2===0?'#fff':'#FAFBFF'}}>
                <td style={{padding:'10px 14px',fontFamily:'monospace',fontSize:11}}>{a.capex_id}</td>
                <td style={{padding:'10px 14px',fontWeight:500}}>{a.asset_name}</td>
                <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,background:(CAT_COLORS[a.asset_category]||'#94A3B8')+'15',color:CAT_COLORS[a.asset_category]||'#94A3B8',fontSize:10,fontWeight:700,textTransform:'capitalize'}}>{a.asset_category}</span></td>
                <td style={{padding:'10px 14px',color:'#059669',fontWeight:600}}>{INR(a.actual_cost)}</td>
                <td style={{padding:'10px 14px',color:'#DC2626'}}>{INR(a.annual_depreciation)}/yr</td>
                <td style={{padding:'10px 14px',fontWeight:700,color:'#1B4FD8'}}>{INR(a.book_value)}</td>
                <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:a.status==='active'?'#ECFDF5':'#FEF2F2',color:a.status==='active'?'#059669':'#DC2626'}}>{a.status}</span></td>
                <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:a.approval_status==='approved'?'#ECFDF5':'#FFFBEB',color:a.approval_status==='approved'?'#059669':'#D97706'}}>{a.approval_status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GenericModule({ endpoint, title, color, summaryCards, tableFields, formFields }) {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({});
  const [form, setForm] = useState({});
  const [showing, setShowing] = useState(false);
  const sf = k => v => setForm(p=>({...p,[k]:v}));
  const load = async () => {
    const d = await get(endpoint);
    const keys = Object.keys(d);
    const arrKey = keys.find(k => Array.isArray(d[k]));
    setData(arrKey ? d[arrKey] : []);
    setSummary(d.summary || d.totals || {});
  };
  useEffect(()=>{load();},[]);
  const save = async () => { const res = await post(endpoint, form); if (!res.error) { setShowing(false); setForm({}); load(); } };

  return (
    <div>
      {summaryCards && (
        <div style={{display:'grid',gridTemplateColumns:`repeat(${summaryCards.length},1fr)`,gap:12,marginBottom:20}}>
          {summaryCards.map((s,i)=>(
            <div key={i} style={{padding:'12px 14px',borderRadius:10,background:'#fff',border:'1px solid #C7D9F8'}}>
              <div style={{fontSize:11,color:'#64748B',fontWeight:600}}>{s.label}</div>
              <div style={{fontSize:20,fontWeight:800,color:s.color||color}}>{s.money?INR(summary[s.key]):summary[s.key]||'0'}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
        <button onClick={()=>setShowing(true)} style={{padding:'9px 20px',borderRadius:8,border:'none',background:color,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>+ Add {title}</button>
      </div>
      {showing && (
        <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:'#0A1628',marginBottom:14}}>New {title}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {formFields.map(f => <FormField key={f.key} label={f.label} value={form[f.key]} onChange={sf(f.key)} type={f.type} options={f.options} required={f.required} fullWidth={f.fullWidth} />)}
          </div>
          <div style={{display:'flex',gap:10,marginTop:14}}>
            <button onClick={save} style={{padding:'9px 20px',borderRadius:8,border:'none',background:color,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Save</button>
            <button onClick={()=>setShowing(false)} style={{padding:'9px 18px',borderRadius:8,border:'1px solid #E2E8F0',background:'#F8FAFC',color:'#334155',fontSize:13,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      )}
      <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:'#F0F5FF'}}>{tableFields.map(f=><th key={f.key} style={{padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#3B5998',fontSize:11}}>{f.label}</th>)}</tr></thead>
          <tbody>
            {data.length===0?<tr><td colSpan={tableFields.length} style={{padding:40,textAlign:'center',color:'#94A3B8'}}>No {title.toLowerCase()} records yet.</td></tr>:
            data.map((row,i)=>(
              <tr key={row.id||i} style={{borderTop:'1px solid #F1F5F9',background:i%2===0?'#fff':'#FAFBFF'}}>
                {tableFields.map(f=>(
                  <td key={f.key} style={{padding:'10px 14px',color:'#334155',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {f.money ? <span style={{fontWeight:600,color:color}}>{INR(row[f.key])}</span> :
                     f.date ? (row[f.key]?new Date(row[f.key]).toLocaleDateString('en-IN'):'—') :
                     f.badge ? <span style={{padding:'2px 8px',borderRadius:6,background:color+'15',color,fontSize:10,fontWeight:700}}>{String(row[f.key]||'—').replace(/_/g,' ')}</span> :
                     String(row[f.key]||'—')}
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

export default function Batch2DocsPage() {
  const [active, setActive] = useState('sox');

  const renderModule = () => {
    switch (active) {
      case 'sox': return <SOXCompliance />;
      case 'capex': return <CapExRegister />;
      case 'transfer': return <GenericModule endpoint="/api/docs2/transfer-pricing" title="Transfer Pricing" color="#7C3AED"
        summaryCards={[{label:'TOTAL TRANSACTIONS',key:'0'},{label:'TOTAL VALUE',key:'0',money:true}]}
        tableFields={[{key:'transaction_id',label:'Txn ID'},{key:'related_party_name',label:'Related Party'},{key:'relationship_type',label:'Relationship',badge:true},{key:'transaction_type',label:'Type',badge:true},{key:'transaction_amount',label:'Amount',money:true},{key:'pricing_method',label:'Method',badge:true},{key:'financial_year',label:'FY'},{key:'status',label:'Status',badge:true}]}
        formFields={[
          {key:'related_party_name',label:'Related Party Name *',required:true},
          {key:'related_party_country',label:'Country'},
          {key:'relationship_type',label:'Relationship',type:'select',options:['parent','subsidiary','associate','branch']},
          {key:'transaction_type',label:'Transaction Type',type:'select',options:['goods','services','royalty','loan','guarantee']},
          {key:'transaction_amount',label:'Transaction Amount (Rs)',type:'number'},
          {key:'currency',label:'Currency',type:'select',options:['INR','USD','EUR','GBP','AED']},
          {key:'pricing_method',label:'Pricing Method',type:'select',options:['CUP','RPM','CPM','TNMM','PSM']},
          {key:'arm_length_price',label:'Arm Length Price (Rs)',type:'number'},
          {key:'actual_price',label:'Actual Price (Rs)',type:'number'},
          {key:'financial_year',label:'Financial Year'},
          {key:'documentation_date',label:'Documentation Date',type:'date'},
          {key:'transaction_description',label:'Description',type:'textarea',fullWidth:true},
          {key:'benchmarking_study',label:'Benchmarking Study',type:'textarea',fullWidth:true},
        ]} />;
      case 'leave': return <GenericModule endpoint="/api/docs2/leave-encashment" title="Leave Encashment" color="#059669"
        summaryCards={[{label:'TOTAL RECORDS',key:'total'},{label:'TOTAL ENCASHMENT',key:'total_amount',money:true,color:'#059669'},{label:'TOTAL TDS',key:'total_tds',money:true,color:'#DC2626'}]}
        tableFields={[{key:'employee_name',label:'Employee'},{key:'leaves_encashed',label:'Leaves'},{key:'basic_salary',label:'Basic',money:true},{key:'encashment_amount',label:'Encashment',money:true},{key:'tds_deducted',label:'TDS',money:true},{key:'net_amount',label:'Net',money:true},{key:'encashment_date',label:'Date',date:true},{key:'status',label:'Status',badge:true}]}
        formFields={[
          {key:'employee_name',label:'Employee Name *',required:true},
          {key:'employee_code',label:'Employee Code'},
          {key:'encashment_type',label:'Encashment Type',type:'select',options:['annual','on_separation','medical']},
          {key:'leave_type',label:'Leave Type',type:'select',options:['earned_leave','casual_leave','sick_leave']},
          {key:'leaves_encashed',label:'No. of Leaves',type:'number'},
          {key:'basic_salary',label:'Basic Salary (Rs)',type:'number'},
          {key:'encashment_date',label:'Encashment Date',type:'date'},
          {key:'approved_by',label:'Approved By'},
          {key:'remarks',label:'Remarks',type:'textarea',fullWidth:true},
        ]} />;
      case 'empLoans': return <GenericModule endpoint="/api/docs2/employee-loans" title="Employee Loan" color="#D97706"
        summaryCards={[{label:'ACTIVE LOANS',key:'total'},{label:'TOTAL DISBURSED',key:'disbursed',money:true,color:'#059669'},{label:'OUTSTANDING',key:'outstanding',money:true,color:'#DC2626'}]}
        tableFields={[{key:'employee_name',label:'Employee'},{key:'loan_purpose',label:'Purpose'},{key:'loan_amount',label:'Amount',money:true},{key:'emi_amount',label:'EMI',money:true},{key:'outstanding_balance',label:'Outstanding',money:true},{key:'disbursement_date',label:'Disburse Date',date:true},{key:'recovery_mode',label:'Recovery',badge:true},{key:'status',label:'Status',badge:true}]}
        formFields={[
          {key:'employee_name',label:'Employee Name *',required:true},
          {key:'employee_code',label:'Employee Code'},
          {key:'loan_purpose',label:'Loan Purpose *',required:true},
          {key:'loan_amount',label:'Loan Amount (Rs)',type:'number'},
          {key:'tenure_months',label:'Tenure (Months)',type:'number'},
          {key:'interest_rate',label:'Interest Rate (%)',type:'number'},
          {key:'disbursement_date',label:'Disbursement Date',type:'date'},
          {key:'recovery_mode',label:'Recovery Mode',type:'select',options:['salary_deduction','bank_transfer','cheque']},
          {key:'approved_by',label:'Approved By'},
        ]} />;
      case 'retirement': return <GenericModule endpoint="/api/docs2/retirement-benefits" title="Retirement Benefit" color="#DC2626"
        summaryCards={[{label:'TOTAL EMPLOYEES',key:'total_employees'},{label:'TOTAL CORPUS',key:'total_corpus',money:true,color:'#DC2626'},{label:'TOTAL PF',key:'total_pf',money:true,color:'#1B4FD8'},{label:'TOTAL GRATUITY',key:'total_gratuity',money:true,color:'#059669'}]}
        tableFields={[{key:'employee_name',label:'Employee'},{key:'date_of_joining',label:'DOJ',date:true},{key:'expected_retirement_date',label:'Retirement Date',date:true},{key:'total_pf_corpus',label:'PF Corpus',money:true},{key:'gratuity_earned',label:'Gratuity',money:true},{key:'leave_encashment_value',label:'Leave Encash',money:true},{key:'total_retirement_corpus',label:'Total Corpus',money:true}]}
        formFields={[
          {key:'employee_name',label:'Employee Name *',required:true},
          {key:'employee_code',label:'Employee Code'},
          {key:'date_of_birth',label:'Date of Birth',type:'date'},
          {key:'date_of_joining',label:'Date of Joining',type:'date'},
          {key:'current_basic_salary',label:'Current Basic Salary (Rs)',type:'number'},
          {key:'pf_account_number',label:'PF Account Number'},
          {key:'employee_pf_balance',label:'Employee PF Balance (Rs)',type:'number'},
          {key:'employer_pf_balance',label:'Employer PF Balance (Rs)',type:'number'},
          {key:'eps_balance',label:'EPS Balance (Rs)',type:'number'},
          {key:'leave_balance',label:'Leave Balance (Days)',type:'number'},
        ]} />;
      case 'whistle': return <GenericModule endpoint="/api/docs2/whistleblower" title="Whistleblower Report" color="#0284C7"
        summaryCards={[{label:'TOTAL REPORTS',key:'0'},{label:'UNDER INVESTIGATION',key:'0'}]}
        tableFields={[{key:'report_number',label:'Report No'},{key:'complaint_category',label:'Category',badge:true},{key:'incident_date',label:'Incident Date',date:true},{key:'priority',label:'Priority',badge:true},{key:'is_anonymous',label:'Anonymous'},{key:'investigation_status',label:'Status',badge:true},{key:'created_at',label:'Filed On',date:true}]}
        formFields={[
          {key:'complaint_category',label:'Category',type:'select',options:['fraud','harassment','bribery','safety','conflict_of_interest','data_breach','other']},
          {key:'priority',label:'Priority',type:'select',options:['low','medium','high','critical']},
          {key:'incident_date',label:'Incident Date',type:'date'},
          {key:'reported_department',label:'Reported Department'},
          {key:'reported_person',label:'Reported Person (Optional)'},
          {key:'is_anonymous',label:'Anonymous',type:'select',options:[{value:'true',label:'Yes - Anonymous'},{value:'false',label:'No - Named'}]},
          {key:'complaint_description',label:'Complaint Description *',required:true,type:'textarea',fullWidth:true},
          {key:'evidence_description',label:'Evidence Available',type:'textarea',fullWidth:true},
        ]} />;
      case 'dividend': return <GenericModule endpoint="/api/docs2/dividends" title="Dividend Declaration" color="#059669"
        summaryCards={[{label:'TOTAL DECLARED',key:'total'},{label:'TOTAL AMOUNT',key:'total_declared',money:true,color:'#059669'},{label:'TOTAL PAID',key:'total_paid',money:true,color:'#1B4FD8'}]}
        tableFields={[{key:'dividend_number',label:'Div No'},{key:'financial_year',label:'FY'},{key:'dividend_type',label:'Type',badge:true},{key:'declaration_date',label:'Declared',date:true},{key:'dividend_per_share',label:'Per Share'},{key:'total_dividend_amount',label:'Total Amount',money:true},{key:'net_dividend_paid',label:'Net Paid',money:true},{key:'status',label:'Status',badge:true}]}
        formFields={[
          {key:'financial_year',label:'Financial Year',required:true},
          {key:'dividend_type',label:'Dividend Type',type:'select',options:['interim','final','special']},
          {key:'declaration_date',label:'Declaration Date',type:'date'},
          {key:'record_date',label:'Record Date',type:'date'},
          {key:'payment_date',label:'Payment Date',type:'date'},
          {key:'dividend_per_share',label:'Dividend Per Share (Rs)',type:'number'},
          {key:'total_shares_eligible',label:'Total Eligible Shares',type:'number'},
          {key:'tds_applicable',label:'TDS Applicable',type:'select',options:[{value:'false',label:'No'},{value:'true',label:'Yes'}]},
          {key:'tds_rate',label:'TDS Rate (%)',type:'number'},
          {key:'board_resolution_date',label:'Board Resolution Date',type:'date'},
          {key:'notes',label:'Notes',type:'textarea',fullWidth:true},
        ]} />;
      default: return null;
    }
  };

  return (
    <div style={{padding:24,background:'#EEF3FD',minHeight:'100%'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:20,fontWeight:800,color:'#0A1628',marginBottom:4}}>Compliance & Governance Documents</h1>
        <div style={{fontSize:13,color:'#64748B'}}>SOX controls, transfer pricing, HR records, dividends, CapEx register and whistleblower reports.</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:24}}>
        {MODULES.map(m=>(
          <button key={m.id} onClick={()=>setActive(m.id)}
            style={{padding:'12px 10px',borderRadius:10,border:`2px solid ${active===m.id?m.color:'#E2E8F0'}`,background:active===m.id?m.color+'10':'#fff',cursor:'pointer',textAlign:'center',transition:'all 0.15s'}}>
            <div style={{fontSize:20,marginBottom:4}}>{m.icon}</div>
            <div style={{fontSize:11,fontWeight:700,color:active===m.id?m.color:'#334155',lineHeight:1.3}}>{m.label}</div>
          </button>
        ))}
      </div>
      <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:16,marginBottom:16,display:'flex',alignItems:'center',gap:14}}>
        <div style={{width:38,height:38,borderRadius:10,background:MODULES.find(m=>m.id===active)?.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{MODULES.find(m=>m.id===active)?.icon}</div>
        <div style={{fontSize:15,fontWeight:700,color:'#0A1628'}}>{MODULES.find(m=>m.id===active)?.label}</div>
      </div>
      {renderModule()}
    </div>
  );
}
