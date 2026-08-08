import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { const r = await fetch(apiURL(url), { headers: h() }); return r.json(); };
const post = async (url, body) => { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); return r.json(); };

const TIER_COLORS = { core:'#22C98A', premium:'#6C63FF', enterprise:'#F5A623' };
const STATUS_COLORS = { stable:'#22C98A', beta:'#F5A623', coming_soon:'var(--text-muted)' };
const CAT_ICONS = { Finance:'💰', Operations:'⚙️', Compliance:'⚖️', Executive:'◈', HR:'👥' };

export default function MarketplacePage() {
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    get('/api/marketplace/agents').then(d => {
      setAgents(d.agents || []);
      setStats(d.stats || {});
      setLoading(false);
    });
  }, []);

  const toggle = async (agent) => {
    setToggling(agent.id);
    const action = agent.enabled ? 'disable' : 'enable';
    await post(`/api/marketplace/agents/${agent.id}/${action}`, {});
    setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, enabled: !a.enabled } : a));
    setToggling(null);
  };

  const filtered = agents.filter(a => filter === 'all' || a.category === filter || a.tier === filter);
  const categories = [...new Set(agents.map(a => a.category))];
  const enabled = agents.filter(a => a.enabled).length;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, marginBottom: 6 }}>Agent Marketplace</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Enable the AI agents your organization needs. Each agent adds specialized intelligence to your Finance OS.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Agents Enabled', value: enabled, color: '#22C98A', sub: `of ${agents.length} total` },
          { label: 'Core Agents',    value: stats.core || 0,       color: '#22C98A', sub: 'Free with plan' },
          { label: 'Premium Agents', value: stats.premium || 0,    color: '#6C63FF', sub: 'Advanced AI' },
          { label: 'Enterprise',     value: stats.enterprise || 0, color: '#F5A623', sub: 'Custom models' },
        ].map(k => (
          <div key={k.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{k.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['all', 'All Agents'], ['core', 'Core'], ['premium', 'Premium'], ['enterprise', 'Enterprise'], ...categories.map(c => [c, `${CAT_ICONS[c]||'•'} ${c}`])].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{ padding: '6px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: filter === val ? '#6C63FF' : 'var(--surface-2)', color: filter === val ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}>{label}</button>
        ))}
      </div>

      {/* Agent Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading agents...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(agent => (
            <div key={agent.id} style={{ borderRadius: 14, border: `1px solid ${agent.enabled ? '#6C63FF40' : 'var(--border)'}`, padding: 20, background: agent.enabled ? '#6C63FF06' : 'var(--surface-2)', transition: 'all 0.2s' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: agent.enabled ? 'linear-gradient(135deg,#6C63FF,#9B8FFF)' : 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{agent.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{agent.name}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                      <span style={{ padding: '1px 7px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: (TIER_COLORS[agent.tier]||'#6C63FF')+'20', color: TIER_COLORS[agent.tier]||'#6C63FF' }}>{agent.tier?.toUpperCase()}</span>
                      <span style={{ padding: '1px 7px', borderRadius: 100, fontSize: 10, fontWeight: 600, background: (STATUS_COLORS[agent.status]||'#6C63FF')+'20', color: STATUS_COLORS[agent.status]||'#6C63FF' }}>{agent.status}</span>
                    </div>
                  </div>
                </div>
                {/* Toggle switch */}
                <button onClick={() => toggle(agent)} disabled={toggling === agent.id} style={{ width: 48, height: 26, borderRadius: 13, background: agent.enabled ? '#6C63FF' : 'var(--surface-3)', border: 'none', cursor: toggling === agent.id ? 'not-allowed' : 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: agent.enabled ? 25 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                </button>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>{agent.description}</p>

              {/* Features */}
              <div style={{ marginBottom: 14 }}>
                {agent.features?.slice(0, 3).map((f, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '2px 0', display: 'flex', gap: 6 }}>
                    <span style={{ color: agent.enabled ? '#6C63FF' : 'var(--text-muted)' }}>›</span>{f}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>v{agent.version} · {agent.ai_calls_per_month} AI calls/mo</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: agent.enabled ? '#22C98A' : 'var(--text-muted)' }}>{agent.enabled ? '● Active' : '○ Inactive'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
