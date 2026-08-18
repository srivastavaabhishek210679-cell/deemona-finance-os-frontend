import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); return await r.json(); } catch { return {}; } };
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); return await r.json(); } catch (e) { return { error: e.message }; } };

const AUTOMATIONS = [
  // Original 10
  { id: 'invoice_approval',   label: 'Invoice Auto-Approval',        icon: '📋', color: '#1B4FD8', desc: 'Auto-approve AP invoices under Rs 50K, request approval for larger ones', endpoint: '/api/automation/test/invoice-approval', schedule: 'On invoice creation' },
  { id: 'expense_approval',   label: 'Expense Auto-Approval',        icon: '🧾', color: '#059669', desc: 'Auto-approve expense claims under Rs 15K and email employee', endpoint: '/api/automation/test/expense-approval', schedule: 'On expense submission' },
  { id: 'low_cash',           label: 'Low Cash Alert',               icon: '💰', color: '#DC2626', desc: 'Alert when cash drops below Rs 20L threshold via email + WhatsApp', endpoint: '/api/automation/test/low-cash', schedule: 'Every 15 minutes' },
  { id: 'compliance',         label: 'Compliance Deadline Alert',     icon: '📅', color: '#D97706', desc: 'Remind team 7 days before GST/TDS/PF filing due dates', endpoint: '/api/automation/test/compliance', schedule: 'Every 15 minutes' },
  { id: 'lead_nurture',       label: 'Lead Auto-Nurture',            icon: '🎯', color: '#7C3AED', desc: 'AI-generated welcome email when new CRM lead is created', endpoint: '/api/automation/test/lead-nurture', schedule: 'On lead creation' },
  { id: 'bank_recon',         label: 'Bank Reconciliation',          icon: '🏦', color: '#0284C7', desc: 'Auto-match bank transactions to AR invoices', endpoint: '/api/automation/test/bank-recon', schedule: 'Every hour' },
  { id: 'vendor_payment',     label: 'Vendor Payment Scheduler',     icon: '💳', color: '#D97706', desc: 'Alert 3 days before AP invoices are due for payment', endpoint: '/api/automation/test/vendor-payment', schedule: 'Every 15 minutes' },
  { id: 'gst_reminder',       label: 'GST Filing Reminder',          icon: '🏛️', color: '#DC2626', desc: 'Remind team to file GST returns 5 days before due date', endpoint: '/api/automation/test/gst-reminder', schedule: '13th of month' },
  { id: 'payroll_reminder',   label: 'Payroll Run Reminder',         icon: '👥', color: '#1B4FD8', desc: 'Remind to run payroll on 28th of every month', endpoint: '/api/automation/test/payroll-reminder', schedule: '28th of month' },
  { id: 'whatsapp_approval',  label: 'WhatsApp Approval Flow',       icon: '💬', color: '#059669', desc: 'Process APPROVE/REJECT replies from WhatsApp for invoice approvals', endpoint: '/api/automation/test/whatsapp-approval', schedule: 'On WhatsApp reply' },
  // Batch 1 - 15 new
  { id: 'morning_brief',      label: 'Daily Morning Brief',          icon: '🌅', color: '#F59E0B', desc: 'AI summary of cash, overdue invoices, compliance — emailed at 8AM daily', endpoint: '/api/automation/test/morning-brief', schedule: 'Daily 8AM IST' },
  { id: 'weekly_digest',      label: 'Weekly Finance Digest',        icon: '📊', color: '#7C3AED', desc: 'Week-over-week revenue, expenses, top categories — every Monday', endpoint: '/api/automation/test/weekly-digest', schedule: 'Monday 9AM IST' },
  { id: 'payment_reminders',  label: 'Invoice Payment Reminders',    icon: '📧', color: '#DC2626', desc: 'Auto-send payment reminders to customers for overdue AR invoices', endpoint: '/api/automation/test/payment-reminders', schedule: 'Daily 8AM IST' },
  { id: 'payslip_dist',       label: 'Payslip Auto-Distribution',    icon: '💵', color: '#059669', desc: 'Auto-email payslips to all employees after payroll is run', endpoint: '/api/automation/test/payslip-distribution', schedule: 'After payroll run' },
  { id: 'fraud_detection',    label: 'Fraud Detection',              icon: '🔍', color: '#DC2626', desc: 'Detect duplicate invoices, round numbers, weekend entries', endpoint: '/api/automation/test/fraud-detection', schedule: 'Every 30 minutes' },
  { id: 'gstin_check',        label: 'Vendor GSTIN Compliance',      icon: '✅', color: '#059669', desc: 'Validate all vendor GSTINs and flag invalid ones', endpoint: '/api/automation/test/gstin-check', schedule: 'Every 30 minutes' },
  { id: 'cashflow_pred',      label: 'Cash Flow Prediction',         icon: '📈', color: '#1B4FD8', desc: 'AI predicts 30/60/90 day cash position based on receivables/payables', endpoint: '/api/automation/test/cashflow-prediction', schedule: 'Every 15 minutes' },
  { id: 'budget_burnout',     label: 'Budget Burnout Predictor',     icon: '🔥', color: '#D97706', desc: 'Predict which departments will exhaust budget before period ends', endpoint: '/api/automation/test/budget-burnout', schedule: 'Every 6 hours' },
  { id: 'aging_report',       label: 'Invoice Aging Report',         icon: '📑', color: '#0284C7', desc: 'Daily AR aging report with 30/60/90 day buckets', endpoint: '/api/automation/test/aging-report', schedule: 'Daily 8AM IST' },
  { id: 'tds_tracking',       label: 'TDS Auto-Tracking',            icon: '🏦', color: '#7C3AED', desc: 'Calculate monthly TDS liability and send summary to finance team', endpoint: '/api/automation/test/tds-tracking', schedule: 'Every 6 hours' },
  { id: 'credit_limits',      label: 'Credit Limit Monitor',         icon: '🔔', color: '#DC2626', desc: 'Alert when customer outstanding exceeds 80% of credit limit', endpoint: '/api/automation/test/credit-limits', schedule: 'Every 30 minutes' },
  { id: 'expense_policy',     label: 'Expense Policy Enforcement',   icon: '🚫', color: '#DC2626', desc: 'Auto-reject expense claims that violate company policy limits', endpoint: '/api/automation/test/expense-policy', schedule: 'Every 30 minutes' },
  { id: 'statutory_dates',    label: 'Statutory Due Dates',          icon: '📆', color: '#D97706', desc: 'Daily reminders for GST/TDS/PF/advance tax statutory deadlines', endpoint: '/api/automation/test/statutory-dates', schedule: 'Every 15 minutes' },
  { id: 'probation_monitor',  label: 'Probation/Contract Monitor',   icon: '👤', color: '#0284C7', desc: 'Alert HR when employee probation or contracts are ending', endpoint: '/api/automation/test/contract-monitor', schedule: 'Every 6 hours' },
  { id: 'budget_realloc',     label: 'Smart Budget Reallocation',    icon: '♻️', color: '#059669', desc: 'AI recommends budget reallocation between over/under-spending departments', endpoint: '/api/automation/test/budget-reallocation', schedule: 'Every 6 hours' },
  // Batch 3 - 8 more
  { id: 'recurring_invoices', label: 'Recurring Invoice Generation', icon: '🔄', color: '#1B4FD8', desc: 'Auto-generate and email invoices on scheduled dates', endpoint: '/api/automation/test/recurring-invoices', schedule: 'Every 6 hours' },
  { id: 'revenue_forecast',   label: 'Revenue Forecasting AI',       icon: '📉', color: '#7C3AED', desc: 'AI analyzes 6-month trend to forecast next 30/60/90 days revenue', endpoint: '/api/automation/test/revenue-forecast', schedule: '1st of month' },
  { id: 'payment_patterns',   label: 'Customer Payment Patterns',    icon: '🧠', color: '#0284C7', desc: 'Analyze which customers pay late and who pays early', endpoint: '/api/automation/test/payment-patterns', schedule: 'Every 6 hours' },
  { id: 'contract_renewal',   label: 'Contract Renewal Alerts',      icon: '📋', color: '#D97706', desc: 'Alert 60/14 days before contracts expire for renewal', endpoint: '/api/automation/test/contract-renewal', schedule: 'Every 6 hours' },
  { id: 'insurance_track',    label: 'Insurance Premium Tracker',    icon: '🛡️', color: '#059669', desc: 'Alert 60 days before insurance policy expiry for renewal', endpoint: '/api/automation/test/insurance-track', schedule: 'Every 6 hours' },
  { id: 'pf_ecr',             label: 'PF/ESI ECR File Generation',   icon: '📄', color: '#1B4FD8', desc: 'Auto-generate ECR file for EPFO portal after payroll run', endpoint: '/api/automation/test/pf-ecr', schedule: '1st of month' },
  { id: 'appraisal_trigger',  label: 'Increment/Appraisal Trigger',  icon: '⭐', color: '#F59E0B', desc: 'Flag employees completing 1 year for performance review', endpoint: '/api/automation/test/appraisal-trigger', schedule: 'Every 6 hours' },
  { id: 'budget_realloc2',    label: 'Budget Reallocation AI',       icon: '💡', color: '#7C3AED', desc: 'Monthly AI recommendation for budget reallocation across departments', endpoint: '/api/automation/test/budget-reallocation-monthly', schedule: '1st of month' },
];

