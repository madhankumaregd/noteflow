/* =============================================
   PER-USER TURSO CLOUD DB STORAGE & MIGRATION
   ============================================= */

async function loadNotes() {
  setSaveStatus("saving");

  // 1. Instant optimistic load from localStorage: User sees their notes at 0ms!
  const localRaw = localStorage.getItem(DB_KEY);
  if (localRaw) {
    try {
      const localNotes = JSON.parse(localRaw);
      if (Array.isArray(localNotes) && localNotes.length > 0) {
        notes = localNotes;
        render(); // Immediately render local notes
      }
    } catch (e) {
      console.warn("Could not read local notes cache:", e);
    }
  }

  // 2. Fetch notes scoped to current userId
  try {
    const res = await fetch('/api/notes', {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const cloudNotes = await res.json();
      if (Array.isArray(cloudNotes)) {
        // Smart merge: Never overwrite newer local notes or local notes with images
        const localMap = new Map();
        notes.forEach(n => localMap.set(n.id, n));

        const mergedMap = new Map();

        // Start with cloud notes
        cloudNotes.forEach(cn => {
          const ln = localMap.get(cn.id);
          if (ln) {
            // If local has newer timestamp or local has an image that cloud lacks, keep local
            const localHasImg = (ln.content || '').includes('<img');
            const cloudHasImg = (cn.content || '').includes('<img');
            if ((localHasImg && !cloudHasImg) || (ln.updatedAt && ln.updatedAt > (cn.updatedAt || 0))) {
              mergedMap.set(ln.id, ln);
              // Push newer local note back to cloud so cloud catches up
              saveNoteToCloud(ln);
            } else {
              mergedMap.set(cn.id, cn);
            }
          } else {
            mergedMap.set(cn.id, cn);
          }
        });

        // Add any local notes that are not yet in cloud
        localMap.forEach((ln, id) => {
          if (!mergedMap.has(id)) {
            mergedMap.set(id, ln);
            saveNoteToCloud(ln);
          }
        });

        const oldState = JSON.stringify(notes);
        notes = Array.from(mergedMap.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        const newState = JSON.stringify(notes);

        if (oldState !== newState) {
          localStorage.setItem(DB_KEY, newState);
          render();
        }
      }
    } else {
      throw new Error('API request failed');
    }
  } catch (err) {
    console.warn('⚠️ Cloud fetch error, keeping local notes safe:', err);
  }

  setSaveStatus("saved");
}

async function saveNoteToCloud(note) {
  try {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(note)
    });
    if (res.status === 429) {
      const data = await res.json();
      alert(data.error || 'Daily note creation limit reached. Please try again tomorrow.');
    } else if (res.status === 413) {
      const data = await res.json();
      alert(data.error || 'Note is too large to save. Please reduce the content size.');
    }
    localStorage.setItem(DB_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Error saving to Turso:', err);
    localStorage.setItem(DB_KEY, JSON.stringify(notes));
  }
}

async function deleteNoteFromCloud(id) {
  try {
    await fetch(`/api/notes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    localStorage.setItem(DB_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Error deleting from Turso:', err);
    localStorage.setItem(DB_KEY, JSON.stringify(notes));
  }
}


