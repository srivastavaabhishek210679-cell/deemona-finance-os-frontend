const fs = require('fs');
const path = require('path');

const FRONTEND = 'C:/deemona-finance-os/frontend/src';

// Copy all 4 feature files
const files = [
  ['WorkflowDesigner.jsx',  'components/automation'],
  ['PersonalDashboard.jsx', 'components/dashboard'],
  ['KnowledgeGraph.jsx',    'components/knowledge'],
  ['AIAgentsPage.jsx',      'components/agents'],
];

const featDir = path.join(__dirname, 'features');

files.forEach(([file, dest]) => {
  const src = path.join(featDir, file);
  const destDir = path.join(FRONTEND.replace(/\//g, '\\'), ...dest.split('/'));
  const destFile = path.join(destDir, file);
  
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, destFile);
    console.log('Copied:', file, '->', dest);
  } else {
    console.log('MISSING source:', src);
  }
});

// Wire into App.jsx
const appFile = path.join(FRONTEND.replace(/\//g, '\\'), 'App.jsx');
let app = fs.readFileSync(appFile, 'utf8');

// Add imports
const imports = [
  "import WorkflowDesigner from './components/automation/WorkflowDesigner';",
  "import PersonalDashboard from './components/dashboard/PersonalDashboard';",
  "import KnowledgeGraph from './components/knowledge/KnowledgeGraph';",
  "import AIAgentsPage from './components/agents/AIAgentsPage';",
];

imports.forEach(imp => {
  if (!app.includes(imp)) {
    app = app.replace(
      "import DashboardPage from './components/dashboard/DashboardPage';",
      "import DashboardPage from './components/dashboard/DashboardPage';\n" + imp
    );
  }
});

// Add routes
const newRoutes = [
  { path: '/workflow-designer', title: 'Workflow Designer', sub: 'Visual drag-drop automation builder.', comp: 'WorkflowDesigner' },
  { path: '/my-dashboard',     title: 'My Dashboard',      sub: 'Personalized role-based workspace.',    comp: 'PersonalDashboard' },
  { path: '/knowledge-graph',  title: 'Knowledge Graph',   sub: 'Visual enterprise knowledge explorer.', comp: 'KnowledgeGraph' },
  { path: '/ai-agents',        title: 'AI Agents',         sub: 'Your intelligent AI workforce.',         comp: 'AIAgentsPage' },
];

newRoutes.forEach(r => {
  if (!app.includes(r.path + "'")) {
    app = app.replace(
      "{ path: '/dashboard',    title: 'Executive Dashboard',",
      `{ path: '${r.path}', title: '${r.title}', sub: '${r.sub}', comp: <${r.comp} /> },\n    { path: '/dashboard',    title: 'Executive Dashboard',`
    );
  }
});

// Add to nav groups — Intelligence section
const navItems = [
  `{ path: '/my-dashboard',     label: 'My Workspace',      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },`,
  `{ path: '/workflow-designer',label: 'Workflow Studio',   icon: 'M13 10V3L4 14h7v7l9-11h-7z' },`,
  `{ path: '/knowledge-graph',  label: 'Knowledge Graph',   icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },`,
  `{ path: '/ai-agents',        label: 'AI Agents',         icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },`,
];

navItems.forEach(item => {
  const itemPath = item.match(/path: '([^']+)'/)[1];
  if (!app.includes(itemPath + "'")) {
    app = app.replace(
      "{ path: '/dashboard',    label: 'Dashboard',",
      item + '\n      { path: \'/dashboard\',    label: \'Dashboard\','
    );
  }
});

fs.writeFileSync(appFile, app, 'utf8');
console.log('\nAll 4 features installed!');
console.log('Routes added:', newRoutes.map(r => r.path).join(', '));
