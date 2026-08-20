const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/ingestion/DataIngestionPage.jsx';
let c = fs.readFileSync(f, 'utf8');

console.log('File size:', c.length);
console.log('Has gsheet:', c.includes('gsheet'));
console.log('Has activeFormat:', c.includes('activeFormat'));
console.log('doPreview location:', c.indexOf('doPreview'));

// Find doPreview function and add gsheet logic
const old1 = `  const doPreview = async () => {`;
const new1 = `  const getActiveFormat = () => inputMode === 'gsheet' ? 'gsheet' : format;
  const getActiveData = () => inputMode === 'paste' ? csvText : inputMode === 'manual' ? manualData : inputMode === 'gsheet' ? csvText : csvText;

  const doPreview = async () => {`;

c = c.replace(old1, new1);

// Fix doPreview body
c = c.replace(
  `    const data = inputMode === 'paste' ? csvText : inputMode === 'manual' ? manualData : csvText;
    if (!data.trim()) return alert('No data to preview');
    const resp = await api('/api/ingest/preview', 'POST', { data, format, dataType: forcedType || undefined });`,
  `    const data = getActiveData();
    if (!data || !data.trim()) return alert('Please enter or upload data first.');
    const resp = await api('/api/ingest/preview', 'POST', { data, format: getActiveFormat(), dataType: forcedType || undefined });`
);

// Fix doImport body - find first occurrence
c = c.replace(
  `    setImporting(true);
    const data = inputMode === 'paste' ? csvText : inputMode === 'manual' ? manualData : csvText;
    const resp = await api('/api/ingest', 'POST', {
      data, format,`,
  `    setImporting(true);
    const data = getActiveData();
    const resp = await api('/api/ingest', 'POST', {
      data, format: getActiveFormat(),`
);

// Add gsheet to input mode tabs
if (!c.includes("'gsheet'")) {
  c = c.replace(
    `[['file','📁 Upload File'],['paste','📋 Paste CSV'],['manual','✏️ Manual Entry']]`,
    `[['file','📁 Upload File'],['paste','📋 Paste CSV'],['gsheet','📊 Google Sheet'],['manual','✏️ Manual Entry']]`
  );
}

// Add Google Sheet input UI after paste section
if (!c.includes('Google Sheets Direct')) {
  c = c.replace(
    `            {/* File upload */}
            {inputMode === 'file' &&`,
    `            {/* Google Sheet */}
            {inputMode === 'gsheet' && (
              <div style={{marginBottom:12}}>
                <div style={{padding:'10px 12px',borderRadius:8,background:'#f0fdf4',border:'1px solid #bbf7d0',marginBottom:8,fontSize:11}}>
                  <div style={{fontWeight:700,color:'#16a34a',marginBottom:2}}>📊 Google Sheets Direct Import</div>
                  <div style={{color:'#64748b'}}>Paste your Google Sheet URL. Sheet must be <strong>Anyone with link → Viewer</strong>.</div>
                </div>
                <input value={csvText} onChange={e=>setCSVText(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
                  style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1px solid #c7d2fe',fontSize:11,outline:'none',boxSizing:'border-box'}}/>
                <div style={{fontSize:10,color:'#94a3b8',marginTop:4}}>The sheet ID is the long string between /d/ and /edit in the URL</div>
              </div>
            )}

            {/* File upload */}
            {inputMode === 'file' &&`
  );
}

fs.writeFileSync(f, c, 'utf8');
console.log('Done. Size:', fs.statSync(f).size);
console.log('Has gsheet now:', c.includes('gsheet'));
console.log('Has activeFormat now:', c.includes('getActiveFormat'));
