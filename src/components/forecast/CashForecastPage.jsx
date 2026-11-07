import { useState, useEffect, useCallback, useRef } from 'react';
import { apiURL } from '../../api.js';

const hdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const short = n => {
  const a = Math.abs(n), s = n < 0 ? '-' : '';
  if (a >= 1e7) return s + '₹' + (a / 1e7).toFixed(2) + ' Cr';
  if (a >= 1e5) return s + '₹' + (a / 1e5).toFixed(2) + ' L';
  return s + '₹' + Math.round(a).toLocaleString('en-IN');
};
const fmtDate = s => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20, marginBottom: 16 };
const input = { padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box' };
const label = { fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' };
const COLORS = { base: '#1B4FD8', slow30: '#D97706', custom: '#7C3AED' };
const DASH = { base: '', slow30: '6 4', custom: '2 3' };

function Chart({ scenarios }) {
  const W = 800, H = 280, L = 70, R = 16, T = 16, B = 28;
  const all = scenarios.flatMap(s => s.points.map(p => p.close).concat([s.opening]));
  let lo = Math.min(0, ...all), hi = Math.max(0, ...all);
  const mn = Math.min(...all), mx = Math.max(...all);
  // Cash far above zero: zoom in so movements are visible instead of a flat line.
  const zoomed = mn > 0 && (mx - mn) < 0.5 * mx;
  if (zoomed) { const pad = Math.max((mx - mn) * 0.4, mx * 0.002); lo = mn - pad; hi = mx + pad; }
  if (hi === lo) hi = lo + 1;
  const raw = (hi - lo) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(v => v >= raw);
  lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
  const n = scenarios[0].points.length;
  const x = i => L + (i / n) * (W - L - R);
  const y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const ticks = []; for (let t = lo; t <= hi + step / 2; t += step) ticks.push(t);
  const path = s => 'M' + x(0) + ' ' + y(s.opening) + ' ' + s.points.map((p, i) => 'L' + x(i + 1) + ' ' + y(p.close)).join(' ');
  const labels = [0, Math.round(n / 3), Math.round((2 * n) / 3), n];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Projected cash balance by day">
      {ticks.map((t, k) => (
        <g key={k}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#E2E8F0" />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#64748B">{short(t)}</text>
        </g>
      ))}
      {lo <= 0 && hi >= 0 && <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="#B91C1C" strokeWidth="1.2" strokeDasharray="3 3" />}
      {labels.map((i, k) => (
        <text key={k} x={x(i)} y={H - 8} textAnchor={k === 0 ? 'start' : k === labels.length - 1 ? 'end' : 'middle'} fontSize="11" fill="#64748B">
          {i === 0 ? 'Today' : fmtDate(scenarios[0].points[i - 1].date)}
        </text>
      ))}
      {scenarios.map(s => <path key={s.key} d={path(s)} fill="none" stroke={COLORS[s.key]} strokeWidth="2.2" strokeDasharray={DASH[s.key]} strokeLinejoin="round" />)}
    </svg>
  );
}

function RecommendationsCard({ days }) {
  const [d, setD] = useState(null);
  const [e, setE] = useState(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch(apiURL('/api/recommendations?days=' + days), { headers: hdr() });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setE(j.error || 'Could not load recommendations'); else { setD(j); setE(null); }
    } catch (x) { setE(x.message); }
  }, [days]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const h = () => load(); window.addEventListener('deemona_data_change', h); return () => window.removeEventListener('deemona_data_change', h); }, [load]);
  const tone = { shortfall: '#DC2626', chase: '#1B4FD8', delay_bill: '#D97706', data: '#D97706', ok: '#16A34A' };
  const tag = { shortfall: 'Shortfall', chase: 'Chase', delay_bill: 'Delay bill', data: 'Set up', ok: 'All clear' };
  return (
    <div style={card}>
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Recommended actions</div>
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>What to do next, worked out from your open invoices and bills. Suggestions only: nothing is sent or changed for you.</div>
      {e && <div style={{ color: '#DC2626', fontSize: 13 }}>{e}</div>}
      {!d && !e && <div style={{ color: '#64748B', fontSize: 13 }}>Loading…</div>}
      {d && d.recommendations.map((r, i) => (
        <div key={i} style={{ borderTop: i ? '1px solid #E2E8F0' : 'none', padding: '10px 0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ background: tone[r.type] + '1A', color: tone[r.type], fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap', marginTop: 2 }}>{tag[r.type]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{r.title}</div>
            <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>{r.detail}</div>
            {r.effect && <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{r.effect}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CashForecastPage() {
  const [days, setDays] = useState(90);
  const [arDelay, setArDelay] = useState(0);
  const [pct, setPct] = useState(100);
  const [apDelay, setApDelay] = useState(0);
  const [mOut, setMOut] = useState('');
  const [mIn, setMIn] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);
  const [saved, setSaved] = useState([]);
  const [saveName, setSaveName] = useState('');
  const [saveMsg, setSaveMsg] = useState(null);
  const [ai, setAi] = useState({ text: '', key: '', loading: false, err: null });

  const settings = () => ({ days, ar_delay_days: arDelay, collection_pct: pct, ap_delay_days: apDelay, monthly_outflow: Number(mOut) || 0, monthly_inflow: Number(mIn) || 0 });
  const settingsKey = JSON.stringify(settings());
  const api = async (method, url, body) => {
    try {
      const r = await fetch(apiURL(url), { method, headers: hdr(), body: body ? JSON.stringify(body) : undefined });
      const t = await r.text(); let d = {}; try { d = JSON.parse(t); } catch { /* ignore */ }
      return r.ok ? d : { error: d.error || ('Request failed (' + r.status + ')') };
    } catch (e) { return { error: e.message }; }
  };
  const loadSaved = useCallback(async () => { const d = await api('GET', '/api/cash-forecast/scenarios'); if (d.scenarios) setSaved(d.scenarios); }, []);
  useEffect(() => { loadSaved(); }, [loadSaved]);
  const saveScenario = async () => {
    setSaveMsg(null);
    const d = await api('POST', '/api/cash-forecast/scenarios', { name: saveName, params: settings() });
    if (d.error) { setSaveMsg({ ok: false, text: d.error }); return; }
    setSaveName(''); setSaveMsg({ ok: true, text: 'Saved.' }); loadSaved();
  };
  const useScenario = sc => {
    const p = sc.params || {};
    setDays(p.days || 90); setArDelay(p.ar_delay_days || 0); setPct(p.collection_pct == null ? 100 : p.collection_pct);
    setApDelay(p.ap_delay_days || 0); setMOut(p.monthly_outflow ? String(p.monthly_outflow) : ''); setMIn(p.monthly_inflow ? String(p.monthly_inflow) : '');
  };
  const delScenario = async sc => {
    if (!window.confirm('Delete the saved scenario "' + sc.name + '"?')) return;
    const d = await api('DELETE', '/api/cash-forecast/scenarios/' + sc.id);
    if (d.error) setSaveMsg({ ok: false, text: d.error }); else loadSaved();
  };
  const explain = async () => {
    setAi(a => ({ ...a, loading: true, err: null }));
    const key = settingsKey;
    const d = await api('POST', '/api/cash-forecast/commentary', settings());
    if (d.error) setAi(a => ({ ...a, loading: false, err: d.error })); else setAi({ text: d.text, key, loading: false, err: null });
  };

  const load = useCallback(async () => {
    const my = ++seq.current;
    setBusy(true); setErr(null);
    const qs = new URLSearchParams({ days, ar_delay_days: arDelay, collection_pct: pct, ap_delay_days: apDelay, monthly_outflow: mOut || 0, monthly_inflow: mIn || 0 });
    try {
      const r = await fetch(apiURL('/api/cash-forecast?' + qs), { headers: hdr() });
      const t = await r.text(); let d = {}; try { d = JSON.parse(t); } catch { /* ignore */ }
      if (my !== seq.current) return;
      if (!r.ok) setErr(d.error || ('Request failed (' + r.status + ')')); else setData(d);
    } catch (e) { if (my === seq.current) setErr(e.message); }
    if (my === seq.current) setBusy(false);
  }, [days, arDelay, pct, apDelay, mOut, mIn]);

  useEffect(() => { const t = setTimeout(load, 350); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    const h = () => load();
    window.addEventListener('deemona_data_change', h);
    return () => window.removeEventListener('deemona_data_change', h);
  }, [load]);

  const base = data && data.scenarios.find(s => s.key === 'base');
  const slow = data && data.scenarios.find(s => s.key === 'slow30');
  const custom = data && data.scenarios.find(s => s.key === 'custom');
  const focus = custom || slow;

  const verdict = () => {
    if (!data) return null;
    const bad = data.scenarios.filter(s => s.first_negative);
    if (bad.length === 0) return { ok: true, text: `Cash stays positive in every case over the next ${base.opts.days} days. Lowest point: ${short(Math.min(...data.scenarios.map(s => s.lowest.amount)))}.` };
    const s = bad[0];
    return { ok: false, text: `In "${s.label}", cash runs out on ${fmtDate(s.first_negative)} and bottoms at ${short(s.lowest.amount)} on ${fmtDate(s.lowest.date)}. You would need about ${short(s.shortfall)} of cover.` };
  };
  const v = verdict();

  return (
    <div style={{ padding: 24, maxWidth: 980 }}>
      {data && !data.has_cash_entry && (
        <div style={{ ...card, background: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E', fontSize: 14 }}>
          You have not entered a cash balance yet, so the forecast starts from ₹0. Add one on the Cash Balance page for a meaningful result.
        </div>
      )}
      {err && <div style={{ ...card, background: '#FEF2F2', borderColor: '#FECACA', color: '#B91C1C', fontSize: 14 }}>{err}</div>}

      {v && (
        <div style={{ ...card, background: v.ok ? '#F0FDF4' : '#FEF2F2', borderColor: v.ok ? '#BBF7D0' : '#FECACA' }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: v.ok ? '#15803D' : '#B91C1C' }}>{v.ok ? 'Cash outlook: healthy' : 'Cash outlook: shortfall risk'}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', marginTop: 6 }}>{v.text}</div>
        </div>
      )}

      {data && base && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          {[
            ['Cash today', inr(data.opening), '#0F172A'],
            [`Cash in ${base.opts.days} days (as booked)`, inr(base.closing), base.closing < 0 ? '#B91C1C' : '#0F172A'],
            ['Lowest point (as booked)', inr(base.lowest.amount) + ' · ' + fmtDate(base.lowest.date), base.lowest.amount < 0 ? '#B91C1C' : '#0F172A'],
            focus ? [`Cash in ${base.opts.days} days (${focus.key === 'custom' ? 'your scenario' : '30 days late'})`, inr(focus.closing), focus.closing < 0 ? '#B91C1C' : '#0F172A'] : null,
          ].filter(Boolean).map(([k, val, c], i) => (
            <div key={i} style={{ ...card, marginBottom: 0, padding: 16 }}>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{k}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: c, marginTop: 4 }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Projected cash balance {busy && <span style={{ fontSize: 12, color: '#64748B', fontWeight: 400 }}>updating…</span>}</div>
          <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#475569', flexWrap: 'wrap' }}>
            {data && data.scenarios.map(s => (
              <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <svg width="26" height="8"><line x1="0" x2="26" y1="4" y2="4" stroke={COLORS[s.key]} strokeWidth="2.5" strokeDasharray={DASH[s.key]} /></svg>{s.label}
              </span>
            ))}
          </div>
        </div>
        {data ? <Chart scenarios={data.scenarios} /> : <div style={{ color: '#64748B', fontSize: 14 }}>Loading…</div>}
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>The red dashed line marks zero cash. When cash stays well above zero, the vertical scale is zoomed in so changes are visible.</div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Explain this forecast</div>
            <div style={{ fontSize: 13, color: '#64748B' }}>A short plain-language read of the chart. The AI only explains the figures calculated above.</div>
          </div>
          <button onClick={explain} disabled={ai.loading || !data} style={{ padding: '9px 18px', background: '#1B4FD8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: ai.loading ? 'default' : 'pointer', opacity: ai.loading ? 0.6 : 1 }}>{ai.loading ? 'Writing…' : (ai.text ? 'Explain again' : 'Explain')}</button>
        </div>
        {ai.err && <div style={{ fontSize: 13, color: '#B91C1C', marginTop: 10 }}>{ai.err}</div>}
        {ai.text && (
          <div style={{ marginTop: 12, padding: 14, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}>
            <div style={{ fontSize: 14, color: '#0F172A', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{ai.text}</div>
            <div style={{ fontSize: 11, color: ai.key === settingsKey ? '#64748B' : '#B45309', marginTop: 8 }}>
              {ai.key === settingsKey ? 'AI-written from the numbers above. It can make mistakes, so check the figures against the chart.' : 'Your settings changed after this was written. Press Explain again to refresh it.'}
            </div>
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Try your own scenario</div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>Change anything below and the chart updates. A third line appears once your settings differ from the two built-in cases.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div><label style={label}>Forecast length</label>
            <select style={input} value={days} onChange={e => setDays(Number(e.target.value))}>{[30, 60, 90, 180].map(d => <option key={d} value={d}>{d} days</option>)}</select></div>
          <div><label style={label}>Customers pay late by: {arDelay} days</label>
            <input type="range" min="0" max="90" step="5" value={arDelay} onChange={e => setArDelay(Number(e.target.value))} style={{ width: '100%' }} /></div>
          <div><label style={label}>Share of receivables actually collected: {pct}%</label>
            <input type="range" min="0" max="100" step="5" value={pct} onChange={e => setPct(Number(e.target.value))} style={{ width: '100%' }} /></div>
          <div><label style={label}>You pay suppliers late by: {apDelay} days</label>
            <input type="range" min="0" max="60" step="5" value={apDelay} onChange={e => setApDelay(Number(e.target.value))} style={{ width: '100%' }} /></div>
          <div><label style={label}>Other monthly costs not in bills, e.g. salaries (₹)</label>
            <input style={input} type="number" min="0" placeholder="0" value={mOut} onChange={e => setMOut(e.target.value)} /></div>
          <div><label style={label}>New monthly sales not yet invoiced (₹)</label>
            <input style={input} type="number" min="0" placeholder="0" value={mIn} onChange={e => setMIn(e.target.value)} /></div>
        </div>
        <div style={{ borderTop: '1px solid #F1F5F9', marginTop: 18, paddingTop: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Saved scenarios</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            <input style={{ ...input, width: 240 }} maxLength={80} placeholder="Name these settings, e.g. Slow October" value={saveName} onChange={e => setSaveName(e.target.value)} />
            <button onClick={saveScenario} disabled={!saveName.trim()} style={{ padding: '9px 16px', background: '#fff', color: '#1B4FD8', border: '1px solid #1B4FD8', borderRadius: 8, fontWeight: 600, cursor: saveName.trim() ? 'pointer' : 'default', opacity: saveName.trim() ? 1 : 0.5 }}>Save current settings</button>
            {saveMsg && <span style={{ fontSize: 13, color: saveMsg.ok ? '#15803D' : '#B91C1C' }}>{saveMsg.text}</span>}
          </div>
          {saved.length === 0 ? <div style={{ fontSize: 13, color: '#64748B' }}>Nothing saved yet.</div> : saved.map(sc => {
            const p = sc.params || {};
            const bits = [p.days + ' days', p.ar_delay_days ? 'customers ' + p.ar_delay_days + 'd late' : null, p.collection_pct < 100 ? p.collection_pct + '% collected' : null, p.ap_delay_days ? 'suppliers paid ' + p.ap_delay_days + 'd late' : null, p.monthly_outflow ? inr(p.monthly_outflow) + '/mo costs' : null, p.monthly_inflow ? inr(p.monthly_inflow) + '/mo new sales' : null].filter(Boolean).join(' · ');
            return (
              <div key={sc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderTop: '1px solid #F1F5F9', fontSize: 13 }}>
                <div><div style={{ fontWeight: 600 }}>{sc.name}</div><div style={{ fontSize: 12, color: '#64748B' }}>{bits}</div></div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => useScenario(sc)} style={{ background: 'none', border: 'none', color: '#1B4FD8', fontWeight: 600, cursor: 'pointer' }}>Load</button>
                  <button onClick={() => delScenario(sc)} style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <RecommendationsCard days={days} />

      {data && (
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>What the forecast is built from</div>
          <div style={{ fontSize: 13, color: '#64748B', marginBottom: 10 }}>{data.counts.receivables} open sales invoice(s) and {data.counts.payables} approved bill(s), by due date. Overdue amounts are assumed to arrive in 7 days (receipts) or tomorrow (payments). Drafts and bills awaiting approval are not counted.</div>
          {data.upcoming.length === 0 ? <div style={{ fontSize: 13, color: '#64748B' }}>No open invoices or bills yet.</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ textAlign: 'left', color: '#64748B' }}>
                <th style={{ padding: '6px 8px' }}>Due</th><th style={{ padding: '6px 8px' }}>Item</th><th style={{ padding: '6px 8px' }}>Party</th><th style={{ padding: '6px 8px', textAlign: 'right' }}>Amount</th>
              </tr></thead>
              <tbody>
                {data.upcoming.map((u, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px' }}>{fmtDate(u.due)}{u.overdue && <span style={{ color: '#B91C1C', fontSize: 11 }}> overdue</span>}</td>
                    <td style={{ padding: '8px' }}>{u.kind === 'in' ? 'Receive' : 'Pay'} · {u.ref}</td>
                    <td style={{ padding: '8px', color: '#64748B' }}>{u.party}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: u.kind === 'in' ? '#15803D' : '#B91C1C' }}>{u.kind === 'in' ? '+' : '-'}{inr(u.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 12 }}>{data.note} Every number is plain arithmetic on your records. The AI commentary only explains those numbers.</div>
        </div>
      )}
    </div>
  );
}
