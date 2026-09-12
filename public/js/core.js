/* =============================================
   DISPLAY NAME EDIT LOGIC
   ============================================= */
displayNameSettingBtn.addEventListener("click", () => {
  editDisplayNameInput.value = currentProfile?.displayName || "";
  displayNameModalOverlay.classList.add("open");
});

displayNameCloseBtn.addEventListener("click", () => {
  displayNameModalOverlay.classList.remove("open");
});

saveDisplayNameBtn.addEventListener("click", async () => {
  try {
    saveDisplayNameBtn.disabled = true;
    saveDisplayNameBtn.textContent = "Saving...";
    await fetch('/api/profile', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ displayName: editDisplayNameInput.value })
    });
    await loadProfile();
    displayNameModalOverlay.classList.remove("open");
  } catch (err) {
    console.error("Failed to save profile", err);
  } finally {
    saveDisplayNameBtn.disabled = false;
    saveDisplayNameBtn.textContent = "Save";
  }
});


/* =============================================
   PASSWORD EDIT LOGIC
   ============================================= */
passwordSettingBtn.addEventListener("click", () => {
  currentPasswordInput.value = "";
  newPasswordInput.value = "";
  confirmNewPasswordInput.value = "";
  passwordError.textContent = "";
  updatePwRulesUI(validatePassword(""), "passwordModalOverlay");
  passwordModalOverlay.classList.add("open");
});

passwordCloseBtn.addEventListener("click", () => {
  passwordModalOverlay.classList.remove("open");
});

newPasswordInput.addEventListener("input", () => {
  const rules = validatePassword(newPasswordInput.value);
  updatePwRulesUI(rules, "passwordModalOverlay");
});

savePasswordBtn.addEventListener("click", async () => {
  const currentPw = currentPasswordInput.value;
  const newPw = newPasswordInput.value;
  const confirmPw = confirmNewPasswordInput.value;
  
  if (!currentPw || !newPw || !confirmPw) {
    passwordError.textContent = "Please fill in all password fields.";
    return;
  }
  
  if (newPw !== confirmPw) {
    passwordError.textContent = "New passwords do not match.";
    return;
  }
  
  const rules = validatePassword(newPw);
  if (!rules.len || !rules.upper || !rules.lower || !rules.num) {
    passwordError.textContent = "New password does not meet requirements.";
    return;
  }
  
  try {
    savePasswordBtn.disabled = true;
    savePasswordBtn.textContent = "Updating...";
    
    const res = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        currentPassword: currentPw,
        newPassword: newPw
      })
    });
    
    const data = await res.json();
    if (!res.ok) {
      passwordError.textContent = data.error || "Failed to update password.";
    } else {
      passwordModalOverlay.classList.remove("open");
    }
  } catch (err) {
    passwordError.textContent = "Network error. Please try again.";
  } finally {
    savePasswordBtn.disabled = false;
    savePasswordBtn.textContent = "Update Password";
  }
});




/* =============================================
   COLOR PICKER CANVAS
   ============================================= */

let colorCtx = colorPickerCanvas.getContext("2d");
let isDraggingColor = false;
let recentColors = ["#e8b86d", "#4ade80", "#38bdf8", "#ec4899", "#8b5cf6"];

function drawColorCanvas(hue) {
  const width = colorPickerCanvas.width;
  const height = colorPickerCanvas.height;
  
  colorCtx.clearRect(0, 0, width, height);

  // Base hue
  colorCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
  colorCtx.fillRect(0, 0, width, height);

  // White gradient (left to right)
  let gradWhite = colorCtx.createLinearGradient(0, 0, width, 0);
  gradWhite.addColorStop(0, "rgba(255,255,255,1)");
  gradWhite.addColorStop(1, "rgba(255,255,255,0)");
  colorCtx.fillStyle = gradWhite;
  colorCtx.fillRect(0, 0, width, height);

  // Black gradient (bottom to top)
  let gradBlack = colorCtx.createLinearGradient(0, height, 0, 0);
  gradBlack.addColorStop(0, "rgba(0,0,0,1)");
  gradBlack.addColorStop(1, "rgba(0,0,0,0)");
  colorCtx.fillStyle = gradBlack;
  colorCtx.fillRect(0, 0, width, height);
}

function initColorPicker() {
  drawColorCanvas(colorHueSlider.value);
  renderRecentColors();
}

