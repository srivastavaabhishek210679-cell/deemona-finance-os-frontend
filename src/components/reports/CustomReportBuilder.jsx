// v3
import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); const t = await r.text(); return JSON.parse(t); } catch { return {}; } };
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); const t = await r.text(); return JSON.parse(t); } catch (e) { return { error: e.message }; } };

const INR = n => { const v = parseFloat(n||0); if(v>=1e7) return 'Rs '+(v/1e7).toFixed(2)+' Cr'; if(v>=1e5) return 'Rs '+(v/1e5).toFixed(2)+' L'; return 'Rs '+v.toLocaleString('en-IN'); };

const REPORT_TEMPLATES = [
  { id: 'pl_monthly',    name: 'P&L Monthly',         icon: 'ðŸ“ˆ', desc: 'Revenue, expenses, profit by month',  module: 'statements' },
  { id: 'ar_aging',      name: 'AR Aging Report',      icon: 'ðŸ“„', desc: 'Outstanding receivables by age',       module: 'accounting' },
  { id: 'ap_aging',      name: 'AP Aging Report',      icon: 'ðŸ“‹', desc: 'Outstanding payables by age',          module: 'accounting' },
  { id: 'gst_summary',   name: 'GST Summary',          icon: 'ðŸ§¾', desc: 'GST collected, ITC, payable',          module: 'tax' },
  { id: 'payroll_sum',   name: 'Payroll Summary',      icon: 'ðŸ’°', desc: 'Salary, PF, ESI, TDS by employee',     module: 'payroll' },
  { id: 'project_pnl',   name: 'Project P&L',          icon: 'ðŸ“Š', desc: 'Budget vs actual by project',           module: 'projects' },
  { id: 'cash_flow',     name: 'Cash Flow',            icon: 'ðŸ’³', desc: 'Monthly cash inflow and outflow',       module: 'treasury' },
  { id: 'vendor_spend',  name: 'Vendor Spend',         icon: 'ðŸ­', desc: 'Spend analysis by vendor and category', module: 'procurement' },
  { id: 'sales_pipeline',name: 'Sales Pipeline',       icon: 'ðŸŽ¯', desc: 'CRM pipeline by stage and value',      module: 'crm' },
  { id: 'compliance_cal',name: 'Compliance Calendar',  icon: 'âš–ï¸', desc: 'All statutory deadlines and status',  module: 'compliance' },
  { id: 'expense_report',name: 'Expense Analysis',     icon: 'ðŸ’¸', desc: 'Employee expenses by category/dept',   module: 'expenses' },
  { id: 'asset_register',name: 'Asset Register',       icon: 'ðŸ–¥', desc: 'Fixed assets with depreciation',       module: 'assets' },
];

const COLUMNS_MAP = {
  statements: ['Month', 'Revenue', 'COGS', 'Gross Profit', 'Gross Margin %', 'Expenses', 'Net Profit', 'Net Margin %'],
  accounting:  ['Invoice #', 'Customer/Vendor', 'Date', 'Due Date', 'Amount', 'Paid', 'Balance', 'Days Outstanding', 'Status'],
  tax:         ['Period', 'CGST Collected', 'SGST Collected', 'IGST', 'ITC Available', 'Net Payable', 'Status'],
  payroll:     ['Employee', 'Department', 'Basic', 'HRA', 'Allowances', 'Gross', 'PF', 'ESI', 'TDS', 'Net'],
  projects:    ['Project', 'Client', 'Budget', 'Spent', 'Billed', 'Margin %', 'Status'],
  treasury:    ['Month', 'Opening', 'Inflows', 'Outflows', 'Closing', 'Net Change'],
  procurement: ['Vendor', 'Category', 'Invoices', 'Total Spend', '% of Total'],
  crm:         ['Lead', 'Company', 'Stage', 'Value', 'Probability', 'Weighted Value', 'Expected Close'],
  compliance:  ['Item', 'Category', 'Frequency', 'Due Date', 'Status', 'Penalty'],
  expenses:    ['Claim #', 'Employee', 'Department', 'Category', 'Amount', 'Status', 'Date'],
  assets:      ['Code', 'Asset Name', 'Category', 'Purchase Price', 'Current Value', 'Depreciation', 'Location', 'Status'],
};

