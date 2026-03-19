// === 📊 TRACKER MODULE ===
const TrackerModule = {
  init() {
    this.updateStats();
    this.renderBadges();
    this.renderLevelProgress();
  },

  update() {
    this.updateStats();
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

  // ✅ ПРОГРЕСС ПО УРОВНЯМ
  renderLevelProgress() {
    const user = AuthService.getUser();
    if (!user) return;

    const currentPoints = user.totalPoints || 0;
    
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

  // ✅ ДОСТИЖЕНИЯ
  renderBadges() {
    const user = AuthService.getUser();
    if (!user) return;

    const tasks = DataService.read('tasks', { userId: user.id });
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    
    const badges = [
      { id: 'first_task', name: 'Первый шаг', icon: '🎯', unlocked: completedTasks >= 1,
        condition: 'Выполните 1 задачу', description: 'Вы выполнили свою первую задачу!' },
      { id: 'five_tasks', name: 'Пять задач', icon: '🌟', unlocked: completedTasks >= 5,
        condition: 'Выполните 5 задач', description: 'Вы выполнили 5 задач! Так держать!' },
      { id: 'ten_tasks', name: 'Десять задач', icon: '🏆', unlocked: completedTasks >= 10,
        condition: 'Выполните 10 задач', description: 'Вы выполнили 10 задач! Вы молодец!' },
      { id: 'twenty_tasks', name: 'Двадцать задач', icon: '👑', unlocked: completedTasks >= 20,
        condition: 'Выполните 20 задач', description: 'Вы выполнили 20 задач! Настоящий профи!' }
    ];

    const badgesList = document.getElementById('badgesList');
    if (badgesList) {
      badgesList.innerHTML = badges.map(badge => `
        <div class="badge-item ${badge.unlocked ? 'unlocked' : 'locked'}" 
             onclick="TrackerModule.showBadgeInfo('${badge.name}', '${badge.condition}', '${badge.description}', ${badge.unlocked})"
             style="cursor:pointer;background:var(--surface);padding:16px 12px;border-radius:12px;text-align:center;min-width:90px;box-shadow:0 3px 10px var(--shadow);flex-shrink:0;border:2px solid ${badge.unlocked ? 'var(--primary)' : 'transparent'};opacity:${badge.unlocked ? '1' : '0.6'};">
          <div style="font-size:32px;margin-bottom:8px;">${badge.unlocked ? badge.icon : '🔒'}</div>
          <div style="font-size:11px;color:${badge.unlocked ? 'var(--primary)' : 'var(--text-muted)'};font-weight:600;">${badge.name}</div>
        </div>
      `).join('');
    }
  },

  showBadgeInfo(name, condition, description, unlocked) {
    alert(unlocked 
      ? `✅ ${name}\n\n🎉 ${description}`
      : `🔒 ${name}\n\n📋 Условие: ${condition}`);
  }
};

window.TrackerModule = TrackerModule;