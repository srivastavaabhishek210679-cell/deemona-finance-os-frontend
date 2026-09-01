const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/auth/AuthPages.jsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Add termsAccepted state
c = c.replace(
  "const [password, setPassword] = useState('');\n  const [loading, setLoading] = useState(false);\n  const [googleLoading",
  "const [password, setPassword] = useState('');\n  const [termsAccepted, setTermsAccepted] = useState(false);\n  const [loading, setLoading] = useState(false);\n  const [googleLoading"
);

// 2. Add validation at start of handleRegister
c = c.replace(
  "const handleRegister = async e => {\n    e.preventDefault();\n    if (form.password !== form.confirm_password)",
  "const handleRegister = async e => {\n    e.preventDefault();\n    if (!termsAccepted) { setError('You must accept the Terms of Service, Privacy Policy, and License Agreement to register.'); return; }\n    if (form.password !== form.confirm_password)"
);

// 3. Find submit button in register form and add checkbox before it
// Find the register submit button
const btnIdx = c.indexOf('Register</button>');
const beforeBtn = c.lastIndexOf('<button', btnIdx);
console.log('Button at:', beforeBtn, 'to', btnIdx);
console.log('Button context:', c.substring(beforeBtn-20, beforeBtn+50));

const checkbox = `<div style={{marginBottom:14,padding:'12px 14px',background:'#f0fdf4',borderRadius:8,border:'1px solid #bbf7d0'}}>
          <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
            <input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} style={{marginTop:3,width:15,height:15,accentColor:'#1d4ed8',flexShrink:0}}/>
            <span style={{fontSize:11,color:'#334155',lineHeight:1.6}}>
              I have read and agree to the <a href="/terms" target="_blank" style={{color:'#1d4ed8',fontWeight:700}}>Terms of Service</a>, <a href="/privacy-policy" target="_blank" style={{color:'#1d4ed8',fontWeight:700}}>Privacy Policy</a>, and <a href="/license" target="_blank" style={{color:'#1d4ed8',fontWeight:700}}>License Agreement</a>. I understand that Deemona AI Finance OS shall not be responsible for any financial loss incurred.
            </span>
          </label>
        </div>
        `;

c = c.substring(0, beforeBtn) + checkbox + c.substring(beforeBtn);

fs.writeFileSync(f, c, 'utf8');
console.log('Done!');
console.log('Has termsAccepted:', c.includes('termsAccepted'));
console.log('Has checkbox:', c.includes('type="checkbox"'));
console.log('Has validation:', c.includes('You must accept'));
