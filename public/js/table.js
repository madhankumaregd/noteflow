/* =============================================
   TABLE INSERTION
   ============================================= */
let selectedRows = 0;
let selectedCols = 0;

function buildTableGrid() {
  tableGridPicker.innerHTML = "";
  for (let r = 1; r <= 8; r++) {
    for (let c = 1; c <= 8; c++) {
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
  tableSizeLabel.textContent = `${hoverRow} × ${hoverCol}`;
});

tableGridPicker.addEventListener("click", (e) => {
  const cell = e.target.closest(".table-grid-cell");
  if (!cell) return;
  selectedRows = parseInt(cell.dataset.row);
  selectedCols = parseInt(cell.dataset.col);
  highlightGridCells(selectedRows, selectedCols, true);
  tableSizeLabel.textContent = `${selectedRows} × ${selectedCols} selected`;
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
  selectedRows = 0;
  selectedCols = 0;
  confirmTable.disabled = true;
  tableSizeLabel.textContent = "Select size";
  tableGridPicker.querySelectorAll(".table-grid-cell").forEach((c) =>
    c.classList.remove("selected", "selected-highlight")
  );
  tableModalOverlay.classList.add("open");
});

cancelTable.addEventListener("click", () => tableModalOverlay.classList.remove("open"));
tableModalOverlay.addEventListener("click", (e) => {
  if (e.target === tableModalOverlay) tableModalOverlay.classList.remove("open");
});

confirmTable.addEventListener("click", () => {
  if (selectedRows < 1 || selectedCols < 1) return;
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

function setupTableInteraction() {
  if (!noteContent) return;
  
  const tables = noteContent.querySelectorAll("table");
  tables.forEach(table => {
    table.style.position = "relative";
    table.classList.remove("resizing"); // Ensure no stuck resizing state
    
    if (!table.__interactionReady) {
      table.__interactionReady = true;
      
      // Clean up dead handles from HTML
      table.querySelectorAll(".table-move-handle").forEach(el => el.remove());
      
      // Add move handle
      let moveHandle = document.createElement("div");
      moveHandle.className = "table-move-handle";
      moveHandle.innerHTML = "⠿";
      moveHandle.contentEditable = "false";
      moveHandle.draggable = true;
      table.insertBefore(moveHandle, table.firstChild);
      
      // Drag to move table
      moveHandle.addEventListener("dragstart", (e) => {
        draggedTable = table;
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/html", table.outerHTML);
        // Important: Use dragging class to disable pointer events on the table itself
        setTimeout(() => { table.classList.add("dragging"); }, 0);
      });
      
      moveHandle.addEventListener("dragend", (e) => {
        table.classList.remove("dragging");
        draggedTable = null;
        autoSave();
      });
      
      // Click handle to select table
      moveHandle.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Deselect others
        noteContent.querySelectorAll("table.selected").forEach(t => t.classList.remove("selected"));
        table.classList.toggle("selected");
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
      table.contentEditable = "false"; // Prevent weird text selection while dragging
      
      // Freeze table layout to fixed to make resizing accurate
      if (window.getComputedStyle(table).tableLayout !== "fixed") {
        const firstRowCells = table.querySelectorAll("tr:first-child > *");
        firstRowCells.forEach(c => {
            c.style.width = c.offsetWidth + "px";
        });
        table.style.tableLayout = "fixed";
        table.style.width = table.offsetWidth + "px";
      }
      
      // Get the column index
      const colIndex = Array.from(cell.parentElement.children).indexOf(cell);
      
      function onMouseMove(ev) {
        const delta = ev.clientX - startX;
        const newWidth = Math.max(40, startWidth + delta);
        
        // Apply to all cells in this column
        const allRows = table.querySelectorAll("tr");
        allRows.forEach(row => {
          const targetCell = row.children[colIndex];
          if (targetCell && !targetCell.classList.contains("table-move-handle")) {
            targetCell.style.width = newWidth + "px";
            targetCell.style.minWidth = newWidth + "px";
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

// Handle dropping the table within the editor
noteContent.addEventListener("dragover", (e) => {
  if (draggedTable) {
    e.preventDefault(); // allow drop
    e.dataTransfer.dropEffect = "move";
  }
});

noteContent.addEventListener("drop", (e) => {
  if (draggedTable) {
    e.preventDefault();
    
    // Get drop position
    let range;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(e.clientX, e.clientY);
    } else if (e.rangeParent) {
      range = document.createRange();
      range.setStart(e.rangeParent, e.rangeOffset);
    }
    
    if (range) {
      // Find the closest block element to insert before/after
      let targetNode = range.startContainer;
      while (targetNode && targetNode.parentNode !== noteContent) {
        targetNode = targetNode.parentNode;
      }
      
      // We don't want to insert the table inside itself!
      if (targetNode && !draggedTable.contains(targetNode)) {
        // Move the table
        draggedTable.remove();
        
        if (targetNode.nextSibling) {
            noteContent.insertBefore(draggedTable, targetNode.nextSibling);
        } else {
            noteContent.appendChild(draggedTable);
        }
        
        // Ensure there is space around the table
        if (!draggedTable.nextSibling || draggedTable.nextSibling.tagName !== "DIV") {
            const p = document.createElement("div");
            p.innerHTML = "<br/>";
            noteContent.insertBefore(p, draggedTable.nextSibling);
        }
      }
    }
  }
});

// Initial setup
setupTableInteraction();


