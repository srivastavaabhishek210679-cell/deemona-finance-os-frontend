const fs = require('fs');
const path = require('path');

const ROOT = 'C:\\deemona-finance-os\\frontend\\src';

// Add minHeight 100% + light background to every page's outer div
// Also replace any remaining dark inline style colors

const REPLACE_PAIRS = [
  // Dark hardcoded backgrounds
  ["background: '#0B0B13'",  "background: '#EEF3FD'"],
  ["background: '#13131E'",  "background: '#F0F5FF'"],
  ["background: '#1A1A28'",  "background: '#FFFFFF'"],
  ["background: '#22223A'",  "background: '#DBEAFE'"],
  ["background: '#2A2A42'",  "background: '#C7D9F8'"],
  ["background:'#0B0B13'",   "background:'#EEF3FD'"],
  ["background:'#13131E'",   "background:'#F0F5FF'"],
  ["background:'#1A1A28'",   "background:'#FFFFFF'"],
  ["background:'#22223A'",   "background:'#DBEAFE'"],
  // Dark text on dark bg
  ["color: '#F0EEF8'",       "color: '#0A1628'"],
  ["color: '#8B89A8'",       "color: '#3B5998'"],
  ["color: '#55536A'",       "color: '#6B8CC4'"],
  ["color:'#F0EEF8'",        "color:'#0A1628'"],
  ["color:'#8B89A8'",        "color:'#3B5998'"],
  // Purple to blue
  ["background: '#6C63FF'",  "background: '#1B4FD8'"],
  ["background:'#6C63FF'",   "background:'#1B4FD8'"],
  ["color: '#6C63FF'",       "color: '#1B4FD8'"],
  ["color:'#6C63FF'",        "color:'#1B4FD8'"],
  ["color: '#9B8FFF'",       "color: '#3B82F6'"],
  // Border dark to light
  ["border: '1px solid #2A2A42'", "border: '1px solid #C7D9F8'"],
  ["border: '1px solid #32324E'", "border: '1px solid #93B4EF'"],
  ["borderColor: '#2A2A42'",      "borderColor: '#C7D9F8'"],
  // Gradients
  ["linear-gradient(135deg,#6C63FF,#9B8FFF)",   "linear-gradient(135deg,#1B4FD8,#3B82F6)"],
  ["linear-gradient(135deg, #6C63FF, #9B8FFF)", "linear-gradient(135deg, #1B4FD8, #3B82F6)"],
  // padding:24 outer divs - add background
  ["padding: 24 }}>",        "padding: 24, background: '#EEF3FD', minHeight: '100%' }}>"],
  ["padding:24}}>",           "padding:24,background:'#EEF3FD',minHeight:'100%'}}>"],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  for (const [from, to] of REPLACE_PAIRS) {
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
  const entries = fs.readdirSync(dir);
  let count = 0;
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !['node_modules','.git','dist'].includes(entry)) {
      count += walkDir(fullPath);
    } else if (/\.(jsx|js|tsx|ts)$/.test(entry)) {
      if (processFile(fullPath)) {
        console.log('Fixed:', entry);
        count++;
      }
    }
  }
  return count;
}

const total = walkDir(ROOT);
console.log(`\nFixed ${total} files`);
