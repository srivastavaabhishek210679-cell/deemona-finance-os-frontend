import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';

const API = apiURL('/api/budgeting');
const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
async function apiGet(url) { const res = await fetch(url, { headers: headers() }); if (!res.ok) throw new Error(await res.text()); return res.json(); }
async function apiPost(url, body) { const res = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body) }); if (!res.ok) throw new Error(await res.text()); return res.json(); }

function formatINR(n) { const num = parseFloat(n||0); if(num>=1e7) return 'Rs '+(num/1e7).toFixed(2)+' Cr'; if(num>=1e5) return 'Rs '+(num/1e5).toFixed(2)+' L'; return 'Rs '+num.toLocaleString('en-IN'); }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

export default function BudgetingPage() {
  const [budgets, setBudgets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [form, setForm] = useState({ name:'', fiscal_year:new Date().getFullYear(), department:'', type:'annual', notes:'' });
  const [assumptions, setAssumptions] = useState({ growth:'15', inflation:'6', headcount:'0' });

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await apiGet(API+'/budgets'); setBudgets(d.budgets||[]); } catch { setBudgets([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadLines = async (budget) => {
    setSelected(budget);
    try { const d = await apiGet(API+'/budgets/'+budget.id+'/lines'); setLines(d.lines||[]); } catch { setLines([]); }
  };

  const save = async () => {
    setSaving(true);
    try { const d = await apiPost(API+'/budgets', form); await load(); await loadLines(d.budget); setShowForm(false); }
    catch(e) { alert('Error: '+e.message); } finally { setSaving(false); }
  };

  const generateAI = async () => {
    if (!selected) { alert('Select a budget first'); return; }
    setAiGenerating(true);
    try { const d = await apiPost(API+'/budgets/'+selected.id+'/ai-generate', assumptions); setLines(d.lines||[]); await load(); }
    catch(e) { alert('Error: '+e.message); } finally { setAiGenerating(false); }
  };

  const statusColor = {draft:'#8B89A8',active:'#22C98A',closed:'#F5A623'};
  const inputStyle = { width:'100%', boxSizing:'border-box', padding:'8px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-3)', color:'var(--text-primary)', fontSize:13, outline:'none' };

  return (
    <div style={{padding:24}}>
      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:20,minHeight:'60vh',overflow:'hidden',overflow:'hidden'}}>
        {/* Budget list */}
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:700}}>Budgets</div>
            <button onClick={()=>setShowForm(!showForm)} style={{padding:'6px 12px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>+</button>
          </div>

          {showForm && (
            <div style={{padding:16,borderRadius:10,marginBottom:12,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
              {[
                {label:'Budget Name',key:'name',placeholder:'FY2027 Annual Budget'},
                {label:'Fiscal Year',key:'fiscal_year',type:'number'},
                {label:'Department',key:'department',placeholder:'All / Finance / Ops'},
              ].map(f=>(
                <div key={f.key} style={{marginBottom:8}}>
                  <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>{f.label}</div>
                  <input type={f.type||'text'} placeholder={f.placeholder} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} style={inputStyle}/>
                </div>
              ))}
              <div style={{display:'flex',gap:8,marginTop:10}}>
                <button onClick={save} disabled={saving} style={{flex:1,padding:'7px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:13,fontWeight:600}}>{saving?'...':'Create'}</button>
                <button onClick={()=>setShowForm(false)} style={{padding:'7px 12px',borderRadius:8,background:'var(--surface-3)',border:'1px solid var(--border)',color:'var(--text-secondary)',cursor:'pointer',fontSize:13}}>Cancel</button>
              </div>
            </div>
          )}

          {loading ? <div style={{textAlign:'center',padding:20,color:'var(--text-muted)',fontSize:13}}>Loading...</div> : budgets.length===0 ? (
            <div style={{textAlign:'center',padding:30,color:'var(--text-muted)',fontSize:13}}>No budgets yet. Create one to start.</div>
          ) : budgets.map(b=>(
            <div key={b.id} onClick={()=>loadLines(b)} style={{
              padding:'12px 14px', borderRadius:10, marginBottom:8, cursor:'pointer',
              background:selected?.id===b.id?'#6C63FF18':'var(--surface-2)',
              border:'1px solid '+(selected?.id===b.id?'#6C63FF40':'var(--border)'),
              transition:'all 0.15s',
            }}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>{b.name}</div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontSize:11,color:'var(--text-muted)'}}>FY{b.fiscal_year}</span>
                <span style={{padding:'1px 6px',borderRadius:4,fontSize:10,fontWeight:600,background:(statusColor[b.status]||'#888')+'20',color:statusColor[b.status]||'#888'}}>{b.status?.toUpperCase()}</span>
                {b.ai_generated&&<span style={{fontSize:10,padding:'1px 5px',borderRadius:4,background:'#6C63FF',color:'#fff',fontWeight:700}}>AI</span>}
              </div>
              <div style={{fontSize:12,color:'#22C98A',marginTop:3,fontWeight:700}}>{formatINR(b.total_budgeted)}</div>
            </div>
          ))}
        </div>

        {/* Budget detail */}
        <div style={{minWidth:0,overflow:'hidden'}}>
          {!selected ? (
            <div style={{textAlign:'center',padding:80,color:'var(--text-muted)'}}>
              <div style={{fontSize:36,marginBottom:12,opacity:0.3}}>📊</div>
              <div style={{fontSize:15,fontWeight:600,marginBottom:6}}>Select a budget to view details</div>
              <div style={{fontSize:13}}>Or create a new budget using the + button</div>
            </div>
          ) : (
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
                <div>
                  <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>{selected.name}</h2>
                  <div style={{fontSize:13,color:'var(--text-muted)'}}>FY{selected.fiscal_year} {selected.department&&'• '+selected.department}</div>
                </div>
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  <div style={{padding:'10px 16px',borderRadius:10,background:'var(--surface-2)',border:'1px solid var(--border)',textAlign:'center'}}>
                    <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:2}}>AI Generate</div>
                    <div style={{display:'flex',gap:6,marginBottom:6}}>
                      {[{label:'Growth %',key:'growth'},{label:'Inflation %',key:'inflation'},{label:'New Heads',key:'headcount'}].map(f=>(
                        <input key={f.key} type="number" placeholder={f.label} value={assumptions[f.key]}
                          onChange={e=>setAssumptions(p=>({...p,[f.key]:e.target.value}))}
                          style={{width:80,padding:'5px 7px',borderRadius:6,border:'1px solid var(--border)',background:'var(--surface-3)',color:'var(--text-primary)',fontSize:12,outline:'none'}}/>
                      ))}
                    </div>
                    <button onClick={generateAI} disabled={aiGenerating} style={{width:'100%',padding:'6px',borderRadius:6,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:12,fontWeight:600}}>
                      {aiGenerating?'Generating...':'* AI Generate Budget'}
                    </button>
                  </div>
                </div>
              </div>

              {lines.length===0 ? (
                <div style={{textAlign:'center',padding:40,color:'var(--text-muted)',fontSize:13}}>
                  No budget lines yet. Use AI Generate or add lines manually.
                </div>
              ) : (
                <div style={{borderRadius:12,border:'1px solid var(--border)',overflowX:'auto',width:'100%'}}>
                  <table style={{width:'100%',minWidth:900,borderCollapse:'collapse',fontSize:12}}>
                    <thead>
                      <tr style={{background:'var(--surface-3)'}}>
                        <th style={{padding:'10px 14px',textAlign:'left',fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.05em',whiteSpace:'nowrap',position:'sticky',left:0,background:'var(--surface-3)',zIndex:2}}>CATEGORY</th>
                        {MONTHS.map(m=><th key={m} style={{padding:'8px 6px',textAlign:'right',fontWeight:700,color:'var(--text-muted)',minWidth:65}}>{m}</th>)}
                        <th style={{padding:'10px 14px',textAlign:'right',fontWeight:700,color:'var(--text-muted)'}}>TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line,i)=>(
                        <tr key={line.id} style={{background:i%2===0?'var(--surface-2)':'var(--surface-1)',borderTop:'1px solid var(--border)'}}>
                          <td style={{padding:'10px 14px',fontWeight:500,whiteSpace:'nowrap',position:'sticky',left:0,background:'inherit',zIndex:1}}>{line.category}</td>
                          {MONTH_KEYS.map(m=>(
                            <td key={m} style={{padding:'8px',textAlign:'right',color:'var(--text-secondary)'}}>
                              {parseFloat(line[m]||0)>0?formatINR(line[m]).replace('Rs ',''):'--'}
                            </td>
                          ))}
                          <td style={{padding:'10px 14px',textAlign:'right',fontWeight:700,color:'#22C98A'}}>{formatINR(line.annual_total)}</td>
                        </tr>
                      ))}
                      <tr style={{background:'var(--surface-3)',borderTop:'2px solid var(--border)'}}>
                        <td style={{padding:'10px 14px',fontWeight:700}}>TOTAL</td>
                        {MONTH_KEYS.map(m=>(
                          <td key={m} style={{padding:'8px',textAlign:'right',fontWeight:700}}>
                            {(() => { const t=lines.reduce((s,l)=>s+parseFloat(l[m]||0),0); return t>0?formatINR(t).replace('Rs ',''):'--'; })()}
                          </td>
                        ))}
                        <td style={{padding:'10px 14px',textAlign:'right',fontWeight:800,color:'#22C98A'}}>{formatINR(lines.reduce((s,l)=>s+parseFloat(l.annual_total||0),0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