const SCHEDULE_COLORS = {
  'On invoice creation': '#1B4FD8', 'On expense submission': '#059669', 'On lead creation': '#7C3AED',
  'On WhatsApp reply': '#059669', 'After payroll run': '#1B4FD8', 'After payroll': '#1B4FD8',
  'Every 15 minutes': '#D97706', 'Every 30 minutes': '#DC2626', 'Every hour': '#0284C7',
  'Every 6 hours': '#7C3AED', 'Daily 8AM IST': '#F59E0B', 'Monday 9AM IST': '#7C3AED',
  '13th of month': '#DC2626', '28th of month': '#1B4FD8', '1st of month': '#059669',
};

const TYPE_COLORS = {
  INVOICE_AUTO_APPROVAL:'#1B4FD8',INVOICE_APPROVAL_REQUEST:'#7C3AED',WHATSAPP_APPROVAL:'#059669',
  EXPENSE_AUTO_APPROVAL:'#059669',LOW_CASH_ALERT:'#DC2626',COMPLIANCE_ALERT:'#D97706',
  LEAD_NURTURE_EMAIL:'#7C3AED',BANK_RECONCILIATION:'#0284C7',PAYMENT_SCHEDULED:'#D97706',
  GST_REMINDER:'#DC2626',PAYROLL_REMINDER:'#1B4FD8',DAILY_MORNING_BRIEF:'#F59E0B',
  WEEKLY_DIGEST:'#7C3AED',PAYMENT_REMINDER:'#DC2626',PAYSLIP_DISTRIBUTED:'#059669',
  FRAUD_DETECTION:'#DC2626',GSTIN_COMPLIANCE:'#059669',CASHFLOW_PREDICTION:'#1B4FD8',
  BUDGET_BURNOUT:'#D97706',AGING_REPORT:'#0284C7',TDS_TRACKING:'#7C3AED',
  CREDIT_LIMIT_ALERT:'#DC2626',EXPENSE_POLICY:'#DC2626',STATUTORY_ALERT:'#D97706',
  PROBATION_ALERT:'#0284C7',CONTRACT_ALERT:'#D97706',BUDGET_REALLOCATION:'#059669',
  RECURRING_INVOICE:'#1B4FD8',REVENUE_FORECAST:'#7C3AED',PAYMENT_PATTERN:'#0284C7',
  CONTRACT_RENEWAL:'#D97706',INSURANCE_ALERT:'#059669',PF_ECR_GENERATED:'#1B4FD8',
  APPRAISAL_TRIGGER:'#F59E0B',
};

