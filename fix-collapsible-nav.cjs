const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Find the Sidebar function and replace the nav rendering with collapsible groups
const oldNav = `      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            <div style={{ padding: '8px 8px 3px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{group.label}</div>
            {group.items.map(item => (
              <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
                marginBottom: 1, fontSize: 12.5, fontWeight: isActive ? 600 : 400, textDecoration: 'none',
                color: isActive ? '#1B4FD8' : 'rgba(255,255,255,0.85)', background: isActive ? '#FFFFFF' : 'transparent',
              })}>
                <Icon d={item.icon} size={14} color="currentColor" />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>`;

const newNav = `      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        <CollapsibleNav />
      </nav>`;

if (c.includes(oldNav)) {
  c = c.replace(oldNav, newNav);
  console.log('✓ Nav replaced with CollapsibleNav');
} else {
  console.log('✗ Could not find nav pattern - trying alternative');
  // Try to find and replace just the map part
  c = c.replace(
    `{NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            <div style={{ padding: '8px 8px 3px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{group.label}</div>
            {group.items.map(item => (
              <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
                marginBottom: 1, fontSize: 12.5, fontWeight: isActive ? 600 : 400, textDecoration: 'none',
                color: isActive ? '#1B4FD8' : 'rgba(255,255,255,0.85)', background: isActive ? '#FFFFFF' : 'transparent',
              })}>
                <Icon d={item.icon} size={14} color="currentColor" />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}`,
    `<CollapsibleNavGroups />`
  );
}

// Add CollapsibleNav component before the Sidebar function
const collapsibleComponent = `
// ── Collapsible Nav Groups ───────────────────────────────────
function CollapsibleNav() {
  const defaultOpen = { Intelligence: true, Finance: true, Operations: false, 'AI Agents': false, Enterprise: false, Settings: false };
  const [open, setOpen] = React.useState(defaultOpen);
  const toggle = (label) => setOpen(prev => ({ ...prev, [label]: !prev[label] }));
  return (
    <>
      {NAV_GROUPS.map(group => (
        <div key={group.label} style={{ marginBottom: 2 }}>
          <button onClick={() => toggle(group.label)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 3px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{group.label}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', transition: 'transform 0.2s', display: 'inline-block', transform: open[group.label] ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </button>
          {open[group.label] && group.items.map(item => (
            <NavLink key={item.path} to={item.path} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6,
              marginBottom: 1, fontSize: 12.5, fontWeight: isActive ? 600 : 400, textDecoration: 'none',
              color: isActive ? '#1B4FD8' : 'rgba(255,255,255,0.85)', background: isActive ? '#FFFFFF' : 'transparent',
            })}>
              <Icon d={item.icon} size={14} color="currentColor" />
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
            </NavLink>
          ))}
        </div>
      ))}
    </>
  );
}

`;

// Insert before Sidebar function
c = c.replace('function Sidebar({', collapsibleComponent + 'function Sidebar({');
console.log('✓ CollapsibleNav component added');

// Make sure React is imported (for useState in CollapsibleNav)
if (!c.includes('import React')) {
  c = c.replace("import { useState,", "import React, { useState,");
  console.log('✓ React import added');
}

fs.writeFileSync(f, c, 'utf8');
console.log('Done!');
