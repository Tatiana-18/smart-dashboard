// === 🔐 AUTH SERVICE (Заглушка для MVP) ===
const AuthService = {
  currentUser: null,

  init() {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('smartdash_user');
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
    }
  },

  login(email, password) {
    // MVP заглушка - всегда успешный вход
    this.currentUser = {
      id: 'user_001',
      email: email || 'user@example.com',
      name: 'Татьяна',
      totalPoints: 0
    };
    localStorage.setItem('smartdash_user', JSON.stringify(this.currentUser));
    return Promise.resolve(this.currentUser);
  },

  register(name, email, password) {
    // MVP заглушка
    return this.login(email, password);
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('smartdash_user');
    window.location.reload();
  },

  getUser() {
    return this.currentUser;
  },

  isAuthenticated() {
    return this.currentUser !== null;
  }
};

window.AuthService = AuthService;