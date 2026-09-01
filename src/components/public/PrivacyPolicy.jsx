import { Link } from 'react-router-dom';

const Section = ({title, children}) => (
  <div style={{marginBottom:28}}>
    <h2 style={{fontSize:16,fontWeight:800,color:'#1e3a8a',marginBottom:10,paddingBottom:6,borderBottom:'2px solid #e2e8f0'}}>{title}</h2>
    <div style={{fontSize:13,color:'#334155',lineHeight:1.9}}>{children}</div>
  </div>
);
const Li = ({children}) => <li style={{marginBottom:6,lineHeight:1.7}}>{children}</li>;

export default function PrivacyPolicy() {
  return (
    <div style={{minHeight:'100vh',background:'#f0f4ff'}}>
      <div style={{background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)',padding:'20px 40px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:22,fontWeight:900,color:'#fff'}}>Deemona AI Finance OS</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.7)'}}>by Deemona Global Solutions</div>
        </div>
        <Link to="/login" style={{padding:'8px 18px',borderRadius:8,background:'rgba(255,255,255,0.15)',color:'#fff',textDecoration:'none',fontSize:12,fontWeight:600}}>Back to Login</Link>
      </div>
      <div style={{maxWidth:860,margin:'0 auto',padding:'40px 24px'}}>
        <div style={{background:'#fff',borderRadius:14,padding:'40px 48px',boxShadow:'0 4px 30px rgba(0,0,0,0.08)'}}>
          <div style={{textAlign:'center',marginBottom:36}}>
            <h1 style={{fontSize:28,fontWeight:900,color:'#1e3a8a',marginBottom:6}}>Privacy Policy</h1>
            <div style={{fontSize:12,color:'#64748b'}}>Effective Date: 1 September 2026 &nbsp;|&nbsp; Last Updated: 1 September 2026</div>
            <div style={{marginTop:8,padding:'6px 16px',background:'#eff6ff',borderRadius:6,display:'inline-block',fontSize:12,color:'#1d4ed8',fontWeight:600}}>Deemona Global Solutions &mdash; Deemona AI Finance OS</div>
          </div>

          <Section title="1. About Us">
            Deemona AI Finance OS (&ldquo;the Application,&rdquo; &ldquo;the Platform,&rdquo; or &ldquo;the Service&rdquo;) is developed, owned, and operated by <strong>Deemona Global Solutions</strong>, a technology company registered in India. Our registered address and contact details are available at <strong>www.deemona.com</strong>. The Application provides AI-powered financial management software as a service (SaaS) to businesses and individuals in India and worldwide.
          </Section>

          <Section title="2. Information We Collect">
            <p style={{marginBottom:8}}>We collect the following categories of information when you use our Service:</p>
            <ul style={{paddingLeft:20}}>
              <Li><strong>Account Information:</strong> Name, email address, mobile number, company name, and password (hashed and encrypted).</Li>
              <Li><strong>Financial Data:</strong> Invoice data, expense records, payroll information, GST/TDS data, and other financial records you upload or enter into the platform.</Li>
              <Li><strong>Usage Data:</strong> Log files, IP addresses, browser type, pages visited, features used, and session duration.</Li>
              <Li><strong>Device Information:</strong> Operating system, device type, and browser information.</Li>
              <Li><strong>Communication Data:</strong> Support requests, feedback, and communications with our team.</Li>
              <Li><strong>Third-party Integrations:</strong> Data from Google Drive, Gmail, and other services you connect to the platform.</Li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul style={{paddingLeft:20}}>
              <Li>To provide, maintain, and improve the Service.</Li>
              <Li>To process your financial data and generate reports, insights, and analytics.</Li>
              <Li>To send automated reports and alerts as configured by you.</Li>
              <Li>To comply with applicable laws including the Digital Personal Data Protection Act, 2023 (DPDP Act).</Li>
              <Li>To communicate with you about your account, updates, and support.</Li>
              <Li>To detect fraud, security incidents, and technical issues.</Li>
              <Li>To improve our AI models and service quality (using anonymized, aggregated data only).</Li>
            </ul>
          </Section>

          <Section title="4. Data Storage & Security">
            Your data is stored on secure cloud infrastructure (Neon PostgreSQL, Render.com, Cloudflare R2) located in Singapore and the United States. We implement industry-standard security measures including:
            <ul style={{paddingLeft:20,marginTop:8}}>
              <Li>AES-256 encryption for data at rest.</Li>
              <Li>TLS 1.3 encryption for data in transit.</Li>
              <Li>Multi-factor authentication (MFA/2FA) for account access.</Li>
              <Li>Role-based access control (RBAC) with 97+ permissions.</Li>
              <Li>Regular security audits and vulnerability assessments.</Li>
            </ul>
          </Section>

          <Section title="5. Data Sharing">
            We do <strong>not</strong> sell your personal data to third parties. We may share your data with:
            <ul style={{paddingLeft:20,marginTop:8}}>
              <Li><strong>Service Providers:</strong> Anthropic (Claude AI for analysis), Resend (email delivery), Google (OAuth authentication), Twilio (WhatsApp notifications) — strictly for service delivery.</Li>
              <Li><strong>Legal Requirements:</strong> When required by law, court order, or government authority.</Li>
              <Li><strong>Business Transfer:</strong> In the event of a merger or acquisition, with prior notice to users.</Li>
            </ul>
          </Section>

          <Section title="6. Your Rights (DPDP Act 2023)">
            Under the Digital Personal Data Protection Act, 2023, you have the right to:
            <ul style={{paddingLeft:20,marginTop:8}}>
              <Li>Access your personal data held by us.</Li>
              <Li>Correct inaccurate or incomplete personal data.</Li>
              <Li>Erase your personal data (right to be forgotten).</Li>
              <Li>Withdraw consent for data processing.</Li>
              <Li>Nominate a person to exercise rights on your behalf.</Li>
              <Li>Grievance redressal through our Data Protection Officer.</Li>
            </ul>
            To exercise your rights, contact us at <strong>privacy@deemona.com</strong>.
          </Section>

          <Section title="7. Cookies & Tracking">
            We use essential cookies for session management and authentication. We do not use third-party tracking or advertising cookies. You may disable cookies in your browser settings, but this may affect functionality.
          </Section>

          <Section title="8. Data Retention">
            We retain your data for as long as your account is active or as required by applicable law. Financial records are retained for 7 years in accordance with Indian accounting regulations. Upon account deletion, your data will be anonymized or deleted within 30 days, except where legal retention is required.
          </Section>

          <Section title="9. Children's Privacy">
            Our Service is not directed to persons under 18 years of age. We do not knowingly collect personal data from minors. If you believe we have inadvertently collected data from a minor, contact us immediately.
          </Section>

          <Section title="10. Contact & Grievance Officer">
            <strong>Deemona Global Solutions</strong><br/>
            Email: <strong>privacy@deemona.com</strong><br/>
            Website: <strong>www.deemona.com</strong><br/>
            Grievance Officer: Available at www.deemona.com/grievance<br/>
            Response Time: Within 72 hours for all data-related requests.
          </Section>

          <div style={{marginTop:36,padding:16,background:'#f8faff',borderRadius:8,fontSize:12,color:'#64748b',borderLeft:'4px solid #1d4ed8'}}>
            This Privacy Policy is governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of courts in New Delhi, India.
          </div>
        </div>
      </div>
    </div>
  );
}
