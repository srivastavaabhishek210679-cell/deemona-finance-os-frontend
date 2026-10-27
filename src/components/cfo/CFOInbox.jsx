import React, { useEffect, useState, useCallback } from 'react'
import { apiURL } from '../../api.js'

// ── API helpers (same auth convention as the rest of the app) ─────────────
const token = () => { try { return localStorage.getItem('token') ?? '' } catch { return '' } }
async function call(url, method = 'GET', body) {
  const r = await fetch(apiURL(url), {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
    body: body ? JSON.stringify(body) : undefined,
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || 'Request failed (' + r.status + ')')
  return j
}
const api = (path, method, body) => call('/api/cfo-proactive' + path, method, body)

// ── formatting ────────────────────────────────────────────────────────────
const inr = v => (v === null || v === undefined || Number.isNaN(Number(v)) ? '—' : '₹' + Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 }))
const when = s => { try { return new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return '' } }
const SEV = {
  critical: { label: 'Critical', bg: '#fef2f2', fg: '#b91c1c', bd: '#fecaca' },
  warning: { label: 'Warning', bg: '#fffbeb', fg: '#b45309', bd: '#fde68a' },
  info: { label: 'For info', bg: '#eff6ff', fg: '#1d4ed8', bd: '#bfdbfe' },
}

// ── tiny, safe markdown renderer (headings, bullets, **bold**) ────────────
function inline(text, key) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') && p.length > 4 ? <strong key={key + '-' + i}>{p.slice(2, -2)}</strong> : <React.Fragment key={key + '-' + i}>{p}</React.Fragment>)
}
function Markdown({ text }) {
  const lines = String(text || '').split('\n'); const out = []; let list = []
  const flush = () => { if (list.length) { out.push(<ul key={'ul' + out.length} style={{ margin: '4px 0 10px', paddingLeft: 20 }}>{list.map((l, i) => <li key={i} style={{ marginBottom: 3 }}>{inline(l, 'li' + i)}</li>)}</ul>); list = [] } }
  lines.forEach((raw, i) => {
    const l = raw.trimEnd()
    const bullet = l.match(/^\s*[-*•]\s+(.*)$/)
    if (bullet) { list.push(bullet[1]); return }
    flush()
    const h = l.match(/^(#{1,4})\s+(.*)$/)
    if (h) { out.push(<h4 key={i} style={{ margin: '14px 0 4px', fontSize: h[1].length <= 2 ? 16 : 14, color: '#0f172a' }}>{inline(h[2], 'h' + i)}</h4>); return }
    if (!l.trim()) return
    out.push(<p key={i} style={{ margin: '4px 0 8px' }}>{inline(l, 'p' + i)}</p>)
  })
  flush()
  return <div style={{ fontSize: 14, lineHeight: 1.55, color: '#1e293b', overflowWrap: 'anywhere' }}>{out}</div>
}

// ── shared styles ─────────────────────────────────────────────────────────
const box = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }
const input = { padding: '7px 9px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, background: '#fff', minWidth: 0 }
const btn = (primary, danger) => ({
  padding: '7px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  border: primary ? 'none' : '1px solid ' + (danger ? '#fecaca' : '#cbd5e1'),
  background: primary ? '#1d4ed8' : '#fff', color: primary ? '#fff' : danger ? '#b91c1c' : '#334155',
})
const th = { textAlign: 'left', padding: '6px 8px', fontSize: 12, color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }
const td = { padding: '6px 8px', fontSize: 13, borderBottom: '1px solid #f1f5f9' }

function Msg({ msg }) {
  if (!msg) return null
  const err = msg.type === 'error'
  return <div style={{ margin: '8px 0', padding: '8px 12px', borderRadius: 8, fontSize: 14, background: err ? '#fef2f2' : '#f0fdf4', color: err ? '#b91c1c' : '#166534', border: '1px solid ' + (err ? '#fecaca' : '#bbf7d0') }}>{msg.text}</div>
}

// ── Alerts ────────────────────────────────────────────────────────────────
function AlertCard({ a, onChange, say }) {
  const sev = SEV[a.severity] || SEV.info
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState(null)
  const set = async status => {
    try { await api('/alerts/' + a.id, 'PATCH', { status }); await onChange() } catch (e) { say('error', e.message) }
  }
  const discuss = async () => {
    setBusy(true); setAnswer(null)
    try {
      const j = await call('/api/cfo/ask', 'POST', { question: a.ask + '\n\nContext the system detected: ' + a.title + '. ' + a.detail + '\nUse the tools to investigate the cause and recommend one action.' })
      setAnswer(j.answer || 'No answer came back.')
    } catch (e) { say('error', e.message) }
    setBusy(false)
  }
  const closed = a.status === 'resolved' || a.status === 'dismissed'
  return (
    <div style={{ ...box, borderLeft: '4px solid ' + sev.fg, opacity: closed ? 0.75 : 1, overflowWrap: 'anywhere' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: sev.bg, color: sev.fg, border: '1px solid ' + sev.bd }}>{sev.label}</span>
        {a.status !== 'open' && <span style={{ fontSize: 12, color: '#64748b' }}>{a.status}</span>}
        <span style={{ fontSize: 12, color: '#94a3b8' }}>raised {when(a.first_raised_at)}</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.35, color: '#0f172a' }}>{a.title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: '#475569', margin: '4px 0 12px' }}>{a.detail}</div>
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '3px solid #1d4ed8', borderRadius: 8, padding: '10px 12px', fontSize: 14, lineHeight: 1.5, color: '#1e293b' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: '#1d4ed8', marginBottom: 2 }}>DIGITAL CFO ASKS</div>{a.ask}
      </div>
      <div className="cfo-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {!closed && <button style={btn(true)} onClick={discuss} disabled={busy}>{busy ? 'Thinking…' : 'Discuss with Digital CFO'}</button>}
        {a.status === 'open' && <button style={btn()} onClick={() => set('acknowledged')}>Acknowledge</button>}
        {a.status === 'open' && <button style={btn(false, true)} onClick={() => set('dismissed')}>Dismiss</button>}
        {(a.status === 'acknowledged' || a.status === 'dismissed') && <button style={btn()} onClick={() => set('open')}>Re-open</button>}
      </div>
      {answer && <div style={{ marginTop: 10, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}><Markdown text={answer} /></div>}
    </div>
  )
}

