const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/auth/AuthPages.jsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Remove checkbox from line 3 (top of file - wrong location)
const lines = c.split('\n');
console.log('Line 1:', lines[0]);
console.log('Line 2:', lines[1]);
console.log('Line 3:', lines[2]);
console.log('Line 4:', lines[3]);

// Remove the misplaced checkbox lines at the top (lines 0-9 area)
let startRemove = -1, endRemove = -1;
for (let i=0; i<15; i++) {
  if (lines[i].includes('type="checkbox"') || lines[i].includes('termsAccepted') || lines[i].includes('marginBottom:14') || lines[i].includes('f0fdf4') || lines[i].includes('bbf7d0') || lines[i].includes('Terms of Service') || lines[i].includes('Privacy Policy') || lines[i].includes('License Agreement') || lines[i].includes('financial loss')) {
    if (startRemove === -1) startRemove = i;
    endRemove = i;
  }
}
console.log('Removing lines', startRemove, 'to', endRemove);
if (startRemove !== -1) lines.splice(startRemove, endRemove - startRemove + 1);
c = lines.join('\n');

// 2. Remove termsAccepted from LoginPage, keep only in RegisterPage
// Find LoginPage section and remove termsAccepted state from it
const loginIdx = c.indexOf('export function LoginPage');
const registerIdx = c.indexOf('export function RegisterPage');
const loginSection = c.substring(loginIdx, registerIdx);
if (loginSection.includes('termsAccepted')) {
  const fixedLogin = loginSection.replace(/\n\s*const \[termsAccepted.*?\n/g, '\n');
  c = c.substring(0, loginIdx) + fixedLogin + c.substring(registerIdx);
  console.log('Removed termsAccepted from LoginPage');
}

// 3. Add termsAccepted to RegisterPage if not there
const regIdx = c.indexOf('export function RegisterPage');
const regSection = c.substring(regIdx, regIdx+500);
console.log('RegisterPage start:', regSection.substring(0,300));

if (!c.substring(regIdx).includes('termsAccepted')) {
  // Add state inside RegisterPage
  c = c.replace(
    'export function RegisterPage({ onSwitch })',
    'export function RegisterPage({ onSwitch })'
  );
  // Find first useState in RegisterPage
  const regStart = c.indexOf('export function RegisterPage');
  const firstUseState = c.indexOf('useState(', regStart);
  const lineStart = c.lastIndexOf('\n', firstUseState);
  const indent = '  ';
  c = c.substring(0, lineStart+1) + indent + "const [termsAccepted, setTermsAccepted] = useState(false);\n" + c.substring(lineStart+1);
  console.log('Added termsAccepted to RegisterPage');
}

// 4. Add checkbox before Register button in RegisterPage
const regFormIdx = c.indexOf('export function RegisterPage');
const registerBtnIdx = c.indexOf('>Register</button>', regFormIdx);
const beforeBtn = c.lastIndexOf('<button', registerBtnIdx);
console.log('Register button at:', registerBtnIdx);

if (!c.substring(regFormIdx, registerBtnIdx).includes('type="checkbox"')) {
  const checkbox = `<div style={{marginBottom:14,padding:'12px 14px',background:'#f0fdf4',borderRadius:8,border:'1px solid #bbf7d0'}}>
          <label style={{display:'flex',alignItems:'flex-start',gap:10,cursor:'pointer'}}>
            <input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} style={{marginTop:3,width:15,height:15,accentColor:'#1d4ed8',flexShrink:0}}/>
            <span style={{fontSize:11,color:'#334155',lineHeight:1.6}}>I have read and agree to the <a href="/terms" target="_blank" style={{color:'#1d4ed8',fontWeight:700}}>Terms of Service</a>, <a href="/privacy-policy" target="_blank" style={{color:'#1d4ed8',fontWeight:700}}>Privacy Policy</a>, and <a href="/license" target="_blank" style={{color:'#1d4ed8',fontWeight:700}}>License Agreement</a>. I understand that Deemona AI Finance OS shall not be responsible for any financial loss.</span>
          </label>
        </div>
        `;
  c = c.substring(0, beforeBtn) + checkbox + c.substring(beforeBtn);
  console.log('Checkbox added before Register button');
}

fs.writeFileSync(f, c, 'utf8');
console.log('\nFinal check:');
console.log('termsAccepted count:', (c.match(/termsAccepted/g)||[]).length);
console.log('Line 1 of file:', c.split('\n')[0]);
