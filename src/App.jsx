import MarketplacePage from './components/marketplace/MarketplacePage';
import TallyPage from './components/tally/TallyPage';
import WhatsAppPage from './components/whatsapp/WhatsAppPage';
import AutomationPage from './components/automation/AutomationPage';
import TaxAgentPage from './components/taxagent/TaxAgentPage';
import AuditAgentPage from './components/auditagent/AuditAgentPage';
import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LoginPage, RegisterPage } from './components/auth/AuthPages';
import FinanceMemoryPage from './pages/MemoryPage';
import DecisionCenter from './components/decision/DecisionCenter';
import AccountingPage from './components/accounting/AccountingPage';
import TreasuryPage from './components/treasury/TreasuryPage';
import ProcurementPage from './components/procurement/ProcurementPage';
import PayrollPage from './components/payroll/PayrollPage';
import TaxPage from './components/tax/TaxPage';
import BudgetingPage from './components/budgeting/BudgetingPage';
import StatementsPage from './components/statements/StatementsPage';
import CFOAgentPage from './components/cfoagent/CFOAgentPage';
import DocumentAIPage from './components/documentai/DocumentAIPage';
import { ExpensesPage, AssetsPage, InventoryPage, ProjectsPage, CompliancePage, CRMPage } from './components/remaining/AllPages';
import DigitalTwinPage from './components/digitaltwin/DigitalTwinPage';

const Icon = ({ d, size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  memory:      'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
  decision:    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  accounting:  'M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M9 7V4a1 1 0 011-1h9a1 1 0 011 1v9a1 1 0 01-1 1h-3M9 7h6',
  treasury:    'M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 100-16 8 8 0 000 16zm1-8h4l-5 5-5-5h4V8h2v4z',
  procurement: 'M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM12 14a2 2 0 110-4 2 2 0 010 4z',
  agents:      'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  bell:        'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
  search:      'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  plus:        'M12 5v14M5 12h14',
  help:        'M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01',
  chevron:     'M9 18l6-6-6-6',
  logout:      'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
};

const NAV_ITEMS = [
  { path: '/memory',      label: 'Finance Memory', icon: 'memory' },
  { path: '/decision',    label: 'Decision Center', icon: 'decision' },
  { path: '/accounting',  label: 'Accounting',      icon: 'accounting' },
  { path: '/treasury',    label: 'Treasury',         icon: 'treasury' },
  { path: '/procurement', label: 'Procurement',      icon: 'procurement' },
  { path: '/payroll',     label: 'Payroll',           icon: 'agents' },
  { path: '/tax',         label: 'Tax & GST',         icon: 'accounting' },
  { path: '/budgeting',   label: 'Budgeting',          icon: 'decision' },
  { path: '/expenses',    label: 'Expenses',            icon: 'agents' },
  { path: '/assets',      label: 'Assets',              icon: 'treasury' },
  { path: '/inventory',   label: 'Inventory',           icon: 'procurement' },
  { path: '/projects',    label: 'Projects',            icon: 'accounting' },
  { path: '/compliance',  label: 'Compliance',          icon: 'decision' },
  { path: '/crm',         label: 'CRM',                 icon: 'agents' },
  { path: '/statements',  label: 'Statements',           icon: 'reports' },
  { path: '/cfo',         label: 'Digital CFO',          icon: 'ai' },
  { path: '/document-ai', label: 'Document AI',          icon: 'memory' },
  { path: '/automation',  label: 'Automation Studio',    icon: 'agents' },
  { path: '/tax-agent',   label: 'Tax Agent',            icon: 'reports' },
  { path: '/audit',       label: 'Audit Agent',          icon: 'ai' },
  { path: '/marketplace', label: 'Agent Marketplace',   icon: 'agents' },
  { path: '/tally',       label: 'Tally Sync',           icon: 'reports' },
  { path: '/whatsapp',    label: 'WhatsApp',             icon: 'memory' },
  { path: '/digitaltwin', label: 'Digital Twin',        icon: 'decision' },
];

function Sparkline({ color = '#6C63FF', data = [2,4,3,6,5,8,7,9] }) {
  const w = 80, h = 28;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
    </svg>
  );
}

