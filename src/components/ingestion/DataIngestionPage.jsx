import { useState, useRef, useCallback } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const api = async (url, method='GET', body=null) => {
  try {
    const r = await fetch(apiURL(url), { method, headers: h(), body: body ? JSON.stringify(body) : null });
    return await r.json();
  } catch (e) { return { error: e.message }; }
};
const fmt = n => '₹' + parseFloat(n||0).toLocaleString('en-IN', {minimumFractionDigits:0,maximumFractionDigits:0});

const DATA_TYPES = [
  { id:'SALES_INVOICES',    label:'Sales Invoices',       icon:'📄', color:'#1d4ed8', desc:'AR invoices, customer bills, sales orders' },
  { id:'PURCHASE_INVOICES', label:'Purchase Invoices',    icon:'📋', color:'#7c3aed', desc:'Vendor bills, supplier invoices, purchase orders' },
  { id:'EXPENSES',          label:'Expense Claims',       icon:'🧾', color:'#dc2626', desc:'Employee expenses, reimbursements, petty cash' },
  { id:'INVENTORY',         label:'Inventory / Stock',    icon:'📦', color:'#d97706', desc:'Stock items, products, raw materials, SKUs' },
  { id:'PAYROLL',           label:'Payroll Data',         icon:'👥', color:'#059669', desc:'Salary, allowances, deductions, payslips' },
  { id:'CUSTOMERS',         label:'Customer Master',      icon:'🏢', color:'#0891b2', desc:'Customer profiles, credit limits, contact info' },
  { id:'VENDORS',           label:'Vendor Master',        icon:'🏭', color:'#7c3aed', desc:'Supplier profiles, payment terms, GSTIN' },
  { id:'BANK_TRANSACTIONS', label:'Bank Transactions',    icon:'🏦', color:'#1d4ed8', desc:'Bank statement, debit/credit entries' },
  { id:'ASSETS',            label:'Fixed Assets',         icon:'⚙️', color:'#d97706', desc:'Equipment, furniture, machinery, depreciation' },
];

const STEPS = ['Upload File', 'Preview & Map', 'Import', 'Results'];

function Badge({ text, color='#1d4ed8' }) {
  return <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:color+'18',color,border:`1px solid ${color}30`}}>{text}</span>;
}

