const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/monitor/DriveMonitorPage.jsx';
let c = fs.readFileSync(f, 'utf8');

// The bug: load() calls setSettings() every 30 seconds, overwriting user input
// Fix: only set settings on initial load, not on polling

// Replace the load function to separate initial load from polling
c = c.replace(
  `  const load = async () => {
    const [s, st, p, l] = await Promise.all([
      get('/api/monitor/settings'),
      get('/api/monitor/status'),
      get('/api/monitor/processed'),
      get('/api/monitor/logs'),
    ]);
    if (s.settings) {
      setSettings({
        folder_id: s.settings.folder_id || '',
        folder_name: s.settings.folder_name || '',
        google_api_key: s.settings.google_api_key || '',
        recipients: (s.settings.recipients || []).join(', '),
        check_interval_seconds: s.settings.check_interval_seconds || 60,
        file_types: s.settings.file_types || ['monthly','weekly','daily'],
        enabled: s.settings.enabled || false,
      });
    }
    setStatus(st);
    setProcessed(p.files || []);
    setLogs(l.logs || []);
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);`,

  `  const loadSettings = async () => {
    const s = await get('/api/monitor/settings');
    if (s.settings) {
      setSettings({
        folder_id: s.settings.folder_id || '',
        folder_name: s.settings.folder_name || '',
        google_api_key: s.settings.google_api_key || '',
        recipients: (s.settings.recipients || []).join(', '),
        check_interval_seconds: s.settings.check_interval_seconds || 60,
        file_types: s.settings.file_types || ['monthly','weekly','daily'],
        enabled: s.settings.enabled || false,
      });
    }
  };

  const loadStatus = async () => {
    const [st, p, l] = await Promise.all([
      get('/api/monitor/status'),
      get('/api/monitor/processed'),
      get('/api/monitor/logs'),
    ]);
    setStatus(st);
    setProcessed(p.files || []);
    setLogs(l.logs || []);
  };

  const load = async () => { await loadSettings(); await loadStatus(); };

  useEffect(() => {
    load(); // Initial load - sets both settings and status
    const t = setInterval(loadStatus, 30000); // Poll only status/logs - never resets form fields
    return () => clearInterval(t);
  }, []);`
);

fs.writeFileSync(f, c, 'utf8');
console.log('Fixed. Has loadSettings:', c.includes('loadSettings'));
console.log('Has loadStatus:', c.includes('loadStatus'));
