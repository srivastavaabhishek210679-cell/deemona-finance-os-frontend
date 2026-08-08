import { useState, useEffect } from 'react';
import { apiURL } from '../../api.js';

const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get  = async url => { const r = await fetch(apiURL(url), { headers: h() }); return r.json(); };
const post = async (url, body) => { const r = await fetch(apiURL(url), { method:'POST', headers:h(), body:JSON.stringify(body) }); return r.json(); };

function INR(n) { return 'Rs '+parseFloat(n||0).toLocaleString('en-IN'); }
function UsageBar({ current, limit, label }) {
  const pct = limit===-1 ? 0 : limit>0 ? Math.min(100,(current/limit)*100) : 100;
  const color = pct>90?'#FF5C5C':pct>70?'#F5A623':'#22C98A';
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
        <span style={{ color:'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontWeight:600 }}>{current} / {limit===-1?'Unlimited':limit}</span>
      </div>
      <div style={{ height:6, borderRadius:3, background:'var(--surface-3)' }}>
        <div style={{ height:'100%', width:(limit===-1?10:pct)+'%', background:color, borderRadius:3, transition:'width 0.5s' }}/>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const [tab, setTab] = useState('overview');
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [billing, setBilling] = useState('monthly');
  const [paying, setPaying] = useState(null);
  const [payResult, setPayResult] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(()=>{
    get('/api/billing/plans').then(d=>setPlans(d.plans||[]));
    get('/api/billing/subscription').then(setSubscription);
    get('/api/billing/invoices').then(d=>setInvoices(d.invoices||[]));
  },[]);

  const handleUpgrade = async (planId) => {
    setPaying(planId); setPayResult(null);
    const d = await post('/api/billing/create-order', { plan_id: planId, billing_cycle: billing });

    if (d.simulated) {
      // Simulate payment in dev mode
      const verify = await post('/api/billing/verify-payment', { plan_id: planId, billing_cycle: billing, razorpay_order_id: d.order_id, razorpay_payment_id: `sim_pay_${Date.now()}` });
      setPayResult(verify);
      if (verify.success) get('/api/billing/subscription').then(setSubscription);
    } else if (d.key_id && window.Razorpay) {
      // Real Razorpay flow
      const rzp = new window.Razorpay({
        key: d.key_id, amount: d.amount*100, currency:'INR',
        name:'Deemona AI Finance OS', description:`${d.plan} Plan`,
        order_id: d.order_id,
        handler: async (response) => {
          const verify = await post('/api/billing/verify-payment', { ...response, plan_id:planId, billing_cycle:billing });
          setPayResult(verify);
          if (verify.success) get('/api/billing/subscription').then(setSubscription);
        },
        theme: { color:'#6C63FF' },
      });
      rzp.open();
    } else {
      setPayResult({ success:false, error: d.error || 'Payment not configured' });
    }
    setPaying(null);
  };

  const handleCancel = async () => {
    if (!confirm('Cancel subscription? You will be downgraded to Free plan.')) return;
    setCancelling(true);
    const d = await post('/api/billing/cancel', {});
    setPayResult(d);
    if (d.success) get('/api/billing/subscription').then(setSubscription);
    setCancelling(false);
  };

  const currentPlanId = subscription?.subscription?.plan_id || 'free';
  const trialDays = subscription?.trial_days_left || 0;

  return (
    <div style={{ padding:24 }}>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:22, fontWeight:800, margin:0, marginBottom:6 }}>Billing & Plans</h2>
        <p style={{ fontSize:14, color:'var(--text-muted)', margin:0 }}>Manage your subscription, view usage, and upgrade your plan</p>
      </div>

      {trialDays > 0 && (
        <div style={{ marginBottom:20, padding:'12px 16px', borderRadius:10, background:'#F5A62312', border:'1px solid #F5A62330' }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#F5A623' }}>Trial: {trialDays} days remaining</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Upgrade to keep access to all features after your trial ends</div>
        </div>
      )}

      {payResult && (
        <div style={{ marginBottom:20, padding:'12px 16px', borderRadius:10, background:payResult.success?'#22C98A12':'#FF5C5C12', border:`1px solid ${payResult.success?'#22C98A30':'#FF5C5C30'}` }}>
          <div style={{ fontSize:14, fontWeight:700, color:payResult.success?'#22C98A':'#FF5C5C' }}>{payResult.success?'Payment Successful!':payResult.error||'Payment failed'}</div>
          {payResult.success&&<div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{payResult.message}</div>}
        </div>
      )}

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['overview','📊 Overview'],['plans','💎 Plans'],['invoices','🧾 Invoices']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'10px 20px', fontSize:14, fontWeight:600, background:'none', border:'none', cursor:'pointer', borderBottom:tab===id?'2px solid #6C63FF':'2px solid transparent', color:tab===id?'#6C63FF':'var(--text-secondary)', marginBottom:-1 }}>{label}</button>
        ))}
      </div>

      {tab==='overview' && subscription && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* Current plan */}
          <div style={{ borderRadius:14, border:'2px solid #6C63FF40', padding:24, background:'#6C63FF06' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:8, letterSpacing:'0.05em' }}>CURRENT PLAN</div>
            <div style={{ fontSize:28, fontWeight:900, color:'#6C63FF', marginBottom:4 }}>{subscription.subscription?.plan_name||'Free'}</div>
            <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:16 }}>
              {subscription.subscription?.status==='trial' ? `Trial — ${trialDays} days left` :
               subscription.subscription?.status==='active' ? `Active until ${new Date(subscription.subscription?.current_period_end).toLocaleDateString('en-IN')}` :
               'Free tier'}
            </div>
            {currentPlanId !== 'free' && (
              <div style={{ fontSize:22, fontWeight:800, marginBottom:16 }}>
                {INR(subscription.subscription?.amount)}<span style={{ fontSize:13, fontWeight:400, color:'var(--text-muted)' }}>/{subscription.subscription?.billing_cycle==='yearly'?'year':'month'}</span>
              </div>
            )}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setTab('plans')} style={{ flex:1, padding:'9px', borderRadius:9, fontSize:13, fontWeight:700, background:'linear-gradient(135deg,#6C63FF,#9B8FFF)', color:'#fff', border:'none', cursor:'pointer' }}>Upgrade Plan</button>
              {currentPlanId!=='free' && <button onClick={handleCancel} disabled={cancelling} style={{ padding:'9px 14px', borderRadius:9, fontSize:13, background:'var(--surface-3)', border:'1px solid var(--border)', color:'#FF5C5C', cursor:'pointer' }}>Cancel</button>}
            </div>
          </div>

          {/* Usage */}
          <div style={{ borderRadius:14, border:'1px solid var(--border)', padding:24, background:'var(--surface-2)' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', marginBottom:16, letterSpacing:'0.05em' }}>THIS MONTH'S USAGE</div>
            {subscription.usage && (
              <div>
                <UsageBar label="Team Members" current={subscription.usage.users.current} limit={subscription.usage.users.limit} />
                <UsageBar label="Invoices Created" current={subscription.usage.invoices.current} limit={subscription.usage.invoices.limit} />
                <UsageBar label="AI API Calls" current={subscription.usage.ai_calls.current} limit={subscription.usage.ai_calls.limit} />
              </div>
            )}
          </div>
        </div>
      )}

      {tab==='plans' && (
        <div>
          {/* Billing toggle */}
          <div style={{ display:'flex', gap:10, marginBottom:24, alignItems:'center' }}>
            <span style={{ fontSize:14, fontWeight:600 }}>Billing:</span>
            {['monthly','yearly'].map(b=>(
              <button key={b} onClick={()=>setBilling(b)} style={{ padding:'7px 18px', borderRadius:8, fontSize:13, fontWeight:600, background:billing===b?'#6C63FF':'var(--surface-2)', color:billing===b?'#fff':'var(--text-secondary)', border:'1px solid var(--border)', cursor:'pointer' }}>
                {b==='yearly'?'Yearly (save 17%)':'Monthly'}
              </button>
            ))}
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
            {plans.map(plan=>{
              const isCurrent = plan.id === currentPlanId;
              const price = billing==='yearly' ? plan.price_yearly : plan.price_monthly;
              const features = typeof plan.features==='string' ? JSON.parse(plan.features) : plan.features;
              return (
                <div key={plan.id} style={{ borderRadius:14, border:`2px solid ${isCurrent?'#6C63FF':'var(--border)'}`, padding:20, background:isCurrent?'#6C63FF06':'var(--surface-2)', position:'relative' }}>
                  {isCurrent && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', padding:'3px 12px', borderRadius:100, background:'#6C63FF', fontSize:11, fontWeight:700, color:'#fff' }}>CURRENT</div>}
                  <div style={{ fontSize:16, fontWeight:800, marginBottom:4 }}>{plan.name}</div>
                  <div style={{ fontSize:28, fontWeight:900, color: plan.price_monthly>0?'#6C63FF':'#22C98A', marginBottom:4 }}>
                    {price===0?'Free':INR(price)}
                  </div>
                  {price>0 && <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>per {billing==='yearly'?'year':'month'}</div>}
                  {price===0 && <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>forever</div>}

                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:4 }}>Users: {plan.max_users===-1?'Unlimited':plan.max_users}</div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:4 }}>Invoices: {plan.max_invoices===-1?'Unlimited':plan.max_invoices+'/mo'}</div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:8 }}>AI Calls: {plan.ai_calls_limit===-1?'Unlimited':plan.ai_calls_limit+'/mo'}</div>
                    {features?.map((f,i)=><div key={i} style={{ fontSize:12, color:'var(--text-secondary)', padding:'2px 0', display:'flex', gap:6 }}><span style={{ color:'#22C98A' }}>✓</span>{f}</div>)}
                  </div>

                  <button onClick={()=>handleUpgrade(plan.id)} disabled={isCurrent||paying===plan.id||plan.price_monthly===0} style={{ width:'100%', padding:'9px', borderRadius:9, fontSize:13, fontWeight:700, background:(isCurrent||plan.price_monthly===0)?'var(--surface-3)':paying===plan.id?'var(--surface-3)':'linear-gradient(135deg,#6C63FF,#9B8FFF)', color:(isCurrent||plan.price_monthly===0||paying===plan.id)?'var(--text-muted)':'#fff', border:'none', cursor:(isCurrent||plan.price_monthly===0)?'not-allowed':'pointer' }}>
                    {isCurrent?'Current Plan':paying===plan.id?'Processing...':plan.price_monthly===0?'Default':'Upgrade'}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop:16, padding:'10px 14px', borderRadius:8, background:'var(--surface-2)', border:'1px solid var(--border)', fontSize:12, color:'var(--text-muted)' }}>
            💳 Payments processed via Razorpay. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend environment variables to enable real payments.
          </div>
        </div>
      )}

      {tab==='invoices' && (
        <div style={{ borderRadius:12, border:'1px solid var(--border)', overflow:'hidden' }}>
          <div style={{ padding:'12px 16px', background:'var(--surface-3)', fontSize:13, fontWeight:700, color:'var(--text-muted)' }}>PAYMENT HISTORY</div>
          {invoices.length===0 ? <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>No payment history yet</div>
          : invoices.map((inv,i)=>(
            <div key={i} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>{inv.description||`${inv.plan_id} plan`}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(inv.created_at).toLocaleDateString('en-IN')} · {inv.razorpay_payment_id||inv.razorpay_order_id}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:14, fontWeight:700 }}>{INR(inv.amount)}</div>
                <span style={{ padding:'2px 8px', borderRadius:100, fontSize:10, fontWeight:700, background:inv.status==='captured'?'#22C98A20':'#F5A62320', color:inv.status==='captured'?'#22C98A':'#F5A623' }}>{inv.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
