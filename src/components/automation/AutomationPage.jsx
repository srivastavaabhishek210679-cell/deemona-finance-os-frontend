import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { const r = await fetch(apiURL(url), { headers: h() }); return r.json(); };
const post = async (url, body) => { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); return r.json(); };
const del  = async url => { const r = await fetch(apiURL(url), { method: 'DELETE', headers: h() }); return r.json(); };

const STEP_COLORS = { ai_read:'#6C63FF', validate:'#22C98A', check:'#4FC3F7', notify:'#F5A623', approve:'#FF9800', pay:'#22C98A', post:'#9C27B0', schedule:'#2196F3', alert:'#FF5C5C' };
const STEP_ICONS  = { ai_read:'🤖', validate:'✓', check:'🔍', notify:'📧', approve:'👤', pay:'💳', post:'📒', schedule:'⏰', alert:'⚠️' };

function StepBadge({ type }) {
  return <span style={{ padding:'2px 8px', borderRadius:100, fontSize:10, fontWeight:700, background:(STEP_COLORS[type]||'#6C63FF')+'20', color:STEP_COLORS[type]||'#6C63FF' }}>{STEP_ICONS[type]||'•'} {type}</span>;
}

function WorkflowCard({ wf, onRun, onDelete, running }) {
  const steps = typeof wf.steps === 'string' ? JSON.parse(wf.steps) : (wf.steps || []);
  return (
    <div style={{ borderRadius:12, border:'1px solid var(--border)', padding:20, background:'var(--surface-2)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:700, marginBottom:3 }}>{wf.name}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{wf.description}</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <span style={{ padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:600, background: wf.is_active ? '#22C98A20' : 'var(--surface-3)', color: wf.is_active ? '#22C98A' : 'var(--text-muted)' }}>{wf.is_active ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      {/* Trigger */}
      <div style={{ marginBottom:12 }}>
        <span style={{ fontSize:11, color:'var(--text-muted)' }}>TRIGGER: </span>
        <span style={{ fontSize:11, fontWeight:700, color:'#F5A623' }}>{wf.trigger_type || wf.trigger}</span>
        {wf.run_count > 0 && <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:10 }}>· Ran {wf.run_count} times</span>}
      </div>

      {/* Steps flow */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:16 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <StepBadge type={s.type} />
            {i < steps.length-1 && <span style={{ color:'var(--text-muted)', fontSize:12 }}>→</span>}
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => onRun(wf.id)} disabled={running === wf.id} style={{ flex:1, padding:'8px', borderRadius:8, fontSize:13, fontWeight:700, background: running===wf.id ? 'var(--surface-3)' : 'linear-gradient(135deg,#6C63FF,#9B8FFF)', color: running===wf.id ? 'var(--text-muted)' : '#fff', border:'none', cursor: running===wf.id ? 'not-allowed':'pointer' }}>
          {running===wf.id ? '⏳ Running...' : '▶ Run Now'}
        </button>
        <button onClick={() => onDelete(wf.id)} style={{ padding:'8px 14px', borderRadius:8, fontSize:13, background:'var(--surface-3)', border:'1px solid var(--border)', color:'#FF5C5C', cursor:'pointer' }}>Delete</button>
      </div>
    </div>
  );
}

