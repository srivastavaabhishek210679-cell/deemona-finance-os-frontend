const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/auth/AuthPages.jsx';
let c = fs.readFileSync(f, 'utf8');

console.log('File starts with:', c.substring(0,40));
console.log('Has termsAccepted:', c.includes('termsAccepted'));

// Find RegisterPage function
const regIdx = c.indexOf('export function RegisterPage');
console.log('RegisterPage at:', regIdx);

// Find first useState inside RegisterPage
const firstState = c.indexOf('useState(', regIdx);
const lineStart = c.lastIndexOf('\n', firstState);

// Add termsAccepted state
if (!c.includes('termsAccepted')) {
  c = c.substring(0, lineStart+1) + "  const [termsAccepted, setTermsAccepted] = useState(false);\n" + c.substring(lineStart+1);
  console.log('State added');
}

// Add validation in handleRegister
if (!c.includes('You must accept')) {
  c = c.replace(
    "e.preventDefault();\n    if (form.password !== form.confirm_password)",
    "e.preventDefault();\n    if (!termsAccepted) { setError('You must accept the Terms of Service, Privacy Policy and License Agreement to register.'); return; }\n    if (form.password !== form.confirm_password)"
  );
  console.log('Validation added');
}

// Add checkbox before Register submit button
const regFormIdx = c.indexOf('export function RegisterPage');
const registerBtnIdx = c.indexOf('>Register</button>', regFormIdx);
const beforeBtn = c.lastIndexOf('<button', registerBtnIdx);
console.log('Register button at:', registerBtnIdx);

if (registerBtnIdx > 0 && !c.substring(regFormIdx, registerBtnIdx).includes('type="checkbox"')) {
  const checkbox = `<div style={{marginBottom:14,padding:'12px 14px',background:'#f0fdf4',borderRadius:8,border:'1px solid #bbf7d0'}}>
          <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
            <input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} style={{marginTop:3,width:15,height:15,accentColor:'#1d4ed8',flexShrink:0}}/>
            <span style={{fontSize:11,color:'#334155',lineHeight:1.6}}>I agree to the <a href="/terms" target="_blank" style={{color:'#1d4ed8',fontWeight:700}}>Terms of Service</a>, <a href="/privacy-policy" target="_blank" style={{color:'#1d4ed8',fontWeight:700}}>Privacy Policy</a> and <a href="/license" target="_blank" style={{color:'#1d4ed8',fontWeight:700}}>License Agreement</a>. I understand that Deemona AI Finance OS shall not be responsible for any financial loss.</span>
          </label>
        </div>
        `;
  c = c.substring(0, beforeBtn) + checkbox + c.substring(beforeBtn);
  console.log('Checkbox added');
}

fs.writeFileSync(f, c, 'utf8');
console.log('Done. Has checkbox:', c.includes('type="checkbox"'));
console.log('Line 1:', c.split('\n')[0]);
