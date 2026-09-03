const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Replace entire NSELiveRibbon function with simple marquee-based approach
const oldStart = c.indexOf('// ── NSE Live Stock Ticker Ribbon');
const oldEnd = c.indexOf('// ── Layout', oldStart);

const newRibbon = `// ── NSE Live Stock Ticker Ribbon ─────────────────────────────
const STOCK_DATA = [
  {sym:'RELIANCE',name:'Reliance',price:2934.50,chg:0.82},
  {sym:'TCS',name:'TCS',price:4218.30,chg:-0.43},
  {sym:'INFY',name:'Infosys',price:1876.20,chg:1.21},
  {sym:'HDFCBANK',name:'HDFC Bank',price:1743.10,chg:-0.67},
  {sym:'ICICIBANK',name:'ICICI Bank',price:1289.40,chg:0.34},
  {sym:'WIPRO',name:'Wipro',price:567.80,chg:-0.89},
  {sym:'BAJFINANCE',name:'Bajaj Fin',price:7234.60,chg:1.45},
  {sym:'TATAMOTORS',name:'Tata Motors',price:1023.70,chg:2.13},
  {sym:'SBIN',name:'SBI',price:812.30,chg:0.56},
  {sym:'BHARTIARTL',name:'Airtel',price:1654.20,chg:0.91},
  {sym:'ITC',name:'ITC',price:478.50,chg:-0.22},
  {sym:'KOTAKBANK',name:'Kotak Bank',price:1789.40,chg:0.78},
  {sym:'LT',name:'L&T',price:3456.80,chg:1.34},
  {sym:'AXISBANK',name:'Axis Bank',price:1123.60,chg:-0.45},
  {sym:'MARUTI',name:'Maruti',price:12456.90,chg:0.67},
  {sym:'SUNPHARMA',name:'Sun Pharma',price:1678.30,chg:-0.33},
  {sym:'ADANIENT',name:'Adani',price:2876.50,chg:-1.23},
  {sym:'ASIANPAINT',name:'Asian Paints',price:2987.40,chg:-0.78},
];

function NSELiveRibbon() {
  const [stocks, setStocks] = React.useState(STOCK_DATA);
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    // Fetch live prices
    STOCK_DATA.forEach((s, idx) => {
      setTimeout(async () => {
        try {
          const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/' + s.sym + '.NS?interval=1d&range=1d');
          if (!r.ok) return;
          const j = await r.json();
          const meta = j.chart?.result?.[0]?.meta;
          if (!meta?.regularMarketPrice) return;
          const price = parseFloat(meta.regularMarketPrice.toFixed(2));
          const prev = meta.previousClose || price;
          const chg = parseFloat(((price - prev) / prev * 100).toFixed(2));
          setStocks(prev => prev.map((st,i) => i===idx ? {...st, price, chg} : st));
        } catch {}
      }, idx * 600);
    });
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const tickerText = stocks.map(s => {
    const up = s.chg >= 0;
    return s.name + ' \u20b9' + s.price.toLocaleString('en-IN',{maximumFractionDigits:2}) + ' ' + (up?'\u25b2':'\u25bc') + Math.abs(s.chg).toFixed(2) + '%';
  }).join('   \u2502   ');

  return (
    <div style={{background:'#0a0f1e',flexShrink:0}}>
      {/* Index bar */}
      <div style={{display:'flex',alignItems:'center',height:20,borderBottom:'1px solid #1e293b',overflowX:'auto',overflowY:'hidden'}}>
        <div style={{background:'#1d4ed8',color:'#fff',fontSize:9,fontWeight:800,padding:'0 8px',height:'100%',display:'flex',alignItems:'center',flexShrink:0,gap:4}}>
          <span style={{width:5,height:5,borderRadius:'50%',background:'#4ade80',display:'inline-block'}}/>
          LIVE
        </div>
        {[
          {l:'NIFTY 50',v:'24,589',c:'+0.43%',up:true},
          {l:'SENSEX',v:'80,892',c:'+0.51%',up:true},
          {l:'NIFTY BANK',v:'51,234',c:'-0.23%',up:false},
          {l:'NIFTY IT',v:'38,456',c:'+1.12%',up:true},
          {l:'INR/USD',v:'83.45',c:'-0.12%',up:false},
        ].map((idx,i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:4,padding:'0 8px',borderRight:'1px solid #1e293b',height:'100%',flexShrink:0}}>
            <span style={{fontSize:8,color:'#64748b',fontWeight:700}}>{idx.l}</span>
            <span style={{fontSize:8,fontWeight:800,color:'#e2e8f0'}}>{idx.v}</span>
            <span style={{fontSize:8,fontWeight:700,color:idx.up?'#4ade80':'#f87171'}}>{idx.c}</span>
          </div>
        ))}
        <div style={{marginLeft:'auto',padding:'0 8px',fontSize:8,color:'#475569',flexShrink:0,whiteSpace:'nowrap'}}>
          {time.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})} IST
        </div>
      </div>

      {/* Marquee ticker */}
      <div style={{height:24,display:'flex',alignItems:'center',overflow:'hidden'}}>
        <div style={{background:'#dc2626',color:'#fff',fontSize:9,fontWeight:800,padding:'0 7px',height:'100%',display:'flex',alignItems:'center',flexShrink:0}}>NSE</div>
        <marquee scrollamount="6" style={{flex:1,fontSize:11,fontWeight:700,color:'#e2e8f0',height:24,lineHeight:'24px',background:'#0a0f1e'}}>
          {stocks.map((s,i) => (
            <span key={i}>
              <span style={{color:'#94a3b8',fontSize:10}}>{s.name} </span>
              <span style={{color:s.chg>=0?'#4ade80':'#f87171',fontWeight:800}}>\u20b9{s.price.toLocaleString('en-IN',{maximumFractionDigits:2})} </span>
              <span style={{color:s.chg>=0?'#4ade80':'#f87171',fontSize:9}}>{s.chg>=0?'\u25b2':'\u25bc'}{Math.abs(s.chg).toFixed(2)}% </span>
              <span style={{color:'#1e293b',margin:'0 8px'}}>|</span>
            </span>
          ))}
        </marquee>
      </div>
    </div>
  );
}

`;

c = c.substring(0, oldStart) + newRibbon + c.substring(oldEnd);
fs.writeFileSync(f, c, 'utf8');
console.log('Done - marquee based ribbon');
console.log('Has marquee:', c.includes('<marquee'));
console.log('Has STOCK_DATA:', c.includes('STOCK_DATA'));
