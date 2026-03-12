// === 🎨 UI CONTAINER ===
const UIContainer = {
  init() {
    this.setupTheme();
  },

  setupTheme() {
    // Check for saved theme
    const savedTheme = localStorage.getItem('smartdash_theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
    }
  },

  toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('smartdash_theme', isDark ? 'dark' : 'light');
  }
};

window.UIContainer = UIContainer;