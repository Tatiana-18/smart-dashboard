// === 🔐 AUTH SERVICE ===
const AuthService = {
  currentUser: null,
  users: [],

  init() {
    console.log('[AuthService] Init - Loading data from localStorage...');
    
    const savedUsers = localStorage.getItem(Config.storageKeys.USERS);
    if (savedUsers) {
      try {
        this.users = JSON.parse(savedUsers);
        console.log('[AuthService] ✅ Loaded', this.users.length, 'users');
      } catch (e) {
        console.error('[AuthService] ❌ Error parsing users:', e);
        this.users = [];
      }
    } else {
      this.users = [];
    }
    
    const savedUser = localStorage.getItem(Config.storageKeys.CURRENT_USER);
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
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedPassword = password.trim();
    
    const existingUser = this.users.find(u => u.email === normalizedEmail);
    if (existingUser) {
      return { success: false, error: 'Пользователь с таким email уже существует' };
    }
    
    const newUser = {
      id: 'user_' + Date.now(),
      name: normalizedName,
      email: normalizedEmail,
      password: normalizedPassword,
      isAdmin: isAdmin || false,
      totalPoints: 0,
      level: 1,
      avatar: null,         // ← явно null
      createdAt: new Date().toISOString(),
      settings: { 
        notifications: true, 
        darkTheme: false 
      }
    };
    
    this.users.push(newUser);
    this._saveUsers();
    
    return { success: true, user: newUser };
  },

  login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    
    const user = this.users.find(u =>
      u.email === normalizedEmail && u.password === normalizedPassword
    );
    
    if (user) {
      // ✅ Включаем avatar в сессию
      this.currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        totalPoints: user.totalPoints,
        level: user.level,
        avatar: user.avatar || null,   // ← берём из users[]
        settings: user.settings
      };
      
      localStorage.setItem(Config.storageKeys.CURRENT_USER, JSON.stringify(this.currentUser));
      
      console.log('[AuthService] ✅ Login successful, avatar:', this.currentUser.avatar ? 'present' : 'none');
      return { success: true, user: this.currentUser };
    }
    
    return { success: false, error: 'Неверный email или пароль' };
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem(Config.storageKeys.CURRENT_USER);
    window.location.href = '/smart-dashboard/';
  },

  updateProfile(updates) {
    if (!this.currentUser) return false;
    
    // Обновляем currentUser в памяти
    this.currentUser = { ...this.currentUser, ...updates };
    
    // Обновляем в массиве users[]
    const index = this.users.findIndex(u => u.id === this.currentUser.id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      this._saveUsers();
    }
    
    // Сохраняем сессию с обновлёнными данными (включая avatar)
    localStorage.setItem(Config.storageKeys.CURRENT_USER, JSON.stringify(this.currentUser));
    
    console.log('[AuthService] updateProfile saved. avatar:', this.currentUser.avatar ? 'present' : 'null');
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
    if (!this.isAdmin()) return [];
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
      localStorage.setItem(Config.storageKeys.USERS, JSON.stringify(this.users));
    } catch (e) {
      console.error('[AuthService] ❌ Error saving users:', e);
    }
  }
};

window.AuthService = AuthService;
