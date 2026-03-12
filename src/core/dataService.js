// === 💾 DATA SERVICE (Заглушка для MVP) ===
const DataService = {
  data: {
    tasks: [],
    notes: [],
    activityLog: []
  },

  init() {
    // Load from localStorage or use dummy data
    const savedData = localStorage.getItem('smartdash_data');
    if (savedData) {
      this.data = JSON.parse(savedData);
    }
  },

  // CRUD Operations
  async read(collection, id = null) {
    if (id) {
      return this.data[collection].find(item => item.id === id);
    }
    return this.data[collection];
  },

  async create(collection, item) {
    item.id = collection + '_' + Date.now();
    item.userId = AuthService.getUser()?.id || 'user_001';
    item.date = item.date || new Date().toISOString();
    this.data[collection].push(item);
    this.save();
    return item;
  },

  async update(collection, id, updates) {
    const index = this.data[collection].findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[collection][index] = { ...this.data[collection][index], ...updates };
      this.save();
      return this.data[collection][index];
    }
    return null;
  },

  async delete(collection, id) {
    const index = this.data[collection].findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[collection].splice(index, 1);
      this.save();
      return true;
    }
    return false;
  },

  save() {
    localStorage.setItem('smartdash_data', JSON.stringify(this.data));
  },

  logActivity(action, pointsEarned) {
    this.create('activityLog', {
      action,
      pointsEarned,
      timestamp: new Date().toISOString()
    });
  }
};

window.DataService = DataService;