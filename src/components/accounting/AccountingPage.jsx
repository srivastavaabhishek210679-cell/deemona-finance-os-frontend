import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';

const API = apiURL('/api/accounting');
const AGENT_API = apiURL('/api/agent');
const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
});

async function apiGet(url) {
  const res = await fetch(url, { headers: headers() });
  const text = await res.text();
  if (!res.ok) throw new Error(text || ("HTTP " + res.status));
  if (!text || text.trim() === "") return {};
  try { return JSON.parse(text); } catch { return {}; }
}
async function apiPost(url, body) {
  const res = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  const text = await res.text();
  if (!res.ok) throw new Error(text || ("HTTP " + res.status));
  if (!text || text.trim() === "") return {};
  try { return JSON.parse(text); }
  catch { throw new Error("Backend is starting up. Please wait 30 seconds and click again."); }
}

// ── Helpers ───────────────────────────────────────────────────
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
function statusColor(s) {
  const map = {
    draft: '#3B5998', posted: '#22C98A', paid: '#22C98A',
    approved: '#22C98A', pending_approval: '#F5A623',
    overdue: '#FF5C5C', rejected: '#FF5C5C', reversed: '#FF5C5C',
    sent: '#4FC3F7', partially_paid: '#1B4FD8', cancelled: '#3B5998',
  };
  return map[s] || '#3B5998';
}

// ── Shared components ─────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '10px 18px', fontSize: 14, fontWeight: 600,
          background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: active === t.id ? '2px solid #6C63FF' : '2px solid transparent',
          color: active === t.id ? '#1B4FD8' : 'var(--text-secondary)',
          marginBottom: -1,
        }}>{t.label}</button>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600,
      background: statusColor(status) + '20', color: statusColor(status),
    }}>{status?.replace(/_/g, ' ').toUpperCase()}</span>
  );
}

