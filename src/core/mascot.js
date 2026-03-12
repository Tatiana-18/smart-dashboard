// === 🦊 MASCOT MODULE ===
const MascotModule = {
  emoji: '🦊',
  reactions: {
    default: { emoji: '🦊', text: 'Привет! Готов к новым достижениям?' },
    success: { emoji: '🎉', text: 'Молодец! Так держать!' },
    streak: { emoji: '🔥', text: 'Огонь! {days} дней подряд!' },
    achievement: { emoji: '🏆', text: 'Новое достижение! Горжусь!' },
    reminder: { emoji: '⏰', text: 'Не забудь про задачу!' },
    motivation: { emoji: '💪', text: 'Ты можешь всё! Верь в себя!' },
    sad: { emoji: '😔', text: 'Ничего страшного, попробуй завтра!' }
  },

  init() {
    this.update('default');
  },

  update(type, data = {}) {
    const reaction = this.reactions[type] || this.reactions.default;
    let text = reaction.text;
    
    // Replace placeholders
    Object.keys(data).forEach(key => {
      text = text.replace(`{${key}}`, data[key]);
    });

    const emoji = document.querySelector('.mascot-emoji');
    const textEl = document.querySelector('.mascot-text');
    
    if (emoji) {
      emoji.textContent = reaction.emoji;
      emoji.style.animation = 'bounce 0.5s ease';
      setTimeout(() => emoji.style.animation = 'bounce 2s infinite', 500);
    }
    if (textEl) {
      textEl.textContent = text;
    }
  },

  react(eventType, message) {
    const typeMap = {
      'success': 'success',
      'achievement': 'achievement',
      'streak': 'streak',
      'reminder': 'reminder',
      'motivation': 'motivation'
    };
    this.update(typeMap[eventType] || 'default', { message });
  },

  hide() {
    const mascot = document.getElementById('mascot');
    if (mascot) mascot.style.display = 'none';
  },

  show() {
    const mascot = document.getElementById('mascot');
    if (mascot) mascot.style.display = 'block';
  }
};

window.MascotModule = MascotModule;