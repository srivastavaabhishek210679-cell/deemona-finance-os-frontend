import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';

const API = apiURL('/api/treasury');
const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
});

async function apiGet(url) {
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiPost(url, body) {
  const res = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiPatch(url, body) {
  const res = await fetch(url, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
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

// ── Summary Cards ─────────────────────────────────────────────
function SummaryCards({ summary }) {
  const cards = [
    { label: 'Total Cash',            value: formatINR(summary?.total_cash),              color: '#22C98A', note: summary?.account_count + ' accounts' },
    { label: 'Payables (30 days)',     value: formatINR(summary?.upcoming_payables_30d),   color: '#FF5C5C', note: summary?.upcoming_payables_count + ' invoices due' },
    { label: 'Receivables (30 days)', value: formatINR(summary?.upcoming_receivables_30d), color: '#4FC3F7', note: summary?.upcoming_receivables_count + ' invoices due' },
    { label: 'Net Cash Flow (30d)',    value: formatINR(summary?.net_cash_flow_30d),        color: summary?.net_cash_flow_30d >= 0 ? '#22C98A' : '#FF5C5C', note: 'Projected movement' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          padding: '18px 20px', borderRadius: 12,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: c.color, marginBottom: 4 }}>{c.value}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{c.label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.note}</div>
        </div>
      ))}
    </div>
  );
}

