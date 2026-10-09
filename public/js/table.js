/* =============================================
   TABLE INSERTION
   ============================================= */
let selectedRows = 0;
let selectedCols = 0;
let visualMaxRows = 8;
let visualMaxCols = 8;

function buildTableGrid(maxR = 8, maxC = 8) {
  visualMaxRows = Math.max(8, Math.min(20, maxR));
  visualMaxCols = Math.max(8, Math.min(20, maxC));
  tableGridPicker.innerHTML = "";
  
  tableGridPicker.style.gridTemplateColumns = `repeat(${visualMaxCols}, 1fr)`;
  
  for (let r = 1; r <= visualMaxRows; r++) {
    for (let c = 1; c <= visualMaxCols; c++) {
      const cell = document.createElement("div");
      cell.className = "table-grid-cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      tableGridPicker.appendChild(cell);
    }
  }
}
buildTableGrid();

tableGridPicker.addEventListener("mouseover", (e) => {
  const cell = e.target.closest(".table-grid-cell");
  if (!cell) return;
  const hoverRow = parseInt(cell.dataset.row);
  const hoverCol = parseInt(cell.dataset.col);
  highlightGridCells(hoverRow, hoverCol);
  
  // Do not override user-typed custom values unless they are clicking/hovering grid to set
  tableSizeLabel.textContent = `${hoverRow} × ${hoverCol}`;
});

tableGridPicker.addEventListener("click", (e) => {
  const cell = e.target.closest(".table-grid-cell");
  if (!cell) return;
  selectedRows = parseInt(cell.dataset.row);
  selectedCols = parseInt(cell.dataset.col);
  highlightGridCells(selectedRows, selectedCols, true);
  tableSizeLabel.textContent = `${selectedRows} × ${selectedCols} selected`;
  
  if (typeof customTableCols !== 'undefined') customTableCols.value = selectedCols;
  if (typeof customTableRows !== 'undefined') customTableRows.value = selectedRows;
  
  confirmTable.disabled = false;
});

function highlightGridCells(rows, cols, locked = false) {
  tableGridPicker.querySelectorAll(".table-grid-cell").forEach((cell) => {
    const r = parseInt(cell.dataset.row);
    const c = parseInt(cell.dataset.col);
    cell.classList.remove("selected", "selected-highlight");
    if (r <= rows && c <= cols) {
      cell.classList.add(locked ? "selected-highlight" : "selected");
    }
  });
}

tableGridPicker.addEventListener("mouseleave", () => {
  if (selectedRows > 0) {
    highlightGridCells(selectedRows, selectedCols, true);
    tableSizeLabel.textContent = `${selectedRows} × ${selectedCols} selected`;
  } else {
    tableGridPicker.querySelectorAll(".table-grid-cell").forEach((c) =>
      c.classList.remove("selected", "selected-highlight")
    );
    tableSizeLabel.textContent = "Select size";
  }
});

insertTableBtn.addEventListener("mousedown", (e) => e.preventDefault());
insertTableBtn.addEventListener("click", () => {
  // Save cursor position before opening modal
  if (typeof saveSelection === "function") {
    savedSelection = saveSelection();
  }
  selectedRows = 0;
  selectedCols = 0;
  confirmTable.disabled = true;
  tableSizeLabel.textContent = "Select size";
  tableGridPicker.querySelectorAll(".table-grid-cell").forEach((c) =>
    c.classList.remove("selected", "selected-highlight")
  );
  if (typeof customTableCols !== 'undefined') {
    customTableCols.value = "";
    customTableCols.addEventListener("input", handleCustomDimensionInput);
  }
  if (typeof customTableRows !== 'undefined') {
    customTableRows.value = "";
    customTableRows.addEventListener("input", handleCustomDimensionInput);
  }
  
  tableModalOverlay.classList.add("open");
});

