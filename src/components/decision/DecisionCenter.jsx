import { useState, useEffect, useCallback } from 'react';

// ── API ───────────────────────────────────────────────────────
const API_BASE = '/api';
const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
});

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST', headers: headers(), body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Sparkline ─────────────────────────────────────────────────
function Sparkline({ color = '#6C63FF', data = [2,4,3,6,5,8,7,9], width = 80, height = 32 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
    </svg>
  );
}

// ── Health Score Ring ─────────────────────────────────────────
function HealthRing({ score = 72 }) {
  const r = 54, circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 75 ? '#22C98A' : score >= 50 ? '#F5A623' : '#FF5C5C';
  const label = score >= 75 ? 'Good' : score >= 50 ? 'Fair' : 'At Risk';
  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={70} cy={70} r={r} fill="none" stroke="#22223A" strokeWidth={10} />
        <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${filled} ${circ}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 13, color: '#8B89A8', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color, trend, sparkData, onClick }) {
  const trendUp = trend >= 0;
  return (
    <div onClick={onClick} style={{
      padding: '18px 20px',
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color 0.15s, transform 0.15s',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>{icon}</div>
        <div style={{
          fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
          background: trendUp ? '#22C98A18' : '#FF5C5C18',
          color: trendUp ? '#22C98A' : '#FF5C5C',
        }}>
          {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
      </div>
      <Sparkline color={color} data={sparkData ?? [3,4,3,5,4,6,5,7]} width={100} height={28} />
    </div>
  );
}

// ── Urgent Action Item ────────────────────────────────────────
function ActionItem({ icon, title, description, priority, action, color }) {
  const priorityColors = { critical: '#FF5C5C', high: '#F5A623', medium: '#6C63FF' };
  const pc = priorityColors[priority] ?? '#8B89A8';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '14px 16px',
      background: 'var(--surface-3)',
      borderRadius: 12,
      border: `1px solid ${pc}30`,
      marginBottom: 8,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${color ?? pc}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
            background: `${pc}20`, color: pc, letterSpacing: '0.05em',
          }}>{priority.toUpperCase()}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{description}</div>
      </div>
      <button style={{
        padding: '6px 12px', borderRadius: 8, flexShrink: 0,
        background: 'var(--accent)', color: '#fff',
        border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
      }}>{action}</button>
    </div>
  );
}

// ── Simple Markdown renderer ─────────────────────────────────
function renderMarkdown(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    // H1
    if (line.startsWith('# ')) return <div key={i} style={{fontSize:18,fontWeight:800,marginBottom:4,marginTop:i>0?12:0}}>{line.slice(2)}</div>;
    // H2
    if (line.startsWith('## ')) return <div key={i} style={{fontSize:16,fontWeight:700,marginBottom:4,marginTop:i>0?10:0}}>{line.slice(3)}</div>;
    // H3
    if (line.startsWith('### ')) return <div key={i} style={{fontSize:14,fontWeight:700,color:'#9B8FFF',marginBottom:4,marginTop:i>0?8:0}}>{line.slice(4)}</div>;
    // HR
    if (line.trim() === '---') return <hr key={i} style={{border:'none',borderTop:'1px solid var(--border)',margin:'10px 0'}}/>;
    // Bullet
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const txt = line.slice(2).replace(/\*\*(.+?)\*\*/g, '$1');
      return <div key={i} style={{display:'flex',gap:8,marginBottom:3}}><span style={{color:'var(--accent)',flexShrink:0}}>•</span><span>{txt}</span></div>;
    }
    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const txt = line.replace(/^\d+\.\s/, '').replace(/\*\*(.+?)\*\*/g, '$1');
      const num = line.match(/^(\d+)\.\s/)[1];
      return <div key={i} style={{display:'flex',gap:8,marginBottom:3}}><span style={{color:'var(--accent)',flexShrink:0,minWidth:16}}>{num}.</span><span>{txt}</span></div>;
    }
    // Empty line
    if (!line.trim()) return <div key={i} style={{height:6}}/>;
    // Bold inline
    const parts = line.split(/\*\*(.+?)\*\*/g);
    if (parts.length > 1) {
      return <div key={i} style={{marginBottom:3,lineHeight:1.7}}>
        {parts.map((p,j) => j%2===1 ? <strong key={j}>{p}</strong> : p)}
      </div>;
    }
    // Regular line
    return <div key={i} style={{marginBottom:3,lineHeight:1.7}}>{line}</div>;
  });
}

