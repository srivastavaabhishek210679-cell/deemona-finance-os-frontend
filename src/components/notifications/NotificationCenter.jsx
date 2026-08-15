import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); const t = await r.text(); return JSON.parse(t); } catch { return {}; } };
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); const t = await r.text(); return JSON.parse(t); } catch (e) { return { error: e.message }; } };

// ── White-label Settings ──────────────────────────────────────
export function WhiteLabelPage() {
  const [settings, setSettings] = useState({
    company_name: 'Deemona Technologies',
    logo_url: '',
    primary_color: '#1B4FD8',
    secondary_color: '#059669',
    accent_color: '#7C3AED',
    custom_domain: '',
    sidebar_color: '#1B4FD8',
    topbar_style: 'light',
    font_family: 'Inter',
    support_email: 'support@deemona.com',
    support_phone: '+91-11-1234-5678',
    footer_text: 'Powered by Deemona AI Finance OS',
    show_powered_by: true,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const save = async () => {
    setSaving(true);
    await post('/api/admin/white-label', settings);
    localStorage.setItem('white_label', JSON.stringify(settings));
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
    // Apply colors immediately
    document.documentElement.style.setProperty('--primary', settings.primary_color);
    document.documentElement.style.setProperty('--sidebar-bg', settings.sidebar_color);
  };

  const ColorPicker = ({ label, field }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>{label}</label>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="color" value={settings[field]} onChange={e => setSettings(p => ({...p, [field]: e.target.value}))}
          style={{ width: 48, height: 36, borderRadius: 8, border: '1px solid #C7D9F8', cursor: 'pointer', padding: 2 }} />
        <input type="text" value={settings[field]} onChange={e => setSettings(p => ({...p, [field]: e.target.value}))}
          style={{ flex: 1, padding: '8px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', fontFamily: 'monospace' }} />
        <div style={{ width: 36, height: 36, borderRadius: 8, background: settings[field], border: '1px solid #E2E8F0' }} />
      </div>
    </div>
  );

  const Field = ({ label, field, type = 'text', placeholder }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>{label}</label>
      <input type={type} value={settings[field]} onChange={e => setSettings(p => ({...p, [field]: e.target.value}))}
        placeholder={placeholder} style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
    </div>
  );

  const PRESETS = [
    { name: 'Ocean Blue', primary: '#1B4FD8', sidebar: '#1B4FD8', secondary: '#059669', accent: '#7C3AED' },
    { name: 'Forest Green', primary: '#059669', sidebar: '#065F46', secondary: '#1B4FD8', accent: '#D97706' },
    { name: 'Royal Purple', primary: '#7C3AED', sidebar: '#4C1D95', secondary: '#059669', accent: '#1B4FD8' },
    { name: 'Sunset Orange', primary: '#D97706', sidebar: '#92400E', secondary: '#DC2626', accent: '#7C3AED' },
    { name: 'Midnight Dark', primary: '#334155', sidebar: '#0F172A', secondary: '#1B4FD8', accent: '#059669' },
    { name: 'Corporate Gray', primary: '#475569', sidebar: '#1E293B', secondary: '#0284C7', accent: '#059669' },
  ];

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628', marginBottom: 4 }}>White-Label Settings</h1>
          <div style={{ fontSize: 13, color: '#64748B' }}>Customize branding, colors, and domain for your organization.</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setPreview(p => !p)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #C7D9F8', background: preview ? '#EEF3FD' : '#fff', color: '#1B4FD8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {preview ? '✓ Preview On' : '👁 Preview'}
          </button>
          <button onClick={save} disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: saving ? '#93B4EF' : '#1B4FD8', color: '#fff', fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saved ? '✓ Saved!' : saving ? 'Saving...' : '💾 Save Branding'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: Settings */}
        <div>
          {/* Brand Identity */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 16 }}>🏢 Brand Identity</div>
            <Field label="Company Name" field="company_name" placeholder="Your Company Name" />
            <Field label="Logo URL" field="logo_url" placeholder="https://yourcompany.com/logo.png" />
            <Field label="Support Email" field="support_email" placeholder="support@yourcompany.com" />
            <Field label="Support Phone" field="support_phone" placeholder="+91-11-1234-5678" />
            <Field label="Footer Text" field="footer_text" placeholder="Powered by Your Company" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={settings.show_powered_by} onChange={e => setSettings(p => ({...p, show_powered_by: e.target.checked}))} style={{ accentColor: '#1B4FD8', width: 16, height: 16 }} />
              <label style={{ fontSize: 12, color: '#334155' }}>Show "Powered by Deemona" badge</label>
            </div>
          </div>

          {/* Colors */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 12 }}>🎨 Color Palette</div>

            {/* Presets */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>Quick Presets</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PRESETS.map(preset => (
                  <button key={preset.name} onClick={() => setSettings(p => ({...p, primary_color: preset.primary, sidebar_color: preset.sidebar, secondary_color: preset.secondary, accent_color: preset.accent}))}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#334155' }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: preset.primary }} />
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: preset.secondary }} />
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: preset.accent }} />
                    </div>
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <ColorPicker label="Primary Color (buttons, links)" field="primary_color" />
            <ColorPicker label="Sidebar Color" field="sidebar_color" />
            <ColorPicker label="Secondary Color (success)" field="secondary_color" />
            <ColorPicker label="Accent Color (highlights)" field="accent_color" />
          </div>

          {/* Typography */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 12 }}>✍️ Typography & Style</div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Font Family</label>
              <select value={settings.font_family} onChange={e => setSettings(p => ({...p, font_family: e.target.value}))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', background: '#fff' }}>
                {['Inter', 'Plus Jakarta Sans', 'Poppins', 'DM Sans', 'Nunito', 'Roboto', 'Open Sans'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Topbar Style</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['light', 'colored', 'dark'].map(style => (
                  <button key={style} onClick={() => setSettings(p => ({...p, topbar_style: style}))}
                    style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${settings.topbar_style === style ? '#1B4FD8' : '#E2E8F0'}`, background: settings.topbar_style === style ? '#EEF3FD' : '#F8FAFC', color: settings.topbar_style === style ? '#1B4FD8' : '#334155', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Domain */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 4 }}>🌐 Custom Domain</div>
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>Available on Business and Enterprise plans.</div>
            <Field label="Custom Domain" field="custom_domain" placeholder="finance.yourcompany.com" />
            <div style={{ padding: '10px 12px', borderRadius: 8, background: '#F0F5FF', border: '1px solid #C7D9F8', fontSize: 12, color: '#3B5998' }}>
              <strong>DNS Setup:</strong> Add a CNAME record pointing <code>finance.yourcompany.com</code> to <code>deemona-finance-os-frontend.onrender.com</code>
            </div>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 12 }}>Live Preview</div>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #C7D9F8', boxShadow: '0 4px 20px rgba(27,79,216,0.1)' }}>
            {/* Mock topbar */}
            <div style={{ background: settings.topbar_style === 'colored' ? settings.primary_color : settings.topbar_style === 'dark' ? '#0A1628' : '#fff', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {settings.logo_url ? <img src={settings.logo_url} alt="Logo" style={{ height: 28, borderRadius: 4 }} onError={e => e.target.style.display='none'} /> : (
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: settings.primary_color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 800 }}>
                    {settings.company_name[0]}
                  </div>
                )}
                <span style={{ fontSize: 14, fontWeight: 700, color: settings.topbar_style === 'light' ? '#0A1628' : '#fff', fontFamily: settings.font_family }}>
                  {settings.company_name}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: settings.topbar_style === 'light' ? '#C7D9F8' : 'rgba(255,255,255,0.3)' }} />
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: settings.topbar_style === 'light' ? '#C7D9F8' : 'rgba(255,255,255,0.3)' }} />
              </div>
            </div>

            {/* Mock layout */}
            <div style={{ display: 'flex', height: 320 }}>
              {/* Mock sidebar */}
              <div style={{ width: 160, background: settings.sidebar_color, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                {['Dashboard', 'Accounting', 'Treasury', 'Payroll', 'CRM', 'Projects'].map((item, i) => (
                  <div key={item} style={{ padding: '7px 10px', borderRadius: 6, background: i === 0 ? 'rgba(255,255,255,0.15)' : 'transparent', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 2, background: 'rgba(255,255,255,0.5)' }} />
                    <span style={{ fontSize: 11, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.65)', fontFamily: settings.font_family, fontWeight: i === 0 ? 600 : 400 }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Mock content */}
              <div style={{ flex: 1, background: '#EEF3FD', padding: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {[
                    { label: 'Revenue', value: 'Rs 48 L', color: settings.secondary_color },
                    { label: 'Expenses', value: 'Rs 31 L', color: '#DC2626' },
                  ].map(kpi => (
                    <div key={kpi.label} style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 9, color: '#94A3B8', marginBottom: 3 }}>{kpi.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: kpi.color, fontFamily: settings.font_family }}>{kpi.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 9, color: '#94A3B8', marginBottom: 6 }}>RECENT ACTIVITY</div>
                  {['Invoice created', 'Payment received', 'PO approved'].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: i < 2 ? '1px solid #F8FAFC' : 'none' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: settings.accent_color }} />
                      <span style={{ fontSize: 10, color: '#475569', fontFamily: settings.font_family }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 6, background: settings.primary_color, color: '#fff', fontSize: 10, textAlign: 'center', fontFamily: settings.font_family, fontWeight: 600, cursor: 'pointer' }}>
                  + New Invoice
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '8px 16px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', fontSize: 10, color: '#94A3B8', textAlign: 'center', fontFamily: settings.font_family }}>
              {settings.footer_text}
              {settings.show_powered_by && ' · Powered by Deemona'}
            </div>
          </div>

          {/* Apply button */}
          <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>Changes apply instantly</div>
              <div style={{ fontSize: 11, color: '#065F46' }}>Colors and branding update for all users in your organization.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Notification Center ───────────────────────────────────────
export function NotificationCenter({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    get('/api/notifications').then(d => {
      setNotifications(d.notifications || []);
      setUnread(d.unread || 0);
      setLoading(false);
    }).catch(() => {
      setNotifications([
        { id: 1, type: 'warning', title: 'Overdue Invoices', message: '3 AR invoices are overdue. Take action to collect payment.', created_at: new Date(), read_at: null },
        { id: 2, type: 'alert', title: 'GST Filing Due', message: 'GSTR-3B for August 2026 due in 9 days. Prepare filing.', created_at: new Date(Date.now() - 3600000), read_at: null },
        { id: 3, type: 'info', title: 'Expense Approvals', message: '2 expense claims waiting for your approval.', created_at: new Date(Date.now() - 7200000), read_at: null },
        { id: 4, type: 'success', title: 'Payroll Completed', message: 'July 2026 payroll processed for 11 employees. Total: Rs 10.5L', created_at: new Date(Date.now() - 86400000), read_at: new Date() },
        { id: 5, type: 'info', title: 'New Lead Added', message: 'Cars24 lead moved to Negotiation stage. Value: Rs 15L', created_at: new Date(Date.now() - 172800000), read_at: new Date() },
      ]);
      setUnread(3);
      setLoading(false);
    });
  }, []);

  const markRead = async (id) => {
    await post(`/api/notifications/${id}/read`, {});
    setNotifications(prev => prev.map(n => n.id === id ? {...n, read_at: new Date()} : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await post('/api/notifications/read-all', {});
    setNotifications(prev => prev.map(n => ({...n, read_at: new Date()})));
    setUnread(0);
  };

  const TYPE_STYLES = {
    warning: { bg: '#FFFBEB', border: '#FDE68A', icon: '⚠️', color: '#D97706' },
    alert:   { bg: '#FEF2F2', border: '#FECACA', icon: '🚨', color: '#DC2626' },
    info:    { bg: '#EEF3FD', border: '#C7D9F8', icon: 'ℹ️', color: '#1B4FD8' },
    success: { bg: '#ECFDF5', border: '#A7F3D0', icon: '✅', color: '#059669' },
    workflow:{ bg: '#F5F3FF', border: '#DDD6FE', icon: '⚡', color: '#7C3AED' },
  };

  const timeAgo = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
    return `${Math.floor(diff/1440)}d ago`;
  };

  return (
    <div style={{ position: 'fixed', top: 60, right: 16, width: 380, background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(27,79,216,0.15)', border: '1px solid #C7D9F8', zIndex: 200, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #EEF3FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔔</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0A1628' }}>Notifications</span>
          {unread > 0 && <span style={{ padding: '1px 7px', borderRadius: 10, background: '#1B4FD8', color: '#fff', fontSize: 11, fontWeight: 700 }}>{unread}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 11, color: '#1B4FD8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
      </div>

      {/* Notifications list */}
      <div style={{ maxHeight: 480, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>🔔</div>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>No notifications yet</div>
          </div>
        ) : notifications.map((notif, i) => {
          const style = TYPE_STYLES[notif.type] || TYPE_STYLES.info;
          const isUnread = !notif.read_at;
          return (
            <div key={notif.id} onClick={() => isUnread && markRead(notif.id)}
              style={{ padding: '14px 20px', borderBottom: i < notifications.length-1 ? '1px solid #F8FAFC' : 'none', background: isUnread ? style.bg : '#fff', cursor: isUnread ? 'pointer' : 'default', transition: 'background 0.15s', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{style.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                  <div style={{ fontSize: 13, fontWeight: isUnread ? 700 : 600, color: '#0A1628' }}>{notif.title}</div>
                  {isUnread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: style.color, flexShrink: 0, marginTop: 4 }} />}
                </div>
                <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5, marginBottom: 4 }}>{notif.message}</div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>{timeAgo(notif.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 20px', borderTop: '1px solid #EEF3FD', textAlign: 'center' }}>
        <a href="/audit-trail" onClick={onClose} style={{ fontSize: 12, color: '#1B4FD8', fontWeight: 600, textDecoration: 'none' }}>View All Activity →</a>
      </div>
    </div>
  );
}
