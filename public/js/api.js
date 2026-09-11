/* =============================================
   PER-USER TURSO CLOUD DB STORAGE & MIGRATION
   ============================================= */

async function loadNotes() {
  setSaveStatus("saving");

  // Migration: Bulk sync old local notes if they haven't been pushed
  const hasMigrated = localStorage.getItem(MIGRATION_KEY);
  if (!hasMigrated) {
    try {
      const localRaw = localStorage.getItem(DB_KEY);
      const localNotes = localRaw ? JSON.parse(localRaw) : [];
      
      if (localNotes.length > 0) {
        console.log(`🔒 Migrating ${localNotes.length} local notes securely under User ID: ${session.userId}`);
        await fetch('/api/notes', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(localNotes)
        });
      }
      localStorage.setItem(MIGRATION_KEY, "true");
    } catch (err) {
      console.warn('Migration warning:', err);
    }
  }

  // Fetch notes scoped to current userId
  try {
    const res = await fetch('/api/notes', {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      notes = await res.json();
      localStorage.setItem(DB_KEY, JSON.stringify(notes));
    } else {
      throw new Error('API request failed');
    }
  } catch (err) {
    console.warn('⚠️ Could not connect to Turso Cloud, using offline fallback:', err);
    const raw = localStorage.getItem(DB_KEY);
    notes = raw ? JSON.parse(raw) : [];
  }

  setSaveStatus("saved");
  render();
}

async function saveNoteToCloud(note) {
  try {
    await fetch('/api/notes', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(note)
    });
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


