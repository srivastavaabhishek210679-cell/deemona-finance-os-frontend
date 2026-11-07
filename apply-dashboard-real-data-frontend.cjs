// Executive Dashboard: replace every hard-coded/demo figure with real data. Idempotent. Run from the frontend folder.
// Needs the cash forecast patch and dashboard banner patch applied first.
const fs=require('fs');const f='src/components/dashboard/DashboardPage.jsx';
if(!fs.existsSync(f)){console.error('Run from the frontend folder');process.exit(1);}
const raw=fs.readFileSync(f,'utf8');const crlf=raw.includes('\r\n');let s=raw.replace(/\r\n/g,'\n');
if(s.includes('/*real-data*/')){console.log('Already applied');process.exit(0);}
function rep(a,b,label){ if(!s.includes(a)){console.error('Pattern not found: '+(label||a.slice(0,70)));process.exit(1);} s=s.replace(a,()=>b); }

// ---- 1. data loading ----
rep(`    const tid = 'af1845e2-39f3-4e9d-b1ed-91c2798a0f6f';
    Promise.all([
      get('/api/treasury/dashboard'),
      get('/api/accounting/ar'),
      get('/api/accounting/ap'),
      get('/api/payroll/employees'),
      get('/api/crm/leads'),
      get('/api/projects'),
      get('/api/forecasting/cash-flow?days=90'),
      get('/api/forecasting/revenue?months=6'),
      get('/api/audit/dashboard'),
      get('/api/expenses/summary'),
    ]).then(([treasury, ar, ap, employees, crm, projects, cashflow, revenue, audit, expenses]) => {
      setData({ treasury, ar, ap, employees, crm, projects, cashflow, revenue, audit, expenses });
      setLoading(false);
    }).catch(() => setLoading(false));`,
`    /*real-data*/
    Promise.all([
      get('/api/cash-position'),
      get('/api/accounting/ar-invoices'),
      get('/api/accounting/ap-invoices'),
      get('/api/payroll/employees'),
      get('/api/crm/leads'),
      get('/api/projects'),
      get('/api/cash-forecast?days=90'),
      get('/api/cfo/metrics/pnl_trend?months=13'),
      get('/api/cfo/metrics/working_capital'),
      get('/api/cfo/metrics/cash_runway'),
    ]).then(([cashPos, ar, ap, employees, crm, projects, forecast, pnl, wc, runway]) => {
      setData({ cashPos, ar, ap, employees, crm, projects, forecast, pnl, wc, runway });
      setLoading(false);
    }).catch(() => setLoading(false));`,'data loading');

// ---- 2. computed values ----
const c0=s.indexOf('  const cash = parseFloat(data?.treasury');
const c1=s.indexOf('  const empCount =');
if(c0<0||c1<0){console.error('computed block not found');process.exit(1);}
s=s.slice(0,c0)+`  const cashEntered = !!data?.cashPos?.current?.has_entry;
  const cash = cashEntered ? parseFloat(data.cashPos.current.amount) : 0;
  const num = v => parseFloat(v || 0) || 0;
  const arLive = (data?.ar?.invoices || []).filter(i => !['draft', 'cancelled'].includes(i.status));
  const apLive = (data?.ap?.invoices || []).filter(i => !['draft', 'rejected'].includes(i.status));
  const arTotal = arLive.reduce((a, i) => a + num(i.total_amount), 0);
  const arPending = arLive.reduce((a, i) => a + num(i.balance_due), 0);
  const arPendingCount = arLive.filter(i => num(i.balance_due) > 0).length;
  const apTotal = apLive.reduce((a, i) => a + num(i.total_amount), 0);
  const apPending = apLive.reduce((a, i) => a + num(i.balance_due), 0);
  const apPendingList = apLive.filter(i => num(i.balance_due) > 0);
  const apPendingCount = apPendingList.length;
`+s.slice(c1);

