const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Add imports after last import line
const lastImport = c.lastIndexOf("import ");
const endOfLastImport = c.indexOf('\n', lastImport) + 1;
const imports = `import MissingDocsPage from './components/docs/MissingDocsPage';\nimport Batch2DocsPage from './components/docs/Batch2DocsPage';\n`;
if (!c.includes('MissingDocsPage')) {
  c = c.slice(0, endOfLastImport) + imports + c.slice(endOfLastImport);
  console.log('Imports added');
}

// 2. Add routes — find the routes array
const routesMatch = c.match(/const routes\s*=\s*\[/);
if (routesMatch && !c.includes("path: '/corporate-docs'")) {
  const insertAt = c.indexOf(routesMatch[0]) + routesMatch[0].length;
  const newRoutes = `
    { path: '/corporate-docs', title: 'Corporate Documents', sub: 'Source documents, loans, risk register, governance.', comp: <MissingDocsPage /> },
    { path: '/compliance-docs', title: 'Compliance Docs', sub: 'SOX, transfer pricing, dividends, CapEx, whistleblower.', comp: <Batch2DocsPage /> },`;
  c = c.slice(0, insertAt) + newRoutes + c.slice(insertAt);
  console.log('Routes added');
}

// 3. Add nav items — find Enterprise nav group
const enterpriseMatch = c.match(/Enterprise[\s\S]{0,200}items:\s*\[/);
if (enterpriseMatch && !c.includes("'Corporate Docs'")) {
  const idx = c.indexOf(enterpriseMatch[0]) + enterpriseMatch[0].length;
  const navItems = `
          { path: '/corporate-docs', label: 'Corporate Docs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { path: '/compliance-docs', label: 'Compliance Docs', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },`;
  c = c.slice(0, idx) + navItems + c.slice(idx);
  console.log('Nav items added');
} else {
  console.log('Enterprise group not found or nav already exists - searching differently...');
  // Try finding any nav group containing audit-trail or compliance
  const auditIdx = c.indexOf("'/automation-logs'");
  if (auditIdx > -1 && !c.includes("'Corporate Docs'")) {
    const lineStart = c.lastIndexOf('\n', auditIdx);
    const navItems = `\n          { path: '/corporate-docs', label: 'Corporate Docs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { path: '/compliance-docs', label: 'Compliance Docs', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },`;
    c = c.slice(0, lineStart) + navItems + c.slice(lineStart);
    console.log('Nav items added via automation-logs anchor');
  }
}

fs.writeFileSync(f, c, 'utf8');
console.log('Done. Has MissingDocsPage:', c.includes('MissingDocsPage'));
console.log('Has corporate-docs route:', c.includes("path: '/corporate-docs'"));
console.log('Has Corporate Docs nav:', c.includes("'Corporate Docs'"));
