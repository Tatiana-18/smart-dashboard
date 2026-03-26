// === 🔐 AUTH SERVICE (с поддержкой Supabase Backend) ===
//
// Если backend доступен — использует /api (Supabase).
// Если нет — fallback на localStorage (офлайн-режим).
//
// API_URL: в продакшене через nginx proxy всё идёт через /api,
//          в разработке — напрямую на localhost:4000
// ================================

const API_URL = window.location.hostname === "localhost"
  ? "http://localhost:4000/api"
  : "/api";

const AuthService = {
  currentUser: null,
  users: [],

  // ================================
  // Инициализация
  // ================================
  init() {
    console.log("[AuthService] Init - Loading data from localStorage...");

    const savedUsers = localStorage.getItem(Config.storageKeys.USERS);
    if (savedUsers) {
      try {
        this.users = JSON.parse(savedUsers);
        console.log("[AuthService] ✅ Loaded", this.users.length, "users");
      } catch (e) {
        console.error("[AuthService] ❌ Error parsing users:", e);
        this.users = [];
      }
    } else {
      this.users = [];
    }

    const savedUser = localStorage.getItem(Config.storageKeys.CURRENT_USER);
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        console.log("[AuthService] ✅ Current session:", this.currentUser?.email);
      } catch (e) {
        console.error("[AuthService] ❌ Error parsing current user:", e);
        this.currentUser = null;
      }
    }
  },

  // ================================
  // Регистрация (LocalStorage + опциональный API)
  // ================================
  register(name, email, password, isAdmin = false) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedPassword = password.trim();

    const existingUser = this.users.find(u => u.email === normalizedEmail);
    if (existingUser) {
      return { success: false, error: "Пользователь с таким email уже существует" };
    }

    const newUser = {
      id: "user_" + Date.now(),
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

    // Попытка зарегистрировать также в Supabase (non-blocking)
    this._registerToBackend(normalizedEmail, normalizedPassword, normalizedName)
      .catch(err => console.warn("[AuthService] Backend register failed (offline?):", err.message));

    return { success: true, user: newUser };
  },

  // ================================
  // Вход (LocalStorage + опциональный API)
  // ================================
  login(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const user = this.users.find(u =>
      u.email === normalizedEmail && u.password === normalizedPassword
    );

    if (user) {
      this.currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        totalPoints: user.totalPoints,
        level: user.level,
        avatar: user.avatar || null,
        settings: user.settings
      };

      localStorage.setItem(Config.storageKeys.CURRENT_USER, JSON.stringify(this.currentUser));

      // Попытка залогиниться в Supabase (non-blocking)
      this._loginToBackend(normalizedEmail, normalizedPassword)
        .then(data => {
          if (data?.session?.access_token) {
            localStorage.setItem("smartdash_supabase_token", data.session.access_token);
            console.log("[AuthService] Supabase session saved");
          }
        })
        .catch(err => console.warn("[AuthService] Backend login failed (offline?):", err.message));

      console.log("[AuthService] ✅ Login successful");
      return { success: true, user: this.currentUser };
    }

    return { success: false, error: "Неверный email или пароль" };
  },

  // ================================
  // Выход
  // ================================
  logout() {
    this.currentUser = null;
    localStorage.removeItem(Config.storageKeys.CURRENT_USER);
    localStorage.removeItem("smartdash_supabase_token");
    window.location.href = "./login.html";
  },

  // ================================
  // Обновление профиля
  // ================================
  updateProfile(updates) {
    if (!this.currentUser) return false;

    this.currentUser = { ...this.currentUser, ...updates };

    const index = this.users.findIndex(u => u.id === this.currentUser.id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      this._saveUsers();
    }

    localStorage.setItem(Config.storageKeys.CURRENT_USER, JSON.stringify(this.currentUser));

    console.log("[AuthService] updateProfile saved. avatar:", this.currentUser.avatar ? "present" : "null");
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
      return { success: false, error: "Только администратор может удалять пользователей" };
    }
    if (userId === this.currentUser.id) {
      return { success: false, error: "Нельзя удалить самого себя" };
    }
    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.users.splice(index, 1);
      this._saveUsers();
      return { success: true };
    }
    return { success: false, error: "Пользователь не найден" };
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
    document.body.classList.toggle("dark-theme", newTheme);
    return newTheme;
  },

  _saveUsers() {
    try {
      localStorage.setItem(Config.storageKeys.USERS, JSON.stringify(this.users));
    } catch (e) {
      console.error("[AuthService] ❌ Error saving users:", e);
    }
  },

  // ================================
  // Backend API вызовы (Supabase)
  // ================================
  async _registerToBackend(email, password, name) {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name })
    });
    return res.json();
  },

  async _loginToBackend(email, password) {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  // ================================
  // Публичные API методы (для прямого использования)
  // ================================
  async registerUser(email, password, name) {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name })
    });
    return res.json();
  },

  async loginUser(email, password) {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async getCurrentUserFromBackend() {
    const token = localStorage.getItem("smartdash_supabase_token");
    if (!token) return null;

    const res = await fetch(`${API_URL}/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) return null;
    return res.json();
  }
};

window.AuthService = AuthService;
