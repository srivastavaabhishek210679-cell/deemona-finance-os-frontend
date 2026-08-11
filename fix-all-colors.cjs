const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\deemona-finance-os\\frontend\\src';

const REPLACEMENTS = [
  // ── Dark backgrounds -> light blue ──────────────────────────
  ["'#0B0B13'",  "'#EEF3FD'"],
  ['"#0B0B13"',  '"#EEF3FD"'],
  ["'#13131E'",  "'#F0F5FF'"],
  ['"#13131E"',  '"#F0F5FF"'],
  ["'#1A1A28'",  "'#FFFFFF'"],
  ['"#1A1A28"',  '"#FFFFFF"'],
  ["'#22223A'",  "'#DBEAFE'"],
  ['"#22223A"',  '"#DBEAFE"'],
  ["'#2A2A42'",  "'#C7D9F8'"],
  ['"#2A2A42"',  '"#C7D9F8"'],
  ["'#32324E'",  "'#93B4EF'"],
  ['"#32324E"',  '"#93B4EF"'],
  ["'#16162A'",  "'#F0F5FF'"],
  ['"#16162A"',  '"#F0F5FF"'],
  ["'#0D0D1A'",  "'#EEF3FD'"],
  ['"#0D0D1A"',  '"#EEF3FD"'],
  // ── Dark text -> dark blue text ──────────────────────────────
  ["'#F0EEF8'",  "'#0A1628'"],
  ['"#F0EEF8"',  '"#0A1628"'],
  ["'#8B89A8'",  "'#3B5998'"],
  ['"#8B89A8"',  '"#3B5998"'],
  ["'#55536A'",  "'#6B8CC4'"],
  ['"#55536A"',  '"#6B8CC4"'],
  // ── Purple accent -> blue accent ─────────────────────────────
  ["'#6C63FF'",  "'#1B4FD8'"],
  ['"#6C63FF"',  '"#1B4FD8"'],
  ["'#9B8FFF'",  "'#3B82F6'"],
  ['"#9B8FFF"',  '"#3B82F6"'],
  ["#6C63FF",    "#1B4FD8"],
  ["#9B8FFF",    "#3B82F6"],
  // ── Gradients ────────────────────────────────────────────────
  ["linear-gradient(135deg,#6C63FF,#9B8FFF)",          "linear-gradient(135deg,#1B4FD8,#3B82F6)"],
  ["linear-gradient(135deg, #6C63FF, #9B8FFF)",        "linear-gradient(135deg, #1B4FD8, #3B82F6)"],
  ["linear-gradient(135deg,#6C63FF 0%,#9B8FFF 100%)",  "linear-gradient(135deg,#1B4FD8 0%,#3B82F6 100%)"],
  // ── CSS var references (update values in var definitions) ───
  ["--bg:           #0B0B13",  "--bg:           #EEF3FD"],
  ["--surface-1:    #13131E",  "--surface-1:    #FFFFFF"],
  ["--surface-2:    #1A1A28",  "--surface-2:    #F0F5FF"],
  ["--surface-3:    #22223A",  "--surface-3:    #DBEAFE"],
  ["--border:       #2A2A42",  "--border:       #C7D9F8"],
  ["--border-light: #32324E",  "--border-light: #93B4EF"],
  ["--text-primary:   #F0EEF8","--text-primary:   #0A1628"],
  ["--text-secondary: #8B89A8","--text-secondary: #1E3A5F"],
  ["--text-muted:     #55536A","--text-muted:     #3B5998"],
  ["--accent:         #6C63FF","--accent:         #1B4FD8"],
  ["--accent-dim:     #6C63FF22","--accent-dim:   #1B4FD820"],
  ["--accent-hover:   #7B73FF","--accent-hover:   #1440B5"],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  for (const [from, to] of REPLACEMENTS) {
    content = content.split(from).join(to);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return 0;
  const files = fs.readdirSync(dir);
  let count = 0;
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
      count += walkDir(fullPath);
    } else if (/\.(jsx|js|tsx|ts|css)$/.test(file)) {
      if (processFile(fullPath)) {
        console.log('Fixed:', path.relative(ROOT, fullPath));
        count++;
      }
    }
  }
  return count;
}

const total = walkDir(ROOT);
console.log(`\nDone! Fixed ${total} files across ALL directories`);
