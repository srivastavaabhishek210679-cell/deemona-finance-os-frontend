const fs = require('fs');
const path = require('path');
const FRONTEND = 'C:/deemona-finance-os/frontend/src';

// Find the old WhatsApp component file
const possiblePaths = [
  'components/whatsapp/WhatsAppPage.jsx',
  'components/whatsapp/WhatsApp.jsx', 
  'pages/WhatsAppPage.jsx',
  'components/marketplace/WhatsAppPage.jsx',
];

const newContent = fs.readFileSync(path.join(__dirname, 'WhatsAppPage.jsx'), 'utf8');

let replaced = false;
possiblePaths.forEach(p => {
  const fullPath = path.join(FRONTEND.replace(/\//g,'\\'), ...p.split('/'));
  if (fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log('✓ Replaced:', fullPath);
    replaced = true;
  }
});

if (!replaced) {
  // Search for the file that has "WhatsApp not configured"
  const searchDir = (dir) => {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        searchDir(fullPath);
      } else if (item.endsWith('.jsx') || item.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('WhatsApp not configured') || content.includes('messages will be simulated')) {
          fs.writeFileSync(fullPath, newContent, 'utf8');
          console.log('✓ Found and replaced:', fullPath);
          replaced = true;
        }
      }
    });
  };
  searchDir(FRONTEND.replace(/\//g,'\\'));
}

if (!replaced) console.log('Could not find old WhatsApp file — creating new one');

// Also create in whatsapp folder
const waDir = path.join(FRONTEND.replace(/\//g,'\\'), 'components', 'whatsapp');
if (!fs.existsSync(waDir)) fs.mkdirSync(waDir, { recursive: true });
fs.writeFileSync(path.join(waDir, 'WhatsAppPage.jsx'), newContent, 'utf8');
console.log('✓ WhatsAppPage.jsx created/updated in components/whatsapp/');
console.log('Done!');
