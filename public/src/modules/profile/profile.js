// === 👤 PROFILE MODULE ===
const ProfileModule = {
  init() {
    this.renderProfile();
    this.setupEventListeners();
    this.updateProfileAvatar();
  },

  renderProfile() {
    const user = AuthService.getUser();
    if (!user) return;

    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    
    if (profileName) profileName.textContent = user.name;
    if (profileEmail) profileEmail.textContent = user.email;

    this._renderAvatar();
    this.renderStats();
    this.renderSettings();
  },

  // === 🖼️ РЕНДЕР АВАТАРА (фото или буква) ===
  _renderAvatar() {
    const user = AuthService.getUser();
    if (!user) return;

    const profileAvatar = document.getElementById('profileAvatar');
    if (!profileAvatar) return;

    if (user.avatar) {
      // Показываем фото
      profileAvatar.innerHTML = `
        <img src="${user.avatar}" 
             alt="Аватар" 
             style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />
        <div class="avatar-overlay">
          <span style="font-size:24px;">📷</span>
        </div>
      `;
    } else {
      // Показываем букву + иконку камеры при hover
      const firstLetter = user.name.charAt(0).toUpperCase();
      profileAvatar.innerHTML = `
        <span class="avatar-letter">${firstLetter}</span>
        <div class="avatar-overlay">
          <span style="font-size:24px;">📷</span>
        </div>
      `;
    }

    // Стили overlay (один раз)
    if (!document.getElementById('avatarStyles')) {
      const style = document.createElement('style');
      style.id = 'avatarStyles';
      style.textContent = `
        #profileAvatar {
          position: relative;
          cursor: pointer;
          overflow: hidden;
        }
        .avatar-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        #profileAvatar:hover .avatar-overlay {
          opacity: 1;
        }
        #profileAvatar:active {
          transform: scale(0.96);
        }
        .avatar-letter {
          font-size: clamp(44px, 12vw, 56px);
          font-weight: 800;
          color: white;
        }

        /* Кнопка профиля в хедере */
        #profileBtn {
          position: relative;
          cursor: pointer;
          overflow: hidden;
        }
        #profileBtn img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          display: block;
        }
        .profile-btn-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
          font-size: 14px;
        }
        #profileBtn:hover .profile-btn-overlay {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }
  },

  // === 📷 ОТКРЫТЬ ВЫБОР ФАЙЛА ===
  openAvatarPicker() {
    // Создаём скрытый input если его нет
    let fileInput = document.getElementById('avatarFileInput');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'avatarFileInput';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Проверка размера (макс 5MB)
        if (file.size > 5 * 1024 * 1024) {
          if (window.NotificationService) {
            NotificationService.show(NotificationService.types.ERROR, {
              message: 'Файл слишком большой (макс. 5MB)'
            });
          }
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target.result;
          this._saveAvatar(base64);
        };
        reader.readAsDataURL(file);

        // Сбрасываем input для возможности повторного выбора того же файла
        fileInput.value = '';
      });
    }

    fileInput.click();
  },

  // === 💾 СОХРАНИТЬ АВАТАР ===
  _saveAvatar(base64) {
    AuthService.updateProfile({ avatar: base64 });
    
    // Обновляем аватар в профиле
    this._renderAvatar();
    
    // Обновляем кнопку в хедере
    this.updateProfileAvatar();

    if (window.NotificationService) {
      NotificationService.show(NotificationService.types.SUCCESS, {
        message: 'Фото профиля обновлено!'
      });
    }
  },

  // === 🗑️ УДАЛИТЬ АВАТАР ===
  removeAvatar() {
    AuthService.updateProfile({ avatar: null });
    this._renderAvatar();
    this.updateProfileAvatar();

    if (window.NotificationService) {
      NotificationService.show(NotificationService.types.INFO, {
        message: 'Фото удалено'
      });
    }
  },

  renderStats() {
    const user = AuthService.getUser();
    if (!user) return;

    const statsContainer = document.getElementById('profileStats');
    if (!statsContainer) return;

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
      ${user.avatar ? `
      <div class="setting-item">
        <span>Фото профиля</span>
        <button onclick="ProfileModule.removeAvatar()" 
                style="background:none;border:1px solid var(--error);color:var(--error);padding:8px 16px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">
          🗑️ Удалить
        </button>
      </div>
      ` : ''}
    `;

    document.getElementById('toggleNotifications')?.addEventListener('change', (e) => {
      AuthService.updateProfile({ 
        settings: { ...user.settings, notifications: e.target.checked } 
      });
      if (window.NotificationService) {
        NotificationService.show('success', { message: 'Настройки сохранены' });
      }
    });

    document.getElementById('toggleDarkTheme')?.addEventListener('change', (e) => {
      const newTheme = e.target.checked;
      AuthService.updateProfile({ 
        settings: { ...user.settings, darkTheme: newTheme } 
      });
      document.body.classList.toggle('dark-theme', newTheme);
    });
  },

  setupEventListeners() {
    // Выход
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Вы уверены что хотите выйти из аккаунта?')) {
          AuthService.logout();
        }
      });
    }

    // Клик на большой аватар в профиле — открыть picker
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
      profileAvatar.addEventListener('click', () => this.openAvatarPicker());
    }

    // Клик на кнопку в хедере — тоже открыть picker (если находимся на профиле)
    // Навигация по профилю остаётся в router.js, но добавляем long press / правый клик для смены фото
    // Простое решение: клик на profileBtn открывает профиль (как раньше через router),
    // а смена фото — через большой аватар на странице профиля
  },

  // === 🔄 ОБНОВИТЬ АВАТАР В ХЕДЕРЕ ===
  updateProfileAvatar() {
    const user = AuthService.getUser();
    if (!user) return;

    const profileBtn = document.getElementById('profileBtn');
    if (!profileBtn) return;

    if (user.avatar) {
      // Показываем фото в маленькой кнопке
      profileBtn.innerHTML = `
        <img src="${user.avatar}" alt="Аватар" />
        <div class="profile-btn-overlay">📷</div>
      `;
    } else {
      // Показываем букву
      const firstLetter = user.name.charAt(0).toUpperCase();
      profileBtn.innerHTML = firstLetter;
    }

    // Обновляем и большой аватар если он в DOM
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
      this._renderAvatar();
    }
  }
};

window.ProfileModule = ProfileModule;