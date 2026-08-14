import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { try { const r = await fetch(apiURL(url), { headers: h() }); const t = await r.text(); return JSON.parse(t); } catch { return {}; } };
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); const t = await r.text(); return JSON.parse(t); } catch (e) { return { error: e.message }; } };

const INR = n => { const v = parseFloat(n||0); if(v>=1e7) return 'Rs '+(v/1e7).toFixed(2)+' Cr'; if(v>=1e5) return 'Rs '+(v/1e5).toFixed(2)+' L'; return 'Rs '+v.toLocaleString('en-IN'); };

const COMPANIES = [
  { id: 'af1845e2-39f3-4e9d-b1ed-91c2798a0f6f', name: 'Deemona Technologies Pvt Ltd', gstin: '07AABCD1234E1ZX', type: 'Headquarters', city: 'New Delhi', state: 'Delhi', status: 'active', revenue: 28500000, employees: 11, color: '#1B4FD8' },
  { id: '69cb6f7d-eb8c-4927-bccb-8864877fd950', name: 'Deemona Global Solutions', gstin: '29AABCD5678F1ZY', type: 'Subsidiary', city: 'Bengaluru', state: 'Karnataka', status: 'active', revenue: 12000000, employees: 5, color: '#059669' },
  { id: 'branch-mumbai', name: 'Deemona Mumbai Branch', gstin: '27AABCD9012G1ZZ', type: 'Branch', city: 'Mumbai', state: 'Maharashtra', status: 'setup', revenue: 0, employees: 0, color: '#D97706' },
];

function CompanyCard({ company, isActive, onClick }) {
  return (
    <div onClick={onClick} style={{ padding: '16px', borderRadius: 12, border: `2px solid ${isActive ? company.color : '#E2E8F0'}`, background: isActive ? company.color + '08' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = company.color + '60'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = '#E2E8F0'; }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: company.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
          {company.name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 2 }}>{company.name}</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>{company.city}, {company.state}</div>
        </div>
        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: company.status === 'active' ? '#ECFDF5' : '#FFFBEB', color: company.status === 'active' ? '#059669' : '#D97706' }}>
          {company.status === 'active' ? 'Active' : 'Setup'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ padding: '8px', borderRadius: 7, background: '#F8FAFC' }}>
          <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2 }}>Revenue YTD</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: company.color }}>{INR(company.revenue)}</div>
        </div>
        <div style={{ padding: '8px', borderRadius: 7, background: '#F8FAFC' }}>
          <div style={{ fontSize: 10, color: '#64748B', marginBottom: 2 }}>Employees</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>{company.employees}</div>
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: 10, color: '#64748B' }}>
        <span style={{ fontWeight: 600 }}>{company.type}</span> · GSTIN: {company.gstin}
      </div>
      {isActive && (
        <div style={{ marginTop: 8, padding: '5px 10px', borderRadius: 6, background: company.color, color: '#fff', fontSize: 11, fontWeight: 700, textAlign: 'center' }}>
          ✓ Currently Active
        </div>
      )}
    </div>
  );
}

