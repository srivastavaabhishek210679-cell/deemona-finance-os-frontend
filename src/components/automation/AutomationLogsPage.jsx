import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); return await r.json(); } catch { return {}; } };
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); return await r.json(); } catch (e) { return { error: e.message }; } };

const AUTOMATIONS = [
  { id: 'invoice_approval',  label: 'Invoice Auto-Approval',      icon: '📋', color: '#1B4FD8', desc: 'Creates test AP invoice ≤ Rs 50K and triggers auto-approval',         endpoint: '/api/automation/test/invoice-approval' },
  { id: 'expense_approval',  label: 'Expense Auto-Approval',      icon: '🧾', color: '#059669', desc: 'Creates test expense claim ≤ Rs 15K and triggers auto-approval',       endpoint: '/api/automation/test/expense-approval' },
  { id: 'low_cash',          label: 'Low Cash Alert',             icon: '💰', color: '#DC2626', desc: 'Simulates low cash condition and sends WhatsApp + email alert',         endpoint: '/api/automation/test/low-cash' },
  { id: 'compliance',        label: 'Compliance Alert',           icon: '📅', color: '#D97706', desc: 'Checks compliance items due within 7 days and sends reminders',         endpoint: '/api/automation/test/compliance' },
  { id: 'lead_nurture',      label: 'Lead Auto-Nurture',          icon: '🎯', color: '#7C3AED', desc: 'Creates test CRM lead and sends AI-generated welcome email',            endpoint: '/api/automation/test/lead-nurture' },
  { id: 'bank_recon',        label: 'Bank Reconciliation',        icon: '🏦', color: '#0284C7', desc: 'Runs auto-match of bank transactions to AR invoices',                   endpoint: '/api/automation/test/bank-recon' },
  { id: 'vendor_payment',    label: 'Vendor Payment Scheduler',   icon: '💳', color: '#D97706', desc: 'Checks AP invoices due in 3 days and sends payment reminders',          endpoint: '/api/automation/test/vendor-payment' },
  { id: 'gst_reminder',      label: 'GST Filing Reminder',        icon: '🏛️', color: '#DC2626', desc: 'Sends GST filing reminder email immediately (normally on 13th)',        endpoint: '/api/automation/test/gst-reminder' },
  { id: 'payroll_reminder',  label: 'Payroll Run Reminder',       icon: '👥', color: '#1B4FD8', desc: 'Sends payroll processing reminder (normally on 28th of month)',         endpoint: '/api/automation/test/payroll-reminder' },
  { id: 'whatsapp_approval', label: 'WhatsApp Approval Flow',     icon: '💬', color: '#059669', desc: 'Simulates APPROVE reply for pending invoice via WhatsApp',              endpoint: '/api/automation/test/whatsapp-approval' },
];

const TYPE_COLORS = {
  INVOICE_AUTO_APPROVAL: '#1B4FD8', INVOICE_APPROVAL_REQUEST: '#7C3AED',
  WHATSAPP_APPROVAL: '#059669', EXPENSE_AUTO_APPROVAL: '#059669',
  LOW_CASH_ALERT: '#DC2626', COMPLIANCE_ALERT: '#D97706',
  LEAD_NURTURE_EMAIL: '#7C3AED', BANK_RECONCILIATION: '#0284C7',
  PAYMENT_SCHEDULED: '#D97706', GST_REMINDER: '#DC2626',
  PAYROLL_REMINDER: '#1B4FD8', LEAD_FOLLOWUP_SCHEDULED: '#7C3AED',
};

