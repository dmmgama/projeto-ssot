// ===== POPULATE BLOCOS SELECTOR =====
async function populateBlockSelector(projectId) {
  const blockSelect = document.getElementById('sec7-select-bloco');
  const floorSelect = document.getElementById('sec7-select-piso');
  if (!blockSelect || !floorSelect || !projectId) return;

  const blocksResult = await window.listProjectBlocks(projectId);
  const blocks = blocksResult.success ? blocksResult.blocks : [];

  blockSelect.innerHTML = '<option value="">Escolher bloco...</option>';
  blocks.forEach((block) => {
    const option = document.createElement('option');
    option.value = block.id;
    option.textContent = block.name || 'Bloco sem nome';
    blockSelect.appendChild(option);
  });

  floorSelect.innerHTML = '<option value="">Escolher piso...</option>';
  floorSelect.disabled = true;
  
  // Clear canvas
  clearCanvas();
}

// ===== POPULATE FLOORS SELECTOR =====
async function populateFloorSelector(blockId) {
  const floorSelect = document.getElementById('sec7-select-piso');
  if (!floorSelect) return;

  floorSelect.innerHTML = '<option value="">Escolher piso...</option>';

  if (!blockId) {
    floorSelect.disabled = true;
    clearCanvas();
    return;
  }

  const floorsResult = await window.listBlockFloors(blockId);
  const floors = floorsResult.success ? floorsResult.floors : [];

  floors
    .sort((a, b) => (a.cota || 0) - (b.cota || 0)) // Ordenar por cota
    .forEach((floor) => {
      const option = document.createElement('option');
      option.value = floor.id;
      const cota = Number.isFinite(Number(floor.cota)) ? Number(floor.cota) : 0;
      option.textContent = `${floor.name || 'Piso'} (Cota ${cota}m)`;
      floorSelect.appendChild(option);
    });

  floorSelect.disabled = false;
}

// ===== CLEAR CANVAS =====
function clearCanvas() {
  const canvas = document.getElementById('sec7-canvas');
  const noImageMsg = document.getElementById('sec7-no-image');
  
  if (canvas) {
    canvas.style.display = 'none';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  if (noImageMsg) {
    noImageMsg.style.display = 'none';
  }
}

// ===== LOAD CANVAS WITH FLOOR IMAGE =====
async function loadFloorCanvas(floorId) {
  const canvas = document.getElementById('sec7-canvas');
  const ctx = canvas.getContext('2d');
  const noImageMsg = document.getElementById('sec7-no-image');
  
  if (!canvas || !ctx || !noImageMsg) {
    console.error('Canvas elements not found');
    return;
  }
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  canvas.style.display = 'none';
  noImageMsg.style.display = 'none';
  
  if (!floorId) {
    return;
  }
  
  // Get floor data
  const floorResult = await window.getFloor(floorId);
  if (!floorResult.floor) {
    console.error('Floor not found');
    return;
  }
  
  const floor = floorResult.floor;
  
  // Check if floor has image
  if (!floor.image_path) {
    noImageMsg.style.display = 'block';
    return;
  }
  
  // Try to load image
  try {
    if (!window.getFloorImageURL) {
      console.error('getFloorImageURL function not available');
      noImageMsg.style.display = 'block';
      return;
    }
    
    const imageURL = await window.getFloorImageURL(floorId);
    
    if (!imageURL) {
      noImageMsg.style.display = 'block';
      return;
    }
    
    const img = new Image();
    img.crossOrigin = 'anonymous'; // For CORS
    img.src = imageURL;
    
    await img.decode();
    
    // Calculate scale to fit canvas maintaining aspect ratio
    const scale = Math.min(
      canvas.width / img.width,
      canvas.height / img.height
    );
    
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    
    // Center image on canvas
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;
    
    // Draw image
    ctx.fillStyle = '#0d1016'; // Background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    
    canvas.style.display = 'block';
    
  } catch (error) {
    console.error('Error loading floor image:', error);
    noImageMsg.style.display = 'block';
  }
}

// ===== EVENT HANDLERS =====
async function onSec7BlockChange() {
  const blockSelect = document.getElementById('sec7-select-bloco');
  const blockId = blockSelect ? blockSelect.value : '';
  await populateFloorSelector(blockId);
  clearCanvas();
}

async function onSec7FloorChange() {
  const floorSelect = document.getElementById('sec7-select-piso');
  const floorId = floorSelect ? floorSelect.value : '';
  
  if (!floorId) {
    clearCanvas();
    return;
  }
  
  await loadFloorCanvas(floorId);
}

// ===== INIT SEC 7.1 =====
function initSec7Canvas() {
  const blockSelect = document.getElementById('sec7-select-bloco');
  const floorSelect = document.getElementById('sec7-select-piso');
  
  if (blockSelect) {
    blockSelect.addEventListener('change', onSec7BlockChange);
  }
  
  if (floorSelect) {
    floorSelect.addEventListener('change', onSec7FloorChange);
  }
}

// Export functions
window.populateBlockSelector = populateBlockSelector;
window.populateFloorSelector = populateFloorSelector;
window.onSec7BlockChange = onSec7BlockChange;
window.onSec7FloorChange = onSec7FloorChange;
window.loadFloorCanvas = loadFloorCanvas;
window.initSec7Canvas = initSec7Canvas;

// Auto-init on DOMContentLoaded (if not already initialized)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSec7Canvas);
} else {
  // DOM already loaded
  initSec7Canvas();
}