// Run from the frontend folder AFTER apply-email-verify-ui.cjs:  node apply-verify-first-ui.cjs
// Registration becomes: 1) enter email -> send code, 2) enter code -> verify, 3) company/account details (email locked). Safe to run twice.
const fs = require('fs'), path = require('path');
const file = path.join(process.cwd(), 'src', 'components', 'auth', 'AuthPages.jsx');
if (!fs.existsSync(file)) { console.log('MISSING ' + file + ' (run from the frontend folder)'); process.exit(1); }
let raw = fs.readFileSync(file, 'utf8');
const bom = raw.charCodeAt(0) === 0xFEFF; if (bom) raw = raw.slice(1);
const crlf = raw.includes('\r\n');
let t = crlf ? raw.replace(/\r\n/g, '\n') : raw;
if (t.includes("useState('email')")) { console.log('already patched'); process.exit(0); }
if (!t.includes('codeSent')) { console.log('Run apply-email-verify-ui.cjs first.'); process.exit(1); }
let ok = true;
function rep(label, find, replace) {
  const i = t.indexOf(find);
  if (i < 0) { console.log('NO MATCH: ' + label); ok = false; return; }
  t = t.slice(0, i) + replace + t.slice(i + find.length);
  console.log('patched: ' + label);
}

rep('step state', "  const [hp, setHp] = useState('');\n", "  const [hp, setHp] = useState('');\n  const [step, setStep] = useState('email');\n");

rep('step handlers', "  const pwMatch = form.confirm_password",
`  const sendCode = async () => {
    setError(''); setInfo('');
    const em = form.email.trim().toLowerCase();
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(em)) { setError('Enter a valid email address'); return; }
    setLoading(true);
    try {
      const r = await fetch(apiURL('/api/auth/register/send-code'), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:em, website:hp }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not send the code');
      set('email', em); setOtp(''); setStep('code');
      setInfo('We sent a 6-digit code to ' + em + '. It expires in 10 minutes. Check spam if you do not see it.');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  const verifyCode = async () => {
    setError('');
    if (!/^\\d{6}$/.test(otp)) { setError('Enter the 6-digit code from your email'); return; }
    setLoading(true);
    try {
      const r = await fetch(apiURL('/api/auth/register/verify-code'), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:form.email, email_otp:otp }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Incorrect code');
      setStep('details'); setInfo('Email verified. Now tell us about your company.');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const pwMatch = form.confirm_password`);

rep('Enter key follows the current step', "  const handleRegister = async e => {\n    e.preventDefault();\n", "  const handleRegister = async e => {\n    e.preventDefault();\n    if (step === 'email') { sendCode(); return; }\n    if (step === 'code') { verifyCode(); return; }\n");

// details step no longer sends/validates the code itself (already verified in step 2)
{
  const a = t.indexOf("    if (!codeSent) {\n      setLoading(true); setError(''); setInfo('');");
  const marker = "    if (!/^\\d{6}$/.test(otp)) { setError('Enter the 6-digit code from your email'); return; }\n";
  const b = t.indexOf(marker, a);
  if (a < 0 || b < 0) { console.log('NO MATCH: old send-code branch'); ok = false; }
  else { t = t.slice(0, a) + t.slice(b + marker.length); console.log('patched: removed old send-code branch'); }
}