export default function AutomationLogsPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [tab, setTab] = useState('dashboard');
  const [testing, setTesting] = useState({});
  const [testResults, setTestResults] = useState({});
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [l, s] = await Promise.all([
      get('/api/automation/logs'),
      get('/api/automation/stats'),
    ]);
    setLogs(l.logs || []);
    setStats(s.stats || {});
    setLoading(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const runTest = async (automation) => {
    setTesting(p => ({...p, [automation.id]: true}));
    setTestResults(p => ({...p, [automation.id]: null}));
    const res = await post(automation.endpoint, {});
    setTestResults(p => ({...p, [automation.id]: res}));
    setTesting(p => ({...p, [automation.id]: false}));
    setTimeout(load, 2000); // Refresh logs after test
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.automation_type === filter);
  const uniqueTypes = [...new Set(logs.map(l => l.automation_type))];

  const totalSuccess = logs.filter(l => l.status === 'success' || l.status === 'sent' || l.status === 'matched' || l.status === 'notified').length;
  const totalFailed  = logs.filter(l => l.status === 'error' || l.status === 'failed').length;

  return (
    <div style={{padding:24,background:'#EEF3FD',minHeight:'100%'}}>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:800,color:'#0A1628',marginBottom:4}}>Automation Center</h1>
          <div style={{fontSize:13,color:'#64748B'}}>Monitor, test and manage all 10 automated workflows running in the background.</div>
        </div>
        <button onClick={load} style={{padding:'8px 16px',borderRadius:8,border:'1px solid #C7D9F8',background:'#F0F5FF',color:'#1B4FD8',fontSize:12,fontWeight:600,cursor:'pointer'}}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
        {[
          {label:'Total Automations', value:10,              color:'#1B4FD8', icon:'⚡'},
          {label:'Actions Taken',     value:logs.length,     color:'#7C3AED', icon:'📊'},
          {label:'Successful',        value:totalSuccess,    color:'#059669', icon:'✅'},
          {label:'Errors',            value:totalFailed,     color:totalFailed>0?'#DC2626':'#059669', icon:'⚠️'},
        ].map((s,i) => (
          <div key={i} style={{padding:'14px 16px',borderRadius:10,background:'#fff',border:'1px solid #C7D9F8'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <div style={{fontSize:11,color:'#64748B',fontWeight:600}}>{s.label}</div>
              <span>{s.icon}</span>
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

      {/* Dashboard tab */}
      {tab === 'dashboard' && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          {/* Automation status cards */}
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:16}}>Automation Status</div>
            {AUTOMATIONS.map(a => {
              const lastLog = logs.find(l => l.automation_type?.toLowerCase().includes(a.id.split('_')[0]));
              const hasRun = !!lastLog;
              return (
                <div key={a.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #F8FAFC'}}>
                  <div style={{width:36,height:36,borderRadius:9,background:a.color+'15',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{a.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:'#0A1628'}}>{a.label}</div>
                    <div style={{fontSize:11,color:'#64748B'}}>{lastLog ? `Last run: ${new Date(lastLog.created_at).toLocaleString('en-IN')}` : 'Not yet triggered'}</div>
                  </div>
                  <div style={{padding:'3px 10px',borderRadius:10,fontSize:10,fontWeight:700,background:hasRun?'#ECFDF5':'#F0F5FF',color:hasRun?'#059669':'#1B4FD8'}}>
                    {hasRun ? 'Active' : 'Ready'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent activity */}
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:16}}>Recent Activity</div>
            {loading ? (
              <div style={{color:'#94A3B8',fontSize:13,textAlign:'center',padding:20}}>Loading...</div>
            ) : logs.length === 0 ? (
              <div style={{color:'#94A3B8',fontSize:13,textAlign:'center',padding:20}}>No activity yet. Run a test to see automations in action.</div>
            ) : (
              <div style={{maxHeight:480,overflowY:'auto'}}>
                {logs.slice(0,20).map((log,i) => (
                  <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'8px 0',borderBottom:'1px solid #F8FAFC'}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:log.status==='error'?'#DC2626':log.status==='pending'?'#D97706':'#059669',marginTop:5,flexShrink:0}} />
                    <div style={{flex:1}}>
                      <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:2}}>
                        <span style={{fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:4,background:(TYPE_COLORS[log.automation_type]||'#64748B')+'15',color:TYPE_COLORS[log.automation_type]||'#64748B'}}>{log.automation_type?.replace(/_/g,' ')}</span>
                        <span style={{fontSize:10,color:log.status==='error'?'#DC2626':'#059669',fontWeight:600}}>{log.status}</span>
                      </div>
                      <div style={{fontSize:11,color:'#64748B',lineHeight:1.4}}>{log.detail?.substring(0,80)}</div>
                    </div>
                    <div style={{fontSize:10,color:'#94A3B8',flexShrink:0,whiteSpace:'nowrap'}}>{new Date(log.created_at).toLocaleTimeString('en-IN')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test tab */}
      {tab === 'test' && (
        <div>
          <div style={{padding:'12px 16px',borderRadius:10,background:'#FFFBEB',border:'1px solid #FDE68A',fontSize:12,color:'#92400E',marginBottom:16}}>
            ⚠️ Test automations will trigger real emails and WhatsApp messages. Use with caution in production.
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {AUTOMATIONS.map(a => (
              <div key={a.id} style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:18}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                  <div style={{width:42,height:42,borderRadius:10,background:a.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{a.icon}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:'#0A1628'}}>{a.label}</div>
                    <div style={{fontSize:11,color:'#64748B',lineHeight:1.4}}>{a.desc}</div>
                  </div>
                </div>

                {testResults[a.id] && (
                  <div style={{padding:'8px 12px',borderRadius:8,background:testResults[a.id].error?'#FEF2F2':'#ECFDF5',border:`1px solid ${testResults[a.id].error?'#FECACA':'#A7F3D0'}`,fontSize:12,color:testResults[a.id].error?'#DC2626':'#059669',marginBottom:10}}>
                    {testResults[a.id].error ? '❌ ' + testResults[a.id].error : '✅ ' + (testResults[a.id].message || 'Test completed successfully')}
                    {testResults[a.id].detail && <div style={{marginTop:4,fontSize:11,opacity:0.8}}>{testResults[a.id].detail}</div>}
                  </div>
                )}

                <button onClick={() => runTest(a)} disabled={testing[a.id]}
                  style={{width:'100%',padding:'9px',borderRadius:8,border:'none',background:testing[a.id]?'#93B4EF':a.color,color:'#fff',fontSize:12,fontWeight:700,cursor:testing[a.id]?'not-allowed':'pointer'}}>
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
          {/* Filter */}
          <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
            <button onClick={() => setFilter('all')} style={{padding:'5px 12px',borderRadius:7,border:`1px solid ${filter==='all'?'#1B4FD8':'#E2E8F0'}`,background:filter==='all'?'#EEF3FD':'#fff',color:filter==='all'?'#1B4FD8':'#64748B',fontSize:12,fontWeight:600,cursor:'pointer'}}>All ({logs.length})</button>
            {uniqueTypes.map(type => (
              <button key={type} onClick={() => setFilter(type)} style={{padding:'5px 12px',borderRadius:7,border:`1px solid ${filter===type?(TYPE_COLORS[type]||'#1B4FD8'):'#E2E8F0'}`,background:filter===type?(TYPE_COLORS[type]||'#1B4FD8')+'15':'#fff',color:filter===type?(TYPE_COLORS[type]||'#1B4FD8'):'#64748B',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                {type.replace(/_/g,' ')} ({logs.filter(l=>l.automation_type===type).length})
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
                  <tr><td colSpan={4} style={{padding:40,textAlign:'center',color:'#94A3B8'}}>No automation logs yet. Run a test to see activity.</td></tr>
                ) : filteredLogs.map((log,i) => (
                  <tr key={i} style={{borderTop:'1px solid #F1F5F9',background:i%2===0?'#fff':'#FAFBFF'}}>
                    <td style={{padding:'10px 14px'}}>
                      <span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,background:(TYPE_COLORS[log.automation_type]||'#64748B')+'15',color:TYPE_COLORS[log.automation_type]||'#64748B',whiteSpace:'nowrap'}}>
                        {log.automation_type?.replace(/_/g,' ')}
                      </span>
                    </td>
                    <td style={{padding:'10px 14px'}}>
                      <span style={{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:700,
                        background:['error','failed'].includes(log.status)?'#FEF2F2':['pending'].includes(log.status)?'#FFFBEB':'#ECFDF5',
                        color:['error','failed'].includes(log.status)?'#DC2626':['pending'].includes(log.status)?'#D97706':'#059669'}}>
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
