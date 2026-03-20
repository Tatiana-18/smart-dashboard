// === 💾 DATA SERVICE ===
const DataService = {
  collections: {
    tasks: [],
    notes: [],
    activityLog: [],
    achievements: []
  },

  init() {
    // Load from localStorage
    Object.keys(this.collections).forEach(key => {
      const saved = localStorage.getItem(`smartdash_${key}`);
      if (saved) {
        this.collections[key] = JSON.parse(saved);
      }
    });
    
    // Initialize default achievements
    if (this.collections.achievements.length === 0) {
      this._initAchievements();
    }
  },

  _initAchievements() {
    this.collections.achievements = [
      { id: 'ach_1', name: '🌱 Первый шаг', desc: 'Выполнить 1 задачу', unlocked: false, date: null },
      { id: 'ach_2', name: '🔥 Неделя огня', desc: '7 дней подряд без пропусков', unlocked: false, date: null },
      { id: 'ach_3', name: '💧 Здоровье', desc: 'Выполнить 20 задач типа «Здоровье»', unlocked: false, date: null },
      { id: 'ach_4', name: '📚 Читатель', desc: 'Создать 10 заметок', unlocked: false, date: null },
      { id: 'ach_5', name: '⭐ Ранний пташка', desc: 'Выполнить задачу до 8:00', unlocked: false, date: null },
      { id: 'ach_6', name: '🎯 Целеустремлённый', desc: 'Набрать 1000 баллов', unlocked: false, date: null },
      { id: 'ach_7', name: '🏆 Мастер привычек', desc: '30 дней стрика', unlocked: false, date: null },
      { id: 'ach_8', name: '💡 Идейный', desc: '50 созданных заметок', unlocked: false, date: null },
      { id: 'ach_9', name: '🚀 Прогресс', desc: 'Повысить уровень 3 раза', unlocked: false, date: null },
      { id: 'ach_10', name: '👑 Легенда', desc: 'Выполнить 100 задач', unlocked: false, date: null }
    ];
    this._save('achievements');
  },

  // CRUD Operations
  read(collection, query = {}) {
    let items = this.collections[collection] || [];
    
    // Filter by userId if provided
    if (query.userId) {
      items = items.filter(item => item.userId === query.userId);
    }
    
    // Additional filters
    if (query.type) {
      items = items.filter(item => item.type === query.type);
    }
    if (query.status) {
      items = items.filter(item => item.status === query.status);
    }
    
    return items;
  },

  create(collection, item) {
    const userId = AuthService.getUser()?.id;
    if (!userId) return null;
    
    const newItem = {
      id: collection + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      userId,
      createdAt: new Date().toISOString(),
      ...item
    };
    
    if (!this.collections[collection]) {
      this.collections[collection] = [];
    }
    this.collections[collection].push(newItem);
    this._save(collection);
    
    return newItem;
  },

  update(collection, id, updates) {
    const index = this.collections[collection]?.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    this.collections[collection][index] = { 
      ...this.collections[collection][index], 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this._save(collection);
    return this.collections[collection][index];
  },

  delete(collection, id) {
    const index = this.collections[collection]?.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    this.collections[collection].splice(index, 1);
    this._save(collection);
    return true;
  },

  _logActivity(action, pointsEarned) {
    const user = AuthService.getUser();
    if (!user) return;
    
    this.create('activityLog', {
      action,
      pointsEarned,
      timestamp: new Date().toISOString()
    });
    
    // Update user points
    user.totalPoints = (user.totalPoints || 0) + pointsEarned;
    AuthService.updateProfile({ totalPoints: user.totalPoints });
    
    // Check achievements
    this._checkAchievements(action, pointsEarned);
  },

  _checkAchievements(action, pointsEarned) {
    const user = AuthService.getUser();
    if (!user) return;
    
    const tasks = this.read('tasks', { userId: user.id });
    const notes = this.read('notes', { userId: user.id });
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    const achievements = this.collections.achievements;
    
    // Check each achievement
    achievements.forEach(ach => {
      if (ach.unlocked) return;
      
      let shouldUnlock = false;
      
      switch(ach.id) {
        case 'ach_1': // Первый шаг
          shouldUnlock = completedTasks.length >= 1;
          break;
        case 'ach_3': // Здоровье
          shouldUnlock = tasks.filter(t => t.type === 'health' && t.status === 'completed').length >= 20;
          break;
        case 'ach_4': // Читатель
          shouldUnlock = notes.length >= 10;
          break;
        case 'ach_6': // Целеустремлённый
          shouldUnlock = user.totalPoints >= 1000;
          break;
        case 'ach_8': // Идейный
          shouldUnlock = notes.length >= 50;
          break;
        case 'ach_10': // Легенда
          shouldUnlock = completedTasks.length >= 100;
          break;
      }
      
      if (shouldUnlock) {
        ach.unlocked = true;
        ach.date = new Date().toISOString();
        ach.unlockedBy = user.id;
        NotificationService.show('🏆 Новое достижение!', `Вы получили: ${ach.name}`);
      }
    });
    
    this._save('achievements');
  },

  _save(collection) {
    localStorage.setItem(`smartdash_${collection}`, JSON.stringify(this.collections[collection]));
  },

  getStats(userId) {
    const tasks = this.read('tasks', { userId });
    const notes = this.read('notes', { userId });
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      totalNotes: notes.length,
      totalPoints: tasks.reduce((sum, t) => t.status === 'completed' ? sum + (t.points || 0) : sum, 0) + 
                   notes.reduce((sum, n) => sum + (n.points || 0), 0),
      healthTasks: tasks.filter(t => t.type === 'health' && t.status === 'completed').length,
      streak: this._calculateStreak(tasks)
    };
  },

  _calculateStreak(tasks) {
    // Simple streak calculation (can be enhanced)
    const completed = tasks
      .filter(t => t.status === 'completed')
      .map(t => new Date(t.date || t.createdAt).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i); // unique days
    
    // Count consecutive days from today backwards
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      if (completed.includes(checkDate.toDateString())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }
};

window.DataService = DataService;