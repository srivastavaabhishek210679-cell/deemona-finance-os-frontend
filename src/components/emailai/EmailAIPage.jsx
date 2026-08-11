import { useState } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const post = async (url, body) => { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); return r.json(); };

const ACTION_COLORS = { create_ap_invoice:'#FF5C5C', create_ar_invoice:'#22C98A', record_payment:'#4FC3F7', create_po:'#F5A623', none:'var(--text-muted)' };
const URGENCY_COLORS = { high:'#FF5C5C', medium:'#F5A623', low:'#22C98A' };

const SAMPLES = [
  { subject:'Invoice #AWS-2026-0901 for Rs 3,24,500', from:'billing@aws.amazon.in', body:'Dear Team,\n\nPlease find Invoice #AWS-2026-0901 for cloud services August 2026.\n\nAmount: Rs 2,75,000 + GST 18% = Rs 3,24,500\nInvoice Date: 1 September 2026\nDue Date: 30 September 2026\n\nPlease process payment at earliest.\n\nRegards, AWS Billing Team' },
  { subject:'Payment Received - TVI-2026-023', from:'accounts@jio.com', body:'Hi,\n\nPayment of Rs 8,85,000 against Invoice TVI-2026-023 processed today via NEFT.\n\nReference: JNFT2026090112345\nAmount: Rs 8,85,000\nDate: 1 September 2026\n\nPlease confirm receipt.\n\nRegards, Jio Accounts' },
  { subject:'Reminder: Invoice TVI-2026-024 Overdue', from:'finance@hdfc.com', body:'Dear Team,\n\nInvoice TVI-2026-024 for Rs 5,90,000 is now 10 days overdue.\n\nDue Date: 31 August 2026\n\nKindly make payment immediately.\n\nThanks, HDFC Finance' },
];

function INR(n) { const v=parseFloat(n||0); if(v>=1e7) return 'Rs '+(v/1e7).toFixed(2)+' Cr'; if(v>=1e5) return 'Rs '+(v/1e5).toFixed(2)+' L'; return 'Rs '+v.toLocaleString('en-IN'); }

