import { Link } from 'react-router-dom';

const Section = ({title, children}) => (
  <div style={{marginBottom:28}}>
    <h2 style={{fontSize:16,fontWeight:800,color:'#1e3a8a',marginBottom:10,paddingBottom:6,borderBottom:'2px solid #e2e8f0'}}>{title}</h2>
    <div style={{fontSize:13,color:'#334155',lineHeight:1.9}}>{children}</div>
  </div>
);
const Li = ({children}) => <li style={{marginBottom:6,lineHeight:1.7}}>{children}</li>;

export default function TermsOfService() {
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
            <h1 style={{fontSize:28,fontWeight:900,color:'#1e3a8a',marginBottom:6}}>Terms of Service & Usage Policy</h1>
            <div style={{fontSize:12,color:'#64748b'}}>Effective Date: 1 September 2026 &nbsp;|&nbsp; Last Updated: 1 September 2026</div>
            <div style={{marginTop:8,padding:'6px 16px',background:'#eff6ff',borderRadius:6,display:'inline-block',fontSize:12,color:'#1d4ed8',fontWeight:600}}>Deemona Global Solutions &mdash; Deemona AI Finance OS</div>
          </div>

          <div style={{background:'#fef2f2',border:'2px solid #fecaca',borderRadius:10,padding:'16px 20px',marginBottom:28}}>
            <div style={{fontSize:13,fontWeight:800,color:'#dc2626',marginBottom:6}}>IMPORTANT DISCLAIMER — PLEASE READ CAREFULLY</div>
            <div style={{fontSize:12,color:'#991b1b',lineHeight:1.7}}>
              Deemona AI Finance OS is a <strong>financial management and analytics tool</strong>. It is <strong>NOT</strong> a registered financial advisor, chartered accountant, tax consultant, or legal advisor. The information, reports, insights, and analyses provided by this Application are for <strong>informational and management purposes only</strong>. Deemona Global Solutions and Deemona AI Finance OS shall <strong>NOT be responsible or liable for any financial loss, tax liability, regulatory penalty, or any other loss</strong> incurred by the user or any third party as a result of reliance on data, reports, recommendations, or AI-generated insights provided by this Application. Users are strongly advised to consult qualified professionals before making financial, tax, legal, or investment decisions.
            </div>
          </div>

          <Section title="1. Acceptance of Terms">
            By registering for, accessing, or using Deemona AI Finance OS (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service and Usage Policy (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you must not use the Service. These Terms constitute a legally binding agreement between you (&ldquo;User&rdquo;) and <strong>Deemona Global Solutions</strong> (&ldquo;Company,&rdquo; &ldquo;We,&rdquo; &ldquo;Us,&rdquo; or &ldquo;Our&rdquo;).
          </Section>

          <Section title="2. Ownership & Intellectual Property">
            Deemona AI Finance OS, including all its features, dashboards, modules, AI capabilities, source code, design, trademarks, and documentation, is the exclusive property of <strong>Deemona Global Solutions</strong>. All rights are reserved. You may not copy, modify, reverse engineer, distribute, sell, or create derivative works of any part of this Application without explicit written permission from Deemona Global Solutions.
          </Section>

          <Section title="3. Permitted Use">
            You are permitted to use the Service for:
            <ul style={{paddingLeft:20,marginTop:8}}>
              <Li>Managing your business finances, invoices, expenses, payroll, and compliance.</Li>
              <Li>Generating financial reports and analytics for internal business use.</Li>
              <Li>Accessing AI-powered insights for informational and management purposes.</Li>
              <Li>Sharing reports within your organization as authorized under your subscription plan.</Li>
            </ul>
          </Section>

          <Section title="4. Prohibited Use">
            You must NOT use the Service to:
            <ul style={{paddingLeft:20,marginTop:8}}>
              <Li>Upload, store, or process fraudulent, illegal, or misleading financial data.</Li>
              <Li>Attempt to gain unauthorized access to other users' data or the platform's infrastructure.</Li>
              <Li>Use the platform for money laundering, tax evasion, or any other illegal activity.</Li>
              <Li>Reverse engineer, decompile, or disassemble any part of the Service.</Li>
              <Li>Resell or sublicense the Service without written authorization from Deemona Global Solutions.</Li>
              <Li>Use automated bots or scrapers to extract data from the platform.</Li>
              <Li>Violate any applicable law, regulation, or third-party rights.</Li>
            </ul>
          </Section>

          <Section title="5. Financial Disclaimer & Limitation of Liability">
            <div style={{background:'#fef9c3',border:'1px solid #fde047',borderRadius:8,padding:'12px 16px',marginBottom:12}}>
              <strong>CRITICAL DISCLAIMER:</strong> Deemona AI Finance OS provides financial data management and AI-generated analytics. The Application does NOT provide certified financial advice, tax advice, legal advice, or investment advice.
            </div>
            <ul style={{paddingLeft:20}}>
              <Li>All AI-generated insights, recommendations, forecasts, and reports are based on data entered by the user and are subject to errors, inaccuracies, and limitations.</Li>
              <Li><strong>Deemona Global Solutions shall not be liable</strong> for any direct, indirect, incidental, consequential, or punitive damages, including but not limited to financial losses, tax penalties, regulatory fines, missed business opportunities, or data loss arising from use of the Service.</Li>
              <Li>Users are solely responsible for verifying the accuracy of all financial data, reports, and filings generated by the platform.</Li>
              <Li>AI-generated documents (contracts, compliance reports, valuations) are templates only and must be reviewed by qualified professionals before use.</Li>
              <Li>Market Cap data, stock prices, and financial market data are sourced from third parties and may be delayed or inaccurate.</Li>
              <Li>The maximum aggregate liability of Deemona Global Solutions shall not exceed the subscription fees paid by the user in the preceding 3 months.</Li>
            </ul>
          </Section>

          <Section title="6. Data Accuracy & User Responsibility">
            <ul style={{paddingLeft:20}}>
              <Li>You are solely responsible for the accuracy, completeness, and legality of all data you enter into the platform.</Li>
              <Li>The quality of AI insights and reports depends entirely on the quality of data entered by you.</Li>
              <Li>You must ensure your use of the platform complies with all applicable GST, TDS, Companies Act, FEMA, and other Indian laws.</Li>
              <Li>Deemona Global Solutions is not responsible for incorrect tax filings, wrong financial statements, or compliance failures arising from incorrect data entry.</Li>
            </ul>
          </Section>

          <Section title="7. Service Availability">
            We strive for 99.5% uptime but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or technical issues. Deemona Global Solutions shall not be liable for losses arising from Service downtime.
          </Section>

          <Section title="8. Subscription & Payment">
            <ul style={{paddingLeft:20}}>
              <Li>Access to the Service may require a paid subscription (plans to be announced).</Li>
              <Li>Subscription fees are non-refundable except as required by applicable law.</Li>
              <Li>We reserve the right to modify pricing with 30 days prior notice.</Li>
              <Li>Non-payment may result in suspension or termination of access.</Li>
            </ul>
          </Section>

          <Section title="9. Termination">
            We reserve the right to suspend or terminate your account without notice if you violate these Terms, engage in fraudulent activity, or misuse the platform. You may terminate your account at any time. Upon termination, your data will be retained for 30 days before deletion.
          </Section>

          <Section title="10. Governing Law & Dispute Resolution">
            These Terms are governed by the laws of India. Any disputes arising from these Terms or use of the Service shall be resolved through binding arbitration in New Delhi, India, in accordance with the Arbitration and Conciliation Act, 1996, before a sole arbitrator appointed by mutual agreement.
          </Section>

          <Section title="11. Modifications to Terms">
            We reserve the right to modify these Terms at any time. Changes will be notified via email and in-app notification at least 15 days before taking effect. Continued use after the effective date constitutes acceptance of the revised Terms.
          </Section>

          <Section title="12. Contact Us">
            <strong>Deemona Global Solutions</strong><br/>
            Email: <strong>legal@deemona.com</strong><br/>
            Website: <strong>www.deemona.com</strong><br/>
            For legal notices: <strong>legal@deemona.com</strong>
          </Section>

          <div style={{marginTop:36,padding:16,background:'#f8faff',borderRadius:8,fontSize:12,color:'#64748b',borderLeft:'4px solid #1d4ed8'}}>
            By using Deemona AI Finance OS, you acknowledge that you have read, understood, and agreed to these Terms of Service and Usage Policy in their entirety.
          </div>
        </div>
      </div>
    </div>
  );
}
