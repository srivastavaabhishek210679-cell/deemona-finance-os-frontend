import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const jh = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { const r = await fetch(apiURL(url), { headers: jh() }); return r.json(); };

function INR(n) { const v=parseFloat(n||0); if(v>=1e7) return 'Rs '+(v/1e7).toFixed(2)+' Cr'; if(v>=1e5) return 'Rs '+(v/1e5).toFixed(2)+' L'; return 'Rs '+v.toLocaleString('en-IN'); }

const TABLE_ICONS = { accounts:'📒', vendors:'🏭', customers:'👤', ar_invoices:'📄', ap_invoices:'📋', employees:'👥', payroll_runs:'💳', projects:'📊', bank_transactions:'🏦', fixed_assets:'🖥', inventory_items:'📦', crm_leads:'🎯', expense_claims:'🧾', tax_filings:'⚖️', compliance_items:'📅', finance_memory:'🧠' };

export default function DataExportPage() {
  const [summary, setSummary] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [tab, setTab] = useState('export');

  useEffect(()=>{ get('/api/export/summary').then(setSummary); },[]);

  const download = async (url, filename) => {
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(apiURL(url), { headers: { Authorization: `Bearer ${token}` } });
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch(e) { console.error(e); }
  };

  const downloadJSON = async (table) => {
    setDownloading(table+'_json');
    await download(`/api/export/json/${table}`, `deemona-${table}-${new Date().toISOString().split('T')[0]}.json`);
    setDownloading(null);
  };

  const downloadCSV = async (table) => {
    setDownloading(table+'_csv');
    await download(`/api/export/csv/${table}`, `deemona-${table}-${new Date().toISOString().split('T')[0]}.csv`);
    setDownloading(null);
  };

  const downloadFullBackup = async () => {
    setDownloading('backup');
    await download('/api/export/full-backup', `deemona-full-backup-${new Date().toISOString().split('T')[0]}.json`);
    setDownloading(null);
  };

  const downloadTallyMasters = async () => {
    setDownloading('tally_masters');
    await download('/api/tally/export/masters', `deemona-tally-masters.xml`);
    setDownloading(null);
  };

  const downloadTallyVouchers = async () => {
    setDownloading('tally_vouchers');
    const from = new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];
    await download(`/api/tally/export/vouchers?from=${from}&to=${to}`, `deemona-tally-vouchers.xml`);
    setDownloading(null);
  };

  const CSV_TABLES = ['accounts','vendors','customers','ar_invoices','ap_invoices','employees','projects','bank_transactions','fixed_assets','inventory_items','crm_leads','expense_claims','tax_filings'];

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, margin:0, marginBottom:6 }}>Data Export</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', margin:0 }}>Export your complete financial data in JSON, CSV, or Tally XML format</p>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['export','📦 Export Data'],['backup','💾 Full Backup'],['tally','📒 Tally Export']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'10px 20px', fontSize:14, fontWeight:600, background:'none', border:'none', cursor:'pointer', borderBottom:tab===id?'2px solid #6C63FF':'2px solid transparent', color:tab===id?'#6C63FF':'var(--text-secondary)', marginBottom:-1 }}>{label}</button>
        ))}
      </div>

      {tab==='export' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
            {[
              { label:'Total Tables', value:summary?.modules?.length||0, color:'#6C63FF' },
              { label:'Total Records', value:summary?.modules?.reduce((s,m)=>s+parseInt(m.count||0),0)||0, color:'#22C98A' },
              { label:'Formats', value:'JSON · CSV · XML', color:'#4FC3F7' },
            ].map(k=>(
              <div key={k.label} style={{ padding:'14px 16px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:20, fontWeight:800, color:k.color }}>{k.value}</div>
                <div style={{ fontSize:13, color:'var(--text-muted)' }}>{k.label}</div>
              </div>
            ))}
          </div>

          <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', background:'var(--surface-3)', display:'grid', gridTemplateColumns:'2fr 80px 1fr 120px', fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.04em' }}>
              <div>MODULE</div><div>RECORDS</div><div>VALUE</div><div>EXPORT</div>
            </div>
            {summary?.modules?.map(m=>(
              <div key={m.table} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'grid', gridTemplateColumns:'2fr 80px 1fr 120px', alignItems:'center' }}>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <span style={{ fontSize:18 }}>{TABLE_ICONS[m.table]||'📄'}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{m.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'monospace' }}>{m.table}</div>
                  </div>
                </div>
                <div style={{ fontSize:13, fontWeight:700 }}>{parseInt(m.count||0).toLocaleString()}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{m.value ? INR(m.value) : '—'}</div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={()=>downloadJSON(m.table)} disabled={downloading===m.table+'_json'} style={{ padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:700, background:'#6C63FF20', color:'#9B8FFF', border:'1px solid #6C63FF30', cursor:'pointer' }}>
                    {downloading===m.table+'_json'?'...':'JSON'}
                  </button>
                  {CSV_TABLES.includes(m.table) && (
                    <button onClick={()=>downloadCSV(m.table)} disabled={downloading===m.table+'_csv'} style={{ padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:700, background:'#22C98A20', color:'#22C98A', border:'1px solid #22C98A30', cursor:'pointer' }}>
                      {downloading===m.table+'_csv'?'...':'CSV'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='backup' && (
        <div style={{ maxWidth:600 }}>
          <div style={{ borderRadius:14, border:'2px solid #6C63FF40', padding:28, background:'#6C63FF06', marginBottom:20 }}>
            <div style={{ fontSize:36, marginBottom:14 }}>💾</div>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>Full Data Backup</div>
            <div style={{ fontSize:14, color:'var(--text-secondary)', marginBottom:20, lineHeight:1.6 }}>
              Downloads a complete backup of all your Deemona data in JSON format. Includes all {summary?.modules?.length} modules, {summary?.modules?.reduce((s,m)=>s+parseInt(m.count||0),0)?.toLocaleString()} records.
            </div>
            <div style={{ marginBottom:20 }}>
              {summary?.modules?.map(m=>(
                <div key={m.table} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:12, color:'var(--text-secondary)' }}>
                  <span>{m.name}</span><span style={{ fontWeight:600 }}>{parseInt(m.count||0).toLocaleString()} records</span>
                </div>
              ))}
            </div>
            <button onClick={downloadFullBackup} disabled={downloading==='backup'} style={{ width:'100%', padding:'13px', borderRadius:10, fontSize:15, fontWeight:700, background:downloading==='backup'?'var(--surface-3)':'linear-gradient(135deg,#6C63FF,#9B8FFF)', color:downloading==='backup'?'var(--text-muted)':'#fff', border:'none', cursor:downloading==='backup'?'not-allowed':'pointer' }}>
              {downloading==='backup'?'⏳ Generating backup...':'⬇ Download Full Backup (JSON)'}
            </button>
          </div>

          <div style={{ padding:'14px 16px', borderRadius:10, background:'var(--surface-2)', border:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)', lineHeight:1.7 }}>
            <strong>Backup includes:</strong> Chart of accounts, vendors, customers, all invoices, employees, payroll, projects, bank transactions, fixed assets, inventory, CRM leads, expense claims, tax filings, compliance items, finance memory, and budgets.<br/><br/>
            <strong>Format:</strong> JSON with table-level structure. Can be used to restore data or migrate to another system.
          </div>
        </div>
      )}

      {tab==='tally' && (
        <div style={{ maxWidth:600 }}>
          <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:10, background:'#22C98A12', border:'1px solid #22C98A30', fontSize:13, color:'#22C98A', fontWeight:600 }}>
            Compatible with Tally Prime 3.0+ and Tally ERP 9
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
            <div style={{ borderRadius:12, border:'1px solid var(--border)', padding:20, background:'var(--surface-2)' }}>
              <div style={{ fontSize:24, marginBottom:10 }}>📚</div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>Ledger Masters</div>
              <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16, lineHeight:1.5 }}>
                Export all accounts, vendors, and customers as Tally ledger masters. Import once.
              </div>
              <button onClick={downloadTallyMasters} disabled={downloading==='tally_masters'} style={{ width:'100%', padding:'10px', borderRadius:9, fontSize:13, fontWeight:700, background:'#22C98A', color:'#fff', border:'none', cursor:'pointer' }}>
                {downloading==='tally_masters'?'Generating...':'⬇ Download Masters XML'}
              </button>
            </div>

            <div style={{ borderRadius:12, border:'1px solid var(--border)', padding:20, background:'var(--surface-2)' }}>
              <div style={{ fontSize:24, marginBottom:10 }}>📒</div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>Transaction Vouchers</div>
              <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16, lineHeight:1.5 }}>
                Export journal entries, invoices, and bank transactions as Tally vouchers.
              </div>
              <button onClick={downloadTallyVouchers} disabled={downloading==='tally_vouchers'} style={{ width:'100%', padding:'10px', borderRadius:9, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#6C63FF,#9B8FFF)', color:'#fff', border:'none', cursor:'pointer' }}>
                {downloading==='tally_vouchers'?'Generating...':'⬇ Download Vouchers XML'}
              </button>
            </div>
          </div>

          <div style={{ padding:'12px 16px', borderRadius:8, background:'var(--surface-2)', border:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)' }}>
            Import order: Masters first → then Vouchers. In Tally: Gateway of Tally → Import Data → select XML file.
          </div>
        </div>
      )}
    </div>
  );
}
