// === 📋 TASKS MODULE ===
const TasksModule = {
  init() {
    this.loadTasks();
    this.setupEventListeners();
  },

  loadTasks() {
    const tasks = DataService.data.tasks.length > 0 
      ? DataService.data.tasks 
      : tasksDummyData;
    TasksUI.render(tasks);
  },

  setupEventListeners() {
    document.getElementById('addTaskBtn')?.addEventListener('click', () => {
      this.addTask();
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.filterTasks(e.target.textContent);
      });
    });
  },

  addTask() {
    const title = prompt('Название задачи:');
    if (title) {
      const task = {
        title,
        type: 'habit',
        status: 'pending',
        points: 10
      };
      DataService.create('tasks', task);
      this.loadTasks();
      TrackerModule.updatePoints(10);
    }
  },

  toggleTask(id) {
    const task = DataService.read('tasks', id);
    if (task) {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      DataService.update('tasks', id, { status: newStatus });
      
      if (newStatus === 'completed') {
        TrackerModule.updatePoints(task.points);
        NotificationService.show('🎉 Молодец!', `+${task.points} баллов!`);
      }
      this.loadTasks();
    }
  },

  filterTasks(filter) {
    const allTasks = DataService.data.tasks.length > 0 
      ? DataService.data.tasks 
      : tasksDummyData;
    
    if (filter === 'Все') {
      TasksUI.render(allTasks);
    } else {
      const typeMap = { '🏠 Бытовые': 'household', '💧 Здоровье': 'health', '⭐ Привычки': 'habit' };
      const filtered = allTasks.filter(t => t.type === typeMap[filter]);
      TasksUI.render(filtered);
    }
  }
};

window.TasksModule = TasksModule;