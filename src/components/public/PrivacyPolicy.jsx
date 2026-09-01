import { Link } from 'react-router-dom';

const Header = () => (
  <div style={{background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)',padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
    <div>
      <div style={{fontSize:18,fontWeight:900,color:'#fff'}}>Deemona AI Finance OS</div>
      <div style={{fontSize:11,color:'rgba(255,255,255,0.7)'}}>by Deemona Global Solutions</div>
    </div>
    <Link to="/login" style={{padding:'8px 16px',borderRadius:8,background:'rgba(255,255,255,0.15)',color:'#fff',textDecoration:'none',fontSize:12,fontWeight:600,whiteSpace:'nowrap'}}>Back to Login</Link>
  </div>
);

const Section = ({title,children}) => (
  <div style={{marginBottom:24}}>
    <h2 style={{fontSize:15,fontWeight:800,color:'#1e3a8a',marginBottom:8,paddingBottom:6,borderBottom:'2px solid #e2e8f0'}}>{title}</h2>
    <div style={{fontSize:13,color:'#334155',lineHeight:1.9}}>{children}</div>
  </div>
);

export default function PrivacyPolicy() {
  return (
    <div style={{minHeight:'100vh',background:'#f0f4ff'}}>
      <Header/>
      <div style={{maxWidth:860,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{background:'#fff',borderRadius:12,padding:'24px 20px',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <div style={{textAlign:'center',marginBottom:28}}>
            <h1 style={{fontSize:22,fontWeight:900,color:'#1e3a8a',marginBottom:6}}>Privacy Policy</h1>
            <div style={{fontSize:11,color:'#64748b'}}>Effective: 1 September 2026</div>
            <div style={{marginTop:8,padding:'4px 12px',background:'#eff6ff',borderRadius:6,display:'inline-block',fontSize:11,color:'#1d4ed8',fontWeight:600}}>Deemona Global Solutions</div>
          </div>
          <Section title="1. About Us">Deemona AI Finance OS is developed, owned, and operated by <strong>Deemona Global Solutions</strong>. The Application provides AI-powered financial management software as a service (SaaS) to businesses in India and worldwide.</Section>
          <Section title="2. Information We Collect"><ul style={{paddingLeft:18,margin:'4px 0'}}>{['Account Information: Name, email, mobile number, company name, password (encrypted).','Financial Data: Invoices, expenses, payroll, GST/TDS data you enter.','Usage Data: Log files, IP addresses, features used, session duration.','Device Information: OS, device type, browser.','Third-party Integrations: Data from Google Drive, Gmail if connected.'].map((x,i)=><li key={i} style={{marginBottom:5}}>{x}</li>)}</ul></Section>
          <Section title="3. How We Use Your Information"><ul style={{paddingLeft:18,margin:'4px 0'}}>{['Provide, maintain, and improve the Service.','Process financial data and generate reports and analytics.','Send automated reports and alerts as configured by you.','Comply with DPDP Act 2023 and other applicable laws.','Detect fraud, security incidents, and technical issues.'].map((x,i)=><li key={i} style={{marginBottom:5}}>{x}</li>)}</ul></Section>
          <Section title="4. Data Storage & Security">Data is stored on secure cloud infrastructure (Neon PostgreSQL, Render.com). Security measures include AES-256 encryption, TLS 1.3, mandatory 2FA, and RBAC with 97+ permissions.</Section>
          <Section title="5. Data Sharing">We do <strong>not</strong> sell your data. We share only with service providers (Anthropic, Resend, Google, Twilio) strictly for service delivery, or when required by law.</Section>
          <Section title="6. Your Rights (DPDP Act 2023)">You have the right to access, correct, erase your data, withdraw consent, and raise grievances. Contact: <strong>privacy@deemona.com</strong></Section>
          <Section title="7. Data Retention">Data retained while account is active or as required by law (financial records: 7 years). Deleted within 30 days of account closure.</Section>
          <Section title="8. Contact">Email: <strong>privacy@deemona.com</strong> | Website: <strong>www.deemona.com</strong></Section>
          <div style={{marginTop:24,padding:14,background:'#f8faff',borderRadius:8,fontSize:11,color:'#64748b',borderLeft:'4px solid #1d4ed8'}}>Governed by laws of India. Disputes subject to courts in New Delhi.</div>
          <div style={{marginTop:20,display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
            <Link to="/terms" style={{padding:'8px 14px',borderRadius:7,background:'#eff6ff',color:'#1d4ed8',textDecoration:'none',fontSize:12,fontWeight:700}}>Terms of Service</Link>
            <Link to="/license" style={{padding:'8px 14px',borderRadius:7,background:'#eff6ff',color:'#1d4ed8',textDecoration:'none',fontSize:12,fontWeight:700}}>License Agreement</Link>
            <Link to="/about" style={{padding:'8px 14px',borderRadius:7,background:'#eff6ff',color:'#1d4ed8',textDecoration:'none',fontSize:12,fontWeight:700}}>About Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
