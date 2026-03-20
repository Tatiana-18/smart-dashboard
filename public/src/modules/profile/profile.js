// === 👤 PROFILE MODULE ===
const ProfileModule = {

  init() {
    this._injectStyles();
    this.renderProfile();
    this.setupEventListeners();
    this.updateProfileAvatar();
  },

  // === 💉 СТИЛИ (один раз) ===
  _injectStyles() {
    if (document.getElementById('profileAvatarStyles')) return;
    const style = document.createElement('style');
    style.id = 'profileAvatarStyles';
    style.textContent = `
      #profileAvatar {
        position: relative;
        cursor: pointer;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #profileAvatar img.avatar-photo {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
      }
      #profileAvatar .avatar-letter {
        position: relative;
        z-index: 1;
        font-size: clamp(44px, 12vw, 56px);
        font-weight: 800;
        color: white;
      }
      #profileAvatar .avatar-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.42);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 2;
        pointer-events: none;
      }
      #profileAvatar:hover .avatar-overlay,
      #profileAvatar:active .avatar-overlay {
        opacity: 1;
      }
      #profileAvatar .avatar-overlay-icon {
        font-size: 28px;
        line-height: 1;
      }
      #profileBtn {
        position: relative;
        overflow: hidden;
      }
      #profileBtn img.avatar-photo-btn {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
      }
    `;
    document.head.appendChild(style);
  },

  // === 🖼️ РЕНДЕР АВАТАРА ===
  _renderAvatar() {
    const user = AuthService.getUser();
    const profileAvatar = document.getElementById('profileAvatar');
    if (!user || !profileAvatar) return;

    const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : '?';

    if (user.avatar) {
      profileAvatar.innerHTML = `
        <img class="avatar-photo" src="${user.avatar}" alt="Аватар" />
        <div class="avatar-overlay">
          <span class="avatar-overlay-icon">📷</span>
        </div>
      `;
    } else {
      profileAvatar.innerHTML = `
        <span class="avatar-letter">${firstLetter}</span>
        <div class="avatar-overlay">
          <span class="avatar-overlay-icon">📷</span>
        </div>
      `;
    }
  },

  // === 📷 ОТКРЫТЬ ВЫБОР ФАЙЛА ===
  openAvatarPicker() {
    let fileInput = document.getElementById('_avatarFileInput');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = '_avatarFileInput';
      fileInput.accept = 'image/png, image/jpeg, image/webp, image/gif';
      fileInput.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
      document.body.appendChild(fileInput);

      fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
          NotificationService.show(NotificationService.types.ERROR, {
            message: 'Файл слишком большой (макс. 5 MB)'
          });
          fileInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result;
          console.log('[ProfileModule] Avatar read, length:', base64.length);
          this._saveAvatar(base64);
        };
        reader.onerror = () => {
          NotificationService.show(NotificationService.types.ERROR, {
            message: 'Не удалось прочитать файл'
          });
        };
        reader.readAsDataURL(file);
        // сбрасываем value чтобы можно было выбрать тот же файл повторно
        fileInput.value = '';
      });
    }

    fileInput.click();
  },

  // === 💾 СОХРАНИТЬ АВАТАР ===
  _saveAvatar(base64) {
    console.log('[ProfileModule] Saving avatar...');

    const ok = AuthService.updateProfile({ avatar: base64 });
    console.log('[ProfileModule] updateProfile result:', ok);

    const user = AuthService.getUser();
    console.log('[ProfileModule] user.avatar after save:', user?.avatar ? 'EXISTS (length:' + user.avatar.length + ')' : 'NULL');

    this._renderAvatar();
    this.updateProfileAvatar();
    this.renderSettings();

    NotificationService.show(NotificationService.types.SUCCESS, {
      message: 'Фото профиля обновлено!'
    });
  },

  // === 🗑️ УДАЛИТЬ АВАТАР ===
  removeAvatar() {
    AuthService.updateProfile({ avatar: null });
    this._renderAvatar();
    this.updateProfileAvatar();
    this.renderSettings();
    NotificationService.show(NotificationService.types.INFO, {
      message: 'Фото удалено'
    });
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

  renderStats() {
    const user = AuthService.getUser();
    if (!user) return;
    const statsContainer = document.getElementById('profileStats');
    if (!statsContainer) return;

    const tasks = JSON.parse(localStorage.getItem('smartdash_tasks') || '[]');
    const notes = JSON.parse(localStorage.getItem('smartdash_notes') || '[]');
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalPoints = user.totalPoints || 0;
    const level = user.level || 1;

    statsContainer.innerHTML = `
      <div class="stat-row"><span>Всего баллов</span><strong>${totalPoints}</strong></div>
      <div class="stat-row"><span>Уровень</span><strong>${level}</strong></div>
      <div class="stat-row"><span>Задач выполнено</span><strong>${completedTasks}</strong></div>
      <div class="stat-row"><span>Заметок создано</span><strong>${notes.length}</strong></div>
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
        <button id="removeAvatarBtn"
                style="background:none;border:1px solid var(--error);color:var(--error);
                       padding:8px 16px;border-radius:8px;cursor:pointer;
                       font-size:14px;font-weight:600;">
          🗑️ Удалить
        </button>
      </div>
      ` : ''}
    `;

    document.getElementById('toggleNotifications')?.addEventListener('change', (e) => {
      AuthService.updateProfile({ settings: { ...user.settings, notifications: e.target.checked } });
      NotificationService.show(NotificationService.types.SUCCESS, { message: 'Настройки сохранены' });
    });

    document.getElementById('toggleDarkTheme')?.addEventListener('change', (e) => {
      const newTheme = e.target.checked;
      AuthService.updateProfile({ settings: { ...user.settings, darkTheme: newTheme } });
      document.body.classList.toggle('dark-theme', newTheme);
    });

    document.getElementById('removeAvatarBtn')?.addEventListener('click', () => {
      this.removeAvatar();
    });
  },

  setupEventListeners() {
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      if (confirm('Вы уверены что хотите выйти из аккаунта?')) {
        AuthService.logout();
      }
    });

    // Делегирование через document — потому что innerHTML #profileAvatar перезаписывается,
    // и обработчик, повешенный напрямую на элемент, слетает
    document.addEventListener('click', (e) => {
      if (e.target.closest('#profileAvatar')) {
        this.openAvatarPicker();
      }
    });
  },

  // === 🔄 ОБНОВИТЬ КНОПКУ В ХЕДЕРЕ ===
  updateProfileAvatar() {
    const user = AuthService.getUser();
    if (!user) return;

    const profileBtn = document.getElementById('profileBtn');
    if (!profileBtn) return;

    if (user.avatar) {
      profileBtn.textContent = '';
      let img = profileBtn.querySelector('img.avatar-photo-btn');
      if (!img) {
        img = document.createElement('img');
        img.className = 'avatar-photo-btn';
        img.alt = 'Аватар';
        profileBtn.appendChild(img);
      }
      img.src = user.avatar;
    } else {
      profileBtn.innerHTML = user.name ? user.name.charAt(0).toUpperCase() : '?';
    }
  }
};

window.ProfileModule = ProfileModule;
