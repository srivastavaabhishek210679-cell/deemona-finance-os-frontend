const fs = require('fs');
const path = require('path');

const FRONTEND = 'C:/deemona-finance-os/frontend/src';

// 1. Create LandingPage.jsx from the HTML file
const landingJSX = `import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  // Redirect logged-in users to app
  useEffect(() => {
    if (user) window.location.href = '/memory';
  }, [user]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#0A1628', background: '#fff', overflowX: 'hidden' }}>
      <style>{\`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --blue: #1B4FD8; --blue-dk: #1239A8; --blue-lt: #EEF3FD;
          --green: #059669; --purple: #7C3AED; --orange: #D97706; --red: #DC2626;
          --ink: #0A1628; --ink-2: #334155; --ink-3: #64748B; --ink-4: #94A3B8;
          --rule: #C7D9F8; --surface: #F0F5FF; --white: #FFFFFF;
        }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; }
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600&display=swap');
        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; height: 64px; background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid #C7D9F8; }
        .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .nav-logo-icon { width: 36px; height: 36px; border-radius: 9px; background: #1B4FD8; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans',sans-serif; font-weight: 900; font-size: 16px; color: #fff; }
        .nav-links { display: flex; align-items: center; gap: 28px; }
        .nav-links a { font-size: 14px; font-weight: 500; color: #334155; text-decoration: none; transition: color 0.15s; }
        .nav-links a:hover { color: #1B4FD8; }
        .btn-ghost { padding: 8px 18px; border: 1px solid #C7D9F8; border-radius: 8px; font-size: 14px; font-weight: 600; color: #334155; text-decoration: none; background: transparent; cursor: pointer; }
        .btn-primary { padding: 9px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; color: #fff; background: #1B4FD8; text-decoration: none; cursor: pointer; }
        .hero { padding: 140px 48px 80px; background: linear-gradient(160deg, #F0F5FF 0%, #DBEAFE 40%, #EDE9FE 100%); text-align: center; }
        .hero h1 { font-family: 'Plus Jakarta Sans',sans-serif; font-size: clamp(36px,5vw,64px); font-weight: 900; color: #0A1628; max-width: 820px; margin: 0 auto 20px; letter-spacing: -0.02em; line-height: 1.15; }
        .accent { background: linear-gradient(135deg,#1B4FD8,#7C3AED); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-sub { font-size: clamp(16px,2vw,20px); color: #334155; max-width: 600px; margin: 0 auto 40px; }
        .hero-actions { display: flex; gap: 12px; justify-content: center; margin-bottom: 60px; }
        .btn-hero-primary { padding: 14px 28px; border: none; border-radius: 10px; font-size: 16px; font-weight: 700; color: #fff; background: linear-gradient(135deg,#1B4FD8,#3B82F6); text-decoration: none; cursor: pointer; box-shadow: 0 8px 24px rgba(27,79,216,0.3); display: inline-block; }
        .btn-hero-ghost { padding: 14px 28px; border: 2px solid #C7D9F8; border-radius: 10px; font-size: 16px; font-weight: 600; color: #334155; text-decoration: none; cursor: pointer; background: white; display: inline-block; }
        .hero-stats { display: flex; justify-content: center; gap: 40px; padding-top: 40px; border-top: 1px solid #C7D9F8; flex-wrap: wrap; }
        .stat-value { font-family: 'Plus Jakarta Sans',sans-serif; font-size: 28px; font-weight: 800; color: #1B4FD8; }
        .stat-label { font-size: 13px; color: #64748B; margin-top: 2px; }
        section { padding: 100px 48px; }
        .section-label { font-size: 12px; font-weight: 700; color: #1B4FD8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; }
        .section-title { font-family: 'Plus Jakarta Sans',sans-serif; font-size: clamp(28px,3vw,42px); font-weight: 800; color: #0A1628; margin-bottom: 16px; letter-spacing: -0.01em; }
        .section-sub { font-size: 18px; color: #334155; }
        .features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; max-width: 1100px; margin: 60px auto 0; }
        .feature-card { background: white; border-radius: 14px; border: 1px solid #C7D9F8; padding: 28px; transition: all 0.2s; }
        .feature-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(27,79,216,0.1); }
        .feature-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 16px; }
        .feature-title { font-family:'Plus Jakarta Sans',sans-serif; font-size: 17px; font-weight: 700; color: #0A1628; margin-bottom: 8px; }
        .feature-desc { font-size: 14px; color: #334155; line-height: 1.6; }
        .agents-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; max-width: 1100px; margin: 60px auto 0; }
        .agent-card { border-radius: 14px; padding: 24px; text-align: center; border: 1px solid #C7D9F8; transition: all 0.2s; }
        .agent-card:hover { transform: translateY(-3px); }
        .india-section { background: linear-gradient(135deg,#0A1628 0%,#1B4FD8 100%); color: white; }
        .india-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; max-width: 1100px; margin: 60px auto 0; }
        .india-item { padding: 24px; border-radius: 12px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); }
        .pricing-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; max-width: 1100px; margin: 60px auto 0; }
        .pricing-card { border-radius: 16px; padding: 28px; border: 2px solid #C7D9F8; position: relative; transition: all 0.2s; }
        .pricing-card.popular { border-color: #1B4FD8; box-shadow: 0 8px 32px rgba(27,79,216,0.12); }
        .compare-table { max-width: 900px; margin: 60px auto 0; border-radius: 16px; overflow: hidden; border: 1px solid #C7D9F8; }
        .compare-table table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .compare-table th { padding: 16px 20px; background: #1B4FD8; color: white; font-weight: 700; text-align: left; }
        .compare-table th:first-child { background: #0A1628; }
        .compare-table td { padding: 14px 20px; border-bottom: 1px solid #C7D9F8; }
        .cta-section { background: linear-gradient(135deg,#1B4FD8 0%,#7C3AED 100%); padding: 100px 48px; text-align: center; color: white; }
        footer { background: #0A1628; color: white; padding: 60px 48px 32px; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
        .footer-links { display: flex; flex-direction: column; gap: 10px; }
        .footer-links a { font-size: 14px; color: rgba(255,255,255,0.6); text-decoration: none; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @media (max-width:768px) {
          nav { padding: 0 16px; }
          .nav-links { display: none; }
          section { padding: 60px 20px; }
          .hero { padding: 100px 20px 60px; }
          .features-grid, .agents-grid, .india-grid, .pricing-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 24px; }
          .hero-actions { flex-direction: column; align-items: center; }
        }
      \`}</style>

      {/* Nav */}
      <nav>
        <a href="/" className="nav-logo">
          <div className="nav-logo-icon">D</div>
          <div>
            <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:16}}>Deemona</div>
            <div style={{fontSize:10,color:'#64748B'}}>AI Finance OS</div>
          </div>
        </a>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#agents">AI Agents</a>
          <a href="#pricing">Pricing</a>
          <a href="#compare">Compare</a>
        </div>
        <div style={{display:'flex',gap:10}}>
          <a href="/memory" className="btn-ghost">Login</a>
          <a href="/onboarding" className="btn-primary">Start Free Trial</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 14px',borderRadius:20,background:'rgba(27,79,216,0.08)',border:'1px solid rgba(27,79,216,0.2)',fontSize:13,fontWeight:600,color:'#1B4FD8',marginBottom:28}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#059669',animation:'pulse 2s infinite'}} />
          India's first AI-native finance platform · Powered by Claude AI
        </div>
        <h1>Your entire finance team,<br/><span className="accent">replaced by one AI.</span></h1>
        <p className="hero-sub">GST-native. WhatsApp-first. Claude-powered. Built for Indian enterprises — not adapted from a Western product.</p>
        <div className="hero-actions">
          <a href="/onboarding" className="btn-hero-primary">Start Free — No Card Required →</a>
          <a href="/dashboard" className="btn-hero-ghost">View Live Demo</a>
        </div>
        <div className="hero-stats">
          {[['20+','AI Agents included'],['34','Modules built-in'],['100%','GST & TDS compliant'],['Rs 0','Setup cost']].map(([v,l]) => (
            <div key={l} style={{textAlign:'center'}}>
              <div className="stat-value">{v}</div>
              <div className="stat-label">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{background:'#F0F5FF'}}>
        <div style={{maxWidth:1100,margin:'0 auto',textAlign:'center'}}>
          <div className="section-label">Everything you need</div>
          <h2 className="section-title">34 modules. One platform.</h2>
          <p className="section-sub">Replace your entire finance stack with one intelligent system.</p>
        </div>
        <div className="features-grid">
          {[
            {icon:'🤖',bg:'#EEF3FD',title:'Digital CFO',desc:'Ask any financial question in plain language. Get instant answers with data from your books, forecasts, and compliance calendar.'},
            {icon:'🧾',bg:'#ECFDF5',title:'GST Portal Integration',desc:'File GSTR-1, GSTR-3B directly. Auto-compute ITC, reconcile 2A vs books, track all deadlines with penalty alerts.'},
            {icon:'💳',bg:'#F5F3FF',title:'Real Payroll Engine',desc:'PF (12%), ESI (0.75%), TDS on salary — all calculated automatically per Indian tax slabs. Generate payslips with one click.'},
            {icon:'📄',bg:'#FEF2F2',title:'Document AI — Invoice OCR',desc:'Upload any invoice image. Claude Vision extracts vendor, amount, GST breakdown, line items — creates AP entry automatically.'},
            {icon:'⚡',bg:'#FFFBEB',title:'Visual Workflow Designer',desc:'Build automations like n8n — drag, drop, connect. Invoice approval, GST filing, payroll — all automated.'},
            {icon:'📱',bg:'#EEF3FD',title:'WhatsApp-Native Alerts',desc:'Approve invoices, receive payment alerts, get GST reminders — directly on WhatsApp. Reply APPROVE or REJECT.'},
            {icon:'💹',bg:'#ECFDF5',title:'Financial Digital Twin',desc:'Simulate hiring plans, new offices, product launches before committing. See projected P&L, cash flow, ROI.'},
            {icon:'🕸',bg:'#F5F3FF',title:'Enterprise Knowledge Graph',desc:'Visual map of all entities. Ask "who manages the Flipkart project?" in plain English.'},
            {icon:'🏢',bg:'#FFFBEB',title:'Multi-Company Management',desc:'Manage HQ, subsidiaries, branches from one login. Consolidated P&L, separate GST entities.'},
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon" style={{background:f.bg}}>{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Agents */}
      <section id="agents" style={{background:'white'}}>
        <div style={{maxWidth:1100,margin:'0 auto',textAlign:'center'}}>
          <div className="section-label">Your AI Workforce</div>
          <h2 className="section-title">4 AI employees. Always on.</h2>
          <p className="section-sub">Specialized AI agents trained on Indian finance, law, HR, and sales. Available 24/7.</p>
        </div>
        <div className="agents-grid">
          {[
            {avatar:'👩',name:'Arya',role:'HR AI Agent',color:'#7C3AED',bg:'#F5F3FF',border:'#DDD6FE',desc:'Payroll, PF/ESI compliance, hiring plans, leave policies. Expert in Indian labor law.'},
            {avatar:'🤵',name:'Raj',role:'Sales AI Agent',color:'#059669',bg:'#ECFDF5',border:'#A7F3D0',desc:'Pipeline analysis, deal strategy, proposal drafting, revenue forecasting.'},
            {avatar:'👩‍💼',name:'Priya',role:'Procurement AI',color:'#D97706',bg:'#FFFBEB',border:'#FDE68A',desc:'Vendor evaluation, spend analysis, PO automation, GSTIN verification.'},
            {avatar:'⚖️',name:'Adv. Kumar',role:'Legal AI Agent',color:'#DC2626',bg:'#FEF2F2',border:'#FECACA',desc:'Contract review, NDA drafting, DPDP compliance, Indian law specialist.'},
          ].map(a => (
            <div key={a.name} className="agent-card" style={{background:a.bg,borderColor:a.border}}>
              <div style={{fontSize:40,marginBottom:12}}>{a.avatar}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:18,fontWeight:800,marginBottom:4}}>{a.name}</div>
              <div style={{fontSize:12,fontWeight:600,color:a.color,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10}}>{a.role}</div>
              <div style={{fontSize:13,color:'#334155',lineHeight:1.5}}>{a.desc}</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,marginTop:12,fontSize:11,fontWeight:600,color:'#059669'}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'#059669'}} />Available now
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* India First */}
      <section className="india-section">
        <div style={{maxWidth:1100,margin:'0 auto',textAlign:'center'}}>
          <div className="section-label" style={{color:'rgba(255,255,255,0.6)'}}>Built for India</div>
          <h2 className="section-title" style={{color:'white'}}>Every Indian compliance requirement, built-in.</h2>
        </div>
        <div className="india-grid">
          {[
            {icon:'🧾',title:'GST End-to-End',desc:'GSTR-1, GSTR-3B, GSTR-9. ITC reconciliation. HSN/SAC codes. E-invoice. Penalty alerts.'},
            {icon:'💰',title:'TDS & Advance Tax',desc:'Section 192, 194C, 194I. Quarterly advance tax. Form 16/16A generation.'},
            {icon:'👥',title:'PF, ESI & PT',desc:'EPFO ECR filing. ESIC return. Professional Tax across states. UAN management.'},
            {icon:'🏦',title:'Indian Bank Import',desc:'CSV import from HDFC, ICICI, SBI, Axis, Kotak. Auto-categorize. Reconciliation.'},
            {icon:'📊',title:'Tally Compatible',desc:'Export vouchers in Tally XML. Import Tally data. CA-friendly.'},
            {icon:'📱',title:'WhatsApp Business',desc:'Invoice approvals, payment alerts, compliance reminders on WhatsApp.'},
            {icon:'🔒',title:'DPDP Compliant',desc:"India's Digital Personal Data Protection Act 2023. Data in Singapore region."},
            {icon:'💱',title:'Multi-Currency',desc:'USD, EUR, GBP, AED, SGD + 5 more. Live exchange rates. Export business support.'},
          ].map(i => (
            <div key={i.title} className="india-item">
              <div style={{fontSize:28,marginBottom:12}}>{i.icon}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:16,fontWeight:700,color:'white',marginBottom:6}}>{i.title}</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.65)',lineHeight:1.5}}>{i.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Compare */}
      <section id="compare" style={{background:'#F0F5FF'}}>
        <div style={{maxWidth:1100,margin:'0 auto',textAlign:'center'}}>
          <div className="section-label">Head to head</div>
          <h2 className="section-title">How Deemona compares</h2>
        </div>
        <div className="compare-table">
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Deemona</th>
                <th>Tally Prime</th>
                <th>Zoho Books</th>
                <th>SAP B1</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['AI CFO / Assistant','✓','✗','✗','✗'],
                ['GST Portal Filing','✓','✓','✓','Plugin'],
                ['WhatsApp Integration','✓','✗','✗','✗'],
                ['Invoice OCR (AI)','✓','✗','Basic','Plugin'],
                ['Financial Digital Twin','✓','✗','✗','✗'],
                ['Visual Workflow Builder','✓','✗','Limited','Extra cost'],
                ['Knowledge Graph','✓','✗','✗','✗'],
                ['Multi-Company','✓','Extra cost','Extra cost','✓'],
                ['Starting Price','Rs 2,999/mo','Rs 18,000/yr','Rs 3,999/mo','Rs 50,000+'],
              ].map((row,i) => (
                <tr key={i} style={{background:i%2===0?'white':'#F8FAFC'}}>
                  <td style={{padding:'14px 20px',fontWeight:500}}>{row[0]}</td>
                  {row.slice(1).map((cell,j) => (
                    <td key={j} style={{padding:'14px 20px',textAlign:'center',color:cell==='✓'?'#059669':cell==='✗'?'#DC2626':cell.includes('Rs 2,999')?'#1B4FD8':'#334155',fontWeight:cell==='✓'||cell==='✗'||cell.includes('Rs 2,999')?700:400,fontSize:cell==='✓'||cell==='✗'?18:14}}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{background:'white'}}>
        <div style={{maxWidth:1100,margin:'0 auto',textAlign:'center'}}>
          <div className="section-label">Simple pricing</div>
          <h2 className="section-title">Less than your monthly CA bill</h2>
        </div>
        <div className="pricing-grid">
          {[
            {plan:'Starter',price:'Rs 2,999',period:'/month',desc:'For freelancers and small businesses',features:['5 users','1,000 invoices/month','GST filing','Basic AI','3 bank accounts'],popular:false},
            {plan:'Pro',price:'Rs 7,999',period:'/month',desc:'For growing SMEs that need full AI',features:['15 users','Unlimited invoices','All 4 AI agents','WhatsApp integration','Document AI / OCR','Workflow automation'],popular:true},
            {plan:'Business',price:'Rs 14,999',period:'/month',desc:'Multi-company, advanced compliance',features:['50 users','Multi-company','Consolidated P&L','Advanced audit trail','API access'],popular:false},
            {plan:'Enterprise',price:'Custom',period:'',desc:'For large enterprises',features:['Unlimited users','Custom AI models','White-label','SLA guarantee','Dedicated engineer'],popular:false},
          ].map(p => (
            <div key={p.plan} className={\`pricing-card \${p.popular?'popular':''}\`}>
              {p.popular && <div style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',padding:'4px 12px',borderRadius:20,background:'#1B4FD8',color:'white',fontSize:11,fontWeight:700,whiteSpace:'nowrap'}}>Most Popular</div>}
              <div style={{fontSize:13,fontWeight:700,color:'#64748B',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>{p.plan}</div>
              <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:32,fontWeight:900,color:'#0A1628'}}>{p.price} <span style={{fontSize:13,fontWeight:400,color:'#64748B'}}>{p.period}</span></div>
              <div style={{fontSize:13,color:'#334155',margin:'12px 0 20px'}}>{p.desc}</div>
              <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
                {p.features.map(f => <li key={f} style={{fontSize:13,color:'#334155',display:'flex',alignItems:'center',gap:8}}><span style={{color:'#059669',fontWeight:700}}>✓</span>{f}</li>)}
              </ul>
              <a href="/onboarding" style={{display:'block',textAlign:'center',padding:11,borderRadius:9,fontSize:14,fontWeight:700,textDecoration:'none',background:p.popular?'#1B4FD8':'transparent',color:p.popular?'white':'#334155',border:p.popular?'none':'2px solid #C7D9F8'}}>
                {p.plan==='Enterprise'?'Contact Sales':'Start Free Trial'}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2 style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:'clamp(28px,3vw,48px)',fontWeight:900,marginBottom:16}}>Ready to transform your finance?</h2>
        <p style={{fontSize:18,color:'rgba(255,255,255,0.8)',marginBottom:40,maxWidth:500,margin:'0 auto 40px'}}>Join Indian businesses using Deemona AI Finance OS. Setup in 5 minutes.</p>
        <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
          <a href="/onboarding" style={{padding:'15px 32px',borderRadius:10,fontSize:16,fontWeight:700,color:'#1B4FD8',background:'white',textDecoration:'none'}}>Start Free Trial — 14 days free</a>
          <a href="/dashboard" style={{padding:'15px 32px',borderRadius:10,fontSize:16,fontWeight:600,color:'white',border:'2px solid rgba(255,255,255,0.4)',textDecoration:'none'}}>View Live Demo →</a>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <div className="footer-grid">
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:32,height:32,borderRadius:8,background:'#1B4FD8',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,fontSize:14,color:'white'}}>D</div>
                <span style={{fontFamily:"'Plus Jakarta Sans',sans-serif",fontWeight:800,fontSize:15}}>Deemona AI Finance OS</span>
              </div>
              <div style={{fontSize:14,color:'rgba(255,255,255,0.55)',maxWidth:280,lineHeight:1.7}}>India's first AI-native finance platform. GST-first, WhatsApp-native, Claude-powered.</div>
              <div style={{marginTop:16,display:'flex',gap:10}}>
                <span style={{fontSize:11,padding:'3px 8px',borderRadius:20,background:'rgba(27,79,216,0.2)',color:'rgba(255,255,255,0.7)'}}>🇮🇳 Made in India</span>
                <span style={{fontSize:11,padding:'3px 8px',borderRadius:20,background:'rgba(27,79,216,0.2)',color:'rgba(255,255,255,0.7)'}}>🤖 Claude-powered</span>
              </div>
            </div>
            {[
              {title:'Product',links:['Features','AI Agents','Pricing','Compare','Live Demo']},
              {title:'Compliance',links:['GST Filing','TDS Management','PF & ESI','DPDP Act','Audit Trail']},
              {title:'Company',links:['About','Blog','Sales','Support','Privacy']},
            ].map(col => (
              <div key={col.title}>
                <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'rgba(255,255,255,0.4)',marginBottom:16}}>{col.title}</div>
                <div className="footer-links">
                  {col.links.map(l => <a key={l} href="#">{l}</a>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:32,borderTop:'1px solid rgba(255,255,255,0.1)',fontSize:13,color:'rgba(255,255,255,0.4)',flexWrap:'wrap',gap:10}}>
            <div>© 2026 Deemona Technologies Pvt Ltd. All rights reserved.</div>
            <div style={{display:'flex',gap:20}}>
              {['Privacy','Terms','Security'].map(l => <a key={l} href="#" style={{color:'rgba(255,255,255,0.4)',textDecoration:'none'}}>{l}</a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
`;

