const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Add public routes outside the layout wrapper
c = c.replace(
  `      <Routes>
        {routes.map(r => (
          <Route key={r.path} path={r.path} element={
            <Layout title={r.title} subtitle={r.sub}>{r.comp}</Layout>
          } />
        ))}
      </Routes>`,
  `      <Routes>
        <Route path="/privacy-policy" element={<PrivacyPolicy/>}/>
        <Route path="/terms" element={<TermsOfService/>}/>
        <Route path="/license" element={<LicenseAgreement/>}/>
        <Route path="/about" element={<AboutUs/>}/>
        {routes.map(r => (
          <Route key={r.path} path={r.path} element={
            <Layout title={r.title} subtitle={r.sub}>{r.comp}</Layout>
          } />
        ))}
      </Routes>`
);

fs.writeFileSync(f, c, 'utf8');
console.log('Routes added. Verify:');
console.log(c.includes('privacy-policy') ? 'privacy-policy OK' : 'MISSING');
console.log(c.includes('/terms') ? 'terms OK' : 'MISSING');