// ---- 3. trends ----
const t0=s.indexOf('  // ── Revenue trend (mock 6 months)');
const t1=s.indexOf('  // ── AR by status');
if(t0<0||t1<0){console.error('trend block not found');process.exit(1);}
s=s.slice(0,t0)+`  // ── Profit and loss from invoices, payroll and approved claims (the same basis as the CFO agent) ──
  const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthLabel = ym => MN[parseInt(String(ym).slice(5, 7), 10) - 1] + ' ' + String(ym).slice(0, 4);
  const pnlMonths = (data?.pnl?.months || []).map(m => ({ ...m, cost: num(m.vendor_costs) + num(m.payroll) + num(m.expense_claims) }));
  const activeMonths = pnlMonths.filter(m => num(m.revenue) > 0 || m.cost > 0);
  const lastM = activeMonths.length ? activeMonths[activeMonths.length - 1] : null;
  const prevM = lastM ? pnlMonths[pnlMonths.indexOf(lastM) - 1] : null;
  const mom = (cur, prev) => (prev && num(prev) > 0 ? ((num(cur) - num(prev)) / num(prev)) * 100 : null);
  const trendProps = p => (p === null || p === undefined || (lastM && lastM.partial_month) ? {} : { trend: Math.abs(p).toFixed(1) + '%', trendUp: p >= 0 });
  const lastLabel = lastM ? monthLabel(lastM.month) + (lastM.partial_month ? ' (so far)' : '') : 'No data yet';
  const revTrend = pnlMonths.slice(-6).map(m => ({ label: MN[parseInt(m.month.slice(5, 7), 10) - 1] + (m.partial_month ? '*' : ''), value: num(m.revenue) }));
  const fyStart = (() => { const d = new Date(); return (d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1) + '-04'; })();
  const fyMonths = pnlMonths.filter(m => m.month >= fyStart && (num(m.revenue) > 0 || m.cost > 0));
  const fyRev = fyMonths.reduce((a, m) => a + num(m.revenue), 0);
  const fyCost = fyMonths.reduce((a, m) => a + m.cost, 0);
  const fcBase = (data?.forecast?.scenarios || []).find(x => x.key === 'base');
  const cashTrend = fcBase ? fcBase.points.filter((_, i) => i % 11 === 10).map(p => ({ label: new Date(p.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), value: p.close })) : [];
  const runwayDays = data?.runway?.runway_days_gross;
  const payrollTotal = (data?.employees?.employees || []).reduce((a, e) => a + num(e.basic_salary), 0);

`+s.slice(t1);

// ---- 4. AR donut: collected vs outstanding ----
rep(`    { label: 'Paid', value: arTotal - arPending, color: '#059669' },
    { label: 'Pending', value: arPending, color: '#1B4FD8' },`,
`    { label: 'Collected', value: Math.max(0, arTotal - arPending), color: '#059669' },
    { label: 'Outstanding', value: arPending, color: '#1B4FD8' },`,'arByStatus');

// ---- 5. header ----
rep("Deemona Technologies · As of ","As of ",'header company');

// ---- 6. overview KPIs ----
rep(`<KPICard label="Cash Position"    value={INR(cash)}          color="#1B4FD8" icon="🏦" sub="Across 3 accounts"     trend="12.4%" trendUp={true} />`,
    `<KPICard label="Cash Position"    value={cashEntered ? INR(cash) : '—'} color="#1B4FD8" icon="🏦" sub={cashEntered ? 'Entered balance plus recorded flows' : 'Enter a balance on Cash Balance'} />`,'cash kpi');
rep(`<KPICard label="AR Outstanding"   value={INR(arPending)}     color="#D97706" icon="📄" sub="5 invoices pending"    trend="8.2%"  trendUp={false} />`,
    `<KPICard label="AR Outstanding"   value={INR(arPending)}     color="#D97706" icon="📄" sub={arPendingCount + ' invoice(s) with a balance'} />`,'ar kpi');
rep(`<KPICard label="AP Outstanding"   value={INR(apPending)}     color="#DC2626" icon="📋" sub="4 invoices due"        trend="3.1%"  trendUp={false} />`,
    `<KPICard label="AP Outstanding"   value={INR(apPending)}     color="#DC2626" icon="📋" sub={apPendingCount + ' bill(s) with a balance'} />`,'ap kpi');
