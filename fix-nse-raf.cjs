const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/App.jsx';
let c = fs.readFileSync(f, 'utf8');

const oldStart = c.indexOf('  const [nifty, setNifty]');
const oldEnd = c.indexOf('  const fmtPrice =', oldStart);
const newCode = `  const [nifty] = React.useState({value:24589.12, change:0.43});
  const [sensex] = React.useState({value:80892.34, change:0.51});
  const [time, setTime] = React.useState(new Date());
  const tickerRef = React.useRef(null);
  const posRef = React.useRef(0);
  const rafRef = React.useRef(null);

  React.useEffect(() => {
    const el = tickerRef.current;
    if (!el) return;
    const speed = 80; // pixels per second
    let last = null;
    const animate = (ts) => {
      if (last !== null) {
        const delta = (ts - last) / 1000;
        posRef.current -= speed * delta;
        const halfW = el.scrollWidth / 2;
        if (Math.abs(posRef.current) >= halfW) posRef.current = 0;
        el.style.transform = 'translateX(' + posRef.current + 'px)';
      }
      last = ts;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [stocks]);

  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

`;
c = c.substring(0, oldStart) + newCode + c.substring(oldEnd);

// Replace the scrolling div to use ref instead of CSS animation
c = c.replace(
  `          <div style={{
            display:'flex',
            animation:'nse-scroll 6s linear infinite',
            willChange:'transform',
          }}>`,
  `          <div ref={tickerRef} style={{display:'flex',willChange:'transform'}}>`,
);

// Remove old CSS animation keyframes
c = c.replace(
  `        @keyframes nse-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }`,
  ``
);

fs.writeFileSync(f, c, 'utf8');
console.log('Done - JS RAF animation at 80px/s');
console.log('Has tickerRef:', c.includes('tickerRef'));
console.log('Has requestAnimationFrame:', c.includes('requestAnimationFrame'));
