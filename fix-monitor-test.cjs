const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/monitor/DriveMonitorPage.jsx';
let c = fs.readFileSync(f, 'utf8');

// Fix test function to use form fields directly instead of saved settings
c = c.replace(
  `  const test = async () => {
    setTesting(true); setTestResult(null);
    const res = await post('/api/monitor/test', {});
    setTestResult(res);
    setTesting(false);
  };`,

  `  const test = async () => {
    if (!settings.folder_id || !settings.google_api_key || settings.google_api_key.includes('•')) {
      setTestResult({ error: 'Please enter Folder ID and API Key first' });
      return;
    }
    setTesting(true); setTestResult(null);
    // Test directly from browser using form fields
    try {
      const query = encodeURIComponent("'" + settings.folder_id + "' in parents and trashed=false");
      const fields = encodeURIComponent('files(id,name,mimeType)');
      const url = "https://www.googleapis.com/drive/v3/files?q=" + query + "&fields=" + fields + "&pageSize=10&key=" + settings.google_api_key;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setTestResult({ error: data?.error?.message || 'Drive API error: ' + res.status });
      } else {
        setTestResult({ success: true, files_found: data.files?.length || 0, files: data.files || [] });
      }
    } catch(e) {
      setTestResult({ error: String(e) });
    }
    setTesting(false);
  };`
);

fs.writeFileSync(f, c, 'utf8');
console.log('Fixed test function. Uses form fields directly.');