function Sidebar({ user, tenant, onLogout }) {
  return (
    <aside style={{
      width: 230, flexShrink: 0,
      background: 'var(--surface-1)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
    }}>
      <div style={{ padding: '22px 20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #6C63FF, #9B8FFF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 900, color: '#fff', fontStyle: 'italic', flexShrink: 0,
        }}>D</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tenant?.name || 'DEEMONA'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>AI Finance OS</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => (
          <NavLink key={item.path} to={item.path}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 8, marginBottom: 1,
              fontSize: 13, fontWeight: 500, textDecoration: 'none',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent)' : 'transparent',
              transition: 'background 0.12s, color 0.12s',
            })}>
            <Icon d={ICONS[item.icon]} size={15} color="currentColor" />
            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6C63FF, #9B8FFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>{user?.name?.[0] || 'A'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role || 'member'}</div>
          </div>
          <button onClick={onLogout} title="Logout" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}>
            <Icon d={ICONS.logout} size={15} color="currentColor" />
          </button>
        </div>
        <div style={{ height: 3, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textAlign: 'right' }}>All modules active</div>
      </div>
    </aside>
  );
}

function TopBar({ title, subtitle }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 22px', borderBottom: '1px solid var(--border)',
      background: 'var(--bg)', flexShrink: 0,
    }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</p>}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: 10, width: 200,
      }}>
        <Icon d={ICONS.search} size={14} color="var(--text-muted)" />
        <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>Search anywhere...</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '2px 6px', borderRadius: 4 }}>K</span>
      </div>
      <div style={{ position: 'relative' }}>
        <button style={{
          width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)',
          border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon d={ICONS.bell} size={16} color="var(--text-secondary)" />
        </button>
        <div style={{
          position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%',
          background: 'var(--danger)', fontSize: 9, fontWeight: 700, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)',
        }}>3</div>
      </div>
      <button style={{
        width: 36, height: 36, borderRadius: 10, background: 'var(--surface-2)',
        border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon d={ICONS.help} size={16} color="var(--text-secondary)" />
      </button>
      <button style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
        background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
      }}>
        <Icon d={ICONS.plus} size={15} color="#fff" />
        New
      </button>
    </div>
  );
}

function RightPanel() {
  const cats = [
    { label: 'Approvals',    color: '#22C98A', count: 0 },
    { label: 'Transactions', color: '#6C63FF', count: 0 },
    { label: 'Rejections',   color: '#FF5C5C', count: 0 },
    { label: 'AI Insights',  color: '#9B8FFF', count: 0 },
    { label: 'Comments',     color: '#4FC3F7', count: 0 },
  ];
  return (
    <aside style={{
      width: 250, flexShrink: 0, background: 'var(--surface-1)',
      borderLeft: '1px solid var(--border)', overflowY: 'auto',
      padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>Memory Insights</span>
        <Icon d={ICONS.chevron} size={14} color="var(--text-muted)" />
      </div>
      <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>AI Summary</span>
          <span style={{ color: 'var(--accent)', fontSize: 14 }}>âœ¦</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
          No activity recorded yet. Start using Deemona AI Finance OS to build your organizational financial memory.
        </p>
        <Sparkline color="#6C63FF" data={[1,2,1,3,2,3,2,4]} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Top Categories</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {cats.map(cat => (
            <div key={cat.label} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
              borderRadius: 8, background: 'var(--surface-2)',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>{cat.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{cat.count}</span>
            </div>
          ))}
        </div>
        <button style={{ marginTop: 8, fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          View all categories â†’
        </button>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Recent Activity</div>
        <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 20, marginBottom: 6, opacity: 0.4 }}>ðŸ•</div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>No recent activity</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Activities will appear here as your team starts using the platform.
          </div>
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Memory Health</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)' }}>0%</span>
        </div>
        <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 3, marginBottom: 8, overflow: 'hidden' }}>
          <div style={{ width: '0%', height: '100%', background: 'var(--danger)', borderRadius: 3 }} />
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 6 }}>
          Start using the system to improve memory health.
        </p>
        <Sparkline color="var(--accent)" data={[0,1,0,1,0,1,0,1]} />
      </div>
    </aside>
  );
}

function Layout({ title, subtitle, children }) {
  const { user, tenant, logout } = useAuth();
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar user={user} tenant={tenant} onLogout={logout} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
        <TopBar title={title} subtitle={subtitle} />
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
      <RightPanel />
    </div>
  );
}

