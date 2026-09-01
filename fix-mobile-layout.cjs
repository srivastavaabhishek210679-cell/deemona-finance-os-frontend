const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Replace Layout function with mobile-responsive version
const oldLayout = `function Layout({ title, subtitle, children }) {
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
      >{showRight ? '›' : '‹'}</button>
    </div>`;

const newLayout = `function Layout({ title, subtitle, children }) {
  const { user, tenant, logout } = useAuth();
  const [showRight, setShowRight] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const isMobile = window.innerWidth < 768;
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#EEF3FD' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998, display: isMobile ? 'block' : 'none' }}/>
      )}
      {/* Sidebar - hidden on mobile unless open */}
      <div style={{ position: isMobile ? 'fixed' : 'relative', left: isMobile ? (sidebarOpen ? 0 : -240) : 0, top: 0, bottom: 0, zIndex: 999, transition: 'left 0.25s', flexShrink: 0 }}>
        <Sidebar user={user} tenant={tenant} onLogout={logout} onClose={() => setSidebarOpen(false)}/>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Mobile topbar with hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(p => !p)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#1B4FD8', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ width: 20, height: 2, background: '#1B4FD8', borderRadius: 2 }}/>
            <div style={{ width: 20, height: 2, background: '#1B4FD8', borderRadius: 2 }}/>
            <div style={{ width: 20, height: 2, background: '#1B4FD8', borderRadius: 2 }}/>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title || 'Deemona AI Finance OS'}</div>
            {subtitle && <div style={{ fontSize: 10, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subtitle}</div>}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1B4FD8', background: '#eff6ff', padding: '3px 8px', borderRadius: 5, whiteSpace: 'nowrap', flexShrink: 0 }}>AI Finance OS</div>
        </div>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>{children}</div>
          {showRight && !isMobile && <RightPanel />}
        </div>
      </div>
    </div>`;

if (c.includes('function Layout(')) {
  c = c.replace(oldLayout, newLayout);
  if (c.includes(oldLayout.substring(0,50))) {
    console.log('Replace failed - trying line approach');
  } else {
    console.log('Layout replaced successfully');
  }
} else {
  console.log('Layout function not found');
}

// 2. Make Sidebar nav items close sidebar on mobile when clicked
// Add onClose prop to nav links
c = c.replace(
  `function Sidebar({ user, tenant, onLogout }) {`,
  `function Sidebar({ user, tenant, onLogout, onClose }) {`
);

// Add onClick to NavLink items to close sidebar on mobile
c = c.replace(
  `<NavLink to={item.path}`,
  `<NavLink to={item.path} onClick={() => { if (window.innerWidth < 768 && onClose) onClose(); }}`
);

fs.writeFileSync(f, c, 'utf8');
console.log('Done');
console.log('Has sidebarOpen:', c.includes('sidebarOpen'));
console.log('Has overlay:', c.includes('Mobile overlay'));
console.log('Has hamburger:', c.includes('hamburger') || c.includes('flexDirection'));
