// === 📋 TASKS UI ===
const TasksUI = {
  render(tasks, filter = 'all') {
    const container = document.getElementById('tasksList');
    if (!container) return;

    // Apply filter
    let filtered = tasks;
    if (filter !== 'all' && filter !== 'Все') {
      const typeMap = { '🏠 Бытовые': 'household', '💧 Здоровье': 'health', '⭐ Привычки': 'habit' };
      filtered = tasks.filter(t => t.type === (typeMap[filter] || filter));
    }

    if (filtered.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Нет задач. Добавьте первую! ✨</p>';
      return;
    }

    container.innerHTML = filtered.map(task => `
      <div class="card ${task.status === 'completed' ? 'completed' : ''}">
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="checkbox ${task.status === 'completed' ? 'checked' : ''}" 
               data-id="${task.id}">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
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
    `).join('');
  },

  getTypeIcon(type) {
    const icons = { household: '🏠', health: '💧', habit: '⭐' };
    return icons[type] || '📋';
  },

  getTypeName(type) {
    const names = { household: 'Бытовые', health: 'Здоровье', habit: 'Привычки' };
    return names[type] || type;
  }
};

window.TasksUI = TasksUI;