function Rules({ say }) {
  const [rules, setRules] = useState(null)
  const load = useCallback(async () => { try { setRules((await api('/rules')).rules) } catch (e) { say('error', e.message) } }, [say])
  useEffect(() => { load() }, [load])
  const save = async r => {
    try { await api('/rules/' + r.key, 'PUT', { enabled: r.enabled, threshold: r.threshold }); say('ok', 'Saved "' + r.label + '"'); await load() } catch (e) { say('error', e.message) }
  }
  const edit = (key, patch) => setRules(rs => rs.map(r => (r.key === key ? { ...r, ...patch } : r)))
  if (!rules) return <div style={{ color: '#94a3b8' }}>Loading…</div>
  return (
    <div style={box}>
      <p style={{ margin: '0 0 10px', fontSize: 13, color: '#475569' }}>The system checks these rules every hour. Turn a rule off or change when it triggers; the next check applies your change.</p>
      {rules.map(r => (
        <div key={r.key} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '8px 0', borderTop: '1px solid #f1f5f9' }}>
          <input type="checkbox" checked={r.enabled} onChange={e => edit(r.key, { enabled: e.target.checked })} />
          <div style={{ flex: '1 1 260px', minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{r.label}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{r.description}</div>
          </div>
          {r.default_threshold !== null && (
            <label style={{ fontSize: 12, color: '#475569', display: 'flex', gap: 6, alignItems: 'center' }}>
              <input style={{ ...input, width: 80 }} type="number" min="0" value={r.threshold ?? ''} onChange={e => edit(r.key, { threshold: e.target.value === '' ? null : Number(e.target.value) })} />
              {r.threshold_unit}
            </label>
          )}
          <button style={btn()} onClick={() => save(r)}>Save</button>
        </div>
      ))}
    </div>
  )
}