colorHueSlider.addEventListener("input", (e) => {
  drawColorCanvas(e.target.value);
});

function pickColor(e) {
  const rect = colorPickerCanvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  
  x = Math.max(0, Math.min(x, colorPickerCanvas.width - 1));
  y = Math.max(0, Math.min(y, colorPickerCanvas.height - 1));

  const imgData = colorCtx.getImageData(x, y, 1, 1).data;
  const hex = "#" + [imgData[0], imgData[1], imgData[2]].map(x => {
    const h = x.toString(16);
    return h.length === 1 ? "0" + h : h;
  }).join("");
  
  updateCustomAccent(hex);
}

function updateCustomAccent(hex) {
  colorHexInput.value = hex;
  colorPreviewSwatch.style.background = hex;
  if (document.querySelector(".profile-theme-btn.active")?.dataset.theme === "custom") {
    applyTheme("custom", hex);
  }
}

colorPickerCanvas.addEventListener("mousedown", (e) => {
  isDraggingColor = true;
  pickColor(e);
});
window.addEventListener("mouseup", () => {
  if (isDraggingColor) {
    isDraggingColor = false;
    addToRecentColors(colorHexInput.value);
  }
});
colorPickerCanvas.addEventListener("mousemove", (e) => {
  if (isDraggingColor) pickColor(e);
});

colorHexInput.addEventListener("change", (e) => {
  let val = e.target.value;
  if (!val.startsWith("#")) val = "#" + val;
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    updateCustomAccent(val);
    addToRecentColors(val);
  }
});

function addToRecentColors(hex) {
  if (recentColors.includes(hex)) return;
  recentColors.unshift(hex);
  if (recentColors.length > 8) recentColors.pop();
  renderRecentColors();
}

function renderRecentColors() {
  colorHistory.innerHTML = '<span class="color-history-label">Recent:</span>';
  recentColors.forEach(c => {
    const swatch = document.createElement("div");
    swatch.className = "color-history-swatch";
    swatch.style.background = c;
    swatch.title = c;
    swatch.addEventListener("click", () => {
      updateCustomAccent(c);
    });
    colorHistory.appendChild(swatch);
  });
}



/* =============================================
   ACTIONS
   ============================================= */
