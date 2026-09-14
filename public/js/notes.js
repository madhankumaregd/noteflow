/* =============================================
   RENDER
   ============================================= */
function render() {
  renderTagsFilter();
  renderNotesList();
  renderEditor();
}

function renderTagsFilter() {
  const allTags = getAllTags();
  tagsFilter.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = "tag-pill" + (activeTag === "all" ? " active" : "");
  allBtn.dataset.tag = "all";
  allBtn.textContent = "All";
  allBtn.addEventListener("click", () => {
    activeTag = "all";
    render();
  });
  tagsFilter.appendChild(allBtn);

  allTags.forEach((tag) => {
    const btn = document.createElement("button");
    btn.className = "tag-pill" + (activeTag === tag ? " active" : "");
    btn.dataset.tag = tag;
    btn.textContent = tag;
    btn.addEventListener("click", () => {
      activeTag = tag;
      render();
    });
    tagsFilter.appendChild(btn);
  });
}

function renderNotesList() {
  const filtered = getFilteredNotes();
  notesList.innerHTML = "";

  if (filtered.length === 0) {
    notesList.innerHTML = `<div class="no-notes-msg">
      ${searchInput.value ? "No notes match your search." : "No notes yet.<br/>Create your first one!"}
    </div>`;
    return;
  }

  filtered.forEach((note) => {
    const card = document.createElement("div");
    card.className = "note-card" + (note.id === activeNoteId ? " active" : "");
    card.dataset.id = note.id;

    const tagsHtml = note.tags
      .map((t) => `<span class="note-tag-badge">${t}</span>`)
      .join("");

    const plainTextPreview = stripHtml(note.content);

    card.innerHTML = `
      <div class="note-card-title">${escapeHtml(note.title) || "Untitled"}</div>
      <div class="note-card-preview">${escapeHtml(plainTextPreview) || "No content yet..."}</div>
      <div class="note-card-meta">
        <span class="note-card-date">${formatDate(note.updatedAt)}</span>
        <div class="note-card-tags">${tagsHtml}</div>
      </div>
    `;

    card.addEventListener("click", () => {
      if (typeof openNote !== 'undefined') openNote(note.id);
      window.Router.navigate(`/notes`);
    });
    notesList.appendChild(card);
  });
}

function renderEditor() {
  if (window.location.pathname === "/settings") {
    return; // Don't override settings panel
  }
  const note = notes.find((n) => n.id === activeNoteId);
  settingsPanel.style.display = "none"; // Hide settings if we're explicitly rendering editor
  
  if (!note) {
    emptyState.style.display = "flex";
    editorPanel.style.display = "none";
    
    // Update empty state text based on notes list
    const emptyTitle = emptyState.querySelector('h2');
    const emptyBtn = emptyState.querySelector('.new-note-btn-lg');
    if (notes.length === 0) {
      emptyTitle.textContent = "Create your first note";
      emptyBtn.textContent = "Create your first note";
    } else {
      emptyTitle.textContent = "Select a note or create one";
      emptyBtn.textContent = "Create a new note";
    }
    
    return;
  }
  emptyState.style.display = "none";
  editorPanel.style.display = "flex";
  noteTitleInput.value = note.title;
  tagInput.value = note.tags.join(", ");
  
  if (noteCreatedDate) {
    noteCreatedDate.textContent = "Created: " + formatDate(note.createdAt || note.updatedAt);
  }

  noteContent.innerHTML = note.content;
  updateWordCount();
  setSaveStatus("saved");
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function setSaveStatus(state) {
  if (state === "saving") {
    saveStatus.textContent = "Saving to Cloud...";
    saveStatus.className = "save-status saving";
  } else {
    saveStatus.textContent = "Saved to Cloud";
    saveStatus.className = "save-status saved";
  }
}



// --- IN-NOTE SEARCH ---
searchNoteBtn.addEventListener('click', () => {
  if (inNoteSearchBar.style.display === 'flex') {
    inNoteSearchBar.style.display = 'none';
    window.getSelection().removeAllRanges();
  } else {
    inNoteSearchBar.style.display = 'flex';
    inNoteSearchInput.focus();
  }
});

inNoteSearchClose.addEventListener('click', () => {
  inNoteSearchBar.style.display = 'none';
  inNoteSearchInput.value = '';
  window.getSelection().removeAllRanges();
});

function doInNoteSearch(backward = false) {
  const query = inNoteSearchInput.value;
  if (!query) return;
  // window.find(aString, aCaseSensitive, aBackwards, aWrapAround)
  const found = window.find(query, false, backward, false);
  if (!found) {
    if (typeof showToast === 'function') {
      if (!noteContent.textContent.toLowerCase().includes(query.toLowerCase())) {
        showToast("No results found for '" + query + "'");
      } else {
        showToast("No more results for '" + query + "'");
      }
    }
    window.getSelection().removeAllRanges();
  } else {
    // We intentionally DO NOT refocus the input here.
    // Focusing the input causes the browser to hide the selection highlight (blink).
    // Instead, we capture Enter/Arrows globally below.
  }
}

// Handle keydown on the input itself (e.g. initial search or while typing)
inNoteSearchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    doInNoteSearch(e.shiftKey);
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    doInNoteSearch(false);
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    doInNoteSearch(true);
  }
  if (e.key === 'Escape') {
    inNoteSearchClose.click();
  }
});

// Handle keydown globally so that if focus moves to the note, Enter/Arrows still search!
document.addEventListener('keydown', (e) => {
  if (inNoteSearchBar.style.display === 'flex' && document.activeElement !== inNoteSearchInput) {
    const query = inNoteSearchInput.value;
    if (query && window.getSelection().toString().toLowerCase() === query.toLowerCase()) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        doInNoteSearch(e.shiftKey && e.key === 'Enter' ? true : false);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        doInNoteSearch(true);
      }
    }
  }
});

inNoteSearchPrev.addEventListener('click', () => doInNoteSearch(true));
inNoteSearchNext.addEventListener('click', () => doInNoteSearch(false));