export default function EmailAIPage() {
  const [tab, setTab] = useState('analyze');
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [replyCtx, setReplyCtx] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [reply, setReply] = useState('');

  const inp = { width:'100%', boxSizing:'border-box', padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-primary)', fontSize:13 };

  const analyze = async () => {
    setAnalyzing(true); setResult(null); setCreated(null);
    const d = await post('/api/email-ai/analyze', { email_text:body, email_subject:subject, email_from:from });
    setResult(d); setAnalyzing(false);
  };

  const createEntry = async () => {
    setCreating(true);
    const d = await post('/api/email-ai/create-from-email', { analysis:result });
    setCreated(d); setCreating(false);
  };

  const draftReplyFn = async () => {
    setDrafting(true); setReply('');
    const d = await post('/api/email-ai/draft-reply', { email_text:body, email_subject:subject, context:replyCtx });
    setReply(d.reply||''); setDrafting(false);
  };

  const loadSample = s => { setFrom(s.from); setSubject(s.subject); setBody(s.body); setResult(null); setCreated(null); };

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, margin:0, marginBottom:6 }}>Email AI</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', margin:0 }}>Paste any financial email — AI extracts data and creates AP/AR entries automatically</p>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:20 }}>
        {[['analyze','🔍 Analyze'],['reply','✉️ Draft Reply']].map(([id,label]) => (
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'10px 20px', fontSize:14, fontWeight:600, background:'none', border:'none', cursor:'pointer', borderBottom:tab===id?'2px solid #1B4FD8':'2px solid transparent', color:tab===id?'#1B4FD8':'var(--text-secondary)', marginBottom:-1 }}>{label}</button>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        <span style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)' }}>Try sample:</span>
        {SAMPLES.map((s,i)=><button key={i} onClick={()=>loadSample(s)} style={{ padding:'4px 12px', borderRadius:100, fontSize:11, background:'#1B4FD812', color:'#3B82F6', border:'1px solid #1B4FD825', cursor:'pointer' }}>Sample {i+1}</button>)}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:result&&tab==='analyze'?'1fr 1fr':'1fr', gap:20 }}>
        <div>
          <div style={{ marginBottom:10 }}><div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>From</div><input value={from} onChange={e=>setFrom(e.target.value)} placeholder="sender@company.com" style={inp} /></div>
          <div style={{ marginBottom:10 }}><div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Subject</div><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Invoice #..." style={inp} /></div>
          <div style={{ marginBottom:14 }}><div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Email Body</div>
            <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Paste email text here..." rows={10} style={{...inp, resize:'vertical', fontFamily:'inherit'}} />
          </div>

          {tab==='analyze' && (
            <button onClick={analyze} disabled={!body.trim()||analyzing} style={{ width:'100%', padding:'12px', borderRadius:10, fontSize:14, fontWeight:700, background:(!body.trim()||analyzing)?'var(--surface-3)':'linear-gradient(135deg,#1B4FD8,#3B82F6)', color:(!body.trim()||analyzing)?'var(--text-muted)':'#fff', border:'none', cursor:(!body.trim()||analyzing)?'not-allowed':'pointer' }}>
              {analyzing?'🔍 Analyzing...':'🔍 Analyze with AI'}
            </button>
          )}

          {tab==='reply' && (
            <div>
              <div style={{ marginBottom:10 }}><div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Reply instructions</div><input value={replyCtx} onChange={e=>setReplyCtx(e.target.value)} placeholder="e.g. Confirm payment received, ask for credit note..." style={inp} /></div>
              <button onClick={draftReplyFn} disabled={!body.trim()||drafting} style={{ width:'100%', padding:'12px', borderRadius:10, fontSize:14, fontWeight:700, background:(!body.trim()||drafting)?'var(--surface-3)':'linear-gradient(135deg,#1B4FD8,#3B82F6)', color:(!body.trim()||drafting)?'var(--text-muted)':'#fff', border:'none', cursor:(!body.trim()||drafting)?'not-allowed':'pointer' }}>
                {drafting?'✍️ Drafting...':'✍️ Draft Reply'}
              </button>
              {reply && <div style={{ marginTop:14, padding:16, borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)', fontSize:13, whiteSpace:'pre-wrap', lineHeight:1.7 }}>
                <div style={{ fontSize:10, fontWeight:700, color:'#22C98A', marginBottom:8 }}>AI DRAFTED REPLY</div>
                {reply}
                <button onClick={()=>navigator.clipboard?.writeText(reply)} style={{ marginTop:10, padding:'5px 12px', borderRadius:6, fontSize:12, background:'var(--surface-3)', border:'1px solid var(--border)', color:'var(--text-secondary)', cursor:'pointer' }}>Copy</button>
              </div>}
            </div>
          )}
        </div>

        {result && tab==='analyze' && (
          <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
            <div style={{ padding:'14px 16px', background:'var(--surface-3)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:14, fontWeight:700 }}>Analysis Result</span>
              <span style={{ padding:'2px 8px', borderRadius:100, fontSize:10, fontWeight:700, background:(URGENCY_COLORS[result.urgency]||'#1B4FD8')+'20', color:URGENCY_COLORS[result.urgency]||'#1B4FD8' }}>{result.urgency?.toUpperCase()}</span>
            </div>
            <div style={{ padding:16 }}>
              <div style={{ padding:'10px 14px', borderRadius:8, background:'var(--surface-2)', marginBottom:12, fontSize:13 }}>{result.summary}</div>
              {result.action_required!=='none' && <div style={{ padding:'8px 12px', borderRadius:8, background:(ACTION_COLORS[result.action_required]||'#1B4FD8')+'15', border:`1px solid ${ACTION_COLORS[result.action_required]||'#1B4FD8'}30`, marginBottom:12, fontSize:12, fontWeight:700, color:ACTION_COLORS[result.action_required]||'#1B4FD8' }}>
                ACTION: {result.action_required?.replace(/_/g,' ').toUpperCase()}
              </div>}
              {[['Type',result.email_type?.replace(/_/g,' ')],['Invoice #',result.extracted?.invoice_number],['Amount',result.extracted?.amount?INR(result.extracted.amount):null],['Tax',result.extracted?.tax_amount?INR(result.extracted.tax_amount):null],['Date',result.extracted?.date],['Due Date',result.extracted?.due_date],['Vendor',result.extracted?.vendor_name],['Customer',result.extracted?.customer_name],['GSTIN',result.extracted?.gstin]].filter(([,v])=>v).map(([k,v])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <span style={{ color:'var(--text-secondary)' }}>{k}</span><span style={{ fontWeight:600 }}>{v}</span>
                </div>
              ))}
              {result.matched_vendor && <div style={{ marginTop:10, padding:'7px 10px', borderRadius:7, background:'#22C98A12', border:'1px solid #22C98A30', fontSize:12, color:'#22C98A' }}>Vendor matched: {result.matched_vendor.name}</div>}
              {created ? <div style={{ marginTop:12, padding:'10px', borderRadius:8, background:'#22C98A12', textAlign:'center', fontSize:13, fontWeight:700, color:'#22C98A' }}>Entry Created!</div>
              : result.action_required!=='none' && <button onClick={createEntry} disabled={creating} style={{ marginTop:12, width:'100%', padding:'10px', borderRadius:9, fontSize:13, fontWeight:700, background:creating?'var(--surface-3)':'linear-gradient(135deg,#22C98A,#1AAF74)', color:creating?'var(--text-muted)':'#fff', border:'none', cursor:creating?'not-allowed':'pointer' }}>
                {creating?'Creating...':'+ '+result.action_required?.replace(/_/g,' ')}
              </button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
