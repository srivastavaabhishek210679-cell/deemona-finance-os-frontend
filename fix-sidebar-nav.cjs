const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
const lines = fs.readFileSync(f, 'utf8').split('\n');

// Find the nav groups and add missing items
let content = lines.join('\n');

// 1. Add GST Portal to Finance group (after Tax & GST)
if (!content.includes("label: 'GST Portal'")) {
  content = content.replace(
    "{ path: '/tax',         label: 'Tax & GST',",
    "{ path: '/gst-portal',  label: 'GST Portal',       icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },\n      { path: '/tax',         label: 'Tax & GST',"
  );
  console.log('✓ GST Portal added to Finance');
}

// 2. Add Reports to Finance group
if (!content.includes("label: 'Reports'")) {
  content = content.replace(
    "{ path: '/statements',  label: 'Statements',",
    "{ path: '/statements',  label: 'Statements',       icon: 'M9 17v-2m3 2v-4m3 4v-6M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z' },\n      { path: '/reports',      label: 'Reports',          icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',"
  );
  // Fix the duplicate statements entry
  content = content.replace(
    "{ path: '/statements',  label: 'Statements',       icon: 'M9 17v-2m3 2v-4m3 4v-6M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z' },\n      { path: '/reports',      label: 'Reports',          icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',\n      { path: '/statements',  label: 'Statements',",
    "{ path: '/reports',      label: 'Reports',          icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },\n      { path: '/statements',  label: 'Statements',"
  );
  console.log('✓ Reports added to Finance');
}

// 3. Move AI features to AI Agents group
if (!content.includes("label: 'My Dashboard'")) {
  content = content.replace(
    "{ path: '/automation',   label: 'Automation',",
    "{ path: '/my-dashboard',     label: 'My Dashboard',     icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },\n      { path: '/workflow-designer', label: 'Workflow Studio',  icon: 'M13 10V3L4 14h7v7l9-11h-7z' },\n      { path: '/knowledge-graph',   label: 'Knowledge Graph',  icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18' },\n      { path: '/ai-agents',         label: 'AI Agents',        icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },\n      { path: '/automation',   label: 'Automation',"
  );
  console.log('✓ My Dashboard, Workflow Studio, Knowledge Graph, AI Agents added to AI group');
}

// 4. Add Enterprise items to Enterprise group
if (!content.includes("label: 'Audit Trail'")) {
  content = content.replace(
    "{ path: '/marketplace',  label: 'Marketplace',",
    "{ path: '/audit-trail',  label: 'Audit Trail',      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },\n      { path: '/companies',    label: 'Multi-Company',    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },\n      { path: '/api-portal',   label: 'API Portal',       icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },\n      { path: '/white-label',  label: 'White Label',      icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },\n      { path: '/marketplace',  label: 'Marketplace',"
  );
  console.log('✓ Audit Trail, Multi-Company, API Portal, White Label added to Enterprise');
}

// 5. Remove duplicates from Settings group
content = content.replace(
  "      { path: '/my-dashboard',     label: 'My Workspace',     icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },\n      { path: '/workflow-designer', label: 'Workflow Studio',  icon: 'M13 10V3L4 14h7v7l9-11h-7z' },\n      { path: '/knowledge-graph',   label: 'Knowledge Graph',  icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18' },\n      { path: '/ai-agents',         label: 'AI Agents',        icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },\n    { path: '/dashboard',",
  "    { path: '/dashboard',"
);

// 6. Remove duplicate white-label from Settings
content = content.replace(
  "      { path: '/white-label',  label: 'White Label',    icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },\n      { path: '/admin',",
  "      { path: '/admin',"
);

fs.writeFileSync(f, content, 'utf8');

// Verify
const verify = [
  ['GST Portal', "label: 'GST Portal'"],
  ['Audit Trail', "label: 'Audit Trail'"],
  ['Multi-Company', "label: 'Multi-Company'"],
  ['API Portal', "label: 'API Portal'"],
  ['Reports', "label: 'Reports'"],
  ['My Dashboard', "label: 'My Dashboard'"],
  ['Workflow Studio', "label: 'Workflow Studio'"],
  ['Knowledge Graph', "label: 'Knowledge Graph'"],
  ['AI Agents', "label: 'AI Agents'"],
  ['White Label', "label: 'White Label'"],
];
console.log('\nVerification:');
verify.forEach(([name, search]) => {
  const count = (content.match(new RegExp(search.replace(/'/g, "\\'"), 'g')) || []).length;
  console.log(`  ${name}: ${count} occurrence(s) ${count === 1 ? '✓' : count === 0 ? '✗ MISSING' : '⚠ DUPLICATE'}`);
});
