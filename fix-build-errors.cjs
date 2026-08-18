const fs = require('fs');

// Fix 1: App.jsx - remove duplicate icon in Reports nav entry
const appFile = 'C:/deemona-finance-os/frontend/src/App.jsx';
let app = fs.readFileSync(appFile, 'utf8');

// Find the reports nav line and fix it
const lines = app.split('\n');
const fixed = lines.map(line => {
  if (line.includes("label: 'Reports'") && line.includes("icon:") && line.split("icon:").length > 2) {
    // Has duplicate icon - keep only the first icon value
    const firstIconIdx = line.indexOf("icon:");
    const secondIconIdx = line.indexOf("icon:", firstIconIdx + 5);
    if (secondIconIdx > -1) {
      line = line.substring(0, secondIconIdx - 2) + ' },' ;
      console.log('✓ Fixed duplicate icon in Reports nav');
    }
  }
  return line;
});
fs.writeFileSync(appFile, fixed.join('\n'), 'utf8');

// Fix 2: CustomReportBuilder.jsx - remove null bytes and force-redeploy comment
const rptFile = 'C:/deemona-finance-os/frontend/src/components/reports/CustomReportBuilder.jsx';
let rpt = fs.readFileSync(rptFile, 'utf8');
// Remove null bytes
rpt = rpt.replace(/\0/g, '');
// Remove force redeploy comment that caused null byte
rpt = rpt.replace(/\/\/ force redeploy.*$/gm, '');
// Remove trailing whitespace issues
rpt = rpt.trim() + '\n';
fs.writeFileSync(rptFile, rpt, 'utf8');
console.log('✓ Fixed CustomReportBuilder null bytes');

// Fix 3: CFOAgentPage.jsx - remove duplicate color key
const cfoFile = 'C:/deemona-finance-os/frontend/src/components/cfoagent/CFOAgentPage.jsx';
let cfo = fs.readFileSync(cfoFile, 'utf8');
const cfoLines = cfo.split('\n');
const cfoFixed = cfoLines.map((line, i) => {
  // Find lines with duplicate color key
  if (line.includes("color:") && cfoLines[i-1] && cfoLines[i-1].includes("color:") && line.includes("fontWeight")) {
    // This is a style object continuation - check if color is duplicate
    if (line.match(/color:\s*'#fff'/)) {
      return line; // Keep the last color
    }
  }
  // Remove duplicate color: '#FFFFFF' when color: '#fff' follows
  if (line.includes("background: 'linear-gradient(135deg, #1B4FD8, #3B82F6)', color: '#FFFFFF',")) {
    line = line.replace(", color: '#FFFFFF'", '');
    console.log('✓ Fixed duplicate color in CFOAgentPage');
  }
  return line;
});
fs.writeFileSync(cfoFile, cfoFixed.join('\n'), 'utf8');

console.log('\nVerification:');
const appFinal = fs.readFileSync(appFile, 'utf8');
const rptFinal = fs.readFileSync(rptFile, 'utf8');
console.log('App.jsx Reports line icon count:', (appFinal.match(/label: 'Reports'/g)||[]).length);
console.log('CustomReportBuilder null bytes:', (rptFinal.match(/\0/g)||[]).length);
console.log('CustomReportBuilder force comment:', rptFinal.includes('force redeploy'));
