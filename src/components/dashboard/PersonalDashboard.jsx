import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); const t = await r.text(); return JSON.parse(t); } catch { return {}; } };

function INR(n) {
  const v = parseFloat(n || 0);
  if (v >= 1e7) return 'Rs ' + (v / 1e7).toFixed(2) + ' Cr';
  if (v >= 1e5) return 'Rs ' + (v / 1e5).toFixed(2) + ' L';
  return 'Rs ' + v.toLocaleString('en-IN');
}

// ── Shared mini components ────────────────────────────────────
function KPI({ label, value, sub, color, trend, trendUp, icon, size = 'md' }) {
  const fs = size === 'sm' ? 16 : size === 'lg' ? 28 : 22;
  return (
    <div style={{ padding: '14px 16px', borderRadius: 10, background: '#fff', border: '1px solid #C7D9F8', boxShadow: '0 1px 3px rgba(27,79,216,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        {icon && <span style={{ fontSize: 18, opacity: 0.7 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: fs, fontWeight: 800, color: color || '#0A1628', marginBottom: 4, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {trend && <span style={{ fontSize: 11, fontWeight: 700, color: trendUp ? '#059669' : '#DC2626' }}>{trendUp ? '▲' : '▼'} {trend}</span>}
        {sub && <span style={{ fontSize: 11, color: '#64748B' }}>{sub}</span>}
      </div>
    </div>
  );
}

function Card({ title, icon, children, action }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #EEF3FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>{title}</span>
        </div>
        {action && <button onClick={action.fn} style={{ fontSize: 11, color: '#1B4FD8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{action.label}</button>}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function ProgressBar({ value, max, color = '#1B4FD8', label, sub }) {
  const pct = Math.min(100, (value / Math.max(max, 1)) * 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#334155' }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0A1628' }}>{sub}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

function Badge({ text, color, bg }) {
  return <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: bg, color }}>{text}</span>;
}

// ── ROLE: CFO ─────────────────────────────────────────────────

  // Currency Rates Widget
  function CurrencyRates() {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
      get('/api/currency/list').then(d => {
        setRates(d.currencies || []);
        setLoading(false);
      }).catch(() => setLoading(false));
    }, []);
    if (loading) return null;
    const foreign = rates.filter(r => r.code !== 'INR').slice(0, 6);
    return (
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: '16px 18px', marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Live Exchange Rates</div>
          <div style={{ fontSize: 10, color: '#94A3B8' }}>Base: INR · Live rates</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {foreign.map(c => (
            <div key={c.code} style={{ padding: '10px 12px', borderRadius: 8, background: '#F0F5FF', border: '1px solid #DBEAFE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{c.flag}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1B4FD8' }}>{c.code}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0A1628' }}>Rs {parseFloat(c.rate_to_inr).toFixed(2)}</div>
              <div style={{ fontSize: 10, color: '#64748B' }}>1 {c.code} = Rs {parseFloat(c.rate_to_inr).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

function CFODashboard({ data }) {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const cash = 9100000;
  const ar = 2089100;
  const ap = 1279790;
  const leads = data?.crm?.leads || [];
  const projects = data?.projects?.projects || [];

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>{today}</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', marginBottom: 4, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>Good morning, CFO 👋</h1>
        <div style={{ fontSize: 13, color: '#3B5998' }}>Here's your financial command center for today.</div>
      </div>

      {/* Urgent alerts */}
      <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🚨</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>3 urgent actions needed: </span>
          <span style={{ fontSize: 13, color: '#334155' }}>GSTR-3B due in 9 days · TDS payment overdue · Runway alert: 8 months</span>
        </div>
        <button style={{ padding: '5px 12px', borderRadius: 6, background: '#DC2626', color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Review</button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <KPI label="Cash Position"   value={INR(cash)}  color="#1B4FD8" icon="🏦" sub="3 accounts"    trend="12.4%" trendUp={true} />
        <KPI label="AR Outstanding"  value={INR(ar)}    color="#D97706" icon="📄" sub="5 invoices"   trend="8.2%"  trendUp={false} />
        <KPI label="AP Due"          value={INR(ap)}    color="#DC2626" icon="📋" sub="4 invoices"   trend="3.1%"  trendUp={false} />
        <KPI label="Net Profit MTD"  value="Rs 16.50 L" color="#059669" icon="💹" sub="34.4% margin" trend="31.2%" trendUp={true} />
      </div>

      {/* Second row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
        <KPI label="Monthly Burn"    value="Rs 31.50 L" color="#DC2626" icon="🔥" sub="August 2026" />
        <KPI label="Cash Runway"     value="8.2 months" color="#D97706" icon="⏱" sub="At current burn" />
        <KPI label="GST Liability"   value="Rs 3.42 L"  color="#7C3AED" icon="🧾" sub="August pending" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* P&L Trend */}
        <Card title="Monthly P&L" icon="📈">
          {[
            { m: 'April',  rev: 4800000, exp: 3200000 },
            { m: 'May',    rev: 5200000, exp: 3400000 },
            { m: 'June',   rev: 4900000, exp: 3100000 },
            { m: 'July',   rev: 5600000, exp: 3600000 },
            { m: 'August', rev: 4800000, exp: 3150000 },
          ].map((row, i) => {
            const profit = row.rev - row.exp;
            const margin = ((profit / row.rev) * 100).toFixed(0);
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < 4 ? '1px solid #F1F5F9' : 'none', fontSize: 12 }}>
                <span style={{ color: '#334155', fontWeight: 500, width: 60 }}>{row.m}</span>
                <span style={{ color: '#059669', fontWeight: 600, width: 80, textAlign: 'right' }}>{INR(row.rev)}</span>
                <span style={{ color: '#DC2626', width: 80, textAlign: 'right' }}>{INR(row.exp)}</span>
                <span style={{ color: '#1B4FD8', fontWeight: 700, width: 70, textAlign: 'right' }}>{INR(profit)}</span>
                <span style={{ padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: '#ECFDF5', color: '#059669' }}>{margin}%</span>
              </div>
            );
          })}
        </Card>

        {/* Upcoming obligations */}
        <Card title="Upcoming Obligations" icon="⚠️">
          {[
            { date: '7 Sep', item: 'TDS Payment', amount: 'Rs 1.38 L', urgent: true },
            { date: '11 Sep', item: 'GSTR-1 Filing', amount: 'Rs 0', urgent: false },
            { date: '15 Sep', item: 'Advance Tax Q2', amount: 'Rs 4.50 L', urgent: false },
            { date: '15 Sep', item: 'PF Contribution', amount: 'Rs 1.45 L', urgent: false },
            { date: '20 Sep', item: 'GSTR-3B + Payment', amount: 'Rs 3.42 L', urgent: false },
            { date: '30 Sep', item: 'Professional Tax', amount: 'Rs 0.05 L', urgent: false },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 5 ? '1px solid #F1F5F9' : 'none' }}>
              <div style={{ width: 42, fontSize: 10, fontWeight: 700, color: item.urgent ? '#DC2626' : '#64748B', textAlign: 'center', padding: '3px 4px', borderRadius: 4, background: item.urgent ? '#FEF2F2' : '#F8FAFC' }}>{item.date}</div>
              <div style={{ flex: 1, fontSize: 12, color: '#334155' }}>{item.item}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0A1628' }}>{item.amount}</div>
              {item.urgent && <Badge text="URGENT" color="#DC2626" bg="#FEF2F2" />}
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Project margins */}
        <Card title="Project Margins" icon="📊">
          {(projects.slice(0, 5)).map((p, i) => {
            const margin = p.billed > 0 ? Math.round(((p.billed - p.spent) / p.billed) * 100) : 0;
            return <ProgressBar key={i} label={p.name?.substring(0, 22)} sub={`${margin}%`} value={margin} max={100} color={margin > 30 ? '#059669' : margin > 15 ? '#D97706' : '#DC2626'} />;
          })}
        </Card>

        {/* Pipeline */}
        <Card title="Sales Pipeline" icon="🎯">
          <div style={{ marginBottom: 12, padding: '10px', borderRadius: 8, background: '#F0F5FF', border: '1px solid #DBEAFE' }}>
            <div style={{ fontSize: 11, color: '#3B5998', fontWeight: 600 }}>Weighted Pipeline</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1B4FD8' }}>Rs 98.65 L</div>
          </div>
          {(data?.crm?.leads || []).slice(0, 5).map((lead, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 4 ? '1px solid #F1F5F9' : 'none', fontSize: 12 }}>
              <span style={{ color: '#334155' }}>{lead.company}</span>
              <span style={{ color: '#1B4FD8', fontWeight: 600 }}>{INR(lead.value)}</span>
              <span style={{ color: '#64748B' }}>{lead.probability}%</span>
            </div>
          ))}
        </Card>
      </div>
      <CurrencyRates />
    </div>
  );
}

// ── ROLE: Sales Manager ───────────────────────────────────────
function SalesDashboard({ data }) {
  const leads = data?.crm?.leads || [];
  const pipeline = leads.reduce((s, l) => s + parseFloat(l.value || 0), 0);
  const weighted = leads.reduce((s, l) => s + parseFloat(l.value || 0) * parseFloat(l.probability || 0) / 100, 0);
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const stageColor = { lead: '#94A3B8', qualified: '#1B4FD8', proposal: '#D97706', negotiation: '#7C3AED', won: '#059669', lost: '#DC2626' };
  const stageCounts = {};
  leads.forEach(l => stageCounts[l.stage] = (stageCounts[l.stage] || 0) + 1);

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>{today}</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', marginBottom: 4, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>Sales Dashboard 🎯</h1>
        <div style={{ fontSize: 13, color: '#3B5998' }}>Your pipeline, leads, and revenue targets for today.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <KPI label="Total Pipeline"   value={INR(pipeline)}  color="#1B4FD8" icon="💼" sub={`${leads.length} leads`} />
        <KPI label="Weighted Value"   value={INR(weighted)}  color="#059669" icon="🎯" sub="By probability" trend="22.5%" trendUp={true} />
        <KPI label="In Negotiation"   value={leads.filter(l => l.stage === 'negotiation').length} color="#7C3AED" icon="🤝" sub="Active deals" />
        <KPI label="Win Rate"         value="68%"            color="#059669" icon="🏆" sub="Last 90 days" trend="5.2%" trendUp={true} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Pipeline funnel */}
        <Card title="Pipeline Funnel" icon="📊">
          {['lead', 'qualified', 'proposal', 'negotiation', 'won'].map((stage, i) => {
            const count = stageCounts[stage] || 0;
            const val = leads.filter(l => l.stage === stage).reduce((s, l) => s + parseFloat(l.value || 0), 0);
            const maxCount = Math.max(...Object.values(stageCounts), 1);
            return (
              <div key={stage} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: stageColor[stage], textTransform: 'capitalize' }}>{stage}</span>
                  <span style={{ fontSize: 12 }}><strong>{count}</strong> leads · {INR(val)}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: ((count / maxCount) * 100) + '%', background: stageColor[stage], borderRadius: 4, opacity: 0.8 }} />
                </div>
              </div>
            );
          })}
        </Card>

        {/* Today's tasks */}
        <Card title="Today's Focus" icon="✅">
          {[
            { task: 'Follow up: Cars24 negotiation (Neha)', priority: 'high', due: 'Today' },
            { task: 'Send proposal: Dunzo Digital (Arun)', priority: 'high', due: 'Today' },
            { task: 'Demo: Groww platform (Vijay)', priority: 'medium', due: 'Tomorrow' },
            { task: 'Submit Q2 pipeline report to CFO', priority: 'medium', due: '13 Aug' },
            { task: 'Update CRM: PhonePe deal status', priority: 'low', due: '14 Aug' },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 4 ? '1px solid #F1F5F9' : 'none' }}>
              <input type="checkbox" style={{ accentColor: '#1B4FD8' }} />
              <span style={{ flex: 1, fontSize: 12, color: '#334155' }}>{t.task}</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, fontWeight: 700, background: t.priority === 'high' ? '#FEF2F2' : t.priority === 'medium' ? '#FFFBEB' : '#F8FAFC', color: t.priority === 'high' ? '#DC2626' : t.priority === 'medium' ? '#D97706' : '#64748B' }}>{t.due}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Lead table */}
      <Card title="Active Leads" icon="👥" action={{ label: '+ Add Lead', fn: () => window.location.href='/crm' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr style={{ background: '#F0F5FF' }}>
            {['Contact', 'Company', 'Stage', 'Deal Value', 'Probability', 'Close Date'].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {leads.map((lead, i) => (
              <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0A1628' }}>{lead.name}</td>
                <td style={{ padding: '8px 12px', color: '#334155' }}>{lead.company}</td>
                <td style={{ padding: '8px 12px' }}>
                  <Badge text={lead.stage} color={stageColor[lead.stage] || '#64748B'} bg={(stageColor[lead.stage] || '#64748B') + '15'} />
                </td>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0A1628' }}>{INR(lead.value)}</td>
                <td style={{ padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: '#F1F5F9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: lead.probability + '%', background: '#1B4FD8', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', width: 28 }}>{lead.probability}%</span>
                  </div>
                </td>
                <td style={{ padding: '8px 12px', color: '#64748B' }}>{new Date(lead.expected_close).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── ROLE: HR Manager ──────────────────────────────────────────
function HRDashboard({ data }) {
  const employees = data?.employees?.employees || [];
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const depts = {};
  employees.forEach(e => { depts[e.department] = (depts[e.department] || 0) + 1; });
  const totalPayroll = employees.reduce((s, e) => s + parseFloat(e.basic_salary || 0) + parseFloat(e.hra || 0) + parseFloat(e.special_allowance || 0) + parseFloat(e.other_allowances || 0), 0);

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>{today}</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', marginBottom: 4, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>HR Dashboard 👥</h1>
        <div style={{ fontSize: 13, color: '#3B5998' }}>People, payroll, and compliance at a glance.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <KPI label="Total Employees" value={employees.length} color="#1B4FD8" icon="👥" sub="Active headcount" />
        <KPI label="Monthly Payroll" value={INR(totalPayroll)} color="#DC2626" icon="💳" sub="Gross salary" />
        <KPI label="Avg Salary"      value={INR(employees.length ? totalPayroll / employees.length : 0)} color="#059669" icon="💰" sub="Per employee" />
        <KPI label="Open Positions"  value="3" color="#D97706" icon="📋" sub="Hiring needed" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Dept breakdown */}
        <Card title="Department Breakdown" icon="🏢">
          {Object.entries(depts).map(([dept, count], i) => (
            <ProgressBar key={dept} label={dept} sub={`${count} employee${count > 1 ? 's' : ''}`} value={count} max={employees.length} color={['#1B4FD8','#059669','#D97706','#7C3AED','#DC2626','#0284C7'][i % 6]} />
          ))}
        </Card>

        {/* Salary breakdown */}
        <Card title="Salary Structure" icon="💰">
          {employees.slice(0, 6).map((emp, i) => {
            const gross = parseFloat(emp.basic_salary || 0) + parseFloat(emp.hra || 0) + parseFloat(emp.special_allowance || 0) + parseFloat(emp.other_allowances || 0);
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 5 ? '1px solid #F1F5F9' : 'none', fontSize: 12 }}>
                <span style={{ color: '#334155', fontWeight: 500 }}>{emp.first_name} {emp.last_name}</span>
                <span style={{ color: '#64748B', fontSize: 11 }}>{emp.department}</span>
                <span style={{ color: '#059669', fontWeight: 700 }}>{INR(gross)}</span>
              </div>
            );
          })}
        </Card>
      </div>

      {/* Compliance */}
      <Card title="HR Compliance Calendar" icon="📅">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { item: 'PF ECR Filing', due: '15 Sep', status: 'pending', amount: 'Rs 1.45 L' },
            { item: 'ESI Return', due: '15 Sep', status: 'pending', amount: 'Rs 0.28 L' },
            { item: 'Professional Tax', due: '30 Sep', status: 'pending', amount: 'Rs 0.05 L' },
            { item: 'TDS (192B)', due: '7 Sep', status: 'urgent', amount: 'Rs 1.38 L' },
            { item: 'PF July - Filed', due: '15 Aug', status: 'done', amount: 'Rs 1.45 L' },
            { item: 'ESI July - Filed', due: '15 Aug', status: 'done', amount: 'Rs 0.28 L' },
          ].map((c, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${c.status === 'done' ? '#A7F3D0' : c.status === 'urgent' ? '#FECACA' : '#DBEAFE'}`, background: c.status === 'done' ? '#ECFDF5' : c.status === 'urgent' ? '#FEF2F2' : '#EEF3FD' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: c.status === 'done' ? '#059669' : c.status === 'urgent' ? '#DC2626' : '#1B4FD8', marginBottom: 3 }}>{c.item}</div>
              <div style={{ fontSize: 10, color: '#64748B' }}>Due: {c.due}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0A1628', marginTop: 2 }}>{c.amount}</div>
              <Badge text={c.status === 'done' ? '✓ Filed' : c.status === 'urgent' ? '⚠ Urgent' : 'Pending'} color={c.status === 'done' ? '#059669' : c.status === 'urgent' ? '#DC2626' : '#1B4FD8'} bg="transparent" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── ROLE: Finance Manager ─────────────────────────────────────
function FinanceDashboard({ data }) {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const arInvoices = data?.ar?.invoices || [];
  const apInvoices = data?.ap?.invoices || [];
  const pendingAR = arInvoices.filter(i => i.status !== 'paid');
  const pendingAP = apInvoices.filter(i => i.status !== 'paid');

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>{today}</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', marginBottom: 4, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>Finance Dashboard 📒</h1>
        <div style={{ fontSize: 13, color: '#3B5998' }}>Accounts, transactions, and reconciliation status.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <KPI label="AR Pending"    value={pendingAR.length + ' invoices'} color="#D97706" icon="📄" sub={INR(pendingAR.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0))} />
        <KPI label="AP Pending"    value={pendingAP.length + ' invoices'} color="#DC2626" icon="📋" sub={INR(pendingAP.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0))} />
        <KPI label="Reconciled"    value="87%"  color="#059669" icon="✅" sub="Bank transactions" trend="4.1%" trendUp={true} />
        <KPI label="Journal Entries" value="24" color="#1B4FD8" icon="📒" sub="This month" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <Card title="Pending AR Collections" icon="📥" action={{ label: 'View All', fn: () => window.location.href = '/accounting' }}>
          {pendingAR.map((inv, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < pendingAR.length - 1 ? '1px solid #F1F5F9' : 'none', fontSize: 12 }}>
              <span style={{ color: '#1B4FD8', fontWeight: 600 }}>{inv.invoice_number}</span>
              <span style={{ color: '#334155' }}>{new Date(inv.due_date).toLocaleDateString('en-IN')}</span>
              <span style={{ fontWeight: 700, color: '#D97706' }}>{INR(inv.total_amount)}</span>
              <Badge text={inv.status} color="#D97706" bg="#FFFBEB" />
            </div>
          ))}
        </Card>

        <Card title="AP Payments Due" icon="📤" action={{ label: 'View All', fn: () => window.location.href = '/accounting' }}>
          {pendingAP.map((inv, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < pendingAP.length - 1 ? '1px solid #F1F5F9' : 'none', fontSize: 12 }}>
              <span style={{ color: '#1B4FD8', fontWeight: 600 }}>{inv.invoice_number}</span>
              <span style={{ color: new Date(inv.due_date) < new Date() ? '#DC2626' : '#334155' }}>{new Date(inv.due_date).toLocaleDateString('en-IN')}</span>
              <span style={{ fontWeight: 700, color: '#DC2626' }}>{INR(inv.total_amount)}</span>
              <Badge text={inv.status} color="#DC2626" bg="#FEF2F2" />
            </div>
          ))}
        </Card>
      </div>

      <Card title="Bank Account Summary" icon="🏦">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { name: 'HDFC Current Account', bank: 'HDFC Bank', balance: 4750000, type: 'Primary', color: '#1B4FD8' },
            { name: 'ICICI Operating Account', bank: 'ICICI Bank', balance: 1850000, type: 'Operating', color: '#059669' },
            { name: 'SBI Fixed Deposit', bank: 'State Bank', balance: 2500000, type: 'Savings', color: '#7C3AED' },
          ].map((acc, i) => (
            <div key={i} style={{ padding: '14px', borderRadius: 10, border: `1px solid ${acc.color}30`, background: acc.color + '08' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: acc.color, marginBottom: 4 }}>{acc.type}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0A1628', marginBottom: 2 }}>{acc.name}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>{acc.bank}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: acc.color }}>{INR(acc.balance)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── ROLE: Operations Manager ──────────────────────────────────
function OperationsDashboard({ data }) {
  const projects = data?.projects?.projects || [];
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const activeProj = projects.filter(p => p.status === 'active');

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>{today}</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', marginBottom: 4, fontFamily: 'Plus Jakarta Sans, Inter, sans-serif' }}>Operations Dashboard ⚙️</h1>
        <div style={{ fontSize: 13, color: '#3B5998' }}>Projects, procurement, and inventory status.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <KPI label="Active Projects"  value={activeProj.length}  color="#1B4FD8" icon="📋" sub={`of ${projects.length} total`} />
        <KPI label="Total Budget"     value={INR(projects.reduce((s, p) => s + parseFloat(p.budget || 0), 0))} color="#059669" icon="💰" sub="All projects" />
        <KPI label="Total Spent"      value={INR(projects.reduce((s, p) => s + parseFloat(p.spent || 0), 0))} color="#D97706" icon="💸" sub="All projects" />
        <KPI label="POs Pending"      value="4" color="#DC2626" icon="📦" sub="Awaiting approval" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <Card title="Project Status" icon="📊">
          {projects.map((p, i) => {
            const pct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
            return (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#0A1628' }}>{p.name?.substring(0, 24)}</span>
                  <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 10, fontWeight: 700, background: p.status === 'active' ? '#ECFDF5' : p.status === 'completed' ? '#DBEAFE' : '#FFFBEB', color: p.status === 'active' ? '#059669' : p.status === 'completed' ? '#1B4FD8' : '#D97706' }}>{p.status}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748B', marginBottom: 4 }}>
                  <span>Budget: {INR(p.budget)}</span>
                  <span>Spent: {INR(p.spent)} ({pct}%)</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: Math.min(100, pct) + '%', background: pct > 90 ? '#DC2626' : pct > 70 ? '#D97706' : '#059669', borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </Card>

        <Card title="Inventory Alerts" icon="📦">
          <div style={{ padding: '10px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>Low Stock Alert</div>
            <div style={{ fontSize: 12, color: '#334155' }}>Mouse (SK001) — 1 pcs remaining</div>
          </div>
          {[
            { sku: 'SFT-001', name: 'Finance OS Starter', stock: 45, unit: 'licenses' },
            { sku: 'SFT-002', name: 'Finance OS Pro', stock: 28, unit: 'licenses' },
            { sku: 'SVC-001', name: 'Implementation Hrs', stock: 200, unit: 'hours' },
            { sku: 'HW-001', name: 'Dev Laptops', stock: 8, unit: 'units' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 3 ? '1px solid #F1F5F9' : 'none', fontSize: 12 }}>
              <span style={{ color: '#64748B', width: 55 }}>{item.sku}</span>
              <span style={{ flex: 1, color: '#334155' }}>{item.name}</span>
              <span style={{ fontWeight: 700, color: '#059669' }}>{item.stock} {item.unit}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── Role Selector + Main Component ───────────────────────────
const ROLES = [
  { id: 'cfo',        label: 'CFO',               icon: '💼', desc: 'Financial command center' },
  { id: 'sales',      label: 'Sales Manager',      icon: '🎯', desc: 'Pipeline and revenue' },
  { id: 'hr',         label: 'HR Manager',         icon: '👥', desc: 'People and payroll' },
  { id: 'finance',    label: 'Finance Manager',     icon: '📒', desc: 'Accounts and reconciliation' },
  { id: 'operations', label: 'Operations Manager',  icon: '⚙️', desc: 'Projects and procurement' },
];

export default function PersonalDashboard() {
  const [role, setRole] = useState('cfo');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      get('/api/accounting/ar'),
      get('/api/accounting/ap'),
      get('/api/payroll/employees'),
      get('/api/crm/leads'),
      get('/api/projects'),
    ]).then(([ar, ap, employees, crm, projects]) => {
      setData({ ar, ap, employees, crm, projects });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const currentRole = ROLES.find(r => r.id === role);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontSize: 13 }}>Loading your dashboard...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Role switcher */}
      <div style={{ background: '#fff', borderBottom: '1px solid #C7D9F8', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginRight: 4 }}>Viewing as:</span>
        {ROLES.map(r => (
          <button key={r.id} onClick={() => setRole(r.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7, border: `1px solid ${role === r.id ? '#1B4FD8' : '#E2E8F0'}`, background: role === r.id ? '#EEF3FD' : '#F8FAFC', color: role === r.id ? '#1B4FD8' : '#475569', fontSize: 12, fontWeight: role === r.id ? 700 : 500, cursor: 'pointer', transition: 'all 0.12s' }}>
            <span>{r.icon}</span>
            <span>{r.label}</span>
          </button>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#94A3B8' }}>{currentRole?.desc}</div>
      </div>

      {/* Role-specific dashboard */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {role === 'cfo'        && <CFODashboard data={data} />}
        {role === 'sales'      && <SalesDashboard data={data} />}
        {role === 'hr'         && <HRDashboard data={data} />}
        {role === 'finance'    && <FinanceDashboard data={data} />}
        {role === 'operations' && <OperationsDashboard data={data} />}
      </div>
    </div>
  );
}
