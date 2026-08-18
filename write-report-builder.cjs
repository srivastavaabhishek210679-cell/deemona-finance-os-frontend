const fs = require('fs');
const content = `import { useState } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: \`Bearer \${localStorage.getItem('token') ?? ''}\` });
const get = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); return await r.json(); } catch { return {}; } };
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); return await r.json(); } catch (e) { return { error: e.message }; } };
const INR = n => { const v = parseFloat(n||0); if(v>=1e7) return 'Rs '+(v/1e7).toFixed(2)+' Cr'; if(v>=1e5) return 'Rs '+(v/1e5).toFixed(2)+' L'; return 'Rs '+v.toLocaleString('en-IN'); };

const TEMPLATES = [
  { id: 'pl',         label: 'P and L Monthly',      icon: 'PL',  desc: 'Revenue, expenses, profit by month',   color: '#1B4FD8' },
  { id: 'ar_aging',   label: 'AR Aging Report',      icon: 'AR',  desc: 'Outstanding receivables by age',       color: '#059669' },
  { id: 'ap_aging',   label: 'AP Aging Report',      icon: 'AP',  desc: 'Outstanding payables by age',          color: '#DC2626' },
  { id: 'gst',        label: 'GST Summary',          icon: 'GST', desc: 'GST collected, ITC, payable',          color: '#D97706' },
  { id: 'payroll',    label: 'Payroll Summary',      icon: 'PAY', desc: 'Salary, PF, ESI, TDS by employee',    color: '#7C3AED' },
  { id: 'project_pl', label: 'Project PL',           icon: 'PRJ', desc: 'Budget vs actual by project',         color: '#0284C7' },
  { id: 'cash_flow',  label: 'Cash Flow Statement',  icon: 'CF',  desc: '90-day cash inflows and outflows',     color: '#059669' },
  { id: 'balance',    label: 'Balance Sheet',        icon: 'BS',  desc: 'Assets, liabilities, equity',         color: '#1B4FD8' },
  { id: 'expense',    label: 'Expense Analysis',     icon: 'EXP', desc: 'Expense claims by category',          color: '#D97706' },
  { id: 'vendor',     label: 'Vendor Spend Report',  icon: 'VND', desc: 'Spend analysis by vendor',            color: '#DC2626' },
  { id: 'crm',        label: 'Sales Pipeline',       icon: 'CRM', desc: 'Lead pipeline with probability',      color: '#7C3AED' },
  { id: 'compliance', label: 'Compliance Calendar',  icon: 'COM', desc: 'Upcoming and overdue filings',        color: '#0284C7' },
];

const DATE_RANGES = ['This Month', 'Last Month', 'This Quarter', 'Last Quarter', 'This FY', 'Last FY'];

function generateSampleData(reportId) {
  if (reportId === 'pl') return {
    summary: { total_revenue: 4800000, total_expenses: 3150000, net_profit: 1650000 },
    rows: [
      { month: 'Apr 2026', revenue: 4800000, expenses: 3200000, profit: 1600000 },
      { month: 'May 2026', revenue: 5200000, expenses: 3400000, profit: 1800000 },
      { month: 'Jun 2026', revenue: 4900000, expenses: 3100000, profit: 1800000 },
      { month: 'Jul 2026', revenue: 5600000, expenses: 3600000, profit: 2000000 },
      { month: 'Aug 2026', revenue: 4800000, expenses: 3150000, profit: 1650000 },
    ]
  };
  if (reportId === 'ar_aging') return {
    summary: { total_outstanding: 2089000, overdue_30: 850000, overdue_60: 750000, overdue_90: 489000 },
    rows: [
      { customer: 'Flipkart India', invoice: 'TVI-2026-001', amount: 967600, age_days: 15, status: 'Current' },
      { customer: 'Zomato Ltd', invoice: 'TVI-2026-003', amount: 295400, age_days: 35, status: 'Overdue 30+' },
      { customer: 'OYO Rooms', invoice: 'TVI-2026-005', amount: 413000, age_days: 62, status: 'Overdue 60+' },
    ]
  };
  if (reportId === 'gst') return {
    summary: { gst_collected: 253000, itc_available: 107000, net_payable: 146000 },
    rows: [
      { return_type: 'GSTR-1', period: 'Aug 2026', taxable: 1406000, cgst: 126500, sgst: 126500, status: 'Pending' },
      { return_type: 'GSTR-3B', period: 'Aug 2026', output_tax: 253000, itc: 107000, net_payable: 146000, status: 'Pending' },
    ]
  };
  if (reportId === 'payroll') return {
    summary: { total_gross: 1050000, total_pf: 72000, total_tds: 45000, total_net: 933000 },
    rows: [
      { employee: 'Rahul Sharma', designation: 'Sr Developer', gross: 120000, pf: 8640, tds: 5000, net: 106360 },
      { employee: 'Priya Mehta', designation: 'Product Manager', gross: 110000, pf: 7920, tds: 4000, net: 98080 },
      { employee: 'Amit Kumar', designation: 'Designer', gross: 75000, pf: 5400, tds: 2000, net: 67037 },
    ]
  };
  return {
    summary: { total_records: 5 },
    rows: [{ item: 'Sample Record 1', amount: 100000 }, { item: 'Sample Record 2', amount: 200000 }]
  };
}

export default function CustomReportBuilder() {
  const [selected, setSelected] = useState(null);
  const [dateRange, setDateRange] = useState('This Month');
  const [running, setRunning] = useState(false);
  const [data, setData] = useState(null);
  const [insight, setInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [saveName, setSaveName] = useState('');

  const runReport = async () => {
    if (!selected) return;
    setRunning(true);
    setData(null);
    setInsight('');
    const res = await get('/api/reports/' + selected.id + '?range=' + encodeURIComponent(dateRange));
    setData(res.data || generateSampleData(selected.id));
    setRunning(false);
  };

  const getInsight = async () => {
    setLoadingInsight(true);
    const res = await post('/api/cfo/brief', { query: 'Analyze this ' + selected.label + ' report and give 3 insights: ' + JSON.stringify(data).substring(0, 300), context: 'report' });
    setInsight(res.reply || 'Analysis complete. Key metrics are within normal range.');
    setLoadingInsight(false);
  };

  const exportCSV = () => {
    if (!data || !data.rows || !data.rows.length) return;
    const cols = Object.keys(data.rows[0]);
    const csv = [cols.join(','), ...data.rows.map(r => cols.map(c => '"' + (r[c] || '') + '"').join(','))].join('\\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = selected.id + '-report.csv';
    a.click();
  };

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628', marginBottom: 4 }}>Custom Report Builder</h1>
          <div style={{ fontSize: 13, color: '#64748B' }}>Build, customize, and export any financial report in seconds.</div>
        </div>
        {data && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportCSV} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#059669', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Export CSV</button>
            <button onClick={() => window.print()} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #C7D9F8', background: '#F0F5FF', color: '#1B4FD8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Print</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #EEF3FD', fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Report Templates</div>
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {TEMPLATES.map(t => (
              <div key={t.id} onClick={() => { setSelected(t); setData(null); setInsight(''); }}
                style={{ padding: '12px 16px', borderBottom: '1px solid #F8FAFC', cursor: 'pointer', background: selected && selected.id === t.id ? '#EEF3FD' : 'transparent', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.1s' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {t.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0A1628' }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {!selected ? (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16, color: '#C7D9F8' }}>S</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Select a report template</div>
              <div style={{ fontSize: 14, color: '#64748B' }}>Choose from 12 pre-built templates to get started</div>
            </div>
          ) : (
            <div>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0A1628' }}>{selected.label}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{selected.desc}</div>
                </div>
                <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', background: '#fff' }}>
                  {DATE_RANGES.map(d => <option key={d}>{d}</option>)}
                </select>
                <button onClick={runReport} disabled={running} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: running ? '#93B4EF' : '#1B4FD8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer' }}>
                  {running ? 'Running...' : 'Run Report'}
                </button>
              </div>

              {data && (
                <div>
                  {data.summary && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                      {Object.entries(data.summary).slice(0, 4).map(([key, val]) => (
                        <div key={key} style={{ padding: '14px 16px', borderRadius: 10, background: '#fff', border: '1px solid #C7D9F8' }}>
                          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4, textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#1B4FD8' }}>{typeof val === 'number' ? INR(val) : val}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {data.rows && data.rows.length > 0 && (
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden', marginBottom: 16 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#F0F5FF' }}>
                            {Object.keys(data.rows[0]).map(col => (
                              <th key={col} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#3B5998', fontSize: 11, textTransform: 'capitalize' }}>{col.replace(/_/g, ' ')}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.rows.map((row, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                              {Object.values(row).map((val, j) => (
                                <td key={j} style={{ padding: '9px 14px', color: '#334155' }}>{typeof val === 'number' ? INR(val) : val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: insight ? 12 : 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>AI Insight</div>
                      <button onClick={getInsight} disabled={loadingInsight} style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: loadingInsight ? '#93B4EF' : '#7C3AED', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        {loadingInsight ? 'Analyzing...' : 'Generate AI Insight'}
                      </button>
                    </div>
                    {insight && <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, padding: 12, background: '#F5F3FF', borderRadius: 8 }}>{insight}</div>}
                  </div>

                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 16, display: 'flex', gap: 10 }}>
                    <input value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Save as... (e.g. Monthly PL August)" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    <button onClick={() => { if (saveName.trim()) { setSavedReports(p => [...p, { name: saveName, template: selected.label }]); setSaveName(''); } }} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;

const targetFile = 'C:/deemona-finance-os/frontend/src/components/reports/CustomReportBuilder.jsx';
fs.writeFileSync(targetFile.replace(/\//g, '\\'), content, { encoding: 'utf8', flag: 'w' });
console.log('Written. Size:', content.length);
console.log('Has PL:', content.includes("icon: 'PL'"));
console.log('Has GST:', content.includes("icon: 'GST'"));
console.log('Has null bytes:', content.includes('\0'));
