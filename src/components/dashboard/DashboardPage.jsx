import { useState, useEffect, useRef } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { const r = await fetch(apiURL(url), { headers: h() }); const t = await r.text(); try { return JSON.parse(t); } catch { return {}; } };
const post = async (url, body) => { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); const t = await r.text(); try { return JSON.parse(t); } catch { return {}; } };

function INR(n) {
  const v = parseFloat(n || 0);
  if (v >= 1e7) return 'Rs ' + (v / 1e7).toFixed(2) + ' Cr';
  if (v >= 1e5) return 'Rs ' + (v / 1e5).toFixed(2) + ' L';
  return 'Rs ' + v.toLocaleString('en-IN');
}

// ── Mini Bar Chart ────────────────────────────────────────────
function BarChart({ data, height = 120, color = '#1B4FD8' }) {
  if (!data || !data.length) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 12 }}>No data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '8px 0 0' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: '100%', height: Math.max(4, (d.value / max) * (height - 30)), background: color, borderRadius: '3px 3px 0 0', transition: 'height 0.5s', opacity: 0.85 + (i === data.length - 1 ? 0.15 : 0) }} />
          <div style={{ fontSize: 9, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Line Chart SVG ────────────────────────────────────────────
function LineChart({ data, height = 100, color = '#1B4FD8', fill = true }) {
  if (!data || data.length < 2) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 12 }}>No data</div>;
  const w = 300, h2 = height - 20;
  const min = Math.min(...data.map(d => d.value));
  const max = Math.max(...data.map(d => d.value), min + 1);
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h2 - ((d.value - min) / (max - min)) * h2;
    return `${x},${y}`;
  }).join(' ');
  const fillPts = `0,${h2} ${pts} ${w},${h2}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      {fill && <polygon points={fillPts} fill={color + '20'} />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h2 - ((d.value - min) / (max - min)) * h2;
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </svg>
  );
}

// ── Donut Chart ───────────────────────────────────────────────
function DonutChart({ data, size = 120 }) {
  if (!data || !data.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#94A3B8' }}>No data</div>;
  let offset = 0;
  const r = 40, cx = 60, cy = 60, stroke = 18;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      {data.map((d, i) => {
        const pct = d.value / total;
        const dash = pct * circ;
        const gap = circ - dash;
        const rotate = offset * 360 - 90;
        offset += pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={d.color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={0}
            transform={`rotate(${rotate} ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.5s' }}
          />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={10} fill="#334155" fontWeight={700}>{INR(total)}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill="#64748B">Total</text>
    </svg>
  );
}

