import { Link } from 'react-router-dom';

export default function AboutUs() {
  const stats = [
    {n:'22+',l:'Core Finance Modules'},
    {n:'37',l:'Live Dashboards'},
    {n:'15',l:'AI Intelligence Modules'},
    {n:'105+',l:'Governance Documents'},
    {n:'14',l:'Auto-Scheduled Reports'},
    {n:'4',l:'Auto-Ingest Channels'},
  ];
  const features = [
    {icon:'&#128200;',title:'AI-Powered Finance',desc:'Claude AI integration for anomaly detection, smart insights, chatbot, predictive modeling, and automated report generation.'},
    {icon:'&#128202;',title:'37 Live Dashboards',desc:'Real-time financial dashboards covering P&L, Cash Flow, AR/AP, GST, TDS, Payroll, ESG, CRM, and more.'},
    {icon:'&#9889;',title:'Zero-Touch Automation',desc:'7 cron automations, 14 auto-scheduled reports, 4 auto-ingest channels — minimal manual intervention needed.'},
    {icon:'&#128196;',title:'105+ Documents',desc:'Auto-generated governance documents — corporate, tax, HR, investment, ESG, and legal documents under Indian law.'},
    {icon:'&#128274;',title:'Bank-Grade Security',desc:'Mandatory 2FA, AES-256 encryption, RBAC with 97+ permissions, audit trail, and DPDP Act 2023 compliance.'},
    {icon:'&#127758;',title:'Indian SME Focus',desc:'Built specifically for Indian businesses — GST, TDS, PF, ESIC, DPDP, and SEBI compliance out of the box.'},
  ];

  return (
    <div style={{minHeight:'100vh',background:'#f0f4ff'}}>
      <div style={{background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)',padding:'20px 40px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:22,fontWeight:900,color:'#fff'}}>Deemona AI Finance OS</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.7)'}}>by Deemona Global Solutions</div>
        </div>
        <Link to="/login" style={{padding:'8px 18px',borderRadius:8,background:'rgba(255,255,255,0.15)',color:'#fff',textDecoration:'none',fontSize:12,fontWeight:600}}>Back to Login</Link>
      </div>

      {/* Hero */}
      <div style={{background:'linear-gradient(135deg,#1e3a8a,#1d4ed8,#7c3aed)',padding:'60px 40px',textAlign:'center',color:'#fff'}}>
        <div style={{fontSize:42,fontWeight:900,marginBottom:12}}>About Deemona Global Solutions</div>
        <div style={{fontSize:16,opacity:0.85,maxWidth:600,margin:'0 auto',lineHeight:1.7}}>Building India&rsquo;s most advanced AI-powered financial management platform for SMEs, enterprises, and growing businesses.</div>
      </div>

      <div style={{maxWidth:960,margin:'0 auto',padding:'48px 24px'}}>

        {/* Mission */}
        <div style={{background:'#fff',borderRadius:14,padding:'40px 48px',boxShadow:'0 4px 30px rgba(0,0,0,0.08)',marginBottom:24}}>
          <h2 style={{fontSize:22,fontWeight:900,color:'#1e3a8a',marginBottom:14}}>Our Mission</h2>
          <p style={{fontSize:14,color:'#334155',lineHeight:1.9,marginBottom:14}}>
            At <strong>Deemona Global Solutions</strong>, we believe that world-class financial management should be accessible to every Indian business — not just large corporations with expensive ERP systems. Our mission is to democratize AI-powered financial intelligence for Indian SMEs.
          </p>
          <p style={{fontSize:14,color:'#334155',lineHeight:1.9}}>
            Deemona AI Finance OS is our flagship product — a comprehensive, cloud-based financial management platform that combines the power of Anthropic&rsquo;s Claude AI with deep Indian regulatory compliance (GST, TDS, DPDP, Companies Act, SEBI) to deliver an intelligent finance operating system for the modern Indian enterprise.
          </p>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
          {stats.map((s,i)=>(
            <div key={i} style={{background:'#fff',borderRadius:12,padding:'24px',textAlign:'center',boxShadow:'0 2px 16px rgba(0,0,0,0.06)',borderTop:'3px solid #1d4ed8'}}>
              <div style={{fontSize:36,fontWeight:900,color:'#1d4ed8',marginBottom:4}}>{s.n}</div>
              <div style={{fontSize:12,color:'#64748b',fontWeight:600}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{background:'#fff',borderRadius:14,padding:'40px 48px',boxShadow:'0 4px 30px rgba(0,0,0,0.08)',marginBottom:24}}>
          <h2 style={{fontSize:22,fontWeight:900,color:'#1e3a8a',marginBottom:24}}>What We Built</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
            {features.map((f,i)=>(
              <div key={i} style={{display:'flex',gap:14,padding:'16px',background:'#f8faff',borderRadius:10,border:'1px solid #e2e8f0'}}>
                <div style={{fontSize:28,flexShrink:0}} dangerouslySetInnerHTML={{__html:f.icon}}/>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:'#0f172a',marginBottom:4}}>{f.title}</div>
                  <div style={{fontSize:11,color:'#64748b',lineHeight:1.6}}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technology */}
        <div style={{background:'#fff',borderRadius:14,padding:'40px 48px',boxShadow:'0 4px 30px rgba(0,0,0,0.08)',marginBottom:24}}>
          <h2 style={{fontSize:22,fontWeight:900,color:'#1e3a8a',marginBottom:14}}>Technology Stack</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {[['Frontend','React 18 + Vite + Tailwind'],['Backend','Node.js + Express + TypeScript'],['Database','Neon PostgreSQL'],['AI','Anthropic Claude (Sonnet 4.6)'],['Email','Resend'],['Auth','JWT + Google OAuth + 2FA'],['Storage','Cloudflare R2'],['Hosting','Render.com']].map(([tech,desc],i)=>(
              <div key={i} style={{padding:'12px 14px',background:'#f0f4ff',borderRadius:8,border:'1px solid #dbeafe'}}>
                <div style={{fontSize:10,fontWeight:800,color:'#1d4ed8',textTransform:'uppercase',marginBottom:3}}>{tech}</div>
                <div style={{fontSize:11,color:'#334155',fontWeight:600}}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{background:'#fef2f2',border:'2px solid #fecaca',borderRadius:12,padding:'24px 28px',marginBottom:24}}>
          <div style={{fontSize:14,fontWeight:800,color:'#dc2626',marginBottom:8}}>Important Disclaimer</div>
          <div style={{fontSize:13,color:'#991b1b',lineHeight:1.8}}>
            Deemona AI Finance OS is a <strong>financial management and analytics tool</strong>. It is NOT a registered financial advisor, chartered accountant, tax consultant, or SEBI-registered investment advisor. All information, reports, insights, and analyses are for informational purposes only. <strong>Deemona Global Solutions shall not be responsible or liable for any financial loss, tax liability, regulatory penalty, or any other loss</strong> incurred as a result of reliance on data, reports, or AI-generated insights provided by this Application. Users must consult qualified professionals for financial, tax, legal, or investment decisions.
          </div>
        </div>

        {/* Contact */}
        <div style={{background:'#fff',borderRadius:14,padding:'40px 48px',boxShadow:'0 4px 30px rgba(0,0,0,0.08)'}}>
          <h2 style={{fontSize:22,fontWeight:900,color:'#1e3a8a',marginBottom:14}}>Contact Us</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,fontSize:13,color:'#334155'}}>
            {[['Company','Deemona Global Solutions'],['Product','Deemona AI Finance OS'],['General','info@deemona.com'],['Support','support@deemona.com'],['Legal','legal@deemona.com'],['Privacy','privacy@deemona.com'],['Website','www.deemona.com'],['Jurisdiction','New Delhi, India']].map(([l,v],i)=>(
              <div key={i} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:'1px solid #f1f5f9'}}>
                <span style={{color:'#64748b',minWidth:90,fontWeight:600}}>{l}:</span>
                <span style={{fontWeight:700,color:'#1e3a8a'}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{marginTop:20,display:'flex',gap:12}}>
            <Link to="/privacy-policy" style={{padding:'8px 16px',borderRadius:8,background:'#eff6ff',color:'#1d4ed8',textDecoration:'none',fontSize:12,fontWeight:700}}>Privacy Policy</Link>
            <Link to="/terms" style={{padding:'8px 16px',borderRadius:8,background:'#eff6ff',color:'#1d4ed8',textDecoration:'none',fontSize:12,fontWeight:700}}>Terms of Service</Link>
            <Link to="/license" style={{padding:'8px 16px',borderRadius:8,background:'#eff6ff',color:'#1d4ed8',textDecoration:'none',fontSize:12,fontWeight:700}}>License Agreement</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
