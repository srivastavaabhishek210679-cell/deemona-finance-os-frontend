import { apiURL } from '../../api.js';
import { useState, useEffect, useCallback } from 'react';

const API = apiURL('/api/procurement');
const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
});
async function apiGet(url) {
  const res = await fetch(url, { headers: headers() });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  if (!text || text.trim() === "") return {};
  try { return JSON.parse(text); } catch { return {}; }
}
async function apiPost(url, body) {
  const res = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(text);
  if (!text || text.trim() === '') return {};
  try { return JSON.parse(text); } catch { return {}; }
}
async function apiPatch(url, body) {
  const res = await fetch(url, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) });
  const _pt = await res.text();
  if (!res.ok) throw new Error(_pt);
  if (!_pt || _pt.trim() === '') return {};
  try { return JSON.parse(_pt); } catch { return {}; }
  return res.json();
}

function formatINR(n) {
  const num = parseFloat(n || 0);
  if (num >= 1e7) return 'Rs ' + (num / 1e7).toFixed(2) + ' Cr';
  if (num >= 1e5) return 'Rs ' + (num / 1e5).toFixed(2) + ' L';
  return 'Rs ' + num.toLocaleString('en-IN');
}
function formatDate(d) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '10px 18px', fontSize: 14, fontWeight: 600,
          background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: active === t.id ? '2px solid #1B4FD8' : '2px solid transparent',
          color: active === t.id ? '#1B4FD8' : 'var(--text-secondary)',
          marginBottom: -1,
        }}>{t.label}</button>
      ))}
    </div>
  );
}

function StatusBadge({ status, priority }) {
  const statusColors = {
    draft: '#3B5998', submitted: '#F5A623', approved: '#22C98A',
    received: '#22C98A', cancelled: '#FF5C5C', rejected: '#FF5C5C',
    partially_received: '#4FC3F7',
  };
  const priorityColors = { low: '#3B5998', normal: '#1B4FD8', high: '#F5A623', urgent: '#FF5C5C' };
  if (priority) {
    return (
      <span style={{
        padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600,
        background: (priorityColors[priority] || '#888') + '20',
        color: priorityColors[priority] || '#888',
      }}>{priority.toUpperCase()}</span>
    );
  }
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600,
      background: (statusColors[status] || '#888') + '20',
      color: statusColors[status] || '#888',
    }}>{status?.replace(/_/g, ' ').toUpperCase()}</span>
  );
}

// â”€â”€ Summary Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SummaryCards({ summary }) {
  if (!summary) return null;
  const cards = [
    { label: 'Active POs',        value: summary.active || 0,        color: '#1B4FD8', note: 'In progress' },
    { label: 'Pending Approval',  value: summary.pending_approval || 0, color: '#F5A623', note: formatINR(summary.pending_value) },
    { label: 'Approved',          value: summary.approved || 0,       color: '#22C98A', note: 'Ready to receive' },
    { label: 'Total PO Value',    value: formatINR(summary.total_value), color: '#4FC3F7', note: 'All time' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          padding: '18px 20px', borderRadius: 12,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: c.color, marginBottom: 4 }}>{c.value}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{c.label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.note}</div>
        </div>
      ))}
    </div>
  );
}

