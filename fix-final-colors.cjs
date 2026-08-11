const fs = require('fs');
const path = require('path');
const ROOT = 'C:\\deemona-finance-os\\frontend\\src';

// Every dark color pattern found across components
const PAIRS = [
  // Dark gradient headers
  ["linear-gradient(135deg, #13131E, #1A1A35)", "linear-gradient(135deg, #1B4FD8, #3B82F6)"],
  ["linear-gradient(135deg, #1A1A35, #13131E)", "linear-gradient(135deg, #1B4FD8, #3B82F6)"],
  ["linear-gradient(135deg, #0B0B13, #1A1A28)", "linear-gradient(135deg, #EEF3FD, #DBEAFE)"],
  ["linear-gradient(135deg, #13131E, #22223A)", "linear-gradient(135deg, #F0F5FF, #DBEAFE)"],
  ["linear-gradient(135deg,#13131E,#1A1A35)",   "linear-gradient(135deg,#1B4FD8,#3B82F6)"],
  ["linear-gradient(135deg,#0B0B13,#1A1A28)",   "linear-gradient(135deg,#EEF3FD,#DBEAFE)"],
  // Dark hex backgrounds
  ["'#0B0B13'", "'#EEF3FD'"], ['"#0B0B13"', '"#EEF3FD"'],
  ["'#13131E'", "'#F0F5FF'"], ['"#13131E"', '"#F0F5FF"'],
  ["'#1A1A28'", "'#FFFFFF'"], ['"#1A1A28"', '"#FFFFFF"'],
  ["'#1A1A35'", "'#FFFFFF'"], ['"#1A1A35"', '"#FFFFFF"'],
  ["'#22223A'", "'#DBEAFE'"], ['"#22223A"', '"#DBEAFE"'],
  ["'#16162A'", "'#F0F5FF'"], ['"#16162A"', '"#F0F5FF"'],
  ["'#0D0D1A'", "'#EEF3FD'"], ['"#0D0D1A"', '"#EEF3FD"'],
  ["'#12121F'", "'#F0F5FF'"], ['"#12121F"', '"#F0F5FF"'],
  ["'#1C1C2E'", "'#F0F5FF'"], ['"#1C1C2E"', '"#F0F5FF"'],
  // Dark text
  ["'#F0EEF8'", "'#0A1628'"], ['"#F0EEF8"', '"#0A1628"'],
  ["'#8B89A8'", "'#3B5998'"], ['"#8B89A8"', '"#3B5998"'],
  ["'#55536A'", "'#6B8CC4'"], ['"#55536A"', '"#6B8CC4"'],
  // Purple -> blue
  ["'#6C63FF'", "'#1B4FD8'"], ['"#6C63FF"', '"#1B4FD8"'],
  ["'#9B8FFF'", "'#3B82F6'"], ['"#9B8FFF"', '"#3B82F6"'],
  ["#6C63FF12", "#1B4FD820"], ["#6C63FF18", "#1B4FD825"],
  ["#6C63FF20", "#1B4FD830"], ["#6C63FF22", "#1B4FD830"],
  ["#6C63FF40", "#1B4FD840"], ["#6C63FF08", "#1B4FD810"],
  ["#9B8FFF",   "#3B82F6"],
  // Dark borders
  ["'#2A2A42'", "'#C7D9F8'"], ['"#2A2A42"', '"#C7D9F8"'],
  ["'#32324E'", "'#93B4EF'"], ['"#32324E"', '"#93B4EF"'],
  // Gradients purple -> blue
  ["linear-gradient(135deg,#6C63FF,#9B8FFF)",   "linear-gradient(135deg,#1B4FD8,#3B82F6)"],
  ["linear-gradient(135deg, #6C63FF, #9B8FFF)", "linear-gradient(135deg, #1B4FD8, #3B82F6)"],
  ["linear-gradient(135deg,#22C98A,#1AAF74)",   "linear-gradient(135deg,#059669,#047857)"],
  ["linear-gradient(135deg, #22C98A, #1AAF74)", "linear-gradient(135deg, #059669, #047857)"],
];

function processFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  const orig = c;
  for (const [f, t] of PAIRS) c = c.split(f).join(t);
  if (c !== orig) { fs.writeFileSync(filePath, c, 'utf8'); return true; }
  return false;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory() && !['node_modules','.git','dist'].includes(f)) n += walk(p);
    else if (/\.(jsx|js|tsx|ts)$/.test(f) && processFile(p)) { console.log('Fixed:', f); n++; }
  }
  return n;
}

console.log('Fixed', walk(ROOT), 'files');