function handleCustomDimensionInput() {
  let c = parseInt(customTableCols.value) || 0;
  let r = parseInt(customTableRows.value) || 0;
  
  if (c > 100) { c = 100; customTableCols.value = 100; }
  
  selectedCols = c;
  selectedRows = r;
  
  if (c > visualMaxCols || r > visualMaxRows) {
    buildTableGrid(r, c);
  } else if (c <= 8 && r <= 8 && (visualMaxCols > 8 || visualMaxRows > 8)) {
    buildTableGrid(8, 8);
  }
  
  if (selectedRows > 0 && selectedCols > 0) {
    highlightGridCells(selectedRows, selectedCols, true);
    tableSizeLabel.textContent = `${selectedRows} × ${selectedCols} selected`;
    confirmTable.disabled = false;
  } else {
    tableGridPicker.querySelectorAll(".table-grid-cell").forEach((c) =>
      c.classList.remove("selected", "selected-highlight")
    );
    tableSizeLabel.textContent = "Select size";
    confirmTable.disabled = true;
  }
}

cancelTable.addEventListener("click", () => tableModalOverlay.classList.remove("open"));
tableModalOverlay.addEventListener("click", (e) => {
  if (e.target === tableModalOverlay) tableModalOverlay.classList.remove("open");
});

confirmTable.addEventListener("click", () => {
  if (selectedRows < 1 || selectedCols < 1) return;
  
  // Restore cursor position before inserting
  if (typeof restoreSelection === "function" && savedSelection) {
    restoreSelection(savedSelection);
  }
  
  let html = '<table><tr>';
  for (let c = 0; c < selectedCols; c++) html += `<th>Header ${c + 1}</th>`;
  html += '</tr>';
  for (let r = 1; r < selectedRows; r++) {
    html += '<tr>';
    for (let c = 0; c < selectedCols; c++) html += '<td>&nbsp;</td>';
    html += '</tr>';
  }
  html += '</table><p><br></p>';
  execCmd("insertHTML", html);
  tableModalOverlay.classList.remove("open");
});


/* =============================================
   TABLE INTERACTION — Word-like Resize & Select
   ============================================= */

let draggedTable = null;
let isDraggingTable = false;
let dragGhost = null;

