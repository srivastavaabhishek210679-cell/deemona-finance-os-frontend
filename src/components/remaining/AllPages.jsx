// ============================================================
// EXPENSES PAGE
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { apiURL } from '../../api.js';

const hdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` });
const get = async url => { const r = await fetch(url,{headers:hdr()}); const t=await r.text(); if(!r.ok) throw new Error(t); if(!t||t.trim()==='') return {}; try{return JSON.parse(t);}catch{return {};} };
const post = async (url,body) => { const r = await fetch(url,{method:'POST',headers:hdr(),body:JSON.stringify(body)}); const t=await r.text(); if(!r.ok) throw new Error(t); if(!t||t.trim()==='') return {}; try{return JSON.parse(t);}catch{return {};} };
const patch = async (url,body={}) => { const r = await fetch(url,{method:'PATCH',headers:hdr(),body:JSON.stringify(body)}); const t=await r.text(); if(!r.ok) throw new Error(t); if(!t||t.trim()==='') return {}; try{return JSON.parse(t);}catch{return {};} };

function INR(n){const v=parseFloat(n||0);if(v>=1e7)return'Rs '+(v/1e7).toFixed(2)+' Cr';if(v>=1e5)return'Rs '+(v/1e5).toFixed(2)+' L';return'Rs '+v.toLocaleString('en-IN');}
function fmtDate(d){if(!d)return'--';return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});}

function SBadge({status}){
  const c={draft:'#3B5998',submitted:'#F5A623',approved:'#22C98A',rejected:'#FF5C5C',paid:'#22C98A',pending:'#F5A623',active:'#22C98A',inactive:'#3B5998',disposed:'#FF5C5C',planning:'#3B5998',on_hold:'#F5A623',completed:'#22C98A',cancelled:'#FF5C5C',new:'#4FC3F7',qualified:'#1B4FD8',won:'#22C98A',lost:'#FF5C5C',overdue:'#FF5C5C'}[status]||'#3B5998';
  return <span style={{padding:'2px 8px',borderRadius:100,fontSize:11,fontWeight:600,background:c+'20',color:c}}>{status?.replace(/_/g,' ').toUpperCase()}</span>;
}

function inp(extra={}){return{width:'100%',boxSizing:'border-box',padding:'8px 10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--surface-3)',color:'var(--text-primary)',fontSize:13,outline:'none',...extra};}

function EmptyState({icon,title,sub,action,onAction}){
  return(
    <div style={{textAlign:'center',padding:60}}>
      <div style={{fontSize:36,marginBottom:12,opacity:0.4}}>{icon}</div>
      <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>{title}</div>
      <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:20}}>{sub}</div>
      {action&&<button onClick={onAction} style={{padding:'8px 20px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>{action}</button>}
    </div>
  );
}

export function ExpensesPage() {
  const [claims,setClaims]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({employee_name:'',department:'',date:new Date().toISOString().split('T')[0],title:'',notes:'',items:[{date:new Date().toISOString().split('T')[0],category:'travel',description:'',amount:''}]});

  const load=useCallback(async()=>{setLoading(true);try{const d=await get(apiURL('/api/expenses/claims'));setClaims(d.claims||[]);}catch{setClaims([]);}finally{setLoading(false);};},[]);
  useEffect(()=>{load();},[load]);

  const addItem=()=>setForm(f=>({...f,items:[...f.items,{date:f.date,category:'travel',description:'',amount:''}]}));
  const updItem=(i,k,v)=>setForm(f=>{const items=[...f.items];items[i]={...items[i],[k]:v};return{...f,items};});
  const total=form.items.reduce((s,i)=>s+parseFloat(i.amount||0),0);

  const save=async()=>{setSaving(true);try{await post(apiURL('/api/expenses/claims'),{...form,total_amount:total});setShowForm(false);await load();}catch(e){alert('Error: '+e.message);}finally{setSaving(false);};};
  const submit=async id=>{try{await patch(apiURL('/api/expenses/claims/'+id+'/submit'));await load();}catch(e){alert('Error: '+e.message);};};
  const approve=async id=>{try{await patch(apiURL('/api/expenses/claims/'+id+'/approve'));await load();}catch(e){alert('Error: '+e.message);};};

  const summary={total:claims.length,pending:claims.filter(c=>c.status==='submitted').length,approved:claims.filter(c=>c.status==='approved').length,totalAmt:claims.reduce((s,c)=>s+parseFloat(c.total_amount||0),0)};

  return(
    <div style={{padding:24}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
        {[{label:'Total Claims',value:summary.total,color:'#1B4FD8'},{label:'Pending Approval',value:summary.pending,color:'#F5A623'},{label:'Approved',value:summary.approved,color:'#22C98A'},{label:'Total Amount',value:INR(summary.totalAmt),color:'#4FC3F7'}].map(c=>(
          <div key={c.label} style={{padding:'18px 20px',borderRadius:12,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
            <div style={{fontSize:24,fontWeight:800,color:c.color,marginBottom:4}}>{c.value}</div>
            <div style={{fontSize:14,fontWeight:600}}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700}}>Expense Claims</div>
        <button onClick={()=>setShowForm(!showForm)} style={{padding:'8px 16px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>+ New Claim</button>
      </div>

      {showForm&&(
        <div style={{padding:20,borderRadius:12,marginBottom:20,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>New Expense Claim</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
            {[{l:'Employee Name',k:'employee_name'},{l:'Department',k:'department'},{l:'Title',k:'title'},{l:'Date',k:'date',t:'date'}].map(f=>(
              <div key={f.k}>
                <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>{f.l}</div>
                <input type={f.t||'text'} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={inp()}/>
              </div>
            ))}
          </div>
          <div style={{fontSize:14,fontWeight:700,marginBottom:8}}>Expense Items</div>
          {form.items.map((item,i)=>(
            <div key={i} style={{display:'grid',gridTemplateColumns:'120px 1fr 1fr 100px',gap:8,marginBottom:6}}>
              <select value={item.category} onChange={e=>updItem(i,'category',e.target.value)} style={inp()}>
                {['travel','food','accommodation','fuel','office','entertainment','other'].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Description" value={item.description} onChange={e=>updItem(i,'description',e.target.value)} style={inp()}/>
              <input type="date" value={item.date} onChange={e=>updItem(i,'date',e.target.value)} style={inp()}/>
              <input type="number" placeholder="Amount" value={item.amount} onChange={e=>updItem(i,'amount',e.target.value)} style={inp({textAlign:'right'})}/>
            </div>
          ))}
          <button onClick={addItem} style={{padding:'5px 12px',borderRadius:6,fontSize:12,background:'var(--surface-3)',border:'1px solid var(--border)',color:'var(--text-secondary)',cursor:'pointer',marginBottom:12}}>+ Add Item</button>
          <div style={{textAlign:'right',fontSize:14,fontWeight:700,color:'#22C98A',marginBottom:12}}>Total: {INR(total)}</div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={save} disabled={saving} style={{padding:'8px 20px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>{saving?'Saving...':'Save Claim'}</button>
            <button onClick={()=>setShowForm(false)} style={{padding:'8px 16px',borderRadius:8,background:'var(--surface-3)',border:'1px solid var(--border)',color:'var(--text-secondary)',cursor:'pointer',fontSize:14}}>Cancel</button>
          </div>
        </div>
      )}

      {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</div>:claims.length===0?
        <EmptyState icon="🧾" title="No expense claims yet" sub="Submit expense claims for approval and reimbursement" action="+ New Claim" onAction={()=>setShowForm(true)}/>:(
        <div style={{borderRadius:12,border:'1px solid var(--border)',overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'120px 1fr 100px 100px 120px 100px 100px',padding:'10px 16px',background:'var(--surface-3)',fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.05em'}}>
            <span>CLAIM #</span><span>TITLE</span><span>EMPLOYEE</span><span>DATE</span><span style={{textAlign:'right'}}>AMOUNT</span><span>STATUS</span><span>ACTIONS</span>
          </div>
          {claims.map((c,i)=>(
            <div key={c.id} style={{display:'grid',gridTemplateColumns:'120px 1fr 100px 100px 120px 100px 100px',padding:'12px 16px',fontSize:13,alignItems:'center',background:i%2===0?'var(--surface-2)':'var(--surface-1)',borderTop:'1px solid var(--border)'}}>
              <span style={{fontWeight:700,color:'var(--accent)',fontSize:12}}>{c.claim_number}</span>
              <span style={{fontWeight:500}}>{c.title}</span>
              <span style={{fontSize:12,color:'var(--text-muted)'}}>{c.employee_name}</span>
              <span style={{fontSize:12,color:'var(--text-muted)'}}>{fmtDate(c.date)}</span>
              <span style={{textAlign:'right',fontWeight:700,color:'#22C98A'}}>{INR(c.total_amount)}</span>
              <SBadge status={c.status}/>
              <div style={{display:'flex',gap:6}}>
                {c.status==='draft'&&<button onClick={()=>submit(c.id)} style={{padding:'3px 8px',borderRadius:5,fontSize:11,background:'#F5A62320',border:'1px solid #F5A62340',color:'#F5A623',cursor:'pointer'}}>Submit</button>}
                {c.status==='submitted'&&<button onClick={()=>approve(c.id)} style={{padding:'3px 8px',borderRadius:5,fontSize:11,background:'#22C98A20',border:'1px solid #22C98A40',color:'#22C98A',cursor:'pointer'}}>Approve</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ASSETS PAGE
// ============================================================
export function AssetsPage() {
  const [assets,setAssets]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({asset_code:'',name:'',category:'equipment',purchase_date:'',purchase_price:'',location:'',useful_life_years:5,depreciation_method:'straight_line',depreciation_rate:20,salvage_value:0,notes:''});

  const load=useCallback(async()=>{setLoading(true);try{const d=await get(apiURL('/api/assets'));setAssets(d.assets||[]);}catch{setAssets([]);}finally{setLoading(false);};},[]);
  useEffect(()=>{load();},[load]);

  const save=async()=>{setSaving(true);try{await post(apiURL('/api/assets'),form);setShowForm(false);await load();}catch(e){alert('Error: '+e.message);}finally{setSaving(false);};};

  const calcDepreciation=(asset)=>{
    if(!asset.purchase_date||!asset.purchase_price) return 0;
    const years=(Date.now()-new Date(asset.purchase_date).getTime())/(1000*60*60*24*365);
    const annual=parseFloat(asset.purchase_price)*parseFloat(asset.depreciation_rate||20)/100;
    return Math.min(parseFloat(asset.purchase_price)-parseFloat(asset.salvage_value||0), annual*years);
  };

  const totalValue=assets.reduce((s,a)=>s+parseFloat(a.current_value||a.purchase_price||0),0);
  const categories=['equipment','vehicle','furniture','building','computer','other'];

  return(
    <div style={{padding:24}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
        {[
          {label:'Total Assets',value:assets.length,color:'#1B4FD8'},
          {label:'Active',value:assets.filter(a=>a.status==='active').length,color:'#22C98A'},
          {label:'Book Value',value:INR(totalValue),color:'#4FC3F7'},
          {label:'Disposed',value:assets.filter(a=>a.status==='disposed').length,color:'#FF5C5C'},
        ].map(c=><div key={c.label} style={{padding:'18px 20px',borderRadius:12,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
          <div style={{fontSize:24,fontWeight:800,color:c.color,marginBottom:4}}>{c.value}</div>
          <div style={{fontSize:14,fontWeight:600}}>{c.label}</div>
        </div>)}
      </div>

      <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700}}>Fixed Assets Register</div>
        <button onClick={()=>setShowForm(!showForm)} style={{padding:'8px 16px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>+ Add Asset</button>
      </div>

      {showForm&&(
        <div style={{padding:20,borderRadius:12,marginBottom:20,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>New Fixed Asset</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
            {[{l:'Asset Code',k:'asset_code'},{l:'Asset Name',k:'name'},{l:'Location',k:'location'},{l:'Purchase Date',k:'purchase_date',t:'date'},{l:'Purchase Price (Rs)',k:'purchase_price',t:'number'},{l:'Salvage Value (Rs)',k:'salvage_value',t:'number'},{l:'Useful Life (Years)',k:'useful_life_years',t:'number'},{l:'Depreciation Rate (%)',k:'depreciation_rate',t:'number'}].map(f=>(
              <div key={f.k}>
                <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>{f.l}</div>
                <input type={f.t||'text'} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={inp()}/>
              </div>
            ))}
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Category</div>
              <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={inp()}>
                {categories.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Depreciation Method</div>
              <select value={form.depreciation_method} onChange={e=>setForm(p=>({...p,depreciation_method:e.target.value}))} style={inp()}>
                <option value="straight_line">Straight Line (SLM)</option>
                <option value="wdv">Written Down Value (WDV)</option>
              </select>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={save} disabled={saving} style={{padding:'8px 20px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>{saving?'Saving...':'Add Asset'}</button>
            <button onClick={()=>setShowForm(false)} style={{padding:'8px 16px',borderRadius:8,background:'var(--surface-3)',border:'1px solid var(--border)',color:'var(--text-secondary)',cursor:'pointer',fontSize:14}}>Cancel</button>
          </div>
        </div>
      )}

      {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</div>:assets.length===0?
        <EmptyState icon="🏭" title="No assets registered" sub="Track all fixed assets, depreciation, and disposal" action="+ Add Asset" onAction={()=>setShowForm(true)}/>:(
        <div style={{borderRadius:12,border:'1px solid var(--border)',overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'80px 1fr 100px 100px 120px 120px 100px 80px',padding:'10px 16px',background:'var(--surface-3)',fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.05em'}}>
            <span>CODE</span><span>NAME</span><span>CATEGORY</span><span>PURCHASE DATE</span><span style={{textAlign:'right'}}>COST</span><span style={{textAlign:'right'}}>DEPRECIATION</span><span style={{textAlign:'right'}}>BOOK VALUE</span><span>STATUS</span>
          </div>
          {assets.map((a,i)=>{
            const dep=calcDepreciation(a);
            const bookVal=parseFloat(a.purchase_price||0)-dep;
            return(
              <div key={a.id} style={{display:'grid',gridTemplateColumns:'80px 1fr 100px 100px 120px 120px 100px 80px',padding:'12px 16px',fontSize:13,alignItems:'center',background:i%2===0?'var(--surface-2)':'var(--surface-1)',borderTop:'1px solid var(--border)'}}>
                <span style={{fontWeight:700,color:'var(--text-muted)',fontSize:12}}>{a.asset_code}</span>
                <div><div style={{fontWeight:500}}>{a.name}</div>{a.location&&<div style={{fontSize:11,color:'var(--text-muted)'}}>{a.location}</div>}</div>
                <span style={{fontSize:12,color:'var(--text-muted)'}}>{a.category}</span>
                <span style={{fontSize:12,color:'var(--text-muted)'}}>{fmtDate(a.purchase_date)}</span>
                <span style={{textAlign:'right',fontWeight:600}}>{INR(a.purchase_price)}</span>
                <span style={{textAlign:'right',color:'#FF5C5C'}}>{INR(dep)}</span>
                <span style={{textAlign:'right',fontWeight:700,color:'#22C98A'}}>{INR(Math.max(0,bookVal))}</span>
                <SBadge status={a.status}/>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// INVENTORY PAGE
// ============================================================
export function InventoryPage() {
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({sku:'',name:'',category:'',unit:'pcs',current_stock:0,reorder_level:0,reorder_qty:0,unit_cost:'',selling_price:'',location:'',hsn_code:'',notes:''});

  const load=useCallback(async()=>{setLoading(true);try{const d=await get(apiURL('/api/inventory'));setItems(d.items||[]);}catch{setItems([]);}finally{setLoading(false);};},[]);
  useEffect(()=>{load();},[load]);

  const save=async()=>{setSaving(true);try{await post(apiURL('/api/inventory'),form);setShowForm(false);await load();}catch(e){alert('Error: '+e.message);}finally{setSaving(false);};};

  const addMovement=async(itemId,type)=>{
    const qty=prompt(`Enter quantity for ${type}:`);
    if(!qty||isNaN(qty)) return;
    try{await post(apiURL('/api/inventory/'+itemId+'/movement'),{type,quantity:parseFloat(qty),date:new Date().toISOString().split('T')[0]});await load();}
    catch(e){alert('Error: '+e.message);}
  };

  const lowStock=items.filter(i=>parseFloat(i.current_stock)<=parseFloat(i.reorder_level));
  const totalValue=items.reduce((s,i)=>s+parseFloat(i.current_stock||0)*parseFloat(i.unit_cost||0),0);

  return(
    <div style={{padding:24}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
        {[{label:'Total SKUs',value:items.length,color:'#1B4FD8'},{label:'Low Stock',value:lowStock.length,color:'#FF5C5C'},{label:'Inventory Value',value:INR(totalValue),color:'#22C98A'},{label:'Active Items',value:items.filter(i=>i.is_active).length,color:'#4FC3F7'}].map(c=>(
          <div key={c.label} style={{padding:'18px 20px',borderRadius:12,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
            <div style={{fontSize:24,fontWeight:800,color:c.color,marginBottom:4}}>{c.value}</div>
            <div style={{fontSize:14,fontWeight:600}}>{c.label}</div>
          </div>
        ))}
      </div>

      {lowStock.length>0&&(
        <div style={{padding:14,borderRadius:10,marginBottom:16,background:'#FF5C5C10',border:'1px solid #FF5C5C30'}}>
          <div style={{fontSize:13,fontWeight:700,color:'#FF5C5C',marginBottom:4}}>Low Stock Alert</div>
          <div style={{fontSize:12,color:'var(--text-secondary)'}}>{lowStock.map(i=>i.name+' ('+i.current_stock+' '+i.unit+')').join(' • ')}</div>
        </div>
      )}

      <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700}}>Inventory Items</div>
        <button onClick={()=>setShowForm(!showForm)} style={{padding:'8px 16px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>+ Add Item</button>
      </div>

      {showForm&&(
        <div style={{padding:20,borderRadius:12,marginBottom:20,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>New Inventory Item</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
            {[{l:'SKU',k:'sku'},{l:'Item Name',k:'name'},{l:'Category',k:'category'},{l:'Unit',k:'unit'},{l:'Opening Stock',k:'current_stock',t:'number'},{l:'Reorder Level',k:'reorder_level',t:'number'},{l:'Reorder Qty',k:'reorder_qty',t:'number'},{l:'Unit Cost (Rs)',k:'unit_cost',t:'number'},{l:'Selling Price (Rs)',k:'selling_price',t:'number'},{l:'Location',k:'location'},{l:'HSN Code',k:'hsn_code'}].map(f=>(
              <div key={f.k}>
                <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>{f.l}</div>
                <input type={f.t||'text'} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={inp()}/>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={save} disabled={saving} style={{padding:'8px 20px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>{saving?'Saving...':'Add Item'}</button>
            <button onClick={()=>setShowForm(false)} style={{padding:'8px 16px',borderRadius:8,background:'var(--surface-3)',border:'1px solid var(--border)',color:'var(--text-secondary)',cursor:'pointer',fontSize:14}}>Cancel</button>
          </div>
        </div>
      )}

      {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</div>:items.length===0?
        <EmptyState icon="📦" title="No inventory items" sub="Track stock levels, reorder points, and movements" action="+ Add Item" onAction={()=>setShowForm(true)}/>:(
        <div style={{borderRadius:12,border:'1px solid var(--border)',overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'80px 1fr 80px 80px 80px 100px 100px 130px',padding:'10px 16px',background:'var(--surface-3)',fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.05em'}}>
            <span>SKU</span><span>NAME</span><span>UNIT</span><span>STOCK</span><span>REORDER</span><span style={{textAlign:'right'}}>COST</span><span style={{textAlign:'right'}}>VALUE</span><span>ACTIONS</span>
          </div>
          {items.map((item,i)=>{
            const isLow=parseFloat(item.current_stock)<=parseFloat(item.reorder_level);
            return(
              <div key={item.id} style={{display:'grid',gridTemplateColumns:'80px 1fr 80px 80px 80px 100px 100px 130px',padding:'12px 16px',fontSize:13,alignItems:'center',background:isLow?'#FF5C5C06':i%2===0?'var(--surface-2)':'var(--surface-1)',borderTop:'1px solid var(--border)'}}>
                <span style={{fontWeight:700,color:'var(--text-muted)',fontSize:12}}>{item.sku}</span>
                <div><div style={{fontWeight:500}}>{item.name}</div>{item.category&&<div style={{fontSize:11,color:'var(--text-muted)'}}>{item.category}</div>}</div>
                <span style={{fontSize:12,color:'var(--text-muted)'}}>{item.unit}</span>
                <span style={{fontWeight:700,color:isLow?'#FF5C5C':'#22C98A'}}>{item.current_stock}</span>
                <span style={{fontSize:12,color:'var(--text-muted)'}}>{item.reorder_level}</span>
                <span style={{textAlign:'right'}}>{INR(item.unit_cost)}</span>
                <span style={{textAlign:'right',fontWeight:700,color:'#4FC3F7'}}>{INR(parseFloat(item.current_stock)*parseFloat(item.unit_cost||0))}</span>
                <div style={{display:'flex',gap:5}}>
                  <button onClick={()=>addMovement(item.id,'purchase')} style={{padding:'3px 7px',borderRadius:5,fontSize:11,background:'#22C98A20',border:'1px solid #22C98A40',color:'#22C98A',cursor:'pointer'}}>+In</button>
                  <button onClick={()=>addMovement(item.id,'sale')} style={{padding:'3px 7px',borderRadius:5,fontSize:11,background:'#FF5C5C20',border:'1px solid #FF5C5C40',color:'#FF5C5C',cursor:'pointer'}}>-Out</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PROJECTS PAGE
// ============================================================
export function ProjectsPage() {
  const [projects,setProjects]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({project_code:'',name:'',client_name:'',status:'planning',priority:'normal',start_date:'',end_date:'',budget:'',description:''});

  const load=useCallback(async()=>{setLoading(true);try{const d=await get(apiURL('/api/projects'));setProjects(d.projects||[]);}catch{setProjects([]);}finally{setLoading(false);};},[]);
  useEffect(()=>{load();},[load]);

  const save=async()=>{setSaving(true);try{await post(apiURL('/api/projects'),form);setShowForm(false);await load();}catch(e){alert('Error: '+e.message);}finally{setSaving(false);};};

  const prColor={planning:'#3B5998',active:'#22C98A',on_hold:'#F5A623',completed:'#1B4FD8',cancelled:'#FF5C5C'};
  const priColor={low:'#3B5998',normal:'#1B4FD8',high:'#F5A623',urgent:'#FF5C5C'};
  const totalBudget=projects.reduce((s,p)=>s+parseFloat(p.budget||0),0);
  const totalSpent=projects.reduce((s,p)=>s+parseFloat(p.spent||0),0);

  return(
    <div style={{padding:24}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
        {[{label:'Total Projects',value:projects.length,color:'#1B4FD8'},{label:'Active',value:projects.filter(p=>p.status==='active').length,color:'#22C98A'},{label:'Total Budget',value:INR(totalBudget),color:'#4FC3F7'},{label:'Total Spent',value:INR(totalSpent),color:'#F5A623'}].map(c=>(
          <div key={c.label} style={{padding:'18px 20px',borderRadius:12,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
            <div style={{fontSize:24,fontWeight:800,color:c.color,marginBottom:4}}>{c.value}</div>
            <div style={{fontSize:14,fontWeight:600}}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700}}>Projects</div>
        <button onClick={()=>setShowForm(!showForm)} style={{padding:'8px 16px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>+ New Project</button>
      </div>

      {showForm&&(
        <div style={{padding:20,borderRadius:12,marginBottom:20,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>New Project</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
            {[{l:'Project Code',k:'project_code'},{l:'Project Name',k:'name'},{l:'Client Name',k:'client_name'},{l:'Start Date',k:'start_date',t:'date'},{l:'End Date',k:'end_date',t:'date'},{l:'Budget (Rs)',k:'budget',t:'number'}].map(f=>(
              <div key={f.k}>
                <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>{f.l}</div>
                <input type={f.t||'text'} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={inp()}/>
              </div>
            ))}
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Status</div>
              <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={inp()}>
                {Object.keys(prColor).map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Priority</div>
              <select value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))} style={inp()}>
                {['low','normal','high','urgent'].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{gridColumn:'span 3'}}>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Description</div>
              <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={inp()} placeholder="Project description..."/>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={save} disabled={saving} style={{padding:'8px 20px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>{saving?'Saving...':'Create Project'}</button>
            <button onClick={()=>setShowForm(false)} style={{padding:'8px 16px',borderRadius:8,background:'var(--surface-3)',border:'1px solid var(--border)',color:'var(--text-secondary)',cursor:'pointer',fontSize:14}}>Cancel</button>
          </div>
        </div>
      )}

      {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</div>:projects.length===0?
        <EmptyState icon="📋" title="No projects yet" sub="Track project budgets, timelines, and costs" action="+ New Project" onAction={()=>setShowForm(true)}/>:(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {projects.map(p=>{
            const burnPct=p.budget>0?Math.round(parseFloat(p.spent||0)/parseFloat(p.budget)*100):0;
            const overBudget=burnPct>100;
            return(
              <div key={p.id} style={{padding:'16px 20px',borderRadius:12,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:10}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                      <span style={{fontSize:15,fontWeight:700}}>{p.name}</span>
                      <span style={{fontSize:11,color:'var(--text-muted)',padding:'1px 6px',borderRadius:4,background:'var(--surface-3)'}}>{p.project_code}</span>
                      <span style={{padding:'2px 8px',borderRadius:100,fontSize:11,fontWeight:600,background:(prColor[p.status]||'#888')+'20',color:prColor[p.status]||'#888'}}>{p.status?.replace('_',' ').toUpperCase()}</span>
                      <span style={{padding:'2px 8px',borderRadius:100,fontSize:11,fontWeight:600,background:(priColor[p.priority]||'#888')+'20',color:priColor[p.priority]||'#888'}}>{p.priority?.toUpperCase()}</span>
                    </div>
                    {p.client_name&&<div style={{fontSize:13,color:'var(--text-muted)'}}>Client: {p.client_name}</div>}
                    {p.description&&<div style={{fontSize:12,color:'var(--text-secondary)',marginTop:4}}>{p.description}</div>}
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:11,color:'var(--text-muted)'}}>Budget</div>
                    <div style={{fontSize:18,fontWeight:800,color:'#4FC3F7'}}>{INR(p.budget)}</div>
                    <div style={{fontSize:12,color:overBudget?'#FF5C5C':'var(--text-muted)'}}>Spent: {INR(p.spent||0)} ({burnPct}%)</div>
                  </div>
                </div>
                <div style={{height:6,background:'var(--surface-3)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{width:Math.min(100,burnPct)+'%',height:'100%',background:overBudget?'#FF5C5C':'#22C98A',borderRadius:3,transition:'width 0.5s'}}/>
                </div>
                <div style={{display:'flex',gap:20,marginTop:8,fontSize:12,color:'var(--text-muted)'}}>
                  {p.start_date&&<span>Start: {fmtDate(p.start_date)}</span>}
                  {p.end_date&&<span>End: {fmtDate(p.end_date)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPLIANCE PAGE
// ============================================================
export function CompliancePage() {
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({category:'tax',title:'',description:'',frequency:'annual',due_date:'',penalty_if_missed:0,notes:''});

  const load=useCallback(async()=>{setLoading(true);try{const d=await get(apiURL('/api/compliance'));setItems(d.items||[]);}catch{setItems([]);}finally{setLoading(false);};},[]);
  useEffect(()=>{load();},[load]);

  const save=async()=>{setSaving(true);try{await post(apiURL('/api/compliance'),form);setShowForm(false);await load();}catch(e){alert('Error: '+e.message);}finally{setSaving(false);};};
  const complete=async id=>{try{await patch(apiURL('/api/compliance/'+id+'/complete'),{completed_date:new Date().toISOString().split('T')[0]});await load();}catch(e){alert('Error: '+e.message);}};

  const now=new Date();
  const overdue=items.filter(i=>i.status==='pending'&&new Date(i.due_date)<now);
  const upcoming=items.filter(i=>i.status==='pending'&&new Date(i.due_date)>=now&&new Date(i.due_date)<=new Date(now.getTime()+30*24*60*60*1000));
  const catColor={tax:'#F5A623',labour:'#22C98A',statutory:'#1B4FD8',environmental:'#4FC3F7',roc:'#3B82F6',other:'#3B5998'};

  return(
    <div style={{padding:24}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
        {[{label:'Total Items',value:items.length,color:'#1B4FD8'},{label:'Overdue',value:overdue.length,color:'#FF5C5C'},{label:'Due in 30 Days',value:upcoming.length,color:'#F5A623'},{label:'Completed',value:items.filter(i=>i.status==='completed').length,color:'#22C98A'}].map(c=>(
          <div key={c.label} style={{padding:'18px 20px',borderRadius:12,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
            <div style={{fontSize:24,fontWeight:800,color:c.color,marginBottom:4}}>{c.value}</div>
            <div style={{fontSize:14,fontWeight:600}}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700}}>Compliance Calendar</div>
        <button onClick={()=>setShowForm(!showForm)} style={{padding:'8px 16px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>+ Add Item</button>
      </div>

      {showForm&&(
        <div style={{padding:20,borderRadius:12,marginBottom:20,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>New Compliance Item</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Category</div>
              <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={inp()}>
                {Object.keys(catColor).map(c=><option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>
            <div style={{gridColumn:'span 2'}}>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Title</div>
              <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. GST Monthly Return GSTR-3B" style={inp()}/>
            </div>
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Frequency</div>
              <select value={form.frequency} onChange={e=>setForm(p=>({...p,frequency:e.target.value}))} style={inp()}>
                {['monthly','quarterly','annual','one_time'].map(f=><option key={f} value={f}>{f.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Due Date</div>
              <input type="date" value={form.due_date} onChange={e=>setForm(p=>({...p,due_date:e.target.value}))} style={inp()}/>
            </div>
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Penalty if Missed (Rs)</div>
              <input type="number" value={form.penalty_if_missed} onChange={e=>setForm(p=>({...p,penalty_if_missed:e.target.value}))} style={inp()}/>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={save} disabled={saving} style={{padding:'8px 20px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>{saving?'Saving...':'Add Item'}</button>
            <button onClick={()=>setShowForm(false)} style={{padding:'8px 16px',borderRadius:8,background:'var(--surface-3)',border:'1px solid var(--border)',color:'var(--text-secondary)',cursor:'pointer',fontSize:14}}>Cancel</button>
          </div>
        </div>
      )}

      {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</div>:items.length===0?
        <EmptyState icon="✅" title="No compliance items" sub="Track all statutory and regulatory deadlines" action="+ Add Item" onAction={()=>setShowForm(true)}/>:(
        <div style={{borderRadius:12,border:'1px solid var(--border)',overflow:'hidden'}}>
          <div style={{display:'grid',gridTemplateColumns:'100px 1fr 100px 80px 120px 120px 100px',padding:'10px 16px',background:'var(--surface-3)',fontSize:11,fontWeight:700,color:'var(--text-muted)',letterSpacing:'0.05em'}}>
            <span>CATEGORY</span><span>TITLE</span><span>FREQUENCY</span><span>STATUS</span><span>DUE DATE</span><span style={{textAlign:'right'}}>PENALTY</span><span>ACTIONS</span>
          </div>
          {items.map((item,i)=>{
            const isOver=item.status==='pending'&&new Date(item.due_date)<now;
            const isDue=item.status==='pending'&&new Date(item.due_date)>=now&&new Date(item.due_date)<=new Date(now.getTime()+30*24*60*60*1000);
            return(
              <div key={item.id} style={{display:'grid',gridTemplateColumns:'100px 1fr 100px 80px 120px 120px 100px',padding:'12px 16px',fontSize:13,alignItems:'center',background:isOver?'#FF5C5C08':isDue?'#F5A62308':i%2===0?'var(--surface-2)':'var(--surface-1)',borderTop:'1px solid var(--border)'}}>
                <span style={{padding:'2px 8px',borderRadius:100,fontSize:11,fontWeight:600,background:(catColor[item.category]||'#888')+'20',color:catColor[item.category]||'#888'}}>{item.category?.toUpperCase()}</span>
                <span style={{fontWeight:500}}>{item.title}</span>
                <span style={{fontSize:12,color:'var(--text-muted)'}}>{item.frequency}</span>
                <SBadge status={isOver?'overdue':item.status}/>
                <span style={{fontSize:12,color:isOver?'#FF5C5C':isDue?'#F5A623':'var(--text-muted)'}}>{fmtDate(item.due_date)}</span>
                <span style={{textAlign:'right',fontSize:12,color:item.penalty_if_missed>0?'#FF5C5C':'var(--text-muted)'}}>{item.penalty_if_missed>0?INR(item.penalty_if_missed):'--'}</span>
                {item.status==='pending'&&<button onClick={()=>complete(item.id)} style={{padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:600,background:'#22C98A20',border:'1px solid #22C98A40',color:'#22C98A',cursor:'pointer'}}>Mark Done</button>}
                {item.status==='completed'&&<span style={{fontSize:11,color:'var(--text-muted)'}}>Done {fmtDate(item.completed_date)}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// CRM PAGE
// ============================================================
export function CRMPage() {
  const [leads,setLeads]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [saving,setSaving]=useState(false);
  const [filter,setFilter]=useState('all');
  const [form,setForm]=useState({name:'',company:'',email:'',phone:'',source:'referral',stage:'new',value:'',probability:20,expected_close:'',notes:''});

  const load=useCallback(async()=>{setLoading(true);try{const d=await get(apiURL('/api/crm/leads'));setLeads(d.leads||[]);}catch{setLeads([]);}finally{setLoading(false);};},[]);
  useEffect(()=>{load();},[load]);

  const save=async()=>{setSaving(true);try{await post(apiURL('/api/crm/leads'),form);setShowForm(false);await load();}catch(e){alert('Error: '+e.message);}finally{setSaving(false);};};
  const moveStage=async(id,stage)=>{try{await patch(apiURL('/api/crm/leads/'+id),{stage});await load();}catch(e){alert('Error: '+e.message);}};

  const STAGES=['new','contacted','qualified','proposal','negotiation','won','lost'];
  const stageColor={new:'#4FC3F7',contacted:'#1B4FD8',qualified:'#3B82F6',proposal:'#F5A623',negotiation:'#F5A623',won:'#22C98A',lost:'#FF5C5C'};
  const sourceColor={website:'#1B4FD8',referral:'#22C98A',cold_call:'#F5A623',exhibition:'#4FC3F7',social:'#3B82F6',other:'#3B5998'};

  const filtered=filter==='all'?leads:leads.filter(l=>l.stage===filter);
  const pipeline=leads.filter(l=>!['won','lost'].includes(l.stage)).reduce((s,l)=>s+parseFloat(l.value||0)*parseFloat(l.probability||0)/100,0);
  const won=leads.filter(l=>l.stage==='won').reduce((s,l)=>s+parseFloat(l.value||0),0);

  return(
    <div style={{padding:24}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:24}}>
        {[{label:'Total Leads',value:leads.length,color:'#1B4FD8'},{label:'Pipeline Value',value:INR(pipeline),color:'#4FC3F7'},{label:'Won Revenue',value:INR(won),color:'#22C98A'},{label:'Active',value:leads.filter(l=>!['won','lost'].includes(l.stage)).length,color:'#F5A623'}].map(c=>(
          <div key={c.label} style={{padding:'18px 20px',borderRadius:12,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
            <div style={{fontSize:24,fontWeight:800,color:c.color,marginBottom:4}}>{c.value}</div>
            <div style={{fontSize:14,fontWeight:600}}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        {['all',...STAGES].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{padding:'5px 14px',borderRadius:100,fontSize:12,fontWeight:600,background:filter===s?(stageColor[s]||'#1B4FD8')+'20':'var(--surface-3)',color:filter===s?(stageColor[s]||'#1B4FD8'):'var(--text-secondary)',border:'1px solid '+(filter===s?(stageColor[s]||'#1B4FD8')+'40':'var(--border)'),cursor:'pointer'}}>
            {s==='all'?'All':s}
          </button>
        ))}
        <button onClick={()=>setShowForm(!showForm)} style={{marginLeft:'auto',padding:'8px 16px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>+ New Lead</button>
      </div>

      {showForm&&(
        <div style={{padding:20,borderRadius:12,marginBottom:20,background:'var(--surface-2)',border:'1px solid var(--border)'}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>New Lead</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:14}}>
            {[{l:'Contact Name',k:'name'},{l:'Company',k:'company'},{l:'Email',k:'email'},{l:'Phone',k:'phone'},{l:'Deal Value (Rs)',k:'value',t:'number'},{l:'Probability (%)',k:'probability',t:'number'},{l:'Expected Close',k:'expected_close',t:'date'}].map(f=>(
              <div key={f.k}>
                <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>{f.l}</div>
                <input type={f.t||'text'} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={inp()}/>
              </div>
            ))}
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Source</div>
              <select value={form.source} onChange={e=>setForm(p=>({...p,source:e.target.value}))} style={inp()}>
                {Object.keys(sourceColor).map(s=><option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Stage</div>
              <select value={form.stage} onChange={e=>setForm(p=>({...p,stage:e.target.value}))} style={inp()}>
                {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>Notes</div>
              <input value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={inp()} placeholder="Notes..."/>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={save} disabled={saving} style={{padding:'8px 20px',borderRadius:8,background:'var(--accent)',color:'#fff',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>{saving?'Saving...':'Add Lead'}</button>
            <button onClick={()=>setShowForm(false)} style={{padding:'8px 16px',borderRadius:8,background:'var(--surface-3)',border:'1px solid var(--border)',color:'var(--text-secondary)',cursor:'pointer',fontSize:14}}>Cancel</button>
          </div>
        </div>
      )}

      {loading?<div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Loading...</div>:filtered.length===0?
        <EmptyState icon="🎯" title="No leads yet" sub="Track your sales pipeline and win rates" action="+ New Lead" onAction={()=>setShowForm(true)}/>:(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {filtered.map((lead,i)=>(
            <div key={lead.id} style={{padding:'14px 18px',borderRadius:10,background:'var(--surface-2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',gap:16}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
                  <span style={{fontSize:14,fontWeight:700}}>{lead.name}</span>
                  {lead.company&&<span style={{fontSize:12,color:'var(--text-muted)'}}>@ {lead.company}</span>}
                  <span style={{padding:'2px 8px',borderRadius:100,fontSize:11,fontWeight:600,background:(stageColor[lead.stage]||'#888')+'20',color:stageColor[lead.stage]||'#888'}}>{lead.stage.toUpperCase()}</span>
                  {lead.source&&<span style={{padding:'2px 8px',borderRadius:100,fontSize:10,fontWeight:600,background:(sourceColor[lead.source]||'#888')+'15',color:sourceColor[lead.source]||'#888'}}>{lead.source.replace('_',' ')}</span>}
                </div>
                <div style={{fontSize:12,color:'var(--text-muted)',display:'flex',gap:16}}>
                  {lead.email&&<span>{lead.email}</span>}
                  {lead.phone&&<span>{lead.phone}</span>}
                  {lead.expected_close&&<span>Close: {fmtDate(lead.expected_close)}</span>}
                </div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:18,fontWeight:800,color:'#22C98A'}}>{INR(lead.value)}</div>
                <div style={{fontSize:12,color:'var(--text-muted)'}}>{lead.probability}% probability</div>
                <div style={{fontSize:12,fontWeight:600,color:'#1B4FD8'}}>{INR(parseFloat(lead.value||0)*parseFloat(lead.probability||0)/100)} weighted</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:5,flexShrink:0}}>
                {lead.stage!=='won'&&lead.stage!=='lost'&&(
                  <>
                    <button onClick={()=>moveStage(lead.id,'won')} style={{padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:600,background:'#22C98A20',border:'1px solid #22C98A40',color:'#22C98A',cursor:'pointer'}}>Won</button>
                    <button onClick={()=>moveStage(lead.id,'lost')} style={{padding:'4px 10px',borderRadius:6,fontSize:11,fontWeight:600,background:'#FF5C5C20',border:'1px solid #FF5C5C40',color:'#FF5C5C',cursor:'pointer'}}>Lost</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}






