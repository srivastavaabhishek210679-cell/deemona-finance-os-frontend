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
// Cash outlook banner: shown on the Executive Dashboard only when the 90-day forecast shows a shortfall
// (or when no opening cash balance has been entered). Healthy = a single quiet line with a link.
function CashOutlookBanner() {
  const [d, setD] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () => get('/api/cash-forecast?days=90').then(r => { if (alive && r && r.scenarios) setD(r); }).catch(() => {});
    load();
    window.addEventListener('deemona_data_change', load);
    return () => { alive = false; window.removeEventListener('deemona_data_change', load); };
  }, []);
  if (!d) return null;
  const fmt = s => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const base = d.scenarios.find(s => s.key === 'base');
  const slow = d.scenarios.find(s => s.key === 'slow30');
  const link = <a href="/cash-forecast" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline', marginLeft: 8 }}>See forecast</a>;
  const box = (bg, bd, fg) => ({ background: bg, border: '1px solid ' + bd, color: fg, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 });
  if (!d.has_cash_entry) return <div style={box('#FFFBEB', '#FDE68A', '#92400E')}>No cash balance entered yet, so the cash forecast cannot start from your real position. <a href="/cash-balance" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>Add it</a></div>;
  if (base.first_negative) return <div style={box('#FEF2F2', '#FECACA', '#B91C1C')}><b>Cash shortfall ahead.</b> On the invoices and bills you have booked, cash runs out on {fmt(base.first_negative)} and falls to {INR(base.lowest.amount)}. You would need about {INR(base.shortfall)} of cover.{link}</div>;
  if (slow && slow.first_negative) return <div style={box('#FFFBEB', '#FDE68A', '#92400E')}><b>Watch collections.</b> Cash holds as booked, but if customers pay 30 days late it runs out on {fmt(slow.first_negative)} (low of {INR(slow.lowest.amount)}).{link}</div>;
  return <div style={box('#F0FDF4', '#BBF7D0', '#15803D')}>Cash outlook healthy: positive through the next 90 days, even if customers pay 30 days late. Lowest point {INR(Math.min(base.lowest.amount, slow ? slow.lowest.amount : base.lowest.amount))}.{link}</div>;
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /*real-data*/
    Promise.all([
      get('/api/cash-position'),
      get('/api/accounting/ar-invoices'),
      get('/api/accounting/ap-invoices'),
      get('/api/payroll/employees'),
      get('/api/crm/leads'),
      get('/api/projects'),
      get('/api/cash-forecast?days=90'),
      get('/api/cfo/metrics/pnl_trend?months=13'),
      get('/api/cfo/metrics/working_capital'),
      get('/api/cfo/metrics/cash_runway'),
    ]).then(([cashPos, ar, ap, employees, crm, projects, forecast, pnl, wc, runway]) => {
      setData({ cashPos, ar, ap, employees, crm, projects, forecast, pnl, wc, runway });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
      <div style={{ fontSize: 13 }}>Loading dashboard...</div>
    </div>
  );

  // ── Computed values ───────────────────────────────────────────
  const cashEntered = !!data?.cashPos?.current?.has_entry;
  const cash = cashEntered ? parseFloat(data.cashPos.current.amount) : 0;
  const num = v => parseFloat(v || 0) || 0;
  const arLive = (data?.ar?.invoices || []).filter(i => !['draft', 'cancelled'].includes(i.status));
  const apLive = (data?.ap?.invoices || []).filter(i => !['draft', 'rejected'].includes(i.status));
  const arTotal = arLive.reduce((a, i) => a + num(i.total_amount), 0);
  const arPending = arLive.reduce((a, i) => a + num(i.balance_due), 0);
  const arPendingCount = arLive.filter(i => num(i.balance_due) > 0).length;
  const apTotal = apLive.reduce((a, i) => a + num(i.total_amount), 0);
  const apPending = apLive.reduce((a, i) => a + num(i.balance_due), 0);
  const apPendingList = apLive.filter(i => num(i.balance_due) > 0);
  const apPendingCount = apPendingList.length;
  const empCount = (data?.employees?.employees || []).length;
  const leads = data?.crm?.leads || [];
  const pipelineValue = leads.reduce((s, l) => s + parseFloat(l.value || 0) * parseFloat(l.probability || 0) / 100, 0);
  const projectsList = data?.projects?.projects || [];
  const activeProjects = projectsList.filter(p => p.status === 'active').length;

  // ── Profit and loss from invoices, payroll and approved claims (the same basis as the CFO agent) ──
  const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthLabel = ym => MN[parseInt(String(ym).slice(5, 7), 10) - 1] + ' ' + String(ym).slice(0, 4);
  const pnlMonths = (data?.pnl?.months || []).map(m => ({ ...m, cost: num(m.vendor_costs) + num(m.payroll) + num(m.expense_claims) }));
  const activeMonths = pnlMonths.filter(m => num(m.revenue) > 0 || m.cost > 0);
  const lastM = activeMonths.length ? activeMonths[activeMonths.length - 1] : null;
  const prevM = lastM ? pnlMonths[pnlMonths.indexOf(lastM) - 1] : null;
  const mom = (cur, prev) => (prev && num(prev) > 0 ? ((num(cur) - num(prev)) / num(prev)) * 100 : null);
  const trendProps = p => (p === null || p === undefined || (lastM && lastM.partial_month) ? {} : { trend: Math.abs(p).toFixed(1) + '%', trendUp: p >= 0 });
  const lastLabel = lastM ? monthLabel(lastM.month) + (lastM.partial_month ? ' (so far)' : '') : 'No data yet';
  const revTrend = pnlMonths.slice(-6).map(m => ({ label: MN[parseInt(m.month.slice(5, 7), 10) - 1] + (m.partial_month ? '*' : ''), value: num(m.revenue) }));
  const fyStart = (() => { const d = new Date(); return (d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1) + '-04'; })();
  const fyMonths = pnlMonths.filter(m => m.month >= fyStart && (num(m.revenue) > 0 || m.cost > 0));
  const fyRev = fyMonths.reduce((a, m) => a + num(m.revenue), 0);
  const fyCost = fyMonths.reduce((a, m) => a + m.cost, 0);
  const fcBase = (data?.forecast?.scenarios || []).find(x => x.key === 'base');
  const cashTrend = fcBase ? fcBase.points.filter((_, i) => i % 11 === 10).map(p => ({ label: new Date(p.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), value: p.close })) : [];
  const runwayDays = data?.runway?.runway_days_gross;
  const payrollTotal = (data?.employees?.employees || []).reduce((a, e) => a + num(e.basic_salary), 0);

  // ── AR by status ──────────────────────────────────────────────
  const arByStatus = [
    { label: 'Collected', value: Math.max(0, arTotal - arPending), color: '#059669' },
    { label: 'Outstanding', value: arPending, color: '#1B4FD8' },
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
          <div style={{ fontSize: 12, color: '#64748B' }}>As of {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
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
        <CashOutlookBanner />

        {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div>
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              <KPICard label="Cash Position"    value={cashEntered ? INR(cash) : '—'} color="#1B4FD8" icon="🏦" sub={cashEntered ? 'Entered balance plus recorded flows' : 'Enter a balance on Cash Balance'} />
              <KPICard label="AR Outstanding"   value={INR(arPending)}     color="#D97706" icon="📄" sub={arPendingCount + ' invoice(s) with a balance'} />
              <KPICard label="AP Outstanding"   value={INR(apPending)}     color="#DC2626" icon="📋" sub={apPendingCount + ' bill(s) with a balance'} />
              <KPICard label="Pipeline Value"   value={INR(pipelineValue)} color="#059669" icon="🎯" sub="Weighted by probability" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
              <KPICard label="Monthly Revenue"  value={lastM ? INR(lastM.revenue) : '—'}  color="#059669" icon="📈" sub={lastLabel} {...(lastM ? trendProps(mom(lastM.revenue, prevM && prevM.revenue)) : {})} />
              <KPICard label="Monthly Expenses" value={lastM ? INR(lastM.cost) : '—'}  color="#DC2626" icon="📉" sub={lastLabel} {...(lastM ? trendProps(mom(lastM.cost, prevM && prevM.cost)) : {})} />
              <KPICard label="Net Profit"       value={lastM ? INR(lastM.ebitda) : '—'}  color="#1B4FD8" icon="💹" sub={lastLabel} />
              <KPICard label="Gross Margin"     value={lastM && lastM.gross_margin_pct != null ? lastM.gross_margin_pct + '%' : '—'}  color="#7C3AED" icon="📊" sub={lastLabel} />
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              {/* Revenue Trend */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Revenue Trend</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Invoiced revenue, last 6 months (* = month so far)</div>
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
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>90-day forecast from booked invoices and bills</div>
                {cashTrend.length > 1 ? <LineChart data={cashTrend} height={100} color="#059669" /> : (
                  <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 12 }}>No data</div>
                )}
                <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 7, background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>{runwayDays != null ? 'Runway: about ' + (runwayDays / 30).toFixed(1) + ' months' : 'Runway: not available yet'}</div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>{runwayDays != null ? 'Cash divided by average monthly outflow' : 'Needs payments or costs recorded'}</div>
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
              <KPICard label="Total Revenue YTD"   value={INR(fyRev)}  color="#059669" icon="📈" sub={'Financial year from April ' + fyStart.slice(0, 4)} />
              <KPICard label="Total Expenses YTD"  value={INR(fyCost)}  color="#DC2626" icon="📉" sub="Vendor bills, payroll, approved claims" />
              <KPICard label="Net Profit YTD"      value={INR(fyRev - fyCost)}  color="#1B4FD8" icon="💹" sub={fyRev > 0 ? (((fyRev - fyCost) / fyRev) * 100).toFixed(1) + '% margin' : 'No revenue yet'} />
            </div>

            {/* Monthly P&L Table */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Monthly P&L Summary</div>
                <ExportToolbar title="P&L Summary"
                  onPrint={() => printSection('pnl-table', 'Monthly P&L Summary')}
                  onCSV={() => downloadCSV(fyMonths.map(m => ({ Month: monthLabel(m.month), Revenue: num(m.revenue), Expenses: m.cost, Profit: num(m.ebitda), Margin: m.ebitda_margin_pct != null ? m.ebitda_margin_pct + '%' : '' })), 'pnl-summary.csv')}
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
                    {fyMonths.length === 0 && <tr><td colSpan={5} style={{ padding: 16, color: '#64748B' }}>No invoices, payroll or claims recorded this financial year yet.</td></tr>}
                    {fyMonths.map(m => ({ month: monthLabel(m.month) + (m.partial_month ? ' (so far)' : ''), rev: num(m.revenue), exp: m.cost })).map((row, i) => {
                      const profit = row.rev - row.exp;
                      const margin = row.rev > 0 ? ((profit / row.rev) * 100).toFixed(1) : '0.0';
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
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Vendor Bills - Pending Payments</div>
                <ExportToolbar title="AP Invoices"
                  onPrint={() => printSection('ap-table', 'AP Invoices')}
                  onCSV={() => downloadCSV(apPendingList.map(i => ({ Invoice: i.invoice_number, Amount: i.total_amount, Status: i.status, Due: i.due_date })), 'ap-pending.csv')}
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
                    {apPendingList.map((inv, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '9px 14px', color: '#1B4FD8', fontWeight: 600 }}>{inv.invoice_number}</td>
                        <td style={{ padding: '9px 14px', color: '#334155' }}>{inv.vendor_name || 'Vendor'}</td>
                        <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0A1628' }}>{INR(inv.balance_due)}</td>
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
              <KPICard label="Total Employees"   value={empCount} color="#1B4FD8" icon="👥" sub="Active headcount" />
              <KPICard label="Monthly Payroll"   value={INR(payrollTotal)}     color="#DC2626" icon="💳" sub="Total basic salary" />
              <KPICard label="Active Projects"   value={activeProjects} color="#059669" icon="📋" sub={`of ${projectsList.length} total`} />
              <KPICard label="Overdue Receivables" value={INR(data?.wc?.ar_overdue)}  color="#D97706" icon="⏰" sub="Customer invoices past due date" />
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
