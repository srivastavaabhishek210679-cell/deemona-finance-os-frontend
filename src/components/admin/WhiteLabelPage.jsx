import { useState } from 'react';
import { apiURL } from '../../api.js';
const post = async (url, body) => { try { const r = await fetch(apiURL(url), { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('token')??''}`}, body:JSON.stringify(body) }); return await r.json(); } catch(e) { return {}; } };

export function WhiteLabelPage() {
  const [s, setS] = useState({ company_name:'Deemona Technologies', primary_color:'#1B4FD8', sidebar_color:'#1B4FD8', secondary_color:'#059669', accent_color:'#7C3AED', font_family:'Inter', topbar_style:'light', logo_url:'', custom_domain:'', footer_text:'Powered by Deemona AI Finance OS', show_powered_by:true, support_email:'support@deemona.com' });
  const [saved, setSaved] = useState(false);
  const PRESETS = [
    { name:'Ocean Blue', primary:'#1B4FD8', sidebar:'#1B4FD8', secondary:'#059669', accent:'#7C3AED' },
    { name:'Forest Green', primary:'#059669', sidebar:'#065F46', secondary:'#1B4FD8', accent:'#D97706' },
    { name:'Royal Purple', primary:'#7C3AED', sidebar:'#4C1D95', secondary:'#059669', accent:'#1B4FD8' },
    { name:'Midnight Dark', primary:'#334155', sidebar:'#0F172A', secondary:'#1B4FD8', accent:'#059669' },
    { name:'Sunset Orange', primary:'#D97706', sidebar:'#92400E', secondary:'#DC2626', accent:'#7C3AED' },
  ];
  const save = () => { localStorage.setItem('white_label', JSON.stringify(s)); post('/api/admin/white-label', s); setSaved(true); setTimeout(()=>setSaved(false),2000); };
  const F = ({label, field, placeholder, type='text'}) => (
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:12,fontWeight:600,color:'#64748B',marginBottom:5}}>{label}</label>
      <input type={type} value={s[field]} onChange={e=>setS(p=>({...p,[field]:e.target.value}))} placeholder={placeholder}
        style={{width:'100%',boxSizing:'border-box',padding:'8px 10px',borderRadius:7,border:'1px solid #C7D9F8',fontSize:13,outline:'none',fontFamily:'inherit'}} />
    </div>
  );
  const CP = ({label, field}) => (
    <div style={{marginBottom:14}}>
      <label style={{display:'block',fontSize:12,fontWeight:600,color:'#64748B',marginBottom:5}}>{label}</label>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <input type="color" value={s[field]} onChange={e=>setS(p=>({...p,[field]:e.target.value}))} style={{width:44,height:36,borderRadius:7,border:'1px solid #C7D9F8',cursor:'pointer',padding:2}} />
        <input value={s[field]} onChange={e=>setS(p=>({...p,[field]:e.target.value}))} style={{flex:1,padding:'8px 10px',borderRadius:7,border:'1px solid #C7D9F8',fontSize:12,outline:'none',fontFamily:'monospace'}} />
        <div style={{width:36,height:36,borderRadius:7,background:s[field],border:'1px solid #E2E8F0'}} />
      </div>
    </div>
  );
  return (
    <div style={{padding:24,background:'#EEF3FD',minHeight:'100%'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:800,color:'#0A1628',marginBottom:4}}>White-Label Settings</h1>
          <div style={{fontSize:13,color:'#64748B'}}>Customize branding, colors, and domain for your organization.</div>
        </div>
        <button onClick={save} style={{padding:'9px 20px',borderRadius:8,border:'none',background:'#1B4FD8',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>
          {saved ? '✓ Saved!' : '💾 Save Branding'}
        </button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
        <div>
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:14}}>🏢 Brand Identity</div>
            <F label="Company Name" field="company_name" placeholder="Your Company" />
            <F label="Logo URL" field="logo_url" placeholder="https://yourcompany.com/logo.png" />
            <F label="Support Email" field="support_email" placeholder="support@company.com" />
            <F label="Footer Text" field="footer_text" placeholder="Powered by Your Company" />
            <F label="Custom Domain" field="custom_domain" placeholder="finance.yourcompany.com" />
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <input type="checkbox" checked={s.show_powered_by} onChange={e=>setS(p=>({...p,show_powered_by:e.target.checked}))} style={{accentColor:'#1B4FD8',width:16,height:16}} />
              <label style={{fontSize:12,color:'#334155'}}>Show Powered by Deemona badge</label>
            </div>
          </div>
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:10}}>🎨 Color Palette</div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:600,color:'#64748B',marginBottom:8}}>Quick Presets</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {PRESETS.map(p => (
                  <button key={p.name} onClick={()=>setS(prev=>({...prev,primary_color:p.primary,sidebar_color:p.sidebar,secondary_color:p.secondary,accent_color:p.accent}))}
                    style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:20,border:'1px solid #E2E8F0',background:'#F8FAFC',cursor:'pointer',fontSize:11,fontWeight:600,color:'#334155'}}>
                    <div style={{display:'flex',gap:2}}>{[p.primary,p.secondary,p.accent].map((c,i)=><div key={i} style={{width:8,height:8,borderRadius:'50%',background:c}} />)}</div>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <CP label="Primary Color" field="primary_color" />
            <CP label="Sidebar Color" field="sidebar_color" />
            <CP label="Secondary Color" field="secondary_color" />
            <CP label="Accent Color" field="accent_color" />
          </div>
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #C7D9F8',padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:12}}>✍️ Typography</div>
            <label style={{display:'block',fontSize:12,fontWeight:600,color:'#64748B',marginBottom:6}}>Font Family</label>
            <select value={s.font_family} onChange={e=>setS(p=>({...p,font_family:e.target.value}))} style={{width:'100%',padding:'9px 12px',borderRadius:8,border:'1px solid #C7D9F8',fontSize:13,outline:'none',background:'#fff',marginBottom:14}}>
              {['Inter','Plus Jakarta Sans','Poppins','DM Sans','Nunito','Roboto'].map(f=><option key={f}>{f}</option>)}
            </select>
            <label style={{display:'block',fontSize:12,fontWeight:600,color:'#64748B',marginBottom:6}}>Topbar Style</label>
            <div style={{display:'flex',gap:8}}>
              {['light','colored','dark'].map(style=>(
                <button key={style} onClick={()=>setS(p=>({...p,topbar_style:style}))} style={{flex:1,padding:'8px',borderRadius:8,border:`2px solid ${s.topbar_style===style?'#1B4FD8':'#E2E8F0'}`,background:s.topbar_style===style?'#EEF3FD':'#F8FAFC',color:s.topbar_style===style?'#1B4FD8':'#334155',fontSize:12,fontWeight:600,cursor:'pointer',textTransform:'capitalize'}}>{style}</button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:12}}>Live Preview</div>
          <div style={{borderRadius:12,overflow:'hidden',border:'1px solid #C7D9F8',boxShadow:'0 4px 20px rgba(27,79,216,0.1)'}}>
            <div style={{background:s.topbar_style==='colored'?s.primary_color:s.topbar_style==='dark'?'#0A1628':'#fff',padding:'12px 16px',display:'flex',alignItems:'center',gap:10,borderBottom:'1px solid #E2E8F0'}}>
              {s.logo_url ? <img src={s.logo_url} alt="Logo" style={{height:28,borderRadius:4}} onError={e=>e.target.style.display='none'} /> :
                <div style={{width:28,height:28,borderRadius:6,background:s.primary_color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14,fontWeight:800}}>{s.company_name[0]}</div>}
              <span style={{fontSize:14,fontWeight:700,color:s.topbar_style==='light'?'#0A1628':'#fff',fontFamily:s.font_family}}>{s.company_name}</span>
            </div>
            <div style={{display:'flex',height:280}}>
              <div style={{width:140,background:s.sidebar_color,padding:'10px 6px'}}>
                {['Dashboard','Accounting','Treasury','Payroll','CRM'].map((item,i)=>(
                  <div key={item} style={{padding:'7px 8px',borderRadius:6,background:i===0?'rgba(255,255,255,0.15)':'transparent',marginBottom:2}}>
                    <span style={{fontSize:11,color:i===0?'#fff':'rgba(255,255,255,0.65)',fontFamily:s.font_family}}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{flex:1,background:'#EEF3FD',padding:12}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                  {[{l:'Revenue',v:'Rs 48 L',c:s.secondary_color},{l:'Expenses',v:'Rs 31 L',c:'#DC2626'}].map(k=>(
                    <div key={k.l} style={{padding:10,borderRadius:8,background:'#fff',border:'1px solid #E2E8F0'}}>
                      <div style={{fontSize:9,color:'#94A3B8',marginBottom:3}}>{k.l}</div>
                      <div style={{fontSize:16,fontWeight:800,color:k.c,fontFamily:s.font_family}}>{k.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{padding:'8px 12px',borderRadius:7,background:s.primary_color,color:'#fff',fontSize:11,textAlign:'center',fontFamily:s.font_family,fontWeight:600}}>+ New Invoice</div>
              </div>
            </div>
            <div style={{padding:'8px 16px',background:'#F8FAFC',borderTop:'1px solid #E2E8F0',fontSize:10,color:'#94A3B8',textAlign:'center',fontFamily:s.font_family}}>
              {s.footer_text}{s.show_powered_by?' · Powered by Deemona':''}
            </div>
          </div>
          <div style={{marginTop:16,padding:'12px 16px',borderRadius:10,background:'#ECFDF5',border:'1px solid #A7F3D0',fontSize:12,color:'#059669',fontWeight:600}}>
            ✅ Changes apply instantly for all users in your organization.
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationCenter({ onClose }) {
  return <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:200}}><div style={{position:'absolute',top:60,right:16,width:360,background:'#fff',borderRadius:16,boxShadow:'0 20px 60px rgba(27,79,216,0.15)',border:'1px solid #C7D9F8',overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
    <div style={{padding:'16px 20px',borderBottom:'1px solid #EEF3FD',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div style={{fontSize:14,fontWeight:700,color:'#0A1628'}}>🔔 Notifications</div>
      <button onClick={onClose} style={{background:'none',border:'none',color:'#94A3B8',cursor:'pointer',fontSize:20}}>×</button>
    </div>
    {[
      {type:'warning',icon:'⚠️',title:'Overdue Invoices',msg:'3 AR invoices are overdue. Collect payment.',time:'5m ago'},
      {type:'alert',icon:'🚨',title:'GST Filing Due',msg:'GSTR-3B for August due in 9 days.',time:'1h ago'},
      {type:'info',icon:'ℹ️',title:'Expense Approvals',msg:'2 expense claims waiting for approval.',time:'2h ago'},
      {type:'success',icon:'✅',title:'Payroll Completed',msg:'July payroll processed. Rs 10.5L disbursed.',time:'1d ago'},
    ].map((n,i)=>(
      <div key={i} style={{padding:'14px 20px',borderBottom:'1px solid #F8FAFC',display:'flex',gap:10,alignItems:'flex-start',background:n.type==='warning'?'#FFFBEB':n.type==='alert'?'#FEF2F2':n.type==='success'?'#F0FFF4':'#EEF3FD'}}>
        <span style={{fontSize:18}}>{n.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:'#0A1628',marginBottom:2}}>{n.title}</div>
          <div style={{fontSize:12,color:'#475569',marginBottom:3}}>{n.msg}</div>
          <div style={{fontSize:10,color:'#94A3B8'}}>{n.time}</div>
        </div>
      </div>
    ))}
    <div style={{padding:'10px 20px',textAlign:'center'}}><a href="/audit-trail" style={{fontSize:12,color:'#1B4FD8',fontWeight:600,textDecoration:'none'}}>View All Activity →</a></div>
  </div></div>;
}
