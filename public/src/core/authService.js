// === 🔐 AUTH SERVICE ===
const AuthService = {
  currentUser: null,
  users: [],

  init() {
    // Load users from localStorage
    const savedUsers = localStorage.getItem('smartdash_users');
    if (savedUsers) {
      this.users = JSON.parse(savedUsers);
    }
    
    // Check current session
    const savedUser = localStorage.getItem('smartdash_current_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  },

  register(name, email, password, isAdmin = false) {
    // Check if user exists
    if (this.users.find(u => u.email === email)) {
      return { success: false, error: 'Пользователь с таким email уже существует' };
    }
    
    const newUser = {
      id: 'user_' + Date.now(),
      name,
      email,
      password,
      isAdmin,
      totalPoints: 0,
      level: 1,
      avatar: null,
      createdAt: new Date().toISOString(),
      settings: { notifications: true, darkTheme: false }
    };
    
    this.users.push(newUser);
    this._saveUsers();
    return { success: true, user: newUser };
  },

  login(email, password) {
    const user = this.users.find(u => u.email === email && u.password === password);
    if (user) {
      this.currentUser = { ...user };
      delete this.currentUser.password;
      localStorage.setItem('smartdash_current_user', JSON.stringify(this.currentUser));
      return { success: true, user: this.currentUser };
    }
    return { success: false, error: 'Неверный email или пароль' };
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('smartdash_current_user');
    
    // ✅ ПРАВИЛЬНЫЙ ПУТЬ для GitHub Pages
    window.location.href = '/smart-dashboard/';
  },

  updateProfile(updates) {
    if (!this.currentUser) return false;
    
    this.currentUser = { ...this.currentUser, ...updates };
    
    // Update in users array
    const index = this.users.findIndex(u => u.id === this.currentUser.id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      this._saveUsers();
    }
    
    localStorage.setItem('smartdash_current_user', JSON.stringify(this.currentUser));
    return true;
  },

  getUser() {
    return this.currentUser;
  },

  isAuthenticated() {
    return this.currentUser !== null;
  },

  // ✅ ПРОВЕРКА ПРАВ АДМИНИСТРАТОРА
  isAdmin() {
    return this.currentUser && this.currentUser.isAdmin === true;
  },

  // ✅ УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ (только для админа)
  deleteUser(userId) {
    if (!this.isAdmin()) {
      return { success: false, error: 'Только администратор может удалять пользователей' };
    }
    
    // Нельзя удалить самого себя
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

  // ✅ ПОЛУЧИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ (только для админа)
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
    // Remove passwords before saving
    const safeUsers = this.users.map(({ password, ...rest }) => rest);
    localStorage.setItem('smartdash_users', JSON.stringify(safeUsers));
  }
};

// Экспортируем для использования в других модулях
window.AuthService = AuthService;