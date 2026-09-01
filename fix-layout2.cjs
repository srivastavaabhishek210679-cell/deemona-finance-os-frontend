const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

const layoutStart = c.indexOf('function Layout(');
const layoutEnd = c.indexOf('\nfunction ', layoutStart + 10);
const oldLayout = c.substring(layoutStart, layoutEnd);
console.log('Replacing', oldLayout.length, 'chars');

const newLayout = `function Layout({ title, subtitle, children }) {
  const { user, tenant, logout } = useAuth();
  const [showRight, setShowRight] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const isMobile = () => window.innerWidth < 768;
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#EEF3FD' }}>
      {/* Mobile overlay */}
      {sidebarOpen && isMobile() && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 998 }}/>
      )}
      {/* Sidebar */}
      <div style={{ position: isMobile() ? 'fixed' : 'relative', left: isMobile() ? (sidebarOpen ? 0 : -240) : 0, top: 0, bottom: 0, zIndex: 999, transition: 'left 0.25s ease', flexShrink: 0 }}>
        <Sidebar user={user} tenant={tenant} onLogout={logout} onClose={() => setSidebarOpen(false)} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar with hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0, minHeight: 48 }}>
          <button onClick={() => setSidebarOpen(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: '#1B4FD8', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
            <span style={{ display: 'block', width: 22, height: 2, background: '#1B4FD8', borderRadius: 2 }}/>
            <span style={{ display: 'block', width: 22, height: 2, background: '#1B4FD8', borderRadius: 2 }}/>
            <span style={{ display: 'block', width: 22, height: 2, background: '#1B4FD8', borderRadius: 2 }}/>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title || 'Deemona AI Finance OS'}</div>
            {subtitle && <div style={{ fontSize: 10, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#1B4FD8', background: '#eff6ff', padding: '3px 8px', borderRadius: 5, whiteSpace: 'nowrap', flexShrink: 0 }}>AI Finance OS</div>
        </div>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>{children}</div>
          {showRight && !isMobile() && <RightPanel />}
        </div>
      </div>
    </div>
  );
}`;

c = c.substring(0, layoutStart) + newLayout + c.substring(layoutEnd);

// Also add onClose prop to Sidebar
c = c.replace(
  'function Sidebar({ user, tenant, onLogout }) {',
  'function Sidebar({ user, tenant, onLogout, onClose }) {'
);

// Close sidebar on nav item click on mobile
c = c.replace(
  '<NavLink to={item.path}',
  '<NavLink to={item.path} onClick={() => { if (window.innerWidth < 768 && onClose) onClose(); }}'
);

fs.writeFileSync(f, c, 'utf8');
console.log('Done');
console.log('Has sidebarOpen:', c.includes('sidebarOpen'));
console.log('Has hamburger spans:', c.includes('display: \'block\', width: 22'));
