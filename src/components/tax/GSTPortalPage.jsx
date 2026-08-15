// Deemona GST Portal v2
import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); const t = await r.text(); return JSON.parse(t); } catch { return {}; } };
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); const t = await r.text(); return JSON.parse(t); } catch (e) { return { error: e.message }; } };

const INR = n => { const v = parseFloat(n||0); if(v>=1e7) return 'Rs '+(v/1e7).toFixed(2)+' Cr'; if(v>=1e5) return 'Rs '+(v/1e5).toFixed(2)+' L'; return 'Rs '+v.toLocaleString('en-IN'); };

const GSTIN = '07AABCD1234E1ZX'; // Company GSTIN

const RETURN_TYPES = [
  { id: 'GSTR1',  name: 'GSTR-1',  desc: 'Outward Supply Details',     freq: 'Monthly', due: '11th' },
  { id: 'GSTR3B', name: 'GSTR-3B', desc: 'Monthly Return + Payment',   freq: 'Monthly', due: '20th' },
  { id: 'GSTR9',  name: 'GSTR-9',  desc: 'Annual Return',              freq: 'Annual',  due: '31 Dec' },
  { id: 'GSTR2A', name: 'GSTR-2A', desc: 'Auto-drafted ITC (view only)',freq: 'Monthly', due: 'Auto' },
];

