import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiURL } from '../api.js';

const ICONS = {
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  plus: 'M12 4v16m8-8H4',
  help: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

const QUICK_LINKS = [
  { label: 'AP Invoice', path: '/accounting', icon: '📋' },
  { label: 'AR Invoice', path: '/accounting', icon: '📄' },
  { label: 'Add Employee', path: '/payroll', icon: '👤' },
  { label: 'Record Payment', path: '/treasury', icon: '💳' },
  { label: 'Expense Claim', path: '/expenses', icon: '🧾' },
  { label: 'Add Vendor', path: '/procurement', icon: '🏭' },
  { label: 'Ask Digital CFO', path: '/cfo', icon: '◈' },
  { label: 'Upload Invoice', path: '/document-ai', icon: '🔍' },
];

const NOTIFICATIONS = [
  { icon: '⚠️', text: 'GST GSTR-3B due in 12 days', time: '2h ago', color: '#F5A623', path: '/tax-agent' },
  { icon: '💰', text: 'Invoice awaiting approval', time: '3h ago', color: '#6C63FF', path: '/accounting' },
  { icon: '✅', text: 'July payroll approved', time: '1d ago', color: '#22C98A', path: '/payroll' },
  { icon: '🔴', text: 'Low cash — runway 8 months', time: '1d ago', color: '#FF5C5C', path: '/cfo' },
  { icon: '📋', text: 'PF challan due 15th', time: '2d ago', color: '#F5A623', path: '/compliance' },
];

export default function TopBar({ title, subtitle }) {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); }
      if (e.key === 'Escape') { setShowSearch(false); setShowNotif(false); setShowNew(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { if (showSearch && searchRef.current) searchRef.current.focus(); }, [showSearch]);

  const filtered = searchQ ? QUICK_LINKS.filter(l => l.label.toLowerCase().includes(searchQ.toLowerCase())) : QUICK_LINKS;
  const closeAll = () => { setShowSearch(false); setShowNotif(false); setShowNew(false); };

  return (
    <>
      {(showSearch || showNew || showNotif) && (
        <div onClick={closeAll} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:100, backdropFilter:'blur(2px)' }} />
      )}

      {showSearch && (
        <div style={{ position:'fixed', top:'15%', left:'50%', transform:'translateX(-50%)', width:560, zIndex:101, borderRadius:16, background:'var(--surface-1)', border:'1px solid var(--border)', boxShadow:'0 24px 80px rgba(0,0,0,0.5)', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontSize:18 }}>🔍</span>
            <input ref={searchRef} value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search modules, actions..." style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:16, color:'var(--text-primary)' }} />
            <kbd style={{ fontSize:11, padding:'2px 6px', borderRadius:4, background:'var(--surface-3)', color:'var(--text-muted)' }}>ESC</kbd>
          </div>
          <div style={{ padding:'8px 0', maxHeight:320, overflowY:'auto' }}>
            <div style={{ padding:'6px 20px', fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.06em' }}>QUICK ACTIONS</div>
            {filtered.map((item, i) => (
              <a key={i} href={item.path} onClick={closeAll} style={{ display:'flex', alignItems:'center', gap:14, padding:'11px 20px', textDecoration:'none', color:'var(--text-primary)' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <span style={{ fontSize:18 }}>{item.icon}</span>
                <span style={{ fontSize:14 }}>{item.label}</span>
                <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text-muted)' }}>→</span>
              </a>
            ))}
          </div>
          <div style={{ padding:'10px 20px', borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)' }}>
            Press ESC to close · Ctrl+K to open
          </div>
        </div>
      )}

      {showNotif && (
        <div style={{ position:'fixed', top:64, right:20, width:360, zIndex:101, borderRadius:14, background:'var(--surface-1)', border:'1px solid var(--border)', boxShadow:'0 16px 48px rgba(0,0,0,0.4)', overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:14, fontWeight:700 }}>Notifications</span>
            <button onClick={closeAll} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:18, lineHeight:1 }}>x</button>
          </div>
          {NOTIFICATIONS.map((n, i) => (
            <a key={i} href={n.path} onClick={closeAll} style={{ display:'flex', gap:12, padding:'12px 18px', borderBottom:'1px solid var(--border)', textDecoration:'none', color:'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div style={{ width:36, height:36, borderRadius:10, background:n.color+'20', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{n.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>{n.text}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{n.time}</div>
              </div>
            </a>
          ))}
          <div style={{ padding:'10px 18px', textAlign:'center' }}>
            <a href="/compliance" style={{ fontSize:13, color:'var(--accent)', textDecoration:'none', fontWeight:600 }}>View all</a>
          </div>
        </div>
      )}

      {showNew && (
        <div style={{ position:'fixed', top:64, right:20, width:260, zIndex:101, borderRadius:14, background:'var(--surface-1)', border:'1px solid var(--border)', boxShadow:'0 16px 48px rgba(0,0,0,0.4)', overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', fontSize:14, fontWeight:700 }}>Quick Create</div>
          {QUICK_LINKS.map((item, i) => (
            <a key={i} href={item.path} onClick={closeAll} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 18px', textDecoration:'none', color:'var(--text-primary)', borderBottom:'1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <span style={{ fontSize:18 }}>{item.icon}</span>
              <span style={{ fontSize:13 }}>{item.label}</span>
            </a>
          ))}
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 22px', borderBottom:'1px solid var(--border)', background:'var(--bg)', flexShrink:0 }}>
        <div style={{ flex:1 }}>
          <h1 style={{ fontSize:22, fontWeight:700, lineHeight:1.2 }}>{title}</h1>
          {subtitle && <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:2 }}>{subtitle}</p>}
        </div>
        <button onClick={() => setShowSearch(true)} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:10, width:220, cursor:'pointer' }}>
          <span style={{ fontSize:14 }}>🔍</span>
          <span style={{ fontSize:13, color:'var(--text-muted)', flex:1, textAlign:'left' }}>Search anywhere...</span>
          <kbd style={{ fontSize:10, color:'var(--text-muted)', background:'var(--surface-3)', padding:'2px 6px', borderRadius:4 }}>Ctrl K</kbd>
        </button>
        <div style={{ position:'relative' }}>
          <button onClick={() => { setShowNotif(!showNotif); setShowNew(false); }} style={{ width:36, height:36, borderRadius:10, background:showNotif?'var(--accent)':'var(--surface-2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            🔔
          </button>
          <div style={{ position:'absolute', top:-4, right:-4, width:16, height:16, borderRadius:'50%', background:'#FF5C5C', fontSize:9, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--bg)' }}>5</div>
        </div>
        <button onClick={() => window.open('https://docs.claude.ai','_blank')} style={{ width:36, height:36, borderRadius:10, background:'var(--surface-2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:16 }}>?</button>
        <button onClick={() => { setShowNew(!showNew); setShowNotif(false); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, background:'var(--accent)', color:'#fff', fontSize:13, fontWeight:600, border:'none', cursor:'pointer' }}>
          + New
        </button>
      </div>
    </>
  );
}
