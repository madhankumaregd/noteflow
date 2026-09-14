/* =============================================
   UTILITIES
   ============================================= */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function parseTags(str) {
  return str
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

function stripHtml(html) {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
}

function formatNoteAsText(html) {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  
  // Replace checkboxes with text brackets on newlines
  const checkboxes = temp.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    const isChecked = cb.checked || cb.hasAttribute('checked');
    const textNode = document.createTextNode(isChecked ? "\n[x] " : "\n[ ] ");
    cb.parentNode.replaceChild(textNode, cb);
  });
  
  // Replace divs and paragraphs with newlines
  const blocks = temp.querySelectorAll('div, p, br, li');
  blocks.forEach(block => {
    block.insertAdjacentText('beforebegin', '\n');
  });
  
  return (temp.innerText || temp.textContent || "").replace(/\n\s*\n/g, '\n\n').trim();
}

function updateWordCount() {
  const text = noteContent.innerText || "";
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  wordCount.textContent = `${words.length} word${words.length === 1 ? '' : 's'}`;
}

function getFilteredNotes() {
  const q = searchInput.value.trim().toLowerCase();
  return notes
    .filter((note) => {
      const matchesTag = activeTag === "all" || note.tags.includes(activeTag);
      const plainText = stripHtml(note.content).toLowerCase();
      const matchesSearch =
        !q ||
        note.title.toLowerCase().includes(q) ||
        plainText.includes(q) ||
        note.tags.some((t) => t.includes(q));
      return matchesTag && matchesSearch;
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function getAllTags() {
  const tagSet = new Set();
  notes.forEach((n) => n.tags.forEach((t) => tagSet.add(t)));
  return [...tagSet].sort();
}


