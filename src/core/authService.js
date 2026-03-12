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

  register(name, email, password) {
    // Check if user exists
    if (this.users.find(u => u.email === email)) {
      return { success: false, error: 'Пользователь с таким email уже существует' };
    }
    
    const newUser = {
      id: 'user_' + Date.now(),
      name,
      email,
      password, // В реальном проекте — хешировать!
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
    window.location.href = 'index.html';
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

window.AuthService = AuthService;