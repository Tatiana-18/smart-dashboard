// === 🧭 ROUTER (Маршрутизатор) ===
const Router = {
  currentRoute: 'tasks',

  init() {
    this.setupNavigation();
    this.loadModule(this.currentRoute);
  },

  setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const target = item.dataset.target;
        if (target) {
          this.navigate(target);
        }
      });
    });

    // Profile button in header
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        this.navigate('profile');
      });
    }
  },

  navigate(route) {
    this.currentRoute = route;
    
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.target === route);
    });

    // Show target module
    this.loadModule(route);
  },

  loadModule(moduleName) {
    document.querySelectorAll('.module').forEach(mod => {
      mod.classList.remove('active');
    });

    const targetModule = document.getElementById(moduleName);
    if (targetModule) {
      targetModule.classList.add('active');
    }

    // Update mascot based on module
    this.updateMascot(moduleName);
  },

  updateMascot(moduleName) {
    const mascot = document.getElementById('mascot');
    if (!mascot) return;

    const emoji = mascot.querySelector('.mascot-emoji');
    const text = mascot.querySelector('.mascot-text');

    const messages = {
      tasks: { emoji: '🦊', text: 'Какие задачи выполним сегодня?' },
      notes: { emoji: '💭', text: 'Запиши свои мысли!' },
      tracker: { emoji: '🎉', text: 'Отличная работа! Так держать!' },
      profile: { emoji: '👤', text: 'Твой профиль' }
    };

    const msg = messages[moduleName] || messages.tasks;
    emoji.textContent = msg.emoji;
    text.textContent = msg.text;

    // Hide mascot on profile
    mascot.style.display = moduleName === 'profile' ? 'none' : 'block';
  }
};

// Export for use in other modules
window.Router = Router;