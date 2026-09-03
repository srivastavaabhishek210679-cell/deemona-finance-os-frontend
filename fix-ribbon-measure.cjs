const fs = require("fs");
const f = "C:/deemona-finance-os/frontend/src/components/common/NSELiveRibbon.jsx";

// Rewrite the RAF useEffect completely
let c = fs.readFileSync(f, "utf8");

c = c.replace(
  `  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Use 5 copies to ensure seamless loop
    const COPIES = 5;
    let singleWidth = 0;

    const measureAndStart = () => {
      if (!el.scrollWidth) return;
      // 5 copies rendered, so one copy = total/5
      singleWidth = Math.floor(el.scrollWidth / COPIES);
      console.log('[NSE] scrollWidth:', el.scrollWidth, 'singleWidth:', singleWidth);`,
  `  useEffect(() => {
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
      }`
);

// Increase timeout
c = c.replace(
  "const t = setTimeout(measureAndStart, 300);",
  "// measure immediately and also after delay\n    measureAndStart();\n    const t = setTimeout(measureAndStart, 1000);"
);

fs.writeFileSync(f, c, "utf8");
console.log("Done - fallback width 2591, double measure");