async function createNote(template = 'blank', diaryName = '') {
  const now = new Date();
  const dateStr = now.toLocaleDateString(currentLang === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString(currentLang === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  let title = '';
  let content = '';
  let tags = [];
  let settings = {};

  if (template === 'diary') {
    const name = diaryName || 'My Diary';
    title = `${name} — ${dateStr}`;
    content = `<p><strong>📅 ${dateStr}</strong> &nbsp; <em>${timeStr}</em></p><hr/><p><strong>${t('diaryReflectionHeading')}</strong></p><p><br/></p>`;
    tags = [`📖 ${name}`];
  } else if (template === 'script') {
    title = 'Untitled Script';
    content = `<div class="script-mode"><p class="script-heading">UNTITLED SCREENPLAY</p><p class="script-slug">INT. LOCATION - DAY</p><p class="script-action">Description of the scene.</p><p class="script-character">CHARACTER NAME</p><p class="script-dialogue">Dialogue goes here.</p></div>`;
    settings.scriptMode = true;
  }

  const note = {
    id: generateId(),
    title,
    content,
    tags,
    settings,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  notes.unshift(note);
  activeNoteId = note.id;
  if (note.id) {
    localStorage.setItem('lastActiveNoteId', note.id);
  }
  render();
  noteTitleInput.focus();

  await saveNoteToCloud(note);

  if (window.innerWidth <= 768) sidebar.classList.remove("open");
}

function openNote(id) {
  activeNoteId = id;
  if (id) {
    localStorage.setItem('lastActiveNoteId', id);
  } else {
    localStorage.removeItem('lastActiveNoteId');
  }
  
  if (document.body.classList.contains("reading-mode")) {
    toggleReadingMode();
  }
  
  render();
  if (window.innerWidth <= 768) sidebar.classList.remove("open");
}

function autoSave() {
  const note = notes.find((n) => n.id === activeNoteId);
  if (!note) return;
  setSaveStatus("saving");
  note.title = noteTitleInput.value;
  note.content = noteContent.innerHTML;
  note.tags = parseTags(tagInput.value);
  note.updatedAt = Date.now();

  updateWordCount();
  
  const card = document.querySelector(`.note-card[data-id="${note.id}"]`);
  if (card) {
      const plainTextPreview = stripHtml(note.content);
      card.querySelector('.note-card-title').textContent = note.title || "Untitled";
      card.querySelector('.note-card-preview').textContent = plainTextPreview || "No content yet...";
      card.querySelector('.note-card-date').textContent = formatDate(note.updatedAt);
      card.querySelector('.note-card-tags').innerHTML = note.tags.map(t => `<span class="note-tag-badge">${escapeHtml(t)}</span>`).join("");
  }
  renderTagsFilter();

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await saveNoteToCloud(note);
    setSaveStatus("saved");
  }, 600);
}

async function deleteActiveNote() {
  const targetId = activeNoteId;
  notes = notes.filter((n) => n.id !== targetId);
  activeNoteId = notes.length > 0 ? notes[0].id : null;
  modalOverlay.classList.remove("open");
  render();

  if (targetId) {
    await deleteNoteFromCloud(targetId);
  }
}


/* =============================================
   DUPLICATE NOTE
   ============================================= */
async function duplicateActiveNote() {
  const source = notes.find((n) => n.id === activeNoteId);
  if (!source) return;

  const clone = {
    id: generateId(),
    title: source.title ? `${source.title} (Copy)` : "Untitled (Copy)",
    content: source.content,
    tags: [...source.tags],
    settings: JSON.parse(JSON.stringify(source.settings || {})),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  notes.unshift(clone);
  activeNoteId = clone.id;
  render();
  
  await saveNoteToCloud(clone);
  setSaveStatus("saved");
}

duplicateNoteBtn.addEventListener("click", duplicateActiveNote);


/* =============================================
   LINK & IMAGE INSERTION
   ============================================= */
let savedSelection = null;

function saveSelection() {
    if (window.getSelection) {
        let sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            return sel.getRangeAt(0);
        }
    }
    return null;
}

function restoreSelection(range) {
    if (range) {
        if (window.getSelection) {
            let sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
}

insertLinkBtn.addEventListener("click", (e) => {
  e.preventDefault();
  savedSelection = saveSelection();
  linkUrlInput.value = "";
  linkTextInput.value = window.getSelection().toString();
  linkModalOverlay.classList.add("open");
  setTimeout(() => linkUrlInput.focus(), 100);
});

cancelLink.addEventListener("click", () => linkModalOverlay.classList.remove("open"));
confirmLink.addEventListener("click", () => {
  const url = linkUrlInput.value.trim();
  const text = linkTextInput.value.trim() || url;
  if (!url) return;
  
  restoreSelection(savedSelection);
  const html = `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  execCmd("insertHTML", html);
  linkModalOverlay.classList.remove("open");
});

insertImageBtn.addEventListener("click", (e) => {
  e.preventDefault();
  savedSelection = saveSelection();
  imageUrlInput.value = "";
  imageAltInput.value = "";
  imageFileInput.value = "";
  imageUploadStatus.style.display = "none";
  imageUploadStatus.textContent = "Uploading... Please wait.";
  imageModalOverlay.classList.add("open");
  setTimeout(() => imageUrlInput.focus(), 100);
});

imageFileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  imageUploadStatus.style.display = "block";
  imageUploadStatus.style.color = "var(--primary)";
  imageUploadStatus.textContent = "Uploading to ImgBB... Please wait.";
  
  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch("https://api.imgbb.com/1/upload?key=dbbe3c2f752dff0d212ffe00c97d19cc", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    
    if (data.success) {
      imageUploadStatus.textContent = "Upload successful! Inserting...";
      imageUploadStatus.style.color = "#10b981"; // Success green
      
      // Auto fill and confirm
      imageUrlInput.value = data.data.url;
      setTimeout(() => {
        confirmImage.click();
      }, 500);
    } else {
      throw new Error(data.error?.message || "Upload failed");
    }
  } catch (error) {
    imageUploadStatus.textContent = "Error: " + error.message;
    imageUploadStatus.style.color = "var(--danger)";
    console.error("ImgBB upload error:", error);
  }
});

cancelImage.addEventListener("click", () => imageModalOverlay.classList.remove("open"));
confirmImage.addEventListener("click", () => {
  const url = imageUrlInput.value.trim();
  const alt = imageAltInput.value.trim();
  if (!url) return;
  
  restoreSelection(savedSelection);
  const html = `<img src="${url}" alt="${alt}" /><p><br></p>`;
  execCmd("insertHTML", html);
  imageModalOverlay.classList.remove("open");
});

[linkModalOverlay, imageModalOverlay].forEach(modal => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
});


/* =============================================
   EVENT LISTENERS
   ============================================= */

// New Note Dropdown
const newNoteDropdown = document.getElementById('newNoteDropdown');
let newNoteDropdownOpen = false;

newNoteBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  newNoteDropdownOpen = !newNoteDropdownOpen;
  newNoteDropdown.classList.toggle('open', newNoteDropdownOpen);
});

document.addEventListener('click', (e) => {
  if (newNoteDropdownOpen && !e.target.closest('.new-note-dropdown-wrap')) {
    newNoteDropdownOpen = false;
    newNoteDropdown.classList.remove('open');
  }
});

document.querySelectorAll('.new-note-dropdown-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    const template = item.dataset.template;
    newNoteDropdownOpen = false;
    newNoteDropdown.classList.remove('open');

    if (template === 'diary') {
      const diaryTags = [];
      notes.forEach(n => {
        n.tags.forEach(tag => {
          if (tag.startsWith('📖 ') && !diaryTags.includes(tag)) {
            diaryTags.push(tag);
          }
        });
      });

      existingDiarySelect.innerHTML = '';
      if (diaryTags.length > 0) {
        diaryTags.forEach(tag => {
          const opt = document.createElement('option');
          opt.value = tag.replace('📖 ', '');
          opt.textContent = tag.replace('📖 ', '');
          existingDiarySelect.appendChild(opt);
        });
        diaryTypeExisting.disabled = false;
        diaryTypeExisting.parentElement.style.opacity = 1;
        diaryTypeExisting.checked = true;
      } else {
        diaryTypeExisting.disabled = true;
        diaryTypeExisting.parentElement.style.opacity = 0.5;
        diaryTypeNew.checked = true;
      }
      
      diaryTypeNew.dispatchEvent(new Event('change'));
      diaryTypeExisting.dispatchEvent(new Event('change'));
      
      newDiaryNameInput.value = '';
      diaryTypeModalOverlay.classList.add('open');
      
    } else {
      createNote(template);
    }
  });
});

newNoteBtnLg.addEventListener("click", () => createNote('blank'));
// Diary Modal Logic
diaryTypeNew.addEventListener('change', () => {
  if (diaryTypeNew.checked) {
    newDiaryGroup.style.display = 'block';
    existingDiaryGroup.style.display = 'none';
  }
});
diaryTypeExisting.addEventListener('change', () => {
  if (diaryTypeExisting.checked) {
    newDiaryGroup.style.display = 'none';
    existingDiaryGroup.style.display = 'block';
  }
});
diaryCancelBtn.addEventListener('click', () => {
  diaryTypeModalOverlay.classList.remove('open');
});
diaryProceedBtn.addEventListener('click', () => {
  const isNew = diaryTypeNew.checked;
  let diaryName = isNew ? newDiaryNameInput.value.trim() : existingDiarySelect.value;
  if (!diaryName) diaryName = 'My Diary';
  
  diaryTypeModalOverlay.classList.remove('open');
  createNote('diary', diaryName);
});

// Language Modal Logic
languageSettingBtn.addEventListener('click', () => {
  languageModalOverlay.classList.add('open');
});
languageCloseBtn.addEventListener('click', () => {
  languageModalOverlay.classList.remove('open');
});


noteTitleInput.addEventListener("input", autoSave);
tagInput.addEventListener("input", autoSave);
noteContent.addEventListener("input", autoSave); 

document.addEventListener("selectionchange", updateToolbarState);
noteContent.addEventListener("keyup", updateToolbarState);
noteContent.addEventListener("mouseup", updateToolbarState);

if (toolbarMenuBtn) {
  toolbarMenuBtn.addEventListener("click", () => {
    if (toolbarExtras) {
      toolbarExtras.classList.toggle("show");
    }
  });
}

// Ensure clicking outside toolbar hides extras on mobile
document.addEventListener("click", (e) => {
  if (toolbarExtras && toolbarExtras.classList.contains("show")) {
    if (!toolbarMenuBtn.contains(e.target) && !toolbarExtras.contains(e.target)) {
      toolbarExtras.classList.remove("show");
    }
  }
});

noteContent.addEventListener("change", (e) => {
  if (e.target.type === "checkbox") {
    if (e.target.checked) {
      e.target.setAttribute("checked", "checked");
    } else {
      e.target.removeAttribute("checked");
    }
    autoSave();
  }
});

addChecklistBtn.addEventListener("click", () => {
  execCmd("insertHTML", '<div><input type="checkbox" class="note-checkbox"> &nbsp;</div>');
});

// Checklist Settings Modal Logic
window.openChecklistSettings = function(noteId) {
  const note = notes.find((n) => n.id === noteId);
  if (!note) return;
  const config = note.settings?.checklistRefresh || { type: 'none', days: [], time: '00:00' };
  
  checklistRefreshType.value = config.type || 'none';
  checklistRefreshTime.value = config.time || '00:00';
  
  const daysButtons = checklistRefreshDays.querySelectorAll('.tag-pill');
  daysButtons.forEach(btn => {
    const dayVal = parseInt(btn.dataset.day);
    if (config.days && config.days.includes(dayVal)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  updateChecklistSettingsUI();
  checklistSettingsModalOverlay.classList.add("open");
};

checklistSettingsBtn.addEventListener("click", () => {
  if (activeNoteId) window.Router.navigate(`/notes/settings`);
});

function updateChecklistSettingsUI() {
  const type = checklistRefreshType.value;
  if (type === 'none') {
    checklistRefreshDaysGroup.style.display = 'none';
    checklistRefreshTimeGroup.style.display = 'none';
  } else if (type === 'daily') {
    checklistRefreshDaysGroup.style.display = 'none';
    checklistRefreshTimeGroup.style.display = 'block';
  } else if (type === 'weekly') {
    checklistRefreshDaysGroup.style.display = 'block';
    checklistRefreshTimeGroup.style.display = 'block';
  }
}

checklistRefreshType.addEventListener("change", updateChecklistSettingsUI);

checklistRefreshDays.addEventListener("click", (e) => {
  if (e.target.classList.contains('tag-pill')) {
    e.target.classList.toggle('active');
  }
});

cancelChecklistSettings.addEventListener("click", () => {
  checklistSettingsModalOverlay.classList.remove("open");
  if (activeNoteId) window.Router.navigate(`/notes`);
});

checklistSettingsModalOverlay.addEventListener("click", (e) => {
  if (e.target === checklistSettingsModalOverlay) {
    checklistSettingsModalOverlay.classList.remove("open");
    if (activeNoteId) window.Router.navigate(`/notes`);
  }
});

saveChecklistSettings.addEventListener("click", () => {
  const config = {
    type: checklistRefreshType.value,
    time: checklistRefreshTime.value,
    days: Array.from(checklistRefreshDays.querySelectorAll('.tag-pill.active')).map(b => parseInt(b.dataset.day)),
    lastRefreshed: Date.now()
  };
  
  const note = notes.find((n) => n.id === activeNoteId);
  if (note) {
    if (!note.settings) note.settings = {};
    note.settings.checklistRefresh = config;
  }
  
  checklistSettingsModalOverlay.classList.remove("open");
  autoSave();
  if (activeNoteId) window.Router.navigate(`/notes`);
});

// Toast Notification Logic
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<span class="material-symbols-rounded toast-icon">check_circle</span> <span>${escapeHtml(message)}</span>`;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add("fade-out");
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 3000);
}

noteContent.addEventListener("change", (e) => {
  if (e.target.type === "checkbox") {
    if (e.target.checked) {
      e.target.setAttribute("checked", "checked");
      
      // Check if all checkboxes in the note are completed
      const allCheckboxes = noteContent.querySelectorAll('input[type="checkbox"]');
      if (allCheckboxes.length > 0) {
        const allChecked = Array.from(allCheckboxes).every(cb => cb.checked || cb.getAttribute('checked') === 'checked');
        if (allChecked) {
          showToast("All checklists completed in this note!");
        }
      }
      
    } else {
      e.target.removeAttribute("checked");
    }
    autoSave();
  }
});

// Background logic for checklist refresh
function processChecklistRefreshes() {
  if (!notes || notes.length === 0) return;
  const now = new Date();
  let modifiedAny = false;
  
  notes.forEach(note => {
    const config = note.settings?.checklistRefresh;
    if (!config || config.type === 'none') return;
    
    const lastRefreshed = config.lastRefreshed || 0;
    const timeParts = (config.time || '00:00').split(':');
    const targetHour = parseInt(timeParts[0]);
    const targetMin = parseInt(timeParts[1]);
    
    // Determine if we should refresh today based on type
    let shouldRefreshToday = false;
    if (config.type === 'daily') {
      shouldRefreshToday = true;
    } else if (config.type === 'weekly' && config.days) {
      const currentDay = now.getDay();
      if (config.days.includes(currentDay)) {
        shouldRefreshToday = true;
      }
    }
    
    if (shouldRefreshToday) {
      const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), targetHour, targetMin, 0, 0);
      
      // If current time is past the target time for today, AND we haven't refreshed since that target time
      if (now.getTime() >= targetTime.getTime() && lastRefreshed < targetTime.getTime()) {
        // We need to uncheck all checkboxes in this note
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = note.content;
        const checkboxes = tempDiv.querySelectorAll('input[type="checkbox"]');
        
        let modified = false;
        checkboxes.forEach(cb => {
          if (cb.hasAttribute('checked') || cb.checked) {
            cb.removeAttribute('checked');
            cb.checked = false;
            modified = true;
          }
        });
        
        if (modified) {
          note.content = tempDiv.innerHTML;
          if (activeNoteId === note.id && editorPanel.style.display !== "none") {
             noteContent.innerHTML = note.content;
             updateWordCount();
          }
          config.lastRefreshed = now.getTime();
          modifiedAny = true;
          saveNoteToCloud(note);
        } else {
          // Even if no checkboxes were checked, update the lastRefreshed time to prevent continuous parsing
          config.lastRefreshed = now.getTime();
          modifiedAny = true;
          saveNoteToCloud(note);
        }
      }
    }
  });
  
  if (modifiedAny) {
    renderNotesList();
    showToast("Scheduled checklists have been refreshed.");
  }
}

// Run checklist refresh check every minute
setInterval(processChecklistRefreshes, 60000);
// Also run it once on startup (wait a few seconds to let notes load)
setTimeout(processChecklistRefreshes, 5000);

searchInput.addEventListener("input", () => renderNotesList());

deleteNoteBtn.addEventListener("click", () =>
  modalOverlay.classList.add("open"),
);
cancelDelete.addEventListener("click", () =>
  modalOverlay.classList.remove("open"),
);
confirmDelete.addEventListener("click", deleteActiveNote);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.remove("open");
});

