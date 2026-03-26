/**
 * 📝 notes.test.js + 📊 tracker.test.js
 * Юнит-тесты для NotesModule (CRUD) и TrackerModule (статистика, бейджи)
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

global.confirm = jest.fn(() => true);
global.prompt = jest.fn();
global.alert = jest.fn();

// ============================
// DataService (мок)
// ============================
let _tasks = [];
let _notes = [];

const DataService = {
  collections: { tasks: _tasks, notes: _notes },

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
  }
};

// ============================
// AuthService (мок)
// ============================
let _currentUser = { id: "user_1", name: "Test", email: "t@t.com", totalPoints: 0, level: 1, settings: {} };
const AuthService = {
  getUser: () => _currentUser,
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
// NotesModule
// ============================
const NotesModule = {
  addNote(content) {
    if (!content || !content.trim()) return null;
    const note = { content: content.trim(), points: 5 };
    const created = DataService.create("notes", note);
    const user = AuthService.getUser();
    AuthService.updateProfile({ totalPoints: (user.totalPoints || 0) + 5 });
    NotificationService.show(NotificationService.types.SUCCESS, { points: 5 });
    return created;
  },

  editNote(id, content) {
    if (content === null) return null;
    return DataService.update("notes", id, { content: content.trim() });
  },

  deleteNote(id) {
    return DataService.delete("notes", id);
  },

  getNotes(userId) {
    return DataService.read("notes", { userId });
  }
};

// ============================
// TrackerModule (статистика + бейджи)
// ============================
const TrackerModule = {
  getStats(userId) {
    const tasks = DataService.read("tasks", { userId });
    const notes = DataService.read("notes", { userId });
    const completedTasks = tasks.filter(t => t.status === "completed");

    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      totalNotes: notes.length,
      totalPoints: _currentUser.totalPoints || 0,
      level: _currentUser.level || 1
    };
  },

  getBadges(userId) {
    const tasks = DataService.read("tasks", { userId });
    const completedCount = tasks.filter(t => t.status === "completed").length;

    return [
      { id: "first_task",    name: "Первый шаг",     unlocked: completedCount >= 1  },
      { id: "five_tasks",    name: "Пять задач",      unlocked: completedCount >= 5  },
      { id: "ten_tasks",     name: "Десять задач",    unlocked: completedCount >= 10 },
      { id: "twenty_tasks",  name: "Двадцать задач",  unlocked: completedCount >= 20 }
    ];
  },

  calculateLevel(totalPoints) {
    let level = 1;
    let threshold = 100;
    while (totalPoints >= threshold) {
      level++;
      threshold += 100 + (level - 1) * 50;
    }
    return level;
  }
};

// ============================
// ТЕСТЫ NOTES
// ============================
describe("NotesModule", () => {
  beforeEach(() => {
    _notes.length = 0;
    _currentUser.totalPoints = 0;
    NotificationService.show.mockClear();
  });

  describe("addNote()", () => {
    test("создаёт заметку с контентом", () => {
      const note = NotesModule.addNote("Купить хлеб");
      expect(note.content).toBe("Купить хлеб");
    });

    test("начисляет 5 очков за заметку", () => {
      NotesModule.addNote("Мысль");
      expect(_currentUser.totalPoints).toBe(5);
    });

    test("вызывает уведомление с points: 5", () => {
      NotesModule.addNote("Тест");
      expect(NotificationService.show).toHaveBeenCalledWith("success", { points: 5 });
    });

    test("возвращает null для пустого контента", () => {
      const note = NotesModule.addNote("   ");
      expect(note).toBeNull();
    });

    test("назначает userId", () => {
      const note = NotesModule.addNote("Тест");
      expect(note.userId).toBe("user_1");
    });

    test("накапливает очки за несколько заметок", () => {
      NotesModule.addNote("1");
      NotesModule.addNote("2");
      NotesModule.addNote("3");
      expect(_currentUser.totalPoints).toBe(15);
    });
  });

  describe("editNote()", () => {
    test("обновляет контент заметки", () => {
      const note = NotesModule.addNote("Старый");
      NotesModule.editNote(note.id, "Новый");
      const updated = DataService.read("notes").find(n => n.id === note.id);
      expect(updated.content).toBe("Новый");
    });

    test("возвращает null если content === null (отмена)", () => {
      const note = NotesModule.addNote("Тест");
      const result = NotesModule.editNote(note.id, null);
      expect(result).toBeNull();
    });
  });

  describe("deleteNote()", () => {
    test("удаляет заметку", () => {
      const note = NotesModule.addNote("Удалить");
      NotesModule.deleteNote(note.id);
      expect(DataService.read("notes").find(n => n.id === note.id)).toBeUndefined();
    });

    test("возвращает true при успешном удалении", () => {
      const note = NotesModule.addNote("Тест");
      const result = NotesModule.deleteNote(note.id);
      expect(result).toBe(true);
    });

    test("возвращает false для несуществующего id", () => {
      const result = NotesModule.deleteNote("fake_id");
      expect(result).toBe(false);
    });
  });

  describe("getNotes()", () => {
    test("возвращает только заметки текущего пользователя", () => {
      NotesModule.addNote("Заметка 1");
      NotesModule.addNote("Заметка 2");
      const notes = NotesModule.getNotes("user_1");
      expect(notes).toHaveLength(2);
    });
  });
});

// ============================
// ТЕСТЫ TRACKER
// ============================
describe("TrackerModule", () => {
  beforeEach(() => {
    _tasks.length = 0;
    _notes.length = 0;
    _currentUser.totalPoints = 0;
    _currentUser.level = 1;
  });

  describe("getStats()", () => {
    test("возвращает нули при пустых данных", () => {
      const stats = TrackerModule.getStats("user_1");
      expect(stats.totalTasks).toBe(0);
      expect(stats.completedTasks).toBe(0);
      expect(stats.totalNotes).toBe(0);
      expect(stats.totalPoints).toBe(0);
    });

    test("считает totalTasks", () => {
      DataService.create("tasks", { title: "1", status: "pending", points: 10, userId: "user_1" });
      DataService.create("tasks", { title: "2", status: "pending", points: 10, userId: "user_1" });
      const stats = TrackerModule.getStats("user_1");
      expect(stats.totalTasks).toBe(2);
    });

    test("считает только выполненные задачи", () => {
      DataService.create("tasks", { title: "1", status: "completed", points: 10, userId: "user_1" });
      DataService.create("tasks", { title: "2", status: "pending",   points: 10, userId: "user_1" });
      const stats = TrackerModule.getStats("user_1");
      expect(stats.completedTasks).toBe(1);
    });

    test("считает заметки", () => {
      DataService.create("notes", { content: "a", points: 5, userId: "user_1" });
      DataService.create("notes", { content: "b", points: 5, userId: "user_1" });
      const stats = TrackerModule.getStats("user_1");
      expect(stats.totalNotes).toBe(2);
    });

    test("отражает totalPoints из currentUser", () => {
      _currentUser.totalPoints = 150;
      const stats = TrackerModule.getStats("user_1");
      expect(stats.totalPoints).toBe(150);
    });
  });

  describe("getBadges()", () => {
    function completeTasks(count) {
      for (let i = 0; i < count; i++) {
        DataService.create("tasks", {
          title: `Задача ${i}`,
          status: "completed",
          points: 10,
          userId: "user_1"
        });
      }
    }

    test("все бейджи заблокированы при 0 задачах", () => {
      const badges = TrackerModule.getBadges("user_1");
      expect(badges.every(b => !b.unlocked)).toBe(true);
    });

    test("first_task разблокируется при 1 выполненной задаче", () => {
      completeTasks(1);
      const badges = TrackerModule.getBadges("user_1");
      expect(badges.find(b => b.id === "first_task").unlocked).toBe(true);
    });

    test("five_tasks заблокирован при 4 задачах", () => {
      completeTasks(4);
      const badges = TrackerModule.getBadges("user_1");
      expect(badges.find(b => b.id === "five_tasks").unlocked).toBe(false);
    });

    test("five_tasks разблокируется при 5 задачах", () => {
      completeTasks(5);
      const badges = TrackerModule.getBadges("user_1");
      expect(badges.find(b => b.id === "five_tasks").unlocked).toBe(true);
    });

    test("ten_tasks разблокируется при 10 задачах", () => {
      completeTasks(10);
      const badges = TrackerModule.getBadges("user_1");
      expect(badges.find(b => b.id === "ten_tasks").unlocked).toBe(true);
    });

    test("twenty_tasks разблокируется при 20 задачах", () => {
      completeTasks(20);
      const badges = TrackerModule.getBadges("user_1");
      expect(badges.find(b => b.id === "twenty_tasks").unlocked).toBe(true);
    });
  });

  describe("calculateLevel()", () => {
    test("уровень 1 при 0 очков", () => {
      expect(TrackerModule.calculateLevel(0)).toBe(1);
    });

    test("уровень 1 при 99 очков", () => {
      expect(TrackerModule.calculateLevel(99)).toBe(1);
    });

    test("уровень 2 при 100 очков", () => {
      expect(TrackerModule.calculateLevel(100)).toBe(2);
    });

    test("уровень 3 при 250 очков (100 + 150)", () => {
      expect(TrackerModule.calculateLevel(250)).toBe(3);
    });

    test("уровень растёт монотонно", () => {
      const levels = [0, 99, 100, 249, 250, 500].map(p => TrackerModule.calculateLevel(p));
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i]).toBeGreaterThanOrEqual(levels[i - 1]);
      }
    });
  });
});