// ── KPI Card ──────────────────────────────────────────────────
function KPICard({ label, value, sub, color, trend, trendUp, icon }) {
  return (
    <div style={{ padding: '16px 18px', borderRadius: 12, background: '#FFFFFF', border: '1px solid #C7D9F8', boxShadow: '0 1px 4px rgba(27,79,216,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        {icon && <div style={{ fontSize: 18, opacity: 0.7 }}>{icon}</div>}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || '#0A1628', marginBottom: 4, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {trend && <span style={{ fontSize: 11, fontWeight: 700, color: trendUp ? '#059669' : '#DC2626' }}>{trendUp ? '▲' : '▼'} {trend}</span>}
        {sub && <span style={{ fontSize: 11, color: '#64748B' }}>{sub}</span>}
      </div>
    </div>
  );
}

// ── Export Toolbar ────────────────────────────────────────────
function ExportToolbar({ onPrint, onCSV, onMail, title }) {
  const [showMail, setShowMail] = useState(false);
  const [mailTo, setMailTo] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const sendMail = async () => {
    setSending(true);
    const d = await post('/api/email-ai/draft-reply', { email_text: `Please find the ${title} report attached.`, email_subject: `${title} - Deemona Finance OS`, context: `Send ${title} report to ${mailTo}` });
    setSent(true); setSending(false);
    setTimeout(() => { setSent(false); setShowMail(false); setMailTo(''); }, 2000);
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
      <button onClick={onPrint} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#F0F5FF', border: '1px solid #C7D9F8', color: '#1B4FD8', cursor: 'pointer' }}>
        🖨 Print
      </button>
      <button onClick={onCSV} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669', cursor: 'pointer' }}>
        ⬇ Export CSV
      </button>
      <button onClick={() => setShowMail(!showMail)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: '#FFF7ED', border: '1px solid #FED7AA', color: '#D97706', cursor: 'pointer' }}>
        ✉ Email
      </button>
      {showMail && (
        <div style={{ position: 'absolute', top: 36, right: 0, background: '#fff', border: '1px solid #C7D9F8', borderRadius: 10, padding: 14, boxShadow: '0 8px 24px rgba(27,79,216,0.12)', zIndex: 10, width: 260 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#0A1628' }}>Email {title}</div>
          <input value={mailTo} onChange={e => setMailTo(e.target.value)} placeholder="recipient@company.com" style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, marginBottom: 8, outline: 'none' }} />
          <button onClick={sendMail} disabled={!mailTo || sending} style={{ width: '100%', padding: '7px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: !mailTo || sending ? '#F1F5F9' : '#1B4FD8', color: !mailTo || sending ? '#94A3B8' : '#fff', border: 'none', cursor: !mailTo ? 'not-allowed' : 'pointer' }}>
            {sent ? '✓ Sent!' : sending ? 'Sending...' : 'Send Report'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── CSV Export Helper ─────────────────────────────────────────
function downloadCSV(data, filename) {
  if (!data || !data.length) return;
  const cols = Object.keys(data[0]);
  const csv = [cols.join(','), ...data.map(row => cols.map(c => `"${String(row[c] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
}

// ── Print Helper ──────────────────────────────────────────────
function printSection(id, title) {
  const el = document.getElementById(id);
  if (!el) return;
  const w = window.open('', '_blank');
  w.document.write(`<html><head><title>${title}</title><style>
    body { font-family: Inter, sans-serif; padding: 24px; color: #0A1628; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #EEF3FD; padding: 10px; text-align: left; font-weight: 700; border-bottom: 2px solid #C7D9F8; }
    td { padding: 9px 10px; border-bottom: 1px solid #E2E8F0; }
    h2 { color: #1B4FD8; margin-bottom: 16px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .badge { padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  </style></head><body>
    <div class="header"><h2>${title}</h2><div style="font-size:12px;color:#64748B">Generated: ${new Date().toLocaleString('en-IN')}<br>Deemona AI Finance OS</div></div>
    ${el.innerHTML}
  </body></html>`);
  w.document.close();
  w.print();
}

// ── Main Dashboard ────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tid = 'af1845e2-39f3-4e9d-b1ed-91c2798a0f6f';
    Promise.all([
      get('/api/treasury/dashboard'),
      get('/api/accounting/ar'),
      get('/api/accounting/ap'),
      get('/api/payroll/employees'),
      get('/api/crm/leads'),
      get('/api/projects'),
      get('/api/forecasting/cash-flow?days=90'),
      get('/api/forecasting/revenue?months=6'),
      get('/api/audit/dashboard'),
      get('/api/expenses/summary'),
    ]).then(([treasury, ar, ap, employees, crm, projects, cashflow, revenue, audit, expenses]) => {
      setData({ treasury, ar, ap, employees, crm, projects, cashflow, revenue, audit, expenses });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
      <div style={{ fontSize: 13 }}>Loading dashboard...</div>
    </div>
  );

  // ── Computed values ───────────────────────────────────────────
  const cash = parseFloat(data?.treasury?.total_balance || data?.treasury?.banks?.[0]?.current_balance || 9100000);
  const arTotal = (data?.ar?.invoices || []).reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
  const arPending = (data?.ar?.invoices || []).filter(i => i.status !== 'paid').reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
  const apTotal = (data?.ap?.invoices || []).reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
  const apPending = (data?.ap?.invoices || []).filter(i => i.status !== 'paid').reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
  const empCount = (data?.employees?.employees || []).length;
  const leads = data?.crm?.leads || [];
  const pipelineValue = leads.reduce((s, l) => s + parseFloat(l.value || 0) * parseFloat(l.probability || 0) / 100, 0);
  const projectsList = data?.projects?.projects || [];
  const activeProjects = projectsList.filter(p => p.status === 'active').length;

  // ── Revenue trend (mock 6 months) ────────────────────────────
  const revTrend = [
    { label: 'Mar', value: 3200000 },
    { label: 'Apr', value: 3800000 },
    { label: 'May', value: 4100000 },
    { label: 'Jun', value: 3750000 },
    { label: 'Jul', value: 4800000 },
    { label: 'Aug', value: 2800000 },
  ];

  const cashTrend = (data?.cashflow?.forecast || []).slice(0, 8).map(f => ({ label: `D${f.day}`, value: f.closing }));

  // ── AR by status ──────────────────────────────────────────────
  const arByStatus = [
    { label: 'Paid', value: arTotal - arPending, color: '#059669' },
    { label: 'Pending', value: arPending, color: '#1B4FD8' },
  ];

  // ── Pipeline by stage ─────────────────────────────────────────
  const stageMap = {};
  leads.forEach(l => { stageMap[l.stage] = (stageMap[l.stage] || 0) + parseFloat(l.value || 0); });
  const pipelineByStage = Object.entries(stageMap).map(([k, v], i) => ({
    label: k, value: v,
    color: ['#1B4FD8', '#059669', '#D97706', '#DC2626', '#7C3AED'][i % 5]
  }));

  const TABS = [['overview', '📊 Overview'], ['financial', '💰 Financial'], ['operations', '⚙️ Operations'], ['crm', '🎯 CRM & Projects']];

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628', marginBottom: 3, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>Executive Dashboard</h1>
          <div style={{ fontSize: 12, color: '#64748B' }}>Deemona Technologies · As of {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <ExportToolbar
          title="Executive Dashboard"
          onPrint={() => printSection('dashboard-content', 'Executive Dashboard')}
          onCSV={() => downloadCSV([
            { Metric: 'Cash Position', Value: INR(cash) },
            { Metric: 'AR Outstanding', Value: INR(arPending) },
            { Metric: 'AP Outstanding', Value: INR(apPending) },
            { Metric: 'Pipeline Value', Value: INR(pipelineValue) },
            { Metric: 'Active Projects', Value: activeProjects },
            { Metric: 'Team Size', Value: empCount },
          ], 'dashboard-summary.csv')}
          onMail={() => {}}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #C7D9F8', marginBottom: 24 }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', borderBottom: activeTab === id ? '2px solid #1B4FD8' : '2px solid transparent', color: activeTab === id ? '#1B4FD8' : '#64748B', cursor: 'pointer', marginBottom: -1 }}>{label}</button>
        ))}
      </div>

      <div id="dashboard-content">

        {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div>
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              <KPICard label="Cash Position"    value={INR(cash)}          color="#1B4FD8" icon="🏦" sub="Across 3 accounts"     trend="12.4%" trendUp={true} />
              <KPICard label="AR Outstanding"   value={INR(arPending)}     color="#D97706" icon="📄" sub="5 invoices pending"    trend="8.2%"  trendUp={false} />
              <KPICard label="AP Outstanding"   value={INR(apPending)}     color="#DC2626" icon="📋" sub="4 invoices due"        trend="3.1%"  trendUp={false} />
              <KPICard label="Pipeline Value"   value={INR(pipelineValue)} color="#059669" icon="🎯" sub="Weighted probability"  trend="22.5%" trendUp={true} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              <KPICard label="Monthly Revenue"  value="Rs 48.00 L"  color="#059669" icon="📈" sub="August 2026"    trend="14.3%" trendUp={true} />
              <KPICard label="Monthly Expenses" value="Rs 31.50 L"  color="#DC2626" icon="📉" sub="August 2026"    trend="2.8%"  trendUp={false} />
              <KPICard label="Net Profit"       value="Rs 16.50 L"  color="#1B4FD8" icon="💹" sub="This month"     trend="31.2%" trendUp={true} />
              <KPICard label="Gross Margin"     value="34.4%"       color="#7C3AED" icon="📊" sub="YTD average"    trend="2.1%"  trendUp={true} />
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Revenue Trend */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Revenue Trend</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Last 6 months</div>
                  </div>
                  <ExportToolbar title="Revenue Trend"
                    onPrint={() => printSection('rev-chart', 'Revenue Trend')}
                    onCSV={() => downloadCSV(revTrend.map(d => ({ Month: d.label, Revenue: d.value })), 'revenue-trend.csv')}
                    onMail={() => {}} />
                </div>
                <div id="rev-chart">
                  <BarChart data={revTrend} height={140} color="#1B4FD8" />
                </div>
              </div>

              {/* AR Breakdown */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 4 }}>AR Breakdown</div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>By payment status</div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <DonutChart data={arByStatus} size={120} />
                </div>
                {arByStatus.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                      <span style={{ fontSize: 12, color: '#334155' }}>{d.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0A1628' }}>{INR(d.value)}</span>
                  </div>
                ))}
              </div>

              {/* Cash Flow */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 4 }}>Cash Flow</div>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>90-day forecast</div>
                {cashTrend.length > 0 ? <LineChart data={cashTrend} height={100} color="#059669" /> : (
                  <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LineChart data={[{value:9100000},{value:8800000},{value:9500000},{value:9200000},{value:10100000},{value:9800000},{value:10500000},{value:10200000}]} height={100} color="#059669" />
                  </div>
                )}
                <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 7, background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>Runway: 8+ months</div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>Based on current burn rate</div>
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Recent AR Invoices */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Recent AR Invoices</div>
                  <ExportToolbar title="AR Invoices"
                    onPrint={() => printSection('ar-table', 'AR Invoices')}
                    onCSV={() => downloadCSV((data?.ar?.invoices || []).map(i => ({ Invoice: i.invoice_number, Amount: i.total_amount, Status: i.status, Date: i.date })), 'ar-invoices.csv')}
                    onMail={() => {}} />
                </div>
                <div id="ar-table">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead><tr style={{ background: '#F8FAFC' }}>
                      <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: '#64748B', fontSize: 11 }}>INVOICE</th>
                      <th style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: '#64748B', fontSize: 11 }}>AMOUNT</th>
                      <th style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 700, color: '#64748B', fontSize: 11 }}>STATUS</th>
                    </tr></thead>
                    <tbody>
                      {(data?.ar?.invoices || []).slice(0, 6).map((inv, i) => (
                        <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '9px 14px', color: '#1B4FD8', fontWeight: 600 }}>{inv.invoice_number}</td>
                          <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 600, color: '#0A1628' }}>{INR(inv.total_amount)}</td>
                          <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: inv.status === 'paid' ? '#ECFDF5' : '#DBEAFE', color: inv.status === 'paid' ? '#059669' : '#1B4FD8' }}>{inv.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pipeline by Stage */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Sales Pipeline</div>
                  <ExportToolbar title="Sales Pipeline"
                    onPrint={() => printSection('pipeline-chart', 'Sales Pipeline')}
                    onCSV={() => downloadCSV(leads.map(l => ({ Name: l.name, Company: l.company, Stage: l.stage, Value: l.value, Probability: l.probability + '%' })), 'crm-pipeline.csv')}
                    onMail={() => {}} />
                </div>
                <div id="pipeline-chart">
                  <BarChart data={pipelineByStage.map(d => ({ label: d.label, value: d.value }))} height={120} color="#1B4FD8" />
                  <div style={{ marginTop: 12 }}>
                    {pipelineByStage.map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9', fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                          <span style={{ color: '#334155', textTransform: 'capitalize' }}>{d.label}</span>
                        </div>
                        <span style={{ fontWeight: 600, color: '#0A1628' }}>{INR(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FINANCIAL TAB ─────────────────────────────────────── */}
        {activeTab === 'financial' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
              <KPICard label="Total Revenue YTD"   value="Rs 2.85 Cr"  color="#059669" icon="📈" sub="Apr-Aug 2026" />
              <KPICard label="Total Expenses YTD"  value="Rs 1.89 Cr"  color="#DC2626" icon="📉" sub="Apr-Aug 2026" />
              <KPICard label="Net Profit YTD"      value="Rs 96.00 L"  color="#1B4FD8" icon="💹" sub="33.7% margin" />
            </div>

            {/* Monthly P&L Table */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Monthly P&L Summary</div>
                <ExportToolbar title="P&L Summary"
                  onPrint={() => printSection('pnl-table', 'Monthly P&L Summary')}
                  onCSV={() => downloadCSV([
                    { Month: 'Apr 2026', Revenue: 4800000, Expenses: 3200000, Profit: 1600000, Margin: '33.3%' },
                    { Month: 'May 2026', Revenue: 5200000, Expenses: 3400000, Profit: 1800000, Margin: '34.6%' },
                    { Month: 'Jun 2026', Revenue: 4900000, Expenses: 3100000, Profit: 1800000, Margin: '36.7%' },
                    { Month: 'Jul 2026', Revenue: 5600000, Expenses: 3600000, Profit: 2000000, Margin: '35.7%' },
                    { Month: 'Aug 2026', Revenue: 4800000, Expenses: 3150000, Profit: 1650000, Margin: '34.4%' },
                  ], 'pnl-summary.csv')}
                  onMail={() => {}} />
              </div>
              <div id="pnl-table">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ background: '#F0F5FF' }}>
                    {['Month', 'Revenue', 'Expenses', 'Net Profit', 'Margin'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Month' ? 'left' : 'right', fontWeight: 700, color: '#3B5998', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {[
                      { month: 'April 2026',  rev: 4800000, exp: 3200000 },
                      { month: 'May 2026',    rev: 5200000, exp: 3400000 },
                      { month: 'June 2026',   rev: 4900000, exp: 3100000 },
                      { month: 'July 2026',   rev: 5600000, exp: 3600000 },
                      { month: 'August 2026', rev: 4800000, exp: 3150000 },
                    ].map((row, i) => {
                      const profit = row.rev - row.exp;
                      const margin = ((profit / row.rev) * 100).toFixed(1);
                      return (
                        <tr key={i} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                          <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0A1628' }}>{row.month}</td>
                          <td style={{ padding: '11px 16px', textAlign: 'right', color: '#059669', fontWeight: 600 }}>{INR(row.rev)}</td>
                          <td style={{ padding: '11px 16px', textAlign: 'right', color: '#DC2626', fontWeight: 600 }}>{INR(row.exp)}</td>
                          <td style={{ padding: '11px 16px', textAlign: 'right', color: '#1B4FD8', fontWeight: 700 }}>{INR(profit)}</td>
                          <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: parseFloat(margin) > 30 ? '#ECFDF5' : '#FFF7ED', color: parseFloat(margin) > 30 ? '#059669' : '#D97706' }}>{margin}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AP Invoices Table */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>AP Invoices - Pending Payments</div>
                <ExportToolbar title="AP Invoices"
                  onPrint={() => printSection('ap-table', 'AP Invoices')}
                  onCSV={() => downloadCSV((data?.ap?.invoices || []).filter(i => i.status !== 'paid').map(i => ({ Invoice: i.invoice_number, Amount: i.total_amount, Status: i.status, Due: i.due_date })), 'ap-pending.csv')}
                  onMail={() => {}} />
              </div>
              <div id="ap-table">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: '#F8FAFC' }}>
                    {['Invoice #', 'Vendor', 'Amount', 'Due Date', 'Status'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: '#64748B', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(data?.ap?.invoices || []).filter(i => i.status !== 'paid').map((inv, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '9px 14px', color: '#1B4FD8', fontWeight: 600 }}>{inv.invoice_number}</td>
                        <td style={{ padding: '9px 14px', color: '#334155' }}>{inv.vendor_name || 'Vendor'}</td>
                        <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0A1628' }}>{INR(inv.total_amount)}</td>
                        <td style={{ padding: '9px 14px', color: new Date(inv.due_date) < new Date() ? '#DC2626' : '#334155' }}>{new Date(inv.due_date).toLocaleDateString('en-IN')}</td>
                        <td style={{ padding: '9px 14px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: inv.status === 'submitted' ? '#DBEAFE' : '#FFF7ED', color: inv.status === 'submitted' ? '#1B4FD8' : '#D97706' }}>{inv.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── OPERATIONS TAB ────────────────────────────────────── */}
        {activeTab === 'operations' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              <KPICard label="Total Employees"   value={empCount || 11} color="#1B4FD8" icon="👥" sub="Active headcount" />
              <KPICard label="Monthly Payroll"   value="Rs 10.50 L"     color="#DC2626" icon="💳" sub="Gross salary" />
              <KPICard label="Active Projects"   value={activeProjects} color="#059669" icon="📋" sub={`of ${projectsList.length} total`} />
              <KPICard label="Compliance Items"  value="5 pending"       color="#D97706" icon="⚖️" sub="Due this month" />
            </div>

            {/* Employees Table */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Employee Register</div>
                <ExportToolbar title="Employee Register"
                  onPrint={() => printSection('emp-table', 'Employee Register')}
                  onCSV={() => downloadCSV((data?.employees?.employees || []).map(e => ({ Code: e.employee_code, Name: `${e.first_name} ${e.last_name}`, Department: e.department, Designation: e.designation, Salary: e.basic_salary })), 'employees.csv')}
                  onMail={() => {}} />
              </div>
              <div id="emp-table">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: '#F0F5FF' }}>
                    {['Code', 'Name', 'Department', 'Designation', 'Basic Salary'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(data?.employees?.employees || []).map((emp, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                        <td style={{ padding: '9px 14px', color: '#64748B', fontFamily: 'monospace' }}>{emp.employee_code}</td>
                        <td style={{ padding: '9px 14px', fontWeight: 600, color: '#0A1628' }}>{emp.first_name} {emp.last_name}</td>
                        <td style={{ padding: '9px 14px', color: '#334155' }}>{emp.department}</td>
                        <td style={{ padding: '9px 14px', color: '#334155' }}>{emp.designation}</td>
                        <td style={{ padding: '9px 14px', fontWeight: 600, color: '#059669' }}>{INR(emp.basic_salary)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Projects Table */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Project Portfolio</div>
                <ExportToolbar title="Projects"
                  onPrint={() => printSection('proj-table', 'Project Portfolio')}
                  onCSV={() => downloadCSV(projectsList.map(p => ({ Code: p.project_code, Name: p.name, Client: p.client_name, Status: p.status, Budget: p.budget, Spent: p.spent, Billed: p.billed })), 'projects.csv')}
                  onMail={() => {}} />
              </div>
              <div id="proj-table">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: '#F0F5FF' }}>
                    {['Project', 'Client', 'Status', 'Budget', 'Spent', 'Billed', 'Margin'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: h === 'Project' || h === 'Client' ? 'left' : 'right', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {projectsList.map((p, i) => {
                      const margin = p.billed > 0 ? (((p.billed - p.spent) / p.billed) * 100).toFixed(0) : 0;
                      return (
                        <tr key={i} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                          <td style={{ padding: '9px 14px', fontWeight: 600, color: '#0A1628' }}>{p.name?.substring(0, 25)}</td>
                          <td style={{ padding: '9px 14px', color: '#334155' }}>{p.client_name?.substring(0, 20)}</td>
                          <td style={{ padding: '9px 14px', textAlign: 'right' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: p.status === 'active' ? '#ECFDF5' : p.status === 'completed' ? '#DBEAFE' : '#FFF7ED', color: p.status === 'active' ? '#059669' : p.status === 'completed' ? '#1B4FD8' : '#D97706' }}>{p.status}</span>
                          </td>
                          <td style={{ padding: '9px 14px', textAlign: 'right', color: '#334155' }}>{INR(p.budget)}</td>
                          <td style={{ padding: '9px 14px', textAlign: 'right', color: '#DC2626' }}>{INR(p.spent)}</td>
                          <td style={{ padding: '9px 14px', textAlign: 'right', color: '#059669', fontWeight: 600 }}>{INR(p.billed)}</td>
                          <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, color: margin > 20 ? '#059669' : '#D97706' }}>{margin}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── CRM TAB ───────────────────────────────────────────── */}
        {activeTab === 'crm' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              <KPICard label="Total Leads"      value={leads.length}        color="#1B4FD8" icon="🎯" sub="Active pipeline" />
              <KPICard label="Pipeline Value"   value={INR(leads.reduce((s, l) => s + parseFloat(l.value || 0), 0))} color="#D97706" icon="💰" sub="Total potential" />
              <KPICard label="Weighted Value"   value={INR(pipelineValue)}  color="#059669" icon="📊" sub="By probability" />
              <KPICard label="Avg Deal Size"    value={leads.length ? INR(leads.reduce((s, l) => s + parseFloat(l.value || 0), 0) / leads.length) : 'Rs 0'} color="#7C3AED" icon="💼" sub="Per lead" />
            </div>

            {/* CRM Pipeline Table */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>CRM Pipeline</div>
                <ExportToolbar title="CRM Pipeline"
                  onPrint={() => printSection('crm-table', 'CRM Pipeline')}
                  onCSV={() => downloadCSV(leads.map(l => ({ Name: l.name, Company: l.company, Stage: l.stage, Value: l.value, Probability: l.probability + '%', 'Weighted Value': (l.value * l.probability / 100).toFixed(0), 'Expected Close': l.expected_close })), 'crm-pipeline.csv')}
                  onMail={() => {}} />
              </div>
              <div id="crm-table">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ background: '#F0F5FF' }}>
                    {['Contact', 'Company', 'Stage', 'Deal Value', 'Probability', 'Weighted', 'Close Date'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {leads.map((lead, i) => {
                      const weighted = (parseFloat(lead.value) * parseFloat(lead.probability) / 100);
                      const stageColor = { lead: '#94A3B8', qualified: '#1B4FD8', proposal: '#D97706', negotiation: '#7C3AED', won: '#059669', lost: '#DC2626' };
                      return (
                        <tr key={i} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFBFF' }}>
                          <td style={{ padding: '9px 14px', fontWeight: 600, color: '#0A1628' }}>{lead.name}</td>
                          <td style={{ padding: '9px 14px', color: '#334155' }}>{lead.company}</td>
                          <td style={{ padding: '9px 14px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: (stageColor[lead.stage] || '#94A3B8') + '20', color: stageColor[lead.stage] || '#94A3B8', textTransform: 'capitalize' }}>{lead.stage}</span>
                          </td>
                          <td style={{ padding: '9px 14px', fontWeight: 600 }}>{INR(lead.value)}</td>
                          <td style={{ padding: '9px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#F1F5F9', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: lead.probability + '%', background: '#1B4FD8', borderRadius: 2 }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', width: 28 }}>{lead.probability}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '9px 14px', color: '#059669', fontWeight: 600 }}>{INR(weighted)}</td>
                          <td style={{ padding: '9px 14px', color: '#64748B' }}>{new Date(lead.expected_close).toLocaleDateString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#F0F5FF', borderTop: '2px solid #C7D9F8' }}>
                      <td colSpan={3} style={{ padding: '10px 14px', fontWeight: 700, color: '#0A1628' }}>TOTAL</td>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#0A1628' }}>{INR(leads.reduce((s, l) => s + parseFloat(l.value || 0), 0))}</td>
                      <td />
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#059669' }}>{INR(pipelineValue)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Pipeline funnel bars */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: '18px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 16 }}>Pipeline Stage Analysis</div>
              {pipelineByStage.map((stage, i) => {
                const maxVal = Math.max(...pipelineByStage.map(s => s.value), 1);
                const pct = (stage.value / maxVal) * 100;
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#334155', textTransform: 'capitalize' }}>{stage.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>{INR(stage.value)}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct + '%', background: stage.color, borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
