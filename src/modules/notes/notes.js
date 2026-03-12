// === 📝 NOTES MODULE ===
const NotesModule = {
  init() {
    this.loadNotes();
    this.setupEventListeners();
  },

  loadNotes() {
    const notes = DataService.data.notes.length > 0 
      ? DataService.data.notes 
      : notesDummyData;
    NotesUI.render(notes);
  },

  setupEventListeners() {
    document.getElementById('addNoteBtn')?.addEventListener('click', () => {
      this.addNote();
    });
  },

  addNote() {
    const content = prompt('Текст заметки:');
    if (content) {
      const note = { content, points: 5 };
      DataService.create('notes', note);
      this.loadNotes();
      TrackerModule.updatePoints(5);
    }
  },

  deleteNote(id) {
    if (confirm('Удалить заметку?')) {
      DataService.delete('notes', id);
      this.loadNotes();
    }
  }
};

window.NotesModule = NotesModule;