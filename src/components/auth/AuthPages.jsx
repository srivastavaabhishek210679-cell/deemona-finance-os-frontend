import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const inp = { width:'100%', boxSizing:'border-box', padding:'11px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-primary)', fontSize:15, outline:'none', transition:'border-color 0.15s' };
const focusBlue = e => e.target.style.borderColor = '#6C63FF';
const blurGray  = e => e.target.style.borderColor = 'var(--border)';

function Logo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
      <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#6C63FF,#9B8FFF)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, color:'#fff', fontStyle:'italic' }}>D</div>
      <div>
        <div style={{ fontSize:18, fontWeight:800, color:'#fff', letterSpacing:'0.02em' }}>DEEMONA</div>
        <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.05em' }}>AI Finance OS</div>
      </div>
    </div>
  );
}

function GoogleBtn({ onClick, loading, label }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} style={{ width:'100%', padding:'11px 14px', borderRadius:10, background:'#fff', color:'#1a1a1a', border:'1px solid #e0e0e0', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontSize:14, fontWeight:600, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {loading ? 'Please wait...' : label}
    </button>
  );
}

function Divider() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, margin:'18px 0' }}>
      <div style={{ flex:1, height:1, background:'var(--border)' }}/><span style={{ fontSize:12, color:'var(--text-muted)' }}>or</span><div style={{ flex:1, height:1, background:'var(--border)' }}/>
    </div>
  );
}

function Alert({ msg, type }) {
  if (!msg) return null;
  const c = type==='success' ? { bg:'#22C98A15', border:'#22C98A30', color:'#22C98A' } : { bg:'#FF5C5C15', border:'#FF5C5C30', color:'#FF5C5C' };
  return <div style={{ padding:'10px 14px', borderRadius:8, marginBottom:14, background:c.bg, border:'1px solid '+c.border, color:c.color, fontSize:13 }}>{msg}</div>;
}

function useGoogleInit(callback) {
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const init = () => { if (window.google) window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback }); };
    if (window.google) { init(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true; s.onload = init;
    document.head.appendChild(s);
  }, []);
}