// ── AI Brief Panel ────────────────────────────────────────────
function AIBrief({ brief, loading, onRefresh }) {
  return (
    <div style={{
      padding: 20, borderRadius: 14,
      background: 'linear-gradient(135deg, #1A1A35 0%, #22223A 100%)',
      border: '1px solid #6C63FF40',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 160, height: 160,
        background: 'radial-gradient(circle, #6C63FF22 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>✦</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>AI Daily Brief</span>
          <span style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 4,
            background: '#6C63FF', color: '#fff', fontWeight: 700,
          }}>LIVE</span>
        </div>
        <button onClick={onRefresh} disabled={loading} style={{
          padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: 'var(--surface-3)', border: '1px solid var(--border)',
          color: 'var(--text-secondary)', cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Generating...' : '↻ Refresh'}
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          AI is generating your brief...
        </div>
      ) : brief ? (
        <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
          {brief}
        </div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
          No financial data yet. As your team records transactions, approvals, and events,
          the AI will generate a personalised daily brief here every morning.
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
        Generated {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
      </div>
    </div>
  );
}

// ── Recommendation Card ───────────────────────────────────────
function RecommendationCard({ icon, title, body, impact, effort }) {
  const impactColor = { High: '#22C98A', Medium: '#F5A623', Low: '#8B89A8' };
  return (
    <div style={{
      padding: '14px 16px',
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
      borderRadius: 12, marginBottom: 8,
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: '#6C63FF20',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
        }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{body}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 4,
              background: `${impactColor[impact] ?? '#8B89A8'}20`,
              color: impactColor[impact] ?? '#8B89A8', fontWeight: 600,
            }}>Impact: {impact}</span>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 4,
              background: 'var(--surface-3)', color: 'var(--text-muted)', fontWeight: 600,
            }}>Effort: {effort}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Decision Center ──────────────────────────────────────
export default function DecisionCenter() {
  const [brief, setBrief] = useState('');
  const [briefLoading, setBriefLoading] = useState(false);
  const [activeKpi, setActiveKpi] = useState(null);

  // Mock data — will be replaced by real API data in Phase 3
  const kpis = [
    { icon: '💰', label: 'Monthly Revenue',    value: '₹0',   sub: 'vs last month', color: '#22C98A', trend: 0,   sparkData: [0,0,0,0,0,0,0,0] },
    { icon: '📤', label: 'Monthly Expenses',   value: '₹0',   sub: 'vs last month', color: '#FF5C5C', trend: 0,   sparkData: [0,0,0,0,0,0,0,0] },
    { icon: '🏦', label: 'Cash Position',      value: '₹0',   sub: 'Available now', color: '#6C63FF', trend: 0,   sparkData: [0,0,0,0,0,0,0,0] },
    { icon: '📋', label: 'Pending Approvals',  value: '0',    sub: 'Needs action',  color: '#F5A623', trend: 0,   sparkData: [0,0,0,0,0,0,0,0] },
  ];

  const urgentActions = [
    { icon: '⚠️',  title: 'No vendors configured',     description: 'Add your vendor master to start tracking payables and approvals.',   priority: 'high',   action: 'Set up',  color: '#F5A623' },
    { icon: '📊',  title: 'Chart of accounts missing',  description: 'Configure your general ledger accounts to enable financial reporting.', priority: 'high',   action: 'Configure', color: '#F5A623' },
    { icon: '💳',  title: 'Bank accounts not linked',   description: 'Link your bank accounts to track cash position in real time.',        priority: 'medium', action: 'Link',    color: '#6C63FF' },
  ];

  const recommendations = [
    { icon: '🔗', title: 'Connect your accounting data',   body: 'Import your chart of accounts and opening balances to unlock the full Decision Center.',      impact: 'High',   effort: 'Low' },
    { icon: '👥', title: 'Invite your finance team',       body: 'Add your CFO, controller, and accounts team so memories are recorded from real transactions.', impact: 'High',   effort: 'Low' },
    { icon: '🤖', title: 'Enable the Accounting Agent',    body: 'The AI accounting agent will start detecting anomalies and suggesting journal entries.',        impact: 'High',   effort: 'Medium' },
  ];

  const generateBrief = useCallback(async () => {
    setBriefLoading(true);
    try {
      const today = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });
      const prompt = [
        'You are the Digital CFO of Deemona AI Finance OS.',
        'Generate a concise executive financial brief for today: ' + today + '.',
        'This is a brand new platform with no financial data yet.',
        'Write a brief covering:',
        '1. A Day 1 welcome noting the platform is now live',
        '2. The 3 most important setup steps: add vendors, configure chart of accounts, link bank accounts',
        '3. Two specific actions the CFO should take today',
        '4. A motivating closing line about what AI-powered insights will look like once data flows in',
        'Keep it under 150 words. Be professional but warm. Use Indian financial context (rupees, crore, lakh). Use markdown formatting with headers (##) and bold (**text**) for structure. Do not use emojis.',
      ].join(' ');

      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) {
        setBrief('Error: ' + data.error);
      } else {
        setBrief(data.text || '');
      }
    } catch (err) {
      setBrief('Could not connect to backend. Make sure the server is running on port 4001.');
    } finally {
      setBriefLoading(false);
    }
  }, []);

  useEffect(() => { generateBrief(); }, []);

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Row 1: Health Score + KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>

        {/* Health Score */}
        <div style={{
          padding: 20, borderRadius: 14,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', alignSelf: 'flex-start' }}>
            Business Health Score
          </div>
          <HealthRing score={0} />
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            Score improves as you add financial data and resolve actions
          </div>
        </div>

        {/* KPI grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {kpis.map(k => (
            <KpiCard key={k.label} {...k} onClick={() => setActiveKpi(k.label === activeKpi ? null : k.label)} />
          ))}
        </div>
      </div>

      {/* ── Row 2: AI Brief + Urgent Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* AI Daily Brief */}
        <AIBrief brief={brief} loading={briefLoading} onRefresh={generateBrief} />

        {/* Urgent Actions */}
        <div style={{
          padding: 20, borderRadius: 14,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Urgent Actions</span>
            </div>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              background: '#FF5C5C20', color: '#FF5C5C',
            }}>{urgentActions.length} pending</span>
          </div>
          {urgentActions.map((a, i) => <ActionItem key={i} {...a} />)}
        </div>
      </div>

      {/* ── Row 3: AI Recommendations ── */}
      <div style={{
        padding: 20, borderRadius: 14,
        background: 'var(--surface-2)', border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 16 }}>✦</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>AI Recommendations</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
            Based on your current setup
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {recommendations.map((r, i) => <RecommendationCard key={i} {...r} />)}
        </div>
      </div>

      {/* ── Row 4: Risk Indicators ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
      }}>
        {[
          { label: 'Cash Runway',      value: '—',   icon: '🏦', color: '#8B89A8', note: 'Add bank data' },
          { label: 'Budget Burn Rate', value: '—',   icon: '📊', color: '#8B89A8', note: 'Add budgets' },
          { label: 'Overdue Invoices', value: '0',   icon: '📋', color: '#22C98A', note: 'All clear' },
          { label: 'Compliance Risk',  value: 'Low', icon: '✅', color: '#22C98A', note: 'No issues' },
        ].map(r => (
          <div key={r.label} style={{
            padding: '16px 18px', borderRadius: 12,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${r.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>{r.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: r.color, lineHeight: 1 }}>{r.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{r.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{r.note}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
