/* =============================================
   SKETCH MODE
   ============================================= */

let isSketching = false;
let sketchCtx = null;
let currentTool = 'pen'; // pen, bucket, text, eraser, picker
let currentBrush = 'solid'; // solid, marker, spray
let currentShape = null; // line, arrow, rect, circle, triangle, star
let activeColorTarget = 1; // 1 or 2
let color1 = '#e8b86d';
let color2 = '#1c1a18';
let sketchSize = 3;
let lastX = 0;
let lastY = 0;
let startX = 0;
let startY = 0;
let savedCanvasState = null;
let editingImageNode = null;

// Initialize
function initSketchCanvas(imgNode = null) {
  editingImageNode = imgNode;
  const rect = sketchCanvasWrapper.getBoundingClientRect();
  sketchCanvas.width = rect.width;
  sketchCanvas.height = rect.height;
  sketchCtx = sketchCanvas.getContext('2d', { willReadFrequently: true });
  sketchCtx.lineCap = 'round';
  sketchCtx.lineJoin = 'round';
  
  if (imgNode) {
    // Load existing image onto canvas
    const img = new Image();
    img.onload = () => {
      // Clear first
      sketchCtx.fillStyle = '#1c1a18';
      sketchCtx.fillRect(0, 0, sketchCanvas.width, sketchCanvas.height);
      sketchCtx.drawImage(img, 0, 0);
    };
    img.src = imgNode.src;
  } else {
    clearSketchCanvas();
  }
}

function clearSketchCanvas() {
  if (!sketchCtx) return;
  sketchCtx.fillStyle = '#1c1a18';
  sketchCtx.fillRect(0, 0, sketchCanvas.width, sketchCanvas.height);
}

// UI State Updates
function updateActiveTool(tool) {
  currentTool = tool;
  currentShape = null;
  sketchToolBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tool === tool));
  sketchShapeBtns.forEach(btn => btn.classList.remove('active'));
  sketchCanvas.style.cursor = tool === 'text' ? 'text' : tool === 'picker' ? 'alias' : 'crosshair';
}

function updateActiveShape(shape) {
  currentShape = shape;
  currentTool = null;
  sketchShapeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.shape === shape));
  sketchToolBtns.forEach(btn => btn.classList.remove('active'));
  sketchCanvas.style.cursor = 'crosshair';
}

function updateActiveColorTarget(target) {
  activeColorTarget = target;
  color1Wrap.classList.toggle('active', target === 1);
  color2Wrap.classList.toggle('active', target === 2);
}

function setColor(hex) {
  if (activeColorTarget === 1) {
    color1 = hex;
    color1Box.style.backgroundColor = hex;
  } else {
    color2 = hex;
    color2Box.style.backgroundColor = hex;
  }
}

// Event Listeners for UI
sketchToolBtns.forEach(btn => btn.addEventListener('click', () => updateActiveTool(btn.dataset.tool)));
sketchShapeBtns.forEach(btn => btn.addEventListener('click', () => updateActiveShape(btn.dataset.shape)));

color1Wrap.addEventListener('click', () => updateActiveColorTarget(1));
color2Wrap.addEventListener('click', () => updateActiveColorTarget(2));

colorSwatches.forEach(btn => {
  btn.addEventListener('click', () => setColor(btn.dataset.color));
});

sketchCustomColor.addEventListener('input', (e) => setColor(e.target.value));

sketchSizeSlider.addEventListener('input', (e) => { sketchSize = parseInt(e.target.value); });

sketchBrushBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  sketchBrushDropdown.style.display = sketchBrushDropdown.style.display === 'flex' ? 'none' : 'flex';
});

document.addEventListener('click', (e) => {
  if (!sketchBrushBtn.contains(e.target) && sketchBrushDropdown) {
    sketchBrushDropdown.style.display = 'none';
  }
  const mobileColorToggleBtn = document.getElementById('mobileColorToggleBtn');
  const colorPopupContainer = document.getElementById('colorPopupContainer');
  if (mobileColorToggleBtn && colorPopupContainer) {
    if (!mobileColorToggleBtn.contains(e.target) && !colorPopupContainer.contains(e.target)) {
      colorPopupContainer.classList.remove('open');
    }
  }
});

