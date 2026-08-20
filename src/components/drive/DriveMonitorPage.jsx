import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); return await r.json(); } catch { return {}; } };
const del = async url => { try { const r = await fetch(apiURL(url), { method: 'DELETE', headers: h() }); return await r.json(); } catch { return {}; } };

export default function DriveMonitorPage() {
  const [status, setStatus] = useState(null);
  const [processed, setProcessed] = useState([]);
  const [errors, setErrors] = useState([]);
  const [activeTab, setActiveTab] = useState('status');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const [s, p, e] = await Promise.all([
      get('/api/monitor/status'),
      get('/api/monitor/processed'),
      get('/api/monitor/errors'),
    ]);
    setStatus(s);
    setProcessed(p.files || []);
    setErrors(e.errors || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  const reprocess = async (id) => {
    await del(`/api/monitor/processed/${id}`);
    load();
  };

  const FILE_TYPE_COLORS = { monthly: '#1B4FD8', weekly: '#059669', daily: '#D97706' };

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628', marginBottom: 4 }}>Drive Monitor</h1>
          <div style={{ fontSize: 13, color: '#64748B' }}>Autonomous Google Drive financial file monitoring and report generation.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ padding: '8px 14px', borderRadius: 8, background: status?.active ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${status?.active ? '#A7F3D0' : '#FECACA'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: status?.active ? '#059669' : '#DC2626', animation: status?.active ? 'pulse 2s infinite' : 'none' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: status?.active ? '#059669' : '#DC2626' }}>
              {status?.active ? 'Monitor Active' : 'Monitor Inactive'}
            </span>
          </div>
          <button onClick={load} disabled={refreshing} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #C7D9F8', background: '#F0F5FF', color: '#1B4FD8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {refreshing ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Files Processed', value: status?.files_processed || 0, color: '#1B4FD8', icon: '📁' },
          { label: 'Errors Logged', value: status?.error_count || 0, color: status?.error_count > 0 ? '#DC2626' : '#059669', icon: '⚠️' },
          { label: 'Check Interval', value: `${status?.sleep_seconds || 60}s`, color: '#7C3AED', icon: '⏱' },
          { label: 'Recipients', value: status?.recipients?.length || 0, color: '#059669', icon: '📧' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 10, background: '#fff', border: '1px solid #C7D9F8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{s.label}</div>
              <span>{s.icon}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Config banner */}
      {!status?.active && (
        <div style={{ padding: '16px 20px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A', marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#D97706', marginBottom: 8 }}>Monitor Not Active</div>
          <div style={{ fontSize: 13, color: '#92400E', marginBottom: 12 }}>Add these environment variables to your Render backend service to activate:</div>
          <div style={{ background: '#0A1628', borderRadius: 8, padding: '12px 16px', fontFamily: 'monospace', fontSize: 12 }}>
            {[
              ['DRIVE_FOLDER_ID', 'your-google-drive-folder-id'],
              ['MONITOR_RECIPIENTS', 'srivastava.abhishek210679@gmail.com'],
              ['MONITOR_SLEEP_SECONDS', '60'],
              ['GOOGLE_DRIVE_API_KEY', 'your-google-api-key'],
            ].map(([key, val]) => (
              <div key={key} style={{ marginBottom: 4 }}>
                <span style={{ color: '#60A5FA' }}>{key}</span>
                <span style={{ color: '#94A3B8' }}>=</span>
                <span style={{ color: '#4ADE80' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 14 }}>How the Autonomous Monitor Works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {[
            { step: '1', icon: '📂', title: 'Scan Drive', desc: 'Checks Google Drive folder every 60 seconds' },
            { step: '2', icon: '🔍', title: 'Detect Files', desc: 'Identifies monthly/weekly/daily financial files' },
            { step: '3', icon: '🤖', title: 'AI Analysis', desc: 'Claude analyzes and compares with prior reports' },
            { step: '4', icon: '📊', title: 'Generate Report', desc: 'Creates executive FOS&A report' },
            { step: '5', icon: '📧', title: 'Send Email', desc: 'Dispatches report to recipients immediately' },
          ].map(s => (
            <div key={s.step} style={{ padding: '14px', borderRadius: 10, background: '#F0F5FF', border: '1px solid #C7D9F8', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1B4FD8', marginBottom: 4 }}>Step {s.step}: {s.title}</div>
              <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #C7D9F8', marginBottom: 20 }}>
        {[['status','⚙️ Configuration'],['processed','📁 Processed Files'],['errors','⚠️ Error Log']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', borderBottom: activeTab===id?'2px solid #1B4FD8':'2px solid transparent', color: activeTab===id?'#1B4FD8':'#64748B', cursor: 'pointer', marginBottom: -1 }}>{label}</button>
        ))}
      </div>

      {/* Status tab */}
      {activeTab === 'status' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 14 }}>Monitor Configuration</div>
            {[
              { label: 'Folder ID', value: status?.folder_id || 'Not set' },
              { label: 'Status', value: status?.active ? 'Active' : 'Inactive' },
              { label: 'Check Interval', value: `Every ${status?.sleep_seconds || 60} seconds` },
              { label: 'Recipients', value: status?.recipients?.join(', ') || 'None' },
              { label: 'Files Processed', value: String(status?.files_processed || 0) },
              { label: 'Errors Logged', value: String(status?.error_count || 0) },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 5 ? '1px solid #F8FAFC' : 'none' }}>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{f.label}</span>
                <span style={{ fontSize: 12, color: '#0A1628', fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 14 }}>File Detection Patterns</div>
            {[
              { type: 'Monthly', color: '#1B4FD8', patterns: 'monthly, month, mtd, january...december, jan...dec' },
              { type: 'Weekly', color: '#059669', patterns: 'weekly, week, wk, w1...w5' },
              { type: 'Daily', color: '#D97706', patterns: 'daily, day, dtd, monday...sunday, mon...sun' },
            ].map(p => (
              <div key={p.type} style={{ marginBottom: 14, padding: '12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: p.color, marginBottom: 4 }}>{p.type} Files</div>
                <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>{p.patterns}</div>
              </div>
            ))}
            <div style={{ padding: '10px 12px', borderRadius: 8, background: '#EEF3FD', border: '1px solid #C7D9F8', fontSize: 11, color: '#1B4FD8' }}>
              Supported formats: .xlsx, .xls, .csv, .pdf, .xlsm
            </div>
          </div>
        </div>
      )}

      {/* Processed files tab */}
      {activeTab === 'processed' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', fontSize: 13, fontWeight: 700, color: '#0A1628' }}>
            Processed Files ({processed.length})
          </div>
          {processed.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              No files processed yet. Monitor will detect and process files automatically.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead><tr style={{ background: '#F0F5FF' }}>
                {['File Name','Type','Processed At','Report Sent To','Action'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[...processed].reverse().map((file, i) => (
                  <tr key={file.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', color: '#0A1628', fontWeight: 500 }}>{file.name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: (FILE_TYPE_COLORS[file.type]||'#64748B') + '15', color: FILE_TYPE_COLORS[file.type] || '#64748B' }}>
                        {file.type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748B' }}>{file.processedAt ? new Date(file.processedAt).toLocaleString('en-IN') : '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#64748B', fontSize: 11 }}>{file.reportSentTo?.join(', ')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => reprocess(file.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #C7D9F8', background: '#F0F5FF', color: '#1B4FD8', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                        Re-process
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Errors tab */}
      {activeTab === 'errors' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', fontSize: 13, fontWeight: 700, color: '#0A1628' }}>
            Error Log ({errors.length} entries)
          </div>
          {errors.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#059669', fontSize: 13 }}>
              No errors logged. Monitor is running cleanly.
            </div>
          ) : (
            <div style={{ padding: 16, maxHeight: 500, overflowY: 'auto' }}>
              {[...errors].reverse().map((line, i) => (
                <div key={i} style={{ padding: '8px 12px', borderRadius: 6, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 8, fontFamily: 'monospace', fontSize: 11, color: '#991B1B' }}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