function Alerts({ say }) {
  const [status, setStatus] = useState('open')
  const [data, setData] = useState({ alerts: [], counts: {} })
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const load = useCallback(async () => {
    try { setData(await api('/alerts?status=' + status)) } catch (e) { say('error', e.message) }
    setLoading(false)
  }, [status, say])
  useEffect(() => { setLoading(true); load() }, [load])
  const check = async () => {
    setChecking(true)
    try {
      const r = await api('/alerts/run', 'POST')
      say('ok', 'Checked ' + r.rules_checked + ' rules: ' + r.raised + ' new, ' + r.resolved + ' cleared' + (r.rules_skipped_no_data.length ? ' (' + r.rules_skipped_no_data.length + ' rules need more data)' : ''))
      await load()
    } catch (e) { say('error', e.message) }
    setChecking(false)
  }
  const chips = [['open', 'Open'], ['acknowledged', 'Acknowledged'], ['dismissed', 'Dismissed'], ['resolved', 'Resolved']]
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        {chips.map(([k, label]) => <button key={k} style={btn(status === k)} onClick={() => setStatus(k)}>{label} ({data.counts[k] || 0})</button>)}
        <span style={{ flex: 1 }} />
        <button style={btn()} onClick={() => setShowRules(s => !s)}>{showRules ? 'Hide rules' : 'Rules'}</button>
        <button style={btn(true)} onClick={check} disabled={checking}>{checking ? 'Checking…' : 'Check now'}</button>
      </div>
      {showRules && <div style={{ marginBottom: 14 }}><Rules say={say} /></div>}
      {loading ? <div style={{ color: '#94a3b8' }}>Loading…</div> : data.alerts.length === 0 ? (
        <div style={{ ...box, color: '#475569', fontSize: 14 }}>
          {status === 'open' ? 'Nothing needs your attention right now. The system re-checks every hour; press "Check now" to run the rules immediately.' : 'No ' + status + ' alerts.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12 }}>{data.alerts.map(a => <AlertCard key={a.id} a={a} onChange={load} say={say} />)}</div>
      )}
    </div>
  )
}

// ── Briefs ────────────────────────────────────────────────────────────────
const CADENCE_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', board: 'Board pack' }

