import { useState, useEffect, useRef } from 'react';
import { apiURL } from '../../api.js';

const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { const r = await fetch(apiURL(url), { headers: headers() }); if (!r.ok) throw new Error(await r.text()); return r.json(); };
const post = async (url, body) => { const r = await fetch(apiURL(url), { method: 'POST', headers: headers(), body: JSON.stringify(body) }); if (!r.ok) throw new Error(await r.text()); return r.json(); };

function INR(n) {
  const v = parseFloat(n || 0);
  if (v >= 1e7) return 'Rs ' + (v / 1e7).toFixed(2) + ' Cr';
  if (v >= 1e5) return 'Rs ' + (v / 1e5).toFixed(2) + ' L';
  return 'Rs ' + v.toLocaleString('en-IN');
}

const EXAMPLE_QUESTIONS = [
  'Why might our EBITDA be under pressure?',
  'How much cash runway do we have?',
  'Which customers owe us the most money?',
  'Are we at risk of missing any compliance deadlines?',
  'What is our working capital position?',
  'Can we afford to hire 10 more employees?',
  'What is our biggest expense category?',
  'How is our sales pipeline looking?',
  'What is our current debt to equity ratio?',
  'Should we be concerned about our cash flow?',
];

function MarkdownText({ text }) {
  // Simple markdown bold rendering
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>
          : part
      )}
    </span>
  );
}

export default function CFOAgentPage() {
  const [dashboard, setDashboard] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    get('/api/cfo/dashboard').then(setDashboard).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ask = async (question) => {
    if (!question?.trim() || loading) return;
    setLoading(true);
    setInput('');

    const userMsg = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);

    try {
      const data = await post('/api/cfo/ask', {
        question,
        conversation_history: history,
      });
      const assistantMsg = { role: 'assistant', content: data.answer };
      setMessages(prev => [...prev, assistantMsg]);
      setHistory(prev => [...prev, userMsg, assistantMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + e.message, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setHistory([]);
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', gap: 20 }}>

      {/* CFO Dashboard KPIs */}
      {dashboard && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, flexShrink: 0 }}>
          {[
            { label: 'Cash Position',    value: INR(dashboard.cash),             color: '#22C98A', sub: dashboard.runway_months + ' months runway' },
            { label: 'AR Outstanding',   value: INR(dashboard.ar),               color: '#4FC3F7', sub: 'Receivables due' },
            { label: 'AP Outstanding',   value: INR(dashboard.ap),               color: '#FF5C5C', sub: 'Payables due' },
            { label: 'Pipeline (Wtd)',   value: INR(dashboard.pipeline_weighted), color: '#1B4FD8', sub: dashboard.active_projects + ' active projects' },
            { label: 'Compliance Risk',  value: dashboard.overdue_compliance + ' overdue', color: dashboard.overdue_compliance > 0 ? '#FF5C5C' : '#22C98A', sub: 'Statutory deadlines' },
          ].map(k => (
            <div key={k.label} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: k.color, marginBottom: 2 }}>{k.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Chat area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        borderRadius: 16, border: '1px solid var(--border)',
        background: 'var(--surface-1)', overflow: 'hidden',
        minHeight: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, #13131E, #1A1A35)',
          display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #1B4FD8, #3B82F6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: '#fff',
          }}>◈</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Digital CFO</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              AI-powered executive finance intelligence · Real-time data
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12,
              background: 'var(--surface-3)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}>Clear chat</button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.length === 0 && (
            <div>
              <div style={{ textAlign: 'center', padding: '20px 0 24px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>◈</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Your Digital CFO</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
                  Ask me anything about your company's finances. I analyze real data and give you CFO-level insights.
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>
                EXAMPLE QUESTIONS
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EXAMPLE_QUESTIONS.map(q => (
                  <button key={q} onClick={() => ask(q)} style={{
                    padding: '7px 14px', borderRadius: 100, fontSize: 12,
                    background: '#1B4FD812', color: '#3B82F6',
                    border: '1px solid #1B4FD825', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.target.style.background = '#1B4FD822'}
                  onMouseLeave={e => e.target.style.background = '#1B4FD812'}
                  >{q}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12,
              alignItems: 'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #1B4FD8, #3B82F6)'
                  : 'linear-gradient(135deg, #22C98A, #1AAF74)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#fff',
              }}>
                {msg.role === 'user' ? 'Y' : '◈'}
              </div>

              {/* Message bubble */}
              <div style={{
                maxWidth: '78%',
                padding: '12px 16px', borderRadius: 12,
                background: msg.role === 'user' ? '#1B4FD818' : 'var(--surface-2)',
                border: '1px solid ' + (msg.role === 'user' ? '#1B4FD830' : 'var(--border)'),
                fontSize: 14, lineHeight: 1.7,
                color: msg.error ? '#FF5C5C' : 'var(--text-primary)',
              }}>
                {msg.role === 'assistant' && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#22C98A', marginBottom: 6, letterSpacing: '0.06em' }}>
                    DIGITAL CFO
                  </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.role === 'assistant'
                    ? msg.content.split('\n').map((line, j) => (
                        <div key={j}><MarkdownText text={line} /></div>
                      ))
                    : msg.content
                  }
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #22C98A, #1AAF74)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' }}>◈</div>
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-muted)' }}>
                Analyzing financial data...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '16px 20px', borderTop: '1px solid var(--border)',
          background: 'var(--surface-1)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }}
              placeholder="Ask your Digital CFO anything about your finances..."
              disabled={loading}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'var(--surface-2)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#1B4FD8'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={() => ask(input)}
              disabled={loading || !input.trim()}
              style={{
                padding: '12px 20px', borderRadius: 10,
                background: loading || !input.trim() ? 'var(--surface-3)' : 'linear-gradient(135deg, #1B4FD8, #3B82F6)',
                color: loading || !input.trim() ? 'var(--text-muted)' : '#fff',
                border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
              }}
            >
              {loading ? '...' : 'Ask'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
            Powered by real-time data from your Finance OS · Press Enter to send
          </div>
        </div>
      </div>
    </div>
  );
}

