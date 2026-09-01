const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/index.html';
let c = fs.readFileSync(f, 'utf8');

if (!c.includes('mobile-fix')) {
  c = c.replace(
    '</head>',
    `<style id="mobile-fix">
  * { box-sizing: border-box !important; }
  body { overflow-x: hidden !important; }
  img { max-width: 100% !important; }
  table { max-width: 100% !important; }
  @media (max-width: 768px) {
    div, section, article, main { max-width: 100vw !important; overflow-x: hidden !important; }
    [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
    [style*="display: grid"] { grid-template-columns: 1fr !important; }
    [style*="display:'grid'"] { grid-template-columns: 1fr !important; }
    [style*="minWidth: 900"], [style*="minWidth:900"], [style*="min-width: 900"] { min-width: unset !important; width: 100% !important; }
    [style*="minWidth: 800"], [style*="minWidth:800"] { min-width: unset !important; width: 100% !important; }
    [style*="minWidth: 700"], [style*="minWidth:700"] { min-width: unset !important; width: 100% !important; }
    [style*="minWidth: 600"], [style*="minWidth:600"] { min-width: unset !important; width: 100% !important; }
    [style*="padding: 20px 40"], [style*="padding:20px 40"] { padding: 16px !important; }
    [style*="padding: 40px 48"], [style*="padding:40px 48"] { padding: 20px 16px !important; }
    table { display: block !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
    .recharts-wrapper { max-width: 100% !important; }
  }
</style>
</head>`
  );
  fs.writeFileSync(f, c, 'utf8');
  console.log('Mobile CSS added');
} else {
  console.log('Already exists');
}
