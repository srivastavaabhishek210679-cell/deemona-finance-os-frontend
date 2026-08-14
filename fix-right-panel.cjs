const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Find Layout function
const idx = c.indexOf('function Layout(');
const end = c.indexOf('\nfunction AuthGate', idx);
const oldLayout = c.substring(idx, end);
console.log('Found Layout:', oldLayout.substring(0, 80));

const newLayout = `function Layout({ title, subtitle, children }) {
  const { user, tenant, logout } = useAuth();
  const [showRight, setShowRight] = React.useState(true);
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#EEF3FD' }}>
      <Sidebar user={user} tenant={tenant} onLogout={logout} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar title={title} subtitle={subtitle} />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>{children}</div>
          {showRight && <RightPanel />}
        </div>
      </div>
      <button
        onClick={() => setShowRight(p => !p)}
        title={showRight ? 'Hide panel' : 'Show panel'}
        style={{ position: 'fixed', right: showRight ? 252 : 10, bottom: 24, zIndex: 99, width: 30, height: 30, borderRadius: '50%', background: '#1B4FD8', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(27,79,216,0.4)', transition: 'right 0.25s' }}
      >{showRight ? '\u203a' : '\u2039'}</button>
    </div>
  );
}
`;

c = c.substring(0, idx) + newLayout + c.substring(end);

// Add React import if missing
if (!c.includes('import React,')) {
  c = c.replace("import { useState,", "import React, { useState,");
}

fs.writeFileSync(f, c, 'utf8');
console.log('Fixed. showRight:', c.includes('showRight'));
