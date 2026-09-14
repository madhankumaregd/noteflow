/* =============================================
   AUTH & INITIALIZATION LOGIC
   ============================================= */

// Common headers for API requests
function getAuthHeaders() {
  if (!session) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    'x-user-id': session.userId
  };
}

async function initApp() {
  const oldUserId = localStorage.getItem(OLD_USER_ID_KEY);
  console.log('[NoteFlow] initApp called. session:', !!session, 'oldUserId:', oldUserId);

  if (session) {
    console.log('[NoteFlow] Session found, hiding auth overlays');
    // Has active session
    authOverlay.style.display = "none";
    claimOverlay.style.display = "none";
    
    // Immediately apply cached session profile so UI is never blank
    if (!currentProfile && session.username) {
      currentProfile = {
        userId: session.userId,
        username: session.username,
        displayName: session.displayName || session.username,
        theme: session.theme || 'dark',
        customAccent: session.customAccent || null,
        createdAt: null
      };
      updateProfileUI();
      applyTheme(currentProfile.theme, currentProfile.customAccent);
    }
    
    // Then fetch fresh profile from server (updates silently)
    await loadProfile();
    await loadNotes();
    applyTheme(currentProfile?.theme, currentProfile?.customAccent);
  } else if (oldUserId) {
    console.log('[NoteFlow] No session but oldUserId found, showing claim overlay');
    // Old anonymous user exists -> Show Claim Modal
    claimOverlay.style.display = "flex";
  } else {
    console.log('[NoteFlow] No session, no oldUserId, showing login');
    // New user -> Show Login/Register
    authOverlay.style.display = "flex";
  }
}

// Validation helpers
function validatePassword(pw) {
  const rules = {
    len: pw.length >= 6,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    num: /[0-9]/.test(pw)
  };
  return rules;
}

function updatePwRulesUI(rulesObj, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const ids = {
    len: container.querySelector('[id$="RuleLen"]'),
    upper: container.querySelector('[id$="RuleUpper"]'),
    lower: container.querySelector('[id$="RuleLower"]'),
    num: container.querySelector('[id$="RuleNum"]')
  };
  
  if (ids.len) { ids.len.className = rulesObj.len ? "pw-rule valid" : "pw-rule"; ids.len.innerHTML = rulesObj.len ? "✓ Min 6 characters" : "✕ Min 6 characters"; }
  if (ids.upper) { ids.upper.className = rulesObj.upper ? "pw-rule valid" : "pw-rule"; ids.upper.innerHTML = rulesObj.upper ? "✓ One uppercase" : "✕ One uppercase"; }
  if (ids.lower) { ids.lower.className = rulesObj.lower ? "pw-rule valid" : "pw-rule"; ids.lower.innerHTML = rulesObj.lower ? "✓ One lowercase" : "✕ One lowercase"; }
  if (ids.num) { ids.num.className = rulesObj.num ? "pw-rule valid" : "pw-rule"; ids.num.innerHTML = rulesObj.num ? "✓ One number" : "✕ One number"; }
}

// Setup Auth Listeners
authTabLogin.addEventListener("click", () => {
  authTabLogin.classList.add("active");
  authTabRegister.classList.remove("active");
  loginForm.style.display = "flex";
  registerForm.style.display = "none";
});

authTabRegister.addEventListener("click", () => {
  authTabRegister.classList.add("active");
  authTabLogin.classList.remove("active");
  registerForm.style.display = "flex";
  loginForm.style.display = "none";
});

document.querySelectorAll(".auth-toggle-pw").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const input = e.currentTarget.previousElementSibling;
    const icon = e.currentTarget.querySelector("span");
    if (input.type === "password") {
      input.type = "text";
      icon.textContent = "visibility_off";
    } else {
      input.type = "password";
      icon.textContent = "visibility";
    }
  });
});

document.getElementById("regPassword").addEventListener("input", (e) => {
  updatePwRulesUI(validatePassword(e.target.value), "regPwRules");
});

document.getElementById("claimPassword").addEventListener("input", (e) => {
  updatePwRulesUI(validatePassword(e.target.value), "claimPwRules");
});

switchToLoginBtn.addEventListener("click", () => {
  claimOverlay.style.display = "none";
  authOverlay.style.display = "flex";
  authTabLogin.click();
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const btn = document.getElementById("loginSubmit");
  btn.disabled = true;
  btn.textContent = "Logging in...";

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById("loginUsername").value,
        password: document.getElementById("loginPassword").value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    finishLogin(data);
  } catch (err) {
    loginError.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Login";
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  registerError.textContent = "";
  const pw = document.getElementById("regPassword").value;
  const confirm = document.getElementById("regConfirmPassword").value;
  
  if (pw !== confirm) {
    return registerError.textContent = "Passwords do not match.";
  }
  const rules = validatePassword(pw);
  if (!rules.len || !rules.upper || !rules.lower || !rules.num) {
    return registerError.textContent = "Password does not meet requirements.";
  }

  const btn = document.getElementById("registerSubmit");
  btn.disabled = true;
  btn.textContent = "Creating Account...";

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: document.getElementById("regDisplayName").value,
        username: document.getElementById("regUsername").value,
        password: pw
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");

    finishLogin(data);
  } catch (err) {
    registerError.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Create Account";
  }
});

claimForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  claimError.textContent = "";
  const pw = document.getElementById("claimPassword").value;
  const rules = validatePassword(pw);
  if (!rules.len || !rules.upper || !rules.lower || !rules.num) {
    return claimError.textContent = "Password does not meet requirements.";
  }

  const btn = claimForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Securing Notes...";

  try {
    const res = await fetch('/api/auth/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldUserId: localStorage.getItem(OLD_USER_ID_KEY),
        displayName: document.getElementById("claimDisplayName").value,
        username: document.getElementById("claimUsername").value,
        password: pw
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Claim failed");

    finishLogin(data);
  } catch (err) {
    claimError.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Secure My Notes";
  }
});