// â”€â”€ New PO Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function NewPOForm({ onSaved, onCancel }) {
  const [vendors, setVendors] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [form, setForm] = useState({
    vendor_id: null, expected_date: '', priority: 'normal',
    department: '', notes: '',
    lines: [{ description: '', quantity: 1, unit: 'pcs', unit_price: '', amount: '', account_id: '' }],
  });

  useEffect(() => {
    Promise.all([
      fetch(apiURL('/api/accounting/vendors'), { headers: headers() }).then(r => r.json()),
      fetch(apiURL('/api/accounting/accounts'), { headers: headers() }).then(r => r.json()),
    ]).then(([vd, ad]) => {
      setVendors(vd.vendors || []);
      setAccounts(ad.accounts || []);
    }).catch(() => {});
  }, []);

  const updateLine = (i, field, val) => {
    setForm(f => {
      const lines = [...f.lines];
      lines[i] = { ...lines[i], [field]: val };
      if (field === 'quantity' || field === 'unit_price') {
        const qty = parseFloat(field === 'quantity' ? val : lines[i].quantity) || 0;
        const price = parseFloat(field === 'unit_price' ? val : lines[i].unit_price) || 0;
        lines[i].amount = (qty * price).toFixed(2);
      }
      return { ...f, lines };
    });
  };

  const addLine = () => setForm(f => ({
    ...f,
    lines: [...f.lines, { description: '', quantity: 1, unit: 'pcs', unit_price: '', amount: '', account_id: '' }],
  }));

  const removeLine = (i) => setForm(f => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));

  const subtotal = form.lines.reduce((s, l) => s + parseFloat(l.amount || 0), 0);

  const getAISuggestion = async () => {
    if (!form.lines[0].description) { alert('Add at least one item description first'); return; }
    setSuggesting(true);
    try {
      const items = form.lines.map(l => l.description).join(', ');
      const res = await apiPost(API + '/ai-agent', {
        question: 'I need to procure: ' + items + '. Which vendors from our master should I consider? Any price benchmarks or risks to watch for?',
      });
      setAiSuggestion(res.answer);
    } catch (e) { setAiSuggestion('Error: ' + e.message); }
    finally { setSuggesting(false); }
  };

  const save = async () => {
    if (!form.lines.length || !form.lines[0].description) { alert('Add at least one line item'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        vendor_id: form.vendor_id || null,
        lines: form.lines.map(l => ({
          ...l,
          account_id: l.account_id || null,
          quantity: parseFloat(l.quantity) || 1,
          unit_price: parseFloat(l.unit_price) || 0,
          amount: parseFloat(l.amount) || 0,
        })),
      };
      await apiPost(API + '/purchase-orders', payload);
      onSaved();
    } catch (e) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '8px 10px',
    borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface-3)', color: 'var(--text-primary)',
    fontSize: 13, outline: 'none',
  };

  return (
    <div style={{
      padding: 20, borderRadius: 12, marginBottom: 20,
      background: 'var(--surface-2)', border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>New Purchase Order</div>

      {/* Header fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Vendor</div>
          <select value={form.vendor_id}
            onChange={e => setForm(p => ({ ...p, vendor_id: e.target.value }))}
            style={inputStyle}>
            <option value="">Select vendor</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Expected Delivery</div>
          <input type="date" value={form.expected_date}
            onChange={e => setForm(p => ({ ...p, expected_date: e.target.value }))}
            style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Priority</div>
          <select value={form.priority}
            onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
            style={inputStyle}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Department</div>
          <input placeholder="e.g. Operations" value={form.department}
            onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
            style={inputStyle} />
        </div>
      </div>

      {/* AI Suggestion */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={getAISuggestion} disabled={suggesting} style={{
          padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: '#1B4FD818', color: '#1B4FD8',
          border: '1px solid #1B4FD830', cursor: 'pointer',
        }}>
          {suggesting ? 'Getting AI advice...' : '* AI: Vendor & Price Recommendation'}
        </button>
        {aiSuggestion && (
          <div style={{
            marginTop: 8, padding: 12, borderRadius: 8,
            background: '#1B4FD810', border: '1px solid #1B4FD830',
            fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)',
          }}>{aiSuggestion}</div>
        )}
      </div>

      {/* Line items */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Line Items</div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 70px 80px 110px 110px 1fr 28px',
          gap: 6, marginBottom: 6,
          fontSize: 11, color: 'var(--text-muted)', fontWeight: 700,
        }}>
          <span>Description</span><span>Qty</span><span>Unit</span>
          <span>Unit Price</span><span>Amount</span><span>Account</span><span></span>
        </div>
        {form.lines.map((line, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr 70px 80px 110px 110px 1fr 28px',
            gap: 6, marginBottom: 6,
          }}>
            <input placeholder="Item description" value={line.description}
              onChange={e => updateLine(i, 'description', e.target.value)}
              style={inputStyle} />
            <input type="number" value={line.quantity}
              onChange={e => updateLine(i, 'quantity', e.target.value)}
              style={{ ...inputStyle, textAlign: 'right' }} />
            <select value={line.unit} onChange={e => updateLine(i, 'unit', e.target.value)} style={inputStyle}>
              {['pcs', 'kg', 'ltr', 'box', 'set', 'hr', 'day', 'month'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <input type="number" placeholder="0.00" value={line.unit_price}
              onChange={e => updateLine(i, 'unit_price', e.target.value)}
              style={{ ...inputStyle, textAlign: 'right' }} />
            <input type="number" placeholder="0.00" value={line.amount} readOnly
              style={{ ...inputStyle, textAlign: 'right', opacity: 0.7 }} />
            <select value={line.account_id} onChange={e => updateLine(i, 'account_id', e.target.value)} style={inputStyle}>
              <option value="">Select account</option>
              {accounts.filter(a => a.type === 'expense').map(a => (
                <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
              ))}
            </select>
            <button onClick={() => removeLine(i)} style={{
              background: '#FF5C5C20', border: '1px solid #FF5C5C30', borderRadius: 6,
              color: '#FF5C5C', cursor: 'pointer', fontSize: 14, fontWeight: 700,
            }}>x</button>
          </div>
        ))}
        <button onClick={addLine} style={{
          padding: '5px 12px', borderRadius: 6, fontSize: 12,
          background: 'var(--surface-3)', border: '1px solid var(--border)',
          color: 'var(--text-secondary)', cursor: 'pointer', marginTop: 4,
        }}>+ Add Line</button>
      </div>

      {/* Totals */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 20,
        padding: '12px 0', borderTop: '1px solid var(--border)', marginBottom: 12,
      }}>
        <span style={{ fontSize: 13 }}>Subtotal: <strong>{formatINR(subtotal)}</strong></span>
        <span style={{ fontSize: 13 }}>GST (18%): <strong>{formatINR(subtotal * 0.18)}</strong></span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#22C98A' }}>
          Total: {formatINR(subtotal * 1.18)}
        </span>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Notes</div>
        <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          rows={2} placeholder="Additional notes..."
          style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={save} disabled={saving} style={{
          padding: '8px 20px', borderRadius: 8, background: 'var(--accent)',
          color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}>{saving ? 'Saving...' : 'Create PO'}</button>
        <button onClick={onCancel} style={{
          padding: '8px 16px', borderRadius: 8, background: 'var(--surface-3)',
          border: '1px solid var(--border)', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: 14,
        }}>Cancel</button>
      </div>
    </div>
  );
}