function EmptyState({ icon, title, sub, action, onAction }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{sub}</div>
      {action && (
        <button onClick={onAction} style={{
          padding: '8px 20px', borderRadius: 8, background: 'var(--accent)',
          color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>{action}</button>
      )}
    </div>
  );
}

// ── Setup Banner ──────────────────────────────────────────────
function SetupBanner({ onSetup, loading }) {
  return (
    <div style={{
      padding: 20, borderRadius: 12, marginBottom: 20,
      background: 'linear-gradient(135deg, #1A1A35, #22223A)',
      border: '1px solid #6C63FF40',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
          Set up your Chart of Accounts
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Load 35 standard Indian SME accounts — GL, AP, AR, GST, Tax accounts — in one click.
        </div>
      </div>
      <button onClick={onSetup} disabled={loading} style={{
        padding: '10px 20px', borderRadius: 8, background: 'var(--accent)',
        color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: 13, fontWeight: 600, flexShrink: 0, marginLeft: 16,
      }}>
        {loading ? 'Setting up...' : 'Load Default Accounts'}
      </button>
    </div>
  );
}

// ── Accounts Tab ──────────────────────────────────────────────
function AccountsTab() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setupLoading, setSetupLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet(API + '/accounts');
      setAccounts(data.accounts || []);
    } catch { setAccounts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setup = async () => {
    setSetupLoading(true);
    try {
      await apiPost(API + '/setup', {});
      await new Promise(r => setTimeout(r, 600));
      await load();
    } catch (e) {
      console.error('Setup error:', e);
      await new Promise(r => setTimeout(r, 600));
      await load();
    } finally { setSetupLoading(false); }
  };

  const typeColors = {
    asset: '#22C98A', liability: '#FF5C5C',
    equity: '#1B4FD8', income: '#4FC3F7', expense: '#F5A623',
  };

  const types = ['all', 'asset', 'liability', 'equity', 'income', 'expense'];
  const filtered = filter === 'all' ? accounts : accounts.filter(a => a.type === filter);

  return (
    <div>
      {accounts.length === 0 && !loading && <SetupBanner onSetup={setup} loading={setupLoading} />}

      {/* Type filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: filter === t ? (typeColors[t] || 'var(--accent)') + '20' : 'var(--surface-3)',
            color: filter === t ? (typeColors[t] || 'var(--accent)') : 'var(--text-secondary)',
            border: '1px solid ' + (filter === t ? (typeColors[t] || 'var(--accent)') + '40' : 'var(--border)'),
            cursor: 'pointer',
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading accounts...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📊" title="No accounts yet" sub="Load the default chart of accounts to get started" />
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '80px 1fr 100px 120px 140px',
            padding: '10px 16px', background: 'var(--surface-3)',
            fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em',
          }}>
            <span>CODE</span><span>NAME</span><span>TYPE</span>
            <span>SUB-TYPE</span><span style={{ textAlign: 'right' }}>BALANCE</span>
          </div>
          {filtered.map((acc, i) => (
            <div key={acc.id} style={{
              display: 'grid', gridTemplateColumns: '80px 1fr 100px 120px 140px',
              padding: '12px 16px', fontSize: 13,
              background: i % 2 === 0 ? 'var(--surface-2)' : 'var(--surface-1)',
              borderTop: '1px solid var(--border)',
              alignItems: 'center',
            }}>
              <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{acc.code}</span>
              <span style={{ fontWeight: 500 }}>{acc.name}</span>
              <span>
                <span style={{
                  padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                  background: (typeColors[acc.type] || '#888') + '20',
                  color: typeColors[acc.type] || '#888',
                }}>{acc.type}</span>
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {acc.sub_type?.replace(/_/g, ' ')}
              </span>
              <span style={{ textAlign: 'right', fontWeight: 700 }}>
                {formatINR(acc.balance || 0)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Journal Entries Tab ───────────────────────────────────────
function JournalEntriesTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '', reference: '', notes: '',
    lines: [
      { account_id: '', description: '', debit: '', credit: '' },
      { account_id: '', description: '', debit: '', credit: '' },
    ],
  });
  const [saving, setSaving] = useState(false);
  const [agentSuggestion, setAgentSuggestion] = useState('');
  const [suggesting, setSuggesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [entData, accData] = await Promise.all([
        apiGet(API + '/journal-entries?limit=20'),
        apiGet(API + '/accounts'),
      ]);
      setEntries(entData.entries || []);
      setAccounts(accData.accounts || []);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addLine = () => setForm(f => ({
    ...f, lines: [...f.lines, { account_id: '', description: '', debit: '', credit: '' }],
  }));

  const updateLine = (i, field, val) => setForm(f => {
    const lines = [...f.lines];
    lines[i] = { ...lines[i], [field]: val };
    return { ...f, lines };
  });

  const totalDebit  = form.lines.reduce((s, l) => s + parseFloat(l.debit  || 0), 0);
  const totalCredit = form.lines.reduce((s, l) => s + parseFloat(l.credit || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const save = async () => {
    if (!balanced) { alert('Debits must equal Credits'); return; }
    setSaving(true);
    try {
      await apiPost(API + '/journal-entries', form);
      setShowForm(false);
      await load();
    } catch (e) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  const suggestEntry = async () => {
    if (!form.description) { alert('Enter a description first'); return; }
    setSuggesting(true);
    try {
      const res = await apiPost(AGENT_API + '/suggest-entry', { description: form.description });
      setAgentSuggestion(res.suggestion);
    } catch (e) { setAgentSuggestion('Error: ' + e.message); }
    finally { setSuggesting(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          {entries.length} entries
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '8px 16px', borderRadius: 8, background: 'var(--accent)',
          color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>+ New Entry</button>
      </div>

      {/* New Entry Form */}
      {showForm && (
        <div style={{
          marginBottom: 20, padding: 20, borderRadius: 12,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>New Journal Entry</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            {[
              { label: 'Date', key: 'date', type: 'date' },
              { label: 'Description', key: 'description', type: 'text' },
              { label: 'Reference', key: 'reference', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</div>
                <input type={f.type} value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                    borderRadius: 8, border: '1px solid var(--border)',
                    background: 'var(--surface-3)', color: 'var(--text-primary)',
                    fontSize: 13, outline: 'none',
                  }}
                />
              </div>
            ))}
          </div>

          {/* AI Suggest button */}
          <div style={{ marginBottom: 12 }}>
            <button onClick={suggestEntry} disabled={suggesting} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: '#6C63FF18', color: '#1B4FD8',
              border: '1px solid #6C63FF30', cursor: 'pointer',
            }}>
              {suggesting ? 'Thinking...' : '* AI: Suggest Journal Entry'}
            </button>
            {agentSuggestion && (
              <div style={{
                marginTop: 8, padding: 12, borderRadius: 8,
                background: '#6C63FF10', border: '1px solid #6C63FF30',
                fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                color: 'var(--text-primary)',
              }}>
                {agentSuggestion}
              </div>
            )}
          </div>

          {/* Lines */}
          <div style={{ marginBottom: 12 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 120px 120px',
              gap: 8, marginBottom: 6,
              fontSize: 11, color: 'var(--text-muted)', fontWeight: 700,
            }}>
              <span>Account</span><span>Description</span>
              <span style={{ textAlign: 'right' }}>Debit (Rs)</span>
              <span style={{ textAlign: 'right' }}>Credit (Rs)</span>
            </div>
            {form.lines.map((line, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 120px 120px', gap: 8, marginBottom: 6,
              }}>
                <select value={line.account_id}
                  onChange={e => updateLine(i, 'account_id', e.target.value)}
                  style={{
                    padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
                    background: 'var(--surface-3)', color: 'var(--text-primary)', fontSize: 13,
                  }}>
                  <option value="">Select account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                  ))}
                </select>
                <input placeholder="Description" value={line.description}
                  onChange={e => updateLine(i, 'description', e.target.value)}
                  style={{
                    padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
                    background: 'var(--surface-3)', color: 'var(--text-primary)', fontSize: 13,
                  }}
                />
                <input type="number" placeholder="0.00" value={line.debit}
                  onChange={e => updateLine(i, 'debit', e.target.value)}
                  style={{
                    padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
                    background: 'var(--surface-3)', color: 'var(--text-primary)',
                    fontSize: 13, textAlign: 'right',
                  }}
                />
                <input type="number" placeholder="0.00" value={line.credit}
                  onChange={e => updateLine(i, 'credit', e.target.value)}
                  style={{
                    padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
                    background: 'var(--surface-3)', color: 'var(--text-primary)',
                    fontSize: 13, textAlign: 'right',
                  }}
                />
              </div>
            ))}
            <button onClick={addLine} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12,
              background: 'var(--surface-3)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer', marginTop: 4,
            }}>+ Add Line</button>
          </div>

          {/* Balance indicator */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 20,
            padding: '10px 0', borderTop: '1px solid var(--border)', marginBottom: 12,
          }}>
            <span style={{ fontSize: 13 }}>
              Total Debit: <strong style={{ color: '#22C98A' }}>Rs {totalDebit.toLocaleString('en-IN')}</strong>
            </span>
            <span style={{ fontSize: 13 }}>
              Total Credit: <strong style={{ color: '#22C98A' }}>Rs {totalCredit.toLocaleString('en-IN')}</strong>
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: balanced ? '#22C98A' : '#FF5C5C' }}>
              {balanced ? 'Balanced' : 'Not balanced'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={saving || !balanced} style={{
              padding: '8px 20px', borderRadius: 8, background: balanced ? 'var(--accent)' : '#555',
              color: '#fff', border: 'none', cursor: balanced ? 'pointer' : 'not-allowed',
              fontSize: 13, fontWeight: 600,
            }}>{saving ? 'Saving...' : 'Save Entry'}</button>
            <button onClick={() => setShowForm(false)} style={{
              padding: '8px 16px', borderRadius: 8, background: 'var(--surface-3)',
              border: '1px solid var(--border)', color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 13,
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Entries list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      ) : entries.length === 0 ? (
        <EmptyState icon="📒" title="No journal entries yet"
          sub="Create your first entry or use AI to suggest one"
          action="+ New Entry" onAction={() => setShowForm(true)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map(e => (
            <div key={e.id} style={{
              padding: '14px 16px', borderRadius: 10,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{e.entry_number}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(e.date)}</span>
                <StatusBadge status={e.status} />
                {e.entry_type === 'ai_suggested' && (
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#1B4FD8', color: '#fff', fontWeight: 700 }}>AI</span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 500 }}>{e.description}</span>
              </div>
              {e.lines?.filter(l => l.account_id).map((line, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '120px 1fr 120px 120px',
                  gap: 8, fontSize: 12, color: 'var(--text-secondary)',
                  padding: '3px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{line.account_code}</span>
                  <span>{line.account_name}</span>
                  <span style={{ textAlign: 'right', color: line.debit > 0 ? '#22C98A' : 'transparent' }}>
                    {line.debit > 0 ? 'Dr ' + formatINR(line.debit) : ''}
                  </span>
                  <span style={{ textAlign: 'right', color: line.credit > 0 ? '#4FC3F7' : 'transparent' }}>
                    {line.credit > 0 ? 'Cr ' + formatINR(line.credit) : ''}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AP Invoices Tab ───────────────────────────────────────────
function APTab() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? API + '/ap-invoices' : API + '/ap-invoices?status=' + filter;
      const data = await apiGet(url);
      setInvoices(data.invoices || []);
    } catch { setInvoices([]); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const statuses = ['all', 'draft', 'pending_approval', 'approved', 'paid', 'overdue', 'rejected'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '5px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            background: filter === s ? statusColor(s) + '20' : 'var(--surface-3)',
            color: filter === s ? statusColor(s) : 'var(--text-secondary)',
            border: '1px solid ' + (filter === s ? statusColor(s) + '40' : 'var(--border)'),
            cursor: 'pointer',
          }}>{s === 'all' ? 'All' : s.replace(/_/g, ' ')}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      ) : invoices.length === 0 ? (
        <EmptyState icon="📄" title="No AP invoices yet"
          sub="Add vendors first, then record bills from suppliers" />
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '140px 1fr 100px 120px 120px 100px',
            padding: '10px 16px', background: 'var(--surface-3)',
            fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em',
          }}>
            <span>INVOICE #</span><span>VENDOR</span><span>DATE</span>
            <span style={{ textAlign: 'right' }}>AMOUNT</span>
            <span style={{ textAlign: 'right' }}>BALANCE</span>
            <span>STATUS</span>
          </div>
          {invoices.map((inv, i) => (
            <div key={inv.id} style={{
              display: 'grid', gridTemplateColumns: '140px 1fr 100px 120px 120px 100px',
              padding: '12px 16px', fontSize: 13, alignItems: 'center',
              background: i % 2 === 0 ? 'var(--surface-2)' : 'var(--surface-1)',
              borderTop: '1px solid var(--border)',
            }}>
              <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 12 }}>{inv.invoice_number}</span>
              <span>{inv.vendor_name}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(inv.due_date)}</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(inv.total_amount)}</span>
              <span style={{ textAlign: 'right', color: parseFloat(inv.balance_due) > 0 ? '#FF5C5C' : '#22C98A', fontWeight: 600 }}>
                {formatINR(inv.balance_due)}
              </span>
              <StatusBadge status={inv.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AR Invoices Tab ───────────────────────────────────────────
function ARTab() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet(API + '/ar-invoices')
      .then(d => setInvoices(d.invoices || []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, []);

  return loading ? (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
  ) : invoices.length === 0 ? (
    <EmptyState icon="🧾" title="No sales invoices yet"
      sub="Add customers first, then create invoices for your sales" />
  ) : (
    <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '140px 1fr 100px 120px 120px 100px',
        padding: '10px 16px', background: 'var(--surface-3)',
        fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em',
      }}>
        <span>INVOICE #</span><span>CUSTOMER</span><span>DUE DATE</span>
        <span style={{ textAlign: 'right' }}>AMOUNT</span>
        <span style={{ textAlign: 'right' }}>BALANCE</span>
        <span>STATUS</span>
      </div>
      {invoices.map((inv, i) => (
        <div key={inv.id} style={{
          display: 'grid', gridTemplateColumns: '140px 1fr 100px 120px 120px 100px',
          padding: '12px 16px', fontSize: 13, alignItems: 'center',
          background: i % 2 === 0 ? 'var(--surface-2)' : 'var(--surface-1)',
          borderTop: '1px solid var(--border)',
        }}>
          <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 12 }}>{inv.invoice_number}</span>
          <span>{inv.customer_name}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(inv.due_date)}</span>
          <span style={{ textAlign: 'right', fontWeight: 600 }}>{formatINR(inv.total_amount)}</span>
          <span style={{ textAlign: 'right', color: parseFloat(inv.balance_due) > 0 ? '#FF5C5C' : '#22C98A', fontWeight: 600 }}>
            {formatINR(inv.balance_due)}
          </span>
          <StatusBadge status={inv.status} />
        </div>
      ))}
    </div>
  );
}

// ── Accounting Agent Tab ──────────────────────────────────────
function AgentTab() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [anomalies, setAnomalies] = useState([]);
  const [anomalyLoading, setAnomalyLoading] = useState(false);

  const EXAMPLES = [
    'What is my current cash position?',
    'Which vendor has the highest outstanding payable?',
    'How do I record a GST payment of Rs 50,000?',
    'Are there any overdue invoices I should know about?',
    'Suggest a journal entry for paying office rent of Rs 1,20,000',
  ];

  const ask = async (question) => {
    if (!question.trim()) return;
    setLoading(true);
    setInput('');
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    try {
      const res = await apiPost(AGENT_API + '/ask', { question, conversationHistory: history });
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + e.message }]);
    } finally { setLoading(false); }
  };

  const runAnomalies = async () => {
    setAnomalyLoading(true);
    try {
      const res = await apiGet(AGENT_API + '/anomalies');
      setAnomalies(res.anomalies || []);
    } catch (e) { alert('Error: ' + e.message); }
    finally { setAnomalyLoading(false); }
  };

  const sevColor = { CRITICAL: '#FF5C5C', HIGH: '#F5A623', MEDIUM: '#1B4FD8', LOW: '#3B5998', INFO: '#4FC3F7' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
      {/* Chat */}
      <div>
        <div style={{
          padding: 16, borderRadius: 12, marginBottom: 12,
          background: 'linear-gradient(135deg, #1A1A35, #22223A)',
          border: '1px solid #6C63FF40',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20, color: '#1B4FD8' }}>*</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Accounting Agent</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              AI accountant with access to your GL, AP, AR data
            </div>
          </div>
        </div>

        {/* Example questions */}
        {messages.length === 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Try asking</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EXAMPLES.map(q => (
                <button key={q} onClick={() => ask(q)} style={{
                  padding: '5px 10px', borderRadius: 100, fontSize: 12,
                  background: '#6C63FF18', color: '#3B82F6',
                  border: '1px solid #6C63FF30', cursor: 'pointer',
                }}>{q}</button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{
          minHeight: 200, maxHeight: 400, overflowY: 'auto',
          marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              padding: '12px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.7,
              background: m.role === 'user' ? '#6C63FF18' : 'var(--surface-2)',
              border: '1px solid ' + (m.role === 'user' ? '#6C63FF30' : 'var(--border)'),
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%', whiteSpace: 'pre-wrap',
              color: 'var(--text-primary)',
            }}>
              {m.role === 'assistant' && (
                <div style={{ fontSize: 10, fontWeight: 700, color: '#1B4FD8', marginBottom: 4 }}>
                  ACCOUNTING AGENT
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
            }}>Agent is thinking...</div>
          )}
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') ask(input); }}
            placeholder="Ask the accounting agent..."
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 8, fontSize: 13,
              border: '1px solid var(--border)', background: 'var(--surface-3)',
              color: 'var(--text-primary)', outline: 'none',
            }}
          />
          <button onClick={() => ask(input)} disabled={loading || !input.trim()} style={{
            padding: '10px 16px', borderRadius: 8, background: 'var(--accent)',
            color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>Ask</button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Press Enter to send</div>
      </div>

      {/* Anomaly Detection Panel */}
      <div>
        <div style={{
          padding: 16, borderRadius: 12, background: 'var(--surface-2)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Anomaly Scan</div>
            <button onClick={runAnomalies} disabled={anomalyLoading} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
            }}>{anomalyLoading ? '...' : 'Scan Now'}</button>
          </div>
          {anomalies.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
              Click Scan Now to detect anomalies in your accounts
            </div>
          ) : (
            anomalies.map((a, i) => (
              <div key={i} style={{
                padding: '10px 12px', borderRadius: 8, marginBottom: 8,
                background: (sevColor[a.severity] || '#888') + '10',
                border: '1px solid ' + (sevColor[a.severity] || '#888') + '30',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: sevColor[a.severity] || '#888', marginBottom: 3 }}>
                  {a.severity} — {a.type?.replace(/_/g, ' ').toUpperCase()}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>{a.description}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Accounting Page ──────────────────────────────────────
export default function AccountingPage() {
  const [tab, setTab] = useState('accounts');

  const tabs = [
    { id: 'accounts',  label: 'Chart of Accounts' },
    { id: 'journal',   label: 'Journal Entries' },
    { id: 'ap',        label: 'Accounts Payable' },
    { id: 'ar',        label: 'Accounts Receivable' },
    { id: 'agent',     label: 'Accounting Agent' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'accounts' && <AccountsTab />}
      {tab === 'journal'  && <JournalEntriesTab />}
      {tab === 'ap'       && <APTab />}
      {tab === 'ar'       && <ARTab />}
      {tab === 'agent'    && <AgentTab />}
    </div>
  );
}






