// === 📊 TRACKER MODULE ===
const TrackerModule = {
  init() {
    this.updateStats();
    // УБРАНО: this.renderActivityCalendar();
    this.renderBadges();
    this.renderLevelProgress();
  },

  update() {
    this.updateStats();
    // УБРАНО: this.renderActivityCalendar();
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

  // ✅ ИСПРАВЛЕННЫЙ ПРОГРЕСС ПО УРОВНЯМ
  renderLevelProgress() {
    const user = AuthService.getUser();
    if (!user) return;

    const currentPoints = user.totalPoints || 0;
    
    // ФОРМУЛА: 
    // Уровень 1→2: 100 очков
    // Уровень 2→3: 150 очков
    // Уровень 3→4: 200 очков
    // Уровень n→n+1: 100 + (n-1)*50 очков
    
    let level = 1;
    let totalPointsForNextLevel = 100;
    let cumulativePoints = 0;
    
    while (currentPoints >= totalPointsForNextLevel) {
      cumulativePoints = totalPointsForNextLevel;
      level++;
      const pointsForThisLevel = 100 + (level - 1) * 50;
      totalPointsForNextLevel += pointsForThisLevel;
    }
    
    if (level !== user.level) {
      AuthService.updateProfile({ level });
    }
    
    const nextLevel = level + 1;
    const pointsForNextLevel = 100 + (level - 1) * 50;
    const pointsInCurrentLevel = currentPoints - cumulativePoints;
    const progressPercent = Math.min((pointsInCurrentLevel / pointsForNextLevel) * 100, 100);

    const progressCard = document.getElementById('progressCard');
    if (progressCard) {
      progressCard.innerHTML = `
        <h3 style="margin-bottom:16px;font-size:18px;">📊 Прогресс до ${nextLevel} уровня</h3>
        <div style="text-align:center;margin-bottom:12px;color:var(--text-muted);">
          Уровень ${level}: ${pointsInCurrentLevel} из ${pointsForNextLevel} баллов
        </div>
        <div class="progress-container" style="background:#e2e8f0;border-radius:8px;height:16px;margin:18px 0;overflow:hidden;">
          <div class="progress-fill" style="background:var(--gradient);height:100%;border-radius:8px;transition:width 0.6s ease;width:${progressPercent}%"></div>
        </div>
        <div style="text-align:center;margin-top:8px;color:var(--text-muted);font-size:14px;">
          Осталось: ${pointsForNextLevel - pointsInCurrentLevel} баллов
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