function GoogleCompanyModal({ googleData, onComplete, onCancel }) {
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    if (!company.trim()) { setError('Company name is required'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id_token:googleData.idToken, company_name:company, industry }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('token', data.token);
      onComplete();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
      <div style={{ width:'100%', maxWidth:420, padding:'32px', background:'var(--surface-1)', borderRadius:20, border:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          {googleData.picture && <img src={googleData.picture} alt="" style={{ width:40, height:40, borderRadius:'50%' }} />}
          <div><div style={{ fontSize:15, fontWeight:700 }}>Welcome, {googleData.given_name}!</div><div style={{ fontSize:12, color:'var(--text-muted)' }}>{googleData.email}</div></div>
        </div>
        <Alert msg={error} type="error" />
        <form onSubmit={submit}>
          <div style={{ marginBottom:12 }}><div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Company Name *</div><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Acme Technologies Pvt Ltd" required style={inp} onFocus={focusBlue} onBlur={blurGray}/></div>
          <div style={{ marginBottom:20 }}><div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Industry</div>
            <select value={industry} onChange={e=>setIndustry(e.target.value)} style={{...inp}}>
              {['Technology','Manufacturing','Retail','Healthcare','Financial Services','Education','Real Estate','Logistics','Other'].map(i=><option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button type="submit" disabled={loading} style={{ flex:1, padding:'11px', borderRadius:10, fontSize:14, fontWeight:700, background:loading?'var(--surface-3)':'linear-gradient(135deg,#6C63FF,#9B8FFF)', color:loading?'var(--text-muted)':'#fff', border:'none', cursor:loading?'not-allowed':'pointer' }}>{loading?'Setting up...':'Create Finance OS'}</button>
            <button type="button" onClick={onCancel} style={{ padding:'11px 16px', borderRadius:10, background:'var(--surface-3)', border:'1px solid var(--border)', color:'var(--text-secondary)', cursor:'pointer', fontSize:14 }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Forgot Password ───────────────────────────────────────────
function ForgotPasswordPage({ onBack }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [tokenHash, setTokenHash] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sendOTP = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTokenHash(data.token_hash || '');
      setStep(2);
      setSuccess('OTP sent to ' + email + '. Check your inbox and spam folder.');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const resetPassword = async e => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/reset-password', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ token_hash:tokenHash, otp, new_password:newPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Password reset successfully! Redirecting to sign in...');
      setTimeout(() => onBack(), 2000);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:20 }}>
      <div style={{ width:'100%', maxWidth:420, padding:'36px', background:'var(--surface-1)', borderRadius:20, border:'1px solid var(--border)', boxShadow:'0 24px 80px rgba(0,0,0,0.4)' }}>
        <Logo />
        <div style={{ display:'flex', gap:8, marginBottom:24 }}>
          {[1,2].map(s=><div key={s} style={{ flex:1, height:4, borderRadius:2, background:step>=s?'#6C63FF':'var(--surface-3)', transition:'background 0.3s' }}/>)}
        </div>

        {step===1 ? (
          <>
            <h2 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Forgot password?</h2>
            <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:24 }}>Enter your email and we'll send a 6-digit OTP</p>
            <Alert msg={error} type="error" />
            <form onSubmit={sendOTP}>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:5 }}>Email</div>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" required style={inp} onFocus={focusBlue} onBlur={blurGray}/>
              </div>
              <button type="submit" disabled={loading} style={{ width:'100%', padding:'13px', borderRadius:10, fontSize:15, fontWeight:700, background:loading?'var(--surface-3)':'linear-gradient(135deg,#6C63FF,#9B8FFF)', color:loading?'var(--text-muted)':'#fff', border:'none', cursor:loading?'not-allowed':'pointer' }}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Reset password</h2>
            <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:24 }}>OTP sent to <strong style={{ color:'#6C63FF' }}>{email}</strong></p>
            <Alert msg={error} type="error" />
            <Alert msg={success} type="success" />
            <form onSubmit={resetPassword}>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:5 }}>6-Digit OTP</div>
                <input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="000000" maxLength={6} required
                  style={{...inp, textAlign:'center', fontSize:28, fontWeight:700, letterSpacing:10, fontFamily:'monospace'}}
                  onFocus={focusBlue} onBlur={blurGray}/>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4, display:'flex', justifyContent:'space-between' }}>
                  <span>Expires in 15 minutes</span>
                  <button type="button" onClick={()=>{setStep(1);setError('');setSuccess('');setOtp('');}} style={{ background:'none', border:'none', color:'#6C63FF', cursor:'pointer', fontSize:12, fontWeight:600, padding:0 }}>Resend OTP</button>
                </div>
              </div>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:5 }}>New Password</div>
                <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Min. 8 characters" required style={inp} onFocus={focusBlue} onBlur={blurGray}/>
              </div>
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:5 }}>Confirm New Password</div>
                <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Re-enter new password" required
                  style={{...inp, borderColor:confirmPassword&&confirmPassword!==newPassword?'#FF5C5C':'var(--border)'}}
                  onFocus={focusBlue} onBlur={e=>e.target.style.borderColor=confirmPassword!==newPassword?'#FF5C5C':'var(--border)'}/>
                {confirmPassword&&confirmPassword!==newPassword&&<div style={{ fontSize:11, color:'#FF5C5C', marginTop:3 }}>Passwords do not match</div>}
              </div>
              <button type="submit" disabled={loading||!!success} style={{ width:'100%', padding:'13px', borderRadius:10, fontSize:15, fontWeight:700, background:(loading||success)?'var(--surface-3)':'linear-gradient(135deg,#6C63FF,#9B8FFF)', color:(loading||success)?'var(--text-muted)':'#fff', border:'none', cursor:(loading||success)?'not-allowed':'pointer' }}>
                {loading?'Resetting...':success?'Redirecting...':'Reset Password'}
              </button>
            </form>
          </>
        )}
        <div style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--text-muted)' }}>
          <button onClick={onBack} style={{ background:'none', border:'none', color:'#6C63FF', cursor:'pointer', fontWeight:600, fontSize:13 }}>Back to Sign In</button>
        </div>
      </div>
    </div>
  );
}

