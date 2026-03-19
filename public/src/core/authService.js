// === 🔐 AUTH SERVICE ===
const AuthService = {
  currentUser: null,
  users: [],

  init() {
    console.log('[AuthService] Initializing...');
    
    // Load users from localStorage
    try {
      const savedUsers = localStorage.getItem('smartdash_users');
      if (savedUsers) {
        this.users = JSON.parse(savedUsers);
        console.log('[AuthService] Loaded users:', this.users.length);
      } else {
        this.users = [];
        console.log('[AuthService] No users found, starting fresh');
      }
    } catch (e) {
      console.error('[AuthService] Error loading users:', e);
      this.users = [];
    }
    
    // Check current session
    try {
      const savedUser = localStorage.getItem('smartdash_current_user');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
        console.log('[AuthService] Current user:', this.currentUser?.email);
      }
    } catch (e) {
      console.error('[AuthService] Error loading current user:', e);
      this.currentUser = null;
    }
  },

  register(name, email, password, isAdmin = false) {
    console.log('[AuthService] Register attempt:', { name, email, isAdmin });
    
    // Check if user exists
    const existingUser = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      console.log('[AuthService] User already exists:', email);
      return { success: false, error: 'Пользователь с таким email уже существует' };
    }
    
    const newUser = {
      id: 'user_' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
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
    
    console.log('[AuthService] User registered successfully:', newUser);
    return { success: true, user: newUser };
  },

  login(email, password) {
    console.log('[AuthService] Login attempt:', { email });
    
    const user = this.users.find(u => 
      u.email.toLowerCase() === email.trim().toLowerCase() && 
      u.password === password
    );
    
    if (user) {
      // Create session without password
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
      
      // Save to localStorage
      localStorage.setItem('smartdash_current_user', JSON.stringify(this.currentUser));
      
      console.log('[AuthService] Login successful:', this.currentUser);
      return { success: true, user: this.currentUser };
    }
    
    console.log('[AuthService] Login failed - user not found or wrong password');
    return { success: false, error: 'Неверный email или пароль' };
  },

  logout() {
    console.log('[AuthService] Logout');
    this.currentUser = null;
    localStorage.removeItem('smartdash_current_user');
    window.location.href = '/smart-dashboard/';
  },

  updateProfile(updates) {
    if (!this.currentUser) {
      console.log('[AuthService] No current user to update');
      return false;
    }
    
    console.log('[AuthService] Updating profile:', updates);
    
    // Update current user
    this.currentUser = { ...this.currentUser, ...updates };
    
    // Update in users array
    const index = this.users.findIndex(u => u.id === this.currentUser.id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      this._saveUsers();
    }
    
    // Save to localStorage
    localStorage.setItem('smartdash_current_user', JSON.stringify(this.currentUser));
    
    console.log('[AuthService] Profile updated successfully');
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
    try {
      // Remove passwords before saving
      const safeUsers = this.users.map(({ password, ...rest }) => rest);
      localStorage.setItem('smartdash_users', JSON.stringify(safeUsers));
      console.log('[AuthService] Users saved to localStorage:', safeUsers.length);
    } catch (e) {
      console.error('[AuthService] Error saving users:', e);
    }
  }
};

// Экспортируем для использования в других модулях
window.AuthService = AuthService;