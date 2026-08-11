import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { const r = await fetch(apiURL(url), { headers: h() }); return r.json(); };
const post = async (url, body) => { const r = await fetch(apiURL(url), { method:'POST', headers:h(), body:JSON.stringify(body) }); return r.json(); };
const put  = async (url, body) => { const r = await fetch(apiURL(url), { method:'PUT', headers:h(), body:JSON.stringify(body) }); return r.json(); };

const ROLE_COLORS = { owner:'#FF5C5C', admin:'#F5A623', manager:'#1B4FD8', accountant:'#22C98A', staff:'#4FC3F7', viewer:'var(--text-muted)' };
const ROLE_DESCS = {
  owner:      'Full access to everything including billing',
  admin:      'All modules, can invite users, no billing',
  manager:    'Approve transactions, manage projects and CRM',
  accountant: 'Full accounting and reports access',
  staff:      'Read-only access + submit expense claims',
  viewer:     'Read-only access to reports and data',
};

export default function RBACPage() {
  const [tab, setTab] = useState('team');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [myPerms, setMyPerms] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [toggling, setToggling] = useState(null);

  useEffect(()=>{
    get('/api/rbac/users').then(d=>setUsers(d.users||[])).catch(()=>{});
    get('/api/rbac/roles').then(d=>setRoles(d.roles||[]));
    get('/api/rbac/my-permissions').then(setMyPerms);
  },[]);

  const changeRole = async (userId, role) => {
    await put(`/api/rbac/users/${userId}/role`, { role_name: role });
    setUsers(prev=>prev.map(u=>u.id===userId?{...u,role_name:role}:u));
  };

  const toggleUser = async (userId) => {
    setToggling(userId);
    const d = await put(`/api/rbac/users/${userId}/toggle`, {});
    setUsers(prev=>prev.map(u=>u.id===userId?{...u,is_active:d.is_active}:u));
    setToggling(null);
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true); setInviteResult(null);
    const d = await post('/api/rbac/invite', { email: inviteEmail, role_name: inviteRole });
    setInviteResult(d); setInviting(false);
    if (d.success) setInviteEmail('');
  };

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, margin:0, marginBottom:6 }}>Team & Access Control</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', margin:0 }}>Manage team members, assign roles, and control who can access what</p>
      </div>

      {myPerms && (
        <div style={{ marginBottom:20, padding:'10px 14px', borderRadius:8, background:'#1B4FD812', border:'1px solid #1B4FD825', fontSize:13 }}>
          Your role: <strong style={{ color:ROLE_COLORS[myPerms.role]||'#1B4FD8' }}>{myPerms.role?.toUpperCase()}</strong> — {ROLE_DESCS[myPerms.role]||''}
        </div>
      )}

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['team','👥 Team Members'],['roles','🔐 Roles & Permissions'],['invite','+ Invite User']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'10px 20px', fontSize:14, fontWeight:600, background:'none', border:'none', cursor:'pointer', borderBottom:tab===id?'2px solid #1B4FD8':'2px solid transparent', color:tab===id?'#1B4FD8':'var(--text-secondary)', marginBottom:-1 }}>{label}</button>
        ))}
      </div>

      {tab==='team' && (
        <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', background:'var(--surface-3)', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 120px 80px', fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.04em' }}>
            <div>USER</div><div>EMAIL</div><div>ROLE</div><div>LAST LOGIN</div><div>STATUS</div>
          </div>
          {users.length===0 && <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>No team members yet. Invite someone!</div>}
          {users.map(u=>(
            <div key={u.id} style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 120px 80px', alignItems:'center', opacity:u.is_active?1:0.5 }}>
              <div style={{ fontSize:14, fontWeight:600 }}>{u.first_name} {u.last_name}</div>
              <div style={{ fontSize:13, color:'var(--text-muted)' }}>{u.email}</div>
              <select value={u.role_name||'viewer'} onChange={e=>changeRole(u.id,e.target.value)} style={{ padding:'4px 8px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface-2)', color:ROLE_COLORS[u.role_name]||'var(--text-primary)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                {Object.keys(ROLE_COLORS).map(r=><option key={r} value={r}>{r}</option>)}
              </select>
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{u.last_login?new Date(u.last_login).toLocaleDateString('en-IN'):'Never'}</div>
              <button onClick={()=>toggleUser(u.id)} disabled={toggling===u.id} style={{ padding:'4px 10px', borderRadius:6, fontSize:11, fontWeight:700, background:u.is_active?'#FF5C5C15':'#22C98A15', color:u.is_active?'#FF5C5C':'#22C98A', border:`1px solid ${u.is_active?'#FF5C5C30':'#22C98A30'}`, cursor:'pointer' }}>
                {toggling===u.id?'...':u.is_active?'Disable':'Enable'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab==='roles' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
          {roles.map(role=>(
            <div key={role.name} style={{ borderRadius:12, border:`1px solid ${ROLE_COLORS[role.name]||'var(--border)'}40`, padding:18, background:'var(--surface-2)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:15, fontWeight:800, color:ROLE_COLORS[role.name]||'#1B4FD8', textTransform:'uppercase', letterSpacing:'0.04em' }}>{role.name}</span>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:100, background:(ROLE_COLORS[role.name]||'#1B4FD8')+'20', color:ROLE_COLORS[role.name]||'#1B4FD8', fontWeight:700 }}>{role.permission_count} perms</span>
              </div>
              <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:12, lineHeight:1.5 }}>{ROLE_DESCS[role.name]}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                {role.permissions?.includes('*') ? (
                  <span style={{ padding:'2px 8px', borderRadius:100, fontSize:10, background:'#FF5C5C20', color:'#FF5C5C', fontWeight:700 }}>ALL PERMISSIONS</span>
                ) : role.permissions?.slice(0,5).map((p,i)=>(
                  <span key={i} style={{ padding:'2px 8px', borderRadius:100, fontSize:10, background:'var(--surface-3)', color:'var(--text-secondary)' }}>{p}</span>
                ))}
                {role.permissions?.length>5&&<span style={{ fontSize:10, color:'var(--text-muted)' }}>+{role.permissions.length-5} more</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==='invite' && (
        <div style={{ maxWidth:500 }}>
          <div style={{ borderRadius:12, border:'1px solid var(--border)', padding:24, background:'var(--surface-2)' }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Invite Team Member</div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:5 }}>Email Address</div>
              <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="colleague@company.com" type="email" style={{ width:'100%', boxSizing:'border-box', padding:'10px 14px', borderRadius:9, border:'1px solid var(--border)', background:'var(--surface-1)', color:'var(--text-primary)', fontSize:14 }} onKeyDown={e=>e.key==='Enter'&&sendInvite()} />
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:5 }}>Role</div>
              <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)} style={{ width:'100%', padding:'10px 14px', borderRadius:9, border:'1px solid var(--border)', background:'var(--surface-1)', color:'var(--text-primary)', fontSize:14 }}>
                {['admin','manager','accountant','staff','viewer'].map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)} — {ROLE_DESCS[r]}</option>)}
              </select>
            </div>
            <button onClick={sendInvite} disabled={!inviteEmail.trim()||inviting} style={{ width:'100%', padding:'11px', borderRadius:10, fontSize:14, fontWeight:700, background:(!inviteEmail.trim()||inviting)?'var(--surface-3)':'linear-gradient(135deg,#1B4FD8,#3B82F6)', color:(!inviteEmail.trim()||inviting)?'var(--text-muted)':'#fff', border:'none', cursor:(!inviteEmail.trim()||inviting)?'not-allowed':'pointer' }}>
              {inviting?'Sending...':'Send Invitation'}
            </button>
          </div>

          {inviteResult && (
            <div style={{ marginTop:16, padding:16, borderRadius:12, background: inviteResult.success?'#22C98A12':'#FF5C5C12', border:`1px solid ${inviteResult.success?'#22C98A30':'#FF5C5C30'}` }}>
              {inviteResult.success ? (
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#22C98A', marginBottom:6 }}>Invitation Created!</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>Share this link with {inviteResult.email}:</div>
                  <code style={{ display:'block', padding:10, background:'var(--surface-3)', borderRadius:6, fontSize:11, wordBreak:'break-all', fontFamily:'monospace' }}>{inviteResult.invite_link}</code>
                  <button onClick={()=>navigator.clipboard?.writeText(inviteResult.invite_link)} style={{ marginTop:8, padding:'5px 14px', borderRadius:7, fontSize:12, fontWeight:700, background:'#22C98A', color:'#fff', border:'none', cursor:'pointer' }}>Copy Link</button>
                </div>
              ) : (
                <div style={{ fontSize:13, color:'#FF5C5C' }}>Error: {inviteResult.error}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
