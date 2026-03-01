const fs = require('fs');
const path = require('path');
const p = 'c:/Users/asus/OneDrive/Desktop/UNSDG/unsdg17game/backend/engines';
const files = fs.readdirSync(p).filter(f => f.startsWith('SDG') && f.endsWith('.js'));
const mappings = {
  'build_solar': '☀️',
  'build_wind': '🌬️',
  'grid_battery': '🔋',
  'energy_eff': '💡',
  'retire_coal': '⛏️',
  'smart_grid': '🔌',
  'rural_microgrid': '🏘️',

  'build_transit': '🚇',
  'plant_trees': '🌳',
  'flood_barriers': '🌊',
  'affordable_housing': '🏘️',
  'waste_mgt': '🗑️',
  'cycle_lanes': '🚲',
  'air_monitor': '🌬️',

  'redesign_product': '🛠️',
  'takeback_scheme': '♻️',
  'recycling_infra': '🏭',
  'ecolabel': '🏷️',
  'clean_supply': '🚛',
  'repair_cafes': '🪛',
  'waste_tax': '💸',

  'set_quota': '⚖️',
  'create_mpa': '🛡️',
  'ban_trawling': '🚫',
  'plastic_cleanup': '🧹',
  'coral_restore': '🪸',
  'patrol_illegal': '🚤',
  'aquaculture': '🐟',

  'protect_zone': '🛡️',
  'restore_forest': '🌲',
  'rewild': '🐺',
  'logging_permit': '📜',
  'anti_poaching': '🚔',
  'invasive_control': '🌿',
  'soil_restoration': '🌱'
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
        if (!/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u.test(lines[i])) {
          if (mappings[id]) {
            lines[i] = lines[i].replace(/label:\s*'/, "label: '" + mappings[id] + " ");
            changed = true;
          } else {
            console.log('Missing mapping for: ', id, lines[i].trim());
          }
        }
      }
    }
  }
  if (changed) {
    fs.writeFileSync(fp, lines.join('\n'));
    console.log('Updated ' + f);
  }
}
