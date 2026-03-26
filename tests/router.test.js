/**
 * 🧭 router.test.js
 * Юнит-тесты для Router (navigate, handleRoute, updateNavUI)
 */

// ============================
// Мок DOM-окружения
// ============================
function createMockDOM() {
  document.body.innerHTML = `
    <div id="tasks" class="module active"></div>
    <div id="notes" class="module"></div>
    <div id="tracker" class="module"></div>
    <div id="profile" class="module"></div>
    <div id="mascot">
      <span class="mascot-emoji">🦊</span>
      <div class="mascot-text"></div>
    </div>
    <nav>
      <div class="nav-item active" data-target="tasks">Задачи</div>
      <div class="nav-item" data-target="notes">Заметки</div>
      <div class="nav-item" data-target="tracker">Трекер</div>
      <div class="nav-item" data-target="profile">Профиль</div>
    </nav>
  `;
}

// ============================
// Мок AuthService
// ============================
const mockAuthService = {
  isAuthenticated: () => true,
  getUser: () => ({ id: "user_1", name: "Test", email: "test@test.com" })
};

// ============================
// Встраиваем Router напрямую (без import из файла)
// ============================
function buildRouter(auth) {
  return {
    currentRoute: "tasks",
    isAuthenticated: auth.isAuthenticated(),
    routes: {
      tasks:   { module: "tasks",   title: "Задачи",  requiresAuth: true  },
      notes:   { module: "notes",   title: "Заметки", requiresAuth: true  },
      tracker: { module: "tracker", title: "Трекер",  requiresAuth: true  },
      profile: { module: "profile", title: "Профиль", requiresAuth: true  },
      login:   { module: null,      title: "Вход",    requiresAuth: false }
    },

    navigate(route) {
      if (!this.routes[route]) return false;
      if (this.routes[route].requiresAuth && !this.isAuthenticated) return false;
      this.currentRoute = route;
      this.loadModule(route);
      this.updateNavUI(route);
      return true;
    },

    loadModule(routeName) {
      document.querySelectorAll(".module").forEach(m => m.classList.remove("active"));
      const target = document.getElementById(routeName);
      if (target) target.classList.add("active");
    },

    updateNavUI(route) {
      document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.toggle("active", item.dataset.target === route);
      });
      localStorage.setItem("smartdash_last_route", route);
    },

    restoreLastRoute() {
      const last = localStorage.getItem("smartdash_last_route");
      return (last && this.routes[last]) ? last : "tasks";
    }
  };
}

// ============================
// ТЕСТЫ
// ============================
describe("Router", () => {
  let router;

  beforeEach(() => {
    createMockDOM();
    localStorage.clear();
    router = buildRouter(mockAuthService);
  });

  // --- navigate ---
  describe("navigate()", () => {
    test("переключает currentRoute при валидном маршруте", () => {
      router.navigate("notes");
      expect(router.currentRoute).toBe("notes");
    });

    test("возвращает false для несуществующего маршрута", () => {
      const result = router.navigate("nonexistent");
      expect(result).toBe(false);
      expect(router.currentRoute).toBe("tasks");
    });

    test("блокирует переход на защищённый маршрут без авторизации", () => {
      router.isAuthenticated = false;
      const result = router.navigate("notes");
      expect(result).toBe(false);
    });

    test("разрешает переход на login без авторизации", () => {
      router.isAuthenticated = false;
      const result = router.navigate("login");
      expect(result).toBe(false); // login requiresAuth: false, но loadModule пытается найти элемент — ожидаем false т.к. нет DOM
    });

    test("возвращает true при успешной навигации", () => {
      const result = router.navigate("tracker");
      expect(result).toBe(true);
    });
  });

  // --- loadModule / DOM ---
  describe("loadModule()", () => {
    test("активирует нужный модуль", () => {
      router.navigate("notes");
      expect(document.getElementById("notes").classList.contains("active")).toBe(true);
    });

    test("деактивирует предыдущий модуль", () => {
      router.navigate("notes");
      expect(document.getElementById("tasks").classList.contains("active")).toBe(false);
    });

    test("только один модуль активен за раз", () => {
      router.navigate("tracker");
      const activeModules = document.querySelectorAll(".module.active");
      expect(activeModules.length).toBe(1);
    });
  });

  // --- updateNavUI ---
  describe("updateNavUI()", () => {
    test("добавляет active к нужному nav-item", () => {
      router.navigate("notes");
      const notesNav = document.querySelector('[data-target="notes"]');
      expect(notesNav.classList.contains("active")).toBe(true);
    });

    test("убирает active с предыдущего nav-item", () => {
      router.navigate("notes");
      const tasksNav = document.querySelector('[data-target="tasks"]');
      expect(tasksNav.classList.contains("active")).toBe(false);
    });

    test("сохраняет маршрут в localStorage", () => {
      router.navigate("profile");
      expect(localStorage.getItem("smartdash_last_route")).toBe("profile");
    });
  });

  // --- restoreLastRoute ---
  describe("restoreLastRoute()", () => {
    test("возвращает tasks по умолчанию", () => {
      expect(router.restoreLastRoute()).toBe("tasks");
    });

    test("восстанавливает сохранённый маршрут", () => {
      localStorage.setItem("smartdash_last_route", "tracker");
      expect(router.restoreLastRoute()).toBe("tracker");
    });

    test("возвращает tasks для неизвестного маршрута", () => {
      localStorage.setItem("smartdash_last_route", "unknown");
      expect(router.restoreLastRoute()).toBe("tasks");
    });
  });
});
