// === 🔐 AUTH SERVICE ===
const AuthService = {
  currentUser: null,
  users: [],

  init() {
    console.log('[AuthService] Initializing...');
    console.log('[AuthService] localStorage keys:', Object.keys(localStorage));
    
    // Load users from localStorage
    try {
      const savedUsers = localStorage.getItem('smartdash_users');
      console.log('[AuthService] Raw saved users:', savedUsers);
      
      if (savedUsers) {
        this.users = JSON.parse(savedUsers);
        console.log('[AuthService] ✅ Loaded users:', this.users.length);
        this.users.forEach(u => console.log('[AuthService]   -', u.email, u.name));
      } else {
        this.users = [];
        console.log('[AuthService] ⚠️ No users found in localStorage');
      }
    } catch (e) {
      console.error('[AuthService] ❌ Error loading users:', e);
      this.users = [];
    }
    
    // Check current session
    try {
      const savedUser = localStorage.getItem('smartdash_current_user');
      console.log('[AuthService] Raw saved current user:', savedUser);
      
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
        console.log('[AuthService] ✅ Current user:', this.currentUser?.email, this.currentUser?.name);
      } else {
        console.log('[AuthService] ⚠️ No current user session');
      }
    } catch (e) {
      console.error('[AuthService] ❌ Error loading current user:', e);
      this.currentUser = null;
    }
  },

  register(name, email, password, isAdmin = false) {
    console.log('[AuthService] 📝 Register attempt:', { name, email, isAdmin });
    
    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if user exists
    const existingUser = this.users.find(u => u.email === normalizedEmail);
    if (existingUser) {
      console.log('[AuthService] ❌ User already exists:', normalizedEmail);
      return { success: false, error: 'Пользователь с таким email уже существует' };
    }
    
    const newUser = {
      id: 'user_' + Date.now(),
      name: name.trim(),
      email: normalizedEmail,
      password: password,
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
    
    console.log('[AuthService] ✅ User registered successfully:', newUser);
    console.log('[AuthService] Total users now:', this.users.length);
    
    return { success: true, user: newUser };
  },

  login(email, password) {
    console.log('[AuthService] 🔑 Login attempt:', { email });
    
    const normalizedEmail = email.trim().toLowerCase();
    
    console.log('[AuthService] Searching for email:', normalizedEmail);
    console.log('[AuthService] All users:', this.users.map(u => u.email));
    
    const user = this.users.find(u => {
      const match = u.email === normalizedEmail && u.password === password;
      console.log('[AuthService] Checking user:', u.email, 'Match:', match);
      return match;
    });
    
    if (user) {
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
      
      localStorage.setItem('smartdash_current_user', JSON.stringify(this.currentUser));
      
      console.log('[AuthService] ✅ Login successful:', this.currentUser);
      console.log('[AuthService] Saved to localStorage:', localStorage.getItem('smartdash_current_user'));
      
      return { success: true, user: this.currentUser };
    }
    
    console.log('[AuthService] ❌ Login failed - user not found or wrong password');
    console.log('[AuthService] Available users:', this.users.map(u => u.email));
    
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
      const safeUsers = this.users.map(({ password, ...rest }) => rest);
      localStorage.setItem('smartdash_users', JSON.stringify(safeUsers));
      console.log('[AuthService] 💾 Users saved to localStorage:', safeUsers.length);
      console.log('[AuthService] Saved users:', safeUsers.map(u => u.email));
    } catch (e) {
      console.error('[AuthService] ❌ Error saving users:', e);
    }
  }
};

window.AuthService = AuthService;