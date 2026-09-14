/* =============================================
   NOTEFLOW — APP.JS
   Features: Create, Edit, Delete, Search, Tags,
             Themes, Checklists, Formatting Toolbar,
             Font/Size, Tables, Duplicate Note,
             Reading Mode, Auto-Scroll, TTS,
             Per-User Isolated Turso Cloud Storage,
             User Authentication & Profile
   ============================================= */

const DB_KEY = "noteflow_notes";
const MIGRATION_KEY = "noteflow_migrated_to_turso_v2";
const SESSION_KEY = "noteflow_session";
const OLD_USER_ID_KEY = "noteflow_user_id";

// Current session state
let session = null;
try {
  const rawSession = localStorage.getItem(SESSION_KEY);
  console.log('[NoteFlow] Raw session from localStorage:', rawSession ? 'exists (' + rawSession.length + ' chars)' : 'null');
  if (rawSession) {
    session = JSON.parse(rawSession);
    console.log('[NoteFlow] Parsed session:', { userId: session?.userId, username: session?.username, expiresAt: session?.expiresAt });
  }
} catch (e) {
  console.error('[NoteFlow] Failed to parse session from localStorage:', e);
  session = null;
}
if (session && session.expiresAt && Date.now() > session.expiresAt) {
  console.log('[NoteFlow] Session expired, clearing');
  session = null;
  localStorage.removeItem(SESSION_KEY);
}

// Auto-logout if session expires while tab is open
setInterval(() => {
  let curSession = JSON.parse(localStorage.getItem(SESSION_KEY));
  if (curSession && curSession.expiresAt && Date.now() > curSession.expiresAt) {
    handleLogout();
  }
}, 60000);

// Global fetch interceptor to handle deactivated accounts dynamically
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const response = await originalFetch.apply(this, args);
  if (response.status === 403) {
    try {
      const cloned = response.clone();
      const data = await cloned.json();
      if (data.isDeactivated) {
        alert(data.error || "Your account has been deactivated... Contact an administrator.");
        handleLogout();
      }
    } catch (e) {
      // Not JSON, ignore
    }
  }
  return response;
};

let currentProfile = null;

let notes = [];
let activeNoteId = localStorage.getItem('lastActiveNoteId') || null;
let activeTag = "all";
let saveTimeout = null;

/* ---- DOM REFS ---- */
const notesList = document.getElementById("notesList");
const tagsFilter = document.getElementById("tagsFilter");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");
const editorPanel = document.getElementById("editorPanel");
const noteTitleInput = document.getElementById("noteTitleInput");
const tagInput = document.getElementById("tagInput");
const noteContent = document.getElementById("noteContent");
const noteCreatedDate = document.getElementById("noteCreatedDate");
const saveStatus = document.getElementById("saveStatus");
const wordCount = document.getElementById("wordCount");
const deleteNoteBtn = document.getElementById("deleteNoteBtn");
const modalOverlay = document.getElementById("modalOverlay");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");
const newNoteBtn = document.getElementById("newNoteBtn");
const newNoteBtnLg = document.getElementById("newNoteBtnLg");
const mobileToggle = document.getElementById("mobileToggle");
const sidebar = document.getElementById("sidebar");
const addChecklistBtn = document.getElementById("addChecklistBtn");

const checklistSettingsBtn = document.getElementById("checklistSettingsBtn");
const checklistSettingsModalOverlay = document.getElementById("checklistSettingsModalOverlay");
const checklistRefreshType = document.getElementById("checklistRefreshType");
const checklistRefreshDaysGroup = document.getElementById("checklistRefreshDaysGroup");
const checklistRefreshDays = document.getElementById("checklistRefreshDays");
const checklistRefreshTimeGroup = document.getElementById("checklistRefreshTimeGroup");
const checklistRefreshTime = document.getElementById("checklistRefreshTime");
const cancelChecklistSettings = document.getElementById("cancelChecklistSettings");
const saveChecklistSettings = document.getElementById("saveChecklistSettings");
const toastContainer = document.getElementById("toastContainer");
const duplicateNoteBtn = document.getElementById("duplicateNoteBtn");
const sketchModeBtn = document.getElementById("sketchModeBtn");

