const fs = require('fs');

const appFile = 'C:/deemona-finance-os/frontend/src/App.jsx';
let app = fs.readFileSync(appFile, 'utf8');

// 1. Add imports after DashboardPage import
const dashImport = "import DashboardPage from './components/dashboard/DashboardPage';";
if (!app.includes('WorkflowDesigner')) {
  app = app.replace(dashImport,
    dashImport + "\n" +
    "import WorkflowDesigner from './components/automation/WorkflowDesigner';\n" +
    "import PersonalDashboard from './components/dashboard/PersonalDashboard';\n" +
    "import KnowledgeGraph from './components/knowledge/KnowledgeGraph';\n" +
    "import AIAgentsPage from './components/agents/AIAgentsPage';"
  );
  console.log('Imports added');
} else {
  console.log('Imports already present');
}

// 2. Add routes - find the dashboard route and add before it
const dashRoute = "{ path: '/dashboard',    title: 'Executive Dashboard',";
if (!app.includes('/workflow-designer')) {
  app = app.replace(dashRoute,
    "{ path: '/workflow-designer', title: 'Workflow Designer',   sub: 'Visual drag-drop automation builder.',        comp: <WorkflowDesigner /> },\n" +
    "    { path: '/my-dashboard',     title: 'My Workspace',       sub: 'Personalized role-based dashboard.',           comp: <PersonalDashboard /> },\n" +
    "    { path: '/knowledge-graph',  title: 'Knowledge Graph',    sub: 'Visual enterprise knowledge explorer.',        comp: <KnowledgeGraph /> },\n" +
    "    { path: '/ai-agents',        title: 'AI Agents',          sub: 'Your intelligent AI workforce.',               comp: <AIAgentsPage /> },\n" +
    "    " + dashRoute
  );
  console.log('Routes added');
} else {
  console.log('Routes already present');
}

// 3. Add to nav - find Dashboard nav item and add before it
const dashNav = "{ path: '/dashboard',    label: 'Dashboard',";
if (!app.includes('/workflow-designer')) {
  app = app.replace(dashNav,
    "{ path: '/my-dashboard',     label: 'My Workspace',     icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },\n" +
    "      { path: '/workflow-designer',label: 'Workflow Studio',  icon: 'M13 10V3L4 14h7v7l9-11h-7z' },\n" +
    "      { path: '/knowledge-graph',  label: 'Knowledge Graph',  icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18' },\n" +
    "      { path: '/ai-agents',        label: 'AI Agents',        icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },\n" +
    "      " + dashNav
  );
  console.log('Nav items added');
}

fs.writeFileSync(appFile, app, 'utf8');

// Verify
const check = fs.readFileSync(appFile, 'utf8');
console.log('\nVerification:');
console.log('WorkflowDesigner import:', check.includes('WorkflowDesigner'));
console.log('/workflow-designer route:', check.includes('/workflow-designer'));
console.log('/my-dashboard route:', check.includes('/my-dashboard'));
console.log('/knowledge-graph route:', check.includes('/knowledge-graph'));
console.log('/ai-agents route:', check.includes('/ai-agents'));
