import { Link } from 'react-router-dom';

export default function AboutUs() {
  const stats = [{n:'22+',l:'Finance Modules'},{n:'37',l:'Dashboards'},{n:'15',l:'AI Modules'},{n:'105+',l:'Documents'},{n:'14',l:'Auto Reports'},{n:'4',l:'Ingest Channels'}];
  const features = [
    {icon:'AI',title:'AI-Powered Finance',desc:'Claude AI for anomaly detection, smart insights, chatbot, predictive modeling.'},
    {icon:'37',title:'Live Dashboards',desc:'Real-time P&L, Cash Flow, AR/AP, GST, TDS, Payroll, ESG, CRM dashboards.'},
    {icon:'Auto',title:'Zero-Touch Automation',desc:'7 cron jobs, 14 auto-scheduled reports, 4 auto-ingest channels.'},
    {icon:'105',title:'Governance Documents',desc:'Corporate, tax, HR, investment, ESG, and legal documents auto-generated.'},
    {icon:'Lock',title:'Bank-Grade Security',desc:'Mandatory 2FA, AES-256, RBAC with 97+ permissions, DPDP compliant.'},
    {icon:'IND',title:'Indian SME Focus',desc:'GST, TDS, PF, ESIC, DPDP, Companies Act compliance built-in.'},
  ];
  return (
    <div style={{minHeight:'100vh',background:'#f0f4ff'}}>
      <div style={{background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)',padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontSize:18,fontWeight:900,color:'#fff'}}>Deemona AI Finance OS</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.7)'}}>by Deemona Global Solutions</div>
        </div>
        <Link to="/login" style={{padding:'8px 16px',borderRadius:8,background:'rgba(255,255,255,0.15)',color:'#fff',textDecoration:'none',fontSize:12,fontWeight:600}}>Back to Login</Link>
      </div>

      <div style={{background:'linear-gradient(135deg,#1e3a8a,#1d4ed8,#7c3aed)',padding:'40px 20px',textAlign:'center',color:'#fff'}}>
        <div style={{fontSize:28,fontWeight:900,marginBottom:10}}>About Deemona Global Solutions</div>
        <div style={{fontSize:14,opacity:0.85,maxWidth:560,margin:'0 auto',lineHeight:1.7}}>Building India's most advanced AI-powered financial management platform for SMEs and enterprises.</div>
      </div>

      <div style={{maxWidth:960,margin:'0 auto',padding:'24px 16px'}}>
        <div style={{background:'#fff',borderRadius:12,padding:'24px 20px',boxShadow:'0 4px 20px rgba(0,0,0,0.08)',marginBottom:16}}>
          <h2 style={{fontSize:18,fontWeight:900,color:'#1e3a8a',marginBottom:12}}>Our Mission</h2>
          <p style={{fontSize:13,color:'#334155',lineHeight:1.9}}>At <strong>Deemona Global Solutions</strong>, we believe world-class financial management should be accessible to every Indian business. Deemona AI Finance OS combines Anthropic's Claude AI with deep Indian regulatory compliance to deliver an intelligent finance operating system.</p>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:16}}>
          {stats.map((s,i)=>(
            <div key={i} style={{background:'#fff',borderRadius:10,padding:'16px 12px',textAlign:'center',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',borderTop:'3px solid #1d4ed8'}}>
              <div style={{fontSize:28,fontWeight:900,color:'#1d4ed8',marginBottom:3}}>{s.n}</div>
              <div style={{fontSize:11,color:'#64748b',fontWeight:600}}>{s.l}</div>
            </div>
          ))}
        </div>

        <div style={{background:'#fff',borderRadius:12,padding:'24px 20px',boxShadow:'0 4px 20px rgba(0,0,0,0.08)',marginBottom:16}}>
          <h2 style={{fontSize:18,fontWeight:900,color:'#1e3a8a',marginBottom:16}}>What We Built</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>
            {features.map((f,i)=>(
              <div key={i} style={{display:'flex',gap:12,padding:'14px',background:'#f8faff',borderRadius:10,border:'1px solid #e2e8f0'}}>
                <div style={{width:36,height:36,borderRadius:8,background:'#1d4ed8',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:10,fontWeight:800,flexShrink:0}}>{f.icon}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:800,color:'#0f172a',marginBottom:3}}>{f.title}</div>
                  <div style={{fontSize:11,color:'#64748b',lineHeight:1.5}}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:'#fef2f2',border:'2px solid #fecaca',borderRadius:12,padding:'20px',marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:800,color:'#dc2626',marginBottom:8}}>Important Disclaimer</div>
          <div style={{fontSize:12,color:'#991b1b',lineHeight:1.8}}>Deemona AI Finance OS is a financial management tool, NOT a financial advisor or tax consultant. <strong>Deemona Global Solutions shall not be responsible for any financial loss</strong> incurred from use of this Application. Consult qualified professionals for financial decisions.</div>
        </div>

        <div style={{background:'#fff',borderRadius:12,padding:'24px 20px',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <h2 style={{fontSize:18,fontWeight:900,color:'#1e3a8a',marginBottom:14}}>Contact Us</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10,fontSize:13,marginBottom:16}}>
            {[['Company','Deemona Global Solutions'],['Product','Deemona AI Finance OS'],['Support','support@deemona.com'],['Legal','legal@deemona.com'],['Privacy','privacy@deemona.com'],['Website','www.deemona.com']].map(([l,v],i)=>(
              <div key={i} style={{display:'flex',gap:8,padding:'8px 0',borderBottom:'1px solid #f1f5f9'}}>
                <span style={{color:'#64748b',fontWeight:600,minWidth:70}}>{l}:</span>
                <span style={{fontWeight:700,color:'#1e3a8a'}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <Link to="/privacy-policy" style={{padding:'8px 14px',borderRadius:7,background:'#eff6ff',color:'#1d4ed8',textDecoration:'none',fontSize:12,fontWeight:700}}>Privacy Policy</Link>
            <Link to="/terms" style={{padding:'8px 14px',borderRadius:7,background:'#eff6ff',color:'#1d4ed8',textDecoration:'none',fontSize:12,fontWeight:700}}>Terms of Service</Link>
            <Link to="/license" style={{padding:'8px 14px',borderRadius:7,background:'#eff6ff',color:'#1d4ed8',textDecoration:'none',fontSize:12,fontWeight:700}}>License Agreement</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