const mobileColorToggleBtn = document.getElementById('mobileColorToggleBtn');
const colorPopupContainer = document.getElementById('colorPopupContainer');
if (mobileColorToggleBtn && colorPopupContainer) {
  mobileColorToggleBtn.addEventListener('click', () => {
    colorPopupContainer.classList.toggle('open');
  });
}

sketchBrushItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    currentBrush = item.dataset.brush;
    sketchBrushItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    sketchBrushDropdown.style.display = 'none';
  });
});

sketchClearBtn.addEventListener('click', clearSketchCanvas);
sketchCancelBtn.addEventListener('click', () => { 
  editingImageNode = null; 
  if (activeNoteId) window.Router.navigate(`/notes`);
  else window.Router.navigate(`/`);
});

sketchDoneBtn.addEventListener('click', () => {
  const dataUrl = sketchCanvas.toDataURL('image/png');
  
  if (editingImageNode) {
    editingImageNode.src = dataUrl;
  } else {
    noteContent.focus();
    restoreSelection(savedSelection);
    const html = `<img src="${dataUrl}" alt="Sketch" /><p><br></p>`;
    execCmd('insertHTML', html);
  }
  
  editingImageNode = null;
  autoSave();
  
  if (activeNoteId) window.Router.navigate(`/notes`);
  else window.Router.navigate(`/`);
});

// Drawing logic
function getCoords(e) {
  const rect = sketchCanvas.getBoundingClientRect();
  const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
  const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function startSketch(e) {
  if (e.target !== sketchCanvas) return;
  const { x, y } = getCoords(e);
  
  if (currentTool === 'text') {
    sketchTextInput.style.left = `${x}px`;
    sketchTextInput.style.top = `${y - 10}px`;
    sketchTextInput.style.display = 'block';
    sketchTextInput.style.fontSize = `${Math.max(16, sketchSize * 2)}px`;
    sketchTextInput.style.color = color1;
    sketchTextInput.value = '';
    setTimeout(() => sketchTextInput.focus(), 10);
    return;
  }
  
  if (currentTool === 'picker') {
    pickColor(x, y);
    return;
  }

  if (currentTool === 'bucket') {
    floodFill(Math.floor(x), Math.floor(y), hexToRgba(color1));
    return;
  }

  isSketching = true;
  startX = lastX = x;
  startY = lastY = y;
  
  if (currentShape) {
    savedCanvasState = sketchCtx.getImageData(0, 0, sketchCanvas.width, sketchCanvas.height);
  } else {
    sketchCtx.beginPath();
    sketchCtx.moveTo(x, y);
  }
}

function drawSketch(e) {
  if (!isSketching) return;
  e.preventDefault();
  const { x, y } = getCoords(e);
  
  if (currentShape) {
    sketchCtx.putImageData(savedCanvasState, 0, 0);
    drawShape(startX, startY, x, y);
  } else {
    // Freehand drawing (Pen, Eraser, Brushes)
    sketchCtx.beginPath();
    sketchCtx.moveTo(lastX, lastY);
    sketchCtx.lineTo(x, y);
    
    if (currentTool === 'eraser') {
      sketchCtx.strokeStyle = color2;
      sketchCtx.lineWidth = sketchSize * 2;
    } else {
      sketchCtx.strokeStyle = color1;
      sketchCtx.lineWidth = sketchSize;
      
      // Simple brush effects
      if (currentBrush === 'spray') {
        for(let i=0; i<10; i++) {
          const offsetX = x + (Math.random() * sketchSize * 2 - sketchSize);
          const offsetY = y + (Math.random() * sketchSize * 2 - sketchSize);
          sketchCtx.fillStyle = color1;
          sketchCtx.fillRect(offsetX, offsetY, 1, 1);
        }
        sketchCtx.stroke(); // keep main line thin or omit
      }
    }
    sketchCtx.stroke();
  }
  
  lastX = x;
  lastY = y;
}

function stopSketch() {
  if (!isSketching) return;
  isSketching = false;
  sketchCtx.beginPath();
}

sketchCanvas.addEventListener('mousedown', startSketch);
sketchCanvas.addEventListener('mousemove', drawSketch);
window.addEventListener('mouseup', stopSketch);
sketchCanvas.addEventListener('touchstart', startSketch, { passive: false });
sketchCanvas.addEventListener('touchmove', drawSketch, { passive: false });
window.addEventListener('touchend', stopSketch);

// Text Input Handler
sketchTextInput.addEventListener('blur', () => {
  if (sketchTextInput.value.trim() !== '') {
    sketchCtx.font = `${Math.max(16, sketchSize * 2)}px "DM Sans", sans-serif`;
    sketchCtx.fillStyle = color1;
    sketchCtx.fillText(sketchTextInput.value, parseInt(sketchTextInput.style.left), parseInt(sketchTextInput.style.top) + Math.max(16, sketchSize * 2));
  }
  sketchTextInput.style.display = 'none';
});
sketchTextInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sketchTextInput.blur();
  }
});

