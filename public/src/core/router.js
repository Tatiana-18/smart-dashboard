// === 🧭 ROUTER (Маршрутизатор) ===
const Router = {
  currentRoute: 'tasks',
  isAuthenticated: false,
  
  // Доступные маршруты
  routes: {
    'tasks': { module: 'tasks', title: 'Задачи', requiresAuth: true },
    'notes': { module: 'notes', title: 'Заметки', requiresAuth: true },
    'tracker': { module: 'tracker', title: 'Трекер', requiresAuth: true },
    'profile': { module: 'profile', title: 'Профиль', requiresAuth: true },
    'login': { module: null, title: 'Вход', requiresAuth: false }
  },

  // === Инициализация роутера ===
  init() {
    // Проверяем аутентификацию
    this.isAuthenticated = AuthService.isAuthenticated();
    
    // Если не авторизован и не на странице входа — редирект на login
    if (!this.isAuthenticated && !window.location.href.includes('login.html')) {
      window.location.href = '/login.html';
      return;
    }
    
    // Если авторизован и на странице входа — редирект на главную
    if (this.isAuthenticated && window.location.href.includes('login.html')) {
      window.location.href = '/index.html';
      return;
    }
    
    // Настраиваем навигацию
    this.setupNavigation();
    
    // Загружаем первый модуль
    this.loadModule(this.currentRoute);
    
    console.log('🧭 Router initialized');
  },

  // === Настройка навигации ===
  setupNavigation() {
    // Обработка кликов по навигационным элементам
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const target = item.dataset.target;
        if (target && target !== this.currentRoute) {
          e.preventDefault();
          this.navigate(target);
        }
      });
    });

    // Кнопка профиля в хедере
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        this.navigate('profile');
      });
    }

    // Обработка кнопки назад (если есть)
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.route) {
        this.loadModule(e.state.route, false);
      }
    });
  },

  // === Навигация по маршруту ===
  navigate(route) {
    // Проверяем существование маршрута
    if (!this.routes[route]) {
      console.error(`❌ Маршрут не найден: ${route}`);
      return;
    }

    // Проверяем авторизацию
    if (this.routes[route].requiresAuth && !this.isAuthenticated) {
      window.location.href = '/login.html';
      return;
    }

    // Обновляем текущий маршрут
    this.currentRoute = route;

    // Обновляем историю браузера (для SPA)
    if (window.history && window.history.pushState) {
      window.history.pushState({ route }, `Smart Dashboard - ${route}`, `#${route}`);
    }

    // Загружаем модуль
    this.loadModule(route);

    // Обновляем UI навигации
    this.updateNavUI(route);

    // Обновляем заголовок страницы
    document.title = `Smart Dashboard — ${this.routes[route].title}`;
  },

  // === Загрузка модуля ===
  loadModule(routeName, updateNav = true) {
    // Скрываем все модули
    document.querySelectorAll('.module').forEach(mod => {
      mod.classList.remove('active');
    });

    // Показываем целевой модуль
    const targetModule = document.getElementById(routeName);
    if (targetModule) {
      targetModule.classList.add('active');
    }

    // Обновляем навигацию если нужно
    if (updateNav) {
      this.updateNavUI(routeName);
    }

    // Обновляем маскота
    this.updateMascot(routeName);

    // Инициализируем модуль если есть соответствующий глобальный объект
    const moduleInit = window[`${routeName.charAt(0).toUpperCase() + routeName.slice(1)}Module`];
    if (moduleInit && typeof moduleInit.init === 'function') {
      // Модуль уже инициализирован в main.js, но можно вызвать update если нужно
      if (typeof moduleInit.update === 'function') {
        moduleInit.update();
      }
    }

    console.log(`📦 Module loaded: ${routeName}`);
  },

  // === Обновление UI навигации ===
  updateNavUI(route) {
    // Обновляем активный класс в навигации
    document.querySelectorAll('.nav-item').forEach(item => {
      const isActive = item.dataset.target === route;
      item.classList.toggle('active', isActive);
    });

    // Сохраняем в localStorage для восстановления после перезагрузки
    localStorage.setItem('smartdash_last_route', route);
  },

  // === Обновление маскота ===
  updateMascot(routeName) {
    const mascot = document.getElementById('mascot');
    if (!mascot) return;

    const emoji = mascot.querySelector('.mascot-emoji');
    const text = mascot.querySelector('.mascot-text');

    // Сообщения для разных модулей
    const messages = {
      tasks: { 
        emoji: '🦊', 
        text: 'Какие задачи выполним сегодня?' 
      },
      notes: { 
        emoji: '💭', 
        text: 'Запиши свои мысли!' 
      },
      tracker: { 
        emoji: '📊', 
        text: 'Твой прогресс выглядит отлично!' 
      },
      profile: { 
        emoji: '👤', 
        text: 'Твой профиль' 
      }
    };

    const msg = messages[routeName] || messages.tasks;
    
    if (emoji) emoji.textContent = msg.emoji;
    if (text) text.textContent = msg.text;

    // Скрываем маскота на профиле (опционально)
    if (routeName === 'profile') {
      mascot.style.display = 'none';
    } else {
      mascot.style.display = 'block';
    }
  },

  // === Проверка авторизации ===
  checkAuth() {
    this.isAuthenticated = AuthService.isAuthenticated();
    
    if (!this.isAuthenticated && !window.location.href.includes('login.html')) {
      window.location.href = '/login.html';
      return false;
    }
    
    return true;
  },

  // === Выход из системы ===
  logout() {
    AuthService.logout();
    this.isAuthenticated = false;
    this.currentRoute = 'login';
    window.location.href = '/login.html';
  },

  // === Восстановление последнего маршрута ===
  restoreLastRoute() {
    const lastRoute = localStorage.getItem('smartdash_last_route');
    if (lastRoute && this.routes[lastRoute]) {
      this.currentRoute = lastRoute;
      return lastRoute;
    }
    return 'tasks';
  }
};

// Экспортируем для использования в других модулях
window.Router = Router;