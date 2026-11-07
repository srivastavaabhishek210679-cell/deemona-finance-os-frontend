// Accounting: Delete button on invoices and bills that have no payments recorded. Idempotent. Run from the frontend folder.
const fs=require('fs');const f='src/components/accounting/AccountingPage.jsx';
if(!fs.existsSync(f)){console.error('Run from the frontend folder');process.exit(1);}
const raw=fs.readFileSync(f,'utf8');const crlf=raw.includes('\r\n');let s=raw.replace(/\r\n/g,'\n');
if(s.includes('function DeleteInvoiceButton')){console.log('Already applied');process.exit(0);}
function must(c,m){if(!c){console.error('Pattern not found: '+m);process.exit(1);}}
const pb='function PayButton(';
must(s.includes(pb),'PayButton');
const del=`function DeleteInvoiceButton({ invoice, type, onDone }) {
  const [busy, setBusy] = useState(false);
  if (parseFloat(invoice.paid_amount || 0) > 0) return null;
  const go = async () => {
    if (!window.confirm('Delete ' + (type === 'ar' ? 'invoice ' : 'bill ') + invoice.invoice_number + '? This cannot be undone.')) return;
    setBusy(true);
    try {
      const res = await fetch(API + (type === 'ar' ? '/ar-invoices/' : '/ap-invoices/') + invoice.id, { method: 'DELETE', headers: headers() });
      if (!res.ok) { let m = 'Could not delete'; try { m = (await res.json()).error || m; } catch {} window.alert(m); }
      else onDone();
    } finally { setBusy(false); }
  };
  return <button onClick={go} disabled={busy} title="Delete" style={{ padding: '5px 8px', borderRadius: 8, border: 'none', background: 'transparent', color: '#FF5C5C', fontSize: 12, cursor: busy ? 'not-allowed' : 'pointer' }}>Delete</button>;
}

`;
s=s.replace(pb,()=>del+pb);
const sig='function InvoiceTable({ type, invoices, onPay }) {';
must(s.includes(sig),'InvoiceTable signature'); s=s.replace(sig,()=>'function InvoiceTable({ type, invoices, onPay, onChanged }) {');
const row='<PayButton invoice={inv} type={type} onPay={onPay} />';
must(s.includes(row),'PayButton usage'); s=s.replace(row,()=>"<span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><PayButton invoice={inv} type={type} onPay={onPay} /><DeleteInvoiceButton invoice={inv} type={type} onDone={onChanged || (() => {})} /></span>");
const ar='<InvoiceTable type="ar" invoices={invoices} onPay={setPaying} />';
const ap='<InvoiceTable type="ap" invoices={invoices} onPay={setPaying} />';
must(s.includes(ar)&&s.includes(ap),'InvoiceTable usages');
s=s.replace(ar,()=>'<InvoiceTable type="ar" invoices={invoices} onPay={setPaying} onChanged={load} />');
s=s.replace(ap,()=>'<InvoiceTable type="ap" invoices={invoices} onPay={setPaying} onChanged={load} />');
fs.writeFileSync(f,crlf?s.replace(/\n/g,'\r\n'):s);console.log('Done');
