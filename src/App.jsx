import React, { useState, useEffect, useRef } from 'react';
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
import { ExpensesPage, AssetsPage, InventoryPage, ProjectsPage, CompliancePage, CRMPage } from './components/remaining/AllPages';
import DigitalTwinPage from './components/digitaltwin/DigitalTwinPage';
import StatementsPage from './components/statements/StatementsPage';
import CFOAgentPage from './components/cfoagent/CFOAgentPage';
import DocumentAIPage from './components/documentai/DocumentAIPage';
import AutomationPage from './components/automation/AutomationPage';
import TaxAgentPage from './components/taxagent/TaxAgentPage';
import AuditAgentPage from './components/auditagent/AuditAgentPage';
import MarketplacePage from './components/marketplace/MarketplacePage';
import TallyPage from './components/tally/TallyPage';
import WhatsAppPage from './components/whatsapp/WhatsAppPage';
import EmailAIPage from './components/emailai/EmailAIPage';
import ForecastingPage from './components/forecasting/ForecastingPage';
import SchedulerPage from './components/scheduler/SchedulerPage';
import SDKPage from './components/sdk/SDKPage';
import AIStudioPage from './components/aistudio/AIStudioPage';
import RBACPage from './components/rbac/RBACPage';
import BillingPage from './components/billing/BillingPage';
import AdminPage from './components/admin/AdminPage';
import DataExportPage from './components/dataexport/DataExportPage';
import { WhiteLabelPage, NotificationCenter } from './components/admin/WhiteLabelPage';
import LandingPage from './pages/LandingPage';
import AutomationLogsPage from './components/automation/AutomationLogsPage';
import Batch2DocsPage from './components/docs/Batch2DocsPage';
import Batch3DocsPage from './components/docs/Batch3DocsPage';
import MissingDocsPage from './components/docs/MissingDocsPage';
import DriveMonitorPage from './components/monitor/DriveMonitorPage';
import DashboardPage from './components/dashboard/DashboardPage';
import GSTPortalPage from './components/tax/GSTPortalPage';
import NewAPIMarketplace from './components/marketplace/APIMarketplace';
import MultiCompanyPage from './components/admin/MultiCompanyPage';
import AuditTrailPage from './components/audit/AuditTrailPage';
import CustomReportBuilder from './components/reports/CustomReportBuilder';
import OnboardingWizard from './pages/OnboardingWizard';
import BankStatementImporter from './components/treasury/BankStatementImporter';
import AIAgentsPage from './components/agents/AIAgentsPage';
import KnowledgeGraph from './components/knowledge/KnowledgeGraph';
import PersonalDashboard from './components/dashboard/PersonalDashboard';
import WorkflowDesigner from './components/automation/WorkflowDesigner';
import './styles/global.css';
import DataIngestionPage from './components/ingestion/DataIngestionPage';
import FinanceDashboardHub from './components/dashboards/FinanceDashboardHub';
import EnterpriseFinanceDashboard from './components/dashboards/EnterpriseFinanceDashboard';
import CollectionsDunningDashboard from './components/dashboards/CollectionsDunningDashboard';

