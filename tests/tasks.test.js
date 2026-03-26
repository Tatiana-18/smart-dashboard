/**
 * 📋 tasks.test.js
 * Юнит-тесты для TasksModule (CRUD, подсчёт очков, стрики)
 */

// ============================
// Мок localStorage
// ============================
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] ?? null,
  setItem: (k, v) => { mockStorage[k] = v; },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

// ============================
// Мок window.confirm и prompt
// ============================
global.confirm = jest.fn(() => true);
global.prompt = jest.fn();
global.alert = jest.fn();

// ============================
// DataService (встроенный мок)
// ============================
let _tasks = [];
let _notes = [];

const DataService = {
  collections: { tasks: _tasks, notes: _notes },

  init() {},

  read(collection, query = {}) {
    let items = [...(this.collections[collection] || [])];
    if (query.userId) items = items.filter(i => i.userId === query.userId);
    if (query.status) items = items.filter(i => i.status === query.status);
    return items;
  },

  create(collection, item) {
    const newItem = {
      id: collection + "_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      userId: "user_1",
      createdAt: new Date().toISOString(),
      ...item
    };
    this.collections[collection].push(newItem);
    return newItem;
  },

  update(collection, id, updates) {
    const idx = this.collections[collection].findIndex(i => i.id === id);
    if (idx === -1) return null;
    this.collections[collection][idx] = { ...this.collections[collection][idx], ...updates };
    return this.collections[collection][idx];
  },

  delete(collection, id) {
    const idx = this.collections[collection].findIndex(i => i.id === id);
    if (idx === -1) return false;
    this.collections[collection].splice(idx, 1);
    return true;
  },

  _calculateStreak(tasks) {
    const completed = tasks
      .filter(t => t.status === "completed")
      .map(t => new Date(t.date || t.createdAt).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i);

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (completed.includes(d.toDateString())) streak++;
      else if (i > 0) break;
    }
    return streak;
  }
};

// ============================
// AuthService (мок)
// ============================
let _currentUser = { id: "user_1", name: "Test", email: "t@t.com", totalPoints: 0, level: 1, settings: {} };
const AuthService = {
  getUser: () => _currentUser,
  isAuthenticated: () => true,
  updateProfile: (updates) => { _currentUser = { ..._currentUser, ...updates }; return true; }
};

// ============================
// NotificationService (мок)
// ============================
const NotificationService = {
  types: { SUCCESS: "success", ERROR: "error", INFO: "info" },
  show: jest.fn()
};

// ============================
// Минимальный TasksModule
// ============================
const TasksModule = {
  addTask(title, type = "other", points = 10) {
    const user = AuthService.getUser();
    const task = {
      userId: user.id,
      title: title.trim(),
      type,
      status: "pending",
      points,
      date: new Date().toISOString(),
      completedAt: null
    };
    return DataService.create("tasks", task);
  },

  toggleTask(id) {
    const allTasks = DataService.read("tasks");
    const task = allTasks.find(t => t.id === id);
    if (!task) return;

    const oldStatus = task.status;
    const newStatus = oldStatus === "completed" ? "pending" : "completed";

    DataService.update("tasks", id, {
      status: newStatus,
      completedAt: newStatus === "completed" ? new Date().toISOString() : null
    });

    const user = AuthService.getUser();
    const oldPoints = user.totalPoints || 0;

    if (newStatus === "completed" && oldStatus === "pending") {
      AuthService.updateProfile({ totalPoints: oldPoints + task.points });
      NotificationService.show(NotificationService.types.SUCCESS, { points: task.points });
    } else if (newStatus === "pending" && oldStatus === "completed") {
      AuthService.updateProfile({ totalPoints: Math.max(0, oldPoints - task.points) });
    }

    return DataService.read("tasks").find(t => t.id === id);
  },

  deleteTask(id) {
    const task = DataService.read("tasks").find(t => t.id === id);
    if (!task) return false;

    if (task.status === "completed") {
      const user = AuthService.getUser();
      AuthService.updateProfile({ totalPoints: Math.max(0, (user.totalPoints || 0) - task.points) });
    }

    return DataService.delete("tasks", id);
  },

  editTask(id, title, points) {
    return DataService.update("tasks", id, { title: title.trim(), points });
  },

  getStreak() {
    const user = AuthService.getUser();
    const tasks = DataService.read("tasks", { userId: user.id });
    return DataService._calculateStreak(tasks);
  }
};

