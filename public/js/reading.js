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
  if (activeNoteId) window.Router.navigate(`/notes/read`);
});
exitReadingBtn.addEventListener("click", () => {
  if (activeNoteId) window.Router.navigate(`/notes`);
  else window.Router.navigate(`/`);
});

function toggleAutoScroll() {
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
    const textToRead = noteTitleInput.value + ".\n" + noteContent.innerText;
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


