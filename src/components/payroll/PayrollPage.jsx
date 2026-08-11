import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';

const API = apiURL('/api/payroll');
const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
});
async function apiGet(url) {
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiPost(url, body) {
  const res = await fetch(url, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiPatch(url, body = {}) {
  const res = await fetch(url, { method: 'PATCH', headers: headers(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function formatINR(n) {
  const num = parseFloat(n || 0);
  if (num >= 1e7) return 'Rs ' + (num / 1e7).toFixed(2) + ' Cr';
  if (num >= 1e5) return 'Rs ' + (num / 1e5).toFixed(2) + ' L';
  return 'Rs ' + num.toLocaleString('en-IN');
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '10px 18px', fontSize: 14, fontWeight: 600,
          background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: active === t.id ? '2px solid #6C63FF' : '2px solid transparent',
          color: active === t.id ? '#1B4FD8' : 'var(--text-secondary)', marginBottom: -1,
        }}>{t.label}</button>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    active: '#22C98A', inactive: '#3B5998', terminated: '#FF5C5C',
    draft: '#3B5998', processing: '#F5A623', approved: '#4FC3F7',
    paid: '#22C98A', cancelled: '#FF5C5C', pending: '#F5A623',
  };
  const c = colors[status] || '#3B5998';
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 100, fontSize: 11, fontWeight: 600,
      background: c + '20', color: c,
    }}>{status?.replace(/_/g, ' ').toUpperCase()}</span>
  );
}

// ── Summary Cards ─────────────────────────────────────────────
function SummaryCards({ summary }) {
  if (!summary) return null;
  const cards = [
    { label: 'Total Employees',   value: summary.total_employees || 0,  color: '#1B4FD8', note: summary.active_employees + ' active' },
    { label: 'Full-Time Staff',   value: summary.full_time || 0,         color: '#4FC3F7', note: 'Permanent employees' },
    { label: 'Monthly Payroll',   value: formatINR(summary.monthly_payroll), color: '#22C98A', note: 'Gross salary bill' },
    { label: 'Last Payroll',      value: summary.last_run ? MONTHS[(summary.last_run.month - 1)] + ' ' + summary.last_run.year : 'None',
      color: '#F5A623', note: summary.last_run ? summary.last_run.status : 'No runs yet' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          padding: '18px 20px', borderRadius: 12,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: c.color, marginBottom: 4 }}>{c.value}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{c.label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.note}</div>
        </div>
      ))}
    </div>
  );
}

