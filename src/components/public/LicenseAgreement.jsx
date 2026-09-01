import { Link } from 'react-router-dom';

const Section = ({title, children}) => (
  <div style={{marginBottom:28}}>
    <h2 style={{fontSize:16,fontWeight:800,color:'#1e3a8a',marginBottom:10,paddingBottom:6,borderBottom:'2px solid #e2e8f0'}}>{title}</h2>
    <div style={{fontSize:13,color:'#334155',lineHeight:1.9}}>{children}</div>
  </div>
);
const Li = ({children}) => <li style={{marginBottom:6,lineHeight:1.7}}>{children}</li>;

export default function LicenseAgreement() {
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
            <h1 style={{fontSize:28,fontWeight:900,color:'#1e3a8a',marginBottom:6}}>Software License Agreement</h1>
            <div style={{fontSize:12,color:'#64748b'}}>Effective Date: 1 September 2026 &nbsp;|&nbsp; Version: 1.0</div>
            <div style={{marginTop:8,padding:'6px 16px',background:'#eff6ff',borderRadius:6,display:'inline-block',fontSize:12,color:'#1d4ed8',fontWeight:600}}>END USER LICENSE AGREEMENT (EULA)</div>
          </div>

          <div style={{background:'#f0fdf4',border:'2px solid #bbf7d0',borderRadius:10,padding:'14px 18px',marginBottom:28}}>
            <div style={{fontSize:13,fontWeight:700,color:'#14532d',marginBottom:4}}>This is a Legal Agreement</div>
            <div style={{fontSize:12,color:'#166534',lineHeight:1.7}}>
              This End User License Agreement (&ldquo;EULA&rdquo;) is a legal agreement between you (individual or entity) and <strong>Deemona Global Solutions</strong> for the use of <strong>Deemona AI Finance OS</strong>. By accessing or using the Software, you agree to the terms of this EULA. If you do not agree, do not use the Software.
            </div>
          </div>

          <Section title="1. License Grant">
            Subject to your compliance with this EULA and payment of applicable subscription fees, <strong>Deemona Global Solutions</strong> grants you a limited, non-exclusive, non-transferable, revocable license to access and use Deemona AI Finance OS solely for your internal business purposes.
          </Section>

          <Section title="2. Ownership">
            Deemona AI Finance OS, including all software, algorithms, AI models, databases, interfaces, documentation, trademarks, and intellectual property, is and shall remain the exclusive property of <strong>Deemona Global Solutions</strong>. This EULA does not transfer any ownership rights to you. You receive only a limited license to use the Software as described herein.
          </Section>

          <Section title="3. License Restrictions">
            You may NOT:
            <ul style={{paddingLeft:20,marginTop:8}}>
              <Li>Copy, modify, adapt, translate, or create derivative works of the Software.</Li>
              <Li>Reverse engineer, decompile, disassemble, or attempt to derive the source code.</Li>
              <Li>Sell, sublicense, resell, transfer, or otherwise commercially exploit the Software.</Li>
              <Li>Remove or alter any proprietary notices, labels, or marks on the Software.</Li>
              <Li>Use the Software to build a competing product or service.</Li>
              <Li>Share login credentials with unauthorized persons.</Li>
              <Li>Use the Software beyond the scope of your subscription plan.</Li>
            </ul>
          </Section>

          <Section title="4. Multi-Tenant Architecture">
            The Software operates as a multi-tenant SaaS platform. Your data is logically isolated from other tenants using tenant-level security. While we take all reasonable measures to protect your data, the underlying infrastructure is shared. You acknowledge this architecture and agree to it.
          </Section>

          <Section title="5. AI-Powered Features — Important Limitations">
            <div style={{background:'#fffbeb',border:'1px solid #fde047',borderRadius:8,padding:'12px 16px',marginBottom:10}}>
              The AI features of Deemona AI Finance OS (including anomaly detection, financial insights, predictive modeling, chatbot, and document generation) are powered by large language models. These features may produce errors, inaccuracies, or hallucinations. All AI output must be verified by qualified human professionals before reliance.
            </div>
            <ul style={{paddingLeft:20}}>
              <Li>AI-generated financial reports are for informational purposes only.</Li>
              <Li>AI-generated legal documents are templates and not substitutes for legal advice.</Li>
              <Li>Predictive models and forecasts are estimates based on historical data and are not guarantees.</Li>
              <Li>Deemona Global Solutions is not liable for decisions made based on AI-generated output.</Li>
            </ul>
          </Section>

          <Section title="6. Third-Party Components">
            The Software incorporates third-party components including but not limited to: Anthropic Claude AI, Google OAuth, Resend Email, Twilio, Neon PostgreSQL, and Recharts. These components are subject to their respective licenses and terms of service. Deemona Global Solutions is not responsible for third-party service outages or changes.
          </Section>

          <Section title="7. Updates & Upgrades">
            Deemona Global Solutions may provide updates, patches, and new versions of the Software at its discretion. Updates may be mandatory and applied automatically. New features may be subject to additional terms or fees.
          </Section>

          <Section title="8. Disclaimer of Warranties">
            THE SOFTWARE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTY OF ANY KIND. DEEMONA GLOBAL SOLUTIONS EXPRESSLY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ACCURACY OF FINANCIAL DATA OR AI OUTPUT.
          </Section>

          <Section title="9. Limitation of Liability">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, DEEMONA GLOBAL SOLUTIONS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING <strong>ANY FINANCIAL LOSS, TAX LIABILITY, REGULATORY FINE, BUSINESS INTERRUPTION, OR LOSS OF DATA</strong>, ARISING FROM USE OF OR INABILITY TO USE THE SOFTWARE, EVEN IF DEEMONA GLOBAL SOLUTIONS HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. THE AGGREGATE LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU IN THE PRECEDING THREE (3) MONTHS.
          </Section>

          <Section title="10. Termination">
            This license is effective until terminated. It terminates automatically if you breach any provision. Deemona Global Solutions may terminate this license at any time with or without cause, with 30 days notice except in cases of material breach. Upon termination, you must cease all use of the Software.
          </Section>

          <Section title="11. Governing Law">
            This EULA is governed by the laws of India. The courts of New Delhi, India shall have exclusive jurisdiction over any disputes arising from this EULA. The United Nations Convention on Contracts for the International Sale of Goods shall not apply.
          </Section>

          <Section title="12. Entire Agreement">
            This EULA, together with the Privacy Policy and Terms of Service, constitutes the entire agreement between you and Deemona Global Solutions regarding the Software and supersedes all prior agreements.
          </Section>

          <Section title="13. Contact">
            <strong>Deemona Global Solutions</strong><br/>
            Email: <strong>legal@deemona.com</strong><br/>
            Website: <strong>www.deemona.com</strong>
          </Section>
        </div>
      </div>
    </div>
  );
}
