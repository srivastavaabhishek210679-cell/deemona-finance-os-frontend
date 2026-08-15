import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { const r = await fetch(apiURL(url), { headers: h() }); return r.json(); };
const post = async (url, body) => { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); return r.json(); };

export default function WhatsAppPage() {
  const [tab, setTab] = useState('compose');
  const [config, setConfig] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [messages, setMessages] = useState([]);
  const [to, setTo] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [aiRecipient, setAiRecipient] = useState('');
  const [aiGenerated, setAiGenerated] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [cfgPhone, setCfgPhone] = useState('');
  const [cfgProvider, setCfgProvider] = useState('twilio');

  useEffect(() => {
    get('/api/whatsapp/config').then(d => { setConfig(d); if (d.config?.phone_number) setCfgPhone(d.config.phone_number); });
    get('/api/whatsapp/templates').then(d => setTemplates(d.templates||[]));
    get('/api/whatsapp/messages').then(d => setMessages(d.messages||[]));
  }, []);

  const sendMessage = async () => {
    if (!to) return;
    setSending(true); setSendResult(null);
    const body = { to, template: selectedTemplate||undefined, custom_message: customMessage||aiGenerated||undefined };
    const data = await post('/api/whatsapp/send', body);
    setSendResult(data);
    setSending(false);
    if (data.success) {
      setMessages(prev => [{ to_number: to, message: customMessage||aiGenerated||'Template message', status: data.status, created_at: new Date() }, ...prev]);
    }
  };

  const generateAI = async () => {
    if (!aiContext.trim()) return;
    setGenerating(true); setAiGenerated('');
    const data = await post('/api/whatsapp/ai-message', { context: aiContext, recipient: aiRecipient, tone: 'professional' });
    setAiGenerated(data.message||'');
    setGenerating(false);
  };

  const sendBulk = async (type) => {
    const data = await post('/api/whatsapp/bulk-alert', { alert_type: type });
    alert(`${data.total_queued} messages queued for ${data.alert_type?.replace(/_/g,' ')}`);
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    await post('/api/whatsapp/config', { phone_number: cfgPhone, provider: cfgProvider, notifications: { invoice_approval: true, payment_confirmation: true, overdue_alerts: true, gst_reminders: true, payroll_processed: true, low_cash_alert: true, compliance_deadline: true } });
    setSavingConfig(false);
    const d = await get('/api/whatsapp/config');
    setConfig(d);
  };

  const previewTemplate = templates.find(t => t.id === selectedTemplate)?.preview;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 6 }}>WhatsApp Integration</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Send approvals, alerts, and notifications via WhatsApp — preferred channel for Indian businesses</p>
      </div>

      {/* Status banner */}
      <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: config?.configured ? '#22C98A12' : '#F5A62312', border: `1px solid ${config?.configured ? '#22C98A30' : '#F5A62330'}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: config?.configured ? '#22C98A' : '#F5A623' }}>
          {config?.configured ? '✓ WhatsApp connected — messages will be delivered' : '⚠ WhatsApp not configured — messages will be simulated'}
        </div>
        {!config?.configured && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Go to Settings tab to connect Twilio, WATI, or another provider</div>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {[['compose','✉️ Compose'],['ai','✨ AI Write'],['bulk','📢 Bulk Alerts'],['logs','📋 Message Log'],['settings','⚙️ Settings']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '10px 18px', fontSize: 14, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', borderBottom: tab===id ? '2px solid #25D366' : '2px solid transparent', color: tab===id ? '#25D366' : 'var(--text-secondary)', marginBottom: -1 }}>{label}</button>
        ))}
      </div>

      {/* Compose */}
      {tab === 'compose' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>To (WhatsApp Number)</div>
              <input value={to} onChange={e => setTo(e.target.value)} placeholder="+91 98765 43210" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 14 }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Template (optional)</div>
              <select value={selectedTemplate} onChange={e => { setSelectedTemplate(e.target.value); setCustomMessage(''); }} style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 14 }}>
                <option value="">Select a template...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {!selectedTemplate && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Custom Message</div>
                <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="Type your WhatsApp message..." rows={6} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
            )}

            {sendResult && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 14, background: sendResult.success ? '#22C98A12' : '#FF5C5C12', border: `1px solid ${sendResult.success ? '#22C98A30' : '#FF5C5C30'}`, color: sendResult.success ? '#22C98A' : '#FF5C5C', fontSize: 13 }}>
                {sendResult.success ? `✓ Message ${sendResult.status}${sendResult.note ? ` — ${sendResult.note}` : ''}` : `Error: ${sendResult.error}`}
              </div>
            )}

            <button onClick={sendMessage} disabled={!to || sending || (!selectedTemplate && !customMessage && !aiGenerated)} style={{ width: '100%', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: (!to || sending) ? 'var(--surface-3)' : 'linear-gradient(135deg,#25D366,#128C7E)', color: (!to || sending) ? 'var(--text-muted)' : '#fff', border: 'none', cursor: (!to || sending) ? 'not-allowed' : 'pointer' }}>
              {sending ? '⏳ Sending...' : '📱 Send WhatsApp'}
            </button>
          </div>

          {/* Preview */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-muted)' }}>MESSAGE PREVIEW</div>
            <div style={{ borderRadius: 12, background: '#ECE5DD', padding: 16, minHeight: 200 }}>
              <div style={{ background: '#fff', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', maxWidth: '85%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: 13, color: '#303030', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {previewTemplate || customMessage || aiGenerated || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Your message will appear here</span>}
                </div>
                <div style={{ fontSize: 11, color: '#aaa', textAlign: 'right', marginTop: 4 }}>
                  {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Write */}
      {tab === 'ai' && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Recipient</div>
            <input value={aiRecipient} onChange={e => setAiRecipient(e.target.value)} placeholder="e.g. vendor, customer, employee, CFO" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 14 }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Describe what to communicate</div>
            <textarea value={aiContext} onChange={e => setAiContext(e.target.value)} placeholder="e.g. Remind Reliance Jio that their invoice TVI-2026-023 for Rs 8.85 lakh is due in 3 days and we'd appreciate early payment..." rows={4} style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <button onClick={generateAI} disabled={!aiContext.trim() || generating} style={{ marginBottom: 20, padding: '10px 24px', borderRadius: 9, fontSize: 14, fontWeight: 700, background: (!aiContext.trim() || generating) ? 'var(--surface-3)' : 'linear-gradient(135deg,#6C63FF,#9B8FFF)', color: (!aiContext.trim() || generating) ? 'var(--text-muted)' : '#fff', border: 'none', cursor: (!aiContext.trim() || generating) ? 'not-allowed' : 'pointer' }}>
            {generating ? '✨ Writing...' : '✨ Generate with AI'}
          </button>

          {aiGenerated && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Generated Message</div>
              <div style={{ borderRadius: 12, background: '#ECE5DD', padding: 16, marginBottom: 14 }}>
                <div style={{ background: '#fff', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', maxWidth: '85%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{aiGenerated}</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={to} onChange={e => setTo(e.target.value)} placeholder="+91 phone number" style={{ flex: 1, padding: '10px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 14 }} />
                <button onClick={sendMessage} disabled={!to || sending} style={{ padding: '10px 20px', borderRadius: 9, fontSize: 14, fontWeight: 700, background: (!to || sending) ? 'var(--surface-3)' : 'linear-gradient(135deg,#25D366,#128C7E)', color: (!to || sending) ? 'var(--text-muted)' : '#fff', border: 'none', cursor: (!to || sending) ? 'not-allowed' : 'pointer' }}>
                  {sending ? '...' : '📱 Send'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk Alerts */}
      {tab === 'bulk' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[
            { id: 'overdue_ar', icon: '💰', title: 'Overdue AR Reminders', desc: 'Send payment reminders to all customers with overdue invoices', color: '#FF5C5C' },
            { id: 'compliance_deadlines', icon: '⚖️', title: 'Compliance Deadline Alerts', desc: 'Alert team about upcoming GST, TDS, and ROC filing deadlines', color: '#F5A623' },
            { id: 'invoice_approval', icon: '✅', title: 'Pending Approvals', desc: 'Notify approvers about AP invoices waiting for their approval', color: '#6C63FF' },
            { id: 'low_cash', icon: '🚨', title: 'Low Cash Alert', desc: 'Alert CFO and finance team if cash falls below threshold', color: '#FF5C5C' },
          ].map(alert => (
            <div key={alert.id} style={{ borderRadius: 12, border: '1px solid var(--border)', padding: 20, background: 'var(--surface-2)' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{alert.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{alert.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>{alert.desc}</div>
              <button onClick={() => sendBulk(alert.id)} style={{ width: '100%', padding: '9px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: alert.color, color: '#fff', border: 'none', cursor: 'pointer' }}>
                Send Bulk Alert
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Log */}
      {tab === 'logs' && (
        <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', background: 'var(--surface-3)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>SENT MESSAGES</div>
          {messages.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No messages sent yet</div>
          ) : messages.map((msg, i) => (
            <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>To: {msg.to_number}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{msg.message?.substring(0, 80)}...</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: msg.status==='sent' ? '#22C98A20' : msg.status==='simulated' ? '#F5A62320' : 'var(--surface-3)', color: msg.status==='sent' ? '#22C98A' : msg.status==='simulated' ? '#F5A623' : 'var(--text-muted)' }}>{msg.status}</span>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{new Date(msg.created_at).toLocaleString('en-IN')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings */}
      {tab === 'settings' && (
        <div style={{ maxWidth: 600 }}>
          <div style={{ marginBottom: 20, padding: 20, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>WhatsApp Provider Setup</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Your WhatsApp Number</div>
              <input value={cfgPhone} onChange={e => setCfgPhone(e.target.value)} placeholder="+91 98765 43210" style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 14 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>Provider</div>
              <select value={cfgProvider} onChange={e => setCfgProvider(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 14 }}>
                {config?.providers?.map(p => <option key={p.id} value={p.id}>{p.name} — {p.description}</option>)}
              </select>
            </div>
            <button onClick={saveConfig} disabled={savingConfig} style={{ padding: '10px 24px', borderRadius: 9, fontSize: 14, fontWeight: 700, background: savingConfig ? 'var(--surface-3)' : 'linear-gradient(135deg,#25D366,#128C7E)', color: savingConfig ? 'var(--text-muted)' : '#fff', border: 'none', cursor: 'pointer' }}>
              {savingConfig ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

          <div style={{ padding: 16, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Backend environment variables required:</div>
            <code style={{ display: 'block', background: 'var(--surface-3)', padding: 10, borderRadius: 6, fontSize: 12, fontFamily: 'monospace' }}>
              TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxx{'\n'}
              TWILIO_AUTH_TOKEN=your_auth_token{'\n'}
              TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
            </code>
            <div style={{ marginTop: 8 }}>Add these to your Render backend environment variables. Get your Twilio credentials at <a href="https://console.twilio.com" target="_blank" rel="noreferrer" style={{ color: '#25D366' }}>console.twilio.com</a></div>
          </div>
        </div>
      )}
    </div>
  );
}
