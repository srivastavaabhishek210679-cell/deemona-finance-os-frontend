// Fixes the Reset password button staying disabled ("Redirecting...") after the OTP step. Idempotent. Run from the frontend folder.
const fs=require('fs');const p='src/components/auth/AuthPages.jsx';
let s=fs.readFileSync(p,'utf8');const bom=s.charCodeAt(0)===0xFEFF;if(bom)s=s.slice(1);const crlf=s.includes('\r\n');if(crlf)s=s.replace(/\r\n/g,'\n');
if(s.includes('/*reset-btn*/')){console.log('already patched');process.exit(0);}
const a=`<button type="submit" disabled={loading||!!success} style={{ width:'100%', padding:'13px', borderRadius:10, fontSize:15, fontWeight:700, background:(loading||success)?`;
const b=`<button type="submit" /*reset-btn*/ disabled={loading||success.startsWith('Password reset')} style={{ width:'100%', padding:'13px', borderRadius:10, fontSize:15, fontWeight:700, background:(loading||success.startsWith('Password reset'))?`;
if(!s.includes(a)){console.log('anchor not found');process.exit(1);}
s=s.replace(a,b);
const c=`{loading?'Resetting...':success?'Redirecting...':'Reset Password'}`;
if(!s.includes(c)){console.log('label anchor not found');process.exit(1);}
s=s.replace(c,`{loading?'Resetting...':success.startsWith('Password reset')?'Redirecting...':'Reset Password'}`);
const d=`e.preventDefault();
    if (newPassword !== confirmPassword)`;
if(s.includes(d))s=s.replace(d,`e.preventDefault(); setSuccess('');
    if (newPassword !== confirmPassword)`);
fs.writeFileSync(p,(bom?'﻿':'')+(crlf?s.replace(/\n/g,'\r\n'):s));console.log('patched',p);
