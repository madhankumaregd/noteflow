/* =============================================
   PHASE 3: EXPORT / SHARE
   ============================================= */

const exportNoteBtn = document.getElementById('exportNoteBtn');

// Create the export dropdown programmatically
const exportDropdownHtml = `
  <div class="export-dropdown" id="exportDropdown">
    <button class="export-dropdown-item" id="exportDownloadTxt">
      <span class="material-symbols-rounded">download</span>
      Download as .txt
    </button>
    <div class="export-dropdown-divider"></div>
    <button class="export-dropdown-item" id="exportShareNative" style="display:none">
      <span class="material-symbols-rounded">share</span>
      Share via device...
    </button>
  </div>
`;

// Wrap the export button in a relative container for dropdown positioning
const exportWrapper = document.createElement('div');
exportWrapper.style.position = 'relative';
exportWrapper.style.display = 'inline-flex';
exportNoteBtn.parentNode.insertBefore(exportWrapper, exportNoteBtn);
exportWrapper.appendChild(exportNoteBtn);
exportWrapper.insertAdjacentHTML('beforeend', exportDropdownHtml);

const exportDropdown = document.getElementById('exportDropdown');
const exportDownloadTxt = document.getElementById('exportDownloadTxt');
const exportShareNative = document.getElementById('exportShareNative');

// Show share option if Web Share API is available
if (navigator.share) {
  exportShareNative.style.display = 'flex';
}

// Toggle dropdown
exportNoteBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  exportDropdown.classList.toggle('open');
});

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  if (!exportWrapper.contains(e.target)) {
    exportDropdown.classList.remove('open');
  }
});

// Download as .txt
exportDownloadTxt.addEventListener('click', () => {
  const note = notes.find(n => n.id === activeNoteId);
  if (!note) return;

  const title = note.title || 'Untitled';
  const plainText = stripHtml(note.content);
  const fileContent = `${title}\n${'='.repeat(title.length)}\n\n${plainText}`;

  // Create a sanitized filename
  const sanitizedTitle = title
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50) || 'note';

  const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizedTitle}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  exportDropdown.classList.remove('open');
  showToast('Note exported as .txt');
});

// Share via native API
exportShareNative.addEventListener('click', async () => {
  const note = notes.find(n => n.id === activeNoteId);
  if (!note) return;

  const title = note.title || 'Untitled';
  const plainText = stripHtml(note.content);

  try {
    await navigator.share({
      title: title,
      text: plainText,
    });
    showToast('Note shared successfully');
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Share failed:', err);
      showToast('Sharing cancelled');
    }
  }

  exportDropdown.classList.remove('open');
});

// Close export dropdown on Escape key (add to existing Escape handler)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    exportDropdown.classList.remove('open');
  }
});



