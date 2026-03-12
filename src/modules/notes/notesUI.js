// === 📝 NOTES UI ===
const NotesUI = {
  render(notes) {
    const container = document.getElementById('notesList');
    if (!container) return;

    if (notes.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Нет заметок. Запиши первую мысль! 💡</p>';
      return;
    }

    container.innerHTML = notes.map(note => `
      <div class="card">
        <div class="card-title">💡 Заметка</div>
        <div class="note-content">${note.content}</div>
        <div class="card-meta">
          <span>${new Date(note.date || note.createdAt).toLocaleDateString('ru-RU')}</span>
          <span class="points">+${note.points}</span>
          <div style="display:flex;gap:8px;">
            <button class="edit-btn" data-id="${note.id}" style="background:none;border:none;color:var(--primary);cursor:pointer;">✏️</button>
            <button class="delete-btn" data-id="${note.id}" style="background:none;border:none;color:var(--error);cursor:pointer;">🗑️</button>
          </div>
        </div>
      </div>
    `).join('');
  }
};

window.NotesUI = NotesUI;