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
    console.log('[TasksModule] Initializing...');
    this.loadTasks();
    this.setupEventListeners();
  },

  loadTasks() {
    const user = AuthService.getUser();
    if (!user) return;
    
    const tasks = DataService.read('tasks', { userId: user.id });
    console.log('[TasksModule] Loaded tasks:', tasks.length);
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

  // ✅ СОЗДАНИЕ ЗАДАЧИ - БЕЗ НАЧИСЛЕНИЯ БАЛЛОВ
  addTask() {
  console.log('[TasksModule] ➕ Creating task...');
  
  const title = prompt('Название задачи:');
  if (!title || !title.trim()) return;
  
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
  const points = parseInt(prompt('Баллы за выполнение:', '10')) || 10;
  
  const user = AuthService.getUser();
  
  // ✅ ВАЖНО: status = 'pending'
  const task = {
    userId: user.id,
    title: title.trim(),
    type,
    status: 'pending',  // ← pending = НЕТ БАЛЛОВ
    points,
    date: new Date().toISOString(),
    completedAt: null
  };
  
  console.log('[TasksModule] Task created with status:', task.status);
  console.log('[TasksModule] Points before:', user.totalPoints);
  
  DataService.create('tasks', task);
  this.loadTasks();
  
  if (window.TrackerModule) {
    TrackerModule.update();
  }
  
  console.log('[TasksModule] Points after creation:', user.totalPoints);
  console.log('[TasksModule] NO points added at creation!');
},

  // ✅ ВЫПОЛНЕНИЕ ЗАДАЧИ - НАЧИСЛЕНИЕ БАЛЛОВ
  toggleTask(id) {
    console.log('[TasksModule] 🔄 Toggling task:', id);
    
    const allTasks = DataService.read('tasks');
    const task = allTasks.find(t => t.id === id);
    
    if (!task) {
      console.log('[TasksModule] ❌ Task not found');
      return;
    }
    
    const oldStatus = task.status;
    const newStatus = oldStatus === 'completed' ? 'pending' : 'completed';
    
    console.log('[TasksModule] Status change:', {
      taskId: task.id,
      title: task.title,
      oldStatus,
      newStatus,
      points: task.points
    });
    
    DataService.update('tasks', id, { 
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date().toISOString() : null
    });
    
    const user = AuthService.getUser();
    const oldPoints = user.totalPoints || 0;
    
    // ✅ НАЧИСЛЕНИЕ ТОЛЬКО ПРИ pending → completed
    if (newStatus === 'completed' && oldStatus === 'pending') {
      console.log('[TasksModule] ✅ COMPLETED - Adding', task.points, 'points');
      user.totalPoints = oldPoints + task.points;
      AuthService.updateProfile({ totalPoints: user.totalPoints });
      
      if (window.NotificationService) {
        NotificationService.show(NotificationService.types.SUCCESS, { points: task.points });
      }
    }
    // ✅ ВЫЧИТАНИЕ ПРИ completed → pending (отмена)
    else if (newStatus === 'pending' && oldStatus === 'completed') {
      console.log('[TasksModule] ❌ CANCELED - Removing', task.points, 'points');
      user.totalPoints = Math.max(0, oldPoints - task.points);
      AuthService.updateProfile({ totalPoints: user.totalPoints });
      
      if (window.NotificationService) {
        NotificationService.show(NotificationService.types.ERROR, { 
          message: `-${task.points} баллов (отменено)` 
        });
      }
    }
    else {
      console.log('[TasksModule] ⚠️ No points change (same status)');
    }
    
    console.log('[TasksModule] Points:', oldPoints, '→', user.totalPoints);
    
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

  // ✅ УДАЛЕНИЕ - ВЫЧИТАНИЕ ЕСЛИ БЫЛА ВЫПОЛНЕНА
  deleteTask(id) {
    const task = DataService.read('tasks').find(t => t.id === id);
    if (!task) return;
    
    console.log('[TasksModule] 🗑️ Deleting task:', {
      title: task.title,
      status: task.status,
      points: task.points
    });
    
    // Если задача была выполнена - вычитаем баллы
    if (task.status === 'completed') {
      const user = AuthService.getUser();
      user.totalPoints = Math.max(0, (user.totalPoints || 0) - task.points);
      AuthService.updateProfile({ totalPoints: user.totalPoints });
      
      console.log('[TasksModule] Task was completed - removed', task.points, 'points');
      
      if (window.NotificationService) {
        NotificationService.show(NotificationService.types.ERROR, { 
          message: `-${task.points} баллов (удалено)` 
        });
      }
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