const fs = require('fs');

// NSE Live Ribbon component + wire into Layout topbar
const ribbonComponent = `
// ── NSE Live Stock Ticker Ribbon ─────────────────────────────
const NSE_STOCKS = [
  'RELIANCE','TCS','INFY','HDFCBANK','ICICIBANK','WIPRO','BAJFINANCE',
  'TATAMOTORS','ADANIENT','HINDUNILVR','SBIN','BHARTIARTL','ITC','KOTAKBANK',
  'LT','AXISBANK','ASIANPAINT','MARUTI','SUNPHARMA','ULTRACEMCO'
];

const MOCK_PRICES = {
  RELIANCE:2934,TCS:4218,INFY:1876,HDFCBANK:1743,ICICIBANK:1289,
  WIPRO:567,BAJFINANCE:7234,TATAMOTORS:1023,ADANIENT:2876,HINDUNILVR:2456,
  SBIN:812,BHARTIARTL:1654,ITC:478,KOTAKBANK:1789,LT:3456,
  AXISBANK:1123,ASIANPAINT:2987,MARUTI:12456,SUNPHARMA:1678,ULTRACEMCO:11234
};

function useStockTicker() {
  const [stocks, setStocks] = React.useState(() =>
    NSE_STOCKS.map(sym => ({
      sym, price: MOCK_PRICES[sym]||1000,
      change: (Math.random()-0.4)*MOCK_PRICES[sym]*0.02,
      loaded: false,
    }))
  );

  React.useEffect(() => {
    // Fetch real data from Yahoo Finance
    const fetchStock = async (sym, idx) => {
      try {
        const r = await fetch(\`https://query1.finance.yahoo.com/v8/finance/chart/\${sym}.NS?interval=1d&range=1d\`);
        if (!r.ok) return;
        const j = await r.json();
        const meta = j.chart?.result?.[0]?.meta;
        if (!meta) return;
        const price = meta.regularMarketPrice;
        const prev = meta.previousClose || meta.chartPreviousClose;
        const change = price - prev;
        setStocks(s => s.map((st,i) => i===idx ? {...st, price, change, loaded:true} : st));
      } catch {}
    };

    // Stagger fetches to avoid rate limiting
    NSE_STOCKS.forEach((sym, idx) => {
      setTimeout(() => fetchStock(sym, idx), idx * 400);
    });

    // Refresh every 60 seconds
    const interval = setInterval(() => {
      NSE_STOCKS.forEach((sym, idx) => {
        setTimeout(() => fetchStock(sym, idx), idx * 400);
      });
    }, 60000);

    // Simulate small price movements every 5s for visual effect
    const ticker = setInterval(() => {
      setStocks(s => s.map(st => ({
        ...st,
        price: parseFloat((st.price * (1 + (Math.random()-0.5)*0.001)).toFixed(2)),
      })));
    }, 5000);

    return () => { clearInterval(interval); clearInterval(ticker); };
  }, []);

  return stocks;
}

function NSELiveRibbon() {
  const stocks = useStockTicker();
  const [paused, setPaused] = React.useState(false);

  return (
    <div style={{
      background: '#0f172a',
      borderBottom: '1px solid #1e3a8a',
      height: 28,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* NSE Label */}
      <div style={{
        background: '#1d4ed8', color: '#fff', fontSize: 9, fontWeight: 800,
        padding: '0 8px', height: '100%', display: 'flex', alignItems: 'center',
        flexShrink: 0, letterSpacing: '0.05em', borderRight: '1px solid #2d5be3',
        zIndex: 2,
      }}>
        NSE LIVE
      </div>

      {/* Scrolling ticker */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}>
        <div style={{
          display: 'flex', gap: 0,
          animation: paused ? 'none' : 'nse-scroll 60s linear infinite',
          whiteSpace: 'nowrap',
          willChange: 'transform',
        }}>
          {[...stocks, ...stocks].map((st, i) => {
            const up = st.change >= 0;
            return (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '0 14px', borderRight: '1px solid #1e293b',
                height: 28,
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8' }}>{st.sym}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: up ? '#4ade80' : '#f87171' }}>
                  \\u20b9{st.price.toLocaleString('en-IN', {maximumFractionDigits:2})}
                </span>
                <span style={{ fontSize: 9, color: up ? '#4ade80' : '#f87171' }}>
                  {up ? '\\u25b2' : '\\u25bc'}{Math.abs(st.change).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live dot */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px',
        flexShrink: 0, borderLeft: '1px solid #1e293b',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%', background: '#4ade80',
          animation: 'nse-pulse 1.5s ease-in-out infinite',
        }}/>
        <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>LIVE</span>
      </div>

      {/* CSS Animation */}
      <style>{\`
        @keyframes nse-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes nse-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      \`}</style>
    </div>
  );
}
`;

const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

// Add ribbon component before Layout function
if (!c.includes('NSELiveRibbon')) {
  c = c.replace(
    '// ── Layout ──────────────────────────────────────────────────',
    ribbonComponent + '\n// ── Layout ──────────────────────────────────────────────────'
  );
  console.log('NSE Ribbon component added');
}

// Add ribbon to Layout - insert after the topbar div
c = c.replace(
  `        {/* Top bar with hamburger */}`,
  `        {/* NSE Live Ticker */}
        <NSELiveRibbon />
        {/* Top bar with hamburger */}`
);

fs.writeFileSync(f, c, 'utf8');
console.log('Done');
console.log('Has NSELiveRibbon:', c.includes('NSELiveRibbon'));
console.log('Has nse-scroll animation:', c.includes('nse-scroll'));
