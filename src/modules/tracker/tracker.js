// === 📊 TRACKER MODULE ===
const TrackerModule = {
  totalPoints: 0,

  init() {
    this.loadStats();
  },

  loadStats() {
    const tasks = DataService.data.tasks.length > 0 
      ? DataService.data.tasks 
      : tasksDummyData;
    const notes = DataService.data.notes.length > 0 
      ? DataService.data.notes 
      : notesDummyData;
    
    this.totalPoints = tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.points, 0) + 
      notes.reduce((sum, n) => sum + n.points, 0);

    TrackerUI.render(this.totalPoints, tasks, notes);
  },

  updatePoints(points) {
    this.totalPoints += points;
    this.loadStats();
  }
};

window.TrackerModule = TrackerModule;