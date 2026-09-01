import { useState, useEffect, useRef } from 'react';

const STOCKS = [
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
  {sym:'ADANIENT',name:'Adani Ent.',price:2876.50,chg:-1.23},
  {sym:'ASIANPAINT',name:'Asian Paints',price:2987.40,chg:-0.78},
];

const INDICES = [
  {l:'NIFTY 50',v:24589.12,c:0.43},
  {l:'SENSEX',v:80892.34,c:0.51},
  {l:'NIFTY BANK',v:51234.56,c:-0.23},
  {l:'NIFTY IT',v:38456.78,c:1.12},
  {l:'INR/USD',v:83.45,c:-0.12},
];

export default function NSELiveRibbon() {
  const [stocks, setStocks] = useState(STOCKS);
  const [time, setTime] = useState(new Date());
  const containerRef = useRef(null);
  const posRef = useRef(0);
  const rafRef = useRef(null);
  const SPEED = 100; // px/sec

  useEffect(() => {
    STOCKS.forEach((s, idx) => {
      setTimeout(async () => {
        try {
          const r = await fetch(`https://deemona-finance-os-api.onrender.com/api/ai/market/quote?sym=${s.sym}`);
          if (!r.ok) return;
          const j = await r.json();
          const meta = j?.chart?.result?.[0]?.meta;
          if (!meta?.regularMarketPrice) return;
          const price = parseFloat(meta.regularMarketPrice.toFixed(2));
          const prev = meta.previousClose || price;
          const chg = parseFloat(((price - prev) / prev * 100).toFixed(2));
          setStocks(p => p.map((st, i) => i === idx ? { ...st, price, chg } : st));
        } catch {}
      }, idx * 800);
    });
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // intentionally no deps - RAF runs once

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const COPIES = 5;
    let singleWidth = 2591; // fallback from measured value
    let started = false;

    const measureAndStart = () => {
      const sw = el.scrollWidth;
      if (sw > 500) {
        singleWidth = Math.floor(sw / COPIES);
        console.log('[NSE] scrollWidth:', sw, 'singleWidth:', singleWidth);
      }

      let last = null;
      const tick = (ts) => {
        if (last !== null) {
          posRef.current -= SPEED * (ts - last) / 1000;
          // Reset when one full copy has scrolled
          if (singleWidth > 0 && -posRef.current >= singleWidth) {
            posRef.current += singleWidth;
          }
          el.style.transform = `translateX(${posRef.current}px)`;
        }
        last = ts;
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    // Wait for DOM to render
    // measure immediately and also after delay
    measureAndStart();
    const t = setTimeout(measureAndStart, 1000);
    return () => {
      clearTimeout(t);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const fmt = (p) => p >= 1000
    ? p.toLocaleString('en-IN', { maximumFractionDigits: 2 })
    : p.toFixed(2);

  // Render 5 copies for seamless infinite scroll
  const allStocks = [...stocks, ...stocks, ...stocks, ...stocks, ...stocks];

  return (
    <div style={{ background: '#0a0f1e', flexShrink: 0 }}>
      {/* Index Bar */}
      <div style={{ display: 'flex', alignItems: 'center', height: 22, borderBottom: '1px solid #1e293b', overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ background: '#1d4ed8', color: '#fff', fontSize: 9, fontWeight: 800, padding: '0 8px', height: '100%', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
          MARKET
        </div>
        {INDICES.map((idx, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', borderRight: '1px solid #1e293b', height: '100%', flexShrink: 0 }}>
            <span style={{ fontSize: 8, color: '#64748b', fontWeight: 700 }}>{idx.l}</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#e2e8f0' }}>{idx.v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            <span style={{ fontSize: 8, color: idx.c >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>{idx.c >= 0 ? '+' : ''}{idx.c}%</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', padding: '0 8px', fontSize: 8, color: '#475569', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
        </div>
      </div>

      {/* Stock Ticker */}
      <div style={{ height: 26, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ background: '#dc2626', color: '#fff', fontSize: 9, fontWeight: 800, padding: '0 7px', height: '100%', display: 'flex', alignItems: 'center', flexShrink: 0 }}>NSE</div>
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div ref={containerRef} style={{ display: 'inline-flex', whiteSpace: 'nowrap', willChange: 'transform' }}>
            {allStocks.map((s, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0 10px', borderRight: '1px solid #1e293b', height: 26, flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>{s.name}</span>
                <span style={{ fontSize: 11, color: s.chg >= 0 ? '#4ade80' : '#f87171', fontWeight: 800 }}>&#8377;{fmt(s.price)}</span>
                <span style={{ fontSize: 9, color: s.chg >= 0 ? '#4ade80' : '#f87171' }}>{s.chg >= 0 ? '▲' : '▼'}{Math.abs(s.chg).toFixed(2)}%</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, borderLeft: '1px solid #1e293b', background: '#0a0f1e' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
          <span style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>LIVE</span>
        </div>
      </div>
    </div>
  );
}