export default function MultiCompanyPage() {
  const [activeCompany, setActiveCompany] = useState(COMPANIES[0].id);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', gstin: '', pan: '', city: '', state: '', type: 'Branch' });
  const [saving, setSaving] = useState(false);
  const [consolidatedView, setConsolidatedView] = useState(false);

  const active = COMPANIES.find(c => c.id === activeCompany) || COMPANIES[0];
  const totalRevenue = COMPANIES.filter(c => c.status === 'active').reduce((s, c) => s + c.revenue, 0);
  const totalEmployees = COMPANIES.filter(c => c.status === 'active').reduce((s, c) => s + c.employees, 0);

  const switchCompany = (id) => {
    const company = COMPANIES.find(c => c.id === id);
    if (company?.status !== 'active') return;
    setActiveCompany(id);
    // In real implementation: update localStorage tenant_id and reload data
    localStorage.setItem('active_tenant', id);
  };

  const addCompany = async () => {
    setSaving(true);
    const res = await post('/api/admin/tenants', { ...newCompany, status: 'setup' });
    setSaving(false);
    if (!res.error) {
      setShowAddForm(false);
      setNewCompany({ name: '', gstin: '', pan: '', city: '', state: '', type: 'Branch' });
    }
  };

  return (
    <div style={{ padding: 24, background: '#EEF3FD', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0A1628', marginBottom: 4 }}>Multi-Company Management</h1>
          <div style={{ fontSize: 13, color: '#64748B' }}>Manage all your companies, branches, and subsidiaries from one place.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setConsolidatedView(v => !v)} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${consolidatedView ? '#1B4FD8' : '#E2E8F0'}`, background: consolidatedView ? '#EEF3FD' : '#fff', color: consolidatedView ? '#1B4FD8' : '#334155', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {consolidatedView ? '✓ Consolidated View' : '📊 Consolidated View'}
          </button>
          <button onClick={() => setShowAddForm(true)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1B4FD8', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            + Add Company
          </button>
        </div>
      </div>

      {/* Consolidated stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Companies', value: COMPANIES.length, sub: `${COMPANIES.filter(c=>c.status==='active').length} active`, color: '#1B4FD8', icon: '🏢' },
          { label: 'Group Revenue YTD', value: INR(totalRevenue), sub: 'All entities combined', color: '#059669', icon: '📈' },
          { label: 'Total Headcount', value: totalEmployees, sub: 'Across all entities', color: '#7C3AED', icon: '👥' },
          { label: 'GST Entities', value: COMPANIES.filter(c=>c.gstin).length, sub: 'Registered for GST', color: '#D97706', icon: '🧾' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 10, background: '#fff', border: '1px solid #C7D9F8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{s.label}</div>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Company list */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 12 }}>Your Companies</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {COMPANIES.map(company => (
              <CompanyCard key={company.id} company={company} isActive={activeCompany === company.id} onClick={() => switchCompany(company.id)} />
            ))}

            {/* Add company card */}
            <div onClick={() => setShowAddForm(true)} style={{ padding: '20px', borderRadius: 12, border: '2px dashed #C7D9F8', background: '#F8FAFC', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1B4FD8'; e.currentTarget.style.background = '#EEF3FD'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#C7D9F8'; e.currentTarget.style.background = '#F8FAFC'; }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>+</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>Add New Company / Branch</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Subsidiary, branch office, or holding company</div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div>
          {consolidatedView ? (
            /* Consolidated P&L */
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #EEF3FD', fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Consolidated P&L View</div>
              <div style={{ padding: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#F0F5FF' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>Entity</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>Revenue</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>Expenses</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>Profit</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#3B5998', fontSize: 11 }}>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPANIES.filter(c => c.status === 'active').map((c, i) => {
                      const exp = c.revenue * 0.65;
                      const profit = c.revenue - exp;
                      const margin = c.revenue > 0 ? ((profit/c.revenue)*100).toFixed(1) : 0;
                      return (
                        <tr key={c.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '9px 12px', fontWeight: 600, color: c.color }}>
                            <div>{c.name.split(' ').slice(0,2).join(' ')}</div>
                            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 400 }}>{c.type}</div>
                          </td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', color: '#059669', fontWeight: 600 }}>{INR(c.revenue)}</td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', color: '#DC2626' }}>{INR(exp)}</td>
                          <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 700, color: '#1B4FD8' }}>{INR(profit)}</td>
                          <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                            <span style={{ padding: '2px 6px', borderRadius: 10, fontSize: 10, fontWeight: 700, background: '#ECFDF5', color: '#059669' }}>{margin}%</span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ borderTop: '2px solid #C7D9F8', background: '#F0F5FF' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0A1628' }}>CONSOLIDATED</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#059669' }}>{INR(totalRevenue)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>{INR(totalRevenue * 0.65)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#1B4FD8' }}>{INR(totalRevenue * 0.35)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <span style={{ padding: '2px 6px', borderRadius: 10, fontSize: 10, fontWeight: 800, background: '#EEF3FD', color: '#1B4FD8' }}>35.0%</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Active company details */
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 12 }}>Active: {active.name}</div>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', padding: 18, marginBottom: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Company Type', value: active.type },
                    { label: 'GSTIN', value: active.gstin },
                    { label: 'Location', value: `${active.city}, ${active.state}` },
                    { label: 'Status', value: active.status === 'active' ? '✓ Active' : '⚙ Setup' },
                    { label: 'Revenue YTD', value: INR(active.revenue) },
                    { label: 'Headcount', value: active.employees + ' employees' },
                  ].map((f, i) => (
                    <div key={i} style={{ padding: '10px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 10, color: '#64748B', marginBottom: 3, fontWeight: 600 }}>{f.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0A1628' }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Intercompany transactions */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #C7D9F8', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #EEF3FD', fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Intercompany Transactions</div>
                <div style={{ padding: 14 }}>
                  {COMPANIES.filter(c => c.id !== activeCompany && c.status === 'active').map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 10 ? '1px solid #F8FAFC' : 'none' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{c.name[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0A1628' }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Management fee · Monthly</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>Rs 2.50 L</div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>per month</div>
                      </div>
                    </div>
                  ))}
                  <button style={{ width: '100%', marginTop: 12, padding: '8px', borderRadius: 8, border: '1px dashed #C7D9F8', background: '#F8FAFC', color: '#1B4FD8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    + Add Intercompany Transaction
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Company Modal */}
      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 560, boxShadow: '0 20px 60px rgba(27,79,216,0.15)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0A1628' }}>Add New Company / Branch</div>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 20 }}>×</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                {[
                  { label: 'Company Name', field: 'name', placeholder: 'Deemona Mumbai Pvt Ltd' },
                  { label: 'Type', field: 'type', type: 'select', options: ['Branch', 'Subsidiary', 'Associate', 'Holding'] },
                  { label: 'GSTIN', field: 'gstin', placeholder: '27AABCD5678F1ZY' },
                  { label: 'PAN', field: 'pan', placeholder: 'AABCD5678F' },
                  { label: 'City', field: 'city', placeholder: 'Mumbai' },
                  { label: 'State', field: 'state', placeholder: 'Maharashtra' },
                ].map(f => (
                  <div key={f.field}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{f.label}</label>
                    {f.type === 'select' ? (
                      <select value={newCompany[f.field]} onChange={e => setNewCompany(p => ({...p, [f.field]: e.target.value}))}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', background: '#fff' }}>
                        {f.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input value={newCompany[f.field]} onChange={e => setNewCompany(p => ({...p, [f.field]: e.target.value}))} placeholder={f.placeholder}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 7, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#F0F5FF', border: '1px solid #C7D9F8', marginBottom: 16, fontSize: 12, color: '#3B5998' }}>
                💡 Each company gets its own data isolation — separate invoices, employees, bank accounts, and reports.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowAddForm(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#334155', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button onClick={addCompany} disabled={saving || !newCompany.name} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: saving ? '#93B4EF' : '#1B4FD8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Creating...' : 'Create Company'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
