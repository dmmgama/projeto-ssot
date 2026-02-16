// ===== ESTADO =====
let currentBlockId = null;
let currentFloorId = null;
let currentTab = 'limpa';

// ===== GET CURRENT PROJECT ID =====
function getCurrentProjectId() {
  if (window.appState && window.appState.activeProjectId) {
    return window.appState.activeProjectId;
  }
  
  // Fallback: URL params
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('project') || null;
}

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  initBlocoPrincipalSelector();
  initTabs();
  initEditarZonamento();
  initPisoSelector();
});

// ===== POPULATE SELECTOR BLOCO PRINCIPAL =====
async function initBlocoPrincipalSelector() {
  const projectId = getCurrentProjectId();
  if (!projectId) return;
  
  const { data: blocks } = await window.supabaseClient
    .from('blocks')
    .select('id, name')
    .eq('project_id', projectId)
    .order('created_at');
  
  const select = document.getElementById('sec7-bloco-principal');
  if (!select) return;
  
  select.innerHTML = '<option value="">-- Escolher bloco --</option>';
  
  (blocks || []).forEach(block => {
    const option = document.createElement('option');
    option.value = block.id;
    option.textContent = block.name;
    select.appendChild(option);
  });
  
  // Listener: Bloco change → mostrar conteúdo + popular pisos
  select.addEventListener('change', async (e) => {
    currentBlockId = e.target.value;
    
    const conteudo = document.getElementById('sec7-conteudo');
    const pisoSelect = document.getElementById('sec7-select-piso');
    
    if (!currentBlockId) {
      // Sem bloco → ocultar tudo
      conteudo.style.display = 'none';
      return;
    }
    
    // Com bloco → mostrar conteúdo + popular pisos
    conteudo.style.display = 'block';
    
    // Load pisos do bloco
    const { data: floors } = await window.supabaseClient
      .from('floors')
      .select('id, name, cota')
      .eq('block_id', currentBlockId)
      .order('cota');
    
    pisoSelect.innerHTML = '<option value="">-- Escolher piso --</option>';
    (floors || []).forEach(floor => {
      const option = document.createElement('option');
      option.value = floor.id;
      option.textContent = `${floor.name} (Cota ${floor.cota}m)`;
      pisoSelect.appendChild(option);
    });
    
    pisoSelect.disabled = false;
    
    // Reset canvas
    hideCanvas();
  });
}

// ===== SELECTOR PISO =====
function initPisoSelector() {
  const pisoSelect = document.getElementById('sec7-select-piso');
  if (!pisoSelect) return;
  
  pisoSelect.addEventListener('change', async (e) => {
    currentFloorId = e.target.value;
    const btnEditar = document.getElementById('btn-editar-zonamento');
    
    if (!currentFloorId) {
      btnEditar.disabled = true;
      hideCanvas();
      return;
    }
    
    // Habilitar botão editar
    btnEditar.disabled = false;
    
    // Mostrar tabs + canvas
    document.getElementById('sec7-tabs').style.display = 'block';
    document.getElementById('sec7-canvas').style.display = 'block';
    document.getElementById('sec7-placeholder').style.display = 'none';
    
    // Load imagem no canvas
    await loadFloorCanvas(currentFloorId);
  });
}

// ===== LOAD CANVAS =====
async function loadFloorCanvas(floorId) {
  const canvas = document.getElementById('sec7-canvas');
  const ctx = canvas.getContext('2d');
  
  if (!canvas || !ctx) return;
  
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Tentar carregar imagem
  try {
    if (!window.getFloorImageURL) {
      console.error('getFloorImageURL não disponível');
      return;
    }
    
    const imageURL = await window.getFloorImageURL(floorId);
    
    if (imageURL) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageURL;
      await img.decode();
      
      // Scale to fit
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      
      // Center
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, x, y, w, h);
    } else {
      // Sem imagem
      ctx.fillStyle = '#666';
      ctx.font = '16px sans-serif';
      ctx.fillText('Sem planta. Upload em Secção 2 (Blocos).', 50, 50);
    }
    
    // TODO: Render layers (lajes, sobrecargas, etc) por cima da imagem
    // renderLayer(currentTab);
    
  } catch (error) {
    console.error('Erro carregar canvas:', error);
  }
}

// ===== HIDE CANVAS =====
function hideCanvas() {
  document.getElementById('sec7-tabs').style.display = 'none';
  document.getElementById('sec7-canvas').style.display = 'none';
  document.getElementById('sec7-placeholder').style.display = 'block';
}

// ===== TABS =====
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Remove active de todos
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.style.borderColor = '#333';
      });
      
      // Ativa clicado
      e.target.classList.add('active');
      e.target.style.borderColor = '#00aaff';
      
      currentTab = e.target.dataset.tab;
      
      // Reload canvas com novo layer
      if (currentFloorId) {
        loadFloorCanvas(currentFloorId);
      }
    });
  });
}

// ===== BOTÃO EDITAR ZONAMENTO =====
function initEditarZonamento() {
  const btn = document.getElementById('btn-editar-zonamento');
  if (!btn) return;
  
  btn.addEventListener('click', () => {
    if (!currentFloorId) return;
    
    // Abrir zonas.html em popup
    const width = 1400;
    const height = 900;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    
    const popup = window.open(
      `zonas.html?floor=${currentFloorId}`,
      'ZonamentoEditor',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    if (!popup) {
      alert('Popup bloqueado! Permita popups para este site.');
    }
  });
}

// ===== EXPORTS =====
window.getCurrentProjectId = getCurrentProjectId;
window.loadFloorCanvas = loadFloorCanvas;
window.hideCanvas = hideCanvas;