import { useState, useEffect, useRef } from 'react';

const STOCKS = [
  {name:'Reliance',price:2934.50,chg:0.82},
  {name:'TCS',price:4218.30,chg:-0.43},
  {name:'Infosys',price:1876.20,chg:1.21},
  {name:'HDFC Bank',price:1743.10,chg:-0.67},
  {name:'ICICI Bank',price:1289.40,chg:0.34},
  {name:'Wipro',price:567.80,chg:-0.89},
  {name:'Bajaj Fin',price:7234.60,chg:1.45},
  {name:'Tata Motors',price:1023.70,chg:2.13},
  {name:'SBI',price:812.30,chg:0.56},
  {name:'Airtel',price:1654.20,chg:0.91},
  {name:'ITC',price:478.50,chg:-0.22},
  {name:'Kotak Bank',price:1789.40,chg:0.78},
  {name:'L&T',price:3456.80,chg:1.34},
  {name:'Axis Bank',price:1123.60,chg:-0.45},
  {name:'Maruti',price:12456.90,chg:0.67},
  {name:'Sun Pharma',price:1678.30,chg:-0.33},
  {name:'Adani Ent.',price:2876.50,chg:-1.23},
  {name:'Asian Paints',price:2987.40,chg:-0.78},
];

const INDICES = [
  {l:'NIFTY 50',v:'24,589',c:'+0.43%',up:true},
  {l:'SENSEX',v:'80,892',c:'+0.51%',up:true},
  {l:'NIFTY BANK',v:'51,234',c:'-0.23%',up:false},
  {l:'NIFTY IT',v:'38,456',c:'+1.12%',up:true},
  {l:'INR/USD',v:'83.45',c:'-0.12%',up:false},
];

export default function NSELiveRibbon() {
  const [time, setTime] = useState(new Date());
  const ref = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let pos = 0;
    let last = null;
    let raf;
    // 18 stocks x 144px each = 2592px per copy
    const SINGLE = 18 * 144;
    const SPEED = 100;

    const tick = (ts) => {
      if (last !== null) {
        pos -= SPEED * (ts - last) / 1000;
        if (-pos >= SINGLE) pos += SINGLE;
        if (ref.current) ref.current.style.transform = 'translateX(' + pos + 'px)';
      }
      last = ts;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const fmt = (p) => p >= 1000 ? p.toLocaleString('en-IN', {maximumFractionDigits:2}) : p.toFixed(2);
  const all = [...STOCKS, ...STOCKS, ...STOCKS, ...STOCKS, ...STOCKS];

  return (
    <div style={{background:'#0a0f1e',flexShrink:0}}>
      {/* Index Bar */}
      <div style={{display:'flex',alignItems:'center',height:22,borderBottom:'1px solid #1e293b',overflowX:'auto',overflowY:'hidden'}}>
        <div style={{background:'#1d4ed8',color:'#fff',fontSize:9,fontWeight:800,padding:'0 8px',height:'100%',display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
          <span style={{width:5,height:5,borderRadius:'50%',background:'#4ade80',display:'inline-block'}}/>
          MARKET
        </div>
        {INDICES.map((idx,i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:4,padding:'0 8px',borderRight:'1px solid #1e293b',height:'100%',flexShrink:0}}>
            <span style={{fontSize:8,color:'#64748b',fontWeight:700}}>{idx.l}</span>
            <span style={{fontSize:9,fontWeight:800,color:'#e2e8f0'}}>{idx.v}</span>
            <span style={{fontSize:8,color:idx.up?'#4ade80':'#f87171',fontWeight:700}}>{idx.c}</span>
          </div>
        ))}
        <div style={{marginLeft:'auto',padding:'0 8px',fontSize:8,color:'#475569',flexShrink:0,whiteSpace:'nowrap'}}>
          {time.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})} IST
        </div>
      </div>

      {/* Stock Ticker */}
      <div style={{height:26,display:'flex',alignItems:'center',overflow:'hidden'}}>
        <div style={{background:'#dc2626',color:'#fff',fontSize:9,fontWeight:800,padding:'0 7px',height:'100%',display:'flex',alignItems:'center',flexShrink:0}}>NSE</div>
        <div style={{flex:1,overflow:'hidden',position:'relative'}}>
          <div ref={ref} style={{display:'inline-flex',whiteSpace:'nowrap',willChange:'transform'}}>
            {all.map((s,i) => (
              <span key={i} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'0 10px',borderRight:'1px solid #1e293b',height:26,flexShrink:0,width:144,boxSizing:'border-box'}}>
                <span style={{fontSize:10,color:'#94a3b8',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</span>
                <span style={{fontSize:10,color:s.chg>=0?'#4ade80':'#f87171',fontWeight:800,flexShrink:0}}>&#8377;{fmt(s.price)}</span>
                <span style={{fontSize:9,color:s.chg>=0?'#4ade80':'#f87171',flexShrink:0}}>{s.chg>=0?'▲':'▼'}{Math.abs(s.chg).toFixed(1)}%</span>
              </span>
            ))}
          </div>
        </div>
        <div style={{padding:'0 8px',display:'flex',alignItems:'center',gap:3,flexShrink:0,borderLeft:'1px solid #1e293b',background:'#0a0f1e'}}>
          <span style={{width:5,height:5,borderRadius:'50%',background:'#4ade80',display:'inline-block'}}/>
          <span style={{fontSize:9,color:'#64748b',fontWeight:700}}>LIVE</span>
        </div>
      </div>
    </div>
  );
}