// ── Bank Accounts Tab ─────────────────────────────────────────
function BankAccountsTab({ onRefreshSummary }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', account_number: '', ifsc: '', bank_name: '',
    branch: '', account_type: 'current', opening_balance: '',
    upi_id: '', notes: '', is_primary: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet(API + '/bank-accounts');
      setAccounts(data.accounts || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name || !form.account_number || !form.bank_name) {
      alert('Name, account number, and bank name are required');
      return;
    }
    setSaving(true);
    try {
      await apiPost(API + '/bank-accounts', form);
      setShowForm(false);
      await load();
      onRefreshSummary();
    } catch (e) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  const updateBalance = async (id, newBalance) => {
    const val = prompt('Enter new balance (INR):');
    if (!val) return;
    try {
      await apiPatch(API + '/bank-accounts/' + id, { current_balance: parseFloat(val) });
      await load();
      onRefreshSummary();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '8px 10px', borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface-3)',
    color: 'var(--text-primary)', fontSize: 14, outline: 'none',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{accounts.length} bank accounts</div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '8px 16px', borderRadius: 8, background: 'var(--accent)',
          color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}>+ Add Bank Account</button>
      </div>

      {showForm && (
        <div style={{
          padding: 20, borderRadius: 12, marginBottom: 20,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>New Bank Account</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            {[
              { label: 'Account Name', key: 'name', placeholder: 'e.g. HDFC Current Account' },
              { label: 'Account Number', key: 'account_number', placeholder: '12345678901234' },
              { label: 'Bank Name', key: 'bank_name', placeholder: 'HDFC Bank' },
              { label: 'IFSC Code', key: 'ifsc', placeholder: 'HDFC0001234' },
              { label: 'Branch', key: 'branch', placeholder: 'Connaught Place, Delhi' },
              { label: 'UPI ID', key: 'upi_id', placeholder: 'company@hdfcbank' },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</div>
                <input placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={inputStyle} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Account Type</div>
              <select value={form.account_type}
                onChange={e => setForm(p => ({ ...p, account_type: e.target.value }))}
                style={{ ...inputStyle }}>
                <option value="current">Current Account</option>
                <option value="savings">Savings Account</option>
                <option value="overdraft">Overdraft</option>
                <option value="cc">Cash Credit</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Opening Balance (INR)</div>
              <input type="number" placeholder="0.00" value={form.opening_balance}
                onChange={e => setForm(p => ({ ...p, opening_balance: e.target.value }))}
                style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.is_primary}
                  onChange={e => setForm(p => ({ ...p, is_primary: e.target.checked }))} />
                Set as primary account
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={saving} style={{
              padding: '8px 20px', borderRadius: 8, background: 'var(--accent)',
              color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}>{saving ? 'Saving...' : 'Add Account'}</button>
            <button onClick={() => setShowForm(false)} style={{
              padding: '8px 16px', borderRadius: 8, background: 'var(--surface-3)',
              border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
            }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      ) : accounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🏦</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No bank accounts yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add your bank accounts to track cash position in real time</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {accounts.map(acc => (
            <div key={acc.id} style={{
              padding: '18px 20px', borderRadius: 12,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 20,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: '#1B4FD820', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 22, flexShrink: 0,
              }}>🏦</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{acc.name}</span>
                  {acc.is_primary && (
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4,
                      background: '#1B4FD8', color: '#fff', fontWeight: 700 }}>PRIMARY</span>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface-3)',
                    padding: '2px 8px', borderRadius: 4 }}>
                    {acc.account_type?.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {acc.bank_name} &nbsp;|&nbsp; {acc.account_number} &nbsp;|&nbsp; IFSC: {acc.ifsc || '--'}
                </div>
                {acc.upi_id && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>UPI: {acc.upi_id}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: parseFloat(acc.current_balance) >= 0 ? '#22C98A' : '#FF5C5C' }}>
                  {formatINR(acc.current_balance)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Current Balance</div>
                <button onClick={() => updateBalance(acc.id)} style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 12,
                  background: 'var(--surface-3)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                }}>Update Balance</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Transactions Tab ──────────────────────────────────────────
function TransactionsTab() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bank_account_id: '', date: new Date().toISOString().split('T')[0],
    description: '', reference: '', type: 'credit',
    amount: '', category: '', notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [txnData, accData] = await Promise.all([
        apiGet(API + '/transactions?limit=50'),
        apiGet(API + '/bank-accounts'),
      ]);
      setTransactions(txnData.transactions || []);
      setAccounts(accData.accounts || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.bank_account_id || !form.amount || !form.description) {
      alert('Account, description and amount are required');
      return;
    }
    setSaving(true);
    try {
      await apiPost(API + '/transactions', form);
      setShowForm(false);
      await load();
    } catch (e) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '8px 10px',
    borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface-3)', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
  };

  const categories = ['salary', 'vendor_payment', 'customer_receipt', 'tax_payment',
                      'rent', 'utilities', 'loan_repayment', 'investment', 'other'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{transactions.length} transactions</div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '8px 16px', borderRadius: 8, background: 'var(--accent)',
          color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}>+ Add Transaction</button>
      </div>

      {showForm && (
        <div style={{
          padding: 20, borderRadius: 12, marginBottom: 20,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>New Transaction</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Bank Account</div>
              <select value={form.bank_account_id}
                onChange={e => setForm(p => ({ ...p, bank_account_id: e.target.value }))}
                style={inputStyle}>
                <option value="">Select account</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Date</div>
              <input type="date" value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Type</div>
              <select value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                style={inputStyle}>
                <option value="credit">Credit (Money In)</option>
                <option value="debit">Debit (Money Out)</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Description</div>
              <input placeholder="e.g. Salary payment - August 2026" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Amount (INR)</div>
              <input type="number" placeholder="0.00" value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Category</div>
              <select value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={inputStyle}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Reference (UTR/Cheque)</div>
              <input placeholder="UTR123456789" value={form.reference}
                onChange={e => setForm(p => ({ ...p, reference: e.target.value }))}
                style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={saving} style={{
              padding: '8px 20px', borderRadius: 8, background: 'var(--accent)',
              color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}>{saving ? 'Saving...' : 'Add Transaction'}</button>
            <button onClick={() => setShowForm(false)} style={{
              padding: '8px 16px', borderRadius: 8, background: 'var(--surface-3)',
              border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
            }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      ) : transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>💳</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No transactions yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Add bank accounts first, then record transactions
          </div>
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '100px 1fr 120px 120px 120px 100px',
            padding: '10px 16px', background: 'var(--surface-3)',
            fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em',
          }}>
            <span>DATE</span><span>DESCRIPTION</span><span>ACCOUNT</span>
            <span style={{ textAlign: 'right' }}>AMOUNT</span>
            <span style={{ textAlign: 'right' }}>BALANCE</span>
            <span>TYPE</span>
          </div>
          {transactions.map((t, i) => (
            <div key={t.id} style={{
              display: 'grid', gridTemplateColumns: '100px 1fr 120px 120px 120px 100px',
              padding: '12px 16px', fontSize: 13, alignItems: 'center',
              background: i % 2 === 0 ? 'var(--surface-2)' : 'var(--surface-1)',
              borderTop: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(t.date)}</span>
              <div>
                <div style={{ fontWeight: 500 }}>{t.description}</div>
                {t.reference && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.reference}</div>}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.account_name}</span>
              <span style={{
                textAlign: 'right', fontWeight: 700,
                color: t.type === 'credit' ? '#22C98A' : '#FF5C5C',
              }}>
                {t.type === 'credit' ? '+' : '-'}{formatINR(t.amount)}
              </span>
              <span style={{ textAlign: 'right', fontSize: 12 }}>
                {t.balance_after ? formatINR(t.balance_after) : '--'}
              </span>
              <span style={{
                padding: '3px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600, textAlign: 'center',
                background: t.type === 'credit' ? '#22C98A20' : '#FF5C5C20',
                color: t.type === 'credit' ? '#22C98A' : '#FF5C5C',
              }}>{t.type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cash Flow Tab ─────────────────────────────────────────────
function CashFlowTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await apiGet(API + '/cash-flow?days=' + days);
      setData(d);
    } catch { } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await apiPost(API + '/ai-analysis', {});
      setAiAnalysis(res.analysis);
    } catch (e) { setAiAnalysis('Error: ' + e.message); }
    finally { setAnalyzing(false); }
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Forecast period:</span>
        {[7, 14, 30, 60, 90].map(d => (
          <button key={d} onClick={() => setDays(d)} style={{
            padding: '5px 14px', borderRadius: 100, fontSize: 13, fontWeight: 600,
            background: days === d ? '#1B4FD820' : 'var(--surface-3)',
            color: days === d ? '#1B4FD8' : 'var(--text-secondary)',
            border: '1px solid ' + (days === d ? '#1B4FD840' : 'var(--border)'),
            cursor: 'pointer',
          }}>{d}D</button>
        ))}
        <button onClick={runAnalysis} disabled={analyzing} style={{
          marginLeft: 'auto', padding: '6px 16px', borderRadius: 8, fontSize: 13,
          fontWeight: 600, background: '#1B4FD818', color: '#1B4FD8',
          border: '1px solid #1B4FD830', cursor: 'pointer',
        }}>
          {analyzing ? 'Analyzing...' : '* AI Liquidity Analysis'}
        </button>
      </div>

      {/* AI Analysis */}
      {aiAnalysis && (
        <div style={{
          padding: 16, borderRadius: 12, marginBottom: 20,
          background: 'linear-gradient(135deg, #1A1A35, #22223A)',
          border: '1px solid #1B4FD840',
          fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1B4FD8', marginBottom: 8 }}>
            TREASURY AGENT ANALYSIS
          </div>
          {aiAnalysis}
        </div>
      )}

      {/* Summary boxes */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'Opening Balance', value: formatINR(data.opening_balance), color: '#1B4FD8' },
            { label: 'Net Movement',    value: formatINR(data.closing_balance - data.opening_balance), color: data.closing_balance >= data.opening_balance ? '#22C98A' : '#FF5C5C' },
            { label: 'Closing Balance', value: formatINR(data.closing_balance), color: data.closing_balance >= 0 ? '#22C98A' : '#FF5C5C' },
          ].map(c => (
            <div key={c.label} style={{
              padding: '16px 20px', borderRadius: 12,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading forecast...</div>
      ) : !data?.items?.length ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>📈</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No cash flow data yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Add AP/AR invoices with due dates to see the forecast
          </div>
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '100px 1fr 80px 120px 120px 130px',
            padding: '10px 16px', background: 'var(--surface-3)',
            fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em',
          }}>
            <span>DATE</span><span>DESCRIPTION</span><span>TYPE</span>
            <span style={{ textAlign: 'right' }}>AMOUNT</span>
            <span style={{ textAlign: 'right' }}>PROBABILITY</span>
            <span style={{ textAlign: 'right' }}>RUNNING BAL</span>
          </div>
          {data.items.map((item, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '100px 1fr 80px 120px 120px 130px',
              padding: '11px 16px', fontSize: 13, alignItems: 'center',
              background: i % 2 === 0 ? 'var(--surface-2)' : 'var(--surface-1)',
              borderTop: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(item.date)}</span>
              <span>{item.description}</span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                background: item.category === 'inflow' ? '#22C98A20' : '#FF5C5C20',
                color: item.category === 'inflow' ? '#22C98A' : '#FF5C5C',
                textAlign: 'center',
              }}>{item.category}</span>
              <span style={{
                textAlign: 'right', fontWeight: 700,
                color: item.category === 'inflow' ? '#22C98A' : '#FF5C5C',
              }}>
                {item.category === 'inflow' ? '+' : '-'}{formatINR(item.amount)}
              </span>
              <span style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-muted)' }}>
                {item.probability}%
              </span>
              <span style={{
                textAlign: 'right', fontWeight: 700,
                color: parseFloat(item.running_balance) >= 0 ? '#22C98A' : '#FF5C5C',
              }}>
                {formatINR(item.running_balance)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Treasury Page ────────────────────────────────────────
export default function TreasuryPage() {
  const [tab, setTab] = useState('accounts');
  const [summary, setSummary] = useState(null);

  const loadSummary = useCallback(async () => {
    try {
      const data = await apiGet(API + '/summary');
      setSummary(data);
    } catch { }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const tabs = [
    { id: 'accounts',     label: 'Bank Accounts' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'cashflow',     label: 'Cash Flow Forecast' },
  ];

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      <SummaryCards summary={summary} />
      <TabBar tabs={tabs} active={tab} onChange={setTab} />
      {tab === 'accounts'     && <BankAccountsTab onRefreshSummary={loadSummary} />}
      {tab === 'transactions' && <TransactionsTab />}
      {tab === 'cashflow'     && <CashFlowTab />}
    </div>
  );
}