function finishLogin(data) {
  session = { 
    userId: data.userId, 
    username: data.username,
    displayName: data.displayName || data.username,
    theme: data.theme || 'dark',
    customAccent: data.customAccent || null,
    createdAt: data.createdAt || null,
    expiresAt: Date.now() + (3 * 24 * 60 * 60 * 1000) // 3 days
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  
  // Cleanup old unneeded keys
  localStorage.removeItem(OLD_USER_ID_KEY);
  
  authOverlay.style.display = "none";
  claimOverlay.style.display = "none";
  
  initApp(); // reload profile and notes
}

function handleLogout() {
  session = null;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(DB_KEY);
  notes = [];
  activeNoteId = null;
  currentProfile = null;
  
  // Hide everything, show login
  settingsPanel.style.display = "none";
  editorPanel.style.display = "none";
  emptyState.style.display = "none";
  authOverlay.style.display = "flex";
  claimOverlay.style.display = "none";
  
  // Reset UI
  notesList.innerHTML = "";
  sidebarDisplayName.textContent = "User";
  sidebarAvatar.textContent = "?";
}


/* =============================================
   PROFILE LOGIC
   ============================================= */

async function loadProfile() {
  try {
    const res = await fetch('/api/profile', { headers: getAuthHeaders() });
    if (res.ok) {
      currentProfile = await res.json();
      updateProfileUI();
      
      // Update session cache with latest server data
      if (session) {
        session.displayName = currentProfile.displayName;
        session.theme = currentProfile.theme;
        session.customAccent = currentProfile.customAccent;
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
    } else {
      console.warn('Profile API returned', res.status, '— using cached session data');
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        if (typeof handleLogout === 'function') handleLogout();
      }
    }
  } catch (err) {
    console.error("Failed to load profile", err);
    // Session-cached profile is already applied by initApp, so UI won't be blank
  }
}

function updateProfileUI() {
  if (!currentProfile) return;
  const name = currentProfile.displayName || currentProfile.username;
  sidebarDisplayName.textContent = name;
  sidebarAvatar.textContent = name.charAt(0).toUpperCase();
  
  if (profileDisplayNameDisplay) {
    profileDisplayNameDisplay.textContent = currentProfile.displayName || "";
  }
  
  profileUsername.textContent = "@" + currentProfile.username;
  profileAvatar.textContent = name.charAt(0).toUpperCase();
  
  if (currentProfile.createdAt) {
    const d = new Date(currentProfile.createdAt);
    if (!isNaN(d.getTime())) {
      profileCreatedAt.textContent = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
  } else {
    profileCreatedAt.textContent = "-";
  }
  
  selectThemeBtn(currentProfile.theme);
  updateThemeLabel(currentProfile.theme);
  
  if (currentProfile.theme === "custom" && currentProfile.customAccent) {
    updateCustomAccent(currentProfile.customAccent);
  }
}

function updateThemeLabel(theme) {
  if (!currentThemeLabel) return;
  if (theme === 'dark') currentThemeLabel.textContent = "Dark Theme";
  else if (theme === 'light') currentThemeLabel.textContent = "Light Theme";
  else if (theme === 'ocean') currentThemeLabel.textContent = "Ocean Theme";
  else currentThemeLabel.textContent = "Custom Theme";
}

function applyTheme(theme = "dark", customAccent = null) {
  document.body.className = `theme-${theme}`;
  if (theme === "custom" && customAccent) {
    document.body.style.setProperty("--custom-accent", customAccent);
    
    // Calculate a dimmer version for glow/hover
    // A simple hack without a full color library: just drop opacity
    document.body.style.setProperty("--custom-accent-glow", `${customAccent}22`); // Hex + alpha
    
    colorHexInput.value = customAccent;
    colorPreviewSwatch.style.background = customAccent;
  }
  updateThemeLabel(theme);
}

function selectThemeBtn(theme) {
  profileThemeBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
  colorPickerSection.style.display = theme === "custom" ? "block" : "none";
  if (theme === "custom") {
    setTimeout(() => {
      if (typeof window.initColorPicker === 'function') {
        window.initColorPicker();
      }
    }, 10);
  }
}

profileThemeBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const theme = btn.dataset.theme;
    selectThemeBtn(theme);
    const accent = (theme === "custom") ? colorHexInput.value : null;
    applyTheme(theme, accent);
  });
});

window.openSettingsPanel = function() {
  emptyState.style.display = "none";
  // Don't hide editorPanel, let it stay under the overlay
  settingsPanel.style.display = "flex";
  if (window.innerWidth <= 768) sidebar.classList.remove("open");
};

profileBtn.addEventListener("click", () => {
  window.Router.navigate("/settings");
});

settingsCloseBtn.addEventListener("click", () => {
  if (activeNoteId) {
    window.Router.navigate("/notes");
  } else {
    window.Router.navigate("/");
  }
});

themeSettingBtn.addEventListener("click", () => {
  themePopupOverlay.classList.add("open");
});

themePopupCloseBtn.addEventListener("click", async () => {
  themePopupOverlay.classList.remove("open");
  
  const selectedTheme = document.querySelector(".profile-theme-btn.active")?.dataset.theme || "dark";
  const customAccent = selectedTheme === "custom" ? colorHexInput.value : null;

  try {
    await fetch('/api/profile', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ theme: selectedTheme, customAccent })
    });
  } catch (err) {
    console.error("Failed to save theme", err);
  }
});

[themePopupOverlay].forEach(modal => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("open");
  });
});

profileLogoutBtn.addEventListener("click", handleLogout);