// Shape Drawing Logic
function drawShape(sx, sy, cx, cy) {
  sketchCtx.strokeStyle = color1;
  sketchCtx.fillStyle = color2; // fill color
  sketchCtx.lineWidth = sketchSize;
  sketchCtx.beginPath();
  
  const w = cx - sx;
  const h = cy - sy;
  
  if (currentShape === 'line') {
    sketchCtx.moveTo(sx, sy);
    sketchCtx.lineTo(cx, cy);
  } else if (currentShape === 'rect') {
    sketchCtx.rect(sx, sy, w, h);
    sketchCtx.fill();
  } else if (currentShape === 'circle') {
    const radiusX = Math.abs(w / 2);
    const radiusY = Math.abs(h / 2);
    sketchCtx.ellipse(sx + w/2, sy + h/2, radiusX, radiusY, 0, 0, Math.PI * 2);
    sketchCtx.fill();
  } else if (currentShape === 'triangle') {
    sketchCtx.moveTo(sx + w/2, sy);
    sketchCtx.lineTo(sx + w, cy);
    sketchCtx.lineTo(sx, cy);
    sketchCtx.closePath();
    sketchCtx.fill();
  } else if (currentShape === 'arrow') {
    const headlen = 15;
    const angle = Math.atan2(cy - sy, cx - sx);
    sketchCtx.moveTo(sx, sy);
    sketchCtx.lineTo(cx, cy);
    sketchCtx.lineTo(cx - headlen * Math.cos(angle - Math.PI / 6), cy - headlen * Math.sin(angle - Math.PI / 6));
    sketchCtx.moveTo(cx, cy);
    sketchCtx.lineTo(cx - headlen * Math.cos(angle + Math.PI / 6), cy - headlen * Math.sin(angle + Math.PI / 6));
  } else if (currentShape === 'star') {
    const cxCenter = sx + w/2;
    const cyCenter = sy + h/2;
    const outerRadius = Math.abs(Math.min(w, h)) / 2;
    const innerRadius = outerRadius / 2.5;
    const spikes = 5;
    let rot = Math.PI / 2 * 3;
    let x, y;
    let step = Math.PI / spikes;
    
    sketchCtx.moveTo(cxCenter, cyCenter - outerRadius);
    for(let i = 0; i < spikes; i++){
      x = cxCenter + Math.cos(rot) * outerRadius;
      y = cyCenter + Math.sin(rot) * outerRadius;
      sketchCtx.lineTo(x, y);
      rot += step;
      x = cxCenter + Math.cos(rot) * innerRadius;
      y = cyCenter + Math.sin(rot) * innerRadius;
      sketchCtx.lineTo(x, y);
      rot += step;
    }
    sketchCtx.lineTo(cxCenter, cyCenter - outerRadius);
    sketchCtx.closePath();
    sketchCtx.fill();
  }
  
  sketchCtx.stroke();
}

// Picker logic
function pickColor(x, y) {
  const pixel = sketchCtx.getImageData(x, y, 1, 1).data;
  const hex = "#" + ("000000" + rgbToHex(pixel[0], pixel[1], pixel[2])).slice(-6);
  setColor(hex);
}
function rgbToHex(r, g, b) {
  if (r > 255 || g > 255 || b > 255) throw "Invalid color component";
  return ((r << 16) | (g << 8) | b).toString(16);
}
function hexToRgba(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b, 255];
}

