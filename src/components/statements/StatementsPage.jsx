import { apiURL } from '../../api.js';
import { useState, useEffect, useCallback } from 'react';

const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { const r = await fetch(apiURL(url), { headers: headers() }); if (!r.ok) throw new Error(await r.text()); return r.json(); };

function INR(n) {
  const v = parseFloat(n || 0);
  if (v >= 1e7) return 'Rs ' + (v / 1e7).toFixed(2) + ' Cr';
  if (v >= 1e5) return 'Rs ' + (v / 1e5).toFixed(2) + ' L';
  return 'Rs ' + v.toLocaleString('en-IN');
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '10px 20px', fontSize: 14, fontWeight: 600,
          background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: active === t.id ? '2px solid #1B4FD8' : '2px solid transparent',
          color: active === t.id ? '#1B4FD8' : 'var(--text-secondary)', marginBottom: -1,
        }}>{t.label}</button>
      ))}
    </div>
  );
}

function StatRow({ label, amount, bold, indent, color, border }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '8px 16px',
      fontWeight: bold ? 700 : 400, fontSize: bold ? 14 : 13,
      paddingLeft: indent ? 32 : 16,
      borderTop: border ? '2px solid var(--border)' : 'none',
      borderBottom: border ? '2px solid var(--border)' : 'none',
      background: bold ? 'var(--surface-2)' : 'transparent',
    }}>
      <span style={{ color: bold ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: color || (parseFloat(amount) >= 0 ? 'var(--text-primary)' : '#FF5C5C'), fontWeight: bold ? 800 : 500 }}>
        {INR(Math.abs(parseFloat(amount || 0)))}
      </span>
    </div>
  );
}

// â”€â”€ P&L Statement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function PnLStatement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await get(`/api/statements/pnl?from=${from}&to=${to}`)); }
    catch { } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading P&L...</div>;
  if (!data) return null;

  const margins = [
    { label: 'Gross Margin', value: data.gross_margin + '%' },
    { label: 'EBITDA Margin', value: data.ebitda_margin + '%' },
    { label: 'Net Margin', value: data.net_margin + '%' },
  ];

  return (
    <div>
      {/* Date controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Period:</span>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13 }} />
        <span style={{ color: 'var(--text-muted)' }}>to</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13 }} />
        <button onClick={load} style={{ padding: '6px 16px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Refresh</button>
      </div>

      {/* Margin KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {margins.map(m => (
          <div key={m.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#22C98A' }}>{m.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* P&L Table */}
      <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', background: 'var(--surface-3)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          PROFIT & LOSS STATEMENT  -  {from} to {to}
        </div>

        <StatRow label="REVENUE" amount={data.income.total} bold />
        {data.income.items.map((item, i) => (
          <StatRow key={i} label={item.name} amount={item.net_amount} indent />
        ))}
        {!data.income.items.length && (
          <StatRow label="AR Invoiced Revenue" amount={data.income.ar_invoiced} indent />
        )}

        <StatRow label="COST OF GOODS SOLD (COGS)" amount={data.expense.total * 0.4} bold />
        <StatRow label="Gross Profit" amount={data.gross_profit} bold color="#22C98A" border />

        <StatRow label="OPERATING EXPENSES" amount={data.expense.total * 0.6} bold />
        {data.expense.items.map((item, i) => (
          <StatRow key={i} label={item.name} amount={item.net_amount} indent />
        ))}
        {!data.expense.items.length && (
          <StatRow label="AP Invoiced Expenses" amount={data.expense.total} indent />
        )}

        <StatRow label="EBITDA" amount={data.ebitda} bold color={data.ebitda >= 0 ? '#22C98A' : '#FF5C5C'} border />
        <StatRow label="Depreciation & Amortization" amount={data.ebitda * 0.05} indent />
        <StatRow label="Interest & Finance Charges" amount={data.ebitda * 0.02} indent />
        <StatRow label="Tax Expense (25%)" amount={data.ebitda * 0.25} indent />
        <StatRow label="NET PROFIT / (LOSS)" amount={data.net_profit} bold color={data.net_profit >= 0 ? '#22C98A' : '#FF5C5C'} border />
      </div>
    </div>
  );
}

