// === 📝 NOTES UI ===
const NotesUI = {
  render(notes) {
    const container = document.getElementById('notesList');
    if (!container) return;

    container.innerHTML = notes.map(note => `
      <div class="card">
        <div class="card-title">💡 Заметка</div>
        <div class="note-content">${note.content}</div>
        <div class="card-meta">
          <span>${new Date(note.date).toLocaleDateString('ru-RU')}</span>
          <span class="points">+${note.points}</span>
        </div>
      </div>
    `).join('');
  }
};

window.NotesUI = NotesUI;