// form: show step UI until the email is verified
{
  const fs0 = t.indexOf('<form onSubmit={handleRegister}>');
  const fe = fs0 < 0 ? -1 : t.indexOf('</form>', fs0);
  if (fs0 < 0 || fe < 0) { console.log('NO MATCH: register form'); ok = false; }
  else {
    const open = '<form onSubmit={handleRegister}>';
    let inner = t.slice(fs0 + open.length, fe);
    // remove the old code box + honeypot (moved into the step UI)
    const c0 = inner.indexOf('          {codeSent && (');
    const c1 = c0 < 0 ? -1 : inner.indexOf('          )}\n', c0);
    if (c0 >= 0 && c1 >= 0) inner = inner.slice(0, c0) + inner.slice(c1 + '          )}\n'.length);
    else { console.log('NO MATCH: old code box'); ok = false; }
    inner = inner.replace(/          <input type="text" name="website"[^\n]*\n/, '');
    inner = inner.replace('readOnly={codeSent}', 'readOnly');
    inner = inner.replace("{loading?(codeSent?'Creating account...':'Sending code...'):success?'Redirecting to sign in...':(codeSent?'Verify & Create Account':'Send Verification Code')}", "{loading?'Creating account...':success?'Redirecting to sign in...':'Create Account'}");
    const stepUI = `
          <input type="text" name="website" value={hp} onChange={e=>setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position:'absolute', left:'-9999px', width:1, height:1, opacity:0 }} />
          {step === 'email' && (
            <>
              <div style={{ fontSize:11, fontWeight:700, color:'#6C63FF', marginBottom:8, letterSpacing:'0.08em' }}>STEP 1 OF 3 - VERIFY YOUR EMAIL</div>
              <p style={{ fontSize:13, color:'var(--text-muted)', margin:'0 0 12px' }}>Enter the email you will use to sign in. We will send a 6-digit code to it.</p>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Work Email *</div>
                <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="you@company.com" autoComplete="email" style={inp} onFocus={focusBlue} onBlur={blurGray}/>
              </div>
              <button type="button" onClick={sendCode} disabled={loading} style={{ width:'100%', padding:'13px', borderRadius:10, fontSize:15, fontWeight:700, background:loading?'var(--surface-3)':'linear-gradient(135deg,#6C63FF,#9B8FFF)', color:loading?'var(--text-muted)':'#fff', border:'none', cursor:loading?'not-allowed':'pointer' }}>
                {loading ? 'Sending code...' : 'Send Verification Code'}
              </button>
            </>
          )}
          {step === 'code' && (
            <>
              <div style={{ fontSize:11, fontWeight:700, color:'#6C63FF', marginBottom:8, letterSpacing:'0.08em' }}>STEP 2 OF 3 - ENTER THE CODE</div>
              <p style={{ fontSize:13, color:'var(--text-muted)', margin:'0 0 12px' }}>Code sent to <strong style={{ color:'#6C63FF' }}>{form.email}</strong></p>
              <div style={{ marginBottom:16 }}>
                <input value={otp} onChange={e=>setOtp(e.target.value.replace(/\\D/g,'').slice(0,6))} placeholder="000000" maxLength={6} inputMode="numeric" autoComplete="one-time-code" autoFocus
                  style={{...inp, textAlign:'center', fontSize:26, fontWeight:700, letterSpacing:10, fontFamily:'monospace'}} onFocus={focusBlue} onBlur={blurGray}/>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6, display:'flex', justifyContent:'space-between' }}>
                  <button type="button" onClick={()=>{ setStep('email'); setOtp(''); setInfo(''); setError(''); }} style={{ background:'none', border:'none', color:'#6C63FF', cursor:'pointer', fontSize:12, fontWeight:600, padding:0 }}>Wrong email? Change it</button>
                  <button type="button" onClick={sendCode} disabled={loading} style={{ background:'none', border:'none', color:'#6C63FF', cursor:'pointer', fontSize:12, fontWeight:600, padding:0 }}>Resend code</button>
                </div>
              </div>
              <button type="button" onClick={verifyCode} disabled={loading} style={{ width:'100%', padding:'13px', borderRadius:10, fontSize:15, fontWeight:700, background:loading?'var(--surface-3)':'linear-gradient(135deg,#6C63FF,#9B8FFF)', color:loading?'var(--text-muted)':'#fff', border:'none', cursor:loading?'not-allowed':'pointer' }}>
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </>
          )}
`;
    t = t.slice(0, fs0) + open + "\n          {step === 'details' ? (<>" + inner + "</>) : (<>" + stepUI + "          </>)}\n        " + t.slice(fe);
    console.log('patched: three-step form');
  }
}

if (!ok) { console.log('\nNothing written (a patch did not match). Send me the output above.'); process.exit(1); }
fs.writeFileSync(file, (bom ? '﻿' : '') + (crlf ? t.replace(/\n/g, '\r\n') : t));
console.log('\nDone: ' + file);
