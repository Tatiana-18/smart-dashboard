// === 📊 TRACKER MODULE ===
const TrackerModule = {
  init() {
    this.updateStats();
    this.renderActivityCalendar();
    this.renderBadges();
    this.renderProgress();
  },

  update() {
    this.updateStats();
    this.renderActivityCalendar();
  },

  updateStats() {
    const user = AuthService.getUser();
    if (!user) return;

    const tasks = DataService.read('tasks', { userId: user.id });
    const notes = DataService.read('notes', { userId: user.id });
    
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalPoints = user.totalPoints || 0;
    const level = user.level || 1;

    // Обновляем статистику
    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${totalPoints}</div>
          <div class="stat-label">Всего баллов</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${level}</div>
          <div class="stat-label">Уровень</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${completedTasks}</div>
          <div class="stat-label">Задач выполнено</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${notes.length}</div>
          <div class="stat-label">Заметок создано</div>
        </div>
      `;
    }
  },

  // ✅ ИСПРАВЛЕННЫЙ КАЛЕНДАРЬ АКТИВНОСТИ
  renderActivityCalendar() {
    const container = document.getElementById('activityCalendar');
    if (!container) return;

    const user = AuthService.getUser();
    if (!user) return;
    
    const tasks = DataService.read('tasks', { userId: user.id });
    const notes = DataService.read('notes', { userId: user.id });
    
    // Получаем данные за последние 7 дней
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Считаем выполненные задачи за день
      const tasksCompleted = tasks.filter(t => 
        t.status === 'completed' && 
        t.completedAt && 
        t.completedAt.startsWith(dateStr)
      ).length;
      
      // Считаем созданные заметки за день
      const notesCreated = notes.filter(n => 
        n.createdAt && n.createdAt.startsWith(dateStr)
      ).length;
      
      const total = tasksCompleted + notesCreated;
      
      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString('ru', { weekday: 'short' }),
        dayNum: date.getDate(),
        count: total,
        level: total === 0 ? 0 : total < 3 ? 1 : total < 5 ? 2 : 3
      });
    }
    
    container.innerHTML = `
      <div class="activity-calendar">
        <h3 style="margin-bottom:16px;font-size:18px;">📅 Активность за неделю</h3>
        <div class="calendar-grid">
          ${days.map(day => `
            <div class="calendar-day level-${day.level}" title="${day.date}: ${day.count} действий">
              <div class="day-name">${day.dayName}</div>
              <div class="day-num">${day.dayNum}</div>
              <div class="day-count">${day.count}</div>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;justify-content:center;align-items:center;">
          <span style="font-size:12px;color:var(--text-muted);">Меньше</span>
          <div class="calendar-legend level-0"></div>
          <div class="calendar-legend level-1"></div>
          <div class="calendar-legend level-2"></div>
          <div class="calendar-legend level-3"></div>
          <span style="font-size:12px;color:var(--text-muted);">Больше</span>
        </div>
      </div>
    `;
  },

  renderBadges() {
    const user = AuthService.getUser();
    if (!user) return;

    const tasks = DataService.read('tasks', { userId: user.id });
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    
    const badges = [
      { id: 'first_task', name: 'Первый шаг', icon: '🎯', condition: completedTasks >= 1 },
      { id: 'five_tasks', name: 'Пять задач', icon: '🌟', condition: completedTasks >= 5 },
      { id: 'ten_tasks', name: 'Десять задач', icon: '🏆', condition: completedTasks >= 10 },
      { id: 'early_bird', name: 'Ранний пташка', icon: '🌅', condition: completedTasks >= 1 },
      { id: 'night_owl', name: 'Сова', icon: '🦉', condition: completedTasks >= 1 }
    ];

    const badgesList = document.getElementById('badgesList');
    if (badgesList) {
      badgesList.innerHTML = badges.map(badge => `
        <div class="badge-item ${badge.condition ? 'unlocked' : 'locked'}">
          <div class="badge-icon">${badge.icon}</div>
          <div class="badge-name">${badge.name}</div>
        </div>
      `).join('');
    }
  },

  renderProgress() {
    const user = AuthService.getUser();
    if (!user) return;

    const tasks = DataService.read('tasks', { userId: user.id });
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const progressCard = document.getElementById('progressCard');
    if (progressCard) {
      progressCard.innerHTML = `
        <h3 style="margin-bottom:16px;font-size:18px;">📊 Прогресс выполнения</h3>
        <div class="progress-container">
          <div class="progress-fill" style="width:${progress}%"></div>
        </div>
        <div style="text-align:center;margin-top:8px;color:var(--text-muted);">
          ${completedTasks} из ${totalTasks} задач выполнено (${Math.round(progress)}%)
        </div>
      `;
    }
  }
};

window.TrackerModule = TrackerModule;