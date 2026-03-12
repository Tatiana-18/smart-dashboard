// === 🚀 MAIN ENTRY POINT ===
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Core Services
  AuthService.init();
  DataService.init();
  UIContainer.init();
  
  // Initialize Router
  Router.init();
  
  // Initialize Modules
  TasksModule.init();
  NotesModule.init();
  TrackerModule.init();
  
  // Setup logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    AuthService.logout();
  });
  
  console.log('✨ Smart Dashboard initialized!');
});