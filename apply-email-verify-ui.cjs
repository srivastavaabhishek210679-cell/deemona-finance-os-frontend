// Run from the frontend folder AFTER apply-consent-ui.cjs:  node apply-email-verify-ui.cjs
// Registration becomes two steps: "Send Verification Code" -> enter the 6-digit code -> "Verify & Create Account".
// Also removes the stray `if (!termsAccepted)` line. Safe to run twice.
const fs = require('fs'), path = require('path');
const file = path.join(process.cwd(), 'src', 'components', 'auth', 'AuthPages.jsx');
if (!fs.existsSync(file)) { console.log('MISSING ' + file + ' (run from the frontend folder)'); process.exit(1); }
let raw = fs.readFileSync(file, 'utf8');
const bom = raw.charCodeAt(0) === 0xFEFF; if (bom) raw = raw.slice(1);
const crlf = raw.includes('\r\n');
let t = crlf ? raw.replace(/\r\n/g, '\n') : raw;
if (!t.includes('TERMS_VERSION')) { console.log('Run apply-consent-ui.cjs first.'); process.exit(1); }
if (t.includes('codeSent')) { console.log('already patched'); process.exit(0); }
let ok = true;
function rep(label, find, replace) {
  const i = t.indexOf(find);
  if (i < 0) { console.log('NO MATCH: ' + label); ok = false; return; }
  t = t.slice(0, i) + replace + t.slice(i + find.length);
  console.log('patched: ' + label);
}

// stray line from an earlier edit
{
  const before = t;
  t = t.split('\n').filter(l => !/if \(!termsAccepted\)/.test(l)).join('\n');
  console.log(before !== t ? 'removed: stray termsAccepted line' : 'ok: no stray termsAccepted line');
}

rep('state', "  const set = (k,v) => setForm(p=>({...p,[k]:v}));\n  const [agreed, setAgreed] = useState(false);\n",
"  const set = (k,v) => setForm(p=>({...p,[k]:v}));\n  const [agreed, setAgreed] = useState(false);\n  const [codeSent, setCodeSent] = useState(false);\n  const [otp, setOtp] = useState('');\n  const [info, setInfo] = useState('');\n  const [hp, setHp] = useState('');\n");

rep('two-step submit',
"    setLoading(true); setError('');\n    try {\n      const res = await fetch(apiURL('/api/auth/register'),",
`    if (!codeSent) {
      setLoading(true); setError(''); setInfo('');
      try {
        const r = await fetch(apiURL('/api/auth/register/send-code'), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email:form.email, website:hp }) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Could not send the code');
        setCodeSent(true); setInfo('We sent a 6-digit code to ' + form.email + '. It expires in 10 minutes. Check spam if you do not see it.');
      } catch (err) { setError(err.message); } finally { setLoading(false); }
      return;
    }
    if (!/^\\d{6}$/.test(otp)) { setError('Enter the 6-digit code from your email'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(apiURL('/api/auth/register'),`);

rep('send the code with the registration', "body:JSON.stringify({ ...form, accepted_terms:true, terms_version:TERMS_VERSION }) });", "body:JSON.stringify({ ...form, accepted_terms:true, terms_version:TERMS_VERSION, email_otp:otp }) });");

rep('info message', "        <Alert msg={error} type=\"error\" />\n        <Alert msg={success} type=\"success\" />\n        <GoogleBtn", "        <Alert msg={error} type=\"error\" />\n        <Alert msg={info} type=\"success\" />\n        <Alert msg={success} type=\"success\" />\n        <GoogleBtn");

rep('email locked once code is sent', "value={form.email} onChange={e=>set('email',e.target.value)}", "value={form.email} onChange={e=>set('email',e.target.value)} readOnly={codeSent}");

rep('code field + honeypot',
"          <ConsentBox checked={agreed} onChange={setAgreed} />\n          <button type=\"submit\" disabled={loading||!!success||!agreed}",
`          <input type="text" name="website" value={hp} onChange={e=>setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position:'absolute', left:'-9999px', width:1, height:1, opacity:0 }} />
          {codeSent && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>Verification code *</div>
              <input value={otp} onChange={e=>setOtp(e.target.value.replace(/\\D/g,'').slice(0,6))} placeholder="000000" maxLength={6} inputMode="numeric" autoComplete="one-time-code" required
                style={{...inp, textAlign:'center', fontSize:26, fontWeight:700, letterSpacing:10, fontFamily:'monospace'}} onFocus={focusBlue} onBlur={blurGray}/>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>
                Wrong email?{' '}
                <button type="button" onClick={()=>{ setCodeSent(false); setOtp(''); setInfo(''); setError(''); }} style={{ background:'none', border:'none', color:'#6C63FF', cursor:'pointer', fontSize:12, fontWeight:600, padding:0 }}>Change it / resend code</button>
              </div>
            </div>
          )}
          <ConsentBox checked={agreed} onChange={setAgreed} />
          <button type="submit" disabled={loading||!!success||!agreed}`);

rep('button label', "{loading?'Creating account...':success?'Redirecting to sign in...':'Create Account'}", "{loading?(codeSent?'Creating account...':'Sending code...'):success?'Redirecting to sign in...':(codeSent?'Verify & Create Account':'Send Verification Code')}");

if (!ok) { console.log('\nNothing written (a patch did not match). Send me the output above.'); process.exit(1); }
fs.writeFileSync(file, (bom ? '﻿' : '') + (crlf ? t.replace(/\n/g, '\r\n') : t));
console.log('\nDone: ' + file);