function AuthGate() {
  const [showRegister, setShowRegister] = useState(false);
  return showRegister
    ? <RegisterPage onSwitch={() => setShowRegister(false)} />
    : <LoginPage onSwitch={() => setShowRegister(true)} />;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, color: '#6C63FF', marginBottom: 12 }}>â—ˆ</div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading Deemona AI Finance OS...</div>
        </div>
      </div>
    );
  }

  if (!user) return <AuthGate />;

  const routes = [
    { path: '/',            title: 'Finance Memory',         sub: 'Every decision and insight â€” searchable forever.', comp: <FinanceMemoryPage /> },
    { path: '/memory',      title: 'Finance Memory',         sub: 'Every decision and insight â€” searchable forever.', comp: <FinanceMemoryPage /> },
    { path: '/decision',    title: 'AI Decision Center',     sub: 'Your executive financial command center.', comp: <DecisionCenter /> },
    { path: '/accounting',  title: 'Accounting',             sub: 'General Ledger, Journal Entries, AP and AR.', comp: <AccountingPage /> },
    { path: '/treasury',    title: 'Treasury',               sub: 'Bank accounts, cash position, and liquidity forecast.', comp: <TreasuryPage /> },
    { path: '/procurement', title: 'Procurement',            sub: 'Purchase orders, vendors, and approval workflow.', comp: <ProcurementPage /> },
    { path: '/payroll',     title: 'Payroll',                sub: 'Employee management, salary processing, PF and TDS.', comp: <PayrollPage /> },
    { path: '/tax',         title: 'Tax & GST',              sub: 'Filing calendar, TDS, advance tax, and compliance.', comp: <TaxPage /> },
    { path: '/budgeting',   title: 'Budgeting',              sub: 'Annual budgets, department planning, AI forecasts.', comp: <BudgetingPage /> },
    { path: '/expenses',    title: 'Expenses',               sub: 'Employee claims, approvals, and reimbursements.', comp: <ExpensesPage /> },
    { path: '/assets',      title: 'Fixed Assets',           sub: 'Asset register, depreciation, and disposal.', comp: <AssetsPage /> },
    { path: '/inventory',   title: 'Inventory',              sub: 'Stock management, reorder alerts, and movements.', comp: <InventoryPage /> },
    { path: '/projects',    title: 'Projects',               sub: 'Project budgets, timelines, and cost tracking.', comp: <ProjectsPage /> },
    { path: '/compliance',  title: 'Compliance',             sub: 'Statutory deadlines, penalties, and regulatory calendar.', comp: <CompliancePage /> },
    { path: '/crm',         title: 'CRM',                    sub: 'Sales pipeline, leads, and customer revenue.', comp: <CRMPage /> },
    { path: '/digitaltwin', title: 'Financial Digital Twin', sub: 'Simulate scenarios before making real decisions.', comp: <DigitalTwinPage /> },
    { path: '/statements',  title: 'Financial Statements',   sub: 'P&L, Balance Sheet, and Cash Flow Statement.',    comp: <StatementsPage /> },
    { path: '/cfo',         title: 'Digital CFO',            sub: 'AI-powered executive finance intelligence.',       comp: <CFOAgentPage /> },
    { path: '/document-ai', title: 'Document AI',            sub: 'Invoice OCR and automated AP entry creation.',    comp: <DocumentAIPage /> },
    { path: '/automation',  title: 'Automation Studio',      sub: 'Visual workflow builder for finance automation.',  comp: <AutomationPage /> },
    { path: '/tax-agent',   title: 'Tax Agent',              sub: 'GST computation, TDS management, and tax advisory.', comp: <TaxAgentPage /> },
    { path: '/audit',       title: 'Audit Agent',            sub: 'Anomaly detection, fraud alerts, and audit trail.', comp: <AuditAgentPage /> },
    { path: '/marketplace', title: 'Agent Marketplace',      sub: 'Enable and manage AI agents for your organization.', comp: <MarketplacePage /> },
    { path: '/tally',       title: 'Tally XML Sync',         sub: 'Export data as Tally-compatible XML vouchers.',      comp: <TallyPage /> },
    { path: '/whatsapp',    title: 'WhatsApp Integration',   sub: 'Send approvals and alerts via WhatsApp.',            comp: <WhatsAppPage /> },
  ];

  return (
    <BrowserRouter>
      <Routes>
        {routes.map(r => (
          <Route key={r.path} path={r.path} element={
            <Layout title={r.title} subtitle={r.sub}>
              {r.comp}
            </Layout>
          } />
        ))}
      </Routes>
    </BrowserRouter>
  );
}




