const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(
  '<Routes>\r\n        {routes.map(r => (',
  '<Routes>\r\n        <Route path="/privacy-policy" element={<PrivacyPolicy/>}/>\r\n        <Route path="/terms" element={<TermsOfService/>}/>\r\n        <Route path="/license" element={<LicenseAgreement/>}/>\r\n        <Route path="/about" element={<AboutUs/>}/>\r\n        {routes.map(r => ('
);

fs.writeFileSync(f, c, 'utf8');
console.log('Done. Has privacy-policy route:', c.includes('privacy-policy'));
