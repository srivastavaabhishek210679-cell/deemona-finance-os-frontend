import { apiURL } from '../../api.js';
import { useState, useEffect, useCallback } from 'react';

// â”€â”€ Simple markdown to JSX â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MarkdownBlock({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div>
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return <div key={i} style={{ fontSize: 13, fontWeight: 700, color: '#9B8FFF', marginTop: 10, marginBottom: 3 }}>{line.slice(4)}</div>;
        }
        if (line.startsWith('## ')) {
          return <div key={i} style={{ fontSize: 15, fontWeight: 700, marginTop: 12, marginBottom: 4 }}>{line.slice(3)}</div>;
        }
        if (line.startsWith('# ')) {
          return <div key={i} style={{ fontSize: 17, fontWeight: 800, marginTop: 12, marginBottom: 4 }}>{line.slice(2)}</div>;
        }
        if (line.trim() === '---') {
          return <hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />;
        }
        if (!line.trim()) {
          return <div key={i} style={{ height: 6 }} />;
        }
        // Remove ** bold markers for plain display
        const clean = line.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^[-*]\s/, '');
        const isBullet = /^[-*]\s/.test(line) || /^\d+\.\s/.test(line);
        return (
          <div key={i} style={{
            display: 'flex', gap: 8, marginBottom: 3, lineHeight: 1.7, fontSize: 14,
            color: 'var(--text-primary)',
          }}>
            {isBullet && <span style={{ color: '#6C63FF', flexShrink: 0 }}>â€¢</span>}
            <span>{clean}</span>
          </div>
        );
      })}
    </div>
  );
}

// â”€â”€ Sparkline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Sparkline({ color, data, width = 80, height = 28 }) {
  const pts = (data || [2,4,3,5,4,6,5,7]);
  const min = Math.min(...pts), max = Math.max(...pts);
  const points = pts.map((v, i) => {
    const x = (i / (pts.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * height;
    return x + ',' + y;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color || '#6C63FF'}
        strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// â”€â”€ Health Ring â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function HealthRing({ score }) {
  const s = score || 0;
  const r = 54, circ = 2 * Math.PI * r;
  const filled = (s / 100) * circ;
  const color = s >= 75 ? '#22C98A' : s >= 50 ? '#F5A623' : '#FF5C5C';
  const label = s >= 75 ? 'Good' : s >= 50 ? 'Fair' : 'At Risk';
  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        <circle cx={70} cy={70} r={r} fill="none" stroke="#22223A" strokeWidth={10} />
        <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={filled + ' ' + circ}
          strokeDashoffset={circ / 4}
          strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{s}</div>
        <div style={{ fontSize: 13, color: '#8B89A8', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// â”€â”€ KPI Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function KpiCard({ label, value, sub, color, trend, sparkData }) {
  const up = (trend || 0) >= 0;
  return (
    <div style={{
      padding: '18px 20px', background: 'var(--surface-2)',
      border: '1px solid var(--border)', borderRadius: 14,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: (color || '#6C63FF') + '20',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: color || '#6C63FF', fontWeight: 700,
        }}>
          {label.slice(0, 2)}
        </div>
        <div style={{
          fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
          background: up ? '#22C98A18' : '#FF5C5C18',
          color: up ? '#22C98A' : '#FF5C5C',
        }}>
          {up ? '+' : ''}{trend || 0}%
        </div>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: color || '#6C63FF', lineHeight: 1, marginBottom: 4 }}>{value}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
      </div>
      <Sparkline color={color} data={sparkData} width={100} height={28} />
    </div>
  );
}

// â”€â”€ Action Item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ActionItem({ title, description, priority, action, color }) {
  const pc = { critical: '#FF5C5C', high: '#F5A623', medium: '#6C63FF' }[priority] || '#8B89A8';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '14px 16px', background: 'var(--surface-3)',
      borderRadius: 12, border: '1px solid ' + pc + '30', marginBottom: 8,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: (color || pc) + '20',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: color || pc, flexShrink: 0,
      }}>!</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
            background: pc + '20', color: pc, letterSpacing: '0.05em',
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

// â”€â”€ Recommendation Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function RecCard({ title, body, impact, effort }) {
  const ic = { High: '#22C98A', Medium: '#F5A623', Low: '#8B89A8' }[impact] || '#8B89A8';
  return (
    <div style={{
      padding: '14px 16px', background: 'var(--surface-2)',
      border: '1px solid var(--border)', borderRadius: 12, marginBottom: 8,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>{body}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: ic + '20', color: ic, fontWeight: 600 }}>
          Impact: {impact}
        </span>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--surface-3)', color: 'var(--text-muted)', fontWeight: 600 }}>
          Effort: {effort}
        </span>
      </div>
    </div>
  );
}

