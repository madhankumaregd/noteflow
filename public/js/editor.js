/* =============================================
   FORMATTING TOOLBAR
   ============================================= */

function execCmd(command, value) {
  noteContent.focus();
  document.execCommand(command, false, value || null);
  autoSave();
  updateToolbarState();
}

document.querySelectorAll(".toolbar-btn[data-command]").forEach((btn) => {
  btn.addEventListener("mousedown", (e) => e.preventDefault());
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    execCmd(btn.dataset.command);
  });
});

undoBtn.addEventListener("click", () => execCmd("undo"));
redoBtn.addEventListener("click", () => execCmd("redo"));

fontFamilySelect.addEventListener("change", () => {
  execCmd("fontName", fontFamilySelect.value);
});

fontSizeSelect.addEventListener("change", () => {
  execCmd("fontSize", fontSizeSelect.value);
});

headingSelect.addEventListener("change", () => {
  execCmd("formatBlock", headingSelect.value);
  headingSelect.value = "p";
});

textColorPicker.addEventListener("input", (e) => {
  execCmd("foreColor", e.target.value);
  textColorIndicator.style.background = e.target.value;
});

highlightColorPicker.addEventListener("input", (e) => {
  execCmd("hiliteColor", e.target.value);
  highlightColorIndicator.style.background = e.target.value;
});

blockquoteBtn.addEventListener("click", () => {
  execCmd("formatBlock", "BLOCKQUOTE");
});

codeBlockBtn.addEventListener("click", () => {
  const selection = window.getSelection();
  const text = selection.toString();
  const html = `<pre><code>${text || 'Enter code here...'}</code></pre><p><br></p>`;
  execCmd("insertHTML", html);
});

printBtn.addEventListener("click", () => window.print());

function updateToolbarState() {
  const commands = [
    "bold", "italic", "underline", "strikeThrough",
    "subscript", "superscript",
    "justifyLeft", "justifyCenter", "justifyRight", "justifyFull",
    "insertUnorderedList", "insertOrderedList"
  ];
  commands.forEach((cmd) => {
    const btn = document.querySelector(`.toolbar-btn[data-command="${cmd}"]`);
    if (btn) {
      try {
        btn.classList.toggle("active", document.queryCommandState(cmd));
      } catch (e) {}
    }
  });

  const currentFont = document.queryCommandValue("fontName");
  if (currentFont) {
    const clean = currentFont.replace(/['"]/g, "");
    const option = [...fontFamilySelect.options].find(
      (o) => o.value.toLowerCase() === clean.toLowerCase()
    );
    if (option) fontFamilySelect.value = option.value;
  }

  const currentSize = document.queryCommandValue("fontSize");
  if (currentSize && currentSize !== "false") {
    fontSizeSelect.value = currentSize;
  }
}

document.addEventListener("selectionchange", () => {
  if (document.activeElement === noteContent || noteContent.contains(document.activeElement)) {
    updateToolbarState();
  }
});
noteContent.addEventListener("keyup", updateToolbarState);


