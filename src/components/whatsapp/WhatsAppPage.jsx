import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const postAPI = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); return await r.json(); } catch (e) { return { error: e.message }; } };
const getAPI = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); return await r.json(); } catch { return {}; } };

const TEMPLATES = [
  { id: 'custom',           label: 'Custom Message' },
  { id: 'invoice_approval', label: 'Invoice Approval',    fields: ['invoice_number','amount','vendor','due_date'] },
  { id: 'payment_received', label: 'Payment Received',    fields: ['invoice_number','amount','customer'] },
  { id: 'gst_reminder',     label: 'GST Filing Reminder', fields: ['filing_type','period','due_date','amount'] },
  { id: 'payroll_approved', label: 'Payroll Approved',    fields: ['month','year','count','amount'] },
  { id: 'low_cash_alert',   label: 'Low Cash Alert',      fields: ['cash','runway'] },
];

export default function WhatsAppPage() {
  const [status, setStatus] = useState(null);
  const [tab, setTab] = useState('compose');
  const [to, setTo] = useState('+91');
  const [selectedTemplate, setSelectedTemplate] = useState('custom');
  const [customMessage, setCustomMessage] = useState('');
  const [fields, setFields] = useState({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    getAPI('/api/whatsapp/status').then(d => setStatus(d));
    getAPI('/api/whatsapp/logs').then(d => setLogs(d.logs || []));
  }, []);

  const tpl = TEMPLATES.find(t => t.id === selectedTemplate);

  const buildPreview = () => {
    if (selectedTemplate === 'custom') return customMessage || 'Your message will appear here';
    if (selectedTemplate === 'invoice_approval') return `*Deemona Finance* - Approval Required\n\nInvoice: ${fields.invoice_number||'TVI-2026-001'}\nAmount: Rs ${fields.amount||'51,800'}\nVendor: ${fields.vendor||'AWS India'}\nDue: ${fields.due_date||'20 Aug 2026'}\n\nReply APPROVE or REJECT`;
    if (selectedTemplate === 'payment_received') return `Payment Received\n\nInvoice: ${fields.invoice_number||'TVI-2026-001'}\nAmount: Rs ${fields.amount||'51,800'}\nFrom: ${fields.customer||'Flipkart'}`;
    if (selectedTemplate === 'gst_reminder') return `GST Reminder\n\n${fields.filing_type||'GSTR-3B'} for ${fields.period||'August 2026'} due ${fields.due_date||'20 Aug 2026'}\nEstimated: Rs ${fields.amount||'3,42,000'}`;
    if (selectedTemplate === 'payroll_approved') return `Payroll Approved\n\n${fields.month||'August'} ${fields.year||'2026'} - ${fields.count||'11'} employees\nTotal: Rs ${fields.amount||'10,50,000'}`;
    if (selectedTemplate === 'low_cash_alert') return `Cash Alert\n\nBalance: Rs ${fields.cash||'91,00,000'}\nRunway: ${fields.runway||'8.2'} months`;
    return '';
  };

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    const cleanTo = to.trim().replace(/\s/g, '');
    const payload = {
      to: cleanTo.startsWith('+') ? cleanTo : '+' + cleanTo,
      template: selectedTemplate,
      message: selectedTemplate === 'custom' ? customMessage : undefined,
      data: selectedTemplate !== 'custom' ? fields : undefined,
    };
    console.log('[WhatsApp UI] Sending:', JSON.stringify(payload));
    const res = await postAPI('/api/whatsapp/send', payload);
    console.log('[WhatsApp UI] Result:', JSON.stringify(res));
    setResult(res);
    setSending(false);
    if (res.success) getAPI('/api/whatsapp/logs').then(d => setLogs(d.logs || []));
  };

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628', marginBottom: 4 }}>WhatsApp Integration</h1>
          <div style={{ fontSize: 13, color: '#64748B' }}>Send approvals, alerts, and notifications via WhatsApp.</div>
        </div>
        <div style={{ padding: '8px 14px', borderRadius: 8, background: status?.configured ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${status?.configured ? '#A7F3D0' : '#FECACA'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: status?.configured ? '#059669' : '#DC2626' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: status?.configured ? '#059669' : '#DC2626' }}>
            {status?.configured ? 'Twilio Connected · ' + status.from_number : 'Not Configured'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #C7D9F8', marginBottom: 20 }}>
        {[['compose','✉️ Compose'],['logs','📋 Message Log'],['templates','📝 Templates']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', borderBottom: tab === id ? '2px solid #1B4FD8' : '2px solid transparent', color: tab === id ? '#1B4FD8' : '#64748B', cursor: 'pointer', marginBottom: -1 }}>{label}</button>
        ))}
      </div>

      {tab === 'compose' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 16 }}>Compose Message</div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 5 }}>To (WhatsApp Number)</label>
              <input value={to} onChange={e => setTo(e.target.value)} placeholder="+91 9XXXXXXXXX"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 5 }}>Template</label>
              <select value={selectedTemplate} onChange={e => { setSelectedTemplate(e.target.value); setFields({}); setCustomMessage(''); }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', background: '#fff' }}>
                {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            {selectedTemplate === 'custom' ? (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 5 }}>Message</label>
                <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)} placeholder="Type your WhatsApp message..." rows={4}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical' }} />
              </div>
            ) : (
              <div>
                {(tpl?.fields || []).map(field => (
                  <div key={field} style={{ marginBottom: 10 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4, textTransform: 'capitalize' }}>{field.replace(/_/g,' ')}</label>
                    <input value={fields[field] || ''} onChange={e => setFields(p => ({...p, [field]: e.target.value}))} placeholder={field.replace(/_/g,' ')}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleSend} disabled={sending}
              style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', background: sending ? '#86EFAC' : '#25D366', color: '#fff', fontSize: 14, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', marginTop: 8 }}>
              {sending ? 'Sending...' : '📱 Send WhatsApp Message'}
            </button>

            {result && (
              <div style={{ marginTop: 12, padding: '12px', borderRadius: 8, background: result.success ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${result.success ? '#A7F3D0' : '#FECACA'}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: result.success ? '#059669' : '#DC2626' }}>
                  {result.success ? '✅ Message sent! SID: ' + result.sid : '❌ Failed: ' + (result.error || JSON.stringify(result))}
                </div>
                {result.success && <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Note: Sandbox requires recipient to have joined via "join missing-numeral"</div>}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 12 }}>Message Preview</div>
            <div style={{ background: '#ECE5DD', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ background: '#075E54', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>D</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Deemona Finance</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Twilio Sandbox</div>
                </div>
              </div>
              <div style={{ padding: 16, minHeight: 200 }}>
                <div style={{ background: '#fff', borderRadius: '0 8px 8px 8px', padding: '10px 14px', maxWidth: '85%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: 13, color: '#0A1628', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{buildPreview()}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', textAlign: 'right', marginTop: 4 }}>{new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})} ✓✓</div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: 12, color: '#92400E' }}>
              ⚠️ Twilio sandbox: recipient must send "join missing-numeral" to +14155238886 first.
            </div>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', fontSize: 13, fontWeight: 700 }}>Message Log</div>
          {logs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>No messages sent yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ background: '#F0F5FF' }}>
                {['To','Template','Status','Sent At'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11 }}>{log.to_number}</td>
                    <td style={{ padding: '10px 14px', color: '#7C3AED' }}>{log.template}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: log.status==='sent'?'#ECFDF5':'#FEF2F2', color: log.status==='sent'?'#059669':'#DC2626' }}>{log.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748B' }}>{log.sent_at ? new Date(log.sent_at).toLocaleString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'templates' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {TEMPLATES.filter(t => t.id !== 'custom').map(t => (
            <div key={t.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 8 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>Fields: {(t.fields||[]).join(', ')||'none'}</div>
              <button onClick={() => { setSelectedTemplate(t.id); setTab('compose'); }}
                style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#25D366', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Use Template
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
