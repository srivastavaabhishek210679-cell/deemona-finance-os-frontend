const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

if (!c.includes('GoogleCallback')) {
  c = c.replace(
    "import PrivacyPolicy",
    "import GoogleCallback from './components/auth/GoogleCallback';\nimport PrivacyPolicy"
  );
  c = c.replace(
    '<Route path="/privacy-policy"',
    '<Route path="/auth/google/callback" element={<GoogleCallback/>}/>\r\n        <Route path="/privacy-policy"'
  );
  fs.writeFileSync(f, c, 'utf8');
  console.log('Wired. Has callback route:', c.includes('/auth/google/callback'));
}