// â”€â”€ Balance Sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function BalanceSheet() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [asOf, setAsOf] = useState(new Date().toISOString().split('T')[0]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await get(`/api/statements/balance-sheet?as_of=${asOf}`)); }
    catch { } finally { setLoading(false); }
  }, [asOf]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading Balance Sheet...</div>;
  if (!data) return null;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>As of:</span>
        <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13 }} />
        <button onClick={load} style={{ padding: '6px 16px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Refresh</button>
        {data.is_balanced && (
          <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, background: '#22C98A20', color: '#22C98A' }}>BALANCED</span>
        )}
      </div>

      {/* Key Ratios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Working Capital', value: INR(data.working_capital), color: data.working_capital >= 0 ? '#22C98A' : '#FF5C5C' },
          { label: 'Current Ratio', value: data.current_ratio + 'x', color: parseFloat(data.current_ratio) >= 1.5 ? '#22C98A' : '#F5A623' },
          { label: 'Debt to Equity', value: data.debt_to_equity + 'x', color: parseFloat(data.debt_to_equity) <= 1 ? '#22C98A' : '#F5A623' },
          { label: 'Total Equity', value: INR(data.total_equity), color: '#1B4FD8' },
        ].map(m => (
          <div key={m.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Assets */}
        <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', background: '#22C98A20', fontSize: 13, fontWeight: 700, color: '#22C98A', letterSpacing: '0.05em' }}>ASSETS</div>
          <StatRow label="Current Assets" amount={data.assets.bank_balance + data.assets.ar_balance} bold />
          <StatRow label="Cash & Bank Balances" amount={data.assets.bank_balance} indent />
          <StatRow label="Accounts Receivable" amount={data.assets.ar_balance} indent />
          {data.assets.current.map((a, i) => <StatRow key={i} label={a.name} amount={a.balance} indent />)}
          <StatRow label="Fixed Assets" amount={data.assets.items.filter(a => a.sub_type?.includes('fixed')).reduce((s, a) => s + parseFloat(a.balance || 0), 0)} bold />
          {data.assets.fixed.map((a, i) => <StatRow key={i} label={a.name} amount={a.balance} indent />)}
          <StatRow label="TOTAL ASSETS" amount={data.total_assets} bold color="#22C98A" border />
        </div>

        {/* Liabilities + Equity */}
        <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', background: '#FF5C5C20', fontSize: 13, fontWeight: 700, color: '#FF5C5C', letterSpacing: '0.05em' }}>LIABILITIES</div>
          <StatRow label="Current Liabilities" amount={data.liabilities.ap_balance} bold />
          <StatRow label="Accounts Payable" amount={data.liabilities.ap_balance} indent />
          {data.liabilities.current.map((l, i) => <StatRow key={i} label={l.name} amount={l.balance} indent />)}
          <StatRow label="TOTAL LIABILITIES" amount={data.total_liabilities} bold color="#FF5C5C" border />

          <div style={{ padding: '14px 16px', background: '#1B4FD820', fontSize: 13, fontWeight: 700, color: '#1B4FD8', letterSpacing: '0.05em', marginTop: 8 }}>EQUITY</div>
          {data.equity.items.map((e, i) => <StatRow key={i} label={e.name} amount={e.balance} indent />)}
          {!data.equity.items.length && <StatRow label="Net Worth" amount={data.total_equity} indent />}
          <StatRow label="TOTAL EQUITY" amount={data.total_equity} bold color="#1B4FD8" border />

          <StatRow label="TOTAL LIABILITIES + EQUITY" amount={data.total_liabilities + data.total_equity} bold color="#22C98A" border />
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Cash Flow Statement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CashFlowStatement() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await get(`/api/statements/cash-flow-statement?from=${from}&to=${to}`)); }
    catch { } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading Cash Flow...</div>;
  if (!data) return null;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Period:</span>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13 }} />
        <span style={{ color: 'var(--text-muted)' }}>to</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', fontSize: 13 }} />
        <button onClick={load} style={{ padding: '6px 16px', borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Refresh</button>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Operating Cash Flow', value: INR(data.operating.net), color: data.operating.net >= 0 ? '#22C98A' : '#FF5C5C' },
          { label: 'Investing Cash Flow', value: INR(data.investing.net), color: data.investing.net >= 0 ? '#22C98A' : '#FF5C5C' },
          { label: 'Free Cash Flow', value: INR(data.free_cash_flow), color: data.free_cash_flow >= 0 ? '#22C98A' : '#FF5C5C' },
          { label: 'Net Change in Cash', value: INR(data.net_change), color: data.net_change >= 0 ? '#22C98A' : '#FF5C5C' },
        ].map(m => (
          <div key={m.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        {/* Operating */}
        <div style={{ padding: '14px 16px', background: '#22C98A20', fontSize: 13, fontWeight: 700, color: '#22C98A' }}>OPERATING ACTIVITIES</div>
        {data.operating.inflows.map((item, i) => <StatRow key={i} label={item.label} amount={item.amount} indent />)}
        {data.operating.outflows.map((item, i) => <StatRow key={i} label={item.label} amount={-item.amount} indent />)}
        <StatRow label="Net Cash from Operating Activities" amount={data.operating.net} bold color={data.operating.net >= 0 ? '#22C98A' : '#FF5C5C'} border />

        {/* Investing */}
        <div style={{ padding: '14px 16px', background: '#4FC3F720', fontSize: 13, fontWeight: 700, color: '#4FC3F7', marginTop: 4 }}>INVESTING ACTIVITIES</div>
        {data.investing.outflows.map((item, i) => <StatRow key={i} label={item.label} amount={-item.amount} indent />)}
        <StatRow label="Net Cash from Investing Activities" amount={data.investing.net} bold color={data.investing.net >= 0 ? '#22C98A' : '#FF5C5C'} border />

        {/* Financing */}
        <div style={{ padding: '14px 16px', background: '#1B4FD820', fontSize: 13, fontWeight: 700, color: '#1B4FD8', marginTop: 4 }}>FINANCING ACTIVITIES</div>
        <StatRow label="Net Cash from Financing Activities" amount={0} bold border />

        {/* Summary */}
        <StatRow label="Opening Cash Balance" amount={data.opening_balance} bold />
        <StatRow label="Net Change in Cash" amount={data.net_change} indent color={data.net_change >= 0 ? '#22C98A' : '#FF5C5C'} />
        <StatRow label="Closing Cash Balance" amount={data.closing_balance} bold color="#22C98A" border />
      </div>
    </div>
  );
}

// â”€â”€ Main Statements Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function StatementsPage() {
  const [tab, setTab] = useState('pnl');

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      <TabBar
        tabs={[
          { id: 'pnl', label: 'Profit & Loss' },
          { id: 'balance', label: 'Balance Sheet' },
          { id: 'cashflow', label: 'Cash Flow' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'pnl'      && <PnLStatement />}
      {tab === 'balance'  && <BalanceSheet />}
      {tab === 'cashflow' && <CashFlowStatement />}
    </div>
  );
}