rep(`<KPICard label="Pipeline Value"   value={INR(pipelineValue)} color="#059669" icon="🎯" sub="Weighted probability"  trend="22.5%" trendUp={true} />`,
    `<KPICard label="Pipeline Value"   value={INR(pipelineValue)} color="#059669" icon="🎯" sub="Weighted by probability" />`,'pipeline kpi');
rep(`<KPICard label="Monthly Revenue"  value="Rs 48.00 L"  color="#059669" icon="📈" sub="August 2026"    trend="14.3%" trendUp={true} />`,
    `<KPICard label="Monthly Revenue"  value={lastM ? INR(lastM.revenue) : '—'}  color="#059669" icon="📈" sub={lastLabel} {...(lastM ? trendProps(mom(lastM.revenue, prevM && prevM.revenue)) : {})} />`,'rev kpi');
rep(`<KPICard label="Monthly Expenses" value="Rs 31.50 L"  color="#DC2626" icon="📉" sub="August 2026"    trend="2.8%"  trendUp={false} />`,
    `<KPICard label="Monthly Expenses" value={lastM ? INR(lastM.cost) : '—'}  color="#DC2626" icon="📉" sub={lastLabel} {...(lastM ? trendProps(mom(lastM.cost, prevM && prevM.cost)) : {})} />`,'exp kpi');
rep(`<KPICard label="Net Profit"       value="Rs 16.50 L"  color="#1B4FD8" icon="💹" sub="This month"     trend="31.2%" trendUp={true} />`,
    `<KPICard label="Net Profit"       value={lastM ? INR(lastM.ebitda) : '—'}  color="#1B4FD8" icon="💹" sub={lastLabel} />`,'profit kpi');
rep(`<KPICard label="Gross Margin"     value="34.4%"       color="#7C3AED" icon="📊" sub="YTD average"    trend="2.1%"  trendUp={true} />`,
    `<KPICard label="Gross Margin"     value={lastM && lastM.gross_margin_pct != null ? lastM.gross_margin_pct + '%' : '—'}  color="#7C3AED" icon="📊" sub={lastLabel} />`,'margin kpi');

// ---- 7. revenue chart subtitle, cash flow box ----
rep(`<div style={{ fontSize: 11, color: '#64748B' }}>Last 6 months</div>`,`<div style={{ fontSize: 11, color: '#64748B' }}>Invoiced revenue, last 6 months (* = month so far)</div>`,'rev subtitle');
rep(`onCSV={() => downloadCSV(revTrend.map(d => ({ Month: d.label, Revenue: d.value })), 'revenue-trend.csv')}`,`onCSV={() => downloadCSV(revTrend.map(d => ({ Month: d.label, Revenue: d.value })), 'revenue-trend.csv')}`,'rev csv');
const cf0=s.indexOf(`                {cashTrend.length > 0 ? <LineChart`);
const cf1=s.indexOf(`              </div>\n            </div>\n\n            {/* Bottom Row */}`);
if(cf0<0||cf1<0){console.error('cash flow box not found');process.exit(1);}
s=s.slice(0,cf0)+`                {cashTrend.length > 1 ? <LineChart data={cashTrend} height={100} color="#059669" /> : (
                  <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 12 }}>No data</div>
                )}
                <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 7, background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>{runwayDays != null ? 'Runway: about ' + (runwayDays / 30).toFixed(1) + ' months' : 'Runway: not available yet'}</div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>{runwayDays != null ? 'Cash divided by average monthly outflow' : 'Needs payments or costs recorded'}</div>
                </div>
`+s.slice(cf1);
rep(`<div style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>90-day forecast</div>`,`<div style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>90-day forecast from booked invoices and bills</div>`,'cf subtitle');

