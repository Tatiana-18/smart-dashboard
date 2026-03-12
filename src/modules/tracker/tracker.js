// === 📊 TRACKER MODULE ===
const TrackerModule = {
  init() {
    this.update();
    this.setupEventListeners();
  },

  update() {
    const user = AuthService.getUser();
    if (!user) return;
    
    const stats = DataService.getStats(user.id);
    const achievements = DataService.collections.achievements;
    
    TrackerUI.render(stats, achievements);
    MascotModule.update('default');
  },

  setupEventListeners() {
    // Progress card click
    document.getElementById('progressCard')?.addEventListener('click', (e) => {
      if (e.target.closest('.progress-container')) {
        const user = AuthService.getUser();
        const points = user?.totalPoints || 0;
        alert(`📊 Ваши баллы: ${points}\nДо следующего уровня: ${Math.max(0, 1000 - points)}`);
      }
    });

    // Activity card click - show calendar
    document.getElementById('activityCard')?.addEventListener('click', () => {
      this.showCalendar();
    });

    // Achievement click
    document.getElementById('badgesList')?.addEventListener('click', (e) => {
      const badge = e.target.closest('.badge-item');
      if (badge) {
        const achId = badge.dataset.id;
        const ach = DataService.collections.achievements.find(a => a.id === achId);
        if (ach) {
          const status = ach.unlocked ? 
            `✅ Получено: ${new Date(ach.date).toLocaleDateString('ru-RU')}` : 
            `🔒 Условие: ${ach.desc}`;
          alert(`${ach.name}\n\n${status}`);
        }
      }
    });
  },

  showCalendar() {
    const user = AuthService.getUser();
    if (!user) return;
    
    const tasks = DataService.read('tasks', { userId: user.id });
    const completedDates = tasks
      .filter(t => t.status === 'completed')
      .map(t => new Date(t.date || t.createdAt).toDateString());
    
    // Simple calendar modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position:fixed;top:0;left:0;right:0;bottom:0;
      background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;
      z-index:3000;padding:20px;
    `;
    
    modal.innerHTML = `
      <div style="background:var(--surface);border-radius:16px;padding:24px;max-width:400px;width:100%;max-height:80vh;overflow:auto;">
        <h3 style="margin:0 0 16px;">🗓️ Календарь активности</h3>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:12px;">
          ${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => `<div style="font-weight:600;color:var(--text-muted);">${d}</div>`).join('')}
          ${this._generateCalendarDays(completedDates)}
        </div>
        <button onclick="this.closest('div[style*=\"position:fixed\"]').remove()" 
                style="margin-top:16px;padding:10px 20px;background:var(--gradient);color:white;border:none;border-radius:8px;cursor:pointer;">
          Закрыть
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.querySelector('button').onclick = () => modal.remove();
  },

  _generateCalendarDays(completedDates) {
    const days = [];
    const today = new Date();
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - 27); // Last 4 weeks
    
    for (let i = 0; i < 28; i++) {
      const date = new Date(startDay);
      date.setDate(startDay.getDate() + i);
      const dateStr = date.toDateString();
      const isCompleted = completedDates.includes(dateStr);
      const isToday = date.toDateString() === today.toDateString();
      
      days.push(`
        <div style="padding:8px 4px;border-radius:4px;
                   background:${isCompleted ? 'var(--success)' : isToday ? 'var(--primary)' : 'transparent'};
                   color:${isCompleted || isToday ? 'white' : 'var(--text-main)'};
                   font-weight:${isToday ? '600' : '400'};">
          ${date.getDate()}
        </div>
      `);
    }
    return days.join('');
  }
};

window.TrackerModule = TrackerModule;