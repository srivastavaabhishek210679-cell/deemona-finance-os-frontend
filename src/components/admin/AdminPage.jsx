import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { const r = await fetch(apiURL(url), { headers: h() }); return r.json(); };
const post = async (url, body) => { const r = await fetch(apiURL(url), { method:'POST', headers:h(), body:JSON.stringify(body) }); return r.json(); };

function INR(n) { const v=parseFloat(n||0); if(v>=1e7) return 'Rs '+(v/1e7).toFixed(2)+' Cr'; if(v>=1e5) return 'Rs '+(v/1e5).toFixed(2)+' L'; return 'Rs '+v.toLocaleString('en-IN'); }

const PLAN_COLORS = { free:'var(--text-muted)', starter:'#22C98A', pro:'#6C63FF', enterprise:'#F5A623' };

export default function AdminPage() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantDetail, setTenantDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(()=>{
    setLoading(true);
    Promise.all([
      get('/api/admin/stats'),
      get('/api/admin/tenants'),
      get('/api/admin/revenue'),
    ]).then(([s,t,r])=>{ setStats(s); setTenants(t.tenants||[]); setRevenue(r); setLoading(false); })
    .catch(e=>{ setError('Admin access required. Set PLATFORM_ADMIN_EMAIL in backend environment.'); setLoading(false); });
  },[]);

  const loadTenant = async (id) => {
    setSelectedTenant(id);
    const d = await get(`/api/admin/tenants/${id}`);
    setTenantDetail(d);
    setTab('tenant-detail');
  };

  const changePlan = async (tenantId, planId) => {
    await post(`/api/admin/tenants/${tenantId}/plan`, { plan_id: planId });
    const d = await get(`/api/admin/tenants/${tenantId}`);
    setTenantDetail(d);
    get('/api/admin/tenants').then(t=>setTenants(t.tenants||[]));
  };

  const suspendTenant = async (tenantId) => {
    const reason = prompt('Reason for suspension:');
    if (!reason) return;
    await post(`/api/admin/tenants/${tenantId}/suspend`, { reason });
    get('/api/admin/tenants').then(t=>setTenants(t.tenants||[]));
  };

  const activateTenant = async (tenantId) => {
    await post(`/api/admin/tenants/${tenantId}/activate`, {});
    get('/api/admin/tenants').then(t=>setTenants(t.tenants||[]));
  };

  const filtered = tenants.filter(t => (!search || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug?.toLowerCase().includes(search.toLowerCase())) && (!planFilter || t.plan_id===planFilter));

  if (error) return <div style={{ padding:40, textAlign:'center', color:'#FF5C5C', fontSize:14 }}>{error}</div>;
  if (loading) return <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>Loading admin dashboard...</div>;

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24, display:'flex', alignItems:'center', gap:12 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:800, margin:0, marginBottom:4 }}>Platform Admin</h2>
          <p style={{ fontSize:13, color:'#FF5C5C', margin:0, fontWeight:600 }}>⚠ Platform Owner Access Only</p>
        </div>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['overview','📊 Overview'],['tenants','🏢 All Tenants'],['revenue','💰 Revenue'],['tenant-detail',selectedTenant?'🔍 Tenant Detail':'']].filter(([,l])=>l).map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'10px 20px', fontSize:14, fontWeight:600, background:'none', border:'none', cursor:'pointer', borderBottom:tab===id?'2px solid #6C63FF':'2px solid transparent', color:tab===id?'#6C63FF':'var(--text-secondary)', marginBottom:-1 }}>{label}</button>
        ))}
      </div>

      {tab==='overview' && stats && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
            {[
              { label:'Total Tenants',    value:stats.tenants?.total||0,            sub:`+${stats.tenants?.new_30d||0} this month`, color:'#6C63FF' },
              { label:'Active Tenants',   value:stats.tenants?.active||0,           sub:'Currently active', color:'#22C98A' },
              { label:'Total Users',      value:stats.users?.total||0,              sub:'All users', color:'#4FC3F7' },
              { label:'MRR',              value:INR(stats.revenue?.this_month||0),  sub:'This month', color:'#22C98A' },
            ].map(k=>(
              <div key={k.label} style={{ padding:'16px 20px', borderRadius:12, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
                <div style={{ fontSize:24, fontWeight:800, color:k.color }}>{k.value}</div>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{k.label}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Plan distribution */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ borderRadius:12, border:'1px solid var(--border)', padding:20, background:'var(--surface-2)' }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Plan Distribution</div>
              {stats.plan_distribution?.map(p=>(
                <div key={p.plan_id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:PLAN_COLORS[p.plan_id]||'#6C63FF', textTransform:'capitalize' }}>{p.plan_id}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:80, height:6, borderRadius:3, background:'var(--surface-3)' }}>
                      <div style={{ height:'100%', width:Math.min(100,(p.count/stats.tenants?.total)*100)+'%', background:PLAN_COLORS[p.plan_id]||'#6C63FF', borderRadius:3 }}/>
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, width:20 }}>{p.count}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderRadius:12, border:'1px solid var(--border)', padding:20, background:'var(--surface-2)' }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Recent Signups</div>
              {stats.recent_tenants?.map((t,i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:8, cursor:'pointer' }} onClick={()=>loadTenant(t.id||i)}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{t.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString('en-IN')}</div>
                  </div>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:100, background:(PLAN_COLORS[t.plan_id]||'#6C63FF')+'20', color:PLAN_COLORS[t.plan_id]||'#6C63FF', fontWeight:700, alignSelf:'center' }}>{t.plan_name||t.plan_id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==='tenants' && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or slug..." style={{ flex:1, padding:'9px 14px', borderRadius:9, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-primary)', fontSize:13 }} />
            <select value={planFilter} onChange={e=>setPlanFilter(e.target.value)} style={{ padding:'9px 14px', borderRadius:9, border:'1px solid var(--border)', background:'var(--surface-2)', color:'var(--text-primary)', fontSize:13 }}>
              <option value="">All Plans</option>
              {['free','starter','pro','enterprise'].map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', background:'var(--surface-3)', display:'grid', gridTemplateColumns:'2fr 1fr 80px 80px 80px 100px 80px', fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.04em', gap:8 }}>
              <div>COMPANY</div><div>SLUG</div><div>PLAN</div><div>USERS</div><div>INVOICES</div><div>JOINED</div><div>ACTION</div>
            </div>
            {filtered.map(t=>(
              <div key={t.id} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'grid', gridTemplateColumns:'2fr 1fr 80px 80px 80px 100px 80px', alignItems:'center', gap:8, opacity:t.is_active===false?0.5:1 }}>
                <div style={{ cursor:'pointer' }} onClick={()=>t.id&&loadTenant(t.id)}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{t.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{t.industry}</div>
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'monospace' }}>{t.slug}</div>
                <span style={{ fontSize:11, padding:'2px 6px', borderRadius:100, background:(PLAN_COLORS[t.plan_id]||'#6C63FF')+'20', color:PLAN_COLORS[t.plan_id]||'#6C63FF', fontWeight:700, textAlign:'center' }}>{t.plan_id}</span>
                <div style={{ fontSize:12, textAlign:'center' }}>{t.user_count||0}</div>
                <div style={{ fontSize:12, textAlign:'center' }}>{t.invoice_count||0}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString('en-IN')}</div>
                <button onClick={()=>t.is_active===false?activateTenant(t.id):suspendTenant(t.id)} style={{ padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:600, background:t.is_active===false?'#22C98A15':'#FF5C5C15', color:t.is_active===false?'#22C98A':'#FF5C5C', border:'none', cursor:'pointer' }}>
                  {t.is_active===false?'Activate':'Suspend'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='revenue' && revenue && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', background:'var(--surface-3)', fontSize:13, fontWeight:700, color:'var(--text-muted)' }}>MONTHLY REVENUE</div>
              {revenue.monthly?.map((m,i)=>(
                <div key={i} style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:13 }}>{m.month}</span>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#22C98A' }}>{INR(m.revenue)}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{m.payments} payments</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', background:'var(--surface-3)', fontSize:13, fontWeight:700, color:'var(--text-muted)' }}>REVENUE BY PLAN</div>
              {revenue.by_plan?.map((p,i)=>(
                <div key={i} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between' }}>
                  <div>
                    <span style={{ fontSize:13, fontWeight:600, color:PLAN_COLORS[p.plan_id]||'#6C63FF', textTransform:'capitalize' }}>{p.plan_name}</span>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{p.count} payments</div>
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#22C98A' }}>{INR(p.revenue)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==='tenant-detail' && tenantDetail && (
        <div>
          <button onClick={()=>setTab('tenants')} style={{ marginBottom:16, padding:'6px 14px', borderRadius:8, fontSize:13, background:'var(--surface-2)', border:'1px solid var(--border)', color:'var(--text-secondary)', cursor:'pointer' }}>← Back to Tenants</button>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={{ borderRadius:12, border:'1px solid var(--border)', padding:20, background:'var(--surface-2)' }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>{tenantDetail.tenant?.name}</div>
              {[['Industry',tenantDetail.tenant?.industry],['Plan',tenantDetail.tenant?.plan_name],['GSTIN',tenantDetail.tenant?.gstin],['City',tenantDetail.tenant?.city],['Joined',new Date(tenantDetail.tenant?.created_at).toLocaleDateString('en-IN')]].map(([k,v])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                  <span style={{ color:'var(--text-secondary)' }}>{k}</span><span style={{ fontWeight:600 }}>{v||'—'}</span>
                </div>
              ))}
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:6 }}>Change Plan</div>
                <div style={{ display:'flex', gap:6 }}>
                  {['free','starter','pro','enterprise'].map(p=>(
                    <button key={p} onClick={()=>changePlan(tenantDetail.tenant?.id,p)} style={{ padding:'5px 10px', borderRadius:6, fontSize:11, fontWeight:700, background:tenantDetail.tenant?.plan_id===p?'#6C63FF':'var(--surface-3)', color:tenantDetail.tenant?.plan_id===p?'#fff':'var(--text-secondary)', border:'none', cursor:'pointer' }}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div style={{ borderRadius:12, border:'1px solid var(--border)', padding:20, background:'var(--surface-2)', marginBottom:14 }}>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>Data Overview</div>
                {[['AR Invoices',tenantDetail.usage?.ar_count],['AP Invoices',tenantDetail.usage?.ap_count],['Employees',tenantDetail.usage?.emp_count],['Bank Transactions',tenantDetail.usage?.txn_count]].map(([k,v])=>(
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                    <span style={{ color:'var(--text-secondary)' }}>{k}</span><span style={{ fontWeight:700 }}>{v||0}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
                <div style={{ padding:'10px 14px', background:'var(--surface-3)', fontSize:12, fontWeight:700, color:'var(--text-muted)' }}>USERS ({tenantDetail.users?.length})</div>
                {tenantDetail.users?.map(u=>(
                  <div key={u.id} style={{ padding:'9px 14px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', fontSize:12 }}>
                    <div><div style={{ fontWeight:600 }}>{u.first_name} {u.last_name}</div><div style={{ color:'var(--text-muted)' }}>{u.email}</div></div>
                    <span style={{ padding:'2px 8px', borderRadius:100, fontSize:10, fontWeight:700, background:'#6C63FF20', color:'#9B8FFF', alignSelf:'center' }}>{u.role_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
