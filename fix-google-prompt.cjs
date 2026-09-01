const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/auth/AuthPages.jsx';
let c = fs.readFileSync(f, 'utf8');

// Replace both prompt() calls with OAuth redirect
const redirectFlow = `if (window.google) {
    // Use OAuth2 redirect flow - works on all platforms including mobile
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      ux_mode: 'popup',
      callback: (response) => {
        if (response.error) { setError('Google sign-in failed: ' + response.error); setGoogleLoading(false); return; }
      },
    });
    // Fallback: use id token flow with popup
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Prompt not shown - open OAuth popup manually
        const params = new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          redirect_uri: window.location.origin + '/auth/google/callback',
          response_type: 'id_token',
          scope: 'openid email profile',
          nonce: Math.random().toString(36).slice(2),
        });
        const popup = window.open('https://accounts.google.com/o/oauth2/v2/auth?' + params, '_blank', 'width=500,height=600');
      }
    });
  }`;

// Replace first prompt() (login)
c = c.replace(
  'if (window.google) window.google.accounts.id.prompt();\n  }',
  redirectFlow + '\n  }'
);

// Replace second prompt() (register)  
c = c.replace(
  'if (window.google) window.google.accounts.id.prompt();\n  }',
  redirectFlow + '\n  }'
);

fs.writeFileSync(f, c, 'utf8');
console.log('Done. Prompt replacements:', (c.match(/accounts\.id\.prompt/g)||[]).length);
