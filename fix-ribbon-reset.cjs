const fs = require("fs");
const f = "C:/deemona-finance-os/frontend/src/components/common/NSELiveRibbon.jsx";
let c = fs.readFileSync(f, "utf8");

// Fix: reset when first half fully scrolled (18 stocks)
// Each stock item is roughly 160px wide, 18 stocks = 2880px
// Use a fixed reset point instead of scrollWidth/2 which may not be accurate
c = c.replace(
  `    const tick = (ts) => {
      if (last !== null) {
        pos.current -= speed * (ts - last) / 1000;
        const halfW = inner.scrollWidth / 2;
        if (-pos.current >= halfW) pos.current = 0;
        inner.style.transform = \`translateX(\${pos.current}px)\`;
      }
      last = ts;
      raf.current = requestAnimationFrame(tick);
    };`,
  `    // Wait for layout to settle before reading scrollWidth
    let halfW = 0;
    const getHalfW = () => {
      const w = inner.scrollWidth / 2;
      if (w > 100) halfW = w;
    };
    setTimeout(getHalfW, 500);

    const tick = (ts) => {
      if (halfW === 0) getHalfW();
      if (last !== null) {
        pos.current -= speed * (ts - last) / 1000;
        if (halfW > 0 && -pos.current >= halfW) pos.current = 0;
        inner.style.transform = \`translateX(\${pos.current}px)\`;
      }
      last = ts;
      raf.current = requestAnimationFrame(tick);
    };`
);

fs.writeFileSync(f, c, "utf8");
console.log("Done. Has getHalfW:", c.includes("getHalfW"));