const destDir = path.join(FRONTEND.replace(/\//g,'\\'), 'pages');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
fs.writeFileSync(path.join(destDir, 'LandingPage.jsx'), landingJSX, 'utf8');
console.log('✓ LandingPage.jsx created');

// 2. Wire into App.jsx
const appFile = path.join(FRONTEND.replace(/\//g,'\\'), 'App.jsx');
let app = fs.readFileSync(appFile, 'utf8');

// Add import
if (!app.includes('LandingPage')) {
  app = app.replace(
    "import DashboardPage from './components/dashboard/DashboardPage';",
    "import LandingPage from './pages/LandingPage';\nimport DashboardPage from './components/dashboard/DashboardPage';"
  );
  console.log('✓ Import added');
}

// Add route for / that shows landing for non-logged-in users
// The app already has { path: '/' } pointing to FinanceMemoryPage
// We need to show LandingPage there instead and redirect logged-in users
// Strategy: Add /landing route AND modify the root / behavior

if (!app.includes('/landing')) {
  app = app.replace(
    "{ path: '/memory',",
    "{ path: '/landing', title: 'Deemona Finance OS', sub: 'India\\'s first AI-native finance platform.', comp: <LandingPage /> },\n    { path: '/memory',"
  );
  console.log('✓ /landing route added');
}

// Modify root / route to use LandingPage
if (app.includes("{ path: '/',")) {
  app = app.replace(
    "{ path: '/',             title: 'Finance Memory',",
    "{ path: '/',             title: 'Deemona Finance OS', sub: 'India\\'s first AI-native finance platform.', comp: <LandingPage />, public: true },\n    { path: '/app',           title: 'Finance Memory',"
  );
  console.log('✓ Root / now shows LandingPage for non-logged-in users');
}

fs.writeFileSync(appFile, app, 'utf8');
console.log('\n✅ Landing page integrated!');
console.log('Routes: / → LandingPage, /landing → LandingPage');