// ── Login Page ────────────────────────────────────────────────
export function LoginPage({ onSwitch }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleData, setGoogleData] = useState(null);
  const [showForgot, setShowForgot] = useState(false);

  useGoogleInit(async response => {
    setGoogleLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/google', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id_token:response.credential }) });
      const data = await res.json();
      if (data.needsCompany) { setGoogleData({...data, idToken:response.credential}); return; }
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('token', data.token);
      window.location.reload();
    } catch (err) { setError(err.message); } finally { setGoogleLoading(false); }
  });

  const handleGoogle = () => {
    if (!GOOGLE_CLIENT_ID) { setError('Google Sign-In not configured. Add VITE_GOOGLE_CLIENT_ID to frontend .env'); return; }
    if (window.google) window.google.accounts.id.prompt();
  };

  const handleLogin = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try { await login(email, password); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  if (showForgot) return <ForgotPasswordPage onBack={()=>setShowForgot(false)} />;

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:20 }}>
      {googleData && <GoogleCompanyModal googleData={googleData} onComplete={()=>window.location.reload()} onCancel={()=>setGoogleData(null)} />}
      <div style={{ width:'100%', maxWidth:420, padding:'36px', background:'var(--surface-1)', borderRadius:20, border:'1px solid var(--border)', boxShadow:'0 24px 80px rgba(0,0,0,0.4)' }}>
        <Logo />
        <h2 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Welcome back</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:24 }}>Sign in to your Finance OS</p>
        <Alert msg={error} type="error" />
        <GoogleBtn onClick={handleGoogle} loading={googleLoading} label="Sign in with Google" />
        <Divider />
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:5 }}>Email</div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" required style={inp} onFocus={focusBlue} onBlur={blurGray}/>
          </div>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:5 }}>Password</div>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required style={inp} onFocus={focusBlue} onBlur={blurGray}/>
          </div>
          <div style={{ textAlign:'right', marginBottom:20 }}>
            <button type="button" onClick={()=>setShowForgot(true)} style={{ background:'none', border:'none', color:'#6C63FF', cursor:'pointer', fontSize:13, fontWeight:600, padding:0 }}>Forgot password?</button>
          </div>
          <button type="submit" disabled={loading} style={{ width:'100%', padding:'13px', borderRadius:10, fontSize:15, fontWeight:700, background:loading?'var(--surface-3)':'linear-gradient(135deg,#6C63FF,#9B8FFF)', color:loading?'var(--text-muted)':'#fff', border:'none', cursor:loading?'not-allowed':'pointer' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--text-muted)' }}>
          Don't have an account?{' '}
          <button onClick={onSwitch} style={{ background:'none', border:'none', color:'#6C63FF', cursor:'pointer', fontWeight:600, fontSize:13 }}>Create one</button>
        </div>
      </div>
    </div>
  );
}

