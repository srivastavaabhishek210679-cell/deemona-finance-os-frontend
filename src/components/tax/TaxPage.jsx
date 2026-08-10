import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';

const API = apiURL('/api/tax');
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
async function apiGet(url) { const res = await fetch(url, { headers: headers() }); if (!res.ok) throw new Error(await res.text()); return res.json(); }
async function apiPost(url, body) { const res = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body) }); if (!res.ok) throw new Error(await res.text()); return res.json(); }
async function apiPatch(url, body) { const res = await fetch(url, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) }); if (!res.ok) throw new Error(await res.text()); return res.json(); }

function formatINR(n) { const num = parseFloat(n||0); if(num>=1e7) return 'Rs '+(num/1e7).toFixed(2)+' Cr'; if(num>=1e5) return 'Rs '+(num/1e5).toFixed(2)+' L'; return 'Rs '+num.toLocaleString('en-IN'); }
function formatDate(d) { if(!d) return '--'; return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); }

function StatusBadge({ status }) {
  const c = {pending:'#F5A623',filed:'#22C98A',late:'#FF5C5C',not_applicable:'#8B89A8'}[status]||'#8B89A8';
  return <span style={{padding:'2px 8px',borderRadius:100,fontSize:11,fontWeight:600,background:c+'20',color:c}}>{status?.replace(/_/g,' ').toUpperCase()}</span>;
}

const FILING_TYPES = ['GST_R1','GST_R3B','TDS_26Q','TDS_24Q','ADVANCE_TAX','ITR'];