export default function AutomationLogsPage() {
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const l = await get('/api/automation/logs');
    setLogs(l.logs || []);
    setLoading(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const runTest = async (automation) => {
    setTesting(p => ({...p, [automation.id]: true}));
    setTestResults(p => ({...p, [automation.id]: null}));
    const res = await post(automation.endpoint, {});
    setTestResults(p => ({...p, [automation.id]: res}));
    setTesting(p => ({...p, [automation.id]: false}));
    setTimeout(load, 2000);
  };

  const totalSuccess = logs.filter(l => ['success','sent','matched','notified','generated','passed','recommended'].includes(l.status)).length;
  const totalFailed  = logs.filter(l => ['error','failed','rejected'].includes(l.status)).length;
  const filteredLogs = filter === 'all' ? logs : logs.filter(l => (l.automation_type||'') === filter);
  const uniqueTypes = [...new Set(logs.map(l => l.automation_type).filter(Boolean))];
  const filteredAutomations = search ? AUTOMATIONS.filter(a => a.label.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase())) : AUTOMATIONS;

  const scheduleGroups = {};
  AUTOMATIONS.forEach(a => {
    if (!scheduleGroups[a.schedule]) scheduleGroups[a.schedule] = [];
    scheduleGroups[a.schedule].push(a);
  });

  return (
    <div style={{padding:24,background:'#EEF3FD',minHeight:'100%'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:800,color:'#0A1628',marginBottom:4}}>Automation Center</h1>
          <div style={{fontSize:13,color:'#64748B'}}>{AUTOMATIONS.length} automated workflows running 24/7 — monitor, test and manage all automations.</div>
        </div>
        <button onClick={load} style={{padding:'8px 16px',borderRadius:8,border:'1px solid #C7D9F8',background:'#F0F5FF',color:'#1B4FD8',fontSize:12,fontWeight:600,cursor:'pointer'}}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
        {[
          {label:'Total Automations', value:AUTOMATIONS.length, color:'#1B4FD8', icon:'⚡'},
          {label:'Actions Logged',    value:logs.length,         color:'#7C3AED', icon:'📊'},
          {label:'Successful',        value:totalSuccess,        color:'#059669', icon:'✅'},
          {label:'Errors',            value:totalFailed,         color:totalFailed>0?'#DC2626':'#059669', icon:'⚠️'},
        ].map((s,i) => (
          <div key={i} style={{padding:'14px 16px',borderRadius:10,background:'#fff',border:'1px solid #C7D9F8'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <div style={{fontSize:11,color:'#64748B',fontWeight:600}}>{s.label}</div>
              <span style={{fontSize:16}}>{s.icon}</span>
            </div>
            <div style={{fontSize:24,fontWeight:800,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid #C7D9F8',marginBottom:20}}>
        {[['dashboard','⚡ Dashboard'],['test','🧪 Test Automations'],['logs','📋 Activity Log']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{padding:'10px 18px',fontSize:13,fontWeight:600,background:'none',border:'none',borderBottom:tab===id?'2px solid #1B4FD8':'2px solid transparent',color:tab===id?'#1B4FD8':'#64748B',cursor:'pointer',marginBottom:-1}}>{label}</button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div>
          {Object.entries(scheduleGroups).map(([schedule, autos]) => (
            <div key={schedule} style={{marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{padding:'4px 12px',borderRadius:20,background:(SCHEDULE_COLORS[schedule]||'#64748B')+'15',border:'1px solid '+(SCHEDULE_COLORS[schedule]||'#64748B')+'30',fontSize:11,fontWeight:700,color:SCHEDULE_COLORS[schedule]||'#64748B'}}>{schedule}</div>
                <div style={{fontSize:11,color:'#94A3B8'}}>{autos.length} automation{autos.length>1?'s':''}</div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
                {autos.map(a => {
                  const lastLog = logs.find(l => l.automation_type && (l.automation_type.toLowerCase().includes(a.id.split('_')[0]) || a.id.toLowerCase().includes((l.automation_type||'').toLowerCase().split('_')[0])));
                  return (
                    <div key={a.id} style={{background:'#fff',borderRadius:10,border:'1px solid #C7D9F8',padding:14,display:'flex',gap:12,alignItems:'flex-start'}}>
                      <div style={{width:36,height:36,borderRadius:9,background:a.color+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{a.icon}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:'#0A1628',marginBottom:2}}>{a.label}</div>
                        <div style={{fontSize:10,color:'#64748B',lineHeight:1.4,marginBottom:6}}>{a.desc}</div>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{padding:'2px 8px',borderRadius:10,fontSize:9,fontWeight:700,background:lastLog?'#ECFDF5':'#F0F5FF',color:lastLog?'#059669':'#1B4FD8'}}>{lastLog?'Active':'Ready'}</div>
                          {lastLog && <div style={{fontSize:9,color:'#94A3B8'}}>{new Date(lastLog.created_at).toLocaleTimeString('en-IN')}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test tab */}
      {tab === 'test' && (
        <div>
          <div style={{marginBottom:16,display:'flex',gap:12,alignItems:'center'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search automations..." style={{flex:1,padding:'9px 14px',borderRadius:8,border:'1px solid #C7D9F8',fontSize:13,outline:'none',fontFamily:'inherit'}} />
            <div style={{fontSize:12,color:'#64748B'}}>{filteredAutomations.length} automations</div>
          </div>
          <div style={{padding:'10px 14px',borderRadius:8,background:'#FFFBEB',border:'1px solid #FDE68A',fontSize:12,color:'#92400E',marginBottom:16}}>
            Tests trigger real emails/WhatsApp. Use with caution in production.
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            {filteredAutomations.map(a => (
              <div key={a.id} style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:16}}>
                <div style={{display:'flex',gap:12,alignItems:'flex-start',marginBottom:12}}>
                  <div style={{width:38,height:38,borderRadius:10,background:a.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{a.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#0A1628'}}>{a.label}</div>
                    <div style={{fontSize:11,color:'#64748B',lineHeight:1.4,marginTop:2}}>{a.desc}</div>
                    <div style={{fontSize:10,color:SCHEDULE_COLORS[a.schedule]||'#64748B',fontWeight:600,marginTop:4}}>{a.schedule}</div>
                  </div>
                </div>
                {testResults[a.id] && (
                  <div style={{padding:'8px 12px',borderRadius:8,background:testResults[a.id].error?'#FEF2F2':'#ECFDF5',border:'1px solid '+(testResults[a.id].error?'#FECACA':'#A7F3D0'),fontSize:12,color:testResults[a.id].error?'#DC2626':'#059669',marginBottom:10}}>
                    {testResults[a.id].error ? '❌ ' + testResults[a.id].error : '✅ ' + (testResults[a.id].message || 'Test completed')}
                    {testResults[a.id].detail && <div style={{marginTop:4,fontSize:11,opacity:0.8}}>{testResults[a.id].detail}</div>}
                  </div>
                )}
                <button onClick={() => runTest(a)} disabled={testing[a.id]}
                  style={{width:'100%',padding:'8px',borderRadius:8,border:'none',background:testing[a.id]?'#93B4EF':a.color,color:'#fff',fontSize:12,fontWeight:700,cursor:testing[a.id]?'not-allowed':'pointer'}}>
                  {testing[a.id] ? '⏳ Running...' : '▶ Run Test'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs tab */}
      {tab === 'logs' && (
        <div>
          <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
            <button onClick={() => setFilter('all')} style={{padding:'5px 12px',borderRadius:7,border:'1px solid '+(filter==='all'?'#1B4FD8':'#E2E8F0'),background:filter==='all'?'#EEF3FD':'#fff',color:filter==='all'?'#1B4FD8':'#64748B',fontSize:12,fontWeight:600,cursor:'pointer'}}>All ({logs.length})</button>
            {uniqueTypes.map(type => (
              <button key={type} onClick={() => setFilter(type)} style={{padding:'5px 12px',borderRadius:7,border:'1px solid '+(filter===type?(TYPE_COLORS[type]||'#1B4FD8'):'#E2E8F0'),background:filter===type?(TYPE_COLORS[type]||'#1B4FD8')+'15':'#fff',color:filter===type?(TYPE_COLORS[type]||'#1B4FD8'):'#64748B',fontSize:10,fontWeight:600,cursor:'pointer'}}>
                {(type||'').replace(/_/g,' ')} ({logs.filter(l=>l.automation_type===type).length})
              </button>
            ))}
          </div>
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{background:'#F0F5FF'}}>
                {['Type','Status','Detail','Time'].map(h => (
                  <th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:700,color:'#3B5998',fontSize:11}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan={4} style={{padding:40,textAlign:'center',color:'#94A3B8'}}>No logs yet. Run a test to see activity.</td></tr>
                ) : filteredLogs.map((log,i) => (
                  <tr key={i} style={{borderTop:'1px solid #F1F5F9',background:i%2===0?'#fff':'#FAFBFF'}}>
                    <td style={{padding:'10px 14px'}}>
                      <span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:(TYPE_COLORS[log.automation_type||'']||'#64748B')+'15',color:TYPE_COLORS[log.automation_type||'']||'#64748B',whiteSpace:'nowrap'}}>
                        {(log.automation_type||'unknown').replace(/_/g,' ')}
                      </span>
                    </td>
                    <td style={{padding:'10px 14px'}}>
                      <span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:['error','failed','rejected'].includes(log.status)?'#FEF2F2':['pending'].includes(log.status)?'#FFFBEB':'#ECFDF5',color:['error','failed','rejected'].includes(log.status)?'#DC2626':'#059669'}}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{padding:'10px 14px',color:'#334155',maxWidth:300,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{log.detail}</td>
                    <td style={{padding:'10px 14px',color:'#64748B',whiteSpace:'nowrap'}}>{new Date(log.created_at).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
