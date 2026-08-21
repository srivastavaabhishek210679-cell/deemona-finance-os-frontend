const fs = require('fs');
const f = 'C:/deemona-finance-os/frontend/src/components/intelligence/AIIntelligenceHub.jsx';
let c = fs.readFileSync(f, 'utf8');

// Replace the InsightsView content display with markdown renderer
const oldDisplay = `              <div style={{fontSize:11,color:'#334155',lineHeight:1.7,whiteSpace:'pre-line'}}>{ins.content}</div>`;
const newDisplay = `              <div style={{fontSize:11,color:'#334155',lineHeight:1.8}} dangerouslySetInnerHTML={{__html: renderMd(ins.content)}}/>`;
c = c.replace(oldDisplay, newDisplay);

// Add renderMd function before AIIntelligenceHub export
const mdFn = `
function renderMd(text) {
  if (!text) return '';
  return text
    .replace(/^### (.+)$/gm, '<h4 style="color:#1d4ed8;margin:12px 0 6px;font-size:12px">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="color:#0f172a;margin:14px 0 6px;font-size:13px;border-bottom:1px solid #e2e8f0;padding-bottom:4px">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="color:#1e3a8a;margin:16px 0 8px;font-size:15px">$1</h2>')
    .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
    .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
    .replace(/^\\| (.+) \\|$/gm, (match) => {
      const cells = match.split('|').filter(c=>c.trim() && !c.trim().match(/^[-:]+$/));
      return '<tr>' + cells.map(c=>\`<td style="padding:5px 10px;border:1px solid #e2e8f0">\${c.trim()}</td>\`).join('') + '</tr>';
    })
    .replace(/(<tr>.*<\\/tr>\\n?)+/gs, (match) => \`<table style="width:100%;border-collapse:collapse;font-size:11px;margin:10px 0">\${match}</table>\`)
    .replace(/^\\|[-| :]+\\|$/gm, '')
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0;color:#334155">$1</li>')
    .replace(/(<li[^>]*>.*<\\/li>\\n?)+/gs, match => \`<ul style="padding-left:18px;margin:8px 0">\${match}</ul>\`)
    .replace(/^(\\d+)\\. (.+)$/gm, '<li style="margin:3px 0;color:#334155">$2</li>')
    .replace(/---/g, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0"/>')
    .replace(/\\n\\n/g, '</p><p style="margin:8px 0">')
    .replace(/\\n/g, '<br/>');
}

`;

c = c.replace('export default function AIIntelligenceHub()', mdFn + 'export default function AIIntelligenceHub()');

fs.writeFileSync(f, c, 'utf8');
console.log('Fixed. Has renderMd:', c.includes('function renderMd'));
