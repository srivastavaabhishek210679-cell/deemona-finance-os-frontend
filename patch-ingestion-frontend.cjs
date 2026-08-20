const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/ingestion/DataIngestionPage.jsx';
let c = fs.readFileSync(f, 'utf8');

// Fix 1: Update handleFile to detect format and use base64 for binary files
c = c.replace(
  `const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setInputMode('file');
    const reader = new FileReader();
    reader.onload = e => {
      setCSVText(e.target.result);
      console.log('File loaded:', f.name, e.target.result?.substring(0,100));
    };
    reader.readAsText(f);
  };`,
  `const handleFile = (f) => {
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
  };`
);

// Fix 2: Update file input to accept all formats
c = c.replace(
  'accept=".csv,.txt,.json"',
  'accept=".csv,.txt,.json,.xlsx,.xls,.xml,.pdf"'
);

// Fix 3: Update format selector to show all formats
c = c.replace(
  `<select value={format} onChange={e=>setFormat(e.target.value)} style={{width:'100%',padding:'7px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>
                  <option value="csv">CSV / Text</option>
                  <option value="json">JSON</option>
                </select>`,
  `<select value={format} onChange={e=>setFormat(e.target.value)} style={{width:'100%',padding:'7px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:11,outline:'none'}}>
                  <option value="csv">📄 CSV / Text</option>
                  <option value="json">📋 JSON</option>
                  <option value="excel">📊 Excel (.xlsx)</option>
                  <option value="xml">📰 XML</option>
                  <option value="pdf">📕 PDF (AI Extract)</option>
                </select>`
);

// Fix 4: Update drop zone description
c = c.replace(
  '<div style={{fontSize:11,color:\'#94a3b8\'}}>Supports CSV, TXT, JSON · Click to browse</div>',
  '<div style={{fontSize:11,color:\'#94a3b8\'}}>Supports CSV, Excel, PDF, XML, JSON · Click to browse</div>'
);

// Fix 5: Show format badge on uploaded file
c = c.replace(
  `<div style={{fontSize:11,color:'#64748b'}}>{(file.size/1024).toFixed(1)} KB · {file.type||'text/csv'}</div>`,
  `<div style={{fontSize:11,color:'#64748b'}}>{(file.size/1024).toFixed(1)} KB · {format.toUpperCase()}</div>
                  <div style={{fontSize:10,color:'#16a34a',marginTop:2}}>✓ Format auto-detected</div>`
);

fs.writeFileSync(f, c, 'utf8');
console.log('Frontend patched. Size:', fs.statSync(f).size);
