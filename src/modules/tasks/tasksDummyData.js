// === 📋 TASKS DUMMY DATA ===
const tasksDummyData = [
  { id: 'task_1', userId: 'user_001', title: 'Выпить 2л воды', type: 'health', status: 'completed', points: 10, date: new Date().toISOString() },
  { id: 'task_2', userId: 'user_001', title: 'Утренняя зарядка', type: 'health', status: 'completed', points: 15, date: new Date().toISOString() },
  { id: 'task_3', userId: 'user_001', title: 'Читать 30 минут', type: 'habit', status: 'pending', points: 20, date: new Date().toISOString() },
  { id: 'task_4', userId: 'user_001', title: 'Купить продукты', type: 'household', status: 'pending', points: 10, date: new Date().toISOString() }
];

window.tasksDummyData = tasksDummyData;