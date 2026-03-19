// === 📋 TASKS UI ===
const TasksUI = {
  render(tasks, filter = 'all') {
    const container = document.getElementById('tasksList');
    if (!container) return;

    // Apply filter
    let filtered = tasks;
    if (filter !== 'all' && filter !== 'Все') {
      const typeMap = { 
        '🏠 Бытовые': 'household', 
        '💧 Здоровье': 'health', 
        '⭐ Привычки': 'habit',
        '📋 Другое': 'other'  // ✅ ДОБАВЛЕНО
      };
      filtered = tasks.filter(t => t.type === (typeMap[filter] || filter));
    }

    if (filtered.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Нет задач. Добавьте первую! ✨</p>';
      return;
    }

    container.innerHTML = filtered.map(task => this.renderTask(task)).join('');
  },

  // ✅ НОВАЯ ФУНКЦИЯ: Рендер одной задачи
  renderTask(task) {
    return `
      <div class="card ${task.status === 'completed' ? 'completed' : ''}" data-id="${task.id}">
        <div style="display:flex;align-items:center;gap:12px;">
          <!-- Checkbox с data-id для event delegation -->
          <div class="checkbox ${task.status === 'completed' ? 'checked' : ''}" 
               data-id="${task.id}">
            <svg viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
          <div style="flex:1;min-width:0;">
            <div class="card-title" style="${task.status === 'completed' ? 'text-decoration:line-through;opacity:0.7' : ''}">
              ${task.title}
            </div>
            <div class="card-meta">
              <span>${this.getTypeIcon(task.type)} ${this.getTypeName(task.type)}</span>
              <span class="points">+${task.points}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="edit-btn" data-id="${task.id}" style="background:none;border:none;color:var(--primary);cursor:pointer;font-size:18px;">✏️</button>
            <button class="delete-btn" data-id="${task.id}" style="background:none;border:none;color:var(--error);cursor:pointer;font-size:18px;">🗑️</button>
          </div>
        </div>
      </div>
    `;
  },

  // ✅ ИСПРАВЛЕНО: Поддержка категории "Другое"
  getTypeIcon(type) {
    const icons = { 
      household: '🏠', 
      health: '💧', 
      habit: '⭐',
      other: '📋'  // ✅ ДОБАВЛЕНО
    };
    return icons[type] || '📋';
  },

  // ✅ ИСПРАВЛЕНО: Поддержка категории "Другое"
  getTypeName(type) {
    const names = { 
      household: 'Бытовые', 
      health: 'Здоровье', 
      habit: 'Привычки',
      other: 'Другое'  // ✅ ДОБАВЛЕНО
    };
    return names[type] || type;
  }
};

// ✅ ГЛОБАЛЬНАЯ ФУНКЦИЯ для переключения задачи (использует DataService)
function toggleTask(taskId) {
  // Читаем задачи через DataService
  const allTasks = DataService.read('tasks');
  const task = allTasks.find(t => t.id === taskId);
  
  if (!task) return;
  
  // Переключаем статус
  const newStatus = task.status === 'completed' ? 'pending' : 'completed';
  
  // Обновляем через DataService
  DataService.update('tasks', taskId, { 
    status: newStatus,
    completedAt: newStatus === 'completed' ? new Date().toISOString() : null
  });
  
  // Если задача выполнена — начисляем баллы
  if (newStatus === 'completed') {
    const user = AuthService.getUser();
    if (user) {
      user.totalPoints = (user.totalPoints || 0) + task.points;
      AuthService.updateProfile({ totalPoints: user.totalPoints });
      
      // Показываем уведомление
      if (window.NotificationService) {
        NotificationService.show(NotificationService.types.SUCCESS, { points: task.points });
      }
    }
  }
  
  // Обновляем UI
  if (window.TasksModule) {
    TasksModule.loadTasks();
  }
  
  // Обновляем статистику в трекере
  if (window.TrackerModule) {
    TrackerModule.update();
  }
}

// Делаем функцию глобальной для доступа из HTML
window.toggleTask = toggleTask;

window.TasksUI = TasksUI;