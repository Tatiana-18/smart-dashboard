// === 🔔 NOTIFICATION SERVICE ===
const NotificationService = {
  types: {
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning',
    ACHIEVEMENT: 'achievement',
    STREAK: 'streak'
  },

  init() {
    console.log('[NotificationService] Initialized');
  },

  show(type, data = {}) {
    console.log('[NotificationService] Show:', type, data);
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    let message = '';
    let icon = '';
    
    switch(type) {
      case this.types.SUCCESS:
        icon = '✅';
        message = data.message || `+${data.points || 0} баллов!`;
        break;
      case this.types.ERROR:
        icon = '❌';
        message = data.message || 'Ошибка';
        break;
      case this.types.INFO:
        icon = 'ℹ️';
        message = data.message || 'Информация';
        break;
      case this.types.WARNING:
        icon = '⚠️';
        message = data.message || 'Предупреждение';
        break;
      case this.types.ACHIEVEMENT:
        icon = '🏆';
        message = data.message || `Достижение: ${data.name || ''}`;
        break;
      case this.types.STREAK:
        icon = '🔥';
        message = data.message || `Стрик: ${data.days || 0} дней!`;
        break;
      default:
        icon = '📢';
        message = data.message || 'Уведомление';
    }
    
    notification.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;padding:16px 20px;background:var(--surface);border-radius:12px;box-shadow:0 4px 20px var(--shadow);border-left:4px solid var(--primary);">
        <span style="font-size:24px;">${icon}</span>
        <span style="font-weight:600;color:var(--text-main);">${message}</span>
      </div>
    `;
    
    notification.style.cssText = `
      position:fixed;
      top:20px;
      right:20px;
      z-index:10000;
      animation:slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
};

// CSS анимации
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

window.NotificationService = NotificationService;