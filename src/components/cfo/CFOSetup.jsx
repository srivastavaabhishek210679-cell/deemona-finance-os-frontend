import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { apiURL } from '../../api.js'

// ── API helper (same auth convention as the rest of the app) ──────────────
const token = () => { try { return localStorage.getItem('token') ?? '' } catch { return '' } }
async function api(path, method = 'GET', body) {
  const r = await fetch(apiURL('/api/cfo-setup' + path), {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() },
    body: body ? JSON.stringify(body) : undefined,
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || 'Request failed (' + r.status + ')')
  return j
}

// ── Indian fiscal-year helpers (April–March) ──────────────────────────────
const pad = n => String(n).padStart(2, '0')
const currentFY = () => { const d = new Date(); return d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1 }
const fyLabel = y => 'FY ' + y + '-' + String(y + 1).slice(2)
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthsOfFY = fy => Array.from({ length: 12 }, (_, i) => {
  const m = (3 + i) % 12; const y = m >= 3 ? fy : fy + 1
  return { start: y + '-' + pad(m + 1) + '-01', label: MONTH_NAMES[m] + ' ' + y }
})
const quartersOfFY = fy => [
  { start: fy + '-04-01', label: 'Q1 (Apr–Jun ' + fy + ')' }, { start: fy + '-07-01', label: 'Q2 (Jul–Sep ' + fy + ')' },
  { start: fy + '-10-01', label: 'Q3 (Oct–Dec ' + fy + ')' }, { start: (fy + 1) + '-01-01', label: 'Q4 (Jan–Mar ' + (fy + 1) + ')' },
]
const inr = v => (v === null || v === undefined ? '—' : '₹' + Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 }))
const KIND_LABEL = { business_unit: 'Business unit', region: 'Region', product: 'Product' }
const KINDS = ['business_unit', 'region', 'product']
const TAG_FIELD = { business_unit: 'business_unit_id', region: 'region_id', product: 'product_id' }

