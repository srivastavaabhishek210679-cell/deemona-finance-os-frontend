const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\deemona-finance-os\\frontend\\src\\components';

// Map old dark colors to new light blue colors
const COLOR_MAP = {
  // Dark backgrounds -> light blue
  "'#0B0B13'":  "'#EEF3FD'",
  "'#13131E'":  "'#F0F5FF'",
  "'#1A1A28'":  "'#FFFFFF'",
  "'#22223A'":  "'#DBEAFE'",
  "'#2A2A42'":  "'#C7D9F8'",
  "'#32324E'":  "'#93B4EF'",
  // Dark text -> dark blue text
  "'#F0EEF8'":  "'#0A1628'",
  "'#8B89A8'":  "'#3B5998'",
  "'#55536A'":  "'#6B8CC4'",
  // Keep accents but update
  "'#6C63FF'":  "'#1B4FD8'",
  "'#9B8FFF'":  "'#3B82F6'",
  // Surface vars
  "var(--surface-1)": "var(--surface-1)",  // already updated in CSS
  "var(--surface-2)": "var(--surface-2)",
  "var(--surface-3)": "var(--surface-3)",
  "var(--bg)":        "var(--bg)",
  // Border
  "var(--border)":    "var(--border)",
  // Text
  "var(--text-primary)":   "var(--text-primary)",
  "var(--text-secondary)": "var(--text-secondary)",
  "var(--text-muted)":     "var(--text-muted)",
};

// Also fix gradient backgrounds
const GRADIENT_MAP = {
  "'linear-gradient(135deg,#6C63FF,#9B8FFF)'": "'linear-gradient(135deg,#1B4FD8,#3B82F6)'",
  "'linear-gradient(135deg, #6C63FF, #9B8FFF)'": "'linear-gradient(135deg, #1B4FD8, #3B82F6)'",
  "linear-gradient(135deg,#6C63FF,#9B8FFF)": "linear-gradient(135deg,#1B4FD8,#3B82F6)",
  "linear-gradient(135deg, #6C63FF, #9B8FFF)": "linear-gradient(135deg, #1B4FD8, #3B82F6)",
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Apply color replacements
  for (const [from, to] of Object.entries({...COLOR_MAP, ...GRADIENT_MAP})) {
    content = content.split(from).join(to);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let count = 0;
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      count += walkDir(fullPath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (processFile(fullPath)) {
        console.log('Fixed:', file);
        count++;
      }
    }
  }
  return count;
}

const total = walkDir(srcDir);
console.log(`\nDone! Fixed ${total} files`);
console.log('All dark backgrounds replaced with light blue equivalents');
