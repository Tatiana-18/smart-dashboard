// === 🚀 MAIN ENTRY POINT ===
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Services
  AuthService.init();
  DataService.init();
  MascotModule.init();
  
  // Check authentication
  if (!AuthService.isAuthenticated() && !window.location.href.includes('login.html')) {
    window.location.href = '/smart-dashboard/login.html';
    return;
  }
  
  // Apply dark theme if saved
  const user = AuthService.getUser();
  if (user?.settings?.darkTheme) {
    document.body.classList.add('dark-theme');
  }
  
  // Initialize Router
  Router.init();
  
  // Initialize Modules
  TasksModule.init();
  NotesModule.init();
  TrackerModule.init();
  ProfileModule.init();
  
  // Setup logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (confirm('Выйти из аккаунта?')) {
      AuthService.logout();
    }
  });
  
  // Request notification permission
  if (user?.settings?.notifications !== false) {
    NotificationService.requestPermission();
  }

  // Show admin link if user is admin
  if (AuthService.isAdmin()) {
    document.getElementById('adminLinkContainer').style.display = 'block';
  }
  
  console.log('✨ Smart Dashboard initialized!');
});