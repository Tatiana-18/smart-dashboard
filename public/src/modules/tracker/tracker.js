// === 📊 TRACKER MODULE ===
const TrackerModule = {
  init() {
    this.updateStats();
    this.renderActivityCalendar();
    this.renderBadges();
    this.renderProgress();
    this.renderLevelProgress();
  },

  update() {
    this.updateStats();
    this.renderActivityCalendar();
    this.renderBadges();
    this.renderProgress();
    this.renderLevelProgress();
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

  // ✅ КАЛЕНДАРЬ АКТИВНОСТИ
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
        <div style="display:flex;gap:8px;margin-top:12px;justify-content:center;align-items:center;flex-wrap:wrap;">
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

  // ✅ ПРОГРЕСС ПО УРОВНЯМ
  renderLevelProgress() {
    const user = AuthService.getUser();
    if (!user) return;

    const currentPoints = user.totalPoints || 0;
    const currentLevel = user.level || 1;
    
    // Формула: для перехода на следующий уровень нужно level * 100 баллов
    const pointsForCurrentLevel = (currentLevel - 1) * 100;
    const pointsForNextLevel = currentLevel * 100;
    const pointsInCurrentLevel = currentPoints - pointsForCurrentLevel;
    const pointsNeeded = pointsForNextLevel - pointsForCurrentLevel;
    const progressPercent = Math.min((pointsInCurrentLevel / pointsNeeded) * 100, 100);

    const progressCard = document.getElementById('progressCard');
    if (progressCard) {
      progressCard.innerHTML = `
        <h3 style="margin-bottom:16px;font-size:18px;">📊 Прогресс до ${currentLevel + 1} уровня</h3>
        <div style="text-align:center;margin-bottom:12px;color:var(--text-muted);">
          Уровень ${currentLevel}: ${pointsInCurrentLevel} из ${pointsNeeded} баллов
        </div>
        <div class="progress-container">
          <div class="progress-fill" style="width:${progressPercent}%"></div>
        </div>
        <div style="text-align:center;margin-top:8px;color:var(--text-muted);font-size:14px;">
          Осталось: ${pointsNeeded - pointsInCurrentLevel} баллов
        </div>
      `;
    }
  },

  // ✅ ПРОГРЕСС ВЫПОЛНЕНИЯ (старый)
  renderProgress() {
    const user = AuthService.getUser();
    if (!user) return;

    const tasks = DataService.read('tasks', { userId: user.id });
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Создаём контейнер если нет
    let progressContainer = document.getElementById('taskProgressCard');
    if (!progressContainer) {
      // Ищем где вставить после activityCalendar
      const activityCal = document.getElementById('activityCalendar');
      if (activityCal && activityCal.parentNode) {
        progressContainer = document.createElement('div');
        progressContainer.id = 'taskProgressCard';
        progressContainer.className = 'card';
        activityCal.parentNode.insertBefore(progressContainer, activityCal.nextSibling);
      }
    }
    
    if (progressContainer) {
      progressContainer.innerHTML = `
        <h3 style="margin-bottom:16px;font-size:18px;">📋 Прогресс выполнения задач</h3>
        <div class="progress-container">
          <div class="progress-fill" style="width:${progress}%"></div>
        </div>
        <div style="text-align:center;margin-top:8px;color:var(--text-muted);">
          ${completedTasks} из ${totalTasks} задач выполнено (${Math.round(progress)}%)
        </div>
      `;
    }
  },

  // ✅ ДОСТИЖЕНИЯ С КЛИКАМИ
  renderBadges() {
    const user = AuthService.getUser();
    if (!user) return;

    const tasks = DataService.read('tasks', { userId: user.id });
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    
    // Проверяем достижения
    const badges = [
      { 
        id: 'first_task', 
        name: 'Первый шаг', 
        icon: '🎯', 
        unlocked: completedTasks >= 1,
        condition: 'Выполните 1 задачу',
        description: 'Вы выполнили свою первую задачу!'
      },
      { 
        id: 'five_tasks', 
        name: 'Пять задач', 
        icon: '🌟', 
        unlocked: completedTasks >= 5,
        condition: 'Выполните 5 задач',
        description: 'Вы выполнили 5 задач! Так держать!'
      },
      { 
        id: 'ten_tasks', 
        name: 'Десять задач', 
        icon: '🏆', 
        unlocked: completedTasks >= 10,
        condition: 'Выполните 10 задач',
        description: 'Вы выполнили 10 задач! Вы молодец!'
      },
      { 
        id: 'twenty_tasks', 
        name: 'Двадцать задач', 
        icon: '👑', 
        unlocked: completedTasks >= 20,
        condition: 'Выполните 20 задач',
        description: 'Вы выполнили 20 задач! Настоящий профи!'
      },
      { 
        id: 'early_bird', 
        name: 'Ранний пташка', 
        icon: '🌅', 
        unlocked: this.checkEarlyBird(tasks),
        condition: 'Выполните задачу до 8 утра',
        description: 'Вы выполнили задачу рано утром!'
      },
      { 
        id: 'night_owl', 
        name: 'Сова', 
        icon: '🦉', 
        unlocked: this.checkNightOwl(tasks),
        condition: 'Выполните задачу после 22:00',
        description: 'Вы выполнили задачу поздно вечером!'
      },
      { 
        id: 'week_streak', 
        name: 'Недельный стрик', 
        icon: '🔥', 
        unlocked: completedTasks >= 7,
        condition: 'Выполняйте задачи 7 дней подряд',
        description: 'Вы выполняли задачи целую неделю!'
      }
    ];

    const badgesList = document.getElementById('badgesList');
    if (badgesList) {
      badgesList.innerHTML = badges.map(badge => `
        <div class="badge-item ${badge.unlocked ? 'unlocked' : 'locked'}" 
             onclick="TrackerModule.showBadgeInfo('${badge.id}', '${badge.name}', '${badge.icon}', '${badge.condition}', '${badge.description}', ${badge.unlocked})"
             style="cursor:pointer;position:relative;">
          <div class="badge-icon">${badge.unlocked ? badge.icon : '🔒'}</div>
          <div class="badge-name">${badge.name}</div>
          ${!badge.unlocked ? '<div style="position:absolute;top:2px;right:2px;font-size:10px;">❓</div>' : ''}
        </div>
      `).join('');
    }
  },

  // ✅ ПОКАЗ ИНФОРМАЦИИ О ДОСТИЖЕНИИ
  showBadgeInfo(id, name, icon, condition, description, unlocked) {
    const message = unlocked 
      ? `✅ ${name} ${icon}\n\n🎉 ${description}\n\nПоздравляем с достижением!`
      : `🔒 ${name}\n\n📋 Условие: ${condition}\n\nПродолжайте в том же духе!`;
    
    alert(message);
  },

  // Проверка достижения "Ранний пташка"
  checkEarlyBird(tasks) {
    return tasks.some(t => {
      if (t.status !== 'completed' || !t.completedAt) return false;
      const hour = new Date(t.completedAt).getHours();
      return hour < 8;
    });
  },

  // Проверка достижения "Сова"
  checkNightOwl(tasks) {
    return tasks.some(t => {
      if (t.status !== 'completed' || !t.completedAt) return false;
      const hour = new Date(t.completedAt).getHours();
      return hour >= 22;
    });
  }
};

window.TrackerModule = TrackerModule;