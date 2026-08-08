import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { const r = await fetch(apiURL(url), { headers: h() }); return r.json(); };
const post = async (url, body) => { const r = await fetch(apiURL(url), { method:'POST', headers:h(), body:JSON.stringify(body) }); return r.json(); };

const CAT_COLORS = { Tax:'#FF9800', Payroll:'#6C63FF', Treasury:'#22C98A', 'Accounts Receivable':'#4FC3F7', Compliance:'#FF5C5C', 'Accounts Payable':'#F5A623', Budgeting:'#9C27B0', Analytics:'#2196F3', Custom:'#607D8B' };

function cronLabel(cron) {
  const MAP = { '0 9 18 * *':'Monthly — 18th at 9 AM', '0 9 5 * *':'Monthly — 5th at 9 AM', '0 9 25 * *':'Monthly — 25th at 9 AM', '0 8 * * *':'Daily at 8 AM', '0 9 * * 1':'Weekly — Monday 9 AM', '0 9 12 * *':'Monthly — 12th at 9 AM', '0 9 1 * *':'Monthly — 1st at 9 AM', '0 6 * * *':'Daily at 6 AM' };
  return MAP[cron] || cron;
}

export default function SchedulerPage() {
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [toggling, setToggling] = useState(null);
  const [running, setRunning] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [newJob, setNewJob] = useState({ name:'', description:'', schedule:'0 9 * * *', category:'Custom' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(()=>{
    get('/api/scheduler/jobs').then(d=>setJobs(d.system_jobs||[]));
    get('/api/scheduler/logs').then(d=>setLogs(d.logs||[]));
  },[]);

  const toggle = async (job) => {
    setToggling(job.id);
    await post(`/api/scheduler/jobs/${job.id}/toggle`, { enabled: !job.enabled });
    setJobs(prev=>prev.map(j=>j.id===job.id?{...j,enabled:!j.enabled}:j));
    setToggling(null);
  };

  const runNow = async (job) => {
    setRunning(job.id); setRunResult(null);
    const d = await post(`/api/scheduler/jobs/${job.id}/run-now`, {});
    setRunResult(d); setRunning(null);
  };

  const saveJob = async () => {
    if (!newJob.name||!newJob.schedule) return;
    setSaving(true);
    await post('/api/scheduler/jobs', newJob);
    setSaved(true); setTimeout(()=>setSaved(false),2000);
    setSaving(false);
  };

  const enabledCount = jobs.filter(j=>j.enabled).length;

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, margin:0, marginBottom:6 }}>Scheduled Jobs</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', margin:0 }}>Automate recurring finance tasks — GST reminders, payroll triggers, cash alerts, compliance scans</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        <div style={{ padding:'14px 16px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:24, fontWeight:800, color:'#22C98A' }}>{enabledCount}</div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>Active Jobs</div>
        </div>
        <div style={{ padding:'14px 16px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:24, fontWeight:800, color:'#6C63FF' }}>{jobs.length}</div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>Total Jobs</div>
        </div>
        <div style={{ padding:'14px 16px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
          <div style={{ fontSize:24, fontWeight:800, color:'#F5A623' }}>{logs.filter(l=>l.status==='success').length}</div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>Successful Runs</div>
        </div>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['jobs','⚡ All Jobs'],['logs','📋 Run Logs'],['custom','+ Custom Job']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'10px 20px', fontSize:14, fontWeight:600, background:'none', border:'none', cursor:'pointer', borderBottom:tab===id?'2px solid #6C63FF':'2px solid transparent', color:tab===id?'#6C63FF':'var(--text-secondary)', marginBottom:-1 }}>{label}</button>
        ))}
      </div>

      {tab==='jobs' && (
        <div>
          {runResult && <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:10, background:'#22C98A12', border:'1px solid #22C98A30', fontSize:13, color:'#22C98A' }}>
            Job ran: {runResult.output} ({runResult.duration_ms}ms)
          </div>}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:14 }}>
            {jobs.map(job=>(
              <div key={job.id} style={{ borderRadius:12, border:`1px solid ${job.enabled?'#6C63FF40':'var(--border)'}`, padding:16, background:job.enabled?'#6C63FF06':'var(--surface-2)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>{job.name}</div>
                    <span style={{ padding:'2px 8px', borderRadius:100, fontSize:10, fontWeight:700, background:(CAT_COLORS[job.category]||'#6C63FF')+'20', color:CAT_COLORS[job.category]||'#6C63FF' }}>{job.category}</span>
                  </div>
                  <button onClick={()=>toggle(job)} disabled={toggling===job.id} style={{ width:44, height:24, borderRadius:12, background:job.enabled?'#6C63FF':'var(--surface-3)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:job.enabled?23:3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }}/>
                  </button>
                </div>
                <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:8, lineHeight:1.4 }}>{job.description}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:12 }}>🕒 {cronLabel(job.schedule)}</div>
                <button onClick={()=>runNow(job)} disabled={running===job.id} style={{ width:'100%', padding:'7px', borderRadius:7, fontSize:12, fontWeight:700, background:running===job.id?'var(--surface-3)':'var(--surface-1)', color:running===job.id?'var(--text-muted)':'var(--text-primary)', border:'1px solid var(--border)', cursor:running===job.id?'not-allowed':'pointer' }}>
                  {running===job.id?'Running...':'▶ Run Now'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='logs' && (
        <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', background:'var(--surface-3)', fontSize:13, fontWeight:700, color:'var(--text-muted)' }}>JOB RUN HISTORY</div>
          {logs.map((log,i)=>(
            <div key={i} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600 }}>{log.job_name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{log.note||`Duration: ${log.duration_ms}ms`}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <span style={{ padding:'2px 8px', borderRadius:100, fontSize:11, fontWeight:700, background:log.status==='success'?'#22C98A20':log.status==='skipped'?'#F5A62320':'#FF5C5C20', color:log.status==='success'?'#22C98A':log.status==='skipped'?'#F5A623':'#FF5C5C' }}>{log.status}</span>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{new Date(log.ran_at).toLocaleString('en-IN')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='custom' && (
        <div style={{ maxWidth:500 }}>
          <div style={{ borderRadius:12, border:'1px solid var(--border)', padding:20, background:'var(--surface-2)' }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Create Custom Job</div>
            {[['name','Job Name','e.g. Weekly Expense Report'],['description','Description','What this job does'],['schedule','Cron Schedule','e.g. 0 9 * * 1 (Monday 9 AM)'],['category','Category','Tax / Payroll / Custom']].map(([k,label,ph])=>(
              <div key={k} style={{ marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>{label}</div>
                <input value={newJob[k]} onChange={e=>setNewJob(p=>({...p,[k]:e.target.value}))} placeholder={ph} style={{ width:'100%', boxSizing:'border-box', padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-1)', color:'var(--text-primary)', fontSize:13 }} />
              </div>
            ))}
            <div style={{ marginBottom:16, padding:'10px 14px', borderRadius:8, background:'var(--surface-1)', border:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)' }}>
              Cron format: minute hour day month weekday{'\n'}
              Examples: 0 9 * * * (daily 9 AM) · 0 9 1 * * (1st of month) · 0 9 * * 1 (Mondays)
            </div>
            <button onClick={saveJob} disabled={!newJob.name||saving||saved} style={{ width:'100%', padding:'11px', borderRadius:10, fontSize:14, fontWeight:700, background:saved?'#22C98A':(!newJob.name||saving)?'var(--surface-3)':'linear-gradient(135deg,#6C63FF,#9B8FFF)', color:(!newJob.name||saving)?'var(--text-muted)':'#fff', border:'none', cursor:(!newJob.name||saving)?'not-allowed':'pointer' }}>
              {saved?'✓ Saved!':saving?'Saving...':'Create Job'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
