const fs = require("fs");
const f = "C:/deemona-finance-os/frontend/src/components/common/NSELiveRibbon.jsx";
let c = fs.readFileSync(f, "utf8");

// Replace the entire RAF useEffect with hardcoded simple version
const oldEffect = c.indexOf("  useEffect(() => {\n    const el = containerRef.current;\n    if (!el) return;");
const oldEffectEnd = c.indexOf("  }, []);  // intentionally", oldEffect) + "  }, []);  // intentionally no deps - RAF runs once".length;

const newEffect = `  useEffect(() => {
    let pos = 0;
    let last = null;
    const SPEED = 100;
    // Each stock item ~144px wide, 18 stocks = 2592px for one copy
    const SINGLE_WIDTH = 18 * 144;
    let raf;

    const tick = (ts) => {
      if (last !== null) {
        pos -= SPEED * (ts - last) / 1000;
        if (-pos >= SINGLE_WIDTH) pos += SINGLE_WIDTH;
        if (containerRef.current) {
          containerRef.current.style.transform = "translateX(" + pos + "px)";
        }
      }
      last = ts;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);`;

c = c.substring(0, oldEffect) + newEffect + c.substring(oldEffectEnd);

fs.writeFileSync(f, c, "utf8");
console.log("Done - hardcoded 18 * 144 = 2592px single width");
