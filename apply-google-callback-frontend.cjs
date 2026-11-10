// Fixes Google sign-in on the new host: (1) the callback page is reachable while signed out, (2) it stores the token the way AuthContext expects,
// (3) when opened as a popup it signs the main window in and closes itself. Idempotent. Run in the frontend folder.
const fs = require('fs');
if (!fs.existsSync('src/App.jsx')) { console.error('Run this from the frontend folder'); process.exit(1); }

const CB = String.raw`import { useEffect, useState } from 'react';
import { apiURL } from '../../api.js';

// Google redirects here with #id_token=... after sign-in. Works as a popup (signs the main window in, then closes) or as a normal page.
export default function GoogleCallback() {
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const idToken = params.get('id_token');
    const gErr = params.get('error') || new URLSearchParams(window.location.search).get('error');
    if (gErr) { setError('Google sign-in was cancelled or failed (' + gErr + ').'); return; }
    if (!idToken) { setError('Google did not return a sign-in token. Please close this window and try again.'); return; }

    fetch(apiURL('/api/auth/google'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_token: idToken }) })
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (d.needsCompany) { setError('This Google account is not registered yet. Close this window, choose "Create one", and sign up with Google first.'); return; }
        if (!ok || !d.token) { setError(d.error || 'Google sign-in failed. Please try again.'); return; }
        try { localStorage.setItem('token', d.token); } catch (e) { setError('Your browser blocked saving the sign-in. Please allow site data and try again.'); return; }
        if (window.opener && !window.opener.closed) {
          try { window.opener.location.reload(); } catch (e) { /* opener on another origin */ }
          window.close();
        } else {
          window.location.replace('/');
        }
      })
      .catch(() => setError('Could not reach the server. Please try again.'));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 340 }}>
        {error ? (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#991B1B', marginBottom: 8 }}>Sign-in did not complete</div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 14 }}>{error}</div>
            <button onClick={() => { if (window.opener) window.close(); else window.location.replace('/'); }} style={{ background: '#1e3a8a', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 14, cursor: 'pointer' }}>Back to sign in</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e3a8a' }}>Signing you in...</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Please wait</div>
          </>
        )}
      </div>
    </div>
  );
}
`;

const cbf = 'src/components/auth/GoogleCallback.jsx';
if (!fs.existsSync(cbf) || fs.readFileSync(cbf, 'utf8') !== CB) { fs.writeFileSync(cbf, CB); console.log('wrote', cbf); } else console.log('up to date', cbf);

const raw = fs.readFileSync('src/App.jsx', 'utf8'); const bom = raw.charCodeAt(0) === 0xFEFF; const crlf = raw.includes('\r\n');
let s = raw.replace(/^﻿/, '').replace(/\r\n/g, '\n');
if (s.includes("startsWith('/auth/google/callback')")) { console.log('no change src/App.jsx'); process.exit(0); }
const a = "const isPublicRoute = ['/', '/landing'].includes(window.location.pathname);";
if (!s.includes(a)) { console.error('anchor not found in App.jsx'); process.exit(1); }
s = s.replace(a, "const isPublicRoute = ['/', '/landing'].includes(window.location.pathname) || window.location.pathname.startsWith('/auth/google/callback');");
fs.writeFileSync('src/App.jsx', (bom ? '﻿' : '') + (crlf ? s.replace(/\n/g, '\r\n') : s)); console.log('patched src/App.jsx');
