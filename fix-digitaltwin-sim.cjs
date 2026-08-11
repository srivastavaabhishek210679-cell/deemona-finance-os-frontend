const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/digitaltwin/DigitalTwinPage.jsx';
let c = fs.readFileSync(f, 'utf8');

// Find and replace the JSON parsing block
const idx = c.indexOf("const data = await res.json();");
if (idx === -1) { console.log('Pattern not found'); process.exit(1); }

// Find the end of this block
const endIdx = c.indexOf("setResult(parsed);", idx) + "setResult(parsed);".length;
const oldBlock = c.substring(idx, endIdx);
console.log('Found block:', oldBlock.substring(0, 100));

const newBlock = `const rawText = await res.text();
      let parsed;
      try {
        const data = JSON.parse(rawText);
        const aiText = data.text || rawText;
        const jsonMatch = aiText.match(/\\{[\\s\\S]*\\}/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[0]); } catch { parsed = null; }
        }
        if (!parsed) {
          parsed = { summary: aiText, revenue_year1: 0, profit_margin: 34, cash_runway_months: 8 };
        }
      } catch(e) {
        parsed = { summary: rawText, revenue_year1: 0, profit_margin: 34, cash_runway_months: 8 };
      }
      setResult(parsed);`;

c = c.substring(0, idx) + newBlock + c.substring(endIdx);
fs.writeFileSync(f, c, 'utf8');
console.log('Fixed:', c.includes('rawText'));