function setupTableInteraction() {
  if (!noteContent) return;
  
  const tables = noteContent.querySelectorAll("table");
  tables.forEach(table => {
    table.style.position = "relative";
    table.classList.remove("resizing"); // Ensure no stuck resizing state
    
    // Fix legacy bug where table got stuck with contenteditable="false"
    table.removeAttribute("contenteditable");
    
    if (!table.__interactionReady) {
      table.__interactionReady = true;
      
      // Clean up dead handles from HTML
      table.querySelectorAll(".table-move-handle").forEach(el => el.remove());
      table.querySelectorAll(".table-overall-resize-handle").forEach(el => el.remove());
      
      // Add move handle
      let moveHandle = document.createElement("div");
      moveHandle.className = "table-move-handle";
      moveHandle.innerHTML = '<span class="material-symbols-rounded" style="font-size:14px;">drag_indicator</span>';
      moveHandle.contentEditable = "false";
      table.insertBefore(moveHandle, table.firstChild);
      
      // --- Enhanced Table Drag UX (Dynamic Content Movement & Auto-scroll) ---
      function initTableDrag(startX, startY, isTouch) {
        isDraggingTable = true;
        draggedTable = table;
        table.classList.add("dragging");
        
        // Hide the actual table so we can see the placeholder push content around
        table.style.display = 'none';

        // Create a visual ghost following the cursor
        dragGhost = document.createElement("div");
        dragGhost.style.cssText = "position:fixed;pointer-events:none;z-index:9999;opacity:0.9;border:2px solid var(--accent);padding:8px 12px;background:var(--bg-card);border-radius:4px;font-size:13px;color:var(--text-primary);box-shadow: 0 8px 24px rgba(0,0,0,0.2);display:flex;align-items:center;gap:8px;";
        dragGhost.innerHTML = '<span class="material-symbols-rounded" style="font-size:16px;color:var(--accent);">table</span> Moving Table...';
        document.body.appendChild(dragGhost);
        
        dragGhost.style.left = startX + 15 + "px";
        dragGhost.style.top = startY + 15 + "px";

        // Create the dynamic insertion placeholder
        let dragPlaceholder = document.createElement("div");
        dragPlaceholder.style.cssText = `height:${table.offsetHeight}px; width:100%; border:2px dashed var(--accent); background:rgba(45, 212, 191, 0.05); margin: 12px 0; border-radius: 4px; pointer-events:none;`;
        noteContent.insertBefore(dragPlaceholder, table);
        
        let scrollInterval = null;

        function doScroll(dir) {
          if (!isDraggingTable) return;
          noteContent.scrollTop += dir * 20;
        }

        function handleMove(clientX, clientY) {
          if (!isDraggingTable) return;
          
          if (dragGhost) {
            dragGhost.style.left = clientX + 15 + "px";
            dragGhost.style.top = clientY + 15 + "px";
          }
          
          // Auto-scroll logic
          const rect = noteContent.getBoundingClientRect();
          const edgeThreshold = 60;
          
          clearInterval(scrollInterval);
          if (clientY - rect.top < edgeThreshold) {
            scrollInterval = setInterval(() => doScroll(-1), 30);
          } else if (rect.bottom - clientY < edgeThreshold) {
            scrollInterval = setInterval(() => doScroll(1), 30);
          }
          
          // Dynamic content movement (move placeholder)
          let range;
          if (document.caretRangeFromPoint) {
            range = document.caretRangeFromPoint(clientX, clientY);
          } else if (document.caretPositionFromPoint) {
            const pos = document.caretPositionFromPoint(clientX, clientY);
            if (pos) {
              range = document.createRange();
              range.setStart(pos.offsetNode, pos.offset);
            }
          }
          
          if (range) {
            let targetNode = range.startContainer;
            while (targetNode && targetNode.parentNode !== noteContent) {
              targetNode = targetNode.parentNode;
            }
            if (targetNode && targetNode !== dragPlaceholder && targetNode !== table) {
               noteContent.insertBefore(dragPlaceholder, targetNode);
            }
          }
        }
        
        function handleEnd() {
          if (!isTouch) {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
          } else {
            document.removeEventListener("touchmove", onTouchMove);
            document.removeEventListener("touchend", onTouchEnd);
          }
          
          clearInterval(scrollInterval);
          
          if (dragGhost) {
            dragGhost.remove();
            dragGhost = null;
          }
          
          table.classList.remove("dragging");
          table.style.display = '';
          isDraggingTable = false;
          
          if (dragPlaceholder && dragPlaceholder.parentNode) {
            noteContent.insertBefore(table, dragPlaceholder);
            dragPlaceholder.remove();
            
            if (!table.nextSibling || (table.nextSibling.nodeType === 1 && table.nextSibling.tagName === "TABLE")) {
              const p = document.createElement("div");
              p.innerHTML = "<br/>";
              noteContent.insertBefore(p, table.nextSibling);
            }
            if (!table.previousSibling || (table.previousSibling.nodeType === 1 && table.previousSibling.tagName === "TABLE")) {
              const p = document.createElement("div");
              p.innerHTML = "<br/>";
              noteContent.insertBefore(p, table);
            }
            autoSave();
          }
          draggedTable = null;
        }
        
        function onMouseMove(ev) { handleMove(ev.clientX, ev.clientY); }
        function onMouseUp(ev) { handleEnd(); }
        function onTouchMove(ev) { 
          ev.preventDefault();
          handleMove(ev.changedTouches[0].clientX, ev.changedTouches[0].clientY); 
        }
        function onTouchEnd(ev) { handleEnd(); }

        if (!isTouch) {
          document.addEventListener("mousemove", onMouseMove);
          document.addEventListener("mouseup", onMouseUp);
        } else {
          document.addEventListener("touchmove", onTouchMove, { passive: false });
          document.addEventListener("touchend", onTouchEnd);
        }
      }

      moveHandle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        initTableDrag(e.clientX, e.clientY, false);
      });
      
      moveHandle.addEventListener("touchstart", (e) => {
        e.preventDefault();
        e.stopPropagation();
        initTableDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY, true);
      }, { passive: false });
      
      // Add overall resize handle (mirrored icon pointing bottom-right)
      let overallResizeHandle = document.createElement("div");
      overallResizeHandle.className = "table-overall-resize-handle";
      overallResizeHandle.innerHTML = '<span class="material-symbols-rounded" style="font-size:14px;transform:rotate(90deg);">open_in_full</span>';
      overallResizeHandle.contentEditable = "false";
      table.appendChild(overallResizeHandle);
      
      overallResizeHandle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = table.offsetWidth;
        const startH = table.offsetHeight;
        
        table.style.maxWidth = "none";
        
        function onMouseMoveT(ev) {
          const dw = ev.clientX - startX;
          const dh = ev.clientY - startY;
          table.style.width = Math.max(100, startW + dw) + "px";
          table.style.height = Math.max(50, startH + dh) + "px";
        }
        function onMouseUpT() {
          document.removeEventListener("mousemove", onMouseMoveT);
          document.removeEventListener("mouseup", onMouseUpT);
          autoSave();
        }
        document.addEventListener("mousemove", onMouseMoveT);
        document.addEventListener("mouseup", onMouseUpT);
      });
    }
    
    // Add resize handles to cells
    addResizeHandles(table);
  });
}