// ── Employees Tab ─────────────────────────────────────────────
function EmployeesTab({ onRefreshSummary }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employee_code: '', first_name: '', last_name: '', email: '', phone: '',
    designation: '', department: '', date_of_joining: '', employment_type: 'full_time',
    pan: '', bank_account: '', bank_name: '', ifsc: '',
    basic_salary: '', hra: '', special_allowance: '', other_allowances: '',
    pf_applicable: true, esic_applicable: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet(API + '/employees');
      setEmployees(data.employees || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.first_name || !form.employee_code || !form.date_of_joining) {
      alert('Employee code, name and joining date are required');
      return;
    }
    setSaving(true);
    try {
      await apiPost(API + '/employees', form);
      setShowForm(false);
      await load();
      onRefreshSummary();
    } catch (e) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '8px 10px',
    borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface-3)', color: 'var(--text-primary)',
    fontSize: 13, outline: 'none',
  };

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{employees.length} employees</div>
        <button onClick={() => setShowForm(!showForm)} style={{
          padding: '8px 16px', borderRadius: 8, background: 'var(--accent)',
          color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}>+ Add Employee</button>
      </div>

      {showForm && (
        <div style={{ padding: 20, borderRadius: 12, marginBottom: 20, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>New Employee</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            {[
              { label: 'Employee Code', key: 'employee_code', placeholder: 'EMP001' },
              { label: 'First Name',    key: 'first_name',    placeholder: 'Rahul' },
              { label: 'Last Name',     key: 'last_name',     placeholder: 'Sharma' },
              { label: 'Email',         key: 'email',         placeholder: 'rahul@company.com' },
              { label: 'Phone',         key: 'phone',         placeholder: '9876543210' },
              { label: 'Designation',   key: 'designation',   placeholder: 'Senior Manager' },
              { label: 'Department',    key: 'department',    placeholder: 'Finance' },
              { label: 'Date of Joining', key: 'date_of_joining', placeholder: '', type: 'date' },
              { label: 'PAN',           key: 'pan',           placeholder: 'ABCDE1234F' },
              { label: 'Bank Account',  key: 'bank_account',  placeholder: 'Account number' },
              { label: 'Bank Name',     key: 'bank_name',     placeholder: 'HDFC Bank' },
              { label: 'IFSC',          key: 'ifsc',          placeholder: 'HDFC0001234' },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</div>
                <input type={f.type || 'text'} placeholder={f.placeholder} value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={inputStyle} />
              </div>
            ))}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, marginTop: 4 }}>Salary Structure (Monthly)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            {[
              { label: 'Basic Salary',       key: 'basic_salary' },
              { label: 'HRA',                key: 'hra' },
              { label: 'Special Allowance',  key: 'special_allowance' },
              { label: 'Other Allowances',   key: 'other_allowances' },
            ].map(f => (
              <div key={f.key}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label} (Rs)</div>
                <input type="number" placeholder="0" value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={inputStyle} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.pf_applicable}
                onChange={e => setForm(p => ({ ...p, pf_applicable: e.target.checked }))} />
              PF Applicable (12% of basic)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.esic_applicable}
                onChange={e => setForm(p => ({ ...p, esic_applicable: e.target.checked }))} />
              ESIC Applicable (gross &lt;= Rs 21,000)
            </label>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={saving} style={{
              padding: '8px 20px', borderRadius: 8, background: 'var(--accent)',
              color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}>{saving ? 'Saving...' : 'Add Employee'}</button>
            <button onClick={() => setShowForm(false)} style={{
              padding: '8px 16px', borderRadius: 8, background: 'var(--surface-3)',
              border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
            }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      ) : employees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>👥</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No employees yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Add employees to start running payroll</div>
          <button onClick={() => setShowForm(true)} style={{
            padding: '8px 20px', borderRadius: 8, background: 'var(--accent)',
            color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}>+ Add First Employee</button>
        </div>
      ) : (
        <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '80px 1fr 140px 100px 120px 110px 80px',
            padding: '10px 16px', background: 'var(--surface-3)',
            fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em',
          }}>
            <span>CODE</span><span>NAME</span><span>DESIGNATION</span>
            <span>DEPT</span><span style={{ textAlign: 'right' }}>GROSS</span>
            <span>TYPE</span><span>STATUS</span>
          </div>
          {employees.map((emp, i) => {
            const gross = parseFloat(emp.basic_salary) + parseFloat(emp.hra) +
                          parseFloat(emp.special_allowance) + parseFloat(emp.other_allowances);
            return (
              <div key={emp.id} style={{
                display: 'grid', gridTemplateColumns: '80px 1fr 140px 100px 120px 110px 80px',
                padding: '12px 16px', fontSize: 13, alignItems: 'center',
                background: i % 2 === 0 ? 'var(--surface-2)' : 'var(--surface-1)',
                borderTop: '1px solid var(--border)',
              }}>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12 }}>{emp.employee_code}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>{emp.first_name} {emp.last_name}</div>
                  {emp.email && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.email}</div>}
                </div>
                <span style={{ fontSize: 12 }}>{emp.designation || '--'}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.department || '--'}</span>
                <span style={{ textAlign: 'right', fontWeight: 700, color: '#22C98A' }}>{formatINR(gross)}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.employment_type?.replace(/_/g, ' ')}</span>
                <StatusBadge status={emp.status} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Payroll Runs Tab ──────────────────────────────────────────
function PayrollRunsTab({ onRefreshSummary }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [payslipsLoading, setPayslipsLoading] = useState(false);
  const now = new Date();
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [genYear, setGenYear] = useState(now.getFullYear());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet(API + '/runs');
      setRuns(data.runs || []);
    } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadPayslips = async (run) => {
    setSelectedRun(run);
    setPayslipsLoading(true);
    try {
      const data = await apiGet(API + '/runs/' + run.id + '/payslips');
      setPayslips(data.payslips || []);
    } catch { setPayslips([]); }
    finally { setPayslipsLoading(false); }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      await apiPost(API + '/runs/generate', { month: genMonth, year: genYear });
      await load();
      onRefreshSummary();
    } catch (e) { alert('Error: ' + e.message); }
    finally { setGenerating(false); }
  };

  const approve = async (runId) => {
    try {
      await apiPatch(API + '/runs/' + runId + '/approve');
      await load();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const markPaid = async (runId) => {
    try {
      await apiPatch(API + '/runs/' + runId + '/pay');
      await load();
    } catch (e) { alert('Error: ' + e.message); }
  };

  return (
    <div>
      {/* Generate new run */}
      <div style={{
        padding: 20, borderRadius: 12, marginBottom: 20,
        background: 'linear-gradient(135deg, #1A1A35, #22223A)',
        border: '1px solid #6C63FF40',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Generate Payroll</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Auto-calculate salaries, PF, ESIC, TDS for all active employees
          </div>
        </div>
        <select value={genMonth} onChange={e => setGenMonth(parseInt(e.target.value))} style={{
          padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'var(--surface-3)', color: 'var(--text-primary)', fontSize: 14,
        }}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" value={genYear} onChange={e => setGenYear(parseInt(e.target.value))}
          style={{
            padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--surface-3)', color: 'var(--text-primary)', fontSize: 14, width: 90,
          }} />
        <button onClick={generate} disabled={generating} style={{
          padding: '8px 20px', borderRadius: 8, background: 'var(--accent)',
          color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}>{generating ? 'Generating...' : 'Generate'}</button>
      </div>

      {/* Runs list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</div>
      ) : runs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>💸</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No payroll runs yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add employees first, then generate your first payroll run</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {runs.map(run => (
            <div key={run.id} style={{
              padding: '18px 20px', borderRadius: 12,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: selectedRun?.id === run.id ? 16 : 0 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>
                      {MONTHS[run.month - 1]} {run.year}
                    </span>
                    <StatusBadge status={run.status} />
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {run.total_employees} employees
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                    <span>Gross: <strong style={{ color: '#22C98A' }}>{formatINR(run.total_gross)}</strong></span>
                    <span>Deductions: <strong style={{ color: '#FF5C5C' }}>{formatINR(run.total_deductions)}</strong></span>
                    <span>Net Payable: <strong style={{ color: '#1B4FD8' }}>{formatINR(run.total_net)}</strong></span>
                    <span>TDS: <strong>{formatINR(run.total_tds)}</strong></span>
                    <span>Employer PF: <strong>{formatINR(run.total_employer_pf)}</strong></span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => selectedRun?.id === run.id ? setSelectedRun(null) : loadPayslips(run)} style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: 'var(--surface-3)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', cursor: 'pointer',
                  }}>{selectedRun?.id === run.id ? 'Hide' : 'View Payslips'}</button>
                  {run.status === 'draft' && (
                    <button onClick={() => approve(run.id)} style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: '#4FC3F720', border: '1px solid #4FC3F740',
                      color: '#4FC3F7', cursor: 'pointer',
                    }}>Approve</button>
                  )}
                  {run.status === 'approved' && (
                    <button onClick={() => markPaid(run.id)} style={{
                      padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: '#22C98A20', border: '1px solid #22C98A40',
                      color: '#22C98A', cursor: 'pointer',
                    }}>Mark Paid</button>
                  )}
                </div>
              </div>

              {/* Payslips table */}
              {selectedRun?.id === run.id && (
                <div>
                  {payslipsLoading ? (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Loading payslips...</div>
                  ) : (
                    <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden' }}>
                      <div style={{
                        display: 'grid', gridTemplateColumns: '80px 1fr 80px 110px 110px 100px 100px 110px',
                        padding: '8px 14px', background: 'var(--surface-3)',
                        fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em',
                      }}>
                        <span>CODE</span><span>EMPLOYEE</span><span>DEPT</span>
                        <span style={{ textAlign: 'right' }}>GROSS</span>
                        <span style={{ textAlign: 'right' }}>DEDUCTIONS</span>
                        <span style={{ textAlign: 'right' }}>TDS</span>
                        <span style={{ textAlign: 'right' }}>PF</span>
                        <span style={{ textAlign: 'right' }}>NET</span>
                      </div>
                      {payslips.map((p, i) => (
                        <div key={p.id} style={{
                          display: 'grid', gridTemplateColumns: '80px 1fr 80px 110px 110px 100px 100px 110px',
                          padding: '10px 14px', fontSize: 13, alignItems: 'center',
                          background: i % 2 === 0 ? 'var(--surface-2)' : 'var(--surface-1)',
                          borderTop: '1px solid var(--border)',
                        }}>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.employee_code}</span>
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.designation}</div>
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.department}</span>
                          <span style={{ textAlign: 'right', fontWeight: 600, color: '#22C98A' }}>{formatINR(p.gross_salary)}</span>
                          <span style={{ textAlign: 'right', color: '#FF5C5C' }}>{formatINR(p.total_deductions)}</span>
                          <span style={{ textAlign: 'right', color: '#F5A623' }}>{formatINR(p.tds)}</span>
                          <span style={{ textAlign: 'right', color: '#3B5998' }}>{formatINR(p.pf_employee)}</span>
                          <span style={{ textAlign: 'right', fontWeight: 800, color: '#1B4FD8' }}>{formatINR(p.net_salary)}</span>
                        </div>
                      ))}
                      {/* Totals row */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: '80px 1fr 80px 110px 110px 100px 100px 110px',
                        padding: '10px 14px', fontSize: 13, alignItems: 'center',
                        background: 'var(--surface-3)', borderTop: '2px solid var(--border)',
                        fontWeight: 700,
                      }}>
                        <span></span><span>TOTAL</span><span></span>
                        <span style={{ textAlign: 'right', color: '#22C98A' }}>{formatINR(run.total_gross)}</span>
                        <span style={{ textAlign: 'right', color: '#FF5C5C' }}>{formatINR(run.total_deductions)}</span>
                        <span style={{ textAlign: 'right', color: '#F5A623' }}>{formatINR(run.total_tds)}</span>
                        <span style={{ textAlign: 'right', color: '#3B5998' }}>{formatINR(payslips.reduce((s,p)=>s+parseFloat(p.pf_employee||0),0))}</span>
                        <span style={{ textAlign: 'right', color: '#1B4FD8' }}>{formatINR(run.total_net)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function PayrollPage() {
  const [tab, setTab] = useState('employees');
  const [summary, setSummary] = useState(null);

  const loadSummary = useCallback(async () => {
    try {
      const data = await apiGet(API + '/summary');
      setSummary(data);
    } catch { }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  return (
    <div style={{ padding: 24 }}>
      <SummaryCards summary={summary} />
      <TabBar
        tabs={[{ id: 'employees', label: 'Employees' }, { id: 'runs', label: 'Payroll Runs' }]}
        active={tab} onChange={setTab}
      />
      {tab === 'employees' && <EmployeesTab onRefreshSummary={loadSummary} />}
      {tab === 'runs'      && <PayrollRunsTab onRefreshSummary={loadSummary} />}
    </div>
  );
}

