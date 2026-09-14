/* =============================================
   READING MODE, AUTO-SCROLL, TTS
   ============================================= */
let isReadingMode = false;
let isAutoScrolling = false;
let autoScrollInterval = null;
let isSpeaking = false;
let synth = window.speechSynthesis;
let utterance = null;

window.enterReadingMode = function() {
  if (isReadingMode) return;
  isReadingMode = true;
  document.body.classList.add("reading-mode");
  noteContent.contentEditable = "false";
  readingBar.style.display = "flex";
  readingModeBtn.classList.add("active");
};

window.exitReadingMode = function() {
  if (!isReadingMode) return;
  isReadingMode = false;
  document.body.classList.remove("reading-mode");
  noteContent.contentEditable = "true";
  readingBar.style.display = "none";
  readingModeBtn.classList.remove("active");
  stopAutoScroll();
  stopSpeaking();
};

function toggleReadingMode() {
  if (isReadingMode) window.exitReadingMode();
  else window.enterReadingMode();
}

readingModeBtn.addEventListener("click", () => {
  if (activeNoteId) {
    if (isReadingMode) {
      window.Router.navigate(`/notes`);
    } else {
      window.Router.navigate(`/notes/read`);
    }
  }
});
exitReadingBtn.addEventListener("click", () => {
  if (activeNoteId) window.Router.navigate(`/notes`);
  else window.Router.navigate(`/`);
});

function toggleAutoScroll() {
  if (!isAutoScrolling) {
    if (noteContent.scrollHeight <= noteContent.clientHeight + 10) {
      if (typeof showToast === 'function') showToast("Not enough text to scroll.");
      return;
    }
  }

  isAutoScrolling = !isAutoScrolling;
  if (isAutoScrolling) {
    autoScrollBtn.classList.add("active");
    autoScrollIcon.textContent = "pause";
    autoScrollInterval = setInterval(() => {
      noteContent.scrollTop += 1;
      if (noteContent.scrollTop + noteContent.clientHeight >= noteContent.scrollHeight - 1) {
        stopAutoScroll();
      }
    }, 30);
  } else {
    stopAutoScroll();
  }
}

function stopAutoScroll() {
  isAutoScrolling = false;
  clearInterval(autoScrollInterval);
  autoScrollBtn.classList.remove("active");
  autoScrollIcon.textContent = "play_arrow";
}

autoScrollBtn.addEventListener("click", toggleAutoScroll);

function toggleSpeak() {
  if (isSpeaking) {
    if (synth.paused) {
      synth.resume();
      speakIcon.textContent = "pause";
      speakBtn.classList.add("active");
    } else {
      synth.pause();
      speakIcon.textContent = "play_arrow";
      speakBtn.classList.remove("active");
    }
  } else {
    let parsedContent = "";
    // Parse note content to add pauses for checklists
    // Parse note content to add pauses for checklists and block elements
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = noteContent.innerHTML;
    
    // Replace checkboxes with text equivalents so TTS reads them correctly with pauses
    const checkboxes = tempDiv.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
      // Check the original element in the DOM to see if it's checked, or fallback to attribute
      const isChecked = cb.checked || cb.hasAttribute('checked');
      const textNode = document.createTextNode(isChecked ? "Completed task: " : "Task: ");
      cb.parentNode.replaceChild(textNode, cb);
    });
    
    // Convert block elements (div, p, br) into newlines so TTS pauses correctly
    tempDiv.innerHTML = tempDiv.innerHTML.replace(/<br\s*\/?>/gi, "\n")
                                         .replace(/<\/div>/gi, "\n")
                                         .replace(/<\/p>/gi, "\n");
                                         
    parsedContent = tempDiv.textContent;

    const textToRead = noteTitleInput.value + ".\n\n" + parsedContent;
    if (!textToRead.trim()) return;
    
    utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.onend = () => stopSpeaking();
    
    synth.speak(utterance);
    isSpeaking = true;
    speakIcon.textContent = "pause";
    speakBtn.classList.add("active");
  }
}

function stopSpeaking() {
  synth.cancel();
  isSpeaking = false;
  speakIcon.textContent = "volume_up";
  speakBtn.classList.remove("active");
}

speakBtn.addEventListener("click", toggleSpeak);
window.addEventListener('beforeunload', () => synth.cancel());


