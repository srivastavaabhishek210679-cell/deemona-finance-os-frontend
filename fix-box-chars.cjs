const fs = require('fs');

const files = [
  'C:/deemona-finance-os/frontend/src/components/treasury/BankStatementImporter.jsx',
  'C:/deemona-finance-os/frontend/src/components/reports/CustomReportBuilder.jsx',
];

files.forEach(filePath => {
  const fp = filePath.replace(/\//g, '\\');
  let c = fs.readFileSync(fp, 'utf8');
  const before = c.length;
  
  // Fix all corrupted multi-byte sequences in comments
  // Replace entire corrupted comment lines with clean versions
  c = c.split('\n').map(line => {
    // If line has corrupted chars (common pattern: â followed by special chars)
    if (line.includes('\u00e2')) {
      // Replace corrupted box drawing sequences with simple dashes
      line = line.replace(/[\u00e2][\u0080-\u00ff][\u0080-\u00ff]/g, '-');
      line = line.replace(/[\u00e2][\u0080-\u00ff]/g, '-');
      line = line.replace(/[\u00e2]/g, '-');
    }
    return line;
  }).join('\n');
  
  fs.writeFileSync(fp, c, 'utf8');
  console.log('Fixed:', filePath.split('/').pop(), '| Size:', before, '->', c.length);
  
  // Check remaining
  const remaining = (c.match(/[\u00e2]/g) || []).length;
  console.log('  Remaining corrupted chars:', remaining);
});

console.log('Done!');
