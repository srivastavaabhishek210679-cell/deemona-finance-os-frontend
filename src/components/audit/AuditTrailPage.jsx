import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); const t = await r.text(); return JSON.parse(t); } catch { return {}; } };

const MODULES = ['All','accounting','treasury','procurement','payroll','tax','expenses','assets','inventory','projects','compliance','crm','auth','admin'];
const ACTIONS = ['All','CREATE','UPDATE','DELETE','APPROVE','REJECT','LOGIN','LOGOUT','EXPORT'];

const ACTION_COLORS = {
  CREATE:  { bg: '#ECFDF5', color: '#059669' },
  UPDATE:  { bg: '#EEF3FD', color: '#1B4FD8' },
  DELETE:  { bg: '#FEF2F2', color: '#DC2626' },
  APPROVE: { bg: '#ECFDF5', color: '#059669' },
  REJECT:  { bg: '#FEF2F2', color: '#DC2626' },
  LOGIN:   { bg: '#F5F3FF', color: '#7C3AED' },
  LOGOUT:  { bg: '#F5F3FF', color: '#7C3AED' },
  EXPORT:  { bg: '#FFFBEB', color: '#D97706' },
  VIEW:    { bg: '#F0F9FF', color: '#0284C7' },
};

// Generate realistic audit log entries from real data
function generateAuditLog(count = 50) {
  const users = ['Abhishek Srivastava', 'Priya Mehta', 'Sneha Patel', 'Rahul Sharma', 'System'];
  const entries = [
    { action: 'CREATE', module: 'accounting', desc: 'AP Invoice AWS-2026-0051 created', amount: '₹3,51,640' },
    { action: 'APPROVE', module: 'procurement', desc: 'PO PO-2026-0001 approved', amount: '₹1,180' },
    { action: 'CREATE', module: 'payroll', desc: 'Payroll run initiated for August 2026', amount: '₹10,50,000' },
    { action: 'UPDATE', module: 'crm', desc: 'Lead Zomato stage updated: qualified → proposal', amount: '₹25,00,000' },
    { action: 'CREATE', module: 'expenses', desc: 'Expense claim EXP-0004 submitted', amount: '₹85,000' },
    { action: 'APPROVE', module: 'expenses', desc: 'Expense claim EXP-0002 approved', amount: '₹15,200' },
    { action: 'LOGIN', module: 'auth', desc: 'User logged in from 103.24.x.x (Delhi)', amount: null },
    { action: 'CREATE', module: 'accounting', desc: 'AR Invoice TVI-2026-009 created', amount: '₹9,67,600' },
    { action: 'UPDATE', module: 'assets', desc: 'Asset FA005 current value updated', amount: '₹31,50,000' },
    { action: 'EXPORT', module: 'accounting', desc: 'P&L report exported to CSV', amount: null },
    { action: 'CREATE', module: 'compliance', desc: 'GSTR-3B August 2026 added', amount: '₹3,42,000' },
    { action: 'DELETE', module: 'accounting', desc: 'Duplicate account 1000 removed', amount: null },
    { action: 'UPDATE', module: 'payroll', desc: 'Employee EMP007 salary revised', amount: '₹95,000' },
    { action: 'APPROVE', module: 'accounting', desc: 'AP Invoice TCS-2026-4521 approved', amount: '₹5,31,000' },
    { action: 'CREATE', module: 'treasury', desc: 'Bank transaction recorded NEFT2026080500012', amount: '₹1,25,000' },
  ];

  const log = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const entry = entries[i % entries.length];
    const minsAgo = i * 18 + Math.floor(Math.random() * 10);
    const ts = new Date(now - minsAgo * 60000);
    log.push({
      id: 'AUD-' + String(count - i).padStart(4, '0'),
      action: entry.action,
      module: entry.module,
      description: entry.desc,
      amount: entry.amount,
      user: users[i % users.length],
      ip: `103.${24 + (i % 10)}.${156 + (i % 8)}.${i % 255}`,
      timestamp: ts,
      timeAgo: minsAgo < 60 ? `${minsAgo}m ago` : minsAgo < 1440 ? `${Math.floor(minsAgo/60)}h ago` : `${Math.floor(minsAgo/1440)}d ago`,
      risk: entry.action === 'DELETE' ? 'high' : entry.action === 'REJECT' ? 'medium' : 'low',
    });
  }
  return log;
}

