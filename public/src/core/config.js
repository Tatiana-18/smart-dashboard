// === ⚙️ CONFIGURATION ===
const Config = {
  appName: 'Smart Dashboard',
  
  storageKeys: {
    USERS: 'smartdash_users',
    CURRENT_USER: 'smartdash_current_user',
    TASKS: 'smartdash_tasks',
    NOTES: 'smartdash_notes',
    SETTINGS: 'smartdash_settings'
  },
  
  defaults: {
    pointsPerTask: 10,
    levelBasePoints: 100,
    levelIncrement: 50
  }
};

window.Config = Config;