# ✦ Noteflow — Notes App

A beautiful, dark-themed, advanced notes web app with multi-user authentication, rich text editing, drawing sketchpad, device perspective previews, Admin Panel, and external API integrations. Built with HTML, CSS, JavaScript, and Node.js with a Turso libSQL database.

---

## 📁 Project Structure

```
notes-app/
├── server.js          ← Node.js Express server & API endpoints
├── .env               ← Environment variables (DB credentials, JWT secrets)
├── public/
│   ├── index.html     ← Main App UI (Notes, Sketch, Settings)
│   ├── admin.html     ← Admin Panel UI
│   ├── style.css      ← Main styling & theming
│   ├── admin.css      ← Admin Panel styling
│   └── js/
│       ├── core.js    ← Editor, toolbars, and rich text logic
│       ├── auth.js    ← Multi-user login, registration, and tokens
│       ├── sketch.js  ← Canvas drawing and sketch saving
│       ├── tables.js  ← Advanced table insertion, resizing & repositioning
│       ├── export.js  ← PDF, image, and text exporting
│       ├── reading.js ← Presentation/Device perspective auto-scrolling
│       ├── admin.js   ← Admin panel logic (Users, Trash, API Keys)
│       └── utils.js   ← Global utilities and helpers
```

---

## 💻 Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure Environment
# Copy .env.example to .env and add your Turso DB URL, Auth Token, and JWT secrets
cp .env.example .env

# 3. Start the server
npm run dev

# 4. Open in browser
# Main App: http://localhost:3000
# Admin Panel: http://localhost:3000/note-manager
```

---

## ✨ Features & Recent Updates

### 📝 Core Editing & Note Taking
- **Rich Text Editor:** Fully customizable text editor with bold, italic, highlights, lists, quotes, and custom typography.
- **Advanced Tables:** Insert tables at the cursor, precisely resize columns, and drag-and-drop to reposition tables anywhere within the note.
- **Sketchpad:** Integrated drawing canvas with brushes (calligraphy, airbrush, oil, etc.), shapes, and pressure sensitivity. Sketches are saved inline in notes.
- **Checklists:** Interactive checklists that track completion status.
- **Tags & Search:** Assign custom tags to notes and search across all content, tags, and titles globally.
- **Exporting & Sharing:** Export notes smoothly to PDF or Images while preserving table layouts and sketches perfectly.

### 👓 Device Perspectives & Auto-Scroll
- **Responsive Previews:** View notes constrained to specific device aspect ratios (Mobile, Tablet, Desktop) for presentation and reading.
- **Auto-Scroll:** Read hands-free with configurable, automatic scrolling speeds tailored to different reading speeds (15s, 30s, 1m, 1.5m, 2m per screen).

### 👥 Multi-User & Security
- **Authentication:** Secure JWT-based authentication system. Every user has their own private workspace.
- **Database Backend:** Persistent Turso Cloud SQLite (libSQL) backend, replacing the old `localStorage` design for true cloud sync.

### 🔧 Admin Panel (`/note-manager`)
- **Dashboard Analytics:** Overview of system health, active users, total notes, and database size.
- **User Management:** View all registered users, manage their status, and search easily via custom searchable dropdowns.
- **Trash & Recovery:** View deleted notes and users in the Trash tab, and restore them securely. 
- **External API Keys:** Generate, manage, and deactivate external API keys allowing third-party services (like AI Assistants) to securely interact with specific user accounts. Features a custom searchable dropdown for user assignment.

---

## 🎨 Design Aesthetics

- **Typography:** Playfair Display for elegant headings, DM Sans for clean UI, JetBrains Mono for code.
- **Dynamic Theming:** Deep dark modes, glassmorphism UI elements, customizable accent colors, and custom scrollbars.
- **Micro-Animations:** Smooth hover states, focus rings, modal scale-ins, and animated toggle buttons to create a responsive, premium feel.

---

## 🎛 Tech Stack

| Layer      | Tech                          |
|------------|-------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JS       |
| Backend    | Node.js, Express.js           |
| Database   | Turso Cloud SQLite (libSQL)   |
| Auth       | JWT (JSON Web Tokens), bcrypt |
| Design     | Custom CSS, Material Symbols  |

---

## ⌨️ Keyboard Shortcuts

| Shortcut          | Action            |
|-------------------|--------------------|
| `Ctrl/Cmd + N`    | Create a new note  |
| `Ctrl/Cmd + S`    | Save current note  |
| `Escape`          | Close modals       |