export default function TaxPage() {
  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ filing_type:'GST_R3B', period_month:new Date().getMonth()+1, period_year:new Date().getFullYear(), due_date:'', tax_liability:'', notes:'' });

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await apiGet(API+'/filings'); setFilings(d.filings||[]); } catch { setFilings([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try { await apiPost(API+'/filings', form); setShowForm(false); await load(); }
    catch(e) { alert('Error: '+e.message); } finally { setSaving(false); }
  };

  const markFiled = async (id, reference_number) => {
    const ref = reference_number || prompt('Enter filing reference number (ARN/Acknowledgement):');
    if (!ref) return;
    try { await apiPatch(API+'/filings/'+id+'/file', { reference_number: ref }); await load(); }
    catch(e) { alert('Error: '+e.message); }
  };

  const inputStyle = { width:'100%', boxSizing:'border-box', padding:'8px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-3)', color:'var(--text-primary)', fontSize:13, outline:'none' };

  const summary = {
    total: filings.length,
    pending: filings.filter(f=>f.status==='pending').length,
    overdue: filings.filter(f=>f.status==='pending' && new Date(f.due_date)<new Date()).length,
    filed: filings.filter(f=>f.status==='filed').length,
  };

  return (
    <div style={{padding:24}}>
      {/* Summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
        {[
          {label:'Total Filings',value:summary.total,color:'#6C63FF'},
          {label:'Pending',value:summary.pending,color:'#F5A623'},
          {label:'Overdue',value:summary.overdue,color:'#FF5C5C'},
          {label:'Filed',value:summary.filed,color:'#22C98A'},
        ].map(c=>(
          <div key={c.label} style={{padding:'18px 20px',borderRadius:12,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
            <div style={{fontSize:24,fontWeight:800,color:c.color,marginBottom:4}}>{c.value}</div>
            <div style={{fontSize:14,fontWeight:600}}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',justifyContent:'space-between',marginBottom:16,alignItems:'center'}}>
        <div style={{fontSize:14,fontWeight:700}}>Tax Filing Calendar</div>
        <button onClick={()=>setShowForm(!showForm)} style={{padding:'8px 16px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>+ Add Filing</button>
      </div>

      {showForm && (
        <div style={{padding:20,borderRadius:12,marginBottom:20,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>New Tax Filing</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12,marginBottom:14}}>
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Filing Type</div>
              <select value={form.filing_type} onChange={e=>setForm(p=>({...p,filing_type:e.target.value}))} style={inputStyle}>
                {FILING_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Period Month</div>
              <input type="number" min="1" max="12" value={form.period_month} onChange={e=>setForm(p=>({...p,period_month:parseInt(e.target.value)}))} style={inputStyle}/>
            </div>
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Period Year</div>
              <input type="number" value={form.period_year} onChange={e=>setForm(p=>({...p,period_year:parseInt(e.target.value)}))} style={inputStyle}/>
            </div>
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Due Date</div>
              <input type="date" value={form.due_date} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))} style={inputStyle}/>
            </div>
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Tax Liability (Rs)</div>
              <input type="number" placeholder="0" value={form.tax_liability} onChange={e=>setForm(p=>({...p,tax_liability:e.target.value}))} style={inputStyle}/>
            </div>
            <div style={{gridColumn:'span 3'}}>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Notes</div>
              <input placeholder="Notes..." value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={inputStyle}/>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={save} disabled={saving} style={{padding:'8px 20px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>{saving?'Saving...':'Add Filing'}</button>
            <button onClick={()=>setShowForm(false)} style={{padding:'8px 16px',borderRadius:8,background:'var(--surface-3)',border:'1px solid var(--border)',color:'var(--text-secondary)',cursor:'pointer',fontSize:14}}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</div> : filings.length===0 ? (
        <div style={{textAlign:'center',padding:60}}>
          <div style={{fontSize:36,marginBottom:12,opacity:0.4}}>📅</div>
          <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>No tax filings yet</div>
          <div style={{fontSize:13,color:'var(--text-muted)'}}>Add your GST, TDS, and other statutory filing deadlines</div>
        </div>
      ) : (
        <div style={{borderRadius:12,border:'1px solid var(--border)',overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'140px 100px 80px 120px 120px 100px 1fr',padding:'10px 16px',background:'var(--surface-3)',fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.05em'}}>
            <span>FILING TYPE</span><span>PERIOD</span><span>YEAR</span><span>DUE DATE</span><span style={{textAlign:'right'}}>LIABILITY</span><span>STATUS</span><span>ACTIONS</span>
          </div>
          {filings.map((f,i)=>{
            const isOverdue = f.status==='pending' && new Date(f.due_date)<new Date();
            return (
              <div key={f.id} style={{display:'grid',gridTemplateColumns:'140px 100px 80px 120px 120px 100px 1fr',padding:'12px 16px',fontSize:13,alignItems:'center',background:isOverdue?'#FF5C5C08':i%2===0?'var(--surface-2)':'var(--surface-1)',borderTop:'1px solid var(--border)'}}>
                <span style={{fontWeight:700,color:'var(--accent)',fontSize:12}}>{f.filing_type.replace(/_/g,' ')}</span>
                <span style={{fontSize:12,color:'var(--text-muted)'}}>{f.period_month?`M${f.period_month}`:f.period_quarter?`Q${f.period_quarter}`:'-'}</span>
                <span style={{fontSize:12}}>{f.period_year}</span>
                <span style={{fontSize:12,color:isOverdue?'#FF5C5C':'var(--text-muted)'}}>{formatDate(f.due_date)}</span>
                <span style={{textAlign:'right',fontWeight:600}}>{formatINR(f.tax_liability)}</span>
                <StatusBadge status={isOverdue&&f.status==='pending'?'late':f.status}/>
                <div style={{display:'flex',gap:8}}>
                  {f.status==='pending'&&<button onClick={()=>markFiled(f.id,null)} style={{padding:'4px 12px',borderRadius:6,fontSize:12,fontWeight:600,background:'#22C98A20',border:'1px solid #22C98A40',color:'#22C98A',cursor:'pointer'}}>Mark Filed</button>}
                  {f.reference_number&&<span style={{fontSize:11,color:'var(--text-muted)'}}>Ref: {f.reference_number}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

