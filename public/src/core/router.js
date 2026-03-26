// === 🧭 ROUTER ===
const Router = {
  currentRoute: 'tasks',
  isAuthenticated: false,

  routes: {
    'tasks':   { module: 'tasks',   title: 'Задачи',  requiresAuth: true  },
    'notes':   { module: 'notes',   title: 'Заметки', requiresAuth: true  },
    'tracker': { module: 'tracker', title: 'Трекер',  requiresAuth: true  },
    'profile': { module: 'profile', title: 'Профиль', requiresAuth: true  },
    'login':   { module: null,      title: 'Вход',    requiresAuth: false }
  },

  init() {
    this.isAuthenticated = AuthService.isAuthenticated();

    if (!this.isAuthenticated && !window.location.href.includes('login.html')) {
      window.location.href = './login.html';
      return;
    }
    if (this.isAuthenticated && window.location.href.includes('login.html')) {
      window.location.href = './index.html';
      return;
    }

    this.setupNavigation();
    this.loadModule(this.currentRoute);
    console.log('🧭 Router initialized');
  },

  setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const target = item.dataset.target;
        if (target && target !== this.currentRoute) {
          e.preventDefault();
          this.navigate(target);
        }
      });
    });

    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => this.navigate('profile'));
    }

    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.route) {
        this.loadModule(e.state.route, false);
      }
    });
  },

  navigate(route) {
    if (!this.routes[route]) {
      console.error('❌ Маршрут не найден:', route);
      return false;
    }
    if (this.routes[route].requiresAuth && !this.isAuthenticated) {
      window.location.href = './login.html';
      return false;
    }

    this.currentRoute = route;

    if (window.history && window.history.pushState) {
      window.history.pushState({ route }, `Smart Dashboard - ${route}`, `#${route}`);
    }

    this.loadModule(route);
    this.updateNavUI(route);
    document.title = `Smart Dashboard — ${this.routes[route].title}`;
    return true;
  },

  loadModule(routeName, updateNav = true) {
    document.querySelectorAll('.module').forEach(mod => mod.classList.remove('active'));

    const target = document.getElementById(routeName);
    if (target) target.classList.add('active');

    if (updateNav) this.updateNavUI(routeName);
    this.updateMascot(routeName);

    const moduleObj = window[`${routeName.charAt(0).toUpperCase() + routeName.slice(1)}Module`];
    if (moduleObj && typeof moduleObj.update === 'function') {
      moduleObj.update();
    }

    console.log('📦 Module loaded:', routeName);
  },

  updateNavUI(route) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.target === route);
    });
    localStorage.setItem('smartdash_last_route', route);
  },

  updateMascot(routeName) {
    const mascot = document.getElementById('mascot');
    if (!mascot) return;

    const messages = {
      tasks:   { emoji: '🦊', text: 'Какие задачи выполним сегодня?' },
      notes:   { emoji: '💭', text: 'Запиши свои мысли!' },
      tracker: { emoji: '📊', text: 'Твой прогресс выглядит отлично!' },
      profile: { emoji: '👤', text: 'Твой профиль' }
    };

    const msg = messages[routeName] || messages.tasks;
    const emoji = mascot.querySelector('.mascot-emoji');
    const text = mascot.querySelector('.mascot-text');
    if (emoji) emoji.textContent = msg.emoji;
    if (text) text.textContent = msg.text;

    mascot.style.display = routeName === 'profile' ? 'none' : 'block';
  },

  restoreLastRoute() {
    const last = localStorage.getItem('smartdash_last_route');
    return (last && this.routes[last]) ? last : 'tasks';
  }
};

window.Router = Router;
