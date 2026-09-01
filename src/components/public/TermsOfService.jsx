import { Link } from 'react-router-dom';

const Header = () => (
  <div style={{background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)',padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
    <div>
      <div style={{fontSize:18,fontWeight:900,color:'#fff'}}>Deemona AI Finance OS</div>
      <div style={{fontSize:11,color:'rgba(255,255,255,0.7)'}}>by Deemona Global Solutions</div>
    </div>
    <Link to="/login" style={{padding:'8px 16px',borderRadius:8,background:'rgba(255,255,255,0.15)',color:'#fff',textDecoration:'none',fontSize:12,fontWeight:600}}>Back to Login</Link>
  </div>
);

const Section = ({title,children}) => (
  <div style={{marginBottom:24}}>
    <h2 style={{fontSize:15,fontWeight:800,color:'#1e3a8a',marginBottom:8,paddingBottom:6,borderBottom:'2px solid #e2e8f0'}}>{title}</h2>
    <div style={{fontSize:13,color:'#334155',lineHeight:1.9}}>{children}</div>
  </div>
);

export default function TermsOfService() {
  return (
    <div style={{minHeight:'100vh',background:'#f0f4ff'}}>
      <Header/>
      <div style={{maxWidth:860,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{background:'#fff',borderRadius:12,padding:'24px 20px',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <div style={{textAlign:'center',marginBottom:28}}>
            <h1 style={{fontSize:22,fontWeight:900,color:'#1e3a8a',marginBottom:6}}>Terms of Service & Usage Policy</h1>
            <div style={{fontSize:11,color:'#64748b'}}>Effective: 1 September 2026</div>
            <div style={{marginTop:8,padding:'4px 12px',background:'#eff6ff',borderRadius:6,display:'inline-block',fontSize:11,color:'#1d4ed8',fontWeight:600}}>Deemona Global Solutions</div>
          </div>

          <div style={{background:'#fef2f2',border:'2px solid #fecaca',borderRadius:10,padding:'14px 16px',marginBottom:24}}>
            <div style={{fontSize:13,fontWeight:800,color:'#dc2626',marginBottom:6}}>IMPORTANT DISCLAIMER</div>
            <div style={{fontSize:12,color:'#991b1b',lineHeight:1.7}}>Deemona AI Finance OS is a financial management tool, <strong>NOT</strong> a registered financial advisor or tax consultant. <strong>Deemona Global Solutions shall NOT be responsible or liable for any financial loss, tax liability, or regulatory penalty</strong> incurred as a result of reliance on this Application. Always consult qualified professionals.</div>
          </div>

          <Section title="1. Acceptance of Terms">By registering or using Deemona AI Finance OS, you agree to these Terms. If you do not agree, do not use the Service.</Section>
          <Section title="2. Ownership">Deemona AI Finance OS is exclusively owned by <strong>Deemona Global Solutions</strong>. All rights reserved. No copying, modification, or redistribution without written permission.</Section>
          <Section title="3. Permitted Use"><ul style={{paddingLeft:18,margin:'4px 0'}}>{['Managing business finances, invoices, expenses, payroll.','Generating financial reports for internal use.','Accessing AI-powered insights for informational purposes only.'].map((x,i)=><li key={i} style={{marginBottom:5}}>{x}</li>)}</ul></Section>
          <Section title="4. Prohibited Use"><ul style={{paddingLeft:18,margin:'4px 0'}}>{['Uploading fraudulent or illegal financial data.','Attempting unauthorized access to other users data.','Using for money laundering or tax evasion.','Reverse engineering the platform.','Reselling without written authorization.'].map((x,i)=><li key={i} style={{marginBottom:5}}>{x}</li>)}</ul></Section>
          <Section title="5. Financial Disclaimer & Liability">
            <div style={{background:'#fef9c3',border:'1px solid #fde047',borderRadius:8,padding:'10px 12px',marginBottom:10,fontSize:12}}>All AI-generated insights, forecasts, and documents are for informational purposes only and may contain errors.</div>
            <ul style={{paddingLeft:18,margin:'4px 0'}}>{['Deemona Global Solutions is NOT liable for financial losses, tax penalties, or regulatory fines from use of the Service.','Maximum aggregate liability shall not exceed subscription fees paid in preceding 3 months.','Users must verify all reports and filings with qualified professionals.'].map((x,i)=><li key={i} style={{marginBottom:5}}>{x}</li>)}</ul>
          </Section>
          <Section title="6. User Responsibility">You are solely responsible for accuracy of data entered, compliance with GST, TDS, Companies Act, and all applicable Indian laws.</Section>
          <Section title="7. Governing Law">Governed by laws of India. Disputes resolved through arbitration in New Delhi under Arbitration and Conciliation Act, 1996.</Section>
          <Section title="8. Contact"><strong>Deemona Global Solutions</strong> | legal@deemona.com | www.deemona.com</Section>
          <div style={{marginTop:20,display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
            <Link to="/privacy-policy" style={{padding:'8px 14px',borderRadius:7,background:'#eff6ff',color:'#1d4ed8',textDecoration:'none',fontSize:12,fontWeight:700}}>Privacy Policy</Link>
            <Link to="/license" style={{padding:'8px 14px',borderRadius:7,background:'#eff6ff',color:'#1d4ed8',textDecoration:'none',fontSize:12,fontWeight:700}}>License Agreement</Link>
            <Link to="/about" style={{padding:'8px 14px',borderRadius:7,background:'#eff6ff',color:'#1d4ed8',textDecoration:'none',fontSize:12,fontWeight:700}}>About Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
