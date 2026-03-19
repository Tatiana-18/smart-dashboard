// === 👤 PROFILE MODULE ===
const ProfileModule = {
  init() {
    this.loadProfile();
    this.setupEventListeners();
  },

  loadProfile() {
    const user = AuthService.getUser();
    if (!user) {
      Router.navigate('login');
      return;
    }

    // Update profile display
    document.getElementById('profileAvatar').textContent = user.name?.[0]?.toUpperCase() || '🦊';
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;

    // Load avatar if exists
    if (user.avatar) {
      const avatar = document.getElementById('profileAvatar');
      avatar.textContent = '';
      avatar.style.backgroundImage = `url(${user.avatar})`;
      avatar.style.backgroundSize = 'cover';
    }

    // Load stats
    const stats = DataService.getStats(user.id);
    const statsContainer = document.getElementById('profileStats');
    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="card-title">📊 Моя статистика</div>
        <div class="stat-row"><span>Всего баллов</span><strong>${user.totalPoints || 0}</strong></div>
        <div class="stat-row"><span>Уровень</span><strong>${user.level || 1}</strong></div>
        <div class="stat-row"><span>Задач выполнено</span><strong>${stats.completedTasks}</strong></div>
        <div class="stat-row"><span>Заметок создано</span><strong>${stats.totalNotes}</strong></div>
      `;
    }

    // Load settings
    const settingsContainer = document.getElementById('profileSettings');
    if (settingsContainer) {
      settingsContainer.innerHTML = `
        <div class="card-title">⚙️ Настройки</div>
        <div class="setting-item">
          <span>Уведомления</span>
          <label class="toggle">
            <input type="checkbox" ${user.settings?.notifications ? 'checked' : ''} id="notifToggle">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-item">
          <span>Тёмная тема</span>
          <label class="toggle">
            <input type="checkbox" ${user.settings?.darkTheme ? 'checked' : ''} id="themeToggle">
            <span class="toggle-slider"></span>
          </label>
        </div>
      `;
    }
  },

  setupEventListeners() {
    // Edit name
    document.getElementById('profileName')?.addEventListener('click', () => {
      const user = AuthService.getUser();
      const newName = prompt('Ваше имя:', user.name);
      if (newName && newName !== user.name) {
        AuthService.updateProfile({ name: newName });
        this.loadProfile();
      }
    });

    // Edit email
    document.getElementById('profileEmail')?.addEventListener('click', () => {
      const user = AuthService.getUser();
      const newEmail = prompt('Email:', user.email);
      if (newEmail && newEmail !== user.email) {
        AuthService.updateProfile({ email: newEmail });
        this.loadProfile();
      }
    });

    // Avatar upload
    document.getElementById('profileAvatar')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            AuthService.updateProfile({ avatar: event.target.result });
            this.loadProfile();
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    });

    // Settings toggles
    document.addEventListener('change', (e) => {
      if (e.target.id === 'themeToggle') {
        AuthService.toggleTheme();
      }
      if (e.target.id === 'notifToggle') {
        const user = AuthService.getUser();
        AuthService.updateProfile({ 
          settings: { ...user.settings, notifications: e.target.checked } 
        });
      }
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      if (confirm('Выйти из аккаунта?')) {
        AuthService.logout();
      }
    });
  }
};

window.ProfileModule = ProfileModule;