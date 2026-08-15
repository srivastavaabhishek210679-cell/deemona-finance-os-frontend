// v2 clean rewrite
import { useState, useRef } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); const t = await r.text(); return JSON.parse(t); } catch { return {}; } };
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); const t = await r.text(); return JSON.parse(t); } catch (e) { return { error: e.message }; } };

// â”€â”€ Bank CSV formats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BANK_FORMATS = {
  hdfc: {
    name: 'HDFC Bank',
    logo: 'ðŸŸ¦',
    delimiter: ',',
    skipRows: 20,
    columns: { date: 'Date', description: 'Narration', debit: 'Withdrawal Amt.', credit: 'Deposit Amt.', balance: 'Closing Balance' },
    dateFormat: 'DD/MM/YY',
    sample: 'Date,Narration,Value Dt,Ref No./Cheque No.,Branch Code,Withdrawal Amt.,Deposit Amt.,Closing Balance',
  },
  icici: {
    name: 'ICICI Bank',
    logo: 'ðŸŸ§',
    delimiter: ',',
    skipRows: 1,
    columns: { date: 'Transaction Date', description: 'Transaction Remarks', debit: 'Withdrawal Amount (INR )', credit: 'Deposit Amount (INR )', balance: 'Balance (INR )' },
    dateFormat: 'DD-MM-YYYY',
    sample: 'Transaction Date,Value Date,Transaction Remarks,Ref No./Cheque No.,Withdrawal Amount (INR ),Deposit Amount (INR ),Balance (INR )',
  },
  sbi: {
    name: 'State Bank of India',
    logo: 'ðŸ”µ',
    delimiter: ',',
    skipRows: 2,
    columns: { date: 'Txn Date', description: 'Description', debit: 'Debit', credit: 'Credit', balance: 'Balance' },
    dateFormat: 'DD MMM YYYY',
    sample: 'Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance',
  },
  axis: {
    name: 'Axis Bank',
    logo: 'ðŸŸ¥',
    delimiter: ',',
    skipRows: 1,
    columns: { date: 'Tran Date', description: 'PARTICULARS', debit: 'DR', credit: 'CR', balance: 'BAL' },
    dateFormat: 'DD-MM-YYYY',
    sample: 'Tran Date,CHEQUENO,PARTICULARS,DR,CR,BAL',
  },
  kotak: {
    name: 'Kotak Bank',
    logo: 'ðŸŸ«',
    delimiter: ',',
    skipRows: 1,
    columns: { date: 'Transaction Date', description: 'Description', debit: 'Debit', credit: 'Credit', balance: 'Balance' },
    dateFormat: 'DD/MM/YYYY',
    sample: 'Transaction Date,Description,Cheque Number,Debit,Credit,Balance',
  },
};

function parseAmount(str) {
  if (!str || str.trim() === '' || str.trim() === '-') return 0;
  return parseFloat(str.replace(/[,\sâ‚¹Rs]/g, '')) || 0;
}

function parseDate(str, format) {
  if (!str) return null;
  str = str.trim();
  try {
    const parts = str.replace(/[\/\-]/g, ' ').split(' ');
    const months = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 };
    if (parts.length === 3) {
      let d, m, y;
      if (format.startsWith('DD')) {
        d = parseInt(parts[0]);
        m = parseInt(parts[1]) - 1 || months[parts[1]] || 0;
        y = parseInt(parts[2]);
        if (y < 100) y += 2000;
      } else {
        m = parseInt(parts[0]) - 1;
        d = parseInt(parts[1]);
        y = parseInt(parts[2]);
      }
      const date = new Date(y, m, d);
      if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
    }
  } catch { }
  return null;
}

function autoDetectCategory(desc) {
  const d = desc.toLowerCase();
  if (d.includes('salary') || d.includes('payroll') || d.includes('neft cr') && d.includes('sal')) return 'payroll';
  if (d.includes('gst') || d.includes('tax') || d.includes('tds') || d.includes('advance tax')) return 'tax_payment';
  if (d.includes('rent') || d.includes('lease') || d.includes('wework')) return 'rent';
  if (d.includes('aws') || d.includes('microsoft') || d.includes('cloud') || d.includes('azure')) return 'vendor_payment';
  if (d.includes('utility') || d.includes('electricity') || d.includes('jio') || d.includes('airtel')) return 'utilities';
  if (d.includes('upi') || d.includes('imps') || d.includes('neft') || d.includes('rtgs')) return 'transfer';
  if (d.includes('interest') || d.includes('int cr')) return 'bank_interest';
  if (d.includes('charge') || d.includes('fee') || d.includes('commission')) return 'bank_charges';
  return 'other';
}

