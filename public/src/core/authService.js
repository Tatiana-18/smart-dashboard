// === 🔐 AUTH SERVICE ===
const AuthService = {
  currentUser: null,
  users: [],

  init() {
    console.log('[AuthService] Init - Loading data from localStorage...');
    
    // Load users
    const savedUsers = localStorage.getItem('smartdash_users');
    if (savedUsers) {
      try {
        this.users = JSON.parse(savedUsers);
        console.log('[AuthService] ✅ Loaded', this.users.length, 'users');
        this.users.forEach(u => {
          console.log('  -', u.email, '| Name:', u.name, '| ID:', u.id);
        });
      } catch (e) {
        console.error('[AuthService] ❌ Error parsing users:', e);
        this.users = [];
      }
    } else {
      this.users = [];
      console.log('[AuthService] ⚠️ No users in localStorage');
    }
    
    // Load current session
    const savedUser = localStorage.getItem('smartdash_current_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        console.log('[AuthService] ✅ Current session:', this.currentUser?.email);
      } catch (e) {
        console.error('[AuthService] ❌ Error parsing current user:', e);
        this.currentUser = null;
      }
    }
  },

  register(name, email, password, isAdmin = false) {
    console.log('[AuthService] 📝 Register attempt:', { name, email, isAdmin });
    
    // ✅ НОРМАЛИЗАЦИЯ EMAIL (нижний регистр + trim)
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    
    // Проверка существующего пользователя (case-insensitive)
    const existingUser = this.users.find(u => u.email === normalizedEmail);
    if (existingUser) {
      console.log('[AuthService] ❌ User already exists:', normalizedEmail);
      return { success: false, error: 'Пользователь с таким email уже существует' };
    }
    
    // Создание нового пользователя
    const newUser = {
      id: 'user_' + Date.now(),
      name: normalizedName,
      email: normalizedEmail,  // ✅ ВСЕГДА нижний регистр
      password: password,  // В реальном проекте нужно хешировать!
      isAdmin: isAdmin || false,
      totalPoints: 0,
      level: 1,
      avatar: null,
      createdAt: new Date().toISOString(),
      settings: { 
        notifications: true, 
        darkTheme: false 
      }
    };
    
    this.users.push(newUser);
    this._saveUsers();
    
    console.log('[AuthService] ✅ User registered:', newUser);
    console.log('[AuthService] Total users:', this.users.length);
    
    return { success: true, user: newUser };
  },

  login(email, password) {
    console.log('[AuthService] 🔑 Login attempt:', { email });
    
    // ✅ НОРМАЛИЗАЦИЯ EMAIL (нижний регистр + trim)
    const normalizedEmail = email.trim().toLowerCase();
    
    console.log('[AuthService] Searching for email:', normalizedEmail);
    console.log('[AuthService] All users in DB:', this.users.map(u => u.email));
    
    // Поиск пользователя (case-insensitive)
    const user = this.users.find(u => {
      const emailMatch = u.email === normalizedEmail;
      const passwordMatch = u.password === password;
      console.log('  Checking:', u.email, '| Email match:', emailMatch, '| Password match:', passwordMatch);
      return emailMatch && passwordMatch;
    });
    
    if (user) {
      // Создание сессии БЕЗ пароля
      this.currentUser = { 
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        totalPoints: user.totalPoints,
        level: user.level,
        avatar: user.avatar,
        settings: user.settings
      };
      
      // Сохранение сессии
      localStorage.setItem('smartdash_current_user', JSON.stringify(this.currentUser));
      
      console.log('[AuthService] ✅ Login successful:', this.currentUser);
      console.log('[AuthService] Session saved to localStorage');
      
      return { success: true, user: this.currentUser };
    }
    
    console.log('[AuthService] ❌ Login failed - user not found or wrong password');
    console.log('[AuthService] Available users:', this.users.map(u => u.email));
    console.log('[AuthService] You entered:', normalizedEmail);
    
    return { success: false, error: 'Неверный email или пароль' };
  },

  logout() {
    console.log('[AuthService] 🚪 Logout');
    this.currentUser = null;
    localStorage.removeItem('smartdash_current_user');
    window.location.href = '/smart-dashboard/';
  },

  updateProfile(updates) {
    if (!this.currentUser) {
      console.log('[AuthService] ⚠️ No current user to update');
      return false;
    }
    
    console.log('[AuthService] 🔄 Updating profile:', updates);
    
    this.currentUser = { ...this.currentUser, ...updates };
    
    // Обновление в массиве users
    const index = this.users.findIndex(u => u.id === this.currentUser.id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      this._saveUsers();
    }
    
    localStorage.setItem('smartdash_current_user', JSON.stringify(this.currentUser));
    
    console.log('[AuthService] ✅ Profile updated');
    return true;
  },

  getUser() {
    return this.currentUser;
  },

  isAuthenticated() {
    return this.currentUser !== null;
  },

  isAdmin() {
    return this.currentUser && this.currentUser.isAdmin === true;
  },

  deleteUser(userId) {
    if (!this.isAdmin()) {
      return { success: false, error: 'Только администратор может удалять пользователей' };
    }
    
    if (userId === this.currentUser.id) {
      return { success: false, error: 'Нельзя удалить самого себя' };
    }
    
    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.users.splice(index, 1);
      this._saveUsers();
      return { success: true };
    }
    return { success: false, error: 'Пользователь не найден' };
  },

  getAllUsers() {
    if (!this.isAdmin()) {
      return [];
    }
    return this.users.map(({ password, ...rest }) => rest);
  },

  toggleTheme() {
    if (!this.currentUser) return;
    const newTheme = !this.currentUser.settings.darkTheme;
    this.currentUser.settings.darkTheme = newTheme;
    this.updateProfile({ settings: this.currentUser.settings });
    document.body.classList.toggle('dark-theme', newTheme);
    return newTheme;
  },

  _saveUsers() {
    try {
      // Удаление паролей перед сохранением
      const safeUsers = this.users.map(({ password, ...rest }) => rest);
      localStorage.setItem('smartdash_users', JSON.stringify(safeUsers));
      console.log('[AuthService] 💾 Users saved to localStorage:', safeUsers.length);
    } catch (e) {
      console.error('[AuthService] ❌ Error saving users:', e);
    }
  }
};

window.AuthService = AuthService;