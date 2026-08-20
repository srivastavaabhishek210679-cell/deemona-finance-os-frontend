const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/ingestion/DataIngestionPage.jsx';
let c = fs.readFileSync(f, 'utf8');

// Add Google Sheets URL input mode
c = c.replace(
  `{[['file','📁 Upload File'],['paste','📋 Paste CSV'],['manual','✏️ Manual Entry']].map(([mode,label])=>(`,
  `{[['file','📁 Upload File'],['paste','📋 Paste CSV'],['gsheet','📊 Google Sheet'],['manual','✏️ Manual Entry']].map(([mode,label])=>(`
);

// Add Google Sheet URL input section
c = c.replace(
  `            {/* Paste CSV */}
            {inputMode === 'paste' && (`,
  `            {/* Google Sheet */}
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
            {inputMode === 'paste' && (`
);

// Update doPreview to set format to gsheet when in gsheet mode
c = c.replace(
  `  const doPreview = async () => {
    const data = inputMode === 'paste' ? csvText : inputMode === 'manual' ? manualData : csvText;
    if (!data.trim()) return alert('No data to preview');
    const resp = await api('/api/ingest/preview', 'POST', { data, format, dataType: forcedType || undefined });`,
  `  const doPreview = async () => {
    const data = inputMode === 'paste' ? csvText : inputMode === 'manual' ? manualData : csvText;
    if (!data.trim()) return alert('No data to preview');
    const activeFormat = inputMode === 'gsheet' ? 'gsheet' : format;
    const resp = await api('/api/ingest/preview', 'POST', { data, format: activeFormat, dataType: forcedType || undefined });`
);

// Update doImport similarly
c = c.replace(
  `  const doImport = async () => {
    setImporting(true);
    const data = inputMode === 'paste' ? csvText : inputMode === 'manual' ? manualData : csvText;
    const resp = await api('/api/ingest', 'POST', {
      data, format,`,
  `  const doImport = async () => {
    setImporting(true);
    const data = inputMode === 'paste' ? csvText : inputMode === 'manual' ? manualData : csvText;
    const activeFormat = inputMode === 'gsheet' ? 'gsheet' : format;
    const resp = await api('/api/ingest', 'POST', {
      data, format: activeFormat,`
);

// Add gsheet to format dropdown
c = c.replace(
  `<option value="pdf">📕 PDF (AI Extract)</option>`,
  `<option value="pdf">📕 PDF (AI Extract)</option>
                  <option value="gsheet">📊 Google Sheet URL</option>`
);

fs.writeFileSync(f, c, 'utf8');
console.log('Frontend Google Sheets patched. Size:', fs.statSync(f).size);
