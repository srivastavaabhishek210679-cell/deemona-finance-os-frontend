import { useState, useEffect, useRef } from 'react';
import { apiURL } from '../../api.js';

const hdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const call = async (method, url, body) => {
  try {
    const r = await fetch(apiURL(url), { method, headers: hdr(), body: body ? JSON.stringify(body) : undefined });
    const t = await r.text(); let d = {}; try { d = JSON.parse(t); } catch { /* ignore */ }
    return r.ok ? d : { error: d.error || ('Request failed (' + r.status + ')') };
  } catch (e) { return { error: e.message }; }
};
const ICON = { treasury: '🏦', fpa: '📊', compliance: '⚖️' };
const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 16 };

// Minimal safe renderer: **bold**, "- " bullets, blank-line paragraphs. No HTML is ever injected.
function Rich({ text }) {
  const bold = s => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>));
  return (
    <div style={{ fontSize: 14, lineHeight: 1.55, color: '#0F172A' }}>
      {String(text).split(/\n{2,}/).map((para, i) => {
        const lines = para.split('\n');
        if (lines.every(l => /^\s*[-•]\s/.test(l))) return <ul key={i} style={{ margin: '6px 0', paddingLeft: 20 }}>{lines.map((l, j) => <li key={j}>{bold(l.replace(/^\s*[-•]\s/, ''))}</li>)}</ul>;
        return <p key={i} style={{ margin: '6px 0' }}>{lines.map((l, j) => <span key={j}>{bold(l)}{j < lines.length - 1 && <br />}</span>)}</p>;
      })}
    </div>
  );
}

export default function SpecialistAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [active, setActive] = useState('treasury');
  const [threads, setThreads] = useState({});
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { call('GET', '/api/specialists').then(d => { if (d.agents) setAgents(d.agents); else setLoadErr(d.error || 'Could not load agents'); }); }, []);
  const agent = agents.find(a => a.key === active);
  const thread = threads[active] || [];
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ block: 'nearest' }); }, [thread.length, busy]);

  const ask = async q => {
    const question = (q ?? input).trim();
    if (!question || busy) return;
    const key = active;
    const history = (threads[key] || []).filter(m => !m.error).map(m => ({ role: m.role, content: m.content }));
    setThreads(t => ({ ...t, [key]: [...(t[key] || []), { role: 'user', content: question }] }));
    setInput(''); setBusy(true);
    const d = await call('POST', '/api/specialists/' + key + '/ask', { question, conversation_history: history });
    setThreads(t => ({ ...t, [key]: [...(t[key] || []), d.error ? { role: 'assistant', content: d.error, error: true } : { role: 'assistant', content: d.answer, tools: d.tools_used }] }));
    setBusy(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      {loadErr && <div style={{ ...card, background: '#FEF2F2', borderColor: '#FECACA', color: '#B91C1C', fontSize: 14 }}>{loadErr}</div>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {agents.map(a => (
          <button key={a.key} onClick={() => setActive(a.key)} style={{ flex: '1 1 220px', textAlign: 'left', padding: 14, borderRadius: 12, cursor: 'pointer', background: a.key === active ? '#EEF2FF' : '#fff', border: '1px solid ' + (a.key === active ? '#6366F1' : '#E2E8F0') }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{ICON[a.key]} {a.name}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{a.role}</div>
          </button>
        ))}
      </div>

      {agent && (
        <div style={card}>
          <div style={{ fontSize: 14, color: '#475569', marginBottom: 12 }}>{agent.blurb}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 80, maxHeight: 460, overflowY: 'auto', marginBottom: 12 }}>
            {thread.length === 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Try asking</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {agent.examples.map((e, i) => <button key={i} onClick={() => ask(e)} disabled={busy} style={{ padding: '7px 12px', fontSize: 13, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 20, cursor: 'pointer', color: '#1E293B' }}>{e}</button>)}
                </div>
              </div>
            )}
            {thread.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', padding: '10px 14px', borderRadius: 12, background: m.role === 'user' ? '#1B4FD8' : (m.error ? '#FEF2F2' : '#F8FAFC'), color: m.role === 'user' ? '#fff' : '#0F172A', border: m.role === 'user' ? 'none' : '1px solid ' + (m.error ? '#FECACA' : '#E2E8F0') }}>
                {m.role === 'user' ? <div style={{ fontSize: 14 }}>{m.content}</div> : <Rich text={m.content} />}
                {m.tools && m.tools.length > 0 && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>Checked: {m.tools.join(', ').replace(/_/g, ' ')}</div>}
              </div>
            ))}
            {busy && <div style={{ alignSelf: 'flex-start', fontSize: 13, color: '#64748B' }}>{agent.name} is checking your books…</div>}
            <div ref={endRef} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={input} maxLength={2000} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') ask(); }} placeholder={'Ask the ' + agent.name + '…'} style={{ flex: 1, padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14 }} />
            <button onClick={() => ask()} disabled={busy || !input.trim()} style={{ padding: '10px 18px', background: '#1B4FD8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: busy || !input.trim() ? 'default' : 'pointer', opacity: busy || !input.trim() ? 0.55 : 1 }}>Ask</button>
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 10 }}>Answers use figures calculated from your own invoices, bills and cash balance. The AI explains them and can make mistakes, so check anything important. It does not give tax, legal or investment advice.</div>
        </div>
      )}
    </div>
  );
}
