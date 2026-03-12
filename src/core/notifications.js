// === 🔔 NOTIFICATION SERVICE ===
const NotificationService = {
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  show(title, body) {
    // In-app notification
    const mascot = document.getElementById('mascot');
    if (mascot) {
      const text = mascot.querySelector('.mascot-text');
      text.textContent = body;
      setTimeout(() => {
        text.textContent = 'Привет! Готов к новым достижениям?';
      }, 3000);
    }

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: 'icons/icon-192x192.png' });
    }
  },

  remind(task, time) {
    // MVP заглушка
    console.log('Reminder set for:', task, time);
  }
};

window.NotificationService = NotificationService;