export default function DataIngestionPage() {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [csvText, setCSVText] = useState('');
  const [format, setFormat] = useState('csv');
  const [forcedType, setForcedType] = useState('');
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [manualData, setManualData] = useState('');
  const [inputMode, setInputMode] = useState('file'); // file | paste | manual
  const fileRef = useRef();

  const loadHistory = async () => {
    if (historyLoaded) return;
    const d = await api('/api/ingest/history');
    setHistory(d.history || []);
    setHistoryLoaded(true);
  };

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setInputMode('file');
    const ext = f.name.split('.').pop()?.toLowerCase();
    // Detect format from extension
    const fmt = ext === 'xlsx' || ext === 'xls' ? 'excel'
              : ext === 'pdf' ? 'pdf'
              : ext === 'xml' ? 'xml'
              : ext === 'json' ? 'json'
              : 'csv';
    setFormat(fmt);
    const reader = new FileReader();
    if (fmt === 'excel' || fmt === 'pdf') {
      // Binary files: read as base64
      reader.onload = e => {
        const base64 = e.target.result.split(',')[1]; // strip data:...;base64,
        setCSVText(base64);
      };
      reader.readAsDataURL(f);
    } else {
      reader.onload = e => setCSVText(e.target.result);
      reader.readAsText(f);
    }
  };

  const handleDrop = useCallback(e => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const doPreview = async () => {
    const data = inputMode === 'paste' ? csvText : inputMode === 'manual' ? manualData : csvText;
    if (!data || !data.trim()) return alert('Please enter or upload data first.');
    if (!data.trim()) return alert('No data to preview');
    const resp = await api('/api/ingest/preview', 'POST', { data, format, dataType: forcedType || undefined });
    if (resp.error) return alert('Preview error: ' + resp.error);
    setPreview(resp);
    setStep(1);
  };

  const doImport = async () => {
    setImporting(true);
    const data = inputMode === 'paste' ? csvText : inputMode === 'manual' ? manualData : csvText;
    const activeFormat = inputMode === 'gsheet' ? 'gsheet' : format;
    const resp = await api('/api/ingest', 'POST', {
      data, format: activeFormat,
      dataType: forcedType || preview?.dataType,
      fieldMapping: preview?.fieldMapping,
    });
    setResult(resp);
    setStep(3);
    setHistoryLoaded(false);
    setImporting(false);
  };

  const downloadTemplate = (type) => {
    const token = localStorage.getItem('token') ?? '';
    const url = apiURL(`/api/ingest/template/${type.toLowerCase()}`);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${type.toLowerCase()}_template.csv`;
        a.click();
      });
  };

  const reset = () => { setStep(0); setFile(null); setCSVText(''); setPreview(null); setResult(null); setManualData(''); };

  return (
    <div style={{padding:20,background:'#f0f4ff',minHeight:'100%'}}>

      {/* Header */}
      <div style={{background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)',borderRadius:12,padding:'16px 20px',marginBottom:16,color:'#fff'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
              <span style={{fontSize:24}}>⬆️</span>
              <div>
                <div style={{fontSize:17,fontWeight:800,letterSpacing:'-0.02em'}}>Unified Data Ingestion Engine</div>
                <div style={{fontSize:11,opacity:0.8}}>Import any data type — CSV, Excel, JSON — everything updates automatically</div>
              </div>
            </div>
          </div>
          <div style={{textAlign:'right',fontSize:11,opacity:0.8}}>
            <div>✓ AI-powered field mapping</div>
            <div>✓ Auto-detect data type</div>
            <div>✓ All modules update instantly</div>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div style={{display:'flex',gap:0,marginBottom:16,background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',overflow:'hidden'}}>
        {STEPS.map((s, i) => (
          <div key={i} style={{flex:1,padding:'10px 14px',background:i===step?'#1d4ed8':i<step?'#eff6ff':'#fff',color:i===step?'#fff':i<step?'#1d4ed8':'#94a3b8',fontSize:11,fontWeight:i===step?700:400,textAlign:'center',borderRight:i<3?'1px solid #e2e8f0':'none',cursor:i<step?'pointer':'default',transition:'all 0.2s'}}
            onClick={()=>i<step&&setStep(i)}>
            <span style={{marginRight:5}}>{i<step?'✓':`${i+1}.`}</span>{s}
          </div>
        ))}
      </div>

      {/* ── STEP 0: UPLOAD ── */}
      {step === 0 && (
        <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:14}}>
          <div>
            {/* Input mode tabs */}
            <div style={{display:'flex',gap:0,marginBottom:12,background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',overflow:'hidden'}}>
              {[['file','📁 Upload File'],['paste','📋 Paste CSV'],['gsheet','📊 Google Sheet'],['manual','✏️ Manual Entry']].map(([mode,label])=>(
                <button key={mode} onClick={()=>setInputMode(mode)} style={{flex:1,padding:'8px 0',border:'none',background:inputMode===mode?'#1d4ed8':'transparent',color:inputMode===mode?'#fff':'#64748b',fontSize:11,fontWeight:inputMode===mode?700:400,cursor:'pointer'}}>{label}</button>
              ))}
            </div>

            {/* File upload */}
            {inputMode === 'file' && (
              <div
                onDragOver={e=>{e.preventDefault();setDragging(true);}}
                onDragLeave={()=>setDragging(false)}
                onDrop={handleDrop}
                onClick={()=>{ setTimeout(()=>fileRef.current && fileRef.current.click(), 0); }}
                style={{border:`2px dashed ${dragging?'#1d4ed8':'#c7d2fe'}`,borderRadius:10,padding:40,textAlign:'center',background:dragging?'#eff6ff':'#fff',cursor:'pointer',marginBottom:12,transition:'all 0.2s'}}>
                <input ref={fileRef} type="file" accept=".csv,.txt,.json,.xlsx,.xls,.xml,.pdf" onChange={e=>handleFile(e.target.files[0])} style={{display:'none'}}/>
                <div style={{fontSize:36,marginBottom:8}}>{file ? '📄' : '☁️'}</div>
                {file ? (
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:'#1d4ed8'}}>{file.name}</div>
                    <div style={{fontSize:11,color:'#64748b'}}>{(file.size/1024).toFixed(1)} KB · {format.toUpperCase()}</div>
                  <div style={{fontSize:10,color:'#16a34a',marginTop:2}}>✓ Format auto-detected</div>
                  </div>
                ) : (
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:'#334155',marginBottom:4}}>Drag & drop your file here</div>
                    <div style={{fontSize:11,color:'#94a3b8'}}>Supports CSV, Excel, PDF, XML, JSON · Click to browse</div>
                  </div>
                )}
              </div>
            )}

            {/* Google Sheet */}
            {inputMode === 'gsheet' && (
              <div style={{marginBottom:12}}>
                <div style={{padding:'12px 14px',borderRadius:8,background:'#f0fdf4',border:'1px solid #bbf7d0',marginBottom:10,fontSize:11}}>
                  <div style={{fontWeight:700,color:'#16a34a',marginBottom:4}}>📊 Google Sheets Direct Import</div>
                  <div style={{color:'#64748b'}}>Paste your Google Sheet URL or Sheet ID. Sheet must be <strong>publicly viewable</strong> (Share → Anyone with link → Viewer).</div>
                </div>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>GOOGLE SHEET URL OR ID</label>
                <input
                  value={csvText}
                  onChange={e=>setCSVText(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/edit"
                  style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1px solid #c7d2fe',fontSize:11,outline:'none',boxSizing:'border-box',marginBottom:8}}/>
                <div style={{fontSize:10,color:'#94a3b8'}}>
                  Example: https://docs.google.com/spreadsheets/d/<strong>SHEET_ID</strong>/edit<br/>
                  First row must be column headers. All data from Sheet1 will be imported.
                </div>
              </div>
            )}

            {/* Paste CSV */}
            {inputMode === 'paste' && (
              <textarea
                value={csvText}
                onChange={e=>setCSVText(e.target.value)}
                placeholder="Paste your CSV data here...&#10;invoice_number,customer_name,amount&#10;INV-001,Infosys Ltd,500000"
                style={{width:'100%',height:180,padding:'10px 12px',borderRadius:8,border:'1px solid #c7d2fe',fontSize:11,fontFamily:'monospace',resize:'vertical',outline:'none',boxSizing:'border-box',marginBottom:12}}/>
            )}

            {/* Manual */}
            {inputMode === 'manual' && (
              <textarea
                value={manualData}
                onChange={e=>setManualData(e.target.value)}
                placeholder="Enter data in CSV format...&#10;invoice_number,customer_name,date,amount&#10;INV-001,TCS Ltd,2024-04-01,250000"
                style={{width:'100%',height:180,padding:'10px 12px',borderRadius:8,border:'1px solid #c7d2fe',fontSize:11,fontFamily:'monospace',resize:'vertical',outline:'none',boxSizing:'border-box',marginBottom:12}}/>
            )}

            {/* Options */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>FORMAT</label>
                <select value={format} onChange={e=>setFormat(e.target.value)} style={{width:'100%',padding:'7px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>
                  <option value="csv">📄 CSV / Text</option>
                  <option value="json">📋 JSON</option>
                  <option value="excel">📊 Excel (.xlsx)</option>
                  <option value="xml">📰 XML</option>
                  <option value="pdf">📕 PDF (AI Extract)</option>
                  <option value="gsheet">📊 Google Sheet URL</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:700,color:'#64748b',display:'block',marginBottom:4}}>DATA TYPE (Auto-detected if blank)</label>
                <select value={forcedType} onChange={e=>setForcedType(e.target.value)} style={{width:'100%',padding:'7px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>
                  <option value="">🤖 Auto-detect (AI)</option>
                  {DATA_TYPES.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
              </div>
            </div>

            <button onClick={doPreview} style={{width:'100%',padding:'10px 0',borderRadius:8,border:'none',background:'#1d4ed8',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>
              🔍 Preview & Validate Data
            </button>
          </div>

          {/* Right: templates + data types */}
          <div>
            <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'14px',marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:'#0f172a',marginBottom:10}}>📥 Download CSV Templates</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {DATA_TYPES.map(t => (
                  <button key={t.id} onClick={()=>downloadTemplate(t.id)}
                    style={{padding:'6px 8px',borderRadius:6,border:`1px solid ${t.color}30`,background:t.color+'08',color:t.color,fontSize:9,fontWeight:600,cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:4}}>
                    <span>{t.icon}</span><span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'14px'}}>
              <div style={{fontSize:11,fontWeight:700,color:'#0f172a',marginBottom:8}}>🔄 What Happens After Import</div>
              {[
                ['Sales Invoices','AR module, customer balances, aging, dashboards, collection alerts'],
                ['Purchase Invoices','AP module, vendor balances, payment calendar, DPO tracking'],
                ['Expenses','Expense register, policy check, approval workflow, cost center reports'],
                ['Inventory','Stock levels, reorder alerts, valuation, working capital dashboard'],
                ['Payroll','Payslips generated, PF/ESI calc, payroll dashboard, cost center split'],
                ['Customers/Vendors','Master data, credit limits, KYC status, performance dashboards'],
              ].map(([type, desc], i) => (
                <div key={i} style={{padding:'5px 0',borderBottom:'1px solid #f8faff',fontSize:10}}>
                  <span style={{fontWeight:700,color:'#334155'}}>{type}:</span>
                  <span style={{color:'#64748b',marginLeft:4}}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 1: PREVIEW ── */}
      {step === 1 && preview && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
            {[
              {l:'Detected Type',v:preview.dataType?.replace(/_/g,' '),color:'#1d4ed8'},
              {l:'Total Rows',v:preview.totalRows,color:'#059669'},
              {l:'Mapped Columns',v:preview.detectedColumns+' / '+preview.headers?.length,color:'#d97706'},
              {l:'Unmapped Columns',v:preview.unmappedColumns?.length||0,color:preview.unmappedColumns?.length?'#dc2626':'#059669'},
            ].map((k,i)=>(
              <div key={i} style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',padding:'10px 14px',borderLeft:`4px solid ${k.color}`}}>
                <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
                <div style={{fontSize:18,fontWeight:800,color:k.color}}>{k.v}</div>
              </div>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            {/* Field Mapping */}
            <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:14}}>
              <div style={{fontSize:11,fontWeight:700,color:'#0f172a',marginBottom:10}}>🗺️ Field Mapping (AI-Generated)</div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:10}}>
                <thead><tr style={{background:'#f8faff'}}>{['Target Field','Source Column','Status'].map(h=><th key={h} style={{padding:'5px 8px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:9,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
                <tbody>
                  {Object.entries(preview.fieldMapping||{}).map(([target, source], i) => (
                    <tr key={i} style={{borderBottom:'1px solid #f8faff'}}>
                      <td style={{padding:'5px 8px',fontWeight:600,color:'#334155'}}>{target.replace(/_/g,' ')}</td>
                      <td style={{padding:'5px 8px',fontFamily:'monospace',color:'#1d4ed8',fontSize:10}}>{source}</td>
                      <td style={{padding:'5px 8px'}}><Badge text="✓ Mapped" color="#16a34a"/></td>
                    </tr>
                  ))}
                  {(preview.unmappedColumns||[]).map((col, i) => (
                    <tr key={'u'+i} style={{borderBottom:'1px solid #f8faff',background:'#fef2f2'}}>
                      <td style={{padding:'5px 8px',color:'#94a3b8'}}>—</td>
                      <td style={{padding:'5px 8px',fontFamily:'monospace',color:'#dc2626',fontSize:10}}>{col}</td>
                      <td style={{padding:'5px 8px'}}><Badge text="Unmapped" color="#dc2626"/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sample Data */}
            <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:14}}>
              <div style={{fontSize:11,fontWeight:700,color:'#0f172a',marginBottom:10}}>👁️ Sample Data (First 5 Rows)</div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:9}}>
                  <thead>
                    <tr style={{background:'#f8faff'}}>
                      {(preview.headers||[]).slice(0,6).map(h=><th key={h} style={{padding:'4px 6px',textAlign:'left',fontWeight:700,color:'#64748b',borderBottom:'1px solid #e2e8f0',whiteSpace:'nowrap'}}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(preview.sampleRows||[]).map((row,i)=>(
                      <tr key={i} style={{borderBottom:'1px solid #f8faff',background:i%2===0?'#fff':'#fafbff'}}>
                        {(preview.headers||[]).slice(0,6).map(h=>{
                          const val = row[h] ?? row[h.replace(/_/g,' ')] ?? Object.values(row)[preview.headers.indexOf(h)] ?? '—';
                          return <td key={h} style={{padding:'4px 6px',color:'#334155',maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{val||'—'}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Validation Messages */}
          {preview.unmappedColumns?.length > 0 && (
            <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:11}}>
              <span style={{fontWeight:700,color:'#d97706'}}>⚠ Unmapped columns will be ignored: </span>
              <span style={{color:'#92400e'}}>{preview.unmappedColumns.join(', ')}</span>
            </div>
          )}

          <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,padding:'10px 14px',marginBottom:14,fontSize:11,color:'#166534'}}>
            <strong>✓ Ready to import {preview.totalRows} {preview.dataType?.replace(/_/g,' ')} records.</strong> All mapped fields will be written to the database and dashboards will update automatically.
          </div>

          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>setStep(0)} style={{padding:'9px 20px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',fontSize:12,cursor:'pointer',color:'#64748b'}}>← Back</button>
            <button onClick={()=>setStep(2)} style={{padding:'9px 24px',borderRadius:8,border:'none',background:'#1d4ed8',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>Confirm & Proceed →</button>
          </div>
        </div>
      )}

      {/* ── STEP 2: IMPORT ── */}
      {step === 2 && (
        <div style={{maxWidth:500,margin:'0 auto',textAlign:'center',background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',padding:40}}>
          <div style={{fontSize:40,marginBottom:12}}>📊</div>
          <div style={{fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:6}}>Ready to Import</div>
          <div style={{fontSize:12,color:'#64748b',marginBottom:20}}>
            Importing <strong>{preview?.totalRows}</strong> rows of <strong>{preview?.dataType?.replace(/_/g,' ')}</strong> data.<br/>
            All related modules, dashboards and reports will update automatically.
          </div>
          <div style={{background:'#f8faff',borderRadius:8,padding:'12px 16px',marginBottom:20,text:'left'}}>
            <div style={{fontSize:11,fontWeight:700,color:'#1d4ed8',marginBottom:8}}>After import, these will update:</div>
            {(['SALES_INVOICES','PURCHASE_INVOICES'].includes(preview?.dataType||'')
              ? ['AR/AP Dashboard','Collections & Dunning','Customer/Vendor Master','Executive Cockpit KPIs','Cash Flow Forecast']
              : preview?.dataType === 'EXPENSES'
              ? ['Expense Workspace','Budget vs Actual','Cost Center Reports','Policy Violation Alerts']
              : preview?.dataType === 'INVENTORY'
              ? ['Inventory Dashboard','Working Capital','Reorder Alerts','Asset Valuation']
              : preview?.dataType === 'PAYROLL'
              ? ['Payroll Dashboard','PF/ESI Reports','Cost Center Split','HR Analytics']
              : ['Master Data','All Related Dashboards','Reports']
            ).map((item,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#334155',padding:'2px 0'}}>
                <span style={{color:'#16a34a'}}>✓</span>{item}
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'center'}}>
            <button onClick={()=>setStep(1)} style={{padding:'10px 20px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',fontSize:12,cursor:'pointer',color:'#64748b'}}>← Back</button>
            <button onClick={doImport} disabled={importing}
              style={{padding:'10px 28px',borderRadius:8,border:'none',background:importing?'#94a3b8':'#16a34a',color:'#fff',fontSize:13,fontWeight:700,cursor:importing?'not-allowed':'pointer'}}>
              {importing ? '⏳ Importing...' : '✅ Start Import'}
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: RESULTS ── */}
      {step === 3 && result && (
        <div>
          {/* Status */}
          <div style={{borderRadius:12,border:`1px solid ${result.error?'#fecaca':'#bbf7d0'}`,background:result.error?'#fef2f2':'#f0fdf4',padding:'16px 20px',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:32}}>{result.error?'❌':'✅'}</span>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:result.error?'#dc2626':'#16a34a'}}>
                  {result.error ? 'Import Failed' : 'Import Successful!'}
                </div>
                <div style={{fontSize:12,color:result.error?'#dc2626':'#166534'}}>
                  {result.message || result.error}
                </div>
              </div>
            </div>
          </div>

          {!result.error && (
            <>
              {/* Stats */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:14}}>
                {[
                  {l:'Data Type Detected',v:result.dataType?.replace(/_/g,' '),color:'#1d4ed8'},
                  {l:'Records Inserted',v:result.inserted||0,color:'#16a34a'},
                  {l:'Records Updated',v:result.updated||0,color:'#d97706'},
                  {l:'Errors',v:result.errors?.length||0,color:result.errors?.length?'#dc2626':'#16a34a'},
                ].map((k,i)=>(
                  <div key={i} style={{background:'#fff',borderRadius:8,border:'1px solid #e2e8f0',padding:'10px 14px',borderLeft:`4px solid ${k.color}`}}>
                    <div style={{fontSize:9,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
                    <div style={{fontSize:22,fontWeight:800,color:k.color}}>{k.v}</div>
                  </div>
                ))}
              </div>

              {/* What was updated */}
              <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:14,marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:'#0f172a',marginBottom:10}}>🔄 Modules Updated</div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                  {[
                    'Finance Dashboard Hub','Executive Cockpit','AR/AP Overview',
                    'Collections & Dunning','Budget vs Actual','Tax Compliance',
                  ].map((m,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 10px',borderRadius:6,background:'#f0fdf4',border:'1px solid #bbf7d0',fontSize:10,color:'#166534'}}>
                      <span>✓</span><span style={{fontWeight:600}}>{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Errors if any */}
              {result.errors?.length > 0 && (
                <div style={{background:'#fff',borderRadius:10,border:'1px solid #fecaca',padding:14,marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:700,color:'#dc2626',marginBottom:8}}>⚠ Row Errors ({result.errors.length})</div>
                  {result.errors.map((e,i)=><div key={i} style={{fontSize:10,color:'#dc2626',padding:'3px 0',borderBottom:'1px solid #fef2f2'}}>{e}</div>)}
                </div>
              )}
            </>
          )}

          <div style={{display:'flex',gap:10}}>
            <button onClick={reset} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#1d4ed8',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}>⬆️ Import More Data</button>
            <button onClick={()=>{loadHistory();setStep('history')}} style={{padding:'9px 20px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',fontSize:12,cursor:'pointer',color:'#64748b'}}>📋 View History</button>
            <a href="/finance-hub" style={{padding:'9px 20px',borderRadius:8,border:'1px solid #1d4ed8',background:'#eff6ff',color:'#1d4ed8',fontSize:12,fontWeight:700,cursor:'pointer',textDecoration:'none'}}>📊 View Dashboards</a>
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {step === 'history' && (
        <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:16}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,color:'#0f172a'}}>Import History</div>
            <button onClick={reset} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#f8faff',fontSize:10,cursor:'pointer'}}>+ New Import</button>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
            <thead><tr style={{background:'#f8faff'}}>{['Date','Type','Records','Status'].map(h=><th key={h} style={{padding:'6px 10px',textAlign:'left',fontWeight:700,color:'#64748b',fontSize:10,borderBottom:'1px solid #e2e8f0'}}>{h}</th>)}</tr></thead>
            <tbody>
              {history.length === 0 ? <tr><td colSpan={4} style={{padding:20,textAlign:'center',color:'#94a3b8'}}>No import history yet</td></tr> :
              history.map((h, i) => (
                <tr key={i} style={{borderBottom:'1px solid #f1f5f9'}}>
                  <td style={{padding:'6px 10px',color:'#64748b'}}>{new Date(h.created_at).toLocaleString('en-IN')}</td>
                  <td style={{padding:'6px 10px',fontWeight:600}}>{h.detail?.split(':')[0]||'—'}</td>
                  <td style={{padding:'6px 10px',color:'#334155'}}>{h.detail?.split(':')[1]||'—'}</td>
                  <td style={{padding:'6px 10px'}}><Badge text={h.status} color={h.status==='success'?'#16a34a':h.status==='partial'?'#d97706':'#dc2626'}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
