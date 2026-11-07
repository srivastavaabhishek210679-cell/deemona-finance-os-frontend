// Run from the frontend folder:  node apply-consent-ui.cjs
// Adds: required Terms/Privacy/AUP consent on registration (and the Google sign-up modal), policy links on login + register. Safe to run twice.
const fs = require('fs'), path = require('path');
const file = path.join(process.cwd(), 'src', 'components', 'auth', 'AuthPages.jsx');
if (!fs.existsSync(file)) { console.log('MISSING ' + file + ' (run from the frontend folder)'); process.exit(1); }
let raw = fs.readFileSync(file, 'utf8');
const bom = raw.charCodeAt(0) === 0xFEFF; if (bom) raw = raw.slice(1);
const crlf = raw.includes('\r\n');
let t = crlf ? raw.replace(/\r\n/g, '\n') : raw;
if (t.includes('TERMS_VERSION')) { console.log('already patched'); process.exit(0); }
let ok = true;
function rep(label, find, replace) {
  const i = t.indexOf(find);
  if (i < 0) { console.log('NO MATCH: ' + label); ok = false; return; }
  t = t.slice(0, i) + replace + t.slice(i + find.length);
  console.log('patched: ' + label);
}

const SHARED = `
// -- Legal consent (policy pages are static files in /public) --
const TERMS_VERSION = '2026-10-27';
const legalLink = { color:'#6C63FF', textDecoration:'none', fontWeight:600 };
function ConsentBox({ checked, onChange }) {
  return (
    <label style={{ display:'flex', alignItems:'flex-start', gap:10, margin:'0 0 18px', fontSize:12.5, lineHeight:1.55, color:'var(--text-secondary)', cursor:'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{ marginTop:3, width:16, height:16, accentColor:'#6C63FF', flexShrink:0 }} />
      <span>
        I have read and agree to the{' '}
        <a href="/terms.html" target="_blank" rel="noopener noreferrer" style={legalLink}>Terms of Service</a>,{' '}
        <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={legalLink}>Privacy Policy</a>,{' '}
        <a href="/acceptable-use.html" target="_blank" rel="noopener noreferrer" style={legalLink}>Acceptable Use Policy</a> and{' '}
        <a href="/data-processing.html" target="_blank" rel="noopener noreferrer" style={legalLink}>Data Processing terms</a>. *
      </span>
    </label>
  );
}
function LegalFooter() {
  const links = [['Terms','/terms.html'],['Privacy','/privacy.html'],['Refunds','/refund-policy.html'],['Cookies','/cookie-policy.html'],['Acceptable Use','/acceptable-use.html'],['Grievance Officer','/grievance.html'],['Contact','/contact.html'],['All policies','/legal.html']];
  return (
    <div style={{ marginTop:22, paddingTop:16, borderTop:'1px solid var(--border)', textAlign:'center', fontSize:11.5, color:'var(--text-muted)', lineHeight:1.9 }}>
      {links.map(([l,h],i)=>(
        <span key={h}>{i>0 && <span style={{ margin:'0 6px', opacity:0.5 }}>|</span>}<a href={h} target="_blank" rel="noopener noreferrer" style={{ color:'var(--text-muted)', textDecoration:'none' }}>{l}</a></span>
      ))}
      <div style={{ marginTop:4 }}>&copy; Deemona Global Solutions, New Delhi</div>
    </div>
  );
}
`;
rep('shared components', "const blurGray  = e => e.target.style.borderColor = 'var(--border)';\n", "const blurGray  = e => e.target.style.borderColor = 'var(--border)';\n" + SHARED);

// Google company modal
rep('modal: agreed state', "  const [industry, setIndustry] = useState('Technology');\n", "  const [industry, setIndustry] = useState('Technology');\n  const [agreed, setAgreed] = useState(false);\n");
rep('modal: require agreement', "    if (!company.trim()) { setError('Company name is required'); return; }\n", "    if (!company.trim()) { setError('Company name is required'); return; }\n    if (!agreed) { setError('Please accept the Terms, Privacy Policy and Acceptable Use Policy to continue'); return; }\n");
rep('modal: send acceptance', "body:JSON.stringify({ id_token:googleData.idToken, company_name:company, industry })", "body:JSON.stringify({ id_token:googleData.idToken, company_name:company, industry, accepted_terms:true, terms_version:TERMS_VERSION })");
rep('modal: checkbox', "          <div style={{ display:'flex', gap:10 }}>\n            <button type=\"submit\" disabled={loading} style={{ flex:1,", "          <ConsentBox checked={agreed} onChange={setAgreed} />\n          <div style={{ display:'flex', gap:10 }}>\n            <button type=\"submit\" disabled={loading||!agreed} style={{ flex:1,");
rep('modal: button look', "cursor:loading?'not-allowed':'pointer' }}>{loading?'Setting up...'", "cursor:(loading||!agreed)?'not-allowed':'pointer', opacity:agreed?1:0.6 }}>{loading?'Setting up...'");

// Login footer
{
  const m = t.match(/>Create one<\/button>\n        <\/div>/);
  if (!m) { console.log('NO MATCH: login footer'); ok = false; }
  else { t = t.replace(m[0], m[0] + '\n        <LegalFooter />'); console.log('patched: login footer'); }
}

// Register
rep('register: agreed state', "  const set = (k,v) => setForm(p=>({...p,[k]:v}));\n", "  const set = (k,v) => setForm(p=>({...p,[k]:v}));\n  const [agreed, setAgreed] = useState(false);\n");
rep('register: validate', "    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }\n", "    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }\n    if (!agreed) { setError('Please accept the Terms, Privacy Policy and Acceptable Use Policy to create an account'); return; }\n");
rep('register: send acceptance', "body:JSON.stringify(form) });", "body:JSON.stringify({ ...form, accepted_terms:true, terms_version:TERMS_VERSION }) });");
{
  const idx = t.indexOf("{loading?'Creating account...'");
  const b = idx < 0 ? -1 : t.lastIndexOf('<button type="submit"', idx);
  if (b < 0) { console.log('NO MATCH: register button'); ok = false; }
  else {
    let seg = t.slice(b, idx).replace('disabled={loading||!!success}', 'disabled={loading||!!success||!agreed}');
    if (!seg.includes('!agreed')) { console.log('NO MATCH: register disabled'); ok = false; }
    else {
      t = t.slice(0, b) + '<ConsentBox checked={agreed} onChange={setAgreed} />\n          ' + seg + t.slice(idx);
      console.log('patched: register checkbox + disabled button');
    }
  }
}
rep('register: footer', ">Sign in</button>\n        </div>", ">Sign in</button>\n        </div>\n        <LegalFooter />");

if (!ok) { console.log('\nNothing written (a patch did not match). Send me the output above.'); process.exit(1); }
const out = (bom ? '﻿' : '') + (crlf ? t.replace(/\n/g, '\r\n') : t);
fs.writeFileSync(file, out);
console.log('\nDone: ' + file);
