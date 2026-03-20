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

  // После инициализации AuthService
if (AuthService.isAuthenticated()) {
  // Show admin link if user is admin
  const adminLinkContainer = document.getElementById('adminLinkContainer');
  if (adminLinkContainer && AuthService.isAdmin()) {
    adminLinkContainer.style.display = 'block';
    console.log('[Main] Admin link shown');
  }
  
  // Update profile avatar
  if (window.ProfileModule) {
    ProfileModule.updateProfileAvatar();
  }
}
  
  // Setup logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (confirm('Выйти из аккаунта?')) {
      AuthService.logout();
    }
  });
  
  // Request notification permission
  if (user?.settings?.notifications !== false) {
    
  }

  // Show admin link if user is admin
  if (AuthService.isAdmin()) {
    document.getElementById('adminLinkContainer').style.display = 'block';
  }
  
  console.log('✨ Smart Dashboard initialized!');
});