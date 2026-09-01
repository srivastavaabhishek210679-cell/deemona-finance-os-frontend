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

export default function LicenseAgreement() {
  return (
    <div style={{minHeight:'100vh',background:'#f0f4ff'}}>
      <Header/>
      <div style={{maxWidth:860,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{background:'#fff',borderRadius:12,padding:'24px 20px',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <div style={{textAlign:'center',marginBottom:28}}>
            <h1 style={{fontSize:22,fontWeight:900,color:'#1e3a8a',marginBottom:6}}>Software License Agreement</h1>
            <div style={{fontSize:11,color:'#64748b'}}>Version 1.0 | Effective: 1 September 2026</div>
            <div style={{marginTop:8,padding:'4px 12px',background:'#eff6ff',borderRadius:6,display:'inline-block',fontSize:11,color:'#1d4ed8',fontWeight:600}}>END USER LICENSE AGREEMENT (EULA)</div>
          </div>
          <div style={{background:'#f0fdf4',border:'2px solid #bbf7d0',borderRadius:10,padding:'12px 16px',marginBottom:24,fontSize:12,color:'#166534',lineHeight:1.7}}>By accessing or using Deemona AI Finance OS, you agree to the terms of this EULA with <strong>Deemona Global Solutions</strong>.</div>
          <Section title="1. License Grant">A limited, non-exclusive, non-transferable, revocable license to use Deemona AI Finance OS solely for your internal business purposes, subject to payment of applicable subscription fees.</Section>
          <Section title="2. Ownership">Deemona AI Finance OS — including all software, AI models, databases, interfaces, and IP — is the exclusive property of <strong>Deemona Global Solutions</strong>. This EULA grants only a limited usage license, not ownership.</Section>
          <Section title="3. Restrictions"><ul style={{paddingLeft:18,margin:'4px 0'}}>{['No copying, modification, or derivative works.','No reverse engineering or decompiling.','No resale or sublicensing without written permission.','No use to build competing products.','No credential sharing with unauthorized persons.'].map((x,i)=><li key={i} style={{marginBottom:5}}>{x}</li>)}</ul></Section>
          <Section title="4. AI Features — Limitations">
            <div style={{background:'#fffbeb',border:'1px solid #fde047',borderRadius:8,padding:'10px 12px',marginBottom:10,fontSize:12}}>AI features may produce errors or inaccuracies. All AI output must be verified by qualified professionals.</div>
            <ul style={{paddingLeft:18,margin:'4px 0'}}>{['AI reports are for informational purposes only.','AI legal documents are templates, not legal advice.','Predictive models are estimates, not guarantees.','Deemona Global Solutions is not liable for AI output decisions.'].map((x,i)=><li key={i} style={{marginBottom:5}}>{x}</li>)}</ul>
          </Section>
          <Section title="5. Disclaimer of Warranties">THE SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTIES. DEEMONA GLOBAL SOLUTIONS DISCLAIMS ALL WARRANTIES INCLUDING MERCHANTABILITY, FITNESS FOR PURPOSE, AND ACCURACY OF AI OUTPUT.</Section>
          <Section title="6. Limitation of Liability">DEEMONA GLOBAL SOLUTIONS SHALL NOT BE LIABLE FOR ANY FINANCIAL LOSS, TAX LIABILITY, REGULATORY FINE, OR ANY OTHER DAMAGES. MAXIMUM LIABILITY SHALL NOT EXCEED SUBSCRIPTION FEES PAID IN PRECEDING 3 MONTHS.</Section>
          <Section title="7. Governing Law">Governed by laws of India. Exclusive jurisdiction: courts of New Delhi, India.</Section>
          <Section title="8. Contact"><strong>Deemona Global Solutions</strong> | legal@deemona.com | www.deemona.com</Section>
          <div style={{marginTop:20,display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
            <Link to="/privacy-policy" style={{padding:'8px 14px',borderRadius:7,background:'#eff6ff',color:'#1d4ed8',textDecoration:'none',fontSize:12,fontWeight:700}}>Privacy Policy</Link>
            <Link to="/terms" style={{padding:'8px 14px',borderRadius:7,background:'#eff6ff',color:'#1d4ed8',textDecoration:'none',fontSize:12,fontWeight:700}}>Terms of Service</Link>
            <Link to="/about" style={{padding:'8px 14px',borderRadius:7,background:'#eff6ff',color:'#1d4ed8',textDecoration:'none',fontSize:12,fontWeight:700}}>About Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
