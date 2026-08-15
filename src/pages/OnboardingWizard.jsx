// Deemona Onboarding Wizard v2
import { useState } from 'react';
import { apiURL } from '../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method: 'POST', headers: h(), body: JSON.stringify(body) }); const t = await r.text(); return JSON.parse(t); } catch (e) { return { error: e.message }; } };

const STEPS = [
  { id: 'company',   title: 'Company Setup',      icon: '🏢', desc: 'Tell us about your company' },
  { id: 'bank',      title: 'Bank Account',        icon: '🏦', desc: 'Connect your primary bank account' },
  { id: 'team',      title: 'Invite Team',         icon: '👥', desc: 'Add your finance team members' },
  { id: 'vendor',    title: 'First Vendor',        icon: '🏭', desc: 'Add your first vendor or supplier' },
  { id: 'complete',  title: 'All Set!',            icon: '🎉', desc: 'Your workspace is ready' },
];

function StepIndicator({ steps, current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
      {steps.map((step, i) => (
        <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: i < current ? '#059669' : i === current ? '#1B4FD8' : '#E2E8F0',
              color: i <= current ? '#fff' : '#94A3B8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: i < current ? 18 : 14, fontWeight: 700,
              transition: 'all 0.3s',
            }}>
              {i < current ? '✓' : step.icon}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: i === current ? '#1B4FD8' : i < current ? '#059669' : '#94A3B8', textAlign: 'center', width: 70 }}>{step.title}</div>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? '#059669' : '#E2E8F0', margin: '0 8px', marginBottom: 22, transition: 'background 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text', required, hint }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>
        {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', color: '#0A1628', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
        onFocus={e => e.target.style.borderColor = '#1B4FD8'}
        onBlur={e => e.target.style.borderColor = '#C7D9F8'}
      />
      {hint && <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// Step components
function CompanyStep({ data, setData }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', marginBottom: 6 }}>Welcome to Deemona! 👋</div>
        <div style={{ fontSize: 14, color: '#64748B' }}>Let's set up your company profile. This takes about 2 minutes.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <InputField label="Company Name" value={data.name} onChange={v => setData(p => ({...p, name: v}))} placeholder="Deemona Technologies Pvt Ltd" required />
        <InputField label="Industry" value={data.industry} onChange={v => setData(p => ({...p, industry: v}))} placeholder="Technology / SaaS" />
        <InputField label="GSTIN" value={data.gstin} onChange={v => setData(p => ({...p, gstin: v.toUpperCase()}))} placeholder="27AABCD1234E1ZX" hint="15-character GST Identification Number" />
        <InputField label="PAN" value={data.pan} onChange={v => setData(p => ({...p, pan: v.toUpperCase()}))} placeholder="AABCD1234E" />
        <InputField label="Registered Address" value={data.address} onChange={v => setData(p => ({...p, address: v}))} placeholder="123, Business Park, Mumbai" />
        <InputField label="City" value={data.city} onChange={v => setData(p => ({...p, city: v}))} placeholder="Mumbai" />
        <InputField label="State" value={data.state} onChange={v => setData(p => ({...p, state: v}))} placeholder="Maharashtra" />
        <InputField label="Financial Year Start" value={data.fy_start} onChange={v => setData(p => ({...p, fy_start: v}))} placeholder="April" hint="Indian FY: April to March" />
      </div>
      <div style={{ padding: '12px 16px', borderRadius: 8, background: '#F0F5FF', border: '1px solid #C7D9F8', marginTop: 8 }}>
        <div style={{ fontSize: 12, color: '#1B4FD8', fontWeight: 600 }}>💡 Why do we need this?</div>
        <div style={{ fontSize: 12, color: '#3B5998', marginTop: 3 }}>Your GSTIN and PAN are needed to generate GST-compliant invoices and file returns. All data is encrypted and stored securely.</div>
      </div>
    </div>
  );
}

function BankStep({ data, setData }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', marginBottom: 6 }}>Connect Your Bank Account 🏦</div>
        <div style={{ fontSize: 14, color: '#64748B' }}>Add your primary operating account for cash flow tracking.</div>
      </div>
      <InputField label="Account Name" value={data.name} onChange={v => setData(p => ({...p, name: v}))} placeholder="HDFC Current Account - Primary" required />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <InputField label="Bank Name" value={data.bank_name} onChange={v => setData(p => ({...p, bank_name: v}))} placeholder="HDFC Bank" required />
        <InputField label="Account Type" value={data.account_type} onChange={v => setData(p => ({...p, account_type: v}))} placeholder="Current" />
        <InputField label="Account Number" value={data.account_number} onChange={v => setData(p => ({...p, account_number: v}))} placeholder="50200012345678" />
        <InputField label="IFSC Code" value={data.ifsc} onChange={v => setData(p => ({...p, ifsc: v.toUpperCase()}))} placeholder="HDFC0000001" hint="11-character IFSC code" />
        <InputField label="Branch" value={data.branch} onChange={v => setData(p => ({...p, branch: v}))} placeholder="Connaught Place, New Delhi" />
        <InputField label="Opening Balance (Rs)" value={data.opening_balance} onChange={v => setData(p => ({...p, opening_balance: v}))} type="number" placeholder="1000000" hint="Current account balance" />
      </div>
      <div style={{ padding: '12px 16px', borderRadius: 8, background: '#ECFDF5', border: '1px solid #A7F3D0', marginTop: 8 }}>
        <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>🔒 Bank-level security</div>
        <div style={{ fontSize: 12, color: '#065F46', marginTop: 3 }}>We only store account details for reconciliation — no passwords or banking credentials are required.</div>
      </div>
    </div>
  );
}

