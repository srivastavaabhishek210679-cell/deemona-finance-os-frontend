// Frontend: (1) stop calling 6 endpoints the dashboard never uses, (2) show "36+ months" for capped runway. Idempotent.
const fs=require('fs');
function rw(p,fn){let s=fs.readFileSync(p,'utf8');const crlf=s.includes('\r\n');if(crlf)s=s.replace(/\r\n/g,'\n');const t=fn(s);if(t===s){console.log('no change',p);return;}fs.writeFileSync(p,crlf?t.replace(/\n/g,'\r\n'):t);console.log('patched',p);}
function must(s,a){if(s.split(a).length!==2){console.log('ANCHOR NOT FOUND:',a.slice(0,70));process.exit(1);}}
rw('src/components/dashboards/EnterpriseFinanceDashboard.jsx',s=>{
  if(s.includes('/*no-dead-calls*/'))return s;
  const a=`    const [gl, ar, ap, budget, assets, inventory, payroll, compliance, expenses, procurement] = await Promise.all([
      get('/api/accounting/gl-summary'),
      get('/api/accounting/ar-summary'),
      get('/api/accounting/ap-summary'),
      get('/api/budgeting/summary'),
      get('/api/assets/summary'),
      get('/api/inventory/summary'),
      get('/api/payroll/summary'),
      get('/api/compliance/summary'),
      get('/api/expenses/summary'),
      get('/api/procurement/summary'),
    ]);`;
  must(s,a);
  const b=`    /*no-dead-calls*/
    const [gl, payroll, expenses, procurement] = await Promise.all([
      get('/api/accounting/gl-summary'),
      get('/api/payroll/summary'),
      get('/api/expenses/summary'),
      get('/api/procurement/summary'),
    ]);
    const ar = {}, ap = {}, budget = {}, assets = {}, inventory = {}, compliance = {};`;
  return s.replace(a,()=>b);
});
rw('src/components/cfoagent/CFOAgentPage.jsx',s=>{
  const a="sub: dashboard.runway_months + ' months runway' }";
  if(!s.includes(a))return s;
  return s.replace(a,()=>"sub: (dashboard.runway_months >= 36 ? '36+' : dashboard.runway_months) + ' months runway' }");
});