// Flood Fill Logic (Simple recursive array-based implementation)
function floodFill(x, y, fillColor) {
  const imageData = sketchCtx.getImageData(0, 0, sketchCanvas.width, sketchCanvas.height);
  const data = imageData.data;
  const targetColor = getPixel(data, x, y, sketchCanvas.width);
  
  if (colorsMatch(targetColor, fillColor)) return;
  
  const pixelsToCheck = [x, y];
  const width = sketchCanvas.width;
  const height = sketchCanvas.height;
  
  while (pixelsToCheck.length > 0) {
    const cy = pixelsToCheck.pop();
    const cx = pixelsToCheck.pop();
    
    let currentColor = getPixel(data, cx, cy, width);
    if (!colorsMatch(currentColor, targetColor)) continue;
    
    setPixel(data, cx, cy, width, fillColor);
    
    if (cx > 0) pixelsToCheck.push(cx - 1, cy);
    if (cx < width - 1) pixelsToCheck.push(cx + 1, cy);
    if (cy > 0) pixelsToCheck.push(cx, cy - 1);
    if (cy < height - 1) pixelsToCheck.push(cx, cy + 1);
  }
  
  sketchCtx.putImageData(imageData, 0, 0);
}
function getPixel(data, x, y, width) {
  const i = (y * width + x) * 4;
  return [data[i], data[i+1], data[i+2], data[i+3]];
}
function setPixel(data, x, y, width, color) {
  const i = (y * width + x) * 4;
  data[i] = color[0]; data[i+1] = color[1]; data[i+2] = color[2]; data[i+3] = color[3];
}
function colorsMatch(c1, c2) {
  return c1[0]===c2[0] && c1[1]===c2[1] && c1[2]===c2[2] && c1[3]===c2[3];
}

// Trigger Sketch Mode
sketchModeBtn.addEventListener('click', () => {
  if (activeNoteId) window.Router.navigate(`/notes/sketch`);
});

// Image Context Menu for Edit/Delete
let selectedImageNode = null;

let hideContextMenuTimeout = null;

noteContent.addEventListener('mouseover', (e) => {
  if (e.target.tagName === 'IMG') {
    clearTimeout(hideContextMenuTimeout);
    selectedImageNode = e.target;
    // Show context menu at the top-right corner of the image
    const rect = e.target.getBoundingClientRect();
    const menuWidth = 140; // From CSS
    
    // Position menu top-right inside the image
    sketchContextMenu.style.left = `${rect.right + window.scrollX - menuWidth - 16}px`;
    sketchContextMenu.style.top = `${rect.top + window.scrollY + 16}px`;
    sketchContextMenu.style.display = 'flex';
    
    // Hide 'Edit' option for non-sketch images
    const isSketch = selectedImageNode.src.startsWith('data:image');
    if (isSketch) {
      sketchContextEdit.style.display = 'flex';
      sketchContextEdit.nextElementSibling.style.display = 'block'; // the divider
    } else {
      sketchContextEdit.style.display = 'none';
      sketchContextEdit.nextElementSibling.style.display = 'none'; // the divider
    }
  }
});

noteContent.addEventListener('mouseout', (e) => {
  if (e.target.tagName === 'IMG') {
    hideContextMenuTimeout = setTimeout(() => {
      sketchContextMenu.style.display = 'none';
    }, 300);
  }
});

sketchContextMenu.addEventListener('mouseover', () => {
  clearTimeout(hideContextMenuTimeout);
});

sketchContextMenu.addEventListener('mouseleave', () => {
  hideContextMenuTimeout = setTimeout(() => {
    sketchContextMenu.style.display = 'none';
  }, 300);
});

sketchContextDelete.addEventListener('click', () => {
  if (selectedImageNode) {
    selectedImageNode.remove();
    selectedImageNode = null;
    sketchContextMenu.style.display = 'none';
    autoSave();
  }
});

sketchContextEdit.addEventListener('click', () => {
  if (selectedImageNode) {
    sketchOverlay.style.display = 'flex';
    sketchContextMenu.style.display = 'none';
    setTimeout(() => initSketchCanvas(selectedImageNode), 50);
  }
});