mobileToggle.addEventListener("click", () => sidebar.classList.toggle("open"));

document.addEventListener("click", (e) => {
  if (window.innerWidth <= 768 && sidebar.classList.contains("open")) {
    if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
      sidebar.classList.remove("open");
    }
  }
});

// Mobile Swipe Gestures for Sidebar
let touchstartX = 0;
let touchendX = 0;
let touchstartY = 0;
let touchendY = 0;

document.addEventListener('touchstart', e => {
  touchstartX = e.changedTouches[0].screenX;
  touchstartY = e.changedTouches[0].screenY;
}, {passive: true});

document.addEventListener('touchend', e => {
  // Ignore swipes if interacting with canvas or formatting toolbar
  if (e.target.closest('#sketchOverlay') || e.target.closest('#formattingToolbar')) return;
  
  touchendX = e.changedTouches[0].screenX;
  touchendY = e.changedTouches[0].screenY;
  
  // Ensure it's mostly horizontal swipe (diff X > diff Y)
  if (Math.abs(touchendX - touchstartX) > Math.abs(touchendY - touchstartY)) {
    if (touchendX < touchstartX - 40) { // Swiped left
      sidebar.classList.remove("open");
    }
    if (touchendX > touchstartX + 40) { // Swiped right
      sidebar.classList.add("open");
    }
  }
});

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    e.preventDefault();
    createNote();
  }
  if (e.key === "Escape") {
    modalOverlay.classList.remove("open");
    tableModalOverlay.classList.remove("open");
    linkModalOverlay.classList.remove("open");
    imageModalOverlay.classList.remove("open");
    checklistSettingsModalOverlay.classList.remove("open");
  }
});


/* =============================================
   START
   ============================================= */
initApp();





