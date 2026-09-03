const fs = require("fs");
const f = "C:/deemona-finance-os/frontend/src/components/common/NSELiveRibbon.jsx";
let c = fs.readFileSync(f, "utf8");

// Fix measurement - use scrollWidth/5 directly (5 copies)
c = c.replace(
  `    const measureAndStart = () => {
      // Measure width of ONE copy (first child)
      const children = el.children;
      if (!children.length) return;
      // Each copy spans children.length/COPIES items
      const itemsPerCopy = Math.floor(children.length / COPIES);
      let w = 0;
      for (let i = 0; i < itemsPerCopy; i++) {
        w += children[i].offsetWidth;
      }
      singleWidth = w;`,
  `    const measureAndStart = () => {
      if (!el.scrollWidth) return;
      // 5 copies rendered, so one copy = total/5
      singleWidth = Math.floor(el.scrollWidth / COPIES);
      console.log('[NSE] scrollWidth:', el.scrollWidth, 'singleWidth:', singleWidth);`
);

fs.writeFileSync(f, c, "utf8");
console.log("Fixed. Using scrollWidth/5");
