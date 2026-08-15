const fs = require('fs');

const files = [
  'C:/deemona-finance-os/frontend/src/pages/OnboardingWizard.jsx',
  'C:/deemona-finance-os/frontend/src/components/tax/GSTPortalPage.jsx',
];

const emojiMap = {
  'ðŸ¢': '🏢', 'ðŸ¦': '🏦', 'ðŸ'¥': '👥', 'ðŸ­': '🏭', 'ðŸŽ‰': '🎉',
  'ðŸ"': '📄', 'ðŸ"‹': '📋', 'ðŸ'³': '💳', 'ðŸ'°': '💰', 'ðŸ"§': '🔧',
  'ðŸ"ˆ': '📈', 'ðŸ"‰': '📉', 'ðŸ'¹': '💹', 'ðŸ"Š': '📊', 'ðŸ§¾': '🧾',
  'ðŸ"¤': '📤', 'ðŸ"¥': '📥', 'ðŸ"': '🔍', 'âš–': '⚖️', 'ðŸ"…': '📅',
  'ðŸ"': '🔒', 'ðŸ"': '📝', 'âœ…': '✅', 'âš ': '⚠️', 'ðŸš€': '🚀',
  'ðŸ'¡': '💡', 'ðŸŒ': '🌐', 'âœ': '✍️', 'ðŸ–¨': '🖨', 'ðŸ¤': '🤝',
  'ðŸ"': '📋', 'ðŸ'Ž': '💎', 'ðŸ"±': '📱', 'ðŸ–¥': '🖥',
};

files.forEach(filePath => {
  if (!fs.existsSync(filePath.replace(/\//g, '\\'))) {
    console.log('Missing:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath.replace(/\//g, '\\'), 'utf8');
  let fixed = 0;
  Object.entries(emojiMap).forEach(([bad, good]) => {
    while (content.includes(bad)) {
      content = content.replace(bad, good);
      fixed++;
    }
  });
  fs.writeFileSync(filePath.replace(/\//g, '\\'), content, 'utf8');
  console.log('Fixed', fixed, 'emojis in:', filePath.split('/').pop());
});

console.log('Done!');
