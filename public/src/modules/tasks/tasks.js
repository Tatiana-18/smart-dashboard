// === 📋 TASKS MODULE ===
const TasksModule = {
  currentFilter: 'all',
  
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
    const addBtn = document.getElementById('addTaskBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addTask());
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter || 'all';
        this.loadTasks();
      });
    });

    const tasksList = document.getElementById('tasksList');
    if (tasksList) {
      tasksList.addEventListener('click', (e) => {
        const checkbox = e.target.closest('.checkbox');
        if (checkbox) {
          this.toggleTask(checkbox.dataset.id);
        }
        
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
          this.editTask(editBtn.dataset.id);
        }
        
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
          this.deleteTask(deleteBtn.dataset.id);
        }
      });
    }
  },

  // ✅ БАЛЛЫ НЕ НАЧИСЛЯЮТСЯ - ТОЛЬКО СОЗДАНИЕ ЗАДАЧИ
  addTask() {
    console.log('[TasksModule] Creating new task...');
    
    const title = prompt('Название задачи:');
    if (!title || !title.trim()) {
      console.log('[TasksModule] ❌ Empty title, canceled');
      return;
    }
    
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
      status: 'pending',  // ← pending = НЕТ БАЛЛОВ
      points,
      date: new Date().toISOString(),
      completedAt: null
    };
    
    console.log('[TasksModule] Task created:', task);
    console.log('[TasksModule] Status:', task.status, '- Points will NOT be added');
    
    DataService.create('tasks', task);
    this.loadTasks();
    
    if (window.TrackerModule) {
      TrackerModule.update();
    }
    
    // ✅ НЕТ УВЕДОМЛЕНИЯ О БАЛЛАХ!
    console.log('[TasksModule] ✅ Task created without points');
  },

  // ✅ БАЛЛЫ НАЧИСЛЯЮТСЯ ТОЛЬКО ЗДЕСЬ
  toggleTask(id) {
    console.log('[TasksModule] Toggling task:', id);
    
    const allTasks = DataService.read('tasks');
    const task = allTasks.find(t => t.id === id);
    
    if (!task) {
      console.log('[TasksModule] ❌ Task not found');
      return;
    }
    
    const oldStatus = task.status;
    const newStatus = oldStatus === 'completed' ? 'pending' : 'completed';
    
    console.log('[TasksModule] Status change:', oldStatus, '→', newStatus);
    
    DataService.update('tasks', id, { 
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : null
    });
    
    const user = AuthService.getUser();
    
    // ✅ НАЧИСЛЕНИЕ БАЛЛОВ ПРИ ВЫПОЛНЕНИИ
    if (newStatus === 'completed') {
      console.log('[TasksModule] ✅ COMPLETED - Adding', task.points, 'points');
      user.totalPoints = (user.totalPoints || 0) + task.points;
      AuthService.updateProfile({ totalPoints: user.totalPoints });
      
      if (window.NotificationService) {
        NotificationService.show(NotificationService.types.SUCCESS, { points: task.points });
      }
    }
    // ✅ ВЫЧИТАНИЕ ПРИ ОТМЕНЕ
    else if (oldStatus === 'completed') {
      console.log('[TasksModule] ❌ CANCELED - Removing', task.points, 'points');
      user.totalPoints = Math.max(0, (user.totalPoints || 0) - task.points);
      AuthService.updateProfile({ totalPoints: user.totalPoints });
      
      if (window.NotificationService) {
        NotificationService.show(NotificationService.types.ERROR, { 
          message: `-${task.points} баллов` 
        });
      }
    } else {
      console.log('[TasksModule] Task created/edited - NO points change');
    }
    
    this.loadTasks();
    
    if (window.TrackerModule) {
      TrackerModule.update();
    }
  },

  editTask(id) {
    const task = DataService.read('tasks').find(t => t.id === id);
    if (!task) return;
    
    const title = prompt('Новое название:', task.title);
    if (title === null) return;
    
    const points = parseInt(prompt('Баллы:', task.points)) || task.points;
    
    DataService.update('tasks', id, { title: title.trim(), points });
    this.loadTasks();
  },

  deleteTask(id) {
    const task = DataService.read('tasks').find(t => t.id === id);
    if (!task) return;
    
    if (task.status === 'completed') {
      const user = AuthService.getUser();
      user.totalPoints = Math.max(0, (user.totalPoints || 0) - task.points);
      AuthService.updateProfile({ totalPoints: user.totalPoints });
    }
    
    if (confirm('Удалить задачу?')) {
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
  }
};

window.TasksModule = TasksModule;