// ============================
// ТЕСТЫ
// ============================
describe("TasksModule", () => {
  beforeEach(() => {
    _tasks.length = 0;
    _currentUser.totalPoints = 0;
    NotificationService.show.mockClear();
  });

  // --- Создание задач ---
  describe("addTask()", () => {
    test("создаёт задачу со статусом pending", () => {
      const task = TasksModule.addTask("Купить молоко");
      expect(task.status).toBe("pending");
    });

    test("не начисляет очки при создании", () => {
      TasksModule.addTask("Задача", "health", 20);
      expect(_currentUser.totalPoints).toBe(0);
    });

    test("сохраняет title и points", () => {
      const task = TasksModule.addTask("Зарядка", "health", 15);
      expect(task.title).toBe("Зарядка");
      expect(task.points).toBe(15);
    });

    test("назначает userId текущего пользователя", () => {
      const task = TasksModule.addTask("Тест");
      expect(task.userId).toBe("user_1");
    });

    test("completedAt равен null при создании", () => {
      const task = TasksModule.addTask("Тест");
      expect(task.completedAt).toBeNull();
    });
  });

  // --- Выполнение задач ---
  describe("toggleTask() — pending → completed", () => {
    test("начисляет очки при выполнении", () => {
      const task = TasksModule.addTask("Задача", "other", 10);
      TasksModule.toggleTask(task.id);
      expect(_currentUser.totalPoints).toBe(10);
    });

    test("меняет статус на completed", () => {
      const task = TasksModule.addTask("Задача");
      const updated = TasksModule.toggleTask(task.id);
      expect(updated.status).toBe("completed");
    });

    test("вызывает успешное уведомление", () => {
      const task = TasksModule.addTask("Задача", "other", 5);
      TasksModule.toggleTask(task.id);
      expect(NotificationService.show).toHaveBeenCalledWith("success", { points: 5 });
    });
  });

  // --- Отмена выполнения ---
  describe("toggleTask() — completed → pending", () => {
    test("вычитает очки при отмене", () => {
      const task = TasksModule.addTask("Задача", "other", 10);
      TasksModule.toggleTask(task.id); // completed, +10
      TasksModule.toggleTask(task.id); // pending, -10
      expect(_currentUser.totalPoints).toBe(0);
    });

    test("не уходит в минус при недостатке очков", () => {
      const task = TasksModule.addTask("Задача", "other", 100);
      TasksModule.toggleTask(task.id); // +100
      _currentUser.totalPoints = 5; // искусственно уменьшаем
      TasksModule.toggleTask(task.id); // -100, но не < 0
      expect(_currentUser.totalPoints).toBe(0);
    });
  });

  // --- Удаление задач ---
  describe("deleteTask()", () => {
    test("удаляет задачу из коллекции", () => {
      const task = TasksModule.addTask("Задача");
      TasksModule.deleteTask(task.id);
      expect(DataService.read("tasks").find(t => t.id === task.id)).toBeUndefined();
    });

    test("вычитает очки если задача была выполнена", () => {
      const task = TasksModule.addTask("Задача", "other", 10);
      TasksModule.toggleTask(task.id); // +10
      TasksModule.deleteTask(task.id); // -10
      expect(_currentUser.totalPoints).toBe(0);
    });

    test("не вычитает очки если задача pending", () => {
      const task = TasksModule.addTask("Задача", "other", 10);
      TasksModule.deleteTask(task.id);
      expect(_currentUser.totalPoints).toBe(0);
    });
  });

  // --- Редактирование ---
  describe("editTask()", () => {
    test("обновляет title", () => {
      const task = TasksModule.addTask("Старый");
      TasksModule.editTask(task.id, "Новый", 10);
      const updated = DataService.read("tasks").find(t => t.id === task.id);
      expect(updated.title).toBe("Новый");
    });

    test("обновляет points", () => {
      const task = TasksModule.addTask("Задача", "other", 10);
      TasksModule.editTask(task.id, "Задача", 25);
      const updated = DataService.read("tasks").find(t => t.id === task.id);
      expect(updated.points).toBe(25);
    });
  });

  // --- Стрик ---
  describe("getStreak()", () => {
    test("стрик 0 при отсутствии выполненных задач", () => {
      TasksModule.addTask("Задача");
      expect(TasksModule.getStreak()).toBe(0);
    });

    test("стрик 1 при выполнении задачи сегодня", () => {
      const task = TasksModule.addTask("Задача");
      TasksModule.toggleTask(task.id);
      expect(TasksModule.getStreak()).toBe(1);
    });
  });
});