// ── Register Page ─────────────────────────────────────────────
export function RegisterPage({ onSwitch }) {
  const [form, setForm] = useState({ company_name:'', industry:'Technology', gstin:'', first_name:'', last_name:'', email:'', password:'', confirm_password:'' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleData, setGoogleData] = useState(null);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  useGoogleInit(async response => {
    setGoogleLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/google', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id_token:response.credential }) });
      const data = await res.json();
      if (data.needsCompany) { setGoogleData({...data, idToken:response.credential}); return; }
      if (!res.ok) throw new Error(data.error);
      setSuccess('Account created! Redirecting to sign in...');
      setTimeout(()=>onSwitch(), 2000);
    } catch (err) { setError(err.message); } finally { setGoogleLoading(false); }
  });

  const handleGoogle = () => {
    if (!GOOGLE_CLIENT_ID) { setError('Google Sign-In not configured. Add VITE_GOOGLE_CLIENT_ID to frontend .env'); return; }
    if (window.google) window.google.accounts.id.prompt();
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (form.password !== form.confirm_password) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Account created successfully! Please sign in with your credentials.');
      setTimeout(()=>onSwitch(), 2000);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const pwMatch = form.confirm_password && form.confirm_password !== form.password;

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:20 }}>
      {googleData && <GoogleCompanyModal googleData={googleData} onComplete={()=>window.location.reload()} onCancel={()=>setGoogleData(null)} />}
      <div style={{ width:'100%', maxWidth:500, padding:'36px', background:'var(--surface-1)', borderRadius:20, border:'1px solid var(--border)', boxShadow:'0 24px 80px rgba(0,0,0,0.4)' }}>
        <Logo />
        <h2 style={{ fontSize:22, fontWeight:700, marginBottom:4 }}>Set up your Finance OS</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', marginBottom:24 }}>Create your organization account</p>
        <Alert msg={error} type="error" />
        <Alert msg={success} type="success" />
        <GoogleBtn onClick={handleGoogle} loading={googleLoading} label="Sign up with Google" />
        <Divider />
        <form onSubmit={handleRegister}>
          <div style={{ fontSize:11, fontWeight:700, color:'#6C63FF', marginBottom:8, letterSpacing:'0.08em' }}>COMPANY</div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Company Name *</div>
            <input value={form.company_name} onChange={e=>set('company_name',e.target.value)} placeholder="Acme Technologies Pvt Ltd" required style={inp} onFocus={focusBlue} onBlur={blurGray}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Industry</div>
              <select value={form.industry} onChange={e=>set('industry',e.target.value)} style={{...inp}}>
                {['Technology','Manufacturing','Retail','Healthcare','Financial Services','Education','Real Estate','Logistics','Other'].map(i=><option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>GSTIN (optional)</div>
              <input value={form.gstin} onChange={e=>set('gstin',e.target.value)} placeholder="27AAPFU0939F1ZV" style={inp} onFocus={focusBlue} onBlur={blurGray}/>
            </div>
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:'#22C98A', marginBottom:8, letterSpacing:'0.08em', marginTop:16 }}>YOUR ACCOUNT</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>First Name *</div>
              <input value={form.first_name} onChange={e=>set('first_name',e.target.value)} placeholder="Abhishek" required style={inp} onFocus={focusBlue} onBlur={blurGray}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Last Name</div>
              <input value={form.last_name} onChange={e=>set('last_name',e.target.value)} placeholder="Srivastava" style={inp} onFocus={focusBlue} onBlur={blurGray}/>
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Work Email *</div>
            <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="abhishek@company.com" required style={inp} onFocus={focusBlue} onBlur={blurGray}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Password *</div>
              <input type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Min. 8 characters" required style={inp} onFocus={focusBlue} onBlur={blurGray}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Confirm Password *</div>
              <input type="password" value={form.confirm_password} onChange={e=>set('confirm_password',e.target.value)} placeholder="Re-enter password" required
                style={{...inp, borderColor:pwMatch?'#FF5C5C':'var(--border)'}}
                onFocus={focusBlue} onBlur={e=>e.target.style.borderColor=pwMatch?'#FF5C5C':'var(--border)'}/>
              {pwMatch && <div style={{ fontSize:11, color:'#FF5C5C', marginTop:3 }}>Passwords do not match</div>}
            </div>
          </div>
          <button type="submit" disabled={loading||!!success} style={{ width:'100%', padding:'13px', borderRadius:10, fontSize:15, fontWeight:700, background:(loading||success)?'var(--surface-3)':'linear-gradient(135deg,#6C63FF,#9B8FFF)', color:(loading||success)?'var(--text-muted)':'#fff', border:'none', cursor:(loading||success)?'not-allowed':'pointer' }}>
            {loading?'Creating account...':success?'Redirecting to sign in...':'Create Account'}
          </button>
        </form>
        <div style={{ textAlign:'center', marginTop:20, fontSize:13, color:'var(--text-muted)' }}>
          Already have an account?{' '}
          <button onClick={onSwitch} style={{ background:'none', border:'none', color:'#6C63FF', cursor:'pointer', fontWeight:600, fontSize:13 }}>Sign in</button>
        </div>
      </div>
    </div>
  );
}