export default function AutomationPage() {
  const [tab, setTab] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    get('/api/automation/templates').then(d => setTemplates(d.templates || []));
    get('/api/automation/workflows').then(d => setWorkflows(d.workflows || []));
    get('/api/automation/logs').then(d => setLogs(d.logs || []));
  }, []);

  const installTemplate = async (t) => {
    setSaving(true);
    const data = await post('/api/automation/workflows', { name: t.name, description: t.description, trigger: t.trigger, steps: t.steps });
    if (data.workflow) { setWorkflows(prev => [data.workflow, ...prev]); setTab('workflows'); }
    setSaving(false);
  };

  const runWorkflow = async (id) => {
    setRunning(id); setRunResult(null);
    const data = await post(`/api/automation/workflows/${id}/run`, {});
    setRunResult(data);
    setRunning(null);
  };

  const deleteWorkflow = async (id) => {
    await del(`/api/automation/workflows/${id}`);
    setWorkflows(prev => prev.filter(w => w.id !== id));
  };

  const generateWorkflow = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true); setGenerated(null);
    const data = await post('/api/automation/generate', { description: aiPrompt });
    setGenerated(data.workflow);
    setGenerating(false);
  };

  const saveGenerated = async () => {
    if (!generated) return;
    setSaving(true);
    const data = await post('/api/automation/workflows', generated);
    if (data.workflow) { setWorkflows(prev => [data.workflow, ...prev]); setSaved(true); setTimeout(() => { setSaved(false); setTab('workflows'); }, 1500); }
    setSaving(false);
  };

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, margin:0, marginBottom:6 }}>Automation Studio</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', margin:0 }}>Build AI-powered finance workflows that run automatically</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['templates','📋 Templates'],['ai','✨ AI Generate'],['workflows','⚡ My Workflows'],['logs','📊 Run Logs']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ padding:'10px 20px', fontSize:14, fontWeight:600, background:'none', border:'none', cursor:'pointer', borderBottom: tab===id ? '2px solid #6C63FF' : '2px solid transparent', color: tab===id ? '#6C63FF' : 'var(--text-secondary)', marginBottom:-1 }}>{label}</button>
        ))}
      </div>

      {/* Templates */}
      {tab === 'templates' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:16 }}>
          {templates.map(t => (
            <div key={t.id} style={{ borderRadius:12, border:'1px solid var(--border)', padding:20, background:'var(--surface-2)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:3 }}>{t.name}</div>
                  <span style={{ padding:'2px 8px', borderRadius:100, fontSize:11, fontWeight:600, background:'#6C63FF20', color:'#6C63FF' }}>{t.category}</span>
                </div>
                <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>{t.steps.length} steps</span>
              </div>
              <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:14, lineHeight:1.5 }}>{t.description}</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:14 }}>
                {t.steps.slice(0,5).map((s,i) => <StepBadge key={i} type={s.type} />)}
                {t.steps.length > 5 && <span style={{ fontSize:11, color:'var(--text-muted)' }}>+{t.steps.length-5} more</span>}
              </div>
              <button onClick={() => installTemplate(t)} disabled={saving} style={{ width:'100%', padding:'8px', borderRadius:8, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#6C63FF,#9B8FFF)', color:'#fff', border:'none', cursor:'pointer' }}>
                + Install Workflow
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AI Generate */}
      {tab === 'ai' && (
        <div style={{ maxWidth:700 }}>
          <div style={{ borderRadius:12, border:'1px solid var(--border)', padding:24, background:'var(--surface-2)', marginBottom:20 }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>Describe your workflow in plain English</div>
            <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>AI will generate a complete workflow with steps, triggers, and configuration</p>
            <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g. When a vendor invoice arrives, read it with AI, check if there's a matching PO, verify GST, route for approval above Rs 1 lakh, then schedule payment and send WhatsApp to vendor..." rows={5}
              style={{ width:'100%', boxSizing:'border-box', padding:'12px 16px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface-1)', color:'var(--text-primary)', fontSize:14, resize:'vertical', outline:'none', fontFamily:'inherit' }} />
            <button onClick={generateWorkflow} disabled={!aiPrompt.trim()||generating} style={{ marginTop:12, padding:'11px 24px', borderRadius:10, fontSize:14, fontWeight:700, background: (!aiPrompt.trim()||generating) ? 'var(--surface-3)' : 'linear-gradient(135deg,#6C63FF,#9B8FFF)', color: (!aiPrompt.trim()||generating) ? 'var(--text-muted)' : '#fff', border:'none', cursor: (!aiPrompt.trim()||generating) ? 'not-allowed':'pointer' }}>
              {generating ? '✨ Generating...' : '✨ Generate Workflow'}
            </button>
          </div>

          {generated && (
            <div style={{ borderRadius:12, border:'1px solid #6C63FF40', padding:24, background:'#6C63FF08' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
                <div><div style={{ fontSize:16, fontWeight:700 }}>{generated.name}</div><div style={{ fontSize:13, color:'var(--text-muted)' }}>{generated.description}</div></div>
                <span style={{ padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:700, background:'#F5A62320', color:'#F5A623' }}>TRIGGER: {generated.trigger}</span>
              </div>
              <div style={{ marginBottom:16 }}>
                {generated.steps?.map((s, i) => (
                  <div key={i} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'#6C63FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>{i+1}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{s.name} <StepBadge type={s.type} /></div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={saveGenerated} disabled={saving||saved} style={{ padding:'10px 24px', borderRadius:10, fontSize:14, fontWeight:700, background: saved ? '#22C98A' : 'linear-gradient(135deg,#6C63FF,#9B8FFF)', color:'#fff', border:'none', cursor:'pointer' }}>
                {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Workflow'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* My Workflows */}
      {tab === 'workflows' && (
        <div>
          {workflows.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>⚡</div>
              <div style={{ fontSize:16, fontWeight:600, marginBottom:8 }}>No workflows yet</div>
              <div style={{ fontSize:13 }}>Install a template or generate one with AI</div>
            </div>
          ) : (
            <div>
              {runResult && (
                <div style={{ marginBottom:20, padding:16, borderRadius:12, background:'#22C98A12', border:'1px solid #22C98A30' }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#22C98A', marginBottom:8 }}>✓ Workflow completed — {runResult.steps_run} steps executed</div>
                  {runResult.results?.map((r, i) => (
                    <div key={i} style={{ fontSize:12, color:'var(--text-secondary)', padding:'3px 0' }}>Step {r.step}: {r.name} — {r.output} ({r.duration_ms}ms)</div>
                  ))}
                </div>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:16 }}>
                {workflows.map(wf => <WorkflowCard key={wf.id} wf={wf} onRun={runWorkflow} onDelete={deleteWorkflow} running={running} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logs */}
      {tab === 'logs' && (
        <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
          <div style={{ padding:'14px 16px', background:'var(--surface-3)', fontSize:13, fontWeight:700, color:'var(--text-muted)' }}>AUTOMATION RUN HISTORY</div>
          {logs.map((log, i) => (
            <div key={i} style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:2 }}>{log.workflow_name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>Triggered by {log.triggered_by} · {log.steps_completed} steps</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <span style={{ padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:700, background: log.status==='completed' ? '#22C98A20' : log.status==='pending_approval' ? '#F5A62320' : '#FF5C5C20', color: log.status==='completed' ? '#22C98A' : log.status==='pending_approval' ? '#F5A623' : '#FF5C5C' }}>{log.status}</span>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{new Date(log.created_at).toLocaleString('en-IN')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
