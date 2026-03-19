// === 👤 PROFILE MODULE ===
const ProfileModule = {
  init() {
    this.renderProfile();
    this.setupEventListeners();
    
    // ✅ Обновляем аватар при инициализации
    this.updateProfileAvatar();
  },

  renderProfile() {
    const user = AuthService.getUser();
    if (!user) return;

    // Обновляем информацию о пользователе
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');
    
    if (profileName) profileName.textContent = user.name;
    if (profileEmail) profileEmail.textContent = user.email;
    if (profileAvatar) {
      const firstLetter = user.name.charAt(0).toUpperCase();
      profileAvatar.textContent = firstLetter;
    }

    // Рендерим статистику
    this.renderStats();
    
    // Рендерим настройки
    this.renderSettings();
  },

  renderStats() {
    const user = AuthService.getUser();
    if (!user) return;

    const statsContainer = document.getElementById('profileStats');
    if (!statsContainer) return;

    // Получаем данные из localStorage
    const tasks = JSON.parse(localStorage.getItem('smartdash_tasks') || '[]');
    const notes = JSON.parse(localStorage.getItem('smartdash_notes') || '[]');
    
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalPoints = user.totalPoints || 0;
    const level = user.level || 1;

    statsContainer.innerHTML = `
      <div class="stat-row">
        <span>Всего баллов</span>
        <strong>${totalPoints}</strong>
      </div>
      <div class="stat-row">
        <span>Уровень</span>
        <strong>${level}</strong>
      </div>
      <div class="stat-row">
        <span>Задач выполнено</span>
        <strong>${completedTasks}</strong>
      </div>
      <div class="stat-row">
        <span>Заметок создано</span>
        <strong>${notes.length}</strong>
      </div>
    `;
  },

  renderSettings() {
    const user = AuthService.getUser();
    if (!user) return;

    const settingsContainer = document.getElementById('profileSettings');
    if (!settingsContainer) return;

    const notifications = user.settings?.notifications !== false;
    const darkTheme = user.settings?.darkTheme || false;

    settingsContainer.innerHTML = `
      <div class="setting-item">
        <span>Уведомления</span>
        <label class="toggle">
          <input type="checkbox" id="toggleNotifications" ${notifications ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="setting-item">
        <span>Тёмная тема</span>
        <label class="toggle">
          <input type="checkbox" id="toggleDarkTheme" ${darkTheme ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    `;

    // Добавляем обработчики
    document.getElementById('toggleNotifications').addEventListener('change', (e) => {
      AuthService.updateProfile({ 
        settings: { ...user.settings, notifications: e.target.checked } 
      });
      if (window.NotificationService) {
        NotificationService.show('success', { message: 'Настройки сохранены' });
      }
    });

    document.getElementById('toggleDarkTheme').addEventListener('change', (e) => {
      const newTheme = e.target.checked;
      AuthService.updateProfile({ 
        settings: { ...user.settings, darkTheme: newTheme } 
      });
      document.body.classList.toggle('dark-theme', newTheme);
    });
  },

  setupEventListeners() {
    // Кнопка выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        // ✅ Только один confirm
        if (confirm('Вы уверены что хотите выйти из аккаунта?')) {
          AuthService.logout();
        }
      });
    }
  },

  // ✅ ФУНКЦИЯ ОБНОВЛЕНИЯ АВАТАРА
  updateProfileAvatar() {
    const user = AuthService.getUser();
    if (user && user.name) {
      const firstLetter = user.name.charAt(0).toUpperCase();
      const profileBtn = document.getElementById('profileBtn');
      if (profileBtn) {
        profileBtn.textContent = firstLetter;
      }
      
      // Также обновляем аватар в шапке профиля если есть
      const profileAvatar = document.getElementById('profileAvatar');
      if (profileAvatar) {
        profileAvatar.textContent = firstLetter;
      }
    }
  }
};

// Экспортируем для использования в других модулях
window.ProfileModule = ProfileModule;