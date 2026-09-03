const fs = require("fs");
const f = "C:/deemona-finance-os/frontend/src/LiveStreamStatus.jsx";
let c = fs.readFileSync(f, "utf8");

// Already dispatches window event on data_change - verify
console.log("Dispatches event:", c.includes("deemona_data_change"));
