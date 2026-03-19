// === 📋 TASKS MODULE ===
const TasksModule = {
  currentFilter: 'all',
  
  // ✅ КАТЕГОРИИ
  categories: [
    { name: 'Все', icon: '', filter: 'all' },
    { name: 'Бытовые', icon: '🏠', filter: 'household' },
    { name: 'Здоровье', icon: '💧', filter: 'health' },
    { name: 'Привычки', icon: '⭐', filter: 'habit' },
    { name: 'Другое', icon: '📋', filter: 'other' }
  ],

  init() {
    console.log('[TasksModule] Initializing...');
    this.loadTasks();
    this.setupEventListeners();
  },

  loadTasks() {
    const user = AuthService.getUser();
    if (!user) {
      console.log('[TasksModule] No user, redirecting to login');
      return;
    }
    
    const tasks = DataService.read('tasks', { userId: user.id });
    console.log('[TasksModule] Loaded tasks:', tasks.length);
    TasksUI.render(tasks, this.currentFilter);
    this.updateStreak(tasks);
  },

  setupEventListeners() {
    // Add task button
    const addBtn = document.getElementById('addTaskBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addTask());
    }
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter || 'all';
        console.log('[TasksModule] Filter changed to:', this.currentFilter);
        this.loadTasks();
      });
    });

    // Delegate checkbox clicks
    const tasksList = document.getElementById('tasksList');
    if (tasksList) {
      tasksList.addEventListener('click', (e) => {
        const checkbox = e.target.closest('.checkbox');
        if (checkbox) {
          const taskId = checkbox.dataset.id;
          console.log('[TasksModule] Toggle task:', taskId);
          this.toggleTask(taskId);
        }
        
        // Edit button
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
          const taskId = editBtn.dataset.id;
          console.log('[TasksModule] Edit task:', taskId);
          this.editTask(taskId);
        }
        
        // Delete button
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
          const taskId = deleteBtn.dataset.id;
          console.log('[TasksModule] Delete task:', taskId);
          this.deleteTask(taskId);
        }
      });
    }
  },

  // ✅ ИСПРАВЛЕНО: баллы НЕ начисляются при создании
  addTask() {
    const title = prompt('Название задачи:');
    if (!title || !title.trim()) {
      console.log('[TasksModule] Empty title, canceling');
      return;
    }
    
    // ✅ ВЫБОР КАТЕГОРИИ
    const categoryPrompt = prompt(
      'Выберите категорию (введите номер):\n\n1️⃣ Бытовые\n2️⃣ Здоровье\n3️⃣ Привычки\n4️⃣ Другое',
      '4'
    );
    
    const categoryMap = {
      '1': 'household',
      '2': 'health',
      '3': 'habit',
      '4': 'other'
    };
    
    const type = categoryMap[categoryPrompt] || 'other';
    const pointsInput = prompt('Баллы за выполнение:', '10');
    const points = parseInt(pointsInput) || 10;
    
    const user = AuthService.getUser();
    const task = {
      userId: user.id,
      title: title.trim(),
      type,
      status: 'pending',  // ←pending, баллов НЕТ
      points,
      date: new Date().toISOString(),
      completedAt: null
    };
    
    console.log('[TasksModule] Creating task:', task);
    DataService.create('tasks', task);
    this.loadTasks();
    
    if (window.TrackerModule) {
      TrackerModule.update();
    }
    
    // ✅ УБРАНО: НЕ показываем уведомление о баллах при создании
    // Баллы начисляются ТОЛЬКО при выполнении!
  },

  toggleTask(id) {
    const allTasks = DataService.read('tasks');
    const task = allTasks.find(t => t.id === id);
    
    if (!task) {
      console.log('[TasksModule] Task not found:', id);
      return;
    }
    
    const oldStatus = task.status;
    const newStatus = oldStatus === 'completed' ? 'pending' : 'completed';
    
    console.log('[TasksModule] Toggle task:', { id, oldStatus, newStatus });
    
    DataService.update('tasks', id, { 
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : null
    });
    
    const user = AuthService.getUser();
    
    // ✅ НАЧИСЛЕНИЕ БАЛЛОВ ПРИ ВЫПОЛНЕНИИ
    if (newStatus === 'completed') {
      user.totalPoints = (user.totalPoints || 0) + task.points;
      AuthService.updateProfile({ totalPoints: user.totalPoints });
      
      // Check for early bird achievement
      const hour = new Date().getHours();
      if (hour < 8 && window.NotificationService) {
        NotificationService.show(NotificationService.types.ACHIEVEMENT, { name: '⭐ Ранний пташка' });
      }
      
      if (window.NotificationService) {
        NotificationService.show(NotificationService.types.SUCCESS, { points: task.points });
      }
      
      // Update streak
      const tasks = DataService.read('tasks', { userId: user.id });
      const streak = DataService._calculateStreak(tasks);
      if (streak >= 7 && window.NotificationService) {
        NotificationService.show(NotificationService.types.STREAK, { days: streak });
      }
    }
    // ✅ ВЫЧИТАНИЕ БАЛЛОВ ПРИ ОТМЕНЕ
    else if (oldStatus === 'completed') {
      user.totalPoints = Math.max(0, (user.totalPoints || 0) - task.points);
      AuthService.updateProfile({ totalPoints: user.totalPoints });
      
      if (window.NotificationService) {
        NotificationService.show(NotificationService.types.ERROR, { 
          message: `-${task.points} баллов (задача отменена)` 
        });
      }
    }
    
    this.loadTasks();
    
    if (window.TrackerModule) {
      TrackerModule.update();
    }
  },

  editTask(id) {
    const task = DataService.read('tasks').find(t => t.id === id);
    if (!task) {
      console.log('[TasksModule] Task not found for edit:', id);
      return;
    }
    
    const title = prompt('Новое название:', task.title);
    if (title === null) {
      console.log('[TasksModule] Edit canceled');
      return;
    }
    
    const pointsInput = prompt('Баллы:', task.points);
    const points = parseInt(pointsInput) || task.points;
    
    console.log('[TasksModule] Updating task:', { id, title, points });
    DataService.update('tasks', id, { title: title.trim(), points });
    this.loadTasks();
  },

  deleteTask(id) {
    const task = DataService.read('tasks').find(t => t.id === id);
    if (!task) {
      console.log('[TasksModule] Task not found for delete:', id);
      return;
    }
    
    // ✅ ЕСЛИ ЗАДАЧА БЫЛА ВЫПОЛНЕНА - ВЫЧЕСТЬ БАЛЛЫ
    if (task.status === 'completed') {
      const user = AuthService.getUser();
      user.totalPoints = Math.max(0, (user.totalPoints || 0) - task.points);
      AuthService.updateProfile({ totalPoints: user.totalPoints });
      
      if (window.NotificationService) {
        NotificationService.show(NotificationService.types.ERROR, { 
          message: `-${task.points} баллов (задача удалена)` 
        });
      }
    }
    
    if (confirm('Удалить задачу?')) {
      console.log('[TasksModule] Deleting task:', id);
      DataService.delete('tasks', id);
      this.loadTasks();
      
      if (window.TrackerModule) {
        TrackerModule.update();
      }
    }
  },

  updateStreak(tasks) {
    const streak = DataService._calculateStreak(tasks);
    const streakCard = document.getElementById('streakCard');
    if (streakCard) {
      const dayWord = streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней';
      streakCard.querySelector('div').innerHTML = 
        `🔥 СТРИК: ${streak} ${dayWord} подряд!`;
    }
  },

  filterTasks(filter) {
    this.currentFilter = filter;
    this.loadTasks();
  }
};

window.TasksModule = TasksModule;