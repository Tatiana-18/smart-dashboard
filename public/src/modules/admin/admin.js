// === 👑 ADMIN MODULE ===
const AdminModule = {
  init() {
    console.log('[AdminModule] Initializing...');
    
    if (!AuthService.isAdmin()) {
      console.log('[AdminModule] ❌ Not admin, redirecting');
      window.location.href = '../';
      return;
    }
    
    console.log('[AdminModule] ✅ Admin access granted');
    this.renderUserList();
    this.renderStats();
  },

  renderUserList() {
    console.log('[AdminModule] Rendering user list...');
    const users = AuthService.getAllUsers();
    console.log('[AdminModule] Users:', users);
    
    const container = document.getElementById('adminUserList');
    if (!container) {
      console.log('[AdminModule] ❌ Container not found');
      return;
    }
    
    if (users.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Нет пользователей</p>';
      return;
    }
    
    container.innerHTML = users.map(user => `
      <div class="admin-user-card">
        <div class="user-info">
          <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
          <div class="user-details">
            <div class="user-name">${user.name}</div>
            <div class="user-email">${user.email}</div>
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
    `).join('');
    
    console.log('[AdminModule] ✅ User list rendered');
  },

  renderStats() {
    const users = AuthService.getAllUsers();
    const statsContainer = document.getElementById('adminStats');
    if (!statsContainer) return;
    
    const totalUsers = users.length;
    const totalAdmins = users.filter(u => u.isAdmin).length;
    
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
      </div>
    `;
  },

  deleteUser(userId) {
    if (confirm('Удалить пользователя?')) {
      const result = AuthService.deleteUser(userId);
      if (result.success) {
        alert('Пользователь удалён');
        this.renderUserList();
        this.renderStats();
      } else {
        alert('Ошибка: ' + result.error);
      }
    }
  }
};

window.AdminModule = AdminModule;