const fs = require('fs');
const path = require('path');
const p = 'c:/Users/asus/OneDrive/Desktop/UNSDG/unsdg17game/backend/engines';
const files = fs.readdirSync(p).filter(f => f.startsWith('SDG') && f.endsWith('.js'));
const mappings = {
  'build_storage': '🔋',
  'close_coal': '⛏️',
  'improve_grid': '🔌',
  'eff_subsidy': '💡',

  // ANY other missing ones will just get 🎯
  'transit_hub': '🚉',
  'retention_basin': '🌊',

  'build_plant': '🏭',
  'fix_pipes': '🔧',
  'borewell': '🚰',
  'monitor_system': '💻',

  // generic
  'default': '🎯'
};

for (const f of files) {
  const fp = path.join(p, f);
  let code = fs.readFileSync(fp, 'utf8');
  let changed = false;
  let lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('label:') && lines[i].includes('id:')) {
      const match = lines[i].match(/id:\s*'([^']+)'/);
      if (match) {
        const id = match[1];
        if (!/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(lines[i].split("label:")[1].trim().replace(/^['"]/, ''))) {
          // Find emoji from mapping or use default
          const emoji = mappings[id] || mappings['default'];
          // Make sure not to double insert
          lines[i] = lines[i].replace(/label:\s*'/, "label: '" + emoji + " ");
          changed = true;
        }
      }
    }
  }
  if (changed) {
    fs.writeFileSync(fp, lines.join('\n'));
    console.log('Fixed more in ' + f);
  }
}