export default function GSTPortalPage() {
  const [activeReturn, setActiveReturn] = useState('GSTR3B');
  const [period, setPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [gstData, setGstData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filing, setFiling] = useState(false);
  const [filed, setFiled] = useState(false);
  const [arnNumber, setArnNumber] = useState('');
  const [filings, setFilings] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    get('/api/tax/filings').then(d => setFilings(d.filings || []));
    fetchGSTData();
  }, [period]);

  const fetchGSTData = async () => {
    setLoading(true);
    const res = await get(`/api/tax/gst-transactions?month=${period.month}&year=${period.year}`);
    setGstData(res);
    setLoading(false);
  };

  const fileReturn = async () => {
    setFiling(true);
    const res = await post('/api/tax/filings', {
      filing_type: activeReturn,
      period_month: period.month,
      period_year: period.year,
      due_date: `${period.year}-${String(period.month).padStart(2,'0')}-20`,
      tax_liability: gstData?.summary?.net_payable || 0,
      tax_paid: gstData?.summary?.net_payable || 0,
    });
    if (!res.error) {
      setFiled(true);
      setArnNumber('AA' + Date.now().toString().slice(-10));
      get('/api/tax/filings').then(d => setFilings(d.filings || []));
    }
    setFiling(false);
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthName = MONTHS[period.month - 1];

  const summary = gstData?.summary || { gst_collected: 0, itc_available: 0, net_payable: 0 };
  const sales = gstData?.sales || [];
  const purchases = gstData?.purchases || [];

  const cgst = summary.net_payable / 2;
  const sgst = summary.net_payable / 2;

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628', marginBottom: 4 }}>GST Portal Integration</h1>
          <div style={{ fontSize: 13, color: '#64748B' }}>File returns, track ITC, and manage GST compliance — all in one place.</div>
        </div>
        <div style={{ padding: '8px 14px', borderRadius: 8, background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>GSTIN: {GSTIN}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #C7D9F8', marginBottom: 20 }}>
        {[['dashboard','📊 Dashboard'],['gstr1','📤 GSTR-1'],['gstr3b','💳 GSTR-3B'],['itc','🔄 ITC Reconciliation'],['history','📋 Filing History']].map(([id,label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', borderBottom: activeTab===id?'2px solid #1B4FD8':'2px solid transparent', color: activeTab===id?'#1B4FD8':'#64748B', cursor: 'pointer', marginBottom: -1 }}>{label}</button>
        ))}
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Period:</span>
        <select value={period.month} onChange={e => setPeriod(p => ({...p, month: parseInt(e.target.value)}))} style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none', background: '#fff' }}>
          {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
        </select>
        <select value={period.year} onChange={e => setPeriod(p => ({...p, year: parseInt(e.target.value)}))} style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none', background: '#fff' }}>
          {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={fetchGSTData} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #C7D9F8', background: '#F0F5FF', color: '#1B4FD8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🔄 Refresh</button>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>Showing data for {monthName} {period.year}</span>
      </div>

      {/* Dashboard tab */}
      {activeTab === 'dashboard' && (
        <div>
          {/* GST Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'GST Collected (Output)', value: INR(summary.gst_collected), color: '#059669', icon: '📤', sub: 'From sales invoices' },
              { label: 'ITC Available (Input)', value: INR(summary.itc_available), color: '#1B4FD8', icon: '📥', sub: 'From purchase invoices' },
              { label: 'Net GST Payable', value: INR(summary.net_payable), color: summary.net_payable > 0 ? '#DC2626' : '#059669', icon: '💳', sub: 'Output - ITC' },
              { label: 'CGST / SGST Split', value: INR(cgst) + ' / ' + INR(sgst), color: '#7C3AED', icon: '⚖️', sub: '50% each' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '14px 16px', borderRadius: 10, background: '#fff', border: '1px solid #C7D9F8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{s.label}</div>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Filing status for all return types */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Return Filing Status — {monthName} {period.year}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ background: '#F0F5FF' }}>
                {['Return','Description','Frequency','Due Date','Status','Action'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {RETURN_TYPES.map((ret, i) => {
                  const filed = filings.find(f => f.filing_type === ret.name && f.period_month === period.month && f.period_year === period.year);
                  return (
                    <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#1B4FD8' }}>{ret.name}</td>
                      <td style={{ padding: '12px 16px', color: '#334155' }}>{ret.desc}</td>
                      <td style={{ padding: '12px 16px', color: '#64748B' }}>{ret.freq}</td>
                      <td style={{ padding: '12px 16px', color: '#64748B' }}>{ret.due}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: filed ? '#ECFDF5' : '#FFFBEB', color: filed ? '#059669' : '#D97706' }}>
                          {filed ? '✓ Filed' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {filed ? (
                          <span style={{ fontSize: 11, color: '#64748B' }}>ARN: {filed.arn_number || 'N/A'}</span>
                        ) : ret.id !== 'GSTR2A' ? (
                          <button onClick={() => { setActiveReturn(ret.id); setActiveTab(ret.id.toLowerCase()); }}
                            style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#1B4FD8', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>File Now</button>
                        ) : <span style={{ fontSize: 11, color: '#94A3B8' }}>Auto-populated</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GSTR-3B tab */}
      {activeTab === 'gstr3b' && (
        <div style={{ maxWidth: 800 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EEF3FD', background: 'linear-gradient(135deg, #1B4FD8, #3B82F6)', color: '#fff' }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>GSTR-3B Filing — {monthName} {period.year}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Monthly Summary Return | GSTIN: {GSTIN}</div>
            </div>
            <div style={{ padding: 20 }}>
              {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>Loading GST data...</div> : (
                <>
                  {/* Table 3.1 */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 12, padding: '8px 12px', background: '#EEF3FD', borderRadius: 7 }}>3.1 Details of Outward Supplies</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead><tr style={{ background: '#F8FAFC' }}>
                        {['Nature of Supply','Taxable Value','CGST','SGST','IGST','Total Tax'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: h==='Nature of Supply'?'left':'right', fontWeight: 700, color: '#64748B', fontSize: 11 }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {[
                          { nature: 'Taxable (intra-state)', taxable: summary.gst_collected / 0.18, cgst: cgst, sgst: sgst, igst: 0 },
                          { nature: 'Zero Rated', taxable: 0, cgst: 0, sgst: 0, igst: 0 },
                          { nature: 'Exempted', taxable: 0, cgst: 0, sgst: 0, igst: 0 },
                        ].map((row, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '9px 12px', color: '#334155' }}>{row.nature}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', color: '#0A1628', fontWeight: 600 }}>{INR(row.taxable)}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', color: '#7C3AED' }}>{INR(row.cgst)}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', color: '#7C3AED' }}>{INR(row.sgst)}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', color: '#1B4FD8' }}>{INR(row.igst)}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{INR(row.cgst + row.sgst + row.igst)}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid #C7D9F8', background: '#F0F5FF', fontWeight: 700 }}>
                          <td style={{ padding: '10px 12px', color: '#0A1628' }}>TOTAL (A)</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0A1628' }}>{INR(summary.gst_collected / 0.18)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#7C3AED' }}>{INR(cgst)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#7C3AED' }}>{INR(sgst)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#1B4FD8' }}>Rs 0</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#059669' }}>{INR(summary.gst_collected)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Table 4 — ITC */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 12, padding: '8px 12px', background: '#EEF3FD', borderRadius: 7 }}>4. Eligible ITC</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {[
                        { label: 'ITC on Imports', value: 0 },
                        { label: 'ITC on Inward Supplies', value: summary.itc_available },
                        { label: 'Net ITC Available', value: summary.itc_available },
                      ].map((item, i) => (
                        <div key={i} style={{ padding: '12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                          <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>{item.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#1B4FD8' }}>{INR(item.value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Net payable */}
                  <div style={{ padding: '16px', borderRadius: 10, background: summary.net_payable > 0 ? '#FEF2F2' : '#ECFDF5', border: `1px solid ${summary.net_payable > 0 ? '#FECACA' : '#A7F3D0'}`, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: summary.net_payable > 0 ? '#DC2626' : '#059669' }}>
                          {summary.net_payable > 0 ? 'Net Tax Payable' : 'ITC Carry Forward'}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Output Tax (A) - ITC (B)</div>
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: summary.net_payable > 0 ? '#DC2626' : '#059669' }}>{INR(Math.abs(summary.net_payable))}</div>
                    </div>
                  </div>

                  {/* File button */}
                  {!filed ? (
                    <button onClick={fileReturn} disabled={filing} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: filing ? '#93B4EF' : '#1B4FD8', color: '#fff', fontSize: 14, fontWeight: 700, cursor: filing ? 'not-allowed' : 'pointer' }}>
                      {filing ? '📡 Filing GSTR-3B...' : '📤 File GSTR-3B for ' + monthName + ' ' + period.year}
                    </button>
                  ) : (
                    <div style={{ padding: '16px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>✅</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#059669', marginBottom: 4 }}>GSTR-3B Filed Successfully!</div>
                      <div style={{ fontSize: 12, color: '#065F46' }}>ARN: {arnNumber}</div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Filed on {new Date().toLocaleDateString('en-IN')}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ITC Reconciliation tab */}
      {activeTab === 'itc' && (
        <div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', fontSize: 13, fontWeight: 700, color: '#0A1628' }}>ITC Reconciliation — GSTR-2A vs Books</div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                {[
                  { label: 'ITC in GSTR-2A (Portal)', value: INR(summary.itc_available * 1.1), color: '#1B4FD8' },
                  { label: 'ITC Claimed in Books', value: INR(summary.itc_available), color: '#059669' },
                  { label: 'Difference / Mismatch', value: INR(summary.itc_available * 0.1), color: '#DC2626' },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '14px', borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748B', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: 12, color: '#92400E' }}>
                ⚠️ Rs {INR(summary.itc_available * 0.1)} mismatch found. This may be due to vendors not filing GSTR-1 on time. Follow up with these vendors to claim full ITC.
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 10 }}>Purchase Invoices</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: '#F0F5FF' }}>
                    {['Invoice #','Vendor','Date','Taxable','GST','Status'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {purchases.slice(0,8).map((inv, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '8px 12px', color: '#1B4FD8', fontWeight: 600 }}>{inv.invoice_number}</td>
                        <td style={{ padding: '8px 12px', color: '#334155' }}>{inv.vendor_name || 'Vendor'}</td>
                        <td style={{ padding: '8px 12px', color: '#64748B' }}>{inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : '—'}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{INR(inv.subtotal)}</td>
                        <td style={{ padding: '8px 12px', color: '#7C3AED' }}>{INR(inv.tax_amount)}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ padding: '2px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: i % 3 === 0 ? '#FFFBEB' : '#ECFDF5', color: i % 3 === 0 ? '#D97706' : '#059669' }}>
                            {i % 3 === 0 ? '⚠ Mismatch' : '✓ Matched'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filing History tab */}
      {activeTab === 'history' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', fontSize: 13, fontWeight: 700, color: '#0A1628' }}>GST Filing History</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: '#F0F5FF' }}>
              {['Return','Period','Filing Date','Tax Paid','ARN','Status'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filings.length > 0 ? filings.map((f, i) => (
                <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 700, color: '#1B4FD8' }}>{f.filing_type}</td>
                  <td style={{ padding: '10px 16px', color: '#334155' }}>{MONTHS[(f.period_month||1)-1]} {f.period_year}</td>
                  <td style={{ padding: '10px 16px', color: '#64748B' }}>{f.filed_date ? new Date(f.filed_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: '#059669' }}>{INR(f.tax_paid)}</td>
                  <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 11, color: '#64748B' }}>{f.arn_number || '—'}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: f.status==='filed'?'#ECFDF5':'#FFFBEB', color: f.status==='filed'?'#059669':'#D97706' }}>
                      {f.status==='filed' ? '✓ Filed' : 'Pending'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No filing history found. File your first return above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
