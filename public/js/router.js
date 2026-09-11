const Router = {
  routes: [],
  
  init() {
    window.addEventListener("popstate", () => this.handleRoute());
    // Also expose globally so legacy code can call window.Router.navigate
    window.Router = this;

    this.setupRoutes();
    this.handleRoute();
  },

  addRoute(path, handler) {
    this.routes.push({ path, handler });
  },

  navigate(path) {
    if (window.location.pathname === path) return;
    window.history.pushState({}, "", path);
    this.handleRoute();
  },

  setupRoutes() {
    this.addRoute("/", () => {
      // Close all modals
      if (typeof sketchOverlay !== 'undefined' && sketchOverlay) sketchOverlay.style.display = "none";
      if (typeof exitReadingMode !== 'undefined') exitReadingMode();
      if (typeof checklistSettingsModalOverlay !== 'undefined' && checklistSettingsModalOverlay) checklistSettingsModalOverlay.classList.remove("open");
      if (typeof settingsPanel !== 'undefined' && settingsPanel) settingsPanel.style.display = "none";
      if (typeof renderEditor !== 'undefined') renderEditor();
    });

    this.addRoute("/notes", () => {
      // Just ensure modals are closed, the note is opened via the click handler
      if (typeof sketchOverlay !== 'undefined' && sketchOverlay) sketchOverlay.style.display = "none";
      if (typeof exitReadingMode !== 'undefined') exitReadingMode();
      if (typeof checklistSettingsModalOverlay !== 'undefined' && checklistSettingsModalOverlay) checklistSettingsModalOverlay.classList.remove("open");
      if (typeof settingsPanel !== 'undefined' && settingsPanel) settingsPanel.style.display = "none";
      if (typeof renderEditor !== 'undefined') renderEditor();
    });

    this.addRoute("/notes/sketch", () => {
      if (typeof sketchOverlay !== 'undefined' && sketchOverlay) {
        sketchOverlay.style.display = "flex";
        if (typeof initSketchCanvas !== 'undefined') setTimeout(() => initSketchCanvas(), 50);
      }
    });

    this.addRoute("/notes/read", () => {
      if (typeof enterReadingMode !== 'undefined') enterReadingMode();
    });

    this.addRoute("/notes/settings", () => {
      if (typeof openChecklistSettings !== 'undefined' && typeof activeNoteId !== 'undefined') {
        openChecklistSettings(activeNoteId);
      }
    });

    this.addRoute("/settings", () => {
      if (typeof openSettingsPanel !== 'undefined') openSettingsPanel();
    });
  },

  handleRoute() {
    const path = window.location.pathname;
    let matchFound = false;

    for (const route of this.routes) {
      const regex = new RegExp("^" + route.path.replace(/:\w+/g, "([^/]+)") + "$");
      const match = path.match(regex);
      if (match) {
        matchFound = true;
        route.handler(...match.slice(1));
        break;
      }
    }

    if (!matchFound) {
      console.warn("No route matched for:", path);
      if (path !== "/") this.navigate("/");
    }
  }
};

Router.init();
