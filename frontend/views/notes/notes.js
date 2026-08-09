// Hexaware Student Dashboard - Notes Component Controller

let selectedNoteColor = "note-purple";
let notesLayoutMode = "grid";
let editingNoteId = null;

export function initNotes(appState, saveStateFunc) {
  // Bind search input field
  const searchInput = document.getElementById("notes-search");
  if (searchInput) {
    // Clear input first
    searchInput.value = "";
    searchInput.addEventListener("input", () => {
      renderNotes(appState, searchInput.value.trim());
    });
  }

  // Grid/List toggle selectors
  const gridToggleBtn = document.getElementById("layout-grid-btn");
  const listToggleBtn = document.getElementById("layout-list-btn");
  
  if (gridToggleBtn && listToggleBtn) {
    gridToggleBtn.addEventListener("click", () => {
      notesLayoutMode = "grid";
      gridToggleBtn.classList.add("active");
      listToggleBtn.classList.remove("active");
      renderNotes(appState, searchInput ? searchInput.value.trim() : "");
    });
    
    listToggleBtn.addEventListener("click", () => {
      notesLayoutMode = "list";
      listToggleBtn.classList.add("active");
      gridToggleBtn.classList.remove("active");
      renderNotes(appState, searchInput ? searchInput.value.trim() : "");
    });
  }

  // Bind "+ New Note" actions
  const addNoteBtns = document.querySelectorAll(".add-note-action");
  addNoteBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      editingNoteId = null;
      openNewNoteModal();
    });
  });

  // Modal dismiss buttons
  const closeModalBtn = document.getElementById("modal-close");
  const cancelModalBtn = document.getElementById("modal-cancel");
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeNewNoteModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeNewNoteModal);

  // Color selections bubble inputs
  const colorOptions = document.querySelectorAll(".color-option");
  colorOptions.forEach(opt => {
    opt.addEventListener("click", () => {
      colorOptions.forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      selectedNoteColor = opt.getAttribute("data-color");
    });
  });

  // Save Note submit
  const saveNoteBtn = document.getElementById("modal-save-note");
  if (saveNoteBtn) {
    // Remove old listeners by replacing the element
    const newSaveBtn = saveNoteBtn.cloneNode(true);
    saveNoteBtn.parentNode.replaceChild(newSaveBtn, saveNoteBtn);
    
    newSaveBtn.addEventListener("click", () => {
      submitNewNote(appState, saveStateFunc);
    });
  }

  // Bind deleteNote globally so inline onclick templates can trigger it
  window.deleteNote = (noteId) => {
    if (confirm("Are you sure you want to delete this study note?")) {
      appState.notes = appState.notes.filter(n => n.id !== noteId);
      saveStateFunc();
      const currentQuery = document.getElementById("notes-search") ? document.getElementById("notes-search").value.trim() : "";
      renderNotes(appState, currentQuery);
    }
  };

  // Bind editNote globally so inline onclick templates can trigger it
  window.editNote = (noteId) => {
    const note = appState.notes.find(n => n.id === noteId);
    if (!note) return;
    editingNoteId = noteId;
    // Populate modal fields
    const titleInput = document.getElementById('modal-note-title');
    const contentInput = document.getElementById('modal-note-content');
    if (titleInput) titleInput.value = note.title;
    if (contentInput) contentInput.value = note.content;
    // Set selected color
    selectedNoteColor = note.colorClass;
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(o => {
      if (o.getAttribute('data-color') === selectedNoteColor) {
        o.classList.add('selected');
      } else {
        o.classList.remove('selected');
      }
    });
    // Update modal header
    const modalTitle = document.querySelector('#new-note-modal .modal-header h3');
    if (modalTitle) modalTitle.textContent = 'Edit Note';
    // Show modal
    const modal = document.getElementById('new-note-modal');
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('active'), 10);
    }
  };
}

export function openNewNoteModal() {
  const modal = document.getElementById("new-note-modal");
  const titleInput = document.getElementById("modal-note-title");
  const contentInput = document.getElementById("modal-note-content");
  
  if (titleInput) titleInput.value = "";
  if (contentInput) contentInput.value = "";
  
  editingNoteId = null;
  selectedNoteColor = "note-purple";
  const colorOptions = document.querySelectorAll(".color-option");
  colorOptions.forEach(o => {
    if (o.getAttribute("data-color") === "note-purple") {
      o.classList.add("selected");
    } else {
      o.classList.remove("selected");
    }
  });

  // Reset modal header
  const modalTitle = document.querySelector('#new-note-modal .modal-header h3');
  if (modalTitle) modalTitle.textContent = 'New Study Note';

  if (modal) {
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("active"), 10);
  }
}

