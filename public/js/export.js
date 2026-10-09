/* =============================================
   PHASE 3: EXPORT / SHARE
   ============================================= */

const exportNoteBtn = document.getElementById('exportNoteBtn');

// Create the export dropdown programmatically
const exportDropdownHtml = `
  <div class="export-dropdown" id="exportDropdown">
    <button class="export-dropdown-item" id="exportDownloadPdf">
      <span class="material-symbols-rounded">picture_as_pdf</span>
      Download as PDF
    </button>
    <button class="export-dropdown-item" id="exportDownloadDocx">
      <span class="material-symbols-rounded">description</span>
      Download as Word (DOCX)
    </button>
    <button class="export-dropdown-item" id="exportDownloadTxt">
      <span class="material-symbols-rounded">text_snippet</span>
      Download as TXT
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
const exportDownloadPdf = document.getElementById('exportDownloadPdf');
const exportDownloadDocx = document.getElementById('exportDownloadDocx');
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

function getSanitizedTitle(title) {
  return title.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_').substring(0, 50) || 'note';
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download as .txt
exportDownloadTxt.addEventListener('click', () => {
  const note = notes.find(n => n.id === activeNoteId);
  if (!note) return;
  const title = note.title || 'Untitled';
  const plainText = formatNoteAsText(note.content);
  const fileContent = `${title}\n${'='.repeat(title.length)}\n\n${plainText}`;
  const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, `${getSanitizedTitle(title)}.txt`);
  exportDropdown.classList.remove('open');
  showToast('Note exported as .txt');
});

// Download as .docx (using MSO HTML wrapper)
exportDownloadDocx.addEventListener('click', () => {
  const note = notes.find(n => n.id === activeNoteId);
  if (!note) return;
  const title = note.title || 'Untitled';
  const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title></head><body>";
  const postHtml = "</body></html>";
  const html = preHtml + `<h1>${title}</h1>` + noteContent.innerHTML + postHtml;
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  triggerDownload(blob, `${getSanitizedTitle(title)}.doc`);
  exportDropdown.classList.remove('open');
  showToast('Note exported as Word');
});

// Download as PDF (dynamically loading html2pdf.js)
exportDownloadPdf.addEventListener('click', async () => {
  const note = notes.find(n => n.id === activeNoteId);
  if (!note) return;
  
  exportDropdown.classList.remove('open');
  showToast('Preparing PDF...');

  if (!window.html2pdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const title = note.title || 'Untitled';
  const element = document.createElement('div');
  element.innerHTML = `<h1>${title}</h1>` + noteContent.innerHTML;
  element.style.padding = '20px';
  element.style.fontFamily = 'sans-serif';

  html2pdf().set({
    margin: 1,
    filename: `${getSanitizedTitle(title)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  }).from(element).save().then(() => {
    showToast('Note exported as PDF');
  });
});

// Share via native API
exportShareNative.addEventListener('click', async () => {
  const note = notes.find(n => n.id === activeNoteId);
  if (!note) return;

  const title = note.title || 'Untitled';
  const plainText = formatNoteAsText(note.content);

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