function addResizeHandles(table) {
  // Set position:relative on all cells for handles
  const cells = table.querySelectorAll("th, td");
  cells.forEach(cell => {
    cell.style.position = "relative";
    
    // Skip if already has a live handle
    if (cell.__interactionReady) return;
    cell.__interactionReady = true;
    
    // Clean up dead handles from HTML
    cell.querySelectorAll(".table-col-resize-handle").forEach(el => el.remove());
    
    const handle = document.createElement("div");
    handle.className = "table-col-resize-handle";
    handle.contentEditable = "false";
    cell.appendChild(handle);
    
    // Column resize
    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const startX = e.clientX;
      const startWidth = cell.offsetWidth;
      table.classList.add("resizing");
      handle.classList.add("active");
      
      // Freeze all column widths BEFORE changing anything
      const allCells = table.querySelectorAll("th, td");
      allCells.forEach(c => {
        if (!c.classList.contains("table-move-handle") && !c.classList.contains("table-overall-resize-handle")) {
          c.style.width = c.offsetWidth + "px";
          c.style.minWidth = c.offsetWidth + "px";
        }
      });
      table.style.tableLayout = "fixed";
      table.style.width = table.offsetWidth + "px";
      
      // Get correct column index (skip the move-handle div)
      const parentRow = cell.parentElement;
      let colIndex = 0;
      for (let i = 0; i < parentRow.children.length; i++) {
        const child = parentRow.children[i];
        if (child === cell) break;
        if (child.tagName === "TH" || child.tagName === "TD") {
          colIndex++;
        }
      }
      
      const tableStartWidth = table.offsetWidth;
      
      function onMouseMove(ev) {
        const rawDelta = ev.clientX - startX;
        const newWidth = Math.max(40, startWidth + rawDelta);
        const actualDelta = newWidth - startWidth; // Clamp delta so table and column stay in sync
        
        // Update table overall width
        table.style.width = Math.max(100, tableStartWidth + actualDelta) + "px";
        table.style.maxWidth = "none";
        
        // Apply ONLY to cells in this column
        const allRows = table.querySelectorAll("tr");
        allRows.forEach(row => {
          let ci = 0;
          for (let i = 0; i < row.children.length; i++) {
            const child = row.children[i];
            if (child.tagName === "TH" || child.tagName === "TD") {
              if (ci === colIndex) {
                child.style.width = newWidth + "px";
                child.style.minWidth = newWidth + "px";
                break;
              }
              ci++;
            }
          }
        });
      }
      
      function onMouseUp() {
        table.classList.remove("resizing");
        handle.classList.remove("active");
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        autoSave();
      }
      
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  });
}

// Deselect tables when clicking outside
noteContent.addEventListener("click", (e) => {
  if (!e.target.closest("table") && !e.target.closest(".table-move-handle")) {
    noteContent.querySelectorAll("table.selected").forEach(t => t.classList.remove("selected"));
  }
});

// Delete selected table with Delete/Backspace
document.addEventListener("keydown", (e) => {
  if (e.key === "Delete" || e.key === "Backspace") {
    const selectedTable = noteContent.querySelector("table.selected");
    if (selectedTable && document.activeElement !== noteTitleInput && document.activeElement !== tagInput) {
      // Only delete if the user isn't editing within the table
      const sel = window.getSelection();
      const anchorInTable = sel.anchorNode && selectedTable.contains(sel.anchorNode);
      if (!anchorInTable) {
        e.preventDefault();
        selectedTable.remove();
        autoSave();
      }
    }
  }
});

// MutationObserver to auto-setup interaction on new tables
const tableObserver = new MutationObserver(() => {
  setupTableInteraction();
});

tableObserver.observe(noteContent, { childList: true, subtree: true });

// Initial setup
setupTableInteraction();
