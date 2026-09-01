const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/auth/AuthPages.jsx';
let c = fs.readFileSync(f, 'utf8');

// Fix 1: Disable FedCM and add ux_mode redirect fallback
c = c.replace(
  'if (window.google) window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback });',
  `if (window.google) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback,
      use_fedcm_for_prompt: false,
      ux_mode: 'popup',
    });
  }`
);

// Fix 2: Add renderButton as fallback for mobile where prompt fails
c = c.replace(
  'function useGoogleInit(callback) {',
  `function renderGoogleButton(elementId, callback) {
  if (!window.google || !GOOGLE_CLIENT_ID) return;
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback,
    use_fedcm_for_prompt: false,
  });
  const el = document.getElementById(elementId);
  if (el) {
    window.google.accounts.oauth2 ? null : null;
    window.google.accounts.id.renderButton(el, {
      type: 'standard',
      shape: 'rectangular',
      theme: 'outline',
      text: 'signin_with',
      size: 'large',
      width: el.offsetWidth || 320,
    });
  }
}

function useGoogleInit(callback) {`
);

fs.writeFileSync(f, c, 'utf8');
console.log('Done');
console.log('Has use_fedcm_for_prompt:', c.includes('use_fedcm_for_prompt'));
