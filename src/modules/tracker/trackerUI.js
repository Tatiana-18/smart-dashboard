// === 📊 TRACKER UI ===
const TrackerUI = {
  render(stats, achievements) {
    // Stats Grid
    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${stats.totalPoints}</div>
          <div class="stat-label">Баллов</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.completedTasks}</div>
          <div class="stat-label">Задач</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.totalNotes}</div>
          <div class="stat-label">Заметок</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.streak}🔥</div>
          <div class="stat-label">Стрик</div>
        </div>
      `;
    }

    // Progress Card
    const progressCard = document.getElementById('progressCard');
    if (progressCard) {
      const progress = Math.min((stats.totalPoints / 1000) * 100, 100);
      progressCard.innerHTML = `
        <div class="card-title" style="cursor:pointer;">📈 Прогресс недели (нажми)</div>
        <div class="progress-container">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);text-align:center;">
          ${Math.round(progress)}% • До уровня 2: ${Math.max(0, 1000 - stats.totalPoints)} баллов
        </div>
      `;
    }

    // Activity Card
    const activityCard = document.getElementById('activityCard');
    if (activityCard) {
      activityCard.innerHTML = `
        <div class="card-title" style="cursor:pointer;">🗓️ Активность (нажми для календаря)</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:11px;">
          ${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => `<div style="color:var(--text-muted);">${d}</div>`).join('')}
          ${this._generateWeekView(stats)}
        </div>
      `;
    }

    // Achievements
    const badgesList = document.getElementById('badgesList');
    if (badgesList) {
      badgesList.innerHTML = achievements.map(ach => `
        <div class="badge-item" data-id="${ach.id}" style="${!ach.unlocked ? 'opacity:0.6' : ''}">
          <span class="badge-icon">${ach.unlocked ? ach.name.split(' ')[0] : '🔒'}</span>
          <span class="badge-name">${ach.name.split(' ').slice(1).join(' ')}</span>
        </div>
      `).join('');
    }
  },

  _generateWeekView(stats) {
    // Simple week view (last 7 days)
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      // Random activity for demo (replace with real data)
      const active = Math.random() > 0.3;
      days.push(`
        <div style="padding:6px 2px;border-radius:4px;
                   background:${active ? 'var(--success)' : '#e2e8f0'};
                   color:${active ? 'white' : 'var(--text-muted)'};">
          ${active ? '█' : '░'}
        </div>
      `);
    }
    return days.join('');
  }
};

window.TrackerUI = TrackerUI;