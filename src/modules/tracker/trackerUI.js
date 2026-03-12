// === 📊 TRACKER UI ===
const TrackerUI = {
  render(totalPoints, tasks, notes) {
    // Stats Grid
    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${totalPoints}</div>
          <div class="stat-label">Баллов</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${tasks.filter(t => t.status === 'completed').length}</div>
          <div class="stat-label">Задач</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${notes.length}</div>
          <div class="stat-label">Заметок</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">Ур. 1</div>
          <div class="stat-label">Уровень</div>
        </div>
      `;
    }

    // Progress Card
    const progressCard = document.getElementById('progressCard');
    if (progressCard) {
      progressCard.innerHTML = `
        <div class="card-title">📈 Прогресс недели</div>
        <div class="progress-container">
          <div class="progress-fill" style="width: ${Math.min(totalPoints / 10, 100)}%"></div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);text-align:center;">
          ${Math.min(totalPoints / 10, 100)}% • До цели: ${Math.max(0, 1000 - totalPoints)} баллов
        </div>
      `;
    }

    // Badges
    const badgesList = document.getElementById('badgesList');
    if (badgesList) {
      badgesList.innerHTML = `
        <div class="badge-item">
          <span class="badge-icon">🌱</span>
          <span class="badge-name">Первый шаг</span>
        </div>
        <div class="badge-item">
          <span class="badge-icon">🔥</span>
          <span class="badge-name">Неделя</span>
        </div>
        <div class="badge-item">
          <span class="badge-icon">📚</span>
          <span class="badge-name">Читатель</span>
        </div>
      `;
    }
  }
};

window.TrackerUI = TrackerUI;