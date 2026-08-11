import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { const r = await fetch(apiURL(url), { headers: h() }); return r.json(); };

export default function TallyPage() {
  const [summary, setSummary] = useState(null);
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0]);
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => { loadSummary(); }, []);

  const loadSummary = async () => {
    setLoading(true);
    const data = await get(`/api/tally/summary?from=${from}&to=${to}`);
    setSummary(data);
    setLoading(false);
  };

  const download = async (type) => {
    setDownloading(type);
    try {
      const token = localStorage.getItem('token');
      const url = type === 'vouchers'
        ? apiURL(`/api/tally/export/vouchers?from=${from}&to=${to}`)
        : apiURL(`/api/tally/export/masters`);
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = type === 'vouchers' ? `deemona-tally-${from}-to-${to}.xml` : 'deemona-tally-masters.xml';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch(e) { console.error(e); }
    setDownloading(null);
  };

  const STEPS = [
    { num: 1, title: 'Export Masters', desc: 'Download ledger masters (accounts, vendors, customers) first. Import once when setting up.', action: () => download('masters'), btn: '⬇ Download Masters XML', color: '#22C98A' },
    { num: 2, title: 'Import Masters in Tally', desc: 'In Tally: Gateway → Import → Masters → Select the downloaded XML file → Yes to import.', action: null, btn: null, color: '#4FC3F7' },
    { num: 3, title: 'Export Vouchers', desc: 'Download transactions (journal entries, invoices, payments) for the selected period.', action: () => download('vouchers'), btn: '⬇ Download Vouchers XML', color: '#1B4FD8' },
    { num: 4, title: 'Import Vouchers in Tally', desc: 'In Tally: Gateway → Import → Vouchers → Select the XML file → Import. All entries will be posted.', action: null, btn: null, color: '#F5A623' },
  ];

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 6 }}>Tally XML Sync</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Export your Deemona data as Tally-compatible XML for seamless sync with Tally Prime / ERP 9</p>
      </div>

      {/* Tally compatibility badge */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', padding: '12px 16px', borderRadius: 10, background: '#22C98A12', border: '1px solid #22C98A30' }}>
        <span style={{ fontSize: 24 }}>✓</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#22C98A' }}>Compatible with Tally Prime and Tally ERP 9</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Exports Vouchers (Journal, Purchase, Sales, Receipt, Payment) and Ledger Masters in standard Tally XML format</div>
        </div>
      </div>

      {/* Date range selector + summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ borderRadius: 12, border: '1px solid var(--border)', padding: 20, background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Select Export Period</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>FROM</div>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>TO</div>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)', fontSize: 13 }} />
            </div>
          </div>
          <button onClick={loadSummary} disabled={loading} style={{ width: '100%', padding: '9px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: loading ? 'var(--surface-3)' : 'linear-gradient(135deg,#1B4FD8,#3B82F6)', color: loading ? 'var(--text-muted)' : '#fff', border: 'none', cursor: 'pointer' }}>
            {loading ? 'Loading...' : 'Load Summary'}
          </button>
        </div>

        {summary && (
          <div style={{ borderRadius: 12, border: '1px solid var(--border)', padding: 20, background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Ready to Export</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>VOUCHERS</div>
            {[
              ['Journal Entries', summary.vouchers?.journal_entries],
              ['Purchase Vouchers (AP)', summary.vouchers?.purchase_vouchers],
              ['Sales Vouchers (AR)', summary.vouchers?.sales_vouchers],
              ['Payment/Receipt', summary.vouchers?.payment_receipts],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontWeight: 700 }}>{val || 0}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, paddingTop: 8, borderTop: '1px solid var(--border)', marginTop: 4 }}>
              <span>Total Vouchers</span><span style={{ color: '#1B4FD8' }}>{summary.vouchers?.total || 0}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginTop: 12, marginBottom: 8, letterSpacing: '0.05em' }}>MASTERS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Ledgers + Vendors + Customers</span>
              <span style={{ fontWeight: 700 }}>{summary.masters?.total || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* Step by step guide */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>How to sync with Tally</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STEPS.map(step => (
            <div key={step.num} style={{ display: 'flex', gap: 16, padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface-2)', alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{step.num}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
              {step.btn && (
                <button onClick={step.action} disabled={downloading === (step.num === 1 ? 'masters' : 'vouchers')} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: step.color, color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {downloading === (step.num === 1 ? 'masters' : 'vouchers') ? 'Generating...' : step.btn}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick download buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => download('masters')} disabled={!!downloading} style={{ flex: 1, padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#22C98A', color: '#fff', border: 'none', cursor: 'pointer' }}>
          {downloading === 'masters' ? '⏳ Generating...' : '⬇ Download Masters XML'}
        </button>
        <button onClick={() => download('vouchers')} disabled={!!downloading} style={{ flex: 1, padding: '13px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg,#1B4FD8,#3B82F6)', color: '#fff', border: 'none', cursor: 'pointer' }}>
          {downloading === 'vouchers' ? '⏳ Generating...' : '⬇ Download Vouchers XML'}
        </button>
      </div>

      <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
        💡 <strong>Tip:</strong> Import Masters first (one time), then import Vouchers periodically (monthly recommended). Both files follow Tally's standard XML import format and work with Tally Prime 3.0+ and Tally ERP 9.
      </div>
    </div>
  );
}