// â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function DecisionCenter() {
  const [brief, setBrief] = useState('');
  const [briefLoading, setBriefLoading] = useState(false);

  const kpis = [
    { label: 'Monthly Revenue',   value: '\u20b90', sub: 'vs last month', color: '#22C98A', trend: 0, sparkData: [0,0,0,0,0,0,0,0] },
    { label: 'Monthly Expenses',  value: '\u20b90', sub: 'vs last month', color: '#FF5C5C', trend: 0, sparkData: [0,0,0,0,0,0,0,0] },
    { label: 'Cash Position',     value: '\u20b90', sub: 'Available now', color: '#6C63FF', trend: 0, sparkData: [0,0,0,0,0,0,0,0] },
    { label: 'Pending Approvals', value: '0',    sub: 'Needs action',  color: '#F5A623', trend: 0, sparkData: [0,0,0,0,0,0,0,0] },
  ];

  const actions = [
    { title: 'No vendors configured',    description: 'Add your vendor master to start tracking payables and approvals.',      priority: 'high',   action: 'Set up',    color: '#F5A623' },
    { title: 'Chart of accounts missing', description: 'Configure your general ledger accounts to enable financial reporting.', priority: 'high',   action: 'Configure', color: '#F5A623' },
    { title: 'Bank accounts not linked',  description: 'Link your bank accounts to track cash position in real time.',          priority: 'medium', action: 'Link',      color: '#6C63FF' },
  ];

  const recs = [
    { title: 'Connect your accounting data', body: 'Import your chart of accounts and opening balances to unlock the full Decision Center.', impact: 'High', effort: 'Low' },
    { title: 'Invite your finance team',      body: 'Add your CFO, controller, and accounts team so memories are recorded from real transactions.', impact: 'High', effort: 'Low' },
    { title: 'Enable the Accounting Agent',   body: 'The AI accounting agent will start detecting anomalies and suggesting journal entries.', impact: 'High', effort: 'Medium' },
  ];

  const risks = [
    { label: 'Cash Runway',      value: '--',  color: '#8B89A8', note: 'Add bank data' },
    { label: 'Budget Burn Rate', value: '--',  color: '#8B89A8', note: 'Add budgets' },
    { label: 'Overdue Invoices', value: '0',   color: '#22C98A', note: 'All clear' },
    { label: 'Compliance Risk',  value: 'Low', color: '#22C98A', note: 'No issues' },
  ];

  const generateBrief = useCallback(async () => {
    setBriefLoading(true);
    setBrief('');
    try {
      const today = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });
      const prompt = 'You are the Digital CFO of Deemona AI Finance OS. '
        + 'Generate a concise executive financial brief for today: ' + today + '. '
        + 'This is Day 1 of the platform with no financial data yet. '
        + 'Cover: welcome message, 3 setup priorities (vendors, chart of accounts, bank accounts), '
        + '2 CFO actions for today, and a motivating closing line. '
        + 'Use plain text only. No emojis. No markdown symbols like ## or **. '
        + 'Use numbered lists and dashes for structure. Keep under 150 words.';

      const res = await fetch(apiURL('/api/brief'), {
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

      {/* Row 1: Health + KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {kpis.map(k => <KpiCard key={k.label} {...k} />)}
        </div>
      </div>

      {/* Row 2: AI Brief + Urgent Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* AI Brief */}
        <div style={{
          padding: 20, borderRadius: 14,
          background: 'linear-gradient(135deg, #1A1A35 0%, #22223A 100%)',
          border: '1px solid #6C63FF40',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, color: '#6C63FF' }}>*</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>AI Daily Brief</span>
              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#6C63FF', color: '#fff', fontWeight: 700 }}>LIVE</span>
            </div>
            <button onClick={generateBrief} disabled={briefLoading} style={{
              padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'var(--surface-3)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: briefLoading ? 'not-allowed' : 'pointer',
            }}>
              {briefLoading ? 'Generating...' : 'Refresh'}
            </button>
          </div>

          {briefLoading ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              AI is generating your brief...
            </div>
          ) : brief ? (
            <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              {brief}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
              No financial data yet. Click Refresh to generate your first brief.
            </div>
          )}

          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            {'Generated ' + new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        </div>

        {/* Urgent Actions */}
        <div style={{ padding: 20, borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, color: '#F5A623' }}>!</span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Urgent Actions</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FF5C5C20', color: '#FF5C5C' }}>
              {actions.length} pending
            </span>
          </div>
          {actions.map((a, i) => <ActionItem key={i} {...a} />)}
        </div>
      </div>

      {/* Row 3: Recommendations */}
      <div style={{ padding: 20, borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>AI Recommendations</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Based on your current setup</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {recs.map((r, i) => <RecCard key={i} {...r} />)}
        </div>
      </div>

      {/* Row 4: Risk Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {risks.map(r => (
          <div key={r.label} style={{
            padding: '16px 18px', borderRadius: 12,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: r.color + '20',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: r.color, flexShrink: 0,
            }}>
              {r.label.slice(0, 2)}
            </div>
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