// Image Resizing Logic
let isImageResizing = false;
let currentResizerImage = null;
let startResizeX, startResizeWidth;
let resizeDirection = ''; // 'tl', 'tr', 'bl', 'br'

noteContent.addEventListener('mousemove', (e) => {
  if (isImageResizing) return;
  if (e.target.tagName === 'IMG') {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const threshold = 20;

    let cursor = 'default';
    
    if (x < threshold && y < threshold) {
      cursor = 'nwse-resize';
    } else if (w - x < threshold && y < threshold) {
      cursor = 'nesw-resize';
    } else if (w - x < threshold && h - y < threshold) {
      cursor = 'nwse-resize';
    } else if (x < threshold && h - y < threshold) {
      cursor = 'nesw-resize';
    }

    e.target.style.cursor = cursor;
  }
});

noteContent.addEventListener('mousedown', (e) => {
  if (e.target.tagName === 'IMG') {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const threshold = 20;

    let dir = '';
    if (x < threshold && y < threshold) dir = 'tl';
    else if (w - x < threshold && y < threshold) dir = 'tr';
    else if (w - x < threshold && h - y < threshold) dir = 'br';
    else if (x < threshold && h - y < threshold) dir = 'bl';

    if (dir) {
      isImageResizing = true;
      currentResizerImage = e.target;
      startResizeX = e.clientX;
      startResizeWidth = rect.width;
      resizeDirection = dir;
      e.preventDefault(); // Prevent text selection while dragging
    }
  }
});

document.addEventListener('mousemove', (e) => {
  if (!isImageResizing || !currentResizerImage) return;
  const dx = e.clientX - startResizeX;
  let newWidth = startResizeWidth;

  if (resizeDirection === 'tr' || resizeDirection === 'br') {
    newWidth = startResizeWidth + dx; // Dragging right increases width
  } else if (resizeDirection === 'tl' || resizeDirection === 'bl') {
    newWidth = startResizeWidth - dx; // Dragging left (negative dx) increases width
  }

  if (newWidth > 50) { // Minimum width 50px
    currentResizerImage.style.width = newWidth + 'px';
    currentResizerImage.style.height = 'auto'; // Maintain aspect ratio
    currentResizerImage.style.maxHeight = 'none'; // Override CSS max-height limit
  }
});

document.addEventListener('mouseup', () => {
  if (isImageResizing) {
    isImageResizing = false;
    currentResizerImage = null;
    resizeDirection = '';
    autoSave();
  }
});

// Mobile touch support for image resizing
noteContent.addEventListener('touchstart', (e) => {
  if (e.target.tagName === 'IMG' && e.touches.length === 1) {
    const rect = e.target.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const threshold = 40; // Larger threshold for touch

    let dir = '';
    if (x < threshold && y < threshold) dir = 'tl';
    else if (w - x < threshold && y < threshold) dir = 'tr';
    else if (w - x < threshold && h - y < threshold) dir = 'br';
    else if (x < threshold && h - y < threshold) dir = 'bl';

    if (dir) {
      isImageResizing = true;
      currentResizerImage = e.target;
      startResizeX = touch.clientX;
      startResizeWidth = rect.width;
      resizeDirection = dir;
      // Prevent default to avoid scrolling while resizing
      if (e.cancelable) e.preventDefault();
    }
  }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (!isImageResizing || !currentResizerImage) return;
  const touch = e.touches[0];
  const dx = touch.clientX - startResizeX;
  let newWidth = startResizeWidth;

  if (resizeDirection === 'tr' || resizeDirection === 'br') {
    newWidth = startResizeWidth + dx;
  } else if (resizeDirection === 'tl' || resizeDirection === 'bl') {
    newWidth = startResizeWidth - dx;
  }

  if (newWidth > 50) {
    currentResizerImage.style.width = newWidth + 'px';
    currentResizerImage.style.height = 'auto';
    currentResizerImage.style.maxHeight = 'none';
  }
  if (e.cancelable) e.preventDefault();
}, { passive: false });

document.addEventListener('touchend', () => {
  if (isImageResizing) {
    isImageResizing = false;
    currentResizerImage = null;
    resizeDirection = '';
    autoSave();
  }
});
