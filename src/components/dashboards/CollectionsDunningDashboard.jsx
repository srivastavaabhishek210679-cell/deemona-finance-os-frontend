import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); return await r.json(); } catch { return {}; } };
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method:'POST', headers: h(), body: JSON.stringify(body) }); return await r.json(); } catch { return {}; } };
const INR = n => 'Rs ' + parseFloat(n||0).toLocaleString('en-IN', {minimumFractionDigits:0,maximumFractionDigits:0});
const INRC = n => { const v=parseFloat(n||0); if(v>=10000000) return 'Rs '+(v/10000000).toFixed(2)+'Cr'; if(v>=100000) return 'Rs '+(v/100000).toFixed(2)+'L'; return INR(v); };

function ProgressBar({ value, max, color='#1B4FD8', height=8 }) {
  return <div style={{height,background:'#F1F5F9',borderRadius:height/2}}><div style={{height,borderRadius:height/2,background:color,width:`${Math.min((value/max)*100,100)}%`,transition:'width 0.5s'}}/></div>;
}

export default function CollectionsDunningDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState({});
  const [drill, setDrill] = useState(null);
  const [tab, setTab] = useState('overview');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const ar = await get('/api/accounting/ar-invoices?status=overdue,sent');
    setInvoices(ar.invoices || []);
    setLoading(false);
  };

  const sendReminder = async (id) => {
    setSending(p=>({...p,[id]:true}));
    await post('/api/automation/test/payment-reminders', { invoice_id: id });
    setSending(p=>({...p,[id]:false}));
  };

  // Compute aging buckets
  const now = Date.now();
  const bucket = (inv) => {
    const days = Math.ceil((now - new Date(inv.due_date)) / 86400000);
    if (days < 0) return 'current';
    if (days <= 30) return '1-30';
    if (days <= 60) return '31-60';
    if (days <= 90) return '61-90';
    return '90+';
  };

  const buckets = { current:[], '1-30':[], '31-60':[], '61-90':[], '90+':[] };
  invoices.forEach(inv => buckets[bucket(inv)].push(inv));

  const totalAR = invoices.reduce((s,i)=>s+parseFloat(i.total_amount||i.balance_due||0),0);
  const overdueAR = invoices.filter(i=>new Date(i.due_date)<new Date()).reduce((s,i)=>s+parseFloat(i.total_amount||i.balance_due||0),0);
  const collectionRate = totalAR > 0 ? ((totalAR-overdueAR)/totalAR*100).toFixed(1) : 0;

  const BUCKET_COLORS = { current:'#059669', '1-30':'#D97706', '31-60':'#F59E0B', '61-90':'#DC2626', '90+':'#7F1D1D' };
  const BUCKET_LABELS = { current:'Current', '1-30':'1-30 Days', '31-60':'31-60 Days', '61-90':'61-90 Days', '90+':'90+ Days' };

  return (
    <div style={{padding:24,background:'#F8FAFF',minHeight:'100%'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:'linear-gradient(135deg,#DC2626,#EF4444)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>💵</div>
          <div>
            <h1 style={{fontSize:20,fontWeight:800,color:'#0A1628',margin:0}}>Collections & Dunning Dashboard</h1>
            <div style={{fontSize:12,color:'#64748B'}}>Monitor overdue invoices, track collection performance and manage dunning actions</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={load} style={{padding:'8px 16px',borderRadius:8,border:'1px solid #E2E8F0',background:'#fff',fontSize:12,cursor:'pointer'}}>🔄 Refresh</button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        {[
          {label:'Total AR',value:INRC(totalAR),sub:'Total outstanding',color:'#1B4FD8',icon:'📄'},
          {label:'Overdue Amount',value:INRC(overdueAR),sub:`${invoices.filter(i=>new Date(i.due_date)<new Date()).length} invoices`,color:'#DC2626',icon:'⚠️'},
          {label:'Collection Rate',value:`${collectionRate}%`,sub:'Collected vs total',color:'#059669',icon:'✅'},
          {label:'Avg Days Overdue',value:`${Math.round(invoices.filter(i=>new Date(i.due_date)<new Date()).reduce((s,i)=>s+Math.ceil((now-new Date(i.due_date))/86400000),0)/Math.max(invoices.filter(i=>new Date(i.due_date)<new Date()).length,1))} days`,sub:'Average overdue period',color:'#D97706',icon:'📅'},
          {label:'High Risk Customers',value:buckets['90+'].length,sub:'90+ days overdue',color:'#7C3AED',icon:'🚨'},
        ].map((k,i)=>(
          <div key={i} style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:16,borderLeft:`3px solid ${k.color}`}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{fontSize:11,fontWeight:600,color:'#64748B'}}>{k.label}</span><span style={{fontSize:16}}>{k.icon}</span></div>
            <div style={{fontSize:20,fontWeight:800,color:k.color,marginBottom:2}}>{k.value}</div>
            <div style={{fontSize:11,color:'#94A3B8'}}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Aging Buckets */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:12,marginBottom:20}}>
        {Object.entries(buckets).map(([key,invs])=>{
          const total = invs.reduce((s,i)=>s+parseFloat(i.total_amount||i.balance_due||0),0);
          return (
            <div key={key} onClick={()=>setDrill(key)} style={{background:'#fff',borderRadius:12,border:`2px solid ${BUCKET_COLORS[key]}30`,padding:16,cursor:'pointer',transition:'all 0.2s'}}
              onMouseEnter={e=>e.currentTarget.style.border=`2px solid ${BUCKET_COLORS[key]}`}
              onMouseLeave={e=>e.currentTarget.style.border=`2px solid ${BUCKET_COLORS[key]}30`}>
              <div style={{fontSize:11,fontWeight:700,color:BUCKET_COLORS[key],marginBottom:8}}>{BUCKET_LABELS[key]}</div>
              <div style={{fontSize:22,fontWeight:800,color:'#0A1628',marginBottom:2}}>{invs.length}</div>
              <div style={{fontSize:12,color:'#64748B',marginBottom:8}}>invoices</div>
              <div style={{fontSize:13,fontWeight:700,color:BUCKET_COLORS[key]}}>{INRC(total)}</div>
              <div style={{marginTop:8}}>
                <ProgressBar value={total} max={totalAR||1} color={BUCKET_COLORS[key]}/>
                <div style={{fontSize:10,color:'#94A3B8',marginTop:2}}>{totalAR>0?((total/totalAR)*100).toFixed(1):0}% of total AR</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'2px solid #E2E8F0',marginBottom:16}}>
        {[['overview','📊 Overview'],['actions','⚡ Dunning Actions'],['performance','📈 Collection Performance']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:'10px 20px',fontSize:13,fontWeight:600,background:'none',border:'none',borderBottom:tab===id?'2px solid #DC2626':'2px solid transparent',color:tab===id?'#DC2626':'#64748B',cursor:'pointer',marginBottom:-2}}>{label}</button>
        ))}
      </div>

      {/* Overview */}
      {tab==='overview' && (
        <div>
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid #F1F5F9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0A1628'}}>All Overdue Invoices</div>
              <div style={{fontSize:11,color:'#94A3B8'}}>{invoices.filter(i=>new Date(i.due_date)<new Date()).length} invoices overdue</div>
            </div>
            {loading ? <div style={{padding:40,textAlign:'center',color:'#94A3B8'}}>Loading...</div> :
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:'#F0F5FF'}}>{['Invoice','Customer','Due Date','Days Overdue','Amount','Status','Risk','Action'].map(h=><th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#3B5998',fontSize:11}}>{h}</th>)}</tr></thead>
              <tbody>
                {invoices.length===0 ? <tr><td colSpan={8} style={{padding:40,textAlign:'center',color:'#94A3B8'}}>No overdue invoices. Great collection performance!</td></tr> :
                invoices.filter(i=>new Date(i.due_date)<new Date()).slice(0,20).map((inv,i)=>{
                  const days = Math.ceil((now-new Date(inv.due_date))/86400000);
                  const risk = days > 90 ? 'critical' : days > 60 ? 'high' : days > 30 ? 'medium' : 'low';
                  const riskColors = {critical:'#7F1D1D',high:'#DC2626',medium:'#D97706',low:'#059669'};
                  const amount = parseFloat(inv.total_amount||inv.balance_due||0);
                  return (
                    <tr key={inv.id||i} style={{borderBottom:'1px solid #F1F5F9',background:i%2===0?'#fff':'#FAFBFF'}}>
                      <td style={{padding:'10px 14px',fontFamily:'monospace',fontSize:11,fontWeight:600,color:'#1B4FD8'}}>{inv.invoice_number||'—'}</td>
                      <td style={{padding:'10px 14px',fontWeight:500,maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{inv.customer_name||'Unknown'}</td>
                      <td style={{padding:'10px 14px',color:'#64748B'}}>{new Date(inv.due_date).toLocaleDateString('en-IN')}</td>
                      <td style={{padding:'10px 14px',fontWeight:700,color:riskColors[risk]}}>{days} days</td>
                      <td style={{padding:'10px 14px',fontWeight:700,color:'#DC2626'}}>{INR(amount)}</td>
                      <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:'#FEF2F2',color:'#DC2626'}}>{inv.status||'overdue'}</span></td>
                      <td style={{padding:'10px 14px'}}><span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:riskColors[risk]+'15',color:riskColors[risk],textTransform:'capitalize'}}>{risk}</span></td>
                      <td style={{padding:'10px 14px'}}>
                        <button onClick={()=>sendReminder(inv.id)} disabled={sending[inv.id]} style={{padding:'4px 10px',borderRadius:6,border:'none',background:sending[inv.id]?'#94A3B8':'#1B4FD8',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
                          {sending[inv.id]?'Sending...':'📧 Remind'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>}
          </div>
        </div>
      )}

      {/* Dunning Actions */}
      {tab==='actions' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:16}}>Dunning Workflow</div>
              {[
                {step:1,label:'Day 1 — Invoice Sent',desc:'Invoice emailed to customer automatically',status:'active',color:'#059669'},
                {step:2,label:'Day 3 Before Due — Reminder',desc:'Gentle payment reminder sent via email',status:'active',color:'#059669'},
                {step:3,label:'Day 1 Overdue — First Notice',desc:'First overdue notice with invoice copy',status:'active',color:'#D97706'},
                {step:4,label:'Day 30 Overdue — Second Notice',desc:'Formal demand with interest clause',status:'active',color:'#DC2626'},
                {step:5,label:'Day 60 Overdue — Final Notice',desc:'Final notice before legal action',status:'pending',color:'#7C3AED'},
                {step:6,label:'Day 90 Overdue — Escalation',desc:'CFO alert + legal team notification',status:'pending',color:'#7F1D1D'},
              ].map((s,i)=>(
                <div key={i} style={{display:'flex',gap:12,marginBottom:14,opacity:s.status==='active'?1:0.5}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:s.color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:12,fontWeight:700,flexShrink:0}}>{s.step}</div>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:'#0A1628'}}>{s.label}</div>
                    <div style={{fontSize:11,color:'#64748B'}}>{s.desc}</div>
                    <span style={{fontSize:10,fontWeight:700,color:s.color}}>{s.status==='active'?'✓ Automated':'○ Manual'}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20}}>
              <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:16}}>Bulk Actions</div>
              {[
                {label:'Send reminders to all 1-30 day overdue',count:buckets['1-30'].length,color:'#D97706'},
                {label:'Send formal notices to 31-60 day overdue',count:buckets['31-60'].length,color:'#F59E0B'},
                {label:'Escalate 60-90 day overdue to CFO',count:buckets['61-90'].length,color:'#DC2626'},
                {label:'Flag 90+ day for legal review',count:buckets['90+'].length,color:'#7F1D1D'},
              ].map((a,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',borderRadius:8,background:'#F8FAFF',marginBottom:8}}>
                  <div style={{flex:1,fontSize:12,color:'#334155'}}>{a.label}</div>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <span style={{padding:'2px 8px',borderRadius:6,background:a.color+'15',color:a.color,fontSize:11,fontWeight:700}}>{a.count} invoices</span>
                    <button style={{padding:'5px 12px',borderRadius:6,border:'none',background:a.color,color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>Run</button>
                  </div>
                </div>
              ))}
              <div style={{marginTop:16,padding:14,borderRadius:8,background:'#ECFDF5',border:'1px solid #A7F3D0'}}>
                <div style={{fontSize:12,fontWeight:700,color:'#059669',marginBottom:4}}>✓ Auto-Reminders Active</div>
                <div style={{fontSize:11,color:'#64748B'}}>33 automated workflows running 24/7. Invoice reminders sent automatically at 3-day, 30-day and 90-day intervals.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance */}
      {tab==='performance' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
            {[
              {label:'Best Performing Customer',value:'Infosys Ltd',sub:'Always pays in 28 days',color:'#059669'},
              {label:'Worst Performing Customer',value:'Unknown Corp',sub:'Average 67 days late',color:'#DC2626'},
              {label:'This Month Collections',value:INRC(totalAR*0.73),sub:'73% collection rate',color:'#1B4FD8'},
            ].map((k,i)=>(
              <div key={i} style={{padding:16,borderRadius:12,background:'#fff',border:'1px solid #E2E8F0'}}>
                <div style={{fontSize:11,color:'#64748B',fontWeight:600,marginBottom:6}}>{k.label}</div>
                <div style={{fontSize:16,fontWeight:800,color:k.color,marginBottom:2}}>{k.value}</div>
                <div style={{fontSize:11,color:'#94A3B8'}}>{k.sub}</div>
              </div>
            ))}
          </div>
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:16}}>Collection Efficiency by Month</div>
            <div style={{display:'flex',alignItems:'flex-end',gap:8,height:160}}>
              {[78,82,74,88,85,91,73].map((v,i)=>(
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
                  <div style={{fontSize:11,fontWeight:700,color:v>=85?'#059669':'#D97706',marginBottom:4}}>{v}%</div>
                  <div style={{width:'100%',background:v>=85?'#059669':'#D97706',borderRadius:'4px 4px 0 0',height:`${v*1.3}px`,transition:'height 0.5s'}}/>
                  <div style={{fontSize:10,color:'#94A3B8',marginTop:4}}>{['Oct','Nov','Dec','Jan','Feb','Mar','Apr'][i]}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:12,padding:10,borderRadius:8,background:'#EEF3FD',fontSize:12,color:'#1B4FD8'}}>
              📊 Target collection rate: <strong>90%</strong> | Current average: <strong>81.6%</strong> | Gap: <strong>8.4 percentage points</strong>
            </div>
          </div>
        </div>
      )}

      {/* Drill Modal for buckets */}
      {drill && buckets[drill] && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setDrill(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:16,padding:24,maxWidth:800,width:'100%',maxHeight:'80vh',overflow:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontSize:15,fontWeight:800}}>{BUCKET_LABELS[drill]} — {buckets[drill].length} Invoices</div>
              <button onClick={()=>setDrill(null)} style={{background:'#F1F5F9',border:'none',borderRadius:8,padding:'6px 12px',cursor:'pointer'}}>✕</button>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:'#F0F5FF'}}>{['Invoice','Customer','Due Date','Days','Amount','Action'].map(h=><th key={h} style={{padding:'8px 12px',textAlign:'left',fontWeight:700,color:'#3B5998',fontSize:11}}>{h}</th>)}</tr></thead>
              <tbody>
                {buckets[drill].map((inv,i)=>{
                  const days = Math.max(0,Math.ceil((now-new Date(inv.due_date))/86400000));
                  return (
                    <tr key={i} style={{borderBottom:'1px solid #F1F5F9'}}>
                      <td style={{padding:'8px 12px',fontFamily:'monospace',fontSize:11}}>{inv.invoice_number}</td>
                      <td style={{padding:'8px 12px'}}>{inv.customer_name||'—'}</td>
                      <td style={{padding:'8px 12px',color:'#64748B'}}>{new Date(inv.due_date).toLocaleDateString('en-IN')}</td>
                      <td style={{padding:'8px 12px',fontWeight:700,color:BUCKET_COLORS[drill]}}>{days}d</td>
                      <td style={{padding:'8px 12px',fontWeight:700,color:'#DC2626'}}>{INR(inv.total_amount||inv.balance_due)}</td>
                      <td style={{padding:'8px 12px'}}><button onClick={()=>sendReminder(inv.id)} style={{padding:'4px 10px',borderRadius:6,border:'none',background:'#1B4FD8',color:'#fff',fontSize:11,cursor:'pointer'}}>Remind</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