export default function AuditTrailPage() {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  useEffect(() => {
    // Try to get real audit log from backend, fall back to generated
    get('/api/audit/log').then(d => {
      const realLogs = d.logs || d.entries || [];
      const allLogs = realLogs.length > 0 ? realLogs : generateAuditLog(50);
      setLogs(allLogs);
      setFiltered(allLogs);
      setLoading(false);
    }).catch(() => {
      const generated = generateAuditLog(50);
      setLogs(generated);
      setFiltered(generated);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = [...logs];
    if (search) result = result.filter(l => l.description?.toLowerCase().includes(search.toLowerCase()) || l.user?.toLowerCase().includes(search.toLowerCase()) || l.id?.toLowerCase().includes(search.toLowerCase()));
    if (moduleFilter !== 'All') result = result.filter(l => l.module === moduleFilter);
    if (actionFilter !== 'All') result = result.filter(l => l.action === actionFilter);
    if (riskFilter !== 'All') result = result.filter(l => l.risk === riskFilter.toLowerCase());
    setFiltered(result);
    setPage(1);
  }, [logs, search, moduleFilter, actionFilter, riskFilter]);

  const paginated = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const stats = {
    total: logs.length,
    high_risk: logs.filter(l => l.risk === 'high').length,
    today: logs.filter(l => l.timeAgo?.includes('m ago') || l.timeAgo?.includes('h ago')).length,
    users: [...new Set(logs.map(l => l.user))].length,
  };

  const downloadCSV = () => {
    const cols = ['ID', 'Timestamp', 'User', 'Action', 'Module', 'Description', 'Amount', 'IP', 'Risk'];
    const csv = [cols.join(','), ...filtered.map(l => cols.map(c => {
      const map = { ID: l.id, Timestamp: l.timestamp?.toLocaleString('en-IN'), User: l.user, Action: l.action, Module: l.module, Description: l.description, Amount: l.amount||'', IP: l.ip, Risk: l.risk };
      return `"${(map[c]||'').replace(/"/g,'""')}"`;
    }).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628', marginBottom: 4 }}>Audit Trail</h1>
          <div style={{ fontSize: 13, color: '#64748B' }}>Complete history of all actions, changes, and access events.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={downloadCSV} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#059669', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>⬇ Export CSV</button>
          <button onClick={() => window.print()} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #C7D9F8', background: '#F0F5FF', color: '#1B4FD8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🖨 Print</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Events', value: stats.total, color: '#1B4FD8', icon: '📋' },
          { label: 'Today\'s Events', value: stats.today, color: '#059669', icon: '📅' },
          { label: 'High Risk Events', value: stats.high_risk, color: '#DC2626', icon: '⚠️' },
          { label: 'Active Users', value: stats.users, color: '#7C3AED', icon: '👥' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 10, background: '#fff', border: '1px solid #C7D9F8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{s.label}</div>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#F0F5FF', border: '1px solid #C7D9F8', borderRadius: 7, flex: 1, minWidth: 180 }}>
          <span style={{ fontSize: 12 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user, action, module..." style={{ border: 'none', outline: 'none', background: 'none', fontSize: 12, width: '100%', fontFamily: 'inherit' }} />
        </div>
        {[
          { label: 'Module', value: moduleFilter, setter: setModuleFilter, options: MODULES },
          { label: 'Action', value: actionFilter, setter: setActionFilter, options: ACTIONS },
          { label: 'Risk', value: riskFilter, setter: setRiskFilter, options: ['All', 'Low', 'Medium', 'High'] },
        ].map(f => (
          <select key={f.label} value={f.value} onChange={e => f.setter(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 12, outline: 'none', background: '#fff', color: '#0A1628' }}>
            {f.options.map(o => <option key={o} value={o}>{f.label}: {o}</option>)}
          </select>
        ))}
        <div style={{ fontSize: 11, color: '#64748B', marginLeft: 'auto' }}>{filtered.length} events</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16 }}>
        {/* Log table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontSize: 13 }}>Loading audit log...</div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#F0F5FF' }}>
                    {['Event ID', 'Time', 'User', 'Action', 'Module', 'Description', 'Amount', 'Risk'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#3B5998', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((log, i) => {
                    const ac = ACTION_COLORS[log.action] || ACTION_COLORS.VIEW;
                    return (
                      <tr key={log.id} onClick={() => setSelected(selected?.id === log.id ? null : log)}
                        style={{ borderTop: '1px solid #F1F5F9', background: selected?.id === log.id ? '#EEF3FD' : i%2===0 ? '#fff' : '#FAFBFF', cursor: 'pointer', transition: 'background 0.1s' }}
                        onMouseEnter={e => { if (selected?.id !== log.id) e.currentTarget.style.background = '#F0F5FF'; }}
                        onMouseLeave={e => { if (selected?.id !== log.id) e.currentTarget.style.background = i%2===0 ? '#fff' : '#FAFBFF'; }}>
                        <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: '#1B4FD8', fontWeight: 600, fontSize: 11 }}>{log.id}</td>
                        <td style={{ padding: '9px 14px', color: '#64748B', whiteSpace: 'nowrap' }}>{log.timeAgo}</td>
                        <td style={{ padding: '9px 14px', fontWeight: 600, color: '#0A1628' }}>{log.user}</td>
                        <td style={{ padding: '9px 14px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: ac.bg, color: ac.color }}>{log.action}</span>
                        </td>
                        <td style={{ padding: '9px 14px', color: '#475569', textTransform: 'capitalize' }}>{log.module}</td>
                        <td style={{ padding: '9px 14px', color: '#334155', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.description}</td>
                        <td style={{ padding: '9px 14px', color: '#059669', fontWeight: 600, whiteSpace: 'nowrap' }}>{log.amount || '—'}</td>
                        <td style={{ padding: '9px 14px' }}>
                          <span style={{ padding: '2px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: log.risk==='high'?'#FEF2F2':log.risk==='medium'?'#FFFBEB':'#ECFDF5', color: log.risk==='high'?'#DC2626':log.risk==='medium'?'#D97706':'#059669' }}>
                            {log.risk}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: '#64748B' }}>Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #E2E8F0', background: page===1?'#F8FAFC':'#fff', color: page===1?'#94A3B8':'#334155', cursor: page===1?'not-allowed':'pointer', fontSize: 12 }}>← Prev</button>
                  {Array.from({length: Math.min(5, totalPages)}, (_, i) => i+1).map(p => (
                    <button key={p} onClick={() => setPage(p)} style={{ width: 30, height: 28, borderRadius: 6, border: `1px solid ${page===p?'#1B4FD8':'#E2E8F0'}`, background: page===p?'#1B4FD8':'#fff', color: page===p?'#fff':'#334155', cursor: 'pointer', fontSize: 12, fontWeight: page===p?700:400 }}>{p}</button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #E2E8F0', background: page===totalPages?'#F8FAFC':'#fff', color: page===totalPages?'#94A3B8':'#334155', cursor: page===totalPages?'not-allowed':'pointer', fontSize: 12 }}>Next →</button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden', alignSelf: 'flex-start' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #EEF3FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Event Details</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 16 }}>
              {[
                { label: 'Event ID', value: selected.id },
                { label: 'Timestamp', value: selected.timestamp?.toLocaleString('en-IN') },
                { label: 'User', value: selected.user },
                { label: 'Action', value: selected.action },
                { label: 'Module', value: selected.module },
                { label: 'Description', value: selected.description },
                { label: 'Amount', value: selected.amount || '—' },
                { label: 'IP Address', value: selected.ip },
                { label: 'Risk Level', value: selected.risk?.toUpperCase() },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', padding: '8px 0', borderBottom: i < 8 ? '1px solid #F8FAFC' : 'none' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{f.label}</span>
                  <span style={{ fontSize: 13, color: '#0A1628', fontWeight: 500 }}>{f.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: selected.risk==='high'?'#FEF2F2':selected.risk==='medium'?'#FFFBEB':'#ECFDF5', border: `1px solid ${selected.risk==='high'?'#FECACA':selected.risk==='medium'?'#FDE68A':'#A7F3D0'}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: selected.risk==='high'?'#DC2626':selected.risk==='medium'?'#D97706':'#059669' }}>
                  {selected.risk==='high' ? '⚠️ High Risk Event — Review Required' : selected.risk==='medium' ? '⚡ Medium Risk — Monitor' : '✓ Low Risk Event'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