const sketchOverlay = document.getElementById("sketchOverlay");
const sketchCanvasWrapper = document.getElementById("sketchCanvasWrapper");
const sketchCanvas = document.getElementById("sketchCanvas");
const sketchTextInput = document.getElementById("sketchTextInput");

const sketchToolBtns = document.querySelectorAll(".sketch-tool-btn[data-tool]");
const sketchShapeBtns = document.querySelectorAll(".sketch-shape-btn[data-shape]");

const sketchBrushBtn = document.getElementById("sketchBrushBtn");
const sketchBrushDropdown = document.getElementById("sketchBrushDropdown");
const sketchBrushItems = document.querySelectorAll(".sketch-dropdown-item[data-brush]");

const sketchSizeSlider = document.getElementById("sketchSizeSlider");
const sketchSizeSelect = document.getElementById("sketchSizeSelect");

const color1Wrap = document.getElementById("color1Wrap");
const color2Wrap = document.getElementById("color2Wrap");
const color1Box = document.getElementById("color1Box");
const color2Box = document.getElementById("color2Box");
const colorSwatches = document.querySelectorAll(".color-swatch");
const sketchCustomColor = document.getElementById("sketchCustomColor");

const sketchClearBtn = document.getElementById("sketchClearBtn");
const sketchCancelBtn = document.getElementById("sketchCancelBtn");
const sketchDoneBtn = document.getElementById("sketchDoneBtn");

const sketchContextMenu = document.getElementById("sketchContextMenu");
const sketchContextEdit = document.getElementById("sketchContextEdit");
const sketchContextDelete = document.getElementById("sketchContextDelete");
const readingModeBtn = document.getElementById("readingModeBtn");
const exitReadingBtn = document.getElementById("exitReadingBtn");
const readingBar = document.getElementById("readingBar");
const autoScrollBtn = document.getElementById("autoScrollBtn");
const autoScrollIcon = document.getElementById("autoScrollIcon");
const speakBtn = document.getElementById("speakBtn");
const speakIcon = document.getElementById("speakIcon");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const fontFamilySelect = document.getElementById("fontFamilySelect");
const fontSizeSelect = document.getElementById("fontSizeSelect");
const headingSelect = document.getElementById("headingSelect");
const textColorPicker = document.getElementById("textColorPicker");
const textColorIndicator = document.getElementById("textColorIndicator");
const highlightColorPicker = document.getElementById("highlightColorPicker");
const highlightColorIndicator = document.getElementById("highlightColorIndicator");

const insertTableBtn = document.getElementById("insertTableBtn");
const tableModalOverlay = document.getElementById("tableModalOverlay");
const tableGridPicker = document.getElementById("tableGridPicker");
const tableSizeLabel = document.getElementById("tableSizeLabel");
const cancelTable = document.getElementById("cancelTable");
const confirmTable = document.getElementById("confirmTable");

const insertLinkBtn = document.getElementById("insertLinkBtn");
const linkModalOverlay = document.getElementById("linkModalOverlay");
const linkUrlInput = document.getElementById("linkUrlInput");
const linkTextInput = document.getElementById("linkTextInput");
const cancelLink = document.getElementById("cancelLink");
const confirmLink = document.getElementById("confirmLink");

const insertImageBtn = document.getElementById("insertImageBtn");
const imageModalOverlay = document.getElementById("imageModalOverlay");
const imageUrlInput = document.getElementById("imageUrlInput");
const imageAltInput = document.getElementById("imageAltInput");
const imageFileInput = document.getElementById("imageFileInput");
const imageUploadStatus = document.getElementById("imageUploadStatus");
const cancelImage = document.getElementById("cancelImage");
const confirmImage = document.getElementById("confirmImage");

const blockquoteBtn = document.getElementById("blockquoteBtn");
const codeBlockBtn = document.getElementById("codeBlockBtn");
const printBtn = document.getElementById("printBtn");

