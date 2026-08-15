const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(
  'if (!user) return <AuthGate />;',
  `const isPublicRoute = ['/', '/landing'].includes(window.location.pathname);
  if (!user && !isPublicRoute) return <AuthGate />;`
);

fs.writeFileSync(f, c, 'utf8');
console.log('Fixed:', c.includes('isPublicRoute'));
