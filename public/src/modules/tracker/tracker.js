// === 📊 TRACKER MODULE ===
const TrackerModule = {
  init() {
    this.updateStats();
    this.renderActivityCalendar();
    this.renderBadges();
    this.renderLevelProgress();
  },

  update() {
    this.updateStats();
    this.renderActivityCalendar();
    this.renderBadges();
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

  // ✅ КАЛЕНДАРЬ АКТИВНОСТИ (исправленный)
  renderActivityCalendar() {
    const container = document.getElementById('activityCalendar');
    if (!container) {
      console.log('[Tracker] Activity calendar container not found');
      return;
    }

    const user = AuthService.getUser();
    if (!user) return;
    
    const tasks = DataService.read('tasks', { userId: user.id });
    const notes = DataService.read('notes', { userId: user.id });
    
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const tasksCompleted = tasks.filter(t => 
        t.status === 'completed' && 
        t.completedAt && 
        t.completedAt.startsWith(dateStr)
      ).length;
      
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
      <div class="activity-calendar" style="background:var(--surface);border-radius:16px;padding:24px;margin:20px;">
        <h3 style="margin-bottom:16px;font-size:18px;">📅 Активность за неделю</h3>
        <div class="calendar-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-top:16px;">
          ${days.map(day => `
            <div class="calendar-day level-${day.level}" style="background:${this.getCalendarColor(day.level)};border-radius:8px;padding:12px 8px;text-align:center;min-height:80px;display:flex;flex-direction:column;justify-content:center;align-items:center;transition:all 0.3s;">
              <div class="day-name" style="font-size:11px;color:${day.level > 0 ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)'};margin-bottom:4px;text-transform:capitalize;">${day.dayName}</div>
              <div class="day-num" style="font-size:18px;font-weight:700;margin-bottom:4px;">${day.dayNum}</div>
              <div class="day-count" style="font-size:14px;font-weight:600;">${day.count}</div>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;justify-content:center;align-items:center;flex-wrap:wrap;">
          <span style="font-size:12px;color:var(--text-muted);">Меньше</span>
          <div style="width:20px;height:20px;border-radius:4px;background:#e2e8f0;"></div>
          <div style="width:20px;height:20px;border-radius:4px;background:#93c5fd;"></div>
          <div style="width:20px;height:20px;border-radius:4px;background:#60a5fa;"></div>
          <div style="width:20px;height:20px;border-radius:4px;background:#3b82f6;"></div>
          <span style="font-size:12px;color:var(--text-muted);">Больше</span>
        </div>
      </div>
    `;
  },

  getCalendarColor(level) {
    const colors = ['#e2e8f0', '#93c5fd', '#60a5fa', '#3b82f6'];
    return colors[level] || colors[0];
  },

  // ✅ ИСПРАВЛЕННЫЙ ПРОГРЕСС ПО УРОВНЯМ
  renderLevelProgress() {
    const user = AuthService.getUser();
    if (!user) return;

    const currentPoints = user.totalPoints || 0;
    
    // ✅ НОВАЯ ФОРМУЛА: 
    // Уровень 1→2: 100 очков
    // Уровень 2→3: 150 очков
    // Уровень 3→4: 200 очков
    // Уровень n→n+1: 100 + (n-1)*50 очков
    
    // Вычисляем текущий уровень
    let level = 1;
    let totalPointsForNextLevel = 100; // Для перехода на 2 уровень нужно 100
    let cumulativePoints = 0;
    
    while (currentPoints >= totalPointsForNextLevel) {
      cumulativePoints = totalPointsForNextLevel;
      level++;
      // Следующий уровень требует на 50 очков больше
      const pointsForThisLevel = 100 + (level - 1) * 50;
      totalPointsForNextLevel += pointsForThisLevel;
    }
    
    // Обновляем уровень пользователя если изменился
    if (level !== user.level) {
      AuthService.updateProfile({ level });
    }
    
    const nextLevel = level + 1;
    const pointsForNextLevel = 100 + (level - 1) * 50; // Сколько нужно для следующего уровня
    const pointsInCurrentLevel = currentPoints - cumulativePoints; // Сколько набрали на текущем
    const pointsNeeded = pointsForNextLevel; // Сколько нужно всего для перехода
    const progressPercent = Math.min((pointsInCurrentLevel / pointsNeeded) * 100, 100);

    console.log('[Tracker] Level progress:', {
      currentPoints,
      level,
      nextLevel,
      pointsForNextLevel,
      pointsInCurrentLevel,
      pointsNeeded,
      progressPercent
    });

    const progressCard = document.getElementById('progressCard');
    if (progressCard) {
      progressCard.innerHTML = `
        <h3 style="margin-bottom:16px;font-size:18px;">📊 Прогресс до ${nextLevel} уровня</h3>
        <div style="text-align:center;margin-bottom:12px;color:var(--text-muted);">
          Уровень ${level}: ${pointsInCurrentLevel} из ${pointsNeeded} баллов
        </div>
        <div class="progress-container" style="background:#e2e8f0;border-radius:8px;height:16px;margin:18px 0;overflow:hidden;">
          <div class="progress-fill" style="background:var(--gradient);height:100%;border-radius:8px;transition:width 0.6s ease;width:${progressPercent}%"></div>
        </div>
        <div style="text-align:center;margin-top:8px;color:var(--text-muted);font-size:14px;">
          Осталось: ${pointsNeeded - pointsInCurrentLevel} баллов
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
      }
    ];

    const badgesList = document.getElementById('badgesList');
    if (badgesList) {
      badgesList.innerHTML = badges.map(badge => `
        <div class="badge-item ${badge.unlocked ? 'unlocked' : 'locked'}" 
             onclick="TrackerModule.showBadgeInfo('${badge.id}', '${badge.name}', '${badge.icon}', '${badge.condition}', '${badge.description}', ${badge.unlocked})"
             style="cursor:pointer;position:relative;background:var(--surface);padding:16px 12px;border-radius:12px;text-align:center;min-width:90px;box-shadow:0 3px 10px var(--shadow);flex-shrink:0;transition:all 0.3s;border:2px solid ${badge.unlocked ? 'var(--primary)' : 'transparent'};opacity:${badge.unlocked ? '1' : '0.6'};">
          <div class="badge-icon" style="font-size:32px;display:block;margin-bottom:8px;">${badge.unlocked ? badge.icon : '🔒'}</div>
          <div class="badge-name" style="font-size:11px;color:${badge.unlocked ? 'var(--primary)' : 'var(--text-muted)'};font-weight:600;line-height:1.2;">${badge.name}</div>
          ${!badge.unlocked ? '<div style="position:absolute;top:2px;right:2px;font-size:10px;">❓</div>' : ''}
        </div>
      `).join('');
    }
  },

  showBadgeInfo(id, name, icon, condition, description, unlocked) {
    const message = unlocked 
      ? `✅ ${name} ${icon}\n\n🎉 ${description}\n\nПоздравляем с достижением!`
      : `🔒 ${name}\n\n📋 Условие: ${condition}\n\nПродолжайте в том же духе!`;
    
    alert(message);
  },

  checkEarlyBird(tasks) {
    return tasks.some(t => {
      if (t.status !== 'completed' || !t.completedAt) return false;
      const hour = new Date(t.completedAt).getHours();
      return hour < 8;
    });
  },

  checkNightOwl(tasks) {
    return tasks.some(t => {
      if (t.status !== 'completed' || !t.completedAt) return false;
      const hour = new Date(t.completedAt).getHours();
      return hour >= 22;
    });
  }
};

window.TrackerModule = TrackerModule;