function downloadCSV(data, filename) {
  if (!data?.length) return;
  const cols = Object.keys(data[0]);
  const csv = [cols.join(','), ...data.map(r => cols.map(c => `"${String(r[c]||'').replace(/"/g,'""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
}

function printReport(title, data) {
  const w = window.open('', '_blank');
  const headers = data[0] ? Object.keys(data[0]) : [];
  w.document.write(`<html><head><title>${title}</title><style>
    body{font-family:Inter,sans-serif;padding:24px;color:#0A1628}
    h2{color:#1B4FD8;margin-bottom:4px}
    .meta{font-size:12px;color:#64748B;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#EEF3FD;padding:10px;text-align:left;font-weight:700;border-bottom:2px solid #C7D9F8;color:#1B4FD8}
    td{padding:9px 10px;border-bottom:1px solid #E2E8F0}
    tr:nth-child(even) td{background:#F8FAFC}
    .footer{margin-top:20px;font-size:11px;color:#94A3B8;text-align:center}
  </style></head><body>
    <h2>${title}</h2>
    <div class="meta">Generated: ${new Date().toLocaleString('en-IN')} | Deemona AI Finance OS</div>
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${data.map(r => `<tr>${headers.map(h => `<td>${r[h]||''}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    <div class="footer">Confidential â€” Deemona Technologies</div>
  </body></html>`);
  w.document.close();
  w.print();
}

export default function CustomReportBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0]); // Apr 1
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [running, setRunning] = useState(false);
  const [reportName, setReportName] = useState('');
  const [savedReports, setSavedReports] = useState([
    { name: 'Monthly P&L FY27', template: 'pl_monthly', lastRun: '11 Aug 2026' },
    { name: 'AR Aging - August', template: 'ar_aging', lastRun: '10 Aug 2026' },
    { name: 'Vendor Spend Q1', template: 'vendor_spend', lastRun: '1 Aug 2026' },
  ]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState('');

  useEffect(() => {
    if (selectedTemplate) {
      const cols = COLUMNS_MAP[selectedTemplate.module] || [];
      setSelectedColumns(cols);
      setReportName(selectedTemplate.name);
    }
  }, [selectedTemplate]);

  const runReport = async () => {
    if (!selectedTemplate) return;
    setRunning(true);
    setReportData([]);
    setAiInsight('');

    try {
      let data = [];
      const module = selectedTemplate.module;

      if (module === 'accounting') {
        const res = await get(`/api/accounting/${selectedTemplate.id === 'ar_aging' ? 'ar' : 'ap'}`);
        const invoices = res.invoices || [];
        data = invoices.map(inv => {
          const daysDue = Math.floor((new Date() - new Date(inv.due_date)) / 86400000);
          return {
            'Invoice #': inv.invoice_number,
            'Customer/Vendor': inv.customer_name || inv.vendor_name || 'â€”',
            'Date': new Date(inv.date).toLocaleDateString('en-IN'),
            'Due Date': new Date(inv.due_date).toLocaleDateString('en-IN'),
            'Amount': INR(inv.total_amount),
            'Paid': INR(inv.paid_amount),
            'Balance': INR(inv.total_amount - inv.paid_amount),
            'Days Outstanding': daysDue > 0 ? daysDue + ' days' : 'Not due',
            'Status': inv.status,
          };
        });
      } else if (module === 'payroll') {
        const res = await get('/api/payroll/employees');
        const emps = res.employees || [];
        data = emps.map(e => {
          const basic = parseFloat(e.basic_salary || 0);
          const hra = parseFloat(e.hra || 0);
          const special = parseFloat(e.special_allowance || 0);
          const other = parseFloat(e.other_allowances || 0);
          const gross = basic + hra + special + other;
          const pf = e.pf_applicable ? Math.round(basic * 0.12) : 0;
          const esi = (e.esic_applicable && gross <= 21000) ? Math.round(gross * 0.0075) : 0;
          const annualTaxable = gross * 12 - pf * 12 - 50000;
          let annualTDS = 0;
          if (annualTaxable > 1200000) annualTDS = 127500 + (annualTaxable - 1200000) * 0.25;
          else if (annualTaxable > 1000000) annualTDS = 77500 + (annualTaxable - 1000000) * 0.20;
          else if (annualTaxable > 750000) annualTDS = 27500 + (annualTaxable - 750000) * 0.15;
          else if (annualTaxable > 500000) annualTDS = 2500 + (annualTaxable - 500000) * 0.10;
          const tds = e.tds_applicable ? Math.round(Math.max(0, annualTDS) / 12) : 0;
          return {
            'Employee': `${e.first_name} ${e.last_name}`,
            'Department': e.department,
            'Basic': INR(basic),
            'HRA': INR(hra),
            'Allowances': INR(special + other),
            'Gross': INR(gross),
            'PF': INR(pf),
            'ESI': INR(esi),
            'TDS': INR(tds),
            'Net': INR(gross - pf - esi - tds),
          };
        });
      } else if (module === 'projects') {
        const res = await get('/api/projects');
        data = (res.projects || []).map(p => {
          const margin = p.billed > 0 ? ((p.billed - p.spent) / p.billed * 100).toFixed(1) : '0';
          return {
            'Project': p.name,
            'Client': p.client_name,
            'Budget': INR(p.budget),
            'Spent': INR(p.spent),
            'Billed': INR(p.billed),
            'Margin %': margin + '%',
            'Status': p.status,
          };
        });
      } else if (module === 'crm') {
        const res = await get('/api/crm/leads');
        data = (res.leads || []).map(l => ({
          'Lead': l.name,
          'Company': l.company,
          'Stage': l.stage,
          'Value': INR(l.value),
          'Probability': l.probability + '%',
          'Weighted Value': INR(parseFloat(l.value) * parseFloat(l.probability) / 100),
          'Expected Close': new Date(l.expected_close).toLocaleDateString('en-IN'),
        }));
      } else if (module === 'assets') {
        const res = await get('/api/assets');
        data = (res.assets || []).map(a => ({
          'Code': a.asset_code,
          'Asset Name': a.name,
          'Category': a.category,
          'Purchase Price': INR(a.purchase_price),
          'Current Value': INR(a.current_value),
          'Depreciation': INR(a.purchase_price - a.current_value),
          'Location': a.location,
          'Status': a.status,
        }));
      } else if (module === 'compliance') {
        const res = await get('/api/compliance');
        data = (res.items || []).map(c => ({
          'Item': c.title,
          'Category': c.category,
          'Frequency': c.frequency,
          'Due Date': new Date(c.due_date).toLocaleDateString('en-IN'),
          'Status': c.status,
          'Penalty': c.penalty_if_missed ? INR(c.penalty_if_missed) : 'â€”',
        }));
      } else if (module === 'expenses') {
        const res = await get('/api/expenses/claims');
        data = (res.claims || []).map(c => ({
          'Claim #': c.claim_number,
          'Employee': c.employee_name,
          'Department': c.department,
          'Category': 'Various',
          'Amount': INR(c.total_amount),
          'Status': c.status,
          'Date': new Date(c.date).toLocaleDateString('en-IN'),
        }));
      } else {
        // Default: P&L-style monthly data
        data = [
          { 'Month': 'April 2026', 'Revenue': 'Rs 48.00 L', 'COGS': 'Rs 18.00 L', 'Gross Profit': 'Rs 30.00 L', 'Gross Margin %': '62.5%', 'Expenses': 'Rs 13.50 L', 'Net Profit': 'Rs 16.50 L', 'Net Margin %': '34.4%' },
          { 'Month': 'May 2026', 'Revenue': 'Rs 52.00 L', 'COGS': 'Rs 19.50 L', 'Gross Profit': 'Rs 32.50 L', 'Gross Margin %': '62.5%', 'Expenses': 'Rs 14.50 L', 'Net Profit': 'Rs 18.00 L', 'Net Margin %': '34.6%' },
          { 'Month': 'June 2026', 'Revenue': 'Rs 49.00 L', 'COGS': 'Rs 18.40 L', 'Gross Profit': 'Rs 30.60 L', 'Gross Margin %': '62.4%', 'Expenses': 'Rs 12.60 L', 'Net Profit': 'Rs 18.00 L', 'Net Margin %': '36.7%' },
          { 'Month': 'July 2026', 'Revenue': 'Rs 56.00 L', 'COGS': 'Rs 21.00 L', 'Gross Profit': 'Rs 35.00 L', 'Gross Margin %': '62.5%', 'Expenses': 'Rs 15.00 L', 'Net Profit': 'Rs 20.00 L', 'Net Margin %': '35.7%' },
          { 'Month': 'August 2026', 'Revenue': 'Rs 48.00 L', 'COGS': 'Rs 18.00 L', 'Gross Profit': 'Rs 30.00 L', 'Gross Margin %': '62.5%', 'Expenses': 'Rs 13.50 L', 'Net Profit': 'Rs 16.50 L', 'Net Margin %': '34.4%' },
        ];
      }

      // Filter by selected columns
      if (selectedColumns.length > 0 && data.length > 0) {
        data = data.map(row => {
          const filtered = {};
          selectedColumns.forEach(col => { if (row[col] !== undefined) filtered[col] = row[col]; });
          return filtered;
        });
      }

      setReportData(data);
    } catch (err) {
      console.error(err);
    }
    setRunning(false);
  };

  const getAIInsight = async () => {
    if (!reportData.length) return;
    setAiLoading(true);
    const res = await post('/api/cfo/brief', {
      prompt: `Analyze this ${selectedTemplate?.name} report data for Deemona Technologies and provide 3-4 key insights and recommendations. Data: ${JSON.stringify(reportData.slice(0,10))}. Be specific with numbers. Plain text only.`
    });
    setAiInsight(res.text || '');
    setAiLoading(false);
  };

  const toggleColumn = (col) => {
    setSelectedColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628', marginBottom: 4 }}>Custom Report Builder</h1>
          <div style={{ fontSize: 13, color: '#64748B' }}>Build, customize, and export any financial report in seconds.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Left sidebar */}
        <div>
          {/* Report templates */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #EEF3FD', fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Report Templates</div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {REPORT_TEMPLATES.map(tpl => (
                <div key={tpl.id} onClick={() => setSelectedTemplate(tpl)}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F8FAFC', background: selectedTemplate?.id === tpl.id ? '#EEF3FD' : 'transparent', borderLeft: selectedTemplate?.id === tpl.id ? '3px solid #1B4FD8' : '3px solid transparent', transition: 'all 0.1s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 16 }}>{tpl.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: selectedTemplate?.id === tpl.id ? '#1B4FD8' : '#0A1628' }}>{tpl.name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', paddingLeft: 24 }}>{tpl.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved reports */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #EEF3FD', fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Saved Reports</div>
            {savedReports.map((r, i) => (
              <div key={i} onClick={() => { const tpl = REPORT_TEMPLATES.find(t => t.id === r.template); if (tpl) setSelectedTemplate(tpl); }}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: i < savedReports.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1B4FD8', marginBottom: 2 }}>{r.name}</div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>Last run: {r.lastRun}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main area */}
        <div>
          {selectedTemplate ? (
            <>
              {/* Report config */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1628' }}>{selectedTemplate.icon} {selectedTemplate.name}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={reportName} onChange={e => setReportName(e.target.value)} placeholder="Report name" style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none', width: 160 }} />
                    <button onClick={() => setSavedReports(p => [{name: reportName, template: selectedTemplate.id, lastRun: new Date().toLocaleDateString('en-IN')}, ...p])}
                      style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #C7D9F8', background: '#F0F5FF', color: '#1B4FD8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>ðŸ’¾ Save</button>
                  </div>
                </div>

                {/* Date range */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>From Date</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>To Date</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none' }} />
                  </div>
                  <div>
                    {['This Month', 'Last Quarter', 'This FY'].map(p => (
                      <button key={p} onClick={() => {
                        const now = new Date();
                        if (p === 'This Month') { setDateFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]); setDateTo(now.toISOString().split('T')[0]); }
                        else if (p === 'This FY') { setDateFrom(new Date(now.getFullYear(), 3, 1).toISOString().split('T')[0]); setDateTo(now.toISOString().split('T')[0]); }
                      }} style={{ marginRight: 4, padding: '6px 10px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 11, cursor: 'pointer', color: '#64748B' }}>{p}</button>
                    ))}
                  </div>
                </div>

                {/* Column selection */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>Columns to Include</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(COLUMNS_MAP[selectedTemplate.module] || []).map(col => (
                      <button key={col} onClick={() => toggleColumn(col)}
                        style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${selectedColumns.includes(col) ? '#1B4FD8' : '#E2E8F0'}`, background: selectedColumns.includes(col) ? '#EEF3FD' : '#F8FAFC', color: selectedColumns.includes(col) ? '#1B4FD8' : '#64748B', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        {selectedColumns.includes(col) ? 'âœ“ ' : ''}{col}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={runReport} disabled={running}
                  style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: running ? '#93B4EF' : '#1B4FD8', color: '#fff', fontSize: 14, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer' }}>
                  {running ? 'â³ Generating...' : 'â–¶ Run Report'}
                </button>
              </div>

              {/* Report output */}
              {reportData.length > 0 && (
                <>
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #EEF3FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>{reportName} â€” {reportData.length} rows</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => downloadCSV(reportData, reportName.replace(/\s/g,'_')+'.csv')} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#059669', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>â¬‡ CSV</button>
                        <button onClick={() => printReport(reportName, reportData)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #C7D9F8', background: '#F0F5FF', color: '#1B4FD8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>ðŸ–¨ Print</button>
                        <button onClick={getAIInsight} disabled={aiLoading} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #DDD6FE', background: '#F5F3FF', color: '#7C3AED', fontSize: 11, fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer' }}>ðŸ§  AI Insight</button>
                      </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#F0F5FF' }}>
                            {Object.keys(reportData[0]).map(col => (
                              <th key={col} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#3B5998', fontSize: 11, whiteSpace: 'nowrap' }}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((row, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                              {Object.values(row).map((val, j) => (
                                <td key={j} style={{ padding: '9px 14px', color: '#334155' }}>{String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {aiInsight && (
                    <div style={{ background: '#F5F3FF', borderRadius: 12, border: '1px solid #DDD6FE', padding: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', marginBottom: 8 }}>ðŸ§  AI Analysis</div>
                      <div style={{ fontSize: 13, color: '#4C1D95', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiInsight}</div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>ðŸ“Š</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#334155', marginBottom: 6 }}>Select a report template</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>Choose from 12 pre-built templates or build your own custom report</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/ /   f o r c e   r e d e p l o y   0 8 / 1 5 / 2 0 2 6   1 8 : 1 4 : 1 5  
 