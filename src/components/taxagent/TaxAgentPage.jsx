import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { const r = await fetch(apiURL(url), { headers: h() }); return r.json(); };
const post = async (url, body) => { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); return r.json(); };

function INR(n) {
  const v = parseFloat(n||0);
  if (v>=1e7) return 'Rs '+(v/1e7).toFixed(2)+' Cr';
  if (v>=1e5) return 'Rs '+(v/1e5).toFixed(2)+' L';
  return 'Rs '+v.toLocaleString('en-IN');
}

function KPI({ label, value, color, sub }) {
  return (
    <div style={{ padding:'16px 20px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
      <div style={{ fontSize:20, fontWeight:800, color:color||'var(--text-primary)', marginBottom:2 }}>{value}</div>
      <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

export default function TaxAgentPage() {
  const [tab, setTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [gst, setGst] = useState(null);
  const [tds, setTds] = useState(null);
  const [calendar, setCalendar] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth()+1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [gstLoading, setGstLoading] = useState(false);
  const [tdsLoading, setTdsLoading] = useState(false);

  useEffect(() => {
    get('/api/tax-agent/dashboard').then(setDashboard);
    get('/api/tax-agent/calendar').then(d => setCalendar(d.calendar||[]));
  }, []);

  const loadGST = async () => {
    setGstLoading(true);
    const data = await get(`/api/tax-agent/gst-computation?month=${month}&year=${year}`);
    setGst(data); setGstLoading(false);
  };

  const loadTDS = async () => {
    setTdsLoading(true);
    const data = await get(`/api/tax-agent/tds-computation?year=${year}`);
    setTds(data); setTdsLoading(false);
  };

  const askTax = async () => {
    if (!question.trim()) return;
    setAsking(true); setAnswer('');
    const data = await post('/api/tax-agent/ask', { question });
    setAnswer(data.answer||'');
    setAsking(false);
  };

  const TAX_QS = [
    'What is the GST rate for software services?',
    'When is GSTR-3B due for last month?',
    'How to calculate TDS on contractor payments?',
    'What is the threshold for GST registration?',
    'How to claim ITC on capital goods?',
    'What are the penalties for late GST filing?',
  ];

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, margin:0, marginBottom:6 }}>Tax Agent</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', margin:0 }}>GST computation, TDS management, and AI-powered Indian tax advisory</p>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['dashboard','📊 Dashboard'],['gst','🧾 GST Computation'],['tds','📋 TDS Management'],['calendar','📅 Tax Calendar'],['ask','🤖 Ask Tax Agent']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'10px 20px', fontSize:14, fontWeight:600, background:'none', border:'none', cursor:'pointer', borderBottom: tab===id ? '2px solid #6C63FF' : '2px solid transparent', color: tab===id ? '#1B4FD8' : 'var(--text-secondary)', marginBottom:-1 }}>{label}</button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && dashboard && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
            <KPI label="GST Collected (Month)" value={INR(dashboard.current_month?.gst_collected)} color="#22C98A" sub="Output tax" />
            <KPI label="ITC Available" value={INR(dashboard.current_month?.itc_available)} color="#4FC3F7" sub="Input tax credit" />
            <KPI label="Net GST Payable" value={INR(dashboard.current_month?.net_gst_payable)} color={dashboard.current_month?.net_gst_payable > 0 ? '#FF5C5C' : '#22C98A'} sub="After ITC offset" />
            <KPI label="TDS Paid (YTD)" value={INR(dashboard.tds_paid_ytd)} color="#6C63FF" sub="Financial year" />
          </div>

          {dashboard.overdue_filings > 0 && (
            <div style={{ padding:'14px 16px', borderRadius:10, background:'#FF5C5C12', border:'1px solid #FF5C5C30', marginBottom:20 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#FF5C5C' }}>⚠ {dashboard.overdue_filings} overdue filing{dashboard.overdue_filings > 1 ? 's' : ''} — file immediately to avoid penalties</div>
            </div>
          )}

          <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', background:'var(--surface-3)', fontSize:13, fontWeight:700, color:'var(--text-muted)' }}>FILING STATUS</div>
            {dashboard.filings?.map((f, i) => (
              <div key={i} style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{f.filing_type} — {f.period_month ? `${f.period_month}/${f.period_year}` : f.period_year}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>Due: {new Date(f.due_date).toLocaleDateString('en-IN')} · Liability: {INR(f.tax_liability)}</div>
                </div>
                <span style={{ padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:700, background: f.status==='filed' ? '#22C98A20' : new Date(f.due_date) < new Date() ? '#FF5C5C20' : '#F5A62320', color: f.status==='filed' ? '#22C98A' : new Date(f.due_date) < new Date() ? '#FF5C5C' : '#F5A623' }}>
                  {f.status==='filed' ? 'Filed' : new Date(f.due_date) < new Date() ? 'Overdue' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GST Computation */}
      {tab === 'gst' && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:20, alignItems:'center' }}>
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-primary)', fontSize:13 }}>
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-primary)', fontSize:13 }}>
              {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={loadGST} disabled={gstLoading} style={{ padding:'8px 20px', borderRadius:8, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#1B4FD8,#3B82F6)', color:'#fff', border:'none', cursor:'pointer' }}>
              {gstLoading ? 'Computing...' : 'Compute GST'}
            </button>
          </div>

          {gst && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
                <KPI label="Output Tax (Sales)" value={INR(gst.net_liability?.gross_gst)} color="#22C98A" sub={`${gst.outward_supplies?.count} invoices`} />
                <KPI label="Input Tax Credit" value={INR(gst.net_liability?.less_itc)} color="#4FC3F7" sub={`${gst.inward_supplies?.count} invoices`} />
                <KPI label="Net Payable" value={INR(gst.net_liability?.net_payable)} color={gst.net_liability?.net_payable > 0 ? '#FF5C5C' : '#22C98A'} sub="CGST + SGST" />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
                  <div style={{ padding:'12px 16px', background:'#22C98A20', fontSize:13, fontWeight:700, color:'#22C98A' }}>GSTR-3B SUMMARY</div>
                  <div style={{ padding:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ fontSize:13, color:'var(--text-secondary)' }}>Table 3.1 — Outward Supplies</span>
                      <span style={{ fontSize:13, fontWeight:600 }}>{INR(gst.gstr3b_summary?.table_3_1?.taxable_value)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ fontSize:13, color:'var(--text-secondary)' }}>CGST collected</span>
                      <span style={{ fontSize:13 }}>{INR(gst.net_liability?.gross_gst/2)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ fontSize:13, color:'var(--text-secondary)' }}>SGST collected</span>
                      <span style={{ fontSize:13 }}>{INR(gst.net_liability?.gross_gst/2)}</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                      <span style={{ fontSize:13, color:'var(--text-secondary)' }}>Table 4 — ITC Available</span>
                      <span style={{ fontSize:13, color:'#4FC3F7' }}>({INR(gst.net_liability?.less_itc)})</span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:'2px solid var(--border)' }}>
                      <span style={{ fontSize:14, fontWeight:700 }}>Net Tax Payable</span>
                      <span style={{ fontSize:15, fontWeight:800, color: gst.net_liability?.net_payable > 0 ? '#FF5C5C' : '#22C98A' }}>{INR(gst.net_liability?.net_payable)}</span>
                    </div>
                  </div>
                </div>
                <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
                  <div style={{ padding:'12px 16px', background:'var(--surface-3)', fontSize:13, fontWeight:700, color:'var(--text-muted)' }}>OUTWARD INVOICES</div>
                  <div style={{ maxHeight:220, overflowY:'auto' }}>
                    {gst.outward_supplies?.invoices?.length === 0 ? (
                      <div style={{ padding:20, textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>No invoices for this period</div>
                    ) : gst.outward_supplies?.invoices?.slice(0,10).map((inv, i) => (
                      <div key={i} style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', fontSize:12 }}>
                        <div>
                          <div style={{ fontWeight:600 }}>{inv.invoice_number}</div>
                          <div style={{ color:'var(--text-muted)' }}>{inv.customer_name}</div>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontWeight:600 }}>{INR(inv.total_amount)}</div>
                          <div style={{ color:'var(--text-muted)' }}>GST: {INR(inv.tax_amount)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TDS */}
      {tab === 'tds' && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:20, alignItems:'center' }}>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-primary)', fontSize:13 }}>
              {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={loadTDS} disabled={tdsLoading} style={{ padding:'8px 20px', borderRadius:8, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#1B4FD8,#3B82F6)', color:'#fff', border:'none', cursor:'pointer' }}>
              {tdsLoading ? 'Computing...' : 'Compute TDS'}
            </button>
          </div>

          {tds && (
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
                <KPI label="Salary TDS (Sec 192)" value={INR(tds.salary_tds?.total_tds_deducted)} color="#6C63FF" sub={`${tds.salary_tds?.employees?.length} employees`} />
                <KPI label="Vendor TDS (Sec 194C)" value={INR(tds.vendor_tds?.total_applicable)} color="#F5A623" sub={`${tds.vendor_tds?.vendors?.length} vendors`} />
                <KPI label="Total TDS Payable" value={INR(tds.challan_summary?.total)} color="#FF5C5C" sub={`Due ${tds.challan_summary?.due_date}`} />
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
                  <div style={{ padding:'12px 16px', background:'#6C63FF20', fontSize:13, fontWeight:700, color:'#1B4FD8' }}>SALARY TDS — Section 192</div>
                  <div style={{ maxHeight:300, overflowY:'auto' }}>
                    {tds.salary_tds?.employees?.length === 0 ? (
                      <div style={{ padding:20, textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>No employee data</div>
                    ) : tds.salary_tds?.employees?.map((e, i) => (
                      <div key={i} style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', fontSize:12 }}>
                        <div><div style={{ fontWeight:600 }}>{e.name}</div><div style={{ color:'var(--text-muted)' }}>PAN: {e.pan}</div></div>
                        <div style={{ textAlign:'right' }}><div style={{ fontWeight:600 }}>{INR(e.tds_deducted)}</div><div style={{ color:'var(--text-muted)' }}>Sec {e.section}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
                  <div style={{ padding:'12px 16px', background:'#F5A62320', fontSize:13, fontWeight:700, color:'#F5A623' }}>VENDOR TDS — Section 194C</div>
                  <div style={{ maxHeight:300, overflowY:'auto' }}>
                    {tds.vendor_tds?.vendors?.length === 0 ? (
                      <div style={{ padding:20, textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>No vendor payments above threshold</div>
                    ) : tds.vendor_tds?.vendors?.map((v, i) => (
                      <div key={i} style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', fontSize:12 }}>
                        <div><div style={{ fontWeight:600 }}>{v.name}</div><div style={{ color:'var(--text-muted)' }}>Paid: {INR(v.amount_paid)}</div></div>
                        <div style={{ textAlign:'right' }}><div style={{ fontWeight:600, color:'#FF5C5C' }}>{INR(v.tds_applicable)}</div><div style={{ color:'var(--text-muted)' }}>{v.rate}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calendar */}
      {tab === 'calendar' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
          {calendar.map((c, i) => (
            <div key={i} style={{ borderRadius:12, border:'1px solid var(--border)', padding:16, background:'var(--surface-2)' }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#1B4FD8', marginBottom:6 }}>{c.date}</div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:4 }}>{c.filing}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>Section: {c.section}</div>
              <div style={{ padding:'6px 10px', borderRadius:6, background:'#FF5C5C12', border:'1px solid #FF5C5C25', fontSize:12, color:'#FF5C5C' }}>
                Penalty: {c.penalty}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ask Tax Agent */}
      {tab === 'ask' && (
        <div style={{ maxWidth:700 }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
            {TAX_QS.map(q => (
              <button key={q} onClick={() => setQuestion(q)} style={{ padding:'6px 14px', borderRadius:100, fontSize:12, background:'#6C63FF12', color:'#3B82F6', border:'1px solid #6C63FF25', cursor:'pointer' }}>{q}</button>
            ))}
          </div>
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key==='Enter' && askTax()} placeholder="Ask any Indian tax question..." style={{ flex:1, padding:'12px 16px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-primary)', fontSize:14, outline:'none' }} />
            <button onClick={askTax} disabled={!question.trim()||asking} style={{ padding:'12px 20px', borderRadius:10, fontSize:14, fontWeight:700, background: (!question.trim()||asking) ? 'var(--surface-3)' : 'linear-gradient(135deg,#1B4FD8,#3B82F6)', color: (!question.trim()||asking) ? 'var(--text-muted)' : '#fff', border:'none', cursor: (!question.trim()||asking) ? 'not-allowed':'pointer' }}>
              {asking ? '...' : 'Ask'}
            </button>
          </div>
          {answer && (
            <div style={{ padding:'16px 20px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)', fontSize:14, lineHeight:1.7, whiteSpace:'pre-wrap' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#22C98A', marginBottom:8, letterSpacing:'0.06em' }}>TAX AGENT</div>
              {answer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
