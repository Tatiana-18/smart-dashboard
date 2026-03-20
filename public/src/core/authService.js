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
        this.users.forEach(u => {
          console.log('  - Email:', u.email, '| Name:', u.name, '| ID:', u.id, '| Password:', u.password);
        });
      } catch (e) {
        console.error('[AuthService] ❌ Error parsing users:', e);
        this.users = [];
      }
    } else {
      this.users = [];
      console.log('[AuthService] ⚠️ No users in localStorage');
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
    console.log('[AuthService] 📝 Register attempt:', { name, email, isAdmin });
    
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedPassword = password.trim();
    
    console.log('[AuthService] Normalized:', { 
      email: normalizedEmail, 
      name: normalizedName, 
      password: normalizedPassword,
      passwordLength: normalizedPassword.length
    });
    
    const existingUser = this.users.find(u => u.email === normalizedEmail);
    if (existingUser) {
      console.log('[AuthService] ❌ User already exists:', normalizedEmail);
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
      avatar: null,
      createdAt: new Date().toISOString(),
      settings: { 
        notifications: true, 
        darkTheme: false 
      }
    };
    
    this.users.push(newUser);
    this._saveUsers();
    
    console.log('[AuthService] ✅ User registered:', {
      email: newUser.email,
      password: newUser.password,
      passwordLength: newUser.password.length
    });
    
    return { success: true, user: newUser };
  },

  login(email, password) {
    console.log('[AuthService] 🔑 Login attempt:', { 
      email: email, 
      password: password,
      passwordLength: password.length 
    });
    
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    
    console.log('[AuthService] Normalized login:', { 
      email: normalizedEmail, 
      password: normalizedPassword,
      passwordLength: normalizedPassword.length 
    });
    
    console.log('[AuthService] Searching for email:', normalizedEmail);
    console.log('[AuthService] All users in DB:', this.users.map(u => ({ 
      email: u.email, 
      savedPassword: u.password,
      length: u.password.length 
    })));
    
    const user = this.users.find(u => {
      const emailMatch = u.email === normalizedEmail;
      const passwordMatch = u.password === normalizedPassword;
      
      console.log('[AuthService] Checking user:', {
        savedEmail: u.email,
        savedPassword: u.password,
        savedPasswordLength: u.password.length,
        inputEmail: normalizedEmail,
        inputPassword: normalizedPassword,
        inputPasswordLength: normalizedPassword.length,
        emailMatch: emailMatch,
        passwordMatch: passwordMatch,
        emailMatchType: typeof u.email === typeof normalizedEmail,
        passwordMatchType: typeof u.password === typeof normalizedPassword
      });
      
      return emailMatch && passwordMatch;
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
      
      localStorage.setItem(Config.storageKeys.CURRENT_USER, JSON.stringify(this.currentUser));
      
      console.log('[AuthService] ✅ Login successful:', this.currentUser);
      return { success: true, user: this.currentUser };
    }
    
    console.log('[AuthService] ❌ Login failed - user not found or wrong password');
    console.log('[AuthService] Available users:', this.users.map(u => u.email));
    
    return { success: false, error: 'Неверный email или пароль' };
  },

  logout() {
    console.log('[AuthService] 🚪 Logout');
    this.currentUser = null;
    localStorage.removeItem(Config.storageKeys.CURRENT_USER);
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
    
    localStorage.setItem(Config.storageKeys.CURRENT_USER, JSON.stringify(this.currentUser));
    
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
      localStorage.setItem(Config.storageKeys.USERS, JSON.stringify(safeUsers));
      console.log('[AuthService] 💾 Users saved to localStorage:', safeUsers.length);
    } catch (e) {
      console.error('[AuthService] ❌ Error saving users:', e);
    }
  }
};

window.AuthService = AuthService;