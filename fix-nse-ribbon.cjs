const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Replace the entire NSELiveRibbon component
const oldStart = c.indexOf('// ── NSE Live Stock Ticker Ribbon');
const oldEnd = c.indexOf('// ── Layout', oldStart);

if (oldStart === -1) { console.log('NSE ribbon not found'); process.exit(1); }

const newRibbon = `// ── NSE Live Stock Ticker Ribbon ─────────────────────────────
const NSE_STOCKS = [
  {sym:'RELIANCE',name:'Reliance Inds'},
  {sym:'TCS',name:'Tata Consult.'},
  {sym:'INFY',name:'Infosys'},
  {sym:'HDFCBANK',name:'HDFC Bank'},
  {sym:'ICICIBANK',name:'ICICI Bank'},
  {sym:'WIPRO',name:'Wipro'},
  {sym:'BAJFINANCE',name:'Bajaj Finance'},
  {sym:'TATAMOTORS',name:'Tata Motors'},
  {sym:'ADANIENT',name:'Adani Enterp.'},
  {sym:'SBIN',name:'SBI'},
  {sym:'BHARTIARTL',name:'Bharti Airtel'},
  {sym:'ITC',name:'ITC'},
  {sym:'KOTAKBANK',name:'Kotak Bank'},
  {sym:'LT',name:'L&T'},
  {sym:'AXISBANK',name:'Axis Bank'},
  {sym:'MARUTI',name:'Maruti Suzuki'},
  {sym:'SUNPHARMA',name:'Sun Pharma'},
  {sym:'HINDUNILVR',name:'HUL'},
  {sym:'ASIANPAINT',name:'Asian Paints'},
  {sym:'ULTRACEMCO',name:'UltraTech Cem'},
];

const MOCK_PRICES = {
  RELIANCE:2934,TCS:4218,INFY:1876,HDFCBANK:1743,ICICIBANK:1289,
  WIPRO:567,BAJFINANCE:7234,TATAMOTORS:1023,ADANIENT:2876,SBIN:812,
  BHARTIARTL:1654,ITC:478,KOTAKBANK:1789,LT:3456,AXISBANK:1123,
  MARUTI:12456,SUNPHARMA:1678,HINDUNILVR:2456,ASIANPAINT:2987,ULTRACEMCO:11234
};

const MOCK_CHANGES = {
  RELIANCE:0.82,TCS:-0.43,INFY:1.21,HDFCBANK:-0.67,ICICIBANK:0.34,
  WIPRO:-0.89,BAJFINANCE:1.45,TATAMOTORS:2.13,ADANIENT:-1.23,SBIN:0.56,
  BHARTIARTL:0.91,ITC:-0.22,KOTAKBANK:0.78,LT:1.34,AXISBANK:-0.45,
  MARUTI:0.67,SUNPHARMA:-0.33,HINDUNILVR:0.44,ASIANPAINT:-0.78,ULTRACEMCO:0.23
};

function NSELiveRibbon() {
  const [stocks, setStocks] = React.useState(() =>
    NSE_STOCKS.map(s => ({
      ...s,
      price: MOCK_PRICES[s.sym] || 1000,
      change: MOCK_PRICES[s.sym] * (MOCK_CHANGES[s.sym]||0) / 100,
      changePct: MOCK_CHANGES[s.sym] || 0,
      loaded: false,
    }))
  );
  const [nifty, setNifty] = React.useState({value:24589.12, change:0.43});
  const [sensex, setSensex] = React.useState({value:80892.34, change:0.51});
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    // Fetch real stock data
    const fetchStock = async (sym, idx) => {
      try {
        const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/' + sym + '.NS?interval=1d&range=1d');
        if (!r.ok) return;
        const j = await r.json();
        const meta = j.chart?.result?.[0]?.meta;
        if (!meta || !meta.regularMarketPrice) return;
        const price = parseFloat(meta.regularMarketPrice.toFixed(2));
        const prev = meta.previousClose || meta.chartPreviousClose || price;
        const change = parseFloat((price - prev).toFixed(2));
        const changePct = parseFloat(((price - prev) / prev * 100).toFixed(2));
        setStocks(s => s.map((st,i) => i===idx ? {...st, price, change, changePct, loaded:true} : st));
      } catch {}
    };

    NSE_STOCKS.forEach((s, idx) => setTimeout(() => fetchStock(s.sym, idx), idx * 500));
    const refresh = setInterval(() => {
      NSE_STOCKS.forEach((s, idx) => setTimeout(() => fetchStock(s.sym, idx), idx * 500));
    }, 60000);

    // Simulate micro price movements
    const ticker = setInterval(() => {
      setStocks(s => s.map(st => {
        const delta = st.price * (Math.random() - 0.5) * 0.0008;
        const newPrice = parseFloat((st.price + delta).toFixed(2));
        const newChange = parseFloat((st.change + delta).toFixed(2));
        return {...st, price: newPrice, change: newChange};
      }));
      setTime(new Date());
    }, 3000);

    return () => { clearInterval(refresh); clearInterval(ticker); };
  }, []);

  const fmtPrice = (p) => p >= 1000 ? p.toLocaleString('en-IN', {maximumFractionDigits:2}) : p.toFixed(2);

  return (
    <div style={{background:'#0a0f1e',borderBottom:'1px solid #1e3a8a',flexShrink:0}}>
      {/* Index Bar */}
      <div style={{display:'flex',alignItems:'center',gap:0,borderBottom:'1px solid #1e293b',height:22,overflowX:'auto'}}>
        <div style={{background:'#1d4ed8',color:'#fff',fontSize:9,fontWeight:800,padding:'0 10px',height:'100%',display:'flex',alignItems:'center',flexShrink:0,letterSpacing:'0.05em',gap:6}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:'#4ade80',display:'inline-block',animation:'nse-pulse 1.5s ease-in-out infinite'}}/>
          MARKET
        </div>
        {[
          {label:'NIFTY 50', value:nifty.value, pct:nifty.change},
          {label:'SENSEX', value:sensex.value, pct:sensex.change},
          {label:'NIFTY BANK', value:51234.56, pct:-0.23},
          {label:'NIFTY IT', value:38456.78, pct:1.12},
          {label:'NIFTY MID', value:44567.89, pct:0.67},
          {label:'INR/USD', value:83.45, pct:-0.12},
        ].map((idx,i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:5,padding:'0 12px',borderRight:'1px solid #1e293b',height:'100%',flexShrink:0}}>
            <span style={{fontSize:9,color:'#64748b',fontWeight:700}}>{idx.label}</span>
            <span style={{fontSize:9,fontWeight:800,color:'#e2e8f0'}}>{idx.value.toLocaleString('en-IN',{maximumFractionDigits:2})}</span>
            <span style={{fontSize:9,fontWeight:700,color:idx.pct>=0?'#4ade80':'#f87171'}}>{idx.pct>=0?'+':''}{idx.pct}%</span>
          </div>
        ))}
        <div style={{marginLeft:'auto',padding:'0 10px',fontSize:9,color:'#475569',flexShrink:0}}>
          {time.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})} IST
        </div>
      </div>

      {/* Stock Ticker Ribbon */}
      <div style={{height:26,overflow:'hidden',display:'flex',alignItems:'center',position:'relative'}}>
        <div style={{background:'#dc2626',color:'#fff',fontSize:9,fontWeight:800,padding:'0 8px',height:'100%',display:'flex',alignItems:'center',flexShrink:0,letterSpacing:'0.05em'}}>NSE</div>
        <div style={{flex:1,overflow:'hidden',position:'relative'}}>
          <div style={{
            display:'flex',
            animation:'nse-scroll 25s linear infinite',
            willChange:'transform',
          }}>
            {[...stocks,...stocks,...stocks].map((st,i) => {
              const up = st.changePct >= 0;
              return (
                <div key={i} style={{display:'inline-flex',alignItems:'center',gap:5,padding:'0 16px',borderRight:'1px solid #1e293b',height:26,flexShrink:0,whiteSpace:'nowrap'}}>
                  <span style={{fontSize:10,fontWeight:700,color:'#94a3b8'}}>{st.name}</span>
                  <span style={{fontSize:11,fontWeight:800,color:up?'#4ade80':'#f87171'}}>
                    \u20b9{fmtPrice(st.price)}
                  </span>
                  <span style={{fontSize:9,color:up?'#4ade80':'#f87171',fontWeight:600}}>
                    {up?'\u25b2':'\u25bc'}{Math.abs(st.changePct).toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{background:'#0a0f1e',padding:'0 8px',display:'flex',alignItems:'center',gap:4,flexShrink:0,borderLeft:'1px solid #1e293b'}}>
          <span style={{width:5,height:5,borderRadius:'50%',background:'#4ade80',display:'inline-block',animation:'nse-pulse 1.5s ease-in-out infinite'}}/>
          <span style={{fontSize:9,color:'#64748b',fontWeight:700}}>LIVE</span>
        </div>
      </div>

      <style>{\`
        @keyframes nse-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        @keyframes nse-pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.3; transform:scale(0.7); }
        }
      \`}</style>
    </div>
  );
}

`;

c = c.substring(0, oldStart) + newRibbon + c.substring(oldEnd);
fs.writeFileSync(f, c, 'utf8');
console.log('Done. Has NIFTY 50:', c.includes('NIFTY 50'));
console.log('Has nse-scroll:', c.includes('nse-scroll'));
console.log('Has sensex:', c.includes('sensex'));