const toolbarMenuBtn = document.getElementById("toolbarMenuBtn");
const toolbarExtras = document.getElementById("toolbarExtras");

/* ---- AUTH & PROFILE DOM REFS ---- */
const authOverlay = document.getElementById("authOverlay");
const authTabLogin = document.getElementById("authTabLogin");
const authTabRegister = document.getElementById("authTabRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginError = document.getElementById("loginError");
const registerError = document.getElementById("registerError");

const claimOverlay = document.getElementById("claimOverlay");
const claimForm = document.getElementById("claimForm");
const claimError = document.getElementById("claimError");
const switchToLoginBtn = document.getElementById("switchToLoginBtn");

const profileBtn = document.getElementById("profileBtn");
const sidebarAvatar = document.getElementById("sidebarAvatar");
const sidebarDisplayName = document.getElementById("sidebarDisplayName");

const settingsPanel = document.getElementById("settingsPanel");
const settingsCloseBtn = document.getElementById("settingsCloseBtn");
const profileAvatar = document.getElementById("profileAvatar");
const profileUsername = document.getElementById("profileUsername");
const profileThemeBtns = document.querySelectorAll(".profile-theme-btn");
const profileCreatedAt = document.getElementById("profileCreatedAt");
const profileLogoutBtn = document.getElementById("profileLogoutBtn");

const displayNameSettingBtn = document.getElementById("displayNameSettingBtn");
const profileDisplayNameDisplay = document.getElementById("profileDisplayNameDisplay");
const passwordSettingBtn = document.getElementById("passwordSettingBtn");

const displayNameModalOverlay = document.getElementById("displayNameModalOverlay");
const displayNameCloseBtn = document.getElementById("displayNameCloseBtn");
const editDisplayNameInput = document.getElementById("editDisplayNameInput");
const saveDisplayNameBtn = document.getElementById("saveDisplayNameBtn");

const passwordModalOverlay = document.getElementById("passwordModalOverlay");
const passwordCloseBtn = document.getElementById("passwordCloseBtn");
const currentPasswordInput = document.getElementById("currentPasswordInput");
const newPasswordInput = document.getElementById("newPasswordInput");
const confirmNewPasswordInput = document.getElementById("confirmNewPasswordInput");
const passwordError = document.getElementById("passwordError");
const savePasswordBtn = document.getElementById("savePasswordBtn");
const newPwRules = document.getElementById("newPwRules");

const themeSettingBtn = document.getElementById("themeSettingBtn");
const currentThemeLabel = document.getElementById("currentThemeLabel");
const themePopupOverlay = document.getElementById("themePopupOverlay");
const themePopupCloseBtn = document.getElementById("themePopupCloseBtn");
const languageSettingBtn = document.getElementById("languageSettingBtn");
const currentLanguageLabel = document.getElementById("currentLanguageLabel");
const languageModalOverlay = document.getElementById("languageModalOverlay");
const languageList = document.getElementById("languageList");
const languageCloseBtn = document.getElementById("languageCloseBtn");

const diaryTypeModalOverlay = document.getElementById("diaryTypeModalOverlay");
const diaryTypeNew = document.getElementById("diaryTypeNew");
const diaryTypeExisting = document.getElementById("diaryTypeExisting");
const newDiaryGroup = document.getElementById("newDiaryGroup");
const existingDiaryGroup = document.getElementById("existingDiaryGroup");
const newDiaryNameInput = document.getElementById("newDiaryNameInput");
const existingDiarySelect = document.getElementById("existingDiarySelect");
const diaryCancelBtn = document.getElementById("diaryCancelBtn");
const diaryProceedBtn = document.getElementById("diaryProceedBtn");

const colorPickerSection = document.getElementById("colorPickerSection");
const colorPickerCanvas = document.getElementById("colorPickerCanvas");
const colorHueSlider = document.getElementById("colorHueSlider");
const colorHexInput = document.getElementById("colorHexInput");
const colorPreviewSwatch = document.getElementById("colorPreviewSwatch");
const colorHistory = document.getElementById("colorHistory");


