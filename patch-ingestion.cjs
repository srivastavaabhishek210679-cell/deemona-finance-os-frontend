const fs = require('fs');
const path = 'C:/deemona-finance-os/frontend/src/components/ingestion/DataIngestionPage.jsx';
let c = fs.readFileSync(path, 'utf8');

// Fix 1: File input click - wrap in setTimeout to ensure ref is ready
c = c.replace(
  "onClick={()=>fileRef.current?.click()}",
  "onClick={()=>{ setTimeout(()=>fileRef.current && fileRef.current.click(), 0); }}"
);

// Fix 2: Preview sample rows - use Object.values to show data regardless of key format
c = c.replace(
  `{(preview.headers||[]).slice(0,6).map(h=><td key={h} style={{padding:'4px 6px',color:'#334155',maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row[h]||'—'}</td>)}`,
  `{(preview.headers||[]).slice(0,6).map(h=>{
                          const val = row[h] ?? row[h.replace(/_/g,' ')] ?? Object.values(row)[preview.headers.indexOf(h)] ?? '—';
                          return <td key={h} style={{padding:'4px 6px',color:'#334155',maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{val||'—'}</td>;
                        })}`
);

// Fix 3: Also ensure paste mode sends the right text
c = c.replace(
  "const data = inputMode === 'paste' ? csvText : inputMode === 'manual' ? manualData : csvText;",
  "const data = inputMode === 'paste' ? csvText : inputMode === 'manual' ? manualData : csvText;\n    if (!data || !data.trim()) return alert('Please enter or upload data first.');"
);

// Fix 4: File upload - also update state when file content loaded
c = c.replace(
  "const handleFile = (f) => {\n    setFile(f);\n    const reader = new FileReader();\n    reader.onload = e => setCSVText(e.target.result);\n    reader.readAsText(f);\n  };",
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
  };`
);

fs.writeFileSync(path, c, 'utf8');
console.log('Patched successfully');
console.log('File size:', fs.statSync(path).size, 'bytes');
