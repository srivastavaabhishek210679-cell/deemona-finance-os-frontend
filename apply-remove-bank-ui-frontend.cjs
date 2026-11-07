// Removes Bank Import + Treasury from the app, and bank CSV type from Auto-Ingest. Idempotent. Run from the frontend folder.
const fs=require('fs');
function edit(file,steps){
  if(!fs.existsSync(file)){console.error('Missing '+file+' (run from the frontend folder)');process.exit(1);}
  const raw=fs.readFileSync(file,'utf8');const crlf=raw.includes('\r\n');let s=raw.replace(/\r\n/g,'\n');let n=0;
  for(const [re,rep] of steps){ if(re.test(s)){s=s.replace(re,rep);n++;} }
  if(n){fs.writeFileSync(file,crlf?s.replace(/\n/g,'\r\n'):s);} console.log((n?'patched ':'already/none ')+file+' ('+n+')');
}
edit('src/App.jsx',[
 [/^[ \t]*\{ path: '\/bank-import'[^\n]*\n/m,''],
 [/^[ \t]*\{ path: '\/treasury',\s+label: 'Treasury'[^\n]*\n/m,''],
 [/^[ \t]*\{ path: '\/bank-import',\s+title:[^\n]*\n/m,''],
 [/^[ \t]*\{ path: '\/treasury',\s+title: 'Treasury'[^\n]*\n/m,''],
 [/^import BankStatementImporter[^\n]*\n/m,''],
 [/^import TreasuryPage[^\n]*\n/m,''],
 [/\{ label: 'Record Payment',(\s*)path: '\/treasury'/,"{ label: 'Record Payment',$1path: '/accounting'"],
]);
edit('src/components/ingestion/AutoIngestHub.jsx',[[/'VENDORS','BANK_TRANSACTIONS','ASSETS'/,"'VENDORS','ASSETS'"]]);
console.log('Done.');
