// === 📋 TASKS MODULE ===
const TasksModule = {
  currentFilter: 'all',
  
  // ✅ ДОБАВЛЕНЫ КАТЕГОРИИ
  categories: [
    { name: 'Все', icon: '', filter: 'all' },
    { name: 'Бытовые', icon: '🏠', filter: 'household' },
    { name: 'Здоровье', icon: '💧', filter: 'health' },
    { name: 'Привычки', icon: '⭐', filter: 'habit' },
    { name: 'Другое', icon: '📋', filter: 'other' }
  ],

  init() {
    this.loadTasks();
    this.setupEventListeners();
  },

  loadTasks() {
    const user = AuthService.getUser();
    if (!user) return;
    
    const tasks = DataService.read('tasks', { userId: user.id });
    TasksUI.render(tasks, this.currentFilter);
    this.updateStreak(tasks);
  },

  setupEventListeners() {
    // Add task button
    document.getElementById('addTaskBtn')?.addEventListener('click', () => this.addTask());
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter || 'all';
        this.loadTasks();
      });
    });

    // Delegate checkbox clicks
    document.getElementById('tasksList')?.addEventListener('click', (e) => {
      const checkbox = e.target.closest('.checkbox');
      if (checkbox) {
        const taskId = checkbox.dataset.id;  // ✅ Берём из data-id
        toggleTask(taskId);  // ✅ Вызываем глобальную функцию
      }
      
      // Edit button
      const editBtn = e.target.closest('.edit-btn');
      if (editBtn) {
        const taskId = editBtn.dataset.id;
        this.editTask(taskId);
      }
      
      // Delete button
      const deleteBtn = e.target.closest('.delete-btn');
      if (deleteBtn) {
        const taskId = deleteBtn.dataset.id;
        this.deleteTask(taskId);
      }
    });
  },

  addTask() {
    const title = prompt('Название задачи:');
    if (!title) return;
    
    // ✅ ДОБАВЛЕН ВЫБОР КАТЕГОРИИ
    const categoryPrompt = prompt(
      'Выберите категорию (введите номер):\n1️⃣ Бытовые\n2️⃣ Здоровье\n3️⃣ Привычки\n4️⃣ Другое',
      '4'
    );
    
    const categoryMap = {
      '1': 'household',
      '2': 'health',
      '3': 'habit',
      '4': 'other'
    };
    
    const type = categoryMap[categoryPrompt] || 'other';
    const points = parseInt(prompt('Баллы за выполнение:', '10')) || 10;
    
    const task = {
      title,
      type,
      status: 'pending',
      points,
      date: new Date().toISOString()
    };
    
    DataService.create('tasks', task);
    this.loadTasks();
    TrackerModule.update();
    NotificationService.show(NotificationService.types.SUCCESS, { points });
  },

  toggleTask(id) {
    const task = DataService.read('tasks').find(t => t.id === id);
    if (!task) return;
    
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    DataService.update('tasks', id, { status: newStatus });
    
    if (newStatus === 'completed') {
      // Award points
      const user = AuthService.getUser();
      user.totalPoints = (user.totalPoints || 0) + task.points;
      AuthService.updateProfile({ totalPoints: user.totalPoints });
      
      // Check for early bird achievement
      const hour = new Date().getHours();
      if (hour < 8) {
        NotificationService.show(NotificationService.types.ACHIEVEMENT, { name: '⭐ Ранний пташка' });
      }
      
      NotificationService.show(NotificationService.types.SUCCESS, { points: task.points });
      
      // Update streak
      const tasks = DataService.read('tasks', { userId: user.id });
      const streak = DataService._calculateStreak(tasks);
      if (streak >= 7) {
        NotificationService.show(NotificationService.types.STREAK, { days: streak });
      }
    }
    
    this.loadTasks();
    TrackerModule.update();
  },

  editTask(id) {
    const task = DataService.read('tasks').find(t => t.id === id);
    if (!task) return;
    
    const title = prompt('Новое название:', task.title);
    if (title === null) return;
    
    const points = parseInt(prompt('Баллы:', task.points)) || task.points;
    
    DataService.update('tasks', id, { title, points });
    this.loadTasks();
  },

  deleteTask(id) {
    if (confirm('Удалить задачу?')) {
      DataService.delete('tasks', id);
      this.loadTasks();
      TrackerModule.update();
    }
  },

  updateStreak(tasks) {
    const streak = DataService._calculateStreak(tasks);
    const streakCard = document.getElementById('streakCard');
    if (streakCard) {
      streakCard.querySelector('div').innerHTML = 
        `🔥 СТРИК: ${streak} ${streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'} подряд!`;
    }
  },

  filterTasks(filter) {
    this.currentFilter = filter;
    this.loadTasks();
  }
};

window.TasksModule = TasksModule;