export default function BankStatementImporter() {
  const [selectedBank, setSelectedBank] = useState('hdfc');
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [error, setError] = useState('');
  const [step, setStep] = useState('select'); // select | preview | done
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [editRows, setEditRows] = useState({});
  const fileRef = useRef(null);

  useState(() => {
    get('/api/treasury/accounts').then(d => {
      const accs = d.accounts || d.banks || [];
      setBankAccounts(accs);
      if (accs[0]) setSelectedAccount(accs[0].id);
    });
  }, []);

  const parseCSV = (text, format) => {
    const lines = text.split('\n').filter(l => l.trim());
    const dataLines = lines.slice(format.skipRows);
    if (!dataLines.length) return [];

    const headers = lines[format.skipRows - 1]?.split(format.delimiter).map(h => h.trim().replace(/"/g, '')) || [];
    const colMap = format.columns;

    const getCol = (row, colName) => {
      const idx = headers.findIndex(h => h.includes(colName) || colName.includes(h));
      if (idx === -1) return '';
      const parts = row.split(format.delimiter);
      return (parts[idx] || '').trim().replace(/"/g, '');
    };

    return dataLines.map((line, i) => {
      const date = parseDate(getCol(line, colMap.date), format.dateFormat);
      const desc = getCol(line, colMap.description);
      const debit = parseAmount(getCol(line, colMap.debit));
      const credit = parseAmount(getCol(line, colMap.credit));
      const balance = parseAmount(getCol(line, colMap.balance));
      if (!date && !desc) return null;
      return {
        id: i,
        date: date || new Date().toISOString().split('T')[0],
        description: desc || 'Unknown',
        amount: credit > 0 ? credit : debit,
        type: credit > 0 ? 'credit' : 'debit',
        balance,
        category: autoDetectCategory(desc),
        selected: true,
      };
    }).filter(Boolean);
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const format = BANK_FORMATS[selectedBank];
        const rows = parseCSV(ev.target.result, format);
        if (!rows.length) { setError('Could not parse file. Check bank format selection.'); return; }
        setParsed(rows);
        setStep('preview');
      } catch (err) {
        setError('Parse error: ' + err.message);
      }
    };
    reader.readAsText(f);
  };

  const toggleRow = (id) => setParsed(prev => prev.map(r => r.id === id ? {...r, selected: !r.selected} : r));
  const updateRow = (id, field, val) => setParsed(prev => prev.map(r => r.id === id ? {...r, [field]: val} : r));

  const handleImport = async () => {
    setImporting(true);
    const toImport = parsed.filter(r => r.selected);
    let count = 0;
    for (const row of toImport) {
      const res = await post('/api/treasury/transactions', {
        bank_account_id: selectedAccount,
        date: row.date,
        description: row.description,
        amount: row.amount,
        type: row.type,
        category: row.category,
        reference: row.reference || '',
      });
      if (!res.error) count++;
    }
    setImported(count);
    setImporting(false);
    setStep('done');
  };

  const selectedRows = parsed.filter(r => r.selected);
  const totalCredit = selectedRows.filter(r => r.type === 'credit').reduce((s, r) => s + r.amount, 0);
  const totalDebit = selectedRows.filter(r => r.type === 'debit').reduce((s, r) => s + r.amount, 0);
  const INR = n => 'Rs ' + parseFloat(n || 0).toLocaleString('en-IN');

  const CATEGORIES = ['accounts_receivable','vendor_payment','payroll','tax_payment','rent','utilities','bank_charges','bank_interest','transfer','other'];

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628', marginBottom: 4 }}>Bank Statement Importer</h1>
        <div style={{ fontSize: 13, color: '#64748B' }}>Import transactions from your bank CSV export â€” supports all major Indian banks.</div>
      </div>

      {step === 'select' && (
        <div style={{ maxWidth: 700 }}>
          {/* Bank selection */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 16 }}>1. Select Your Bank</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {Object.entries(BANK_FORMATS).map(([id, bank]) => (
                <div key={id} onClick={() => setSelectedBank(id)}
                  style={{ padding: '12px', borderRadius: 8, border: `2px solid ${selectedBank === id ? '#1B4FD8' : '#E2E8F0'}`, background: selectedBank === id ? '#EEF3FD' : '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.12s' }}>
                  <span style={{ fontSize: 22 }}>{bank.logo}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: selectedBank === id ? '#1B4FD8' : '#334155' }}>{bank.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Account selection */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 12 }}>2. Select Target Account</div>
            <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', background: '#fff' }}>
              <option value="">Select bank account...</option>
              {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} â€” {acc.bank_name}</option>)}
            </select>
          </div>

          {/* File upload */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 24, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 12 }}>3. Upload CSV File</div>
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#F0F5FF', border: '1px solid #C7D9F8', marginBottom: 12, fontSize: 12, color: '#3B5998' }}>
              <strong>Expected format ({BANK_FORMATS[selectedBank].name}):</strong><br/>
              <code style={{ fontSize: 11, color: '#1B4FD8' }}>{BANK_FORMATS[selectedBank].sample}</code>
            </div>
            <div onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed #C7D9F8', borderRadius: 10, padding: '32px', textAlign: 'center', cursor: 'pointer', background: '#F8FAFC', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1B4FD8'; e.currentTarget.style.background = '#EEF3FD'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#C7D9F8'; e.currentTarget.style.background = '#F8FAFC'; }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>ðŸ“</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Click to upload CSV file</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>Export statement from your bank's internet banking portal</div>
              {file && <div style={{ marginTop: 10, fontSize: 12, color: '#1B4FD8', fontWeight: 600 }}>âœ“ {file.name}</div>}
            </div>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ display: 'none' }} />
            {error && <div style={{ marginTop: 10, padding: '10px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 12 }}>{error}</div>}
          </div>

          <div style={{ padding: '14px 16px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A', fontSize: 12, color: '#92400E' }}>
            <strong>How to export:</strong> Login to your bank â†’ Account Statement â†’ Select date range â†’ Download as CSV
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Total Rows', value: parsed.length, color: '#1B4FD8' },
              { label: 'Selected', value: selectedRows.length, color: '#059669' },
              { label: 'Total Credits', value: INR(totalCredit), color: '#059669' },
              { label: 'Total Debits', value: INR(totalDebit), color: '#DC2626' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '14px 16px', borderRadius: 10, background: '#fff', border: '1px solid #C7D9F8' }}>
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #EEF3FD', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Preview â€” Select rows to import</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setParsed(p => p.map(r => ({...r, selected: true})))} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #C7D9F8', background: '#F0F5FF', color: '#1B4FD8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Select All</button>
                <button onClick={() => setParsed(p => p.map(r => ({...r, selected: false})))} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontSize: 11, cursor: 'pointer' }}>Deselect All</button>
              </div>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr style={{ background: '#F0F5FF' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'center', width: 40 }}>âœ“</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>Date</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>Description</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>Amount</th>
                    <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>Type</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((row, i) => (
                    <tr key={row.id} style={{ borderTop: '1px solid #F1F5F9', background: row.selected ? '#fff' : '#F8FAFC', opacity: row.selected ? 1 : 0.4 }}>
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                        <input type="checkbox" checked={row.selected} onChange={() => toggleRow(row.id)} style={{ accentColor: '#1B4FD8' }} />
                      </td>
                      <td style={{ padding: '6px 12px', color: '#334155' }}>{row.date}</td>
                      <td style={{ padding: '6px 12px', color: '#334155', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.description}</td>
                      <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700, color: row.type === 'credit' ? '#059669' : '#DC2626' }}>
                        {row.type === 'credit' ? '+' : '-'} {INR(row.amount)}
                      </td>
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: row.type === 'credit' ? '#ECFDF5' : '#FEF2F2', color: row.type === 'credit' ? '#059669' : '#DC2626' }}>{row.type}</span>
                      </td>
                      <td style={{ padding: '6px 12px' }}>
                        <select value={row.category} onChange={e => updateRow(row.id, 'category', e.target.value)}
                          style={{ padding: '3px 6px', borderRadius: 5, border: '1px solid #E2E8F0', fontSize: 11, outline: 'none', background: '#fff' }}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => { setStep('select'); setParsed([]); setFile(null); }} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>â† Back</button>
            <button onClick={handleImport} disabled={importing || !selectedRows.length} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: importing ? '#93B4EF' : '#1B4FD8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: importing ? 'not-allowed' : 'pointer' }}>
              {importing ? 'Importing...' : `Import ${selectedRows.length} Transactions â†’`}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div style={{ maxWidth: 500, margin: '60px auto', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>âœ…</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', marginBottom: 8 }}>Import Successful!</div>
          <div style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>{imported} transactions imported to your bank account.</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => { setStep('select'); setParsed([]); setFile(null); setImported(0); }} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #C7D9F8', background: '#F0F5FF', color: '#1B4FD8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Import Another</button>
            <a href="/treasury" style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#1B4FD8', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>View Transactions â†’</a>
          </div>
        </div>
      )}
    </div>
  );
}