function Briefs({ say }) {
  const [settings, setSettings] = useState(null)
  const [briefs, setBriefs] = useState([])
  const [open, setOpen] = useState(null)
  const [busy, setBusy] = useState('')
  const load = useCallback(async () => {
    try {
      const [s, b] = await Promise.all([api('/settings'), api('/briefs?limit=40')])
      setSettings(s); setBriefs(b.briefs.filter(x => x.cadence !== 'board'))
    } catch (e) { say('error', e.message) }
  }, [say])
  useEffect(() => { load() }, [load])
  const saveSettings = async () => {
    try { await api('/settings', 'PUT', settings); say('ok', 'Schedule saved') } catch (e) { say('error', e.message) }
  }
  const generate = async cadence => {
    setBusy(cadence)
    try { const r = await api('/briefs/generate', 'POST', { cadence }); say('ok', r.title + ' is ready'); await load(); await show(r.id) } catch (e) { say('error', e.message) }
    setBusy('')
  }
  const show = async id => {
    if (open && open.id === id) { setOpen(null); return }
    try { setOpen(await api('/briefs/' + id)) } catch (e) { say('error', e.message) }
  }
  if (!settings) return <div style={{ color: '#94a3b8' }}>Loading…</div>
  const tog = k => <label style={{ fontSize: 14, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={settings[k] !== false} onChange={e => setSettings(s => ({ ...s, [k]: e.target.checked }))} />{k.split('_')[0][0].toUpperCase() + k.split('_')[0].slice(1)}</label>
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14 }}>
      <div style={box}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Scheduled briefs</h3>
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#475569' }}>The Digital CFO writes these on its own from live figures. Weekly briefs cover the week starting Monday; monthly briefs cover the last full month.</p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {tog('daily_brief')}{tog('weekly_brief')}{tog('monthly_brief')}
          <label style={{ fontSize: 14, display: 'flex', gap: 6, alignItems: 'center' }}>Ready by
            <select style={input} value={settings.brief_hour} onChange={e => setSettings(s => ({ ...s, brief_hour: Number(e.target.value) }))}>
              {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
            </select> IST
          </label>
          <button style={btn(true)} onClick={saveSettings}>Save schedule</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <span style={{ fontSize: 13, color: '#64748b', alignSelf: 'center' }}>Write one now:</span>
          {['daily', 'weekly', 'monthly'].map(c => <button key={c} style={btn()} disabled={!!busy} onClick={() => generate(c)}>{busy === c ? 'Writing…' : CADENCE_LABEL[c]}</button>)}
        </div>
      </div>
      <div style={box}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Past briefs</h3>
        {briefs.length === 0 && <div style={{ fontSize: 14, color: '#64748b' }}>None yet. Scheduled briefs appear here automatically; you can also write one now.</div>}
        {briefs.map(b => (
          <div key={b.id} style={{ borderTop: '1px solid #f1f5f9', padding: '8px 0' }}>
            <div className="cfo-brief-head" style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }} onClick={() => show(b.id)}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', minWidth: 62 }}>{CADENCE_LABEL[b.cadence]}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{b.title}</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{when(b.generated_at)}</span>
            </div>
            {open && open.id === b.id && <div className="cfo-brief-body" style={{ marginTop: 8, padding: '4px 4px 4px 72px' }}><Markdown text={open.content} />
              {open.tools_used && open.tools_used.length > 0 && <div style={{ fontSize: 12, color: '#94a3b8' }}>Built from: {open.tools_used.join(', ')}</div>}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Board pack ────────────────────────────────────────────────────────────
const responsiveCss = `
.cfo-inbox-row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
@media (max-width: 640px) {
  .cfo-actions button { flex: 1 1 100%; }
  .cfo-brief-body { padding-left: 0 !important; }
  .cfo-brief-head { flex-wrap: wrap; }
}`
const printCss = `
@media print {
  body * { visibility: hidden !important; }
  #board-print, #board-print * { visibility: visible !important; }
  #board-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; border: none !important; }
  .no-print { display: none !important; }
}`

function Kpi({ label, value, sub }) {
  return <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', minWidth: 140, flex: '1 1 140px' }}>
    <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div><div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>{sub && <div style={{ fontSize: 12, color: '#94a3b8' }}>{sub}</div>}
  </div>
}
const okd = d => d && !d.error && d.available !== false

function BoardView({ pack }) {
  const d = pack.data || {}
  const cash = okd(d.cash) ? d.cash.total_cash : null
  const rw = okd(d.runway) ? d.runway : null
  const wc = okd(d.working_capital) ? d.working_capital : null
  const months = okd(d.pnl_trend) ? d.pnl_trend.months : []
  const ytd = okd(d.revenue_ytd_vs_prior) ? d.revenue_ytd_vs_prior : null
  const targets = ['revenue_year', 'revenue_quarter'].map(k => d.targets && d.targets[k]).filter(okd)
  const segs = ['business_unit', 'region', 'product'].map(k => [k, d.segments && d.segments[k]]).filter(([, v]) => okd(v))
  return (
    <div id="board-print" style={{ ...box, padding: 20 }}>
      <h2 style={{ margin: '0 0 2px', fontSize: 20 }}>{pack.title}</h2>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>Generated {when(pack.generated_at)} · figures from live finance data, narrative by the Digital CFO</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <Kpi label="Cash" value={inr(cash)} />
        <Kpi label="Runway (net burn)" value={rw ? (rw.cash_flow_positive ? 'Cash-flow positive' : rw.runway_days_net + ' days') : '—'} />
        <Kpi label="Receivables" value={inr(wc && wc.receivables)} sub={wc ? 'overdue ' + inr(wc.ar_overdue) : ''} />
        <Kpi label="Payables" value={inr(wc && wc.payables)} />
        <Kpi label="DSO / DPO" value={wc ? (wc.dso_days ?? '—') + ' / ' + (wc.dpo_days ?? '—') + ' d' : '—'} />
        <Kpi label="Revenue YTD" value={inr(ytd && ytd.current.value)} sub={ytd && ytd.change_pct !== null ? ytd.change_pct + '% vs last year' : 'no prior-year data'} />
      </div>
      <Markdown text={pack.content} />
      {months.length > 0 && <>
        <h4 style={{ margin: '16px 0 6px' }}>Monthly trend</h4>
        <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead><tr>{['Month', 'Revenue', 'Vendor costs', 'Payroll', 'EBITDA', 'EBITDA %'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{months.map(m => <tr key={m.month}><td style={td}>{m.month}{m.partial_month ? ' (to date)' : ''}</td><td style={td}>{inr(m.revenue)}</td><td style={td}>{inr(m.vendor_costs)}</td><td style={td}>{inr(m.payroll)}</td><td style={td}>{inr(m.ebitda)}</td><td style={td}>{m.ebitda_margin_pct ?? '—'}</td></tr>)}</tbody>
        </table></div>
      </>}
      {targets.length > 0 && <>
        <h4 style={{ margin: '16px 0 6px' }}>Revenue against target</h4>
        <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead><tr>{['Period', 'Scope', 'Target', 'Actual', 'Achieved', 'Status'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{targets.flatMap(t => t.results.map((r, i) => <tr key={t.period_type + i}><td style={td}>{t.period_type} {t.period.from.slice(0, 7)}</td><td style={td}>{r.scope}</td><td style={td}>{inr(r.target)}</td><td style={td}>{inr(r.actual)}</td><td style={td}>{r.achievement_pct ?? '—'}%</td><td style={td}>{r.status.replace('_', ' ')}</td></tr>))}</tbody>
        </table></div>
      </>}
      {segs.map(([k, s]) => <div key={k}>
        <h4 style={{ margin: '16px 0 6px' }}>Revenue by {k.replace('_', ' ')} (year to date)</h4>
        <div style={{ overflowX: 'auto' }}><table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead><tr>{['Name', 'This year', 'Last year', 'Change', 'Share'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>{s.items.map(r => <tr key={r.name}><td style={td}>{r.name}</td><td style={td}>{inr(r.current)}</td><td style={td}>{inr(r.previous)}</td><td style={td}>{r.change_pct === null ? '—' : r.change_pct + '%'}</td><td style={td}>{r.share_pct}%</td></tr>)}</tbody>
        </table></div>
      </div>)}
      {Array.isArray(d.open_alerts) && d.open_alerts.length > 0 && <>
        <h4 style={{ margin: '16px 0 6px' }}>Open items raised by the system</h4>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>{d.open_alerts.map((a, i) => <li key={i} style={{ marginBottom: 3 }}><strong>{(SEV[a.severity] || SEV.info).label}:</strong> {a.title}</li>)}</ul>
      </>}
    </div>
  )
}

function BoardPack({ say }) {
  const [packs, setPacks] = useState([])
  const [view, setView] = useState(null)
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => { try { setPacks((await api('/briefs?cadence=board&limit=20')).briefs) } catch (e) { say('error', e.message) } }, [say])
  useEffect(() => { load() }, [load])
  const open = async id => { try { setView(await api('/briefs/' + id)) } catch (e) { say('error', e.message) } }
  const generate = async () => {
    setBusy(true)
    try { const r = await api('/board-pack', 'POST'); await load(); await open(r.id); say('ok', 'Board pack ready') } catch (e) { say('error', e.message) }
    setBusy(false)
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14 }}>
      <style>{printCss}</style>
      <div className="no-print" style={{ ...box, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 280px', fontSize: 13, color: '#475569' }}>One click builds a board-ready summary from current figures: performance, cash, targets, segments, customers, risks and the matters for the board. It takes up to a minute.</div>
        <button style={btn(true)} onClick={generate} disabled={busy}>{busy ? 'Building…' : 'Generate board pack'}</button>
        {view && <button style={btn()} onClick={() => window.print()}>Print / save as PDF</button>}
      </div>
      {packs.length > 0 && <div className="no-print" style={box}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Earlier packs</div>
        {packs.map(p => <div key={p.id} style={{ display: 'flex', gap: 10, padding: '5px 0', borderTop: '1px solid #f1f5f9', cursor: 'pointer', fontSize: 14 }} onClick={() => open(p.id)}>
          <span style={{ flex: 1, fontWeight: view && view.id === p.id ? 700 : 400 }}>{p.title}</span><span style={{ fontSize: 12, color: '#94a3b8' }}>{when(p.generated_at)}</span>
        </div>)}
      </div>}
      {view ? <BoardView pack={view} /> : <div className="no-print" style={{ fontSize: 14, color: '#64748b' }}>No pack selected.</div>}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function CFOInbox() {
  const [tab, setTab] = useState('alerts')
  const [msg, setMsg] = useState(null)
  const say = useCallback((type, text) => { setMsg({ type, text }); if (type === 'ok') setTimeout(() => setMsg(null), 4000) }, [])
  const tabs = [['alerts', 'Alerts & questions'], ['briefs', 'Scheduled briefs'], ['board', 'Board pack']]
  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: 1080, margin: '0 auto', boxSizing: 'border-box', width: '100%', fontSize: 14 }}>
      <style>{responsiveCss}</style>
      <p className="no-print" style={{ margin: '0 0 14px', fontSize: 13.5, lineHeight: 1.5, color: '#475569', maxWidth: 760 }}>
        The Digital CFO watches your numbers on its own, raises questions when something crosses a threshold, writes daily, weekly and monthly briefs, and prepares board packs.
      </p>
      <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {tabs.map(([k, label]) => <button key={k} onClick={() => setTab(k)} style={{ ...btn(tab === k), padding: '8px 14px' }}>{label}</button>)}
      </div>
      <Msg msg={msg} />
      {tab === 'alerts' && <Alerts say={say} />}
      {tab === 'briefs' && <Briefs say={say} />}
      {tab === 'board' && <BoardPack say={say} />}
    </div>
  )
}
