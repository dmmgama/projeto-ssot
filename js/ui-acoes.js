// ===== ESTADO AÇÕES =====
const acoesState = {
  graviticas: { enabled: true, scope: 'global' },
  sismica: { enabled: false, scope: 'global' },
  vento: { enabled: false, scope: 'global' },
  terras: { enabled: false, scope: 'global' },
  retracao: { enabled: false, scope: 'global' },
  termica: { enabled: false, scope: 'global' },
  neve: { enabled: false, scope: 'global' },
  hidrostatica: { enabled: false, scope: 'global' }
};

// ===== GET CURRENT PROJECT ID =====
function getCurrentProjectId() {
  if (window.appState && window.appState.activeProjectId) {
    return window.appState.activeProjectId;
  }
  
  // Fallback: URL params
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('project') || null;
}

// ===== INIT LISTENERS QUADRO 1 =====
function initAcoesQuadro1() {
  // Listener checkboxes (mostrar/ocultar scope selector)
  document.querySelectorAll('.acao-checkbox input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const acaoId = e.target.id.replace('acao-', '');
      const scopeDiv = document.getElementById(`scope-${acaoId}`);
      
      if (!scopeDiv) return;
      
      if (e.target.checked) {
        scopeDiv.style.display = 'block';
        acoesState[acaoId].enabled = true;
      } else {
        scopeDiv.style.display = 'none';
        acoesState[acaoId].enabled = false;
      }
      
      renderAcoesGlobais();
      renderAcoesPorBloco();
    });
  });
  
  // Listener scope selectors (global vs por-bloco)
  document.querySelectorAll('.scope-selector').forEach(select => {
    select.addEventListener('change', (e) => {
      const acaoId = e.target.dataset.acao;
      if (acoesState[acaoId]) {
        acoesState[acaoId].scope = e.target.value;
      }
      
      renderAcoesGlobais();
      renderAcoesPorBloco();
    });
  });
}

// ===== RENDER AÇÕES GLOBAIS =====
function renderAcoesGlobais() {
  const container = document.getElementById('sec7-globais-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  const acoesGlobais = Object.entries(acoesState)
    .filter(([key, val]) => val.enabled && val.scope === 'global');
  
  if (acoesGlobais.length === 0) {
    container.innerHTML = '<p style="color: var(--muted); padding: 20px; background: #0d0d0d; border-radius: 6px; text-align: center;">Nenhuma ação global selecionada.</p>';
    return;
  }
  
  acoesGlobais.forEach(([key, val]) => {
    const acaoDiv = document.createElement('div');
    acaoDiv.className = 'acao-global-toggle';
    
    acaoDiv.innerHTML = `
      <h4>${getAcaoLabel(key)}</h4>
      <div class="acao-toggles" style="margin-top: 15px;">
        <p style="color: var(--muted); font-size: 0.9em;">
          Configuração global de ${getAcaoLabel(key)} (aplica-se a todos os blocos).
        </p>
        <!-- TODO: Adicionar campos específicos por tipo de ação -->
      </div>
    `;
    
    container.appendChild(acaoDiv);
  });
}

// ===== RENDER AÇÕES POR BLOCO =====
async function renderAcoesPorBloco() {
  const container = document.getElementById('sec7-por-bloco-container');
  if (!container) return;
  
  const blocoSelect = document.getElementById('sec7-select-bloco-acoes');
  const blocoId = blocoSelect ? blocoSelect.value : null;
  
  container.innerHTML = '';
  
  const acoesPorBloco = Object.entries(acoesState)
    .filter(([key, val]) => val.enabled && val.scope === 'por-bloco');
  
  if (acoesPorBloco.length === 0) {
    container.innerHTML = '<p style="color: var(--muted); padding: 20px; background: #0d0d0d; border-radius: 6px; text-align: center;">Nenhuma ação "Por Bloco" selecionada.</p>';
    return;
  }
  
  if (!blocoId) {
    container.innerHTML = '<p style="color: var(--muted); padding: 20px; background: #0d0d0d; border-radius: 6px; text-align: center;">Selecione um bloco acima.</p>';
    return;
  }
  
  acoesPorBloco.forEach(([key, val]) => {
    const acaoDiv = document.createElement('div');
    acaoDiv.className = 'acao-bloco-toggle';
    
    acaoDiv.innerHTML = `
      <h4>${getAcaoLabel(key)} (Bloco específico)</h4>
      <div class="acao-toggles" style="margin-top: 15px;">
        <p style="color: var(--muted); font-size: 0.9em;">
          Configuração de ${getAcaoLabel(key)} para o bloco selecionado.
        </p>
        <!-- TODO: Adicionar campos específicos por tipo de ação -->
      </div>
    `;
    
    container.appendChild(acaoDiv);
  });
}

// ===== POPULATE BLOCOS SELECTOR (AÇÕES) =====
async function populateBlocosAcoes() {
  const projectId = getCurrentProjectId();
  if (!projectId) return;
  
  const select = document.getElementById('sec7-select-bloco-acoes');
  if (!select) return;
  
  if (!window.supabaseClient || !window.listProjectBlocks) {
    console.warn('[ui-acoes] Supabase ou listProjectBlocks não disponível');
    return;
  }
  
  const { data: blocks, error } = await window.supabaseClient
    .from('blocks')
    .select('id, name')
    .eq('project_id', projectId)
    .order('created_at');
  
  if (error) {
    console.error('[ui-acoes] Erro carregar blocos:', error);
    return;
  }
  
  select.innerHTML = '<option value="">Escolher bloco...</option>';
  
  (blocks || []).forEach(block => {
    const option = document.createElement('option');
    option.value = block.id;
    option.textContent = block.name || 'Bloco sem nome';
    select.appendChild(option);
  });
}

// ===== HELPER: LABEL AÇÃO =====
function getAcaoLabel(key) {
  const labels = {
    graviticas: '⚖️ Ações Gravíticas (G+Q)',
    sismica: '🌍 Ação Sísmica',
    vento: '💨 Ação do Vento',
    terras: '▲ Impulsos de Terras',
    retracao: '↔️ Retração/Fluência',
    termica: '🌡️ Variação Térmica',
    neve: '❄️ Sobrecarga Neve',
    hidrostatica: '💧 Pressão Hidrostática'
  };
  return labels[key] || key;
}

// ===== PREVIOUS CODE (Canvas visualization) =====

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

// Export Secção 7 Ações functions
window.initAcoesQuadro1 = initAcoesQuadro1;
window.renderAcoesGlobais = renderAcoesGlobais;
window.renderAcoesPorBloco = renderAcoesPorBloco;
window.populateBlocosAcoes = populateBlocosAcoes;

// ===== INIT SECÇÃO 7 COMPLETA =====
function initSec7() {
  initSec7Canvas();
  
  // Init Quadro 1 (ações)
  initAcoesQuadro1();
  populateBlocosAcoes();
  
  // Listener selector bloco (ações por bloco)
  const blocoAcoesSelect = document.getElementById('sec7-select-bloco-acoes');
  if (blocoAcoesSelect) {
    blocoAcoesSelect.addEventListener('change', () => {
      renderAcoesPorBloco();
    });
  }
  
  // Render inicial
  renderAcoesGlobais();
  renderAcoesPorBloco();
}

// Auto-init on DOMContentLoaded (if not already initialized)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSec7);
} else {
  // DOM already loaded
  initSec7();
}