// ── Nav Groups - v2 ──────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Intelligence',
    items: [
    { path: '/memory',      label: 'Finance Memory',   icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z' },
      { path: '/decision',    label: 'Decision Center',  icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
      { path: '/cfo',         label: 'Digital CFO',      icon: 'M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z' },
      { path: '/data-ingest', label: 'Data Ingest', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
          { path: '/finance-hub', label: 'Finance Hub', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { path: '/enterprise-finance', label: 'Enterprise Finance', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      { path: '/collections-dunning', label: 'Collections', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
      { path: '/forecasting', label: 'Forecasting',      icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { path: '/accounting',  label: 'Accounting',       icon: 'M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M9 7V4a1 1 0 011-1h9a1 1 0 011 1v9a1 1 0 01-1 1h-3M9 7h6' },
      { path: '/bank-import',  label: 'Bank Import',    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
      { path: '/treasury',    label: 'Treasury',         icon: 'M3 6l9-4 9 4M3 6v12l9 4 9-4V6M12 2v20' },
      { path: '/procurement', label: 'Procurement',      icon: 'M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM12 14a2 2 0 110-4 2 2 0 010 4z' },
      { path: '/payroll',     label: 'Payroll',          icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z' },
    { path: '/gst-portal',  label: 'GST Portal',       icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
      { path: '/tax',         label: 'Tax & GST',        icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
      { path: '/budgeting',   label: 'Budgeting',        icon: 'M18 20V10M12 20V4M6 20v-6' },
      { path: '/statements',  label: 'Statements',       icon: 'M9 17v-2m3 2v-4m3 4v-6M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z' },
      { path: '/reports',      label: 'Reports',          icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { path: '/expenses',    label: 'Expenses',         icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
      { path: '/assets',      label: 'Fixed Assets',     icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
      { path: '/inventory',   label: 'Inventory',        icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
      { path: '/projects',    label: 'Projects',         icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { path: '/compliance',  label: 'Compliance',       icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
      { path: '/crm',         label: 'CRM',              icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
    ],
  },
  {
    label: 'AI Agents',
    items: [
      { path: '/my-dashboard',     label: 'My Dashboard',     icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
      { path: '/workflow-designer', label: 'Workflow Studio',  icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
      { path: '/knowledge-graph',   label: 'Knowledge Graph',  icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18' },
      { path: '/ai-agents',         label: 'AI Agents',        icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
      { path: '/automation-logs', label: 'Automation Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
      { path: '/automation',   label: 'Automation',      icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
      { path: '/tax-agent',    label: 'Tax Agent',       icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18' },
      { path: '/audit',        label: 'Audit Agent',     icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
      { path: '/email-ai',     label: 'Email AI',        icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
      { path: '/document-ai',  label: 'Document AI',     icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
      { path: '/digitaltwin',  label: 'Digital Twin',    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    ],
  },
  {
    label: 'Enterprise',
    items: [
      { path: '/drive-monitor', label: 'Drive Monitor', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
      { path: '/governance-docs', label: 'Governance Docs', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { path: '/compliance-docs', label: 'Compliance Docs', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
      { path: '/corporate-docs', label: 'Corporate Docs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { path: '/audit-trail',  label: 'Audit Trail',      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
      { path: '/companies',    label: 'Multi-Company',    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { path: '/api-portal',   label: 'API Portal',       icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
      { path: '/white-label',  label: 'White Label',      icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
      { path: '/marketplace',  label: 'Marketplace',     icon: 'M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z' },
      { path: '/tally',        label: 'Tally Sync',      icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
      { path: '/whatsapp',     label: 'WhatsApp',        icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
      { path: '/scheduler',    label: 'Scheduler',       icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
      { path: '/sdk',          label: 'Developer SDK',   icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
      { path: '/ai-studio',    label: 'AI Studio',       icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { path: '/team',         label: 'Team & Access',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      { path: '/billing',      label: 'Billing',         icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
      { path: '/export',       label: 'Data Export',     icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
      { path: '/admin',        label: 'Platform Admin',  icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    ],
  },
];

// ── SVG Icon ────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

// ── Sidebar ─────────────────────────────────────────────────

// ── Collapsible Nav Groups ───────────────────────────────────
function CollapsibleNav() {
  const defaultOpen = { Intelligence: true, Finance: true, Operations: false, 'AI Agents': false, Enterprise: false, Settings: false };
  const [open, setOpen] = React.useState(defaultOpen);
  const toggle = (label) => setOpen(prev => ({ ...prev, [label]: !prev[label] }));
  return (
    <>
      {NAV_GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: 2 }}>
          <button onClick={() => toggle(group.label)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 3px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{group.label}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', transition: 'transform 0.2s', display: 'inline-block', transform: open[group.label] ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </button>
          {open[group.label] && group.items.map(item => (
            <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
              marginBottom: 1, fontSize: 12.5, fontWeight: isActive ? 600 : 400, textDecoration: 'none',
              color: isActive ? '#1B4FD8' : 'rgba(255,255,255,0.85)', background: isActive ? '#FFFFFF' : 'transparent',
            })}>
              <Icon d={item.icon} size={14} color="currentColor" />
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </>
  );
}

function Sidebar({ user, tenant, onLogout }) {
  return (
    <aside style={{ width: 220, flexShrink: 0, background: '#1B4FD8', borderRight: 'none', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Logo */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>D</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tenant?.name || 'Deemona'}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>AI Finance OS</div>
        </div>
      </div>
      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        <CollapsibleNav />
      </nav>
      {/* Footer */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#1B4FD8,#60A5FA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {(user?.first_name || user?.name || 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.first_name || user?.name || 'User'}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize' }}>{user?.role_name || 'Owner'}</div>
          </div>
          <button onClick={onLogout} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4, borderRadius: 4, display: 'flex' }}>
            <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px 0' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} />
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>All modules active</div>
        </div>
      </div>
    </aside>
  );
}

// ── TopBar ──────────────────────────────────────────────────
function TopBar({ title, subtitle }) {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif,  setShowNotif]  = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [searchQ,    setSearchQ]    = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); }
      if (e.key === 'Escape') { setShowSearch(false); setShowNotif(false); setShowNew(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { if (showSearch && searchRef.current) searchRef.current.focus(); }, [showSearch]);

  const QUICK = [
    { label: 'AP Invoice',      path: '/accounting',  icon: '📋' },
    { label: 'AR Invoice',      path: '/accounting',  icon: '📄' },
    { label: 'Add Employee',    path: '/payroll',     icon: '👤' },
    { label: 'Record Payment',  path: '/treasury',    icon: '💳' },
    { label: 'Expense Claim',   path: '/expenses',    icon: '🧾' },
    { label: 'Add Vendor',      path: '/procurement', icon: '🏭' },
    { label: 'New Project',     path: '/projects',    icon: '📊' },
    { label: 'Ask Digital CFO', path: '/cfo',         icon: '💼' },
    { label: 'Upload Invoice',  path: '/document-ai', icon: '🔍' },
    { label: 'Analyze Email',   path: '/email-ai',    icon: '✉️' },
  ];

  const NOTIFS = [
    { text: 'GST GSTR-3B due in 12 days', time: '2h ago', color: '#D97706', path: '/tax-agent' },
    { text: 'Invoice awaiting approval',   time: '3h ago', color: '#1B4FD8', path: '/accounting' },
    { text: 'July payroll approved',       time: '1d ago', color: '#059669', path: '/payroll' },
    { text: 'Low cash — runway 8 months',  time: '1d ago', color: '#DC2626', path: '/cfo' },
    { text: 'PF challan due on 15th',      time: '2d ago', color: '#D97706', path: '/compliance' },
  ];

  const filtered = searchQ ? QUICK.filter(q => q.label.toLowerCase().includes(searchQ.toLowerCase())) : QUICK;
  const closeAll = () => { setShowSearch(false); setShowNotif(false); setShowNew(false); };

  const inp = { fontSize: 14, background: 'none', border: 'none', outline: 'none', color: '#0F172A', width: '100%' };

  return (
    <>
      {(showSearch || showNotif || showNew) && <div onClick={closeAll} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.3)', zIndex: 100, backdropFilter: 'blur(2px)' }} />}

      {showSearch && (
        <div style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', width: 560, zIndex: 101, borderRadius: 12, background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 20px 60px rgba(15,23,42,0.15)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
            <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={16} color="#94A3B8" />
            <input ref={searchRef} value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search actions, modules..." style={inp} />
            <kbd style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#64748B', fontFamily: 'inherit' }}>ESC</kbd>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            <div style={{ padding: '8px 18px 4px', fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Quick Actions</div>
            {filtered.map((item, i) => (
              <a key={i} href={item.path} onClick={closeAll} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', textDecoration: 'none', color: '#334155' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#CBD5E1' }}>Enter</span>
              </a>
            ))}
          </div>
          <div style={{ padding: '8px 18px', borderTop: '1px solid #F1F5F9', fontSize: 11, color: '#94A3B8' }}>Ctrl+K to open, ESC to close</div>
        </div>
      )}

      {showNotif && (
        <div style={{ position: 'fixed', top: 60, right: 20, width: 360, zIndex: 101, borderRadius: 12, background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 16px 48px rgba(15,23,42,0.12)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Notifications</span>
            <button onClick={closeAll} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>x</button>
          </div>
          {NOTIFS.map((n, i) => (
            <a key={i} href={n.path} onClick={closeAll} style={{ display: 'flex', gap: 12, padding: '11px 16px', borderBottom: '1px solid #F8FAFC', textDecoration: 'none', color: 'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.color, flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#334155', fontWeight: 500, marginBottom: 2 }}>{n.text}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{n.time}</div>
              </div>
            </a>
          ))}
          <div style={{ padding: '10px 16px', textAlign: 'center' }}>
            <a href="/compliance" style={{ fontSize: 12, color: '#1B4FD8', fontWeight: 600, textDecoration: 'none' }}>View all notifications</a>
          </div>
        </div>
      )}

      {showNew && (
        <div style={{ position: 'fixed', top: 60, right: 20, width: 240, zIndex: 101, borderRadius: 12, background: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 16px 48px rgba(15,23,42,0.12)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #F1F5F9', fontSize: 12, fontWeight: 700, color: '#0A1628' }}>Quick Create</div>
          {QUICK.slice(0, 6).map((item, i) => (
            <a key={i} href={item.path} onClick={closeAll} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', textDecoration: 'none', color: '#334155', borderBottom: '1px solid #F8FAFC', fontSize: 12 }}
              onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      )}

      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #C7D9F8', padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, boxShadow: '0 1px 4px rgba(27,79,216,0.08)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: '#0A1628', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 11, color: '#3B5998', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</p>}
        </div>
        <button onClick={() => setShowSearch(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#F0F5FF', border: '1px solid #C7D9F8', borderRadius: 7, width: 220, cursor: 'pointer', transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#1B4FD8'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}>
          <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" size={13} color="#94A3B8" />
          <span style={{ fontSize: 12, color: '#94A3B8', flex: 1, textAlign: 'left' }}>Search anywhere...</span>
          <kbd style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#94A3B8', fontFamily: 'inherit' }}>Ctrl K</kbd>
        </button>
        <div style={{ position: 'relative' }}>
          <button onClick={() => { setShowNotif(!showNotif); setShowNew(false); }} style={{ width: 32, height: 32, borderRadius: 7, background: showNotif ? '#1B4FD8' : '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: showNotif ? '#fff' : '#475569' }}>
            <Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" size={15} />
          </button>
          <div style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: '#DC2626', fontSize: 8, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>5</div>
        </div>
        <button style={{ width: 32, height: 32, borderRadius: 7, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569', fontSize: 13, fontWeight: 700 }}>?</button>
        <button onClick={() => { setShowNew(!showNew); setShowNotif(false); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, background: '#1B4FD8', color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 1px 3px rgba(27,79,216,0.3)', transition: 'background 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#1440B5'}
          onMouseLeave={e => e.currentTarget.style.background = '#1B4FD8'}>
          <Icon d="M12 5v14M5 12h14" size={13} color="#fff" />
          New
        </button>
      </div>
    </>
  );
}

// ── Right Panel ─────────────────────────────────────────────
function RightPanel() {
  const CATS = [
    { label: 'Approvals',    color: '#059669', count: 0 },
    { label: 'Transactions', color: '#1B4FD8', count: 0 },
    { label: 'Rejections',   color: '#DC2626', count: 0 },
    { label: 'AI Insights',  color: '#7C3AED', count: 0 },
    { label: 'Alerts',       color: '#D97706', count: 0 },
  ];
  return (
    <div style={{ width: 240, flexShrink: 0, background: '#F0F5FF', borderLeft: '1px solid #C7D9F8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #C7D9F8', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Memory Insights</div>
        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>Real-time activity</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        <div style={{ padding: '12px', borderRadius: 8, background: '#DBEAFE', border: '1px solid #93B4EF', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>AI Summary</span>
            <span style={{ fontSize: 10, color: '#1B4FD8', fontWeight: 600, cursor: 'pointer' }}>View</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.6 }}>No activity recorded yet. Start using Deemona to build financial memory.</div>
          <div style={{ marginTop: 10, height: 36, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            {[20,35,28,45,38,55,42,60,48,58].map((h,i) => (
              <div key={i} style={{ flex: 1, height: h+'%', background: i===9?'#1B4FD8':'#DBEAFE', borderRadius: 2 }} />
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Top Categories</div>
          {CATS.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 12, color: '#475569' }}>{c.label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{c.count}</div>
            </div>
          ))}
          <button style={{ marginTop: 4, fontSize: 11, color: '#1B4FD8', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 600 }}>View all categories</button>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Recent Activity</div>
          <div style={{ padding: '16px 12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 6, opacity: 0.25 }}>[ ]</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 3 }}>No recent activity</div>
            <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>Activities appear here as your team uses the platform.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Layout ──────────────────────────────────────────────────
function Layout({ title, subtitle, children }) {
  const { user, tenant, logout } = useAuth();
  const [showRight, setShowRight] = React.useState(true);
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#EEF3FD' }}>
      <Sidebar user={user} tenant={tenant} onLogout={logout} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar title={title} subtitle={subtitle} />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>{children}</div>
          {showRight && <RightPanel />}
        </div>
      </div>
      <button
        onClick={() => setShowRight(p => !p)}
        title={showRight ? 'Hide panel' : 'Show panel'}
        style={{ position: 'fixed', right: showRight ? 252 : 10, bottom: 24, zIndex: 99, width: 30, height: 30, borderRadius: '50%', background: '#1B4FD8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(27,79,216,0.4)', transition: 'right 0.25s' }}
      >{showRight ? '›' : '‹'}</button>
    </div>
  );
}

function AuthGate() {
  const [showRegister, setShowRegister] = useState(false);
  return showRegister
    ? <RegisterPage onSwitch={() => setShowRegister(false)} />
    : <LoginPage onSwitch={() => setShowRegister(true)} />;
}

// ── App ─────────────────────────────────────────────────────
export default function App() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF3FD' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#1B4FD8,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 auto 14px' }}>D</div>
        <div style={{ fontSize: 13, color: '#64748B' }}>Loading Deemona AI Finance OS...</div>
      </div>
    </div>
  );

  const isPublicRoute = ['/', '/landing'].includes(window.location.pathname);
  if (!user && !isPublicRoute) return <AuthGate />;

  const routes = [
    { path: '/',             title: 'Deemona Finance OS', sub: 'India\'s first AI-native finance platform.', comp: <LandingPage />, public: true },
    { path: '/compliance-docs', title: 'Compliance Docs', sub: 'SOX, transfer pricing, dividends, CapEx, whistleblower.', comp: <Batch2DocsPage /> },
    { path: '/governance-docs', title: 'Governance Docs', sub: 'Corporate charter, policies, KYC, regulatory filings.', comp: <Batch3DocsPage /> },
    { path: '/data-ingest', title: 'Data Ingestion', sub: 'Import CSV, JSON data — all modules update automatically.', comp: <DataIngestionPage /> },
    { path: '/finance-hub', title: 'Finance Command Center', sub: '10 dashboards in one place.', comp: <FinanceDashboardHub /> },
    { path: '/enterprise-finance', title: 'Enterprise Financial Performance', sub: 'Consolidated P&L, KPIs, AR/AP, budget and operational overview.', comp: <EnterpriseFinanceDashboard /> },
    { path: '/collections-dunning', title: 'Collections & Dunning', sub: 'Overdue invoices, collection performance and dunning actions.', comp: <CollectionsDunningDashboard /> },
    { path: '/corporate-docs', title: 'Corporate Documents', sub: 'Source documents, loans, risk register, governance.', comp: <MissingDocsPage /> },
    { path: '/automation-logs', title: 'Automation Center', sub: 'Monitor and test all automated workflows.', comp: <AutomationLogsPage /> },
    { path: '/drive-monitor', title: 'Drive Monitor', sub: 'Autonomous Google Drive monitoring.', comp: <DriveMonitorPage /> },
    { path: '/drive-monitor', title: 'Drive Monitor', sub: 'Autonomous Google Drive financial file monitoring.', comp: <DriveMonitorPage /> },
    { path: '/bank-import',  title: 'Bank Import',    sub: 'Import CSV from Indian banks.', comp: <BankStatementImporter /> },
    { path: '/reports',      title: 'Custom Reports', sub: 'Build and export reports.', comp: <CustomReportBuilder /> },
    { path: '/app',           title: 'Finance Memory',        sub: 'Every decision and insight, searchable forever.',     comp: <FinanceMemoryPage /> },
    { path: '/gst-portal', title: 'GST Portal', sub: 'File GST returns and track ITC.', comp: <GSTPortalPage /> },
    { path: '/onboarding', title: 'Setup Wizard', sub: 'Company setup.', comp: <OnboardingWizard onComplete={() => { window.location.href = '/dashboard'; }} /> },
    { path: '/memory',       title: 'Finance Memory',        sub: 'Every decision and insight, searchable forever.',     comp: <FinanceMemoryPage /> },
    { path: '/decision',     title: 'AI Decision Center',    sub: 'Your executive financial command center.',            comp: <DecisionCenter /> },
    { path: '/accounting',   title: 'Accounting',            sub: 'General Ledger, Journal Entries, AP and AR.',         comp: <AccountingPage /> },
    { path: '/treasury',     title: 'Treasury',              sub: 'Bank accounts, cash position, and liquidity.',        comp: <TreasuryPage /> },
    { path: '/procurement',  title: 'Procurement',           sub: 'Purchase orders, vendors, and approval workflow.',    comp: <ProcurementPage /> },
    { path: '/payroll',      title: 'Payroll',               sub: 'Employee management, salary processing, PF and TDS.', comp: <PayrollPage /> },
    { path: '/tax',          title: 'Tax and GST',           sub: 'Filing calendar, TDS, advance tax, and compliance.',  comp: <TaxPage /> },
    { path: '/budgeting',    title: 'Budgeting',             sub: 'Annual budgets, department planning, AI forecasts.',  comp: <BudgetingPage /> },
    { path: '/expenses',     title: 'Expenses',              sub: 'Employee claims, approvals, and reimbursements.',     comp: <ExpensesPage /> },
    { path: '/assets',       title: 'Fixed Assets',          sub: 'Asset register, depreciation, and disposal.',        comp: <AssetsPage /> },
    { path: '/inventory',    title: 'Inventory',             sub: 'Stock management, reorder alerts, and movements.',   comp: <InventoryPage /> },
    { path: '/projects',     title: 'Projects',              sub: 'Project budgets, timelines, and cost tracking.',     comp: <ProjectsPage /> },
    { path: '/compliance',   title: 'Compliance',            sub: 'Statutory deadlines, penalties, and calendar.',      comp: <CompliancePage /> },
    { path: '/crm',          title: 'CRM',                   sub: 'Sales pipeline, leads, and customer revenue.',       comp: <CRMPage /> },
    { path: '/digitaltwin',  title: 'Digital Twin',          sub: 'Simulate scenarios before making real decisions.',   comp: <DigitalTwinPage /> },
    { path: '/statements',   title: 'Financial Statements',  sub: 'P&L, Balance Sheet, and Cash Flow.',                 comp: <StatementsPage /> },
    { path: '/cfo',          title: 'Digital CFO',           sub: 'AI-powered executive financial intelligence.',       comp: <CFOAgentPage /> },
    { path: '/document-ai',  title: 'Document AI',           sub: 'Invoice OCR and automated AP entry creation.',       comp: <DocumentAIPage /> },
    { path: '/automation',   title: 'Automation Studio',     sub: 'Visual workflow builder for finance automation.',    comp: <AutomationPage /> },
    { path: '/tax-agent',    title: 'Tax Agent',             sub: 'GST computation, TDS management, and tax advisory.', comp: <TaxAgentPage /> },
    { path: '/audit',        title: 'Audit Agent',           sub: 'Anomaly detection, fraud alerts, and audit trail.',  comp: <AuditAgentPage /> },
    { path: '/marketplace',  title: 'Agent Marketplace',     sub: 'Enable and manage AI agents for your organization.', comp: <MarketplacePage /> },
    { path: '/tally',        title: 'Tally XML Sync',        sub: 'Export data as Tally-compatible XML vouchers.',      comp: <TallyPage /> },
    { path: '/whatsapp',     title: 'WhatsApp Integration',  sub: 'Send approvals and alerts via WhatsApp.',            comp: <WhatsAppPage /> },
    { path: '/email-ai',     title: 'Email AI',              sub: 'Read financial emails and create entries automatically.', comp: <EmailAIPage /> },
    { path: '/forecasting',  title: 'Forecasting Engine',    sub: '90-day cash, revenue, and expense forecasts.',       comp: <ForecastingPage /> },
    { path: '/scheduler',    title: 'Scheduled Jobs',        sub: 'Automate recurring finance tasks with cron jobs.',   comp: <SchedulerPage /> },
    { path: '/sdk',          title: 'Developer SDK',         sub: 'Open API, API keys, and code examples.',             comp: <SDKPage /> },
    { path: '/ai-studio',    title: 'AI Studio',             sub: 'Custom AI models, industry templates, and training.', comp: <AIStudioPage /> },
    { path: '/team',         title: 'Team and Access',       sub: 'Manage team members, roles, and permissions.',       comp: <RBACPage /> },
    { path: '/billing',      title: 'Billing and Plans',     sub: 'Manage subscription, usage limits, and payments.',   comp: <BillingPage /> },
    { path: '/export',       title: 'Data Export',           sub: 'Export data in JSON, CSV, or Tally XML format.',     comp: <DataExportPage /> },
    { path: '/workflow-designer', title: 'Workflow Designer', sub: 'Visual drag-drop automation builder.', comp: <WorkflowDesigner /> },
    { path: '/my-dashboard', title: 'My Dashboard', sub: 'Personalized role-based workspace.', comp: <PersonalDashboard /> },
    { path: '/knowledge-graph', title: 'Knowledge Graph', sub: 'Visual enterprise knowledge explorer.', comp: <KnowledgeGraph /> },
    { path: '/ai-agents', title: 'AI Agents', sub: 'Your intelligent AI workforce.', comp: <AIAgentsPage /> },
    { path: '/landing', title: 'Deemona Finance OS', sub: 'Landing page.', comp: <LandingPage /> },
    { path: '/dashboard',    title: 'Executive Dashboard',   sub: 'Charts, KPIs, and financial analytics.',  comp: <DashboardPage /> },
    { path: '/audit-trail', title: 'Audit Trail', sub: 'Complete event history and change log.', comp: <AuditTrailPage /> },
    { path: '/companies', title: 'Multi-Company', sub: 'Manage subsidiaries, branches, and group P&L.', comp: <MultiCompanyPage /> },
    { path: '/api-portal', title: 'API Marketplace', sub: 'REST API, webhooks, SDKs, and playground.', comp: <NewAPIMarketplace /> },
    { path: '/white-label', title: 'White Label', sub: 'Branding, colors, domain.', comp: <WhiteLabelPage /> },
    { path: '/admin',        title: 'Platform Admin',        sub: 'Platform-wide tenant management and analytics.',     comp: <AdminPage /> },
  ];

  return (
    <BrowserRouter>
      <Routes>
        {routes.map(r => (
          <Route key={r.path} path={r.path} element={
            <Layout title={r.title} subtitle={r.sub}>{r.comp}</Layout>
          } />
        ))}
      </Routes>
    </BrowserRouter>
  );
}








