// === 🔔 NOTIFICATION SERVICE ===
const NotificationService = {
  types: {
    REMINDER: 'reminder',      // ⏰ Напоминание о задаче
    SUCCESS: 'success',        // 🎉 Поздравление с выполнением
    STREAK: 'streak',          // 🔥 Напоминание о стрике
    ACHIEVEMENT: 'achievement',// 🏆 Новое достижение
    MOTIVATION: 'motivation'   // 💡 Совет дня
  },

  messages: {
    [this.types.REMINDER]: [
      'Не забудь выполнить задачу: "{title}"! 💪',
      'Время для: "{title}" ⏰',
      'Задача ждёт: "{title}" ✨'
    ],
    [this.types.SUCCESS]: [
      'Молодец! +{points} баллов! 🎉',
      'Отличная работа! +{points} очков! ⭐',
      'Выполнено! +{points} баллов! 🏆'
    ],
    [this.types.STREAK]: [
      '🔥 {days} дней подряд! Так держать!',
      'Серия: {days} дней! Ты супер! 💪',
      '🎯 {days} дней без пропусков!'
    ],
    [this.types.ACHIEVEMENT]: [
      '🏆 Новое достижение: {name}!',
      'Поздравляем! Вы получили: {name} 🎊',
      'Достижение разблокировано: {name}! ✨'
    ],
    [this.types.MOTIVATION]: [
      '💡 Маленькие шаги ведут к большим целям!',
      '✨ Каждый день — новая возможность!',
      '🦊 Ты можешь всё! Верь в себя!'
    ]
  },

  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  show(type, data = {}) {
    const messages = this.messages[type] || this.messages[this.types.MOTIVATION];
    let message = messages[Math.floor(Math.random() * messages.length)];
    
    // Replace placeholders
    Object.keys(data).forEach(key => {
      message = message.replace(`{${key}}`, data[key]);
    });

    // Update mascot
    MascotModule.react(type, message);

    // Show in-app notification
    this._showInApp(message, type);

    // Browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Smart Dashboard', {
        body: message,
        icon: 'icons/icon-192x192.png',
        badge: 'icons/icon-192x192.png'
      });
    }
  },

  _showInApp(message, type) {
    // Create notification element
    const notif = document.createElement('div');
    notif.className = `notification notification-${type}`;
    notif.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this._getIcon(type)}</span>
        <span class="notification-text">${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;
    
    // Add styles
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--surface);
      border-left: 4px solid var(--${this._getColor(type)});
      border-radius: 12px;
      padding: 12px 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 2000;
      max-width: 320px;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notif);
    
    // Close button
    notif.querySelector('.notification-close').onclick = () => notif.remove();
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notif.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notif.remove(), 300);
    }, 5000);
  },

  _getIcon(type) {
    const icons = {
      [this.types.REMINDER]: '⏰',
      [this.types.SUCCESS]: '🎉',
      [this.types.STREAK]: '🔥',
      [this.types.ACHIEVEMENT]: '🏆',
      [this.types.MOTIVATION]: '💡'
    };
    return icons[type] || '✨';
  },

  _getColor(type) {
    const colors = {
      [this.types.REMINDER]: 'warning',
      [this.types.SUCCESS]: 'success',
      [this.types.STREAK]: 'secondary',
      [this.types.ACHIEVEMENT]: 'primary',
      [this.types.MOTIVATION]: 'primary'
    };
    return colors[type] || 'primary';
  },

  scheduleReminder(task, time) {
    // MVP: Show notification if time has passed
    const now = new Date();
    const remindTime = new Date(time);
    
    if (remindTime <= now && task.status === 'pending') {
      this.show(this.types.REMINDER, { title: task.title });
    }
  }
};

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

window.NotificationService = NotificationService;