// ---- 8. financial tab ----
rep(`<KPICard label="Total Revenue YTD"   value="Rs 2.85 Cr"  color="#059669" icon="📈" sub="Apr-Aug 2026" />
              <KPICard label="Total Expenses YTD"  value="Rs 1.89 Cr"  color="#DC2626" icon="📉" sub="Apr-Aug 2026" />
              <KPICard label="Net Profit YTD"      value="Rs 96.00 L"  color="#1B4FD8" icon="💹" sub="33.7% margin" />`,
`<KPICard label="Total Revenue YTD"   value={INR(fyRev)}  color="#059669" icon="📈" sub={'Financial year from April ' + fyStart.slice(0, 4)} />
              <KPICard label="Total Expenses YTD"  value={INR(fyCost)}  color="#DC2626" icon="📉" sub="Vendor bills, payroll, approved claims" />
              <KPICard label="Net Profit YTD"      value={INR(fyRev - fyCost)}  color="#1B4FD8" icon="💹" sub={fyRev > 0 ? (((fyRev - fyCost) / fyRev) * 100).toFixed(1) + '% margin' : 'No revenue yet'} />`,'financial kpis');
const csv0=s.indexOf(`onCSV={() => downloadCSV([\n                    { Month: 'Apr 2026'`);
const csv1=s.indexOf(`], 'pnl-summary.csv')}`);
if(csv0<0||csv1<0){console.error('pnl csv not found');process.exit(1);}
s=s.slice(0,csv0)+`onCSV={() => downloadCSV(fyMonths.map(m => ({ Month: monthLabel(m.month), Revenue: num(m.revenue), Expenses: m.cost, Profit: num(m.ebitda), Margin: m.ebitda_margin_pct != null ? m.ebitda_margin_pct + '%' : '' })), 'pnl-summary.csv')}`+s.slice(csv1+`], 'pnl-summary.csv')}`.length);
const rows0=s.indexOf(`                    {[\n                      { month: 'April 2026'`);
const rows1=s.indexOf(`].map((row, i) => {`);
if(rows0<0||rows1<0){console.error('pnl rows not found');process.exit(1);}
s=s.slice(0,rows0)+`                    {fyMonths.length === 0 && <tr><td colSpan={5} style={{ padding: 16, color: '#64748B' }}>No invoices, payroll or claims recorded this financial year yet.</td></tr>}
                    {fyMonths.map(m => ({ month: monthLabel(m.month) + (m.partial_month ? ' (so far)' : ''), rev: num(m.revenue), exp: m.cost }))`+s.slice(rows1+1);
rep(`const margin = ((profit / row.rev) * 100).toFixed(1);`,`const margin = row.rev > 0 ? ((profit / row.rev) * 100).toFixed(1) : '0.0';`,'margin calc');
rep(`<div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>AP Invoices - Pending Payments</div>`,`<div style={{ fontSize: 13, fontWeight: 700, color: '#0A1628' }}>Vendor Bills - Pending Payments</div>`,'ap title');
// AP tables: open bills with a balance
s=s.split(`(data?.ap?.invoices || []).filter(i => i.status !== 'paid')`).join(`apPendingList`);
rep(`<td style={{ padding: '9px 14px', fontWeight: 700, color: '#0A1628' }}>{INR(inv.total_amount)}</td>`,`<td style={{ padding: '9px 14px', fontWeight: 700, color: '#0A1628' }}>{INR(inv.balance_due)}</td>`,'ap amount');

// ---- 9. operations tab ----
rep(`value={empCount || 11}`,`value={empCount}`,'emp count');
rep(`<KPICard label="Monthly Payroll"   value="Rs 10.50 L"     color="#DC2626" icon="💳" sub="Gross salary" />`,`<KPICard label="Monthly Payroll"   value={INR(payrollTotal)}     color="#DC2626" icon="💳" sub="Total basic salary" />`,'payroll kpi');
rep(`<KPICard label="Compliance Items"  value="5 pending"       color="#D97706" icon="⚖️" sub="Due this month" />`,`<KPICard label="Overdue Receivables" value={INR(data?.wc?.ar_overdue)}  color="#D97706" icon="⏰" sub="Customer invoices past due date" />`,'compliance kpi');

fs.writeFileSync(f,crlf?s.replace(/\n/g,'\r\n'):s);console.log('Done: Executive Dashboard now uses real data');
