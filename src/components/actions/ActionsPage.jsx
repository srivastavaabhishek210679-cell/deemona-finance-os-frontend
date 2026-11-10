import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';

const hdr = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.getItem('token') ?? '') });
const call = async (method, url, body) => {
  try {
    const r = await fetch(apiURL(url), { method, headers: hdr(), body: body ? JSON.stringify(body) : undefined });
    const t = await r.text(); let d = {}; try { d = JSON.parse(t); } catch { /* ignore */ }
    return r.ok ? d : { error: d.error || ('Request failed (' + r.status + ')'), status: r.status };
  } catch (e) { return { error: e.message }; }
};
const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const when = s => s ? new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

const card = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 18, marginBottom: 14 };
const btn = (bg, fg) => ({ background: bg, color: fg, border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' });
const TYPE = {
  payment_reminder_email: ['Email reminder', '#DBEAFE', '#1E40AF'],
  payment_reminder_whatsapp: ['WhatsApp reminder', '#DCFCE7', '#166534'],
  board_report: ['Board report', '#EDE9FE', '#5B21B6'],
  compliance_task: ['Compliance task', '#FEF3C7', '#92400E'],
};
const STATUS = { proposed: ['Waiting', '#FEF3C7', '#92400E'], executed: ['Done', '#DCFCE7', '#166534'], rejected: ['Rejected', '#F1F5F9', '#475569'], failed: ['Failed', '#FEE2E2', '#991B1B'], expired: ['Expired', '#F1F5F9', '#475569'], approved: ['Running', '#DBEAFE', '#1E40AF'] };
const Pill = ({ t }) => <span style={{ background: t[1], color: t[2], fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, whiteSpace: 'nowrap' }}>{t[0]}</span>;

function ActionCard({ a, onDone, setMsg }) {
  const p = a.payload || {};
  const isRem = a.type.startsWith('payment_reminder');
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(p.message || '');
  const [busy, setBusy] = useState(false);
  const edited = isRem && text !== p.message;
  const approve = async () => {
    if (!window.confirm(isRem ? 'Send this reminder to ' + p.customer + ' now?' : 'Approve and run this action now?')) return;
    setBusy(true); setMsg(null);
    const d = await call('POST', '/api/actions/' + a.id + '/approve', edited ? { message: text } : {});
    setBusy(false);
    if (d.error) setMsg({ ok: false, text: d.error }); else setMsg({ ok: true, text: 'Done: ' + a.title });
    onDone();
  };
  const reject = async () => {
    setBusy(true); setMsg(null);
    const d = await call('POST', '/api/actions/' + a.id + '/reject', {});
    setBusy(false);
    if (d.error) setMsg({ ok: false, text: d.error }); else setMsg({ ok: true, text: 'Rejected. Nothing was sent.' });
    onDone();
  };
  const waiting = a.status === 'proposed';
  return (
    <div style={card}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
        <Pill t={TYPE[a.type] || [a.type, '#F1F5F9', '#475569']} />
        <Pill t={STATUS[a.status] || [a.status, '#F1F5F9', '#475569']} />
        <span style={{ fontSize: 12, color: '#64748B' }}>Code {a.code} · proposed {when(a.proposed_at)}{a.proposed_by === 'digital-cfo' ? ' by your Digital CFO' : ''}</span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{a.title}</div>
      <div style={{ fontSize: 14, color: '#475569', margin: '4px 0 10px' }}>{a.summary}</div>
      {isRem && <div style={{ fontSize: 13, color: '#334155' }}>To: <b>{p.to}</b> · {p.invoices ? p.invoices.length : 0} invoice(s), {inr(p.total_overdue)} overdue</div>}
      {a.type === 'board_report' && <div style={{ fontSize: 13, color: '#334155' }}>Will be emailed to <b>{p.to}</b></div>}
      {a.type === 'compliance_task' && <div style={{ fontSize: 13, color: '#334155' }}>Due {p.due_date} · {p.description}</div>}
      {isRem && (
        <div style={{ marginTop: 10 }}>
          <button onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', color: '#4338CA', cursor: 'pointer', fontSize: 13, padding: 0, fontWeight: 600 }}>{open ? 'Hide message' : (waiting ? 'View / edit message' : 'View message')}</button>
          {open && (
            <textarea value={waiting ? text : (a.result && a.result.message_sent) || p.message} onChange={e => setText(e.target.value)} readOnly={!waiting}
              style={{ width: '100%', boxSizing: 'border-box', minHeight: 190, marginTop: 8, padding: 10, border: '1px solid #CBD5E1', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }} />
          )}
          {open && waiting && edited && <div style={{ fontSize: 12, color: '#B45309', marginTop: 4 }}>Your edited message will be sent instead of the proposed one.</div>}
        </div>
      )}
      {waiting && (
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button disabled={busy} onClick={approve} style={btn('#4338CA', '#fff')}>{busy ? 'Working…' : (isRem ? 'Approve and send' : 'Approve')}</button>
          <button disabled={busy} onClick={reject} style={btn('#F1F5F9', '#334155')}>Reject</button>
        </div>
      )}
      {a.status === 'executed' && <div style={{ fontSize: 12, color: '#166534', marginTop: 8 }}>Done {when(a.executed_at)} · approved by {a.decided_by_email}</div>}
      {a.status === 'rejected' && <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>Rejected {when(a.decided_at)} by {a.decided_by_email}</div>}
      {a.status === 'failed' && <div style={{ fontSize: 12, color: '#991B1B', marginTop: 8 }}>Approved by {a.decided_by_email} but could not be completed: {a.error}</div>}
    </div>
  );
}

export default function ActionsPage() {
  const [tab, setTab] = useState('open');
  const [rows, setRows] = useState([]);
  const [audit, setAudit] = useState([]);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState('');
  const [channels, setChannels] = useState({ email: true, whatsapp: false });

  const load = useCallback(async () => {
    setErr(null);
    if (tab === 'audit') {
      const d = await call('GET', '/api/actions/audit');
      if (d.error) setErr(d.status === 403 ? 'Only company admins can see Actions.' : d.error); else setAudit(d.audit || []);
    } else {
      const d = await call('GET', '/api/actions?scope=' + (tab === 'open' ? 'open' : 'history'));
      if (d.error) setErr(d.status === 403 ? 'Only company admins can see Actions.' : d.error); else setRows(d.actions || []);
    }
  }, [tab]);
  useEffect(() => { load(); }, [load]);

  const propose = async (kind) => {
    setBusy(kind); setMsg(null);
    let d;
    if (kind === 'reminders') {
      const ch = Object.keys(channels).filter(k => channels[k]);
      if (!ch.length) { setBusy(''); setMsg({ ok: false, text: 'Choose email, WhatsApp or both.' }); return; }
      d = await call('POST', '/api/actions/propose/reminders', { channels: ch });
    } else d = await call('POST', '/api/actions/propose/' + kind, {});
    setBusy('');
    if (d.error) { setMsg({ ok: false, text: d.error }); return; }
    const n = (d.proposed || []).length, sk = (d.skipped || []);
    setMsg({ ok: true, text: n + ' new proposal' + (n === 1 ? '' : 's') + ' added.' + (sk.length ? ' Skipped ' + sk.length + ': ' + sk.slice(0, 3).map(s => (s.customer || s.title || '') + ' (' + s.reason + ')').join('; ') + (sk.length > 3 ? '…' : '') : '') });
    setTab('open'); load();
  };

  const tabBtn = (k, l) => <button key={k} onClick={() => setTab(k)} style={{ ...btn(tab === k ? '#4338CA' : '#F1F5F9', tab === k ? '#fff' : '#334155'), padding: '8px 14px' }}>{l}</button>;
  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ ...card, background: '#EEF2FF', borderColor: '#C7D2FE' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1E1B4B' }}>Your Digital CFO recommends. You decide.</div>
        <div style={{ fontSize: 13, color: '#475569', margin: '4px 0 12px' }}>Nothing is sent or changed until a company admin approves it. Every proposal, approval and result is recorded in the audit log. You can also approve on WhatsApp: reply OK or NO with the action code.</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button disabled={!!busy} onClick={() => propose('reminders')} style={btn('#4338CA', '#fff')}>{busy === 'reminders' ? 'Checking…' : 'Propose payment reminders'}</button>
          <label style={{ fontSize: 13, color: '#334155' }}><input type="checkbox" checked={channels.email} onChange={e => setChannels({ ...channels, email: e.target.checked })} /> Email</label>
          <label style={{ fontSize: 13, color: '#334155' }}><input type="checkbox" checked={channels.whatsapp} onChange={e => setChannels({ ...channels, whatsapp: e.target.checked })} /> WhatsApp</label>
          <button disabled={!!busy} onClick={() => propose('board-report')} style={btn('#fff', '#4338CA')}>{busy === 'board-report' ? '…' : 'Propose board report'}</button>
          <button disabled={!!busy} onClick={() => propose('compliance')} style={btn('#fff', '#4338CA')}>{busy === 'compliance' ? '…' : 'Propose compliance tasks'}</button>
        </div>
      </div>
      {msg && <div style={{ ...card, padding: 12, background: msg.ok ? '#F0FDF4' : '#FEF2F2', borderColor: msg.ok ? '#BBF7D0' : '#FECACA', color: msg.ok ? '#166534' : '#991B1B', fontSize: 14 }}>{msg.text}</div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>{tabBtn('open', 'Waiting for approval')}{tabBtn('history', 'History')}{tabBtn('audit', 'Audit log')}</div>
      {err && <div style={{ ...card, color: '#991B1B', background: '#FEF2F2', borderColor: '#FECACA' }}>{err}</div>}
      {!err && tab !== 'audit' && rows.length === 0 && <div style={{ ...card, color: '#64748B', textAlign: 'center' }}>{tab === 'open' ? 'Nothing is waiting for approval. Use the buttons above, or ask the Digital CFO to propose actions.' : 'No past actions yet.'}</div>}
      {!err && tab !== 'audit' && rows.map(a => <ActionCard key={a.id} a={a} onDone={load} setMsg={setMsg} />)}
      {!err && tab === 'audit' && (
        <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#F8FAFC', textAlign: 'left', color: '#475569' }}><th style={{ padding: 10 }}>When</th><th style={{ padding: 10 }}>Event</th><th style={{ padding: 10 }}>By</th><th style={{ padding: 10 }}>Action</th></tr></thead>
            <tbody>
              {audit.length === 0 && <tr><td colSpan={4} style={{ padding: 16, color: '#64748B', textAlign: 'center' }}>No activity yet.</td></tr>}
              {audit.map(e => (
                <tr key={e.id} style={{ borderTop: '1px solid #E2E8F0' }}>
                  <td style={{ padding: 10, whiteSpace: 'nowrap' }}>{when(e.at)}</td>
                  <td style={{ padding: 10, fontWeight: 600 }}>{e.event}</td>
                  <td style={{ padding: 10 }}>{e.actor}</td>
                  <td style={{ padding: 10 }}>{e.title || ''}{e.event === 'failed' && e.detail && e.detail.error ? ' - ' + e.detail.error : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