// ── small UI pieces ──────────────────────────────────────────────────────
const box = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }
const input = { padding: '8px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, minWidth: 0, background: '#fff' }
const btn = (primary, danger) => ({
  padding: '8px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  border: primary ? 'none' : '1px solid ' + (danger ? '#fecaca' : '#cbd5e1'),
  background: primary ? '#1d4ed8' : '#fff', color: primary ? '#fff' : danger ? '#b91c1c' : '#334155',
})
const th = { textAlign: 'left', padding: '8px 10px', fontSize: 12, color: '#64748b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }
const td = { padding: '8px 10px', fontSize: 14, borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' }

function Msg({ msg }) {
  if (!msg) return null
  const err = msg.type === 'error'
  return <div style={{ margin: '8px 0', padding: '8px 12px', borderRadius: 8, fontSize: 14, background: err ? '#fef2f2' : '#f0fdf4', color: err ? '#b91c1c' : '#166534', border: '1px solid ' + (err ? '#fecaca' : '#bbf7d0') }}>{msg.text}</div>
}

// ── 1. Dimensions ────────────────────────────────────────────────────────
function Dimensions({ dims, reload, say }) {
  const [names, setNames] = useState({ business_unit: '', region: '', product: '' })
  const add = async kind => {
    const name = names[kind].trim(); if (!name) return
    try { await api('/dimensions', 'POST', { kind, name }); setNames(n => ({ ...n, [kind]: '' })); await reload(); say('ok', KIND_LABEL[kind] + ' "' + name + '" added') }
    catch (e) { say('error', e.message) }
  }
  const remove = async d => {
    if (!window.confirm('Deactivate "' + d.name + '"? Past data keeps its name; it just disappears from pickers.')) return
    try { await api('/dimensions/' + d.id, 'DELETE'); await reload() } catch (e) { say('error', e.message) }
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
      {KINDS.map(kind => (
        <div key={kind} style={box}>
          <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>{KIND_LABEL[kind]}s</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input style={{ ...input, flex: 1 }} placeholder={'New ' + KIND_LABEL[kind].toLowerCase() + ' name'} value={names[kind]}
              onChange={e => setNames(n => ({ ...n, [kind]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && add(kind)} />
            <button style={btn(true)} onClick={() => add(kind)}>Add</button>
          </div>
          {(dims[kind] || []).filter(d => d.is_active).length === 0 && <div style={{ color: '#94a3b8', fontSize: 14 }}>None yet</div>}
          {(dims[kind] || []).filter(d => d.is_active).map(d => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 14 }}>{d.name}</span>
              <button style={{ ...btn(false, true), padding: '4px 10px', fontSize: 12 }} onClick={() => remove(d)}>Remove</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── 2. Mapping customers / vendors to dimensions ─────────────────────────
function Mapping({ dims, say }) {
  const [type, setType] = useState('customer')
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [cov, setCov] = useState(null)
  const [loading, setLoading] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [d, c] = await Promise.all([api('/defaults?entity_type=' + type), api('/coverage')])
      setRows(d.entities); setCov(c.coverage)
    } catch (e) { say('error', e.message) }
    setLoading(false)
  }, [type, say])
  useEffect(() => { load() }, [load])

  const set = async (row, kind, value) => {
    const field = TAG_FIELD[kind]
    setRows(rs => rs.map(r => r.entity_id === row.entity_id ? { ...r, [field]: value || null } : r))
    try { await api('/defaults', 'PUT', { entity_type: type, entity_id: row.entity_id, [field]: value || null }) }
    catch (e) { say('error', e.message); load() }
  }
  const shown = useMemo(() => rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase())), [rows, q])
  const active = kind => (dims[kind] || []).filter(d => d.is_active)

  return (
    <div style={box}>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: '#475569' }}>
        Choose the business unit, region and product each {type} belongs to. Every invoice of that {type} is then counted under it automatically.
      </p>
      {cov && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          {KINDS.map(k => (
            <div key={k} style={{ flex: '1 1 160px', background: '#f8fafc', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
              <div style={{ color: '#64748b' }}>{KIND_LABEL[k]} coverage (90 days)</div>
              <div style={{ fontWeight: 700 }}>Revenue {cov[k].revenue_tagged_pct}% · Cost {cov[k].cost_tagged_pct}%</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <select style={input} value={type} onChange={e => setType(e.target.value)}>
          <option value="customer">Customers (revenue)</option><option value="vendor">Vendors (cost)</option>
        </select>
        <input style={{ ...input, flex: 1, minWidth: 140 }} placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {loading && <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead><tr><th style={th}>{type === 'vendor' ? 'Vendor' : 'Customer'}</th>{KINDS.map(k => <th key={k} style={th}>{KIND_LABEL[k]}</th>)}</tr></thead>
          <tbody>
            {shown.map(r => (
              <tr key={r.entity_id}>
                <td style={td}>{r.name}</td>
                {KINDS.map(k => (
                  <td key={k} style={td}>
                    <select style={{ ...input, width: '100%' }} value={r[TAG_FIELD[k]] || ''} onChange={e => set(r, k, e.target.value)}>
                      <option value="">— none —</option>
                      {active(k).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
            {!loading && shown.length === 0 && <tr><td style={td} colSpan={4}>Nothing found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── 3. Targets ───────────────────────────────────────────────────────────
function Targets({ dims, meta, say }) {
  const fy0 = currentFY()
  const [list, setList] = useState([])
  const [f, setF] = useState({ metric: 'revenue', period_type: 'month', fy: fy0, start: monthsOfFY(fy0)[new Date().getMonth() >= 3 ? new Date().getMonth() - 3 : new Date().getMonth() + 9].start, dimKind: '', dimId: '', value: '' })
  const [spread, setSpread] = useState({ metric: 'revenue', fy: fy0, annual: '', alsoAnnual: true })
  const metrics = meta?.target_metrics || {}
  const load = useCallback(async () => { try { setList((await api('/targets')).targets) } catch (e) { say('error', e.message) } }, [say])
  useEffect(() => { load() }, [load])

  const periodOptions = f.period_type === 'month' ? monthsOfFY(f.fy) : f.period_type === 'quarter' ? quartersOfFY(f.fy) : [{ start: f.fy + '-04-01', label: fyLabel(f.fy) }]
  const setPeriodType = pt => {
    const opts = pt === 'month' ? monthsOfFY(f.fy) : pt === 'quarter' ? quartersOfFY(f.fy) : [{ start: f.fy + '-04-01' }]
    setF({ ...f, period_type: pt, start: opts[0].start })
  }
  const setFy = fy => {
    const opts = f.period_type === 'month' ? monthsOfFY(fy) : f.period_type === 'quarter' ? quartersOfFY(fy) : [{ start: fy + '-04-01' }]
    setF({ ...f, fy, start: opts[0].start })
  }
  const canSplit = metrics[f.metric]?.dims

  const save = async () => {
    const v = Number(String(f.value).replace(/,/g, ''))
    if (!Number.isFinite(v) || v < 0 || f.value === '') { say('error', 'Enter a valid target amount'); return }
    const body = { metric: f.metric, period_type: f.period_type, period_start: f.start, target_value: v }
    if (canSplit && f.dimKind && f.dimId) { body.dimension_kind = f.dimKind; body.dimension_id = f.dimId }
    try { await api('/targets', 'PUT', body); setF({ ...f, value: '' }); await load(); say('ok', 'Target saved') } catch (e) { say('error', e.message) }
  }
  const del = async t => { if (!window.confirm('Delete this target?')) return; try { await api('/targets/' + t.id, 'DELETE'); await load() } catch (e) { say('error', e.message) } }

  const doSpread = async () => {
    const total = Number(String(spread.annual).replace(/,/g, ''))
    if (!Number.isFinite(total) || total <= 0) { say('error', 'Enter the annual amount'); return }
    const months = monthsOfFY(spread.fy); const each = Math.floor(total / 12)
    const targets = months.map((m, i) => ({ metric: spread.metric, period_type: 'month', period_start: m.start, target_value: i === 11 ? total - each * 11 : each }))
    if (spread.alsoAnnual) targets.push({ metric: spread.metric, period_type: 'year', period_start: spread.fy + '-04-01', target_value: total })
    try {
      const r = await api('/targets/bulk', 'POST', { targets })
      await load(); say(r.errors.length ? 'error' : 'ok', r.saved + ' targets saved' + (r.errors.length ? ', ' + r.errors.length + ' failed: ' + r.errors[0].error : ''))
    } catch (e) { say('error', e.message) }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={box}>
        <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>Set a target</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <select style={input} value={f.metric} onChange={e => setF({ ...f, metric: e.target.value, dimKind: '', dimId: '' })}>
            {Object.entries(metrics).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
          <select style={input} value={f.period_type} onChange={e => setPeriodType(e.target.value)}>
            <option value="month">Monthly</option><option value="quarter">Quarterly</option><option value="year">Annual</option>
          </select>
          <select style={input} value={f.fy} onChange={e => setFy(Number(e.target.value))}>
            {[fy0 - 1, fy0, fy0 + 1].map(y => <option key={y} value={y}>{fyLabel(y)}</option>)}
          </select>
          {f.period_type !== 'year' && (
            <select style={input} value={f.start} onChange={e => setF({ ...f, start: e.target.value })}>
              {periodOptions.map(o => <option key={o.start} value={o.start}>{o.label}</option>)}
            </select>
          )}
          {canSplit && (
            <>
              <select style={input} value={f.dimKind} onChange={e => setF({ ...f, dimKind: e.target.value, dimId: '' })}>
                <option value="">Company-wide</option>{KINDS.map(k => <option key={k} value={k}>By {KIND_LABEL[k].toLowerCase()}</option>)}
              </select>
              {f.dimKind && (
                <select style={input} value={f.dimId} onChange={e => setF({ ...f, dimId: e.target.value })}>
                  <option value="">Select…</option>{(dims[f.dimKind] || []).filter(d => d.is_active).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}
            </>
          )}
          <input style={{ ...input, width: 160 }} inputMode="numeric" placeholder="Target (₹)" value={f.value} onChange={e => setF({ ...f, value: e.target.value })} />
          <button style={btn(true)} onClick={save}>Save target</button>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>
          {metrics[f.metric]?.higher_is_better === false ? 'This is a spending ceiling: lower is better.' : 'Higher is better.'} Fiscal year runs April–March.
        </p>
      </div>

      <div style={box}>
        <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>Quick fill: spread an annual figure over 12 months</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <select style={input} value={spread.metric} onChange={e => setSpread({ ...spread, metric: e.target.value })}>
            {Object.entries(metrics).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
          <select style={input} value={spread.fy} onChange={e => setSpread({ ...spread, fy: Number(e.target.value) })}>
            {[fy0 - 1, fy0, fy0 + 1].map(y => <option key={y} value={y}>{fyLabel(y)}</option>)}
          </select>
          <input style={{ ...input, width: 170 }} inputMode="numeric" placeholder="Annual total (₹)" value={spread.annual} onChange={e => setSpread({ ...spread, annual: e.target.value })} />
          <label style={{ fontSize: 14 }}><input type="checkbox" checked={spread.alsoAnnual} onChange={e => setSpread({ ...spread, alsoAnnual: e.target.checked })} /> also save as annual target</label>
          <button style={btn(false)} onClick={doSpread}>Spread evenly</button>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>Even split; adjust individual months afterwards for seasonality.</p>
      </div>

      <div style={box}>
        <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>Current targets</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead><tr><th style={th}>Metric</th><th style={th}>Period</th><th style={th}>Scope</th><th style={{ ...th, textAlign: 'right' }}>Target</th><th style={th}></th></tr></thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id}>
                  <td style={td}>{metrics[t.metric]?.label || t.metric}</td>
                  <td style={td}>{t.period_type} · {t.period_start} → {t.period_end}</td>
                  <td style={td}>{t.dimension_name ? KIND_LABEL[t.dimension_kind] + ': ' + t.dimension_name : 'Company-wide'}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{inr(t.target_value)}</td>
                  <td style={td}><button style={{ ...btn(false, true), padding: '4px 10px', fontSize: 12 }} onClick={() => del(t)}>Delete</button></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td style={td} colSpan={5}>No targets yet. Without targets, the CFO agent cannot say whether you are on plan.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── 4. Forecasts ─────────────────────────────────────────────────────────
function Forecasts({ meta, say }) {
  const [list, setList] = useState([])
  const [f, setF] = useState({ metric: 'revenue', month: '', value: '' })
  const now = new Date()
  const upcoming = Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() + i, 1); return { start: d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-01', label: MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear() } })
  const load = useCallback(async () => { try { setList((await api('/forecasts')).forecasts) } catch (e) { say('error', e.message) } }, [say])
  useEffect(() => { load() }, [load])
  const save = async () => {
    const v = Number(String(f.value).replace(/,/g, ''))
    if (!Number.isFinite(v) || v < 0 || f.value === '') { say('error', 'Enter a valid forecast amount'); return }
    try { await api('/forecasts', 'PUT', { metric: f.metric, period_start: f.month || upcoming[0].start, forecast_value: v }); setF({ ...f, value: '' }); await load(); say('ok', 'Forecast saved') } catch (e) { say('error', e.message) }
  }
  const labels = { revenue: 'Revenue', cash_in: 'Cash received', cash_out: 'Cash paid out' }
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={box}>
        <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>Enter your own forecast</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <select style={input} value={f.metric} onChange={e => setF({ ...f, metric: e.target.value })}>
            {(meta?.forecast_metrics || ['revenue']).map(m => <option key={m} value={m}>{labels[m] || m}</option>)}
          </select>
          <select style={input} value={f.month || upcoming[0].start} onChange={e => setF({ ...f, month: e.target.value })}>
            {upcoming.map(o => <option key={o.start} value={o.start}>{o.label}</option>)}
          </select>
          <input style={{ ...input, width: 170 }} inputMode="numeric" placeholder="Forecast (₹)" value={f.value} onChange={e => setF({ ...f, value: e.target.value })} />
          <button style={btn(true)} onClick={save}>Save forecast</button>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b' }}>
          A baseline forecast (average of the last 3 months) is saved automatically each day. Yours replaces it when comparing forecast to actual.
        </p>
      </div>
      <div style={box}>
        <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>Saved forecasts</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <thead><tr><th style={th}>Month</th><th style={th}>Metric</th><th style={th}>Source</th><th style={th}>Made on</th><th style={{ ...th, textAlign: 'right' }}>Forecast</th></tr></thead>
            <tbody>
              {list.map(x => (
                <tr key={x.metric + x.period_start + x.source}>
                  <td style={td}>{x.period_start.slice(0, 7)}</td><td style={td}>{labels[x.metric] || x.metric}</td>
                  <td style={td}>{x.source === 'manual' ? 'You' : 'System baseline'}</td><td style={td}>{x.made_on}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{inr(x.forecast_value)}</td>
                </tr>
              ))}
              {list.length === 0 && <tr><td style={td} colSpan={5}>No forecasts saved yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────
export default function CFOSetup() {
  const [tab, setTab] = useState('dimensions')
  const [dims, setDims] = useState({ business_unit: [], region: [], product: [] })
  const [meta, setMeta] = useState(null)
  const [msg, setMsg] = useState(null)
  const say = useCallback((type, text) => { setMsg({ type, text }); if (type === 'ok') setTimeout(() => setMsg(null), 3000) }, [])
  const reload = useCallback(async () => { try { setDims(await api('/dimensions')) } catch (e) { say('error', e.message) } }, [say])
  useEffect(() => { reload(); api('/meta').then(setMeta).catch(e => say('error', e.message)) }, [reload, say])

  const tabs = [['dimensions', '1. Business units, regions, products'], ['mapping', '2. Map customers & vendors'], ['targets', '3. Targets'], ['forecasts', '4. Forecasts']]
  return (
    <div style={{ padding: '0 0 24px' }}>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: '#475569' }}>
        The CFO agent can only answer plan, business-unit, region and product questions once this information is filled in. Start with step 1 and work through to step 4.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{ ...btn(tab === k), padding: '8px 12px', fontSize: 13 }}>{label}</button>
        ))}
      </div>
      <Msg msg={msg} />
      {tab === 'dimensions' && <Dimensions dims={dims} reload={reload} say={say} />}
      {tab === 'mapping' && <Mapping dims={dims} say={say} />}
      {tab === 'targets' && <Targets dims={dims} meta={meta} say={say} />}
      {tab === 'forecasts' && <Forecasts meta={meta} say={say} />}
    </div>
  )
}
