// === 👑 ADMIN MODULE ===
const AdminModule = {
  init() {
    // Проверяем права администратора
    if (!AuthService.isAdmin()) {
      alert('Доступ запрещён. Только для администраторов!');
      window.location.href = '/smart-dashboard/';
      return;
    }
    
    this.renderUserList();
    this.renderStats();
  },

  renderUserList() {
    const users = AuthService.getAllUsers();
    const container = document.getElementById('adminUserList');
    if (!container) return;
    
    if (users.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Нет пользователей</p>';
      return;
    }
    
    container.innerHTML = `
      <div class="admin-header">
        <h2>👥 Управление пользователями</h2>
        <p style="color:var(--text-muted);margin-top:8px;">Всего пользователей: ${users.length}</p>
      </div>
      <div class="admin-users-list">
        ${users.map(user => `
          <div class="admin-user-card">
            <div class="user-info">
              <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
              <div class="user-details">
                <div class="user-name">${user.name}</div>
                <div class="user-email">${user.email}</div>
                <div class="user-meta">
                  <span>📅 ${new Date(user.createdAt).toLocaleDateString('ru')}</span>
                  <span>⭐ ${user.totalPoints || 0} баллов</span>
                  <span>🎯 Уровень ${user.level || 1}</span>
                </div>
                <div class="user-role ${user.isAdmin ? 'admin' : 'user'}">
                  ${user.isAdmin ? '👑 Администратор' : '👤 Пользователь'}
                </div>
              </div>
            </div>
            ${user.id !== AuthService.currentUser.id ? `
              <button class="btn-delete" onclick="AdminModule.deleteUser('${user.id}')">
                🗑️ Удалить
              </button>
            ` : '<span class="current-user">👉 Вы</span>'}
          </div>
        `).join('')}
      </div>
    `;
  },

  renderStats() {
    const users = AuthService.getAllUsers();
    const statsContainer = document.getElementById('adminStats');
    if (!statsContainer) return;
    
    const totalUsers = users.length;
    const totalAdmins = users.filter(u => u.isAdmin).length;
    const totalPoints = users.reduce((sum, u) => sum + (u.totalPoints || 0), 0);
    const totalTasks = users.reduce((sum, u) => {
      const tasks = JSON.parse(localStorage.getItem('smartdash_tasks') || '[]');
      return sum + tasks.filter(t => t.userId === u.id).length;
    }, 0);
    
    statsContainer.innerHTML = `
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="stat-value">${totalUsers}</div>
          <div class="stat-label">Всего пользователей</div>
        </div>
        <div class="admin-stat-card">
          <div class="stat-value">${totalAdmins}</div>
          <div class="stat-label">Администраторов</div>
        </div>
        <div class="admin-stat-card">
          <div class="stat-value">${totalPoints}</div>
          <div class="stat-label">Всего баллов</div>
        </div>
        <div class="admin-stat-card">
          <div class="stat-value">${totalTasks}</div>
          <div class="stat-label">Всего задач</div>
        </div>
      </div>
    `;
  },

  deleteUser(userId) {
    if (confirm('Вы уверены что хотите удалить этого пользователя?\n\nВсе его данные будут безвозвратно удалены!')) {
      const result = AuthService.deleteUser(userId);
      if (result.success) {
        alert('Пользователь успешно удалён');
        this.renderUserList();
        this.renderStats();
      } else {
        alert('Ошибка: ' + result.error);
      }
    }
  }
};

window.AdminModule = AdminModule;