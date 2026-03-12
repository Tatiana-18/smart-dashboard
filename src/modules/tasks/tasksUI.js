// === 📋 TASKS UI ===
const TasksUI = {
  render(tasks) {
    const container = document.getElementById('tasksList');
    if (!container) return;

    container.innerHTML = tasks.map(task => `
      <div class="card ${task.status === 'completed' ? 'completed' : ''}">
        <div style="display:flex;align-items:center;">
          <div class="checkbox ${task.status === 'completed' ? 'checked' : ''}" 
               onclick="TasksModule.toggleTask('${task.id}')">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
          <div style="flex:1;">
            <div class="card-title">${task.title}</div>
            <div class="card-meta">
              <span>${this.getTypeIcon(task.type)} ${this.getTypeName(task.type)}</span>
              <span class="points">+${task.points}</span>
            </div>
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