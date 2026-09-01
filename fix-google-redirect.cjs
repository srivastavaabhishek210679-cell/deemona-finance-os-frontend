const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/auth/AuthPages.jsx';
let c = fs.readFileSync(f, 'utf8');

// Replace the entire handleGoogle flow with direct OAuth URL redirect
// This works on ALL devices including mobile Chrome without FedCM issues

const newHandleGoogle = `const handleGoogle = () => {
    if (!GOOGLE_CLIENT_ID) { setError('Google login not configured'); return; }
    const nonce = Math.random().toString(36).slice(2);
    sessionStorage.setItem('google_nonce', nonce);
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: window.location.origin + '/auth/google/callback',
      response_type: 'token id_token',
      scope: 'openid email profile',
      nonce,
      prompt: 'select_account',
    });
    window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
  };`;

// Replace both handleGoogle functions (login and register)
// Find and replace login handleGoogle
c = c.replace(
  /const handleGoogle = async[^}]+setGoogleLoading[^}]+\}[^}]+\}[^}]+\}/s,
  newHandleGoogle
);

// Remove googleLoading state since we no longer need async
// Keep it to avoid breaking GoogleBtn disabled prop

fs.writeFileSync(f, c, 'utf8');
console.log('Done');
console.log('Has redirect flow:', c.includes('accounts.google.com/o/oauth2/v2/auth'));