export function closeNewNoteModal() {
  const modal = document.getElementById("new-note-modal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.style.display = "none";
    }, 250);
  }
}

function submitNewNote(appState, saveStateFunc) {
  const titleInput = document.getElementById("modal-note-title");
  const contentInput = document.getElementById("modal-note-content");
  
  const title = titleInput ? titleInput.value.trim() : "";
  const content = contentInput ? contentInput.value.trim() : "";
  
  if (!title) {
    alert("Please enter a note title.");
    return;
  }

  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  const dateStr = new Date().toLocaleDateString('en-US', options);
  const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
  const timeStr = new Date().toLocaleTimeString('en-US', timeOptions);

  if (editingNoteId) {
    // Update existing note — keep original date, add editedAt
    const note = appState.notes.find(n => n.id === editingNoteId);
    if (note) {
      note.title = title;
      note.content = content;
      note.colorClass = selectedNoteColor;
      note.editedAt = `${dateStr} at ${timeStr}`;
    }
    editingNoteId = null;
  } else {
    const newNote = {
      id: `note-${Date.now()}`,
      title: title,
      content: content,
      date: dateStr,
      colorClass: selectedNoteColor
    };
    appState.notes.unshift(newNote);
  }
  
  saveStateFunc();
  
  const searchInput = document.getElementById("notes-search");
  renderNotes(appState, searchInput ? searchInput.value.trim() : "");
  closeNewNoteModal();
}

export function renderNotes(appState, searchFilter = "") {
  const container = document.getElementById("notes-container-grid");
  if (!container) return;

  if (notesLayoutMode === "list") {
    container.classList.add("list-view");
  } else {
    container.classList.remove("list-view");
  }

  const filtered = appState.notes.filter(note => {
    const term = searchFilter.toLowerCase();
    return note.title.toLowerCase().includes(term) || note.content.toLowerCase().includes(term);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: var(--text-gray);">
        <p style="font-size: 14px;">No notes found matching your search.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(note => {
    let colorHex = "var(--note-purple)";
    let borderHex = "var(--note-purple-border)";
    if (note.colorClass === "note-blue") { colorHex = "var(--note-blue)"; borderHex = "var(--note-blue-border)"; }
    else if (note.colorClass === "note-green") { colorHex = "var(--note-green)"; borderHex = "var(--note-green-border)"; }
    else if (note.colorClass === "note-yellow") { colorHex = "var(--note-yellow)"; borderHex = "var(--note-yellow-border)"; }
    else if (note.colorClass === "note-pink") { colorHex = "var(--note-pink)"; borderHex = "var(--note-pink-border)"; }
    else if (note.colorClass === "note-indigo") { colorHex = "var(--note-indigo)"; borderHex = "var(--note-indigo-border)"; }
    else if (note.colorClass === "note-cyan") { colorHex = "var(--note-cyan)"; borderHex = "var(--note-cyan-border)"; }
    else if (note.colorClass === "note-orange") { colorHex = "var(--note-orange)"; borderHex = "var(--note-orange-border)"; }

    // Build date display: original date + edited timestamp
    let dateDisplay = note.date;
    if (note.editedAt) {
      dateDisplay += `<span class="note-edited-tag"> · Edited ${note.editedAt}</span>`;
    }

    return `
      <div class="note-card" style="background-color: ${colorHex}; border-color: ${borderHex}">
        <div class="note-card-top">
          <div class="note-header-row">
            <span class="note-title">${note.title}</span>
            <div class="note-actions">
              <button class="edit-note-btn" onclick="editNote('${note.id}')" title="Edit Note">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                </svg>
              </button>
              <button class="delete-note-btn" onclick="deleteNote('${note.id}')" title="Delete Note">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          </div>
          <div class="note-content">${note.content}</div>
        </div>
        <div class="note-date">
          <svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          ${dateDisplay}
        </div>
      </div>
    `;
  }).join('');
}
