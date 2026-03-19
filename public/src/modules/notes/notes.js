// === 📝 NOTES MODULE ===
const NotesModule = {
  init() {
    this.loadNotes();
    this.setupEventListeners();
  },

  loadNotes() {
    const user = AuthService.getUser();
    if (!user) return;
    
    const notes = DataService.read('notes', { userId: user.id });
    NotesUI.render(notes);
  },

  setupEventListeners() {
    document.getElementById('addNoteBtn')?.addEventListener('click', () => this.addNote());
    
    document.getElementById('notesList')?.addEventListener('click', (e) => {
      // Edit
      const editBtn = e.target.closest('.edit-btn');
      if (editBtn) {
        const noteId = editBtn.dataset.id;
        this.editNote(noteId);
      }
      
      // Delete
      const deleteBtn = e.target.closest('.delete-btn');
      if (deleteBtn) {
        const noteId = deleteBtn.dataset.id;
        this.deleteNote(noteId);
      }
    });
  },

  addNote() {
    const content = prompt('Текст заметки:');
    if (!content) return;
    
    const note = { content, points: 5 };
    DataService.create('notes', note);
    this.loadNotes();
    TrackerModule.update();
    NotificationService.show(NotificationService.types.SUCCESS, { points: 5 });
  },

  editNote(id) {
    const note = DataService.read('notes').find(n => n.id === id);
    if (!note) return;
    
    const content = prompt('Редактировать заметку:', note.content);
    if (content === null) return;
    
    DataService.update('notes', id, { content });
    this.loadNotes();
  },

  deleteNote(id) {
    if (confirm('Удалить заметку?')) {
      DataService.delete('notes', id);
      this.loadNotes();
      TrackerModule.update();
    }
  }
};

window.NotesModule = NotesModule;