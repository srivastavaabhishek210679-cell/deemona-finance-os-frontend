const fs = require("fs");
const f = "C:/deemona-finance-os/frontend/src/App.jsx";
let lines = fs.readFileSync(f, "utf8").split("\n");

// Remove lines 136, 137, 138 (0-indexed: 135, 136, 137) - comp routes wrongly in sidebar
// They have title+comp+sub which is wrong for sidebar items
let i = 0;
lines = lines.filter(line => {
  i++;
  const isWrongRoute = (line.includes("title:") && line.includes("comp:") && line.includes("sub:"));
  if (isWrongRoute) console.log("Removing line", i, ":", line.trim().substring(0, 60));
  return !isWrongRoute;
});

// Now find the actual routes array - it should be in a const routes = [...] 
const routesIdx = lines.findIndex(l => l.includes("const routes") || l.includes("const ROUTES"));
console.log("Routes const at:", routesIdx+1);
console.log("Lines around routes:", lines.slice(routesIdx, routesIdx+5).join("\n"));

fs.writeFileSync(f, lines.join("\n"), "utf8");
console.log("Done");
