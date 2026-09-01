const fs = require('fs');

// Check index.css or main css file
const cssFiles = [
  'C:/deemona-finance-os/frontend/src/index.css',
  'C:/deemona-finance-os/frontend/src/App.css',
];
cssFiles.forEach(f => {
  if (fs.existsSync(f)) {
    console.log('Found:', f);
    console.log('Content:', fs.readFileSync(f, 'utf8').substring(0, 300));
  }
});