// â”€â”€ PO Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PODetail({ po, onClose, onRefresh }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    apiGet(API + '/purchase-orders/' + po.id)
      .then(d => setDetail(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [po.id]);

  const action = async (type) => {
    const comment = type === 'reject' ? prompt('Rejection reason:') : null;
    if (type === 'reject' && !comment) return;
    setActioning(true);
    try {
      await apiPatch(API + '/purchase-orders/' + po.id + '/' + type,
        type === 'reject' ? { reason: comment } : { comment: 'Approved' });
      onRefresh();
      onClose();
    } catch (e) { alert('Error: ' + e.message); }
    finally { setActioning(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        width: 720, maxHeight: '80vh', overflow: 'auto',
        background: 'var(--surface-1)', borderRadius: 16,
        border: '1px solid var(--border)', padding: 28,
      }} onClick={e => e.stopPropagation()}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
        ) : detail ? (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>
                    {detail.order.po_number}
                  </span>
                  <StatusBadge status={detail.order.status} />
                  <StatusBadge priority={detail.order.priority} />
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  {detail.order.vendor_name || 'No vendor'} &nbsp;|&nbsp; {formatDate(detail.order.date)}
                  {detail.order.expected_date && ' &nbsp;| Expected: ' + formatDate(detail.order.expected_date)}
                </div>
              </div>
              <button onClick={onClose} style={{
                background: 'var(--surface-3)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                color: 'var(--text-secondary)', fontSize: 14,
              }}>Close</button>
            </div>

            {/* Lines */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Line Items</div>
              <div style={{ borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
                {detail.lines.map((line, i) => (
                  <div key={line.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 60px 60px 100px 110px',
                    padding: '10px 14px', fontSize: 13,
                    background: i % 2 === 0 ? 'var(--surface-2)' : 'var(--surface-1)',
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span>{line.description}</span>
                    <span style={{ textAlign: 'right' }}>{line.quantity}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{line.unit}</span>
                    <span style={{ textAlign: 'right' }}>{formatINR(line.unit_price)}</span>
                    <span style={{ textAlign: 'right', fontWeight: 700 }}>{formatINR(line.amount)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, marginTop: 10, padding: '0 4px' }}>
                <span style={{ fontSize: 13 }}>Subtotal: <strong>{formatINR(detail.order.subtotal)}</strong></span>
                <span style={{ fontSize: 13 }}>Tax: <strong>{formatINR(detail.order.tax_amount)}</strong></span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#22C98A' }}>
                  Total: {formatINR(detail.order.total_amount)}
                </span>
              </div>
            </div>

            {/* Approval history */}
            {detail.history.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Approval History</div>
                {detail.history.map(h => (
                  <div key={h.id} style={{
                    display: 'flex', gap: 12, padding: '8px 0',
                    borderBottom: '1px solid var(--border)', fontSize: 13,
                  }}>
                    <span style={{ color: 'var(--text-muted)', width: 120, flexShrink: 0 }}>
                      {formatDate(h.created_at)}
                    </span>
                    <span style={{ fontWeight: 600, color: '#1B4FD8', width: 80, flexShrink: 0 }}>
                      {h.action.toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{h.actor_name}</span>
                    {h.comment && <span style={{ color: 'var(--text-muted)' }}>- {h.comment}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              {detail.order.status === 'draft' && (
                <button onClick={() => action('submit')} disabled={actioning} style={{
                  padding: '8px 20px', borderRadius: 8, background: '#F5A623',
                  color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}>Submit for Approval</button>
              )}
              {detail.order.status === 'submitted' && (
                <>
                  <button onClick={() => action('approve')} disabled={actioning} style={{
                    padding: '8px 20px', borderRadius: 8, background: '#22C98A',
                    color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  }}>Approve</button>
                  <button onClick={() => action('reject')} disabled={actioning} style={{
                    padding: '8px 20px', borderRadius: 8, background: '#FF5C5C',
                    color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  }}>Reject</button>
                </>
              )}
            </div>
          </>
        ) : <div style={{ color: 'var(--text-muted)' }}>Failed to load PO details</div>}
      </div>
    </div>
  );
}

// â”€â”€ Purchase Orders Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PurchaseOrdersTab({ onRefreshSummary }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? API + '/purchase-orders' : API + '/purchase-orders?status=' + filter;
      const data = await apiGet(url);
      setOrders(data.orders || []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const statuses = ['all', 'draft', 'submitted', 'approved', 'received', 'cancelled'];

  return (
    <div>
      {selectedPO && (
        <PODetail po={selectedPO} onClose={() => setSelectedPO(null)}
          onRefresh={() => { load(); onRefreshSummary(); }} />
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {statuses.map(s => {
          const colors = { draft:'#3B5998', submitted:'#F5A623', approved:'#22C98A', received:'#22C98A', cancelled:'#FF5C5C' };
          return (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
              background: filter === s ? (colors[s] || '#1B4FD8') + '20' : 'var(--surface-3)',
              color: filter === s ? (colors[s] || '#1B4FD8') : 'var(--text-secondary)',
              border: '1px solid ' + (filter === s ? (colors[s] || '#1B4FD8') + '40' : 'var(--border)'),
              cursor: 'pointer',
            }}>{s === 'all' ? 'All' : s.replace(/_/g, ' ')}</button>
          );
        })}
        <button onClick={() => setShowForm(true)} style={{
          marginLeft: 'auto', padding: '8px 16px', borderRadius: 8,
          background: 'var(--accent)', color: '#fff', border: 'none',
          cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}>+ New PO</button>
      </div>

      {showForm && (
        <NewPOForm
          onSaved={() => { setShowForm(false); load(); onRefreshSummary(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>ðŸ“¦</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No purchase orders yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Create your first PO to start the procurement workflow
          </div>
          <button onClick={() => setShowForm(true)} style={{
            padding: '8px 20px', borderRadius: 8, background: 'var(--accent)',
            color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}>+ Create First PO</button>
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '130px 1fr 100px 80px 130px 100px 80px',
            padding: '10px 16px', background: 'var(--surface-3)',
            fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em',
          }}>
            <span>PO #</span><span>VENDOR</span><span>DATE</span>
            <span>PRIORITY</span><span style={{ textAlign: 'right' }}>AMOUNT</span>
            <span>STATUS</span><span>LINES</span>
          </div>
          {orders.map((po, i) => (
            <div key={po.id}
              onClick={() => setSelectedPO(po)}
              style={{
                display: 'grid', gridTemplateColumns: '130px 1fr 100px 80px 130px 100px 80px',
                padding: '12px 16px', fontSize: 13, alignItems: 'center',
                background: i % 2 === 0 ? 'var(--surface-2)' : 'var(--surface-1)',
                borderTop: '1px solid var(--border)', cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface-2)' : 'var(--surface-1)'}
            >
              <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 12 }}>{po.po_number}</span>
              <span>{po.vendor_name || 'No vendor'}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(po.date)}</span>
              <StatusBadge priority={po.priority} />
              <span style={{ textAlign: 'right', fontWeight: 700 }}>{formatINR(po.total_amount)}</span>
              <StatusBadge status={po.status} />
              <span style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>{po.line_count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// â”€â”€ Procurement Agent Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AgentTab() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const EXAMPLES = [
    'Which vendors should I consider for office supplies?',
    'Are there any POs pending approval I should know about?',
    'Which vendor has the highest spend this year?',
    'Should I be concerned about any vendor relationships?',
    'How can I optimize our procurement costs?',
  ];

  const ask = async (question) => {
    if (!question.trim()) return;
    setLoading(true);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    try {
      const res = await apiPost(API + '/ai-agent', { question });
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + e.message }]);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{
        padding: 16, borderRadius: 12, marginBottom: 16,
        background: 'linear-gradient(135deg, #1A1A35, #22223A)',
        border: '1px solid #1B4FD840',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Procurement Agent</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          AI that analyzes vendor data, PO history, and helps you make smarter purchasing decisions
        </div>
      </div>

      {messages.length === 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Try asking</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EXAMPLES.map(q => (
              <button key={q} onClick={() => ask(q)} style={{
                padding: '5px 12px', borderRadius: 100, fontSize: 12,
                background: '#1B4FD818', color: '#3B82F6',
                border: '1px solid #1B4FD830', cursor: 'pointer',
              }}>{q}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ minHeight: 200, maxHeight: 400, overflowY: 'auto', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            padding: '12px 14px', borderRadius: 10, fontSize: 14, lineHeight: 1.7,
            background: m.role === 'user' ? '#1B4FD818' : 'var(--surface-2)',
            border: '1px solid ' + (m.role === 'user' ? '#1B4FD830' : 'var(--border)'),
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%', whiteSpace: 'pre-wrap',
          }}>
            {m.role === 'assistant' && (
              <div style={{ fontSize: 10, fontWeight: 700, color: '#1B4FD8', marginBottom: 4 }}>
                PROCUREMENT AGENT
              </div>
            )}
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{
            padding: '12px 14px', borderRadius: 10, fontSize: 13,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', alignSelf: 'flex-start',
          }}>Agent is analyzing...</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') ask(input); }}
          placeholder="Ask the procurement agent..."
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 8, fontSize: 14,
            border: '1px solid var(--border)', background: 'var(--surface-3)',
            color: 'var(--text-primary)', outline: 'none',
          }} />
        <button onClick={() => ask(input)} disabled={loading || !input.trim()} style={{
          padding: '10px 18px', borderRadius: 8, background: 'var(--accent)',
          color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}>Ask</button>
      </div>
    </div>
  );
}

// â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ProcurementPage() {
  const [tab, setTab] = useState('orders');
  const [summary, setSummary] = useState(null);

  const loadSummary = useCallback(async () => {
    try {
      const data = await apiGet(API + '/summary');
      setSummary(data);
    } catch { }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const tabs = [
    { id: 'orders', label: 'Purchase Orders' },
    { id: 'agent',  label: 'Procurement Agent' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <SummaryCards summary={summary} />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'orders' && <PurchaseOrdersTab onRefreshSummary={loadSummary} />}
      {tab === 'agent'  && <AgentTab />}
    </div>
  );
}





