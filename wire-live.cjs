const fs = require("fs");
const f = "C:/deemona-finance-os/frontend/src/App.jsx";
let c = fs.readFileSync(f, "utf8");

if (!c.includes("LiveStreamStatus")) {
  c = c.replace(
    "import { BrowserRouter",
    "import LiveStreamStatus from './LiveStreamStatus';\nimport { BrowserRouter"
  );
  // Add to topbar after AI Finance OS badge
  c = c.replace(
    ">AI Finance OS</div>",
    ">AI Finance OS</div><LiveStreamStatus/>"
  );
  fs.writeFileSync(f, c, "utf8");
  console.log("Wired:", c.includes("<LiveStreamStatus/>"));
} else {
  console.log("Already wired");
}
