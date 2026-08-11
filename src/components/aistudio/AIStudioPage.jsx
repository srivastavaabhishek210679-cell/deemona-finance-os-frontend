import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { const r = await fetch(apiURL(url), { headers: h() }); return r.json(); };
const post = async (url, body) => { const r = await fetch(apiURL(url), { method:'POST', headers:h(), body:JSON.stringify(body) }); return r.json(); };

const INDUSTRY_ICONS = { Technology:'💻', Manufacturing:'🏭', 'Consulting/Services':'📋', Retail:'🛒', 'Real Estate':'🏢', Healthcare:'🏥' };

export default function AIStudioPage() {
  const [tab, setTab] = useState('templates');
  const [templates, setTemplates] = useState([]);
  const [applying, setApplying] = useState(null);
  const [applied, setApplied] = useState(null);
  const [instructions, setInstructions] = useState('');
  const [training, setTraining] = useState(false);
  const [trained, setTrained] = useState(false);
  const [testPrompt, setTestPrompt] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(()=>{
    get('/api/ai-studio/templates').then(d=>setTemplates(d.templates||[]));
    get('/api/ai-studio/config').then(d=>{ if(d.config) { setConfig(d.config); setInstructions(d.config.system_instructions||''); }});
  },[]);

  const applyTemplate = async (t) => {
    setApplying(t.id);
    const d = await post('/api/ai-studio/apply-template', { template_id: t.id });
    setApplied(d); setApplying(null);
  };

  const saveInstructions = async () => {
    setTraining(true);
    await post('/api/ai-studio/train', { instructions });
    setTrained(true); setTimeout(()=>setTrained(false), 2000); setTraining(false);
  };

  const testModel = async () => {
    if (!testPrompt.trim()) return;
    setTesting(true); setTestOutput('');
    const d = await post('/api/ai-studio/test', { prompt: testPrompt, system_instructions: instructions });
    setTestOutput(d.output||''); setTesting(false);
  };

  const STARTER_INSTRUCTIONS = [
    { label:'SaaS Company', text:'You are a financial AI for an Indian SaaS company. Focus on MRR, ARR, CAC, LTV metrics. Always mention GST 18% on software services. Reference RBI guidelines for payments.' },
    { label:'Manufacturing', text:'You are a financial AI for an Indian manufacturing company. Focus on inventory turnover, COGS, working capital cycle. Mention GST applicable rates. Consider factory overhead allocation.' },
    { label:'Startup', text:'You are a financial AI for an Indian startup. Focus on burn rate, runway, unit economics. Mention SEBI regulations for fundraising. Consider ESOP accounting under Ind AS.' },
  ];

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, margin:0, marginBottom:6 }}>AI Studio</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', margin:0 }}>Customize AI behavior for your industry, train with company context, and test custom models</p>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['templates','🏭 Industry Templates'],['train','🧠 Custom Training'],['test','🧪 Test Model']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'10px 20px', fontSize:14, fontWeight:600, background:'none', border:'none', cursor:'pointer', borderBottom:tab===id?'2px solid #6C63FF':'2px solid transparent', color:tab===id?'#1B4FD8':'var(--text-secondary)', marginBottom:-1 }}>{label}</button>
        ))}
      </div>

      {tab==='templates' && (
        <div>
          {applied && (
            <div style={{ marginBottom:20, padding:'14px 16px', borderRadius:10, background:'#22C98A12', border:'1px solid #22C98A30' }}>
              <div style={{ fontSize:14, fontWeight:700, color:'#22C98A' }}>Template applied: {applied.template}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{applied.accounts_added} accounts added · KPIs: {applied.kpis?.join(', ')}</div>
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
            {templates.map(t=>(
              <div key={t.id} style={{ borderRadius:14, border:'1px solid var(--border)', padding:20, background:'var(--surface-2)' }}>
                <div style={{ fontSize:32, marginBottom:10 }}>{INDUSTRY_ICONS[t.industry]||'🏢'}</div>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{t.name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12, lineHeight:1.5 }}>{t.description}</div>

                <div style={{ marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:5, letterSpacing:'0.04em' }}>KEY ACCOUNTS</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {t.accounts?.slice(0,4).map(a=><span key={a} style={{ padding:'2px 8px', borderRadius:100, fontSize:10, background:'var(--surface-3)', color:'var(--text-secondary)' }}>{a}</span>)}
                    {t.accounts?.length>4 && <span style={{ fontSize:10, color:'var(--text-muted)' }}>+{t.accounts.length-4} more</span>}
                  </div>
                </div>

                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:5, letterSpacing:'0.04em' }}>KPIs</div>
                  <div style={{ fontSize:12, color:'var(--text-secondary)' }}>{t.kpis?.slice(0,4).join(' · ')}</div>
                </div>

                <div style={{ marginBottom:14, padding:'8px 10px', borderRadius:7, background:'#6C63FF08', border:'1px solid #6C63FF20', fontSize:11, color:'#3B82F6' }}>
                  GST: {t.gst_rate}% · TDS: {t.tds_section}
                </div>

                <button onClick={()=>applyTemplate(t)} disabled={applying===t.id} style={{ width:'100%', padding:'9px', borderRadius:9, fontSize:13, fontWeight:700, background:applying===t.id?'var(--surface-3)':'linear-gradient(135deg,#1B4FD8,#3B82F6)', color:applying===t.id?'var(--text-muted)':'#fff', border:'none', cursor:applying===t.id?'not-allowed':'pointer' }}>
                  {applying===t.id?'Applying...':'Apply Template'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='train' && (
        <div style={{ maxWidth:700 }}>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>Starter Templates</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
              {STARTER_INSTRUCTIONS.map(s=>(
                <button key={s.label} onClick={()=>setInstructions(s.text)} style={{ padding:'6px 14px', borderRadius:100, fontSize:12, background:'#6C63FF12', color:'#3B82F6', border:'1px solid #6C63FF25', cursor:'pointer' }}>{s.label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:14, fontWeight:700, marginBottom:6 }}>Custom System Instructions</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>These instructions customize how all AI features (CFO Agent, Tax Agent, Audit Agent) behave for your company</div>
            <textarea value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="Describe your company, industry, key metrics to focus on, specific Indian regulations applicable, preferred tone and format..." rows={10} style={{ width:'100%', boxSizing:'border-box', padding:'12px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-primary)', fontSize:13, resize:'vertical', fontFamily:'inherit', lineHeight:1.6 }} />
          </div>

          <button onClick={saveInstructions} disabled={!instructions.trim()||training||trained} style={{ padding:'11px 28px', borderRadius:10, fontSize:14, fontWeight:700, background:trained?'#22C98A':(!instructions.trim()||training)?'var(--surface-3)':'linear-gradient(135deg,#1B4FD8,#3B82F6)', color:(!instructions.trim()||training)?'var(--text-muted)':'#fff', border:'none', cursor:(!instructions.trim()||training)?'not-allowed':'pointer' }}>
            {trained?'✓ Saved!':training?'Saving...':'Save AI Instructions'}
          </button>

          {config && <div style={{ marginTop:12, fontSize:12, color:'var(--text-muted)' }}>Last saved: {new Date(config.updated_at).toLocaleString('en-IN')}</div>}
        </div>
      )}

      {tab==='test' && (
        <div style={{ maxWidth:700 }}>
          <div style={{ marginBottom:14, padding:'12px 16px', borderRadius:10, background:'var(--surface-2)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-secondary)' }}>
            Test your custom AI instructions by sending prompts here. Uses your saved system instructions if available.
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Test Prompt</div>
            <textarea value={testPrompt} onChange={e=>setTestPrompt(e.target.value)} placeholder="Ask a financial question to test your custom AI model..." rows={4} style={{ width:'100%', boxSizing:'border-box', padding:'12px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-primary)', fontSize:13, resize:'vertical', fontFamily:'inherit' }} />
          </div>

          <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
            {['What is our GST liability this month?','Explain working capital to our CFO','What TDS rate applies to our software vendor?','Should we take an overdraft for this month?'].map(q=>(
              <button key={q} onClick={()=>setTestPrompt(q)} style={{ padding:'5px 12px', borderRadius:100, fontSize:11, background:'#6C63FF12', color:'#3B82F6', border:'1px solid #6C63FF25', cursor:'pointer' }}>{q}</button>
            ))}
          </div>

          <button onClick={testModel} disabled={!testPrompt.trim()||testing} style={{ padding:'11px 28px', borderRadius:10, fontSize:14, fontWeight:700, background:(!testPrompt.trim()||testing)?'var(--surface-3)':'linear-gradient(135deg,#1B4FD8,#3B82F6)', color:(!testPrompt.trim()||testing)?'var(--text-muted)':'#fff', border:'none', cursor:(!testPrompt.trim()||testing)?'not-allowed':'pointer' }}>
            {testing?'🧪 Testing...':'🧪 Test Model'}
          </button>

          {testOutput && (
            <div style={{ marginTop:20, padding:'16px 20px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)', fontSize:14, lineHeight:1.8, whiteSpace:'pre-wrap' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#22C98A', marginBottom:8, letterSpacing:'0.06em' }}>MODEL OUTPUT</div>
              {testOutput}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
