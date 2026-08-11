const fs = require('fs');
const file = 'C:\\deemona-finance-os\\frontend\\src\\App.jsx';
let c = fs.readFileSync(file, 'utf8');

// ── Blue sidebar ─────────────────────────────────────────────
c = c.replace(
  "width: 220, flexShrink: 0, background: '#fff', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden'",
  "width: 220, flexShrink: 0, background: '#1B4FD8', borderRight: 'none', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden'"
);

// ── Logo area ─────────────────────────────────────────────────
c = c.replace(
  "padding: '14px 16px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0",
  "padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0"
);

// Logo icon bg
c = c.replace(
  "width: 30, height: 30, borderRadius: 7, background: 'linear-gradient(135deg,#1B4FD8,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0",
  "width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0"
);

// Logo text color
c = c.replace(
  "fontSize: 12, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'",
  "fontSize: 12, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'"
);
c = c.replace(
  "fontSize: 10, color: '#64748B'",
  "fontSize: 10, color: 'rgba(255,255,255,0.6)'"
);

// ── Nav section labels ────────────────────────────────────────
c = c.replace(
  "padding: '8px 8px 3px', fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', textTransform: 'uppercase'",
  "padding: '8px 8px 3px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.07em', textTransform: 'uppercase'"
);

// ── Nav items ─────────────────────────────────────────────────
c = c.replace(
  "color: isActive ? '#1B4FD8' : '#475569', background: isActive ? '#EEF3FD' : 'transparent',",
  "color: isActive ? '#1B4FD8' : 'rgba(255,255,255,0.85)', background: isActive ? '#FFFFFF' : 'transparent',"
);

// ── Sidebar footer ────────────────────────────────────────────
c = c.replace(
  "padding: '10px 8px', borderTop: '1px solid #E2E8F0', flexShrink: 0",
  "padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.15)', flexShrink: 0"
);

// User name color
c = c.replace(
  "fontSize: 12, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'",
  "fontSize: 12, fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'"
);

// User role color
c = c.replace(
  "fontSize: 10, color: '#64748B', textTransform: 'capitalize'",
  "fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize'"
);

// Logout button color
c = c.replace(
  "background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4, borderRadius: 4, display: 'flex'",
  "background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4, borderRadius: 4, display: 'flex'"
);

// Status dot
c = c.replace(
  "width: 6, height: 6, borderRadius: '50%', background: '#059669'",
  "width: 6, height: 6, borderRadius: '50%', background: '#4ADE80'"
);
c = c.replace(
  "fontSize: 10, color: '#059669', fontWeight: 600",
  "fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600"
);

// ── TopBar - blue-tinted bg ───────────────────────────────────
c = c.replace(
  "background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, boxShadow: '0 1px 2px rgba(15,23,42,0.04)'",
  "background: '#FFFFFF', borderBottom: '1px solid #C7D9F8', padding: '0 24px', height: 54, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, boxShadow: '0 1px 4px rgba(27,79,216,0.08)'"
);

// Title brighter
c = c.replace(
  "fontSize: 15, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'",
  "fontSize: 15, fontWeight: 700, color: '#0A1628', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'"
);

// Subtitle brighter
c = c.replace(
  "fontSize: 11, color: '#64748B', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'",
  "fontSize: 11, color: '#3B5998', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'"
);

// ── Search bar blue tint ──────────────────────────────────────
c = c.replace(
  "padding: '6px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 7, width: 220, cursor: 'pointer', transition: 'border-color 0.15s'",
  "padding: '6px 12px', background: '#F0F5FF', border: '1px solid #C7D9F8', borderRadius: 7, width: 220, cursor: 'pointer', transition: 'border-color 0.15s'"
);

// ── RightPanel blue tint ──────────────────────────────────────
c = c.replace(
  "width: 240, flexShrink: 0, background: '#fff', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', overflow: 'hidden'",
  "width: 240, flexShrink: 0, background: '#F0F5FF', borderLeft: '1px solid #C7D9F8', display: 'flex', flexDirection: 'column', overflow: 'hidden'"
);

c = c.replace(
  "padding: '14px 16px 10px', borderBottom: '1px solid #E2E8F0', flexShrink: 0",
  "padding: '14px 16px 10px', borderBottom: '1px solid #C7D9F8', flexShrink: 0"
);

c = c.replace(
  "fontSize: 12, fontWeight: 700, color: '#0F172A'",
  "fontSize: 12, fontWeight: 700, color: '#0A1628'"
);

// Summary card blue tint
c = c.replace(
  "padding: '12px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: 14",
  "padding: '12px', borderRadius: 8, background: '#DBEAFE', border: '1px solid #93B4EF', marginBottom: 14"
);

// ── Page background ───────────────────────────────────────────
c = c.replace(
  "display: 'flex', height: '100vh', overflow: 'hidden', background: '#F4F6FA'",
  "display: 'flex', height: '100vh', overflow: 'hidden', background: '#EEF3FD'"
);

// Loading screen
c = c.replace(
  "minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F6FA'",
  "minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF3FD'"
);

fs.writeFileSync(file, c, 'utf8');
console.log('Theme updated - blue sidebar + blue tinted UI');