function TeamStep({ data, setData }) {
  const addMember = () => setData(p => ({ ...p, members: [...(p.members || []), { email: '', role: 'accountant' }] }));
  const updateMember = (i, field, val) => setData(p => ({ ...p, members: p.members.map((m, idx) => idx === i ? {...m, [field]: val} : m) }));
  const removeMember = (i) => setData(p => ({ ...p, members: p.members.filter((_, idx) => idx !== i) }));

  const members = data.members || [];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', marginBottom: 6 }}>Build Your Finance Team 👥</div>
        <div style={{ fontSize: 14, color: '#64748B' }}>Invite team members. You can always add more later.</div>
      </div>

      {members.map((member, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Email Address</label>
            <input value={member.email} onChange={e => updateMember(i, 'email', e.target.value)} placeholder="colleague@company.com"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 5 }}>Role</label>
            <select value={member.role} onChange={e => updateMember(i, 'role', e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #C7D9F8', fontSize: 13, outline: 'none', background: '#fff' }}>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="accountant">Accountant</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button onClick={() => removeMember(i)} style={{ width: 36, height: 40, borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
        </div>
      ))}

      <button onClick={addMember} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, border: '2px dashed #C7D9F8', background: '#F8FAFC', color: '#1B4FD8', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%', justifyContent: 'center', marginTop: 8 }}>
        + Add Team Member
      </button>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 10 }}>Role Permissions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { role: 'Admin', perms: 'Full access except billing', color: '#1B4FD8' },
            { role: 'Manager', perms: 'View + approve transactions', color: '#059669' },
            { role: 'Accountant', perms: 'Create invoices & entries', color: '#D97706' },
            { role: 'Viewer', perms: 'Read-only access', color: '#64748B' },
          ].map(r => (
            <div key={r.role} style={{ padding: '10px 12px', borderRadius: 8, background: '#F8FAFC', border: `1px solid ${r.color}30` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: r.color, marginBottom: 3 }}>{r.role}</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>{r.perms}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VendorStep({ data, setData }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', marginBottom: 6 }}>Add Your First Vendor 🏭</div>
        <div style={{ fontSize: 14, color: '#64748B' }}>Start tracking your payables. Add your most important supplier.</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <InputField label="Vendor Name" value={data.name} onChange={v => setData(p => ({...p, name: v}))} placeholder="AWS India Pvt Ltd" required />
        <InputField label="Category" value={data.category} onChange={v => setData(p => ({...p, category: v}))} placeholder="Technology / Cloud" />
        <InputField label="GSTIN" value={data.gstin} onChange={v => setData(p => ({...p, gstin: v.toUpperCase()}))} placeholder="07AADCA3364N1ZC" />
        <InputField label="Email" value={data.email} onChange={v => setData(p => ({...p, email: v}))} placeholder="billing@vendor.com" type="email" />
        <InputField label="Phone" value={data.phone} onChange={v => setData(p => ({...p, phone: v}))} placeholder="+91-80-67890000" />
        <InputField label="Payment Terms (days)" value={data.payment_terms} onChange={v => setData(p => ({...p, payment_terms: v}))} type="number" placeholder="30" hint="e.g. 30 for Net 30" />
        <div style={{ gridColumn: '1/-1' }}>
          <InputField label="Address" value={data.address} onChange={v => setData(p => ({...p, address: v}))} placeholder="DLF Cyber City, Gurugram" />
        </div>
      </div>
      <div style={{ padding: '12px 16px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A', marginTop: 8 }}>
        <div style={{ fontSize: 12, color: '#D97706', fontWeight: 600 }}>💡 Skip if not ready</div>
        <div style={{ fontSize: 12, color: '#92400E', marginTop: 3 }}>You can add vendors anytime from the Procurement module. This step is optional.</div>
      </div>
    </div>
  );
}

function CompleteStep({ companyData }) {
  const features = [
    { icon: '📒', label: 'Accounting', desc: 'Chart of accounts ready' },
    { icon: '🏦', label: 'Treasury', desc: 'Bank accounts connected' },
    { icon: '🤖', label: 'AI CFO', desc: 'Activated and learning' },
    { icon: '📊', label: 'Dashboard', desc: 'Real-time insights ready' },
    { icon: '🧾', label: 'GST', desc: 'Compliance calendar set' },
    { icon: '👥', label: 'Payroll', desc: 'Employee module ready' },
  ];

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0A1628', marginBottom: 8 }}>You're all set, {companyData.name || 'Team'}!</div>
      <div style={{ fontSize: 14, color: '#64748B', marginBottom: 32 }}>Your AI Finance OS is configured and ready to use.</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
        {features.map((f, i) => (
          <div key={i} style={{ padding: '14px', borderRadius: 10, background: '#F0F5FF', border: '1px solid #C7D9F8', textAlign: 'left' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628', marginBottom: 2 }}>{f.label}</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>{f.desc}</div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
              <span style={{ fontSize: 10, color: '#059669', fontWeight: 600 }}>Active</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '16px', borderRadius: 10, background: '#EEF3FD', border: '1px solid #C7D9F8', marginBottom: 24, textAlign: 'left' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1B4FD8', marginBottom: 8 }}>🚀 Recommended next steps:</div>
        {[
          'Add your first invoice in Accounting → AR Invoices',
          'Run your first payroll in Payroll module',
          'Ask your Digital CFO about your financial health',
          'Set up your first automated workflow in Workflow Studio',
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12, color: '#334155' }}>
            <span style={{ color: '#1B4FD8', fontWeight: 700, width: 18 }}>{i + 1}.</span>
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OnboardingWizard({ onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [companyData, setCompanyData] = useState({ name: '', gstin: '', pan: '', address: '', city: '', state: '', industry: '', fy_start: 'April' });
  const [bankData, setBankData] = useState({ name: '', bank_name: '', account_type: 'current', account_number: '', ifsc: '', branch: '', opening_balance: '' });
  const [teamData, setTeamData] = useState({ members: [] });
  const [vendorData, setVendorData] = useState({ name: '', gstin: '', email: '', phone: '', address: '', payment_terms: '30', category: '' });

  const isLastStep = step === STEPS.length - 1;

  const handleNext = async () => {
    if (step === STEPS.length - 1) { onComplete && onComplete(); return; }
    setSaving(true);
    try {
      if (step === 1 && bankData.name && bankData.bank_name) {
        await post('/api/treasury/accounts', { ...bankData, opening_balance: parseFloat(bankData.opening_balance) || 0, current_balance: parseFloat(bankData.opening_balance) || 0, is_primary: true, is_active: true });
      }
      if (step === 3 && vendorData.name) {
        await post('/api/accounting/vendors', { ...vendorData, payment_terms: parseInt(vendorData.payment_terms) || 30, is_active: true });
      }
    } catch (e) { console.error(e); }
    setSaving(false);
    setStep(s => s + 1);
  };

  const handleSkip = () => setStep(s => s + 1);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #EEF3FD 0%, #DBEAFE 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 760, background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(27,79,216,0.12)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '28px 40px 0', background: 'linear-gradient(135deg, #1B4FD8, #3B82F6)', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800 }}>D</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Deemona AI Finance OS</div>
            <div style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.8 }}>Step {step + 1} of {STEPS.length}</div>
          </div>
          <div style={{ paddingBottom: 28 }}>
            <StepIndicator steps={STEPS} current={step} />
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '32px 40px' }}>
          {step === 0 && <CompanyStep data={companyData} setData={setCompanyData} />}
          {step === 1 && <BankStep data={bankData} setData={setBankData} />}
          {step === 2 && <TeamStep data={teamData} setData={setTeamData} />}
          {step === 3 && <VendorStep data={vendorData} setData={setVendorData} />}
          {step === 4 && <CompleteStep companyData={companyData} />}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px 40px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {step > 0 && step < 4 && (
              <button onClick={() => setStep(s => s - 1)} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {step > 0 && step < 4 && (
              <button onClick={handleSkip} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #E2E8F0', background: 'none', color: '#64748B', fontSize: 13, cursor: 'pointer' }}>Skip for now</button>
            )}
            <button onClick={handleNext} disabled={saving} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: saving ? '#93B4EF' : '#1B4FD8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {saving ? 'Saving...' : step === 4 ? 'Go to Dashboard 🚀' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
