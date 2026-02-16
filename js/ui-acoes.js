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
  initAcoesCheckboxes();
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
    
    // Update nomes nos toggles
    updateBlocoNamesInToggles();
    
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

// ===== CHECKBOXES AÇÕES → TOGGLES =====
function initAcoesCheckboxes() {
  const checkboxes = [
    { id: 'acao-graviticas', label: '⚖️ Ações Gravíticas (G+Q)' },
    { id: 'acao-sismica', label: '🌍 Ação Sísmica' },
    { id: 'acao-vento', label: '💨 Ação do Vento' },
    { id: 'acao-terras', label: '▲ Impulsos de Terras' },
    { id: 'acao-retracao', label: '🌡️ Retração/Fluência' },
    { id: 'acao-termica', label: '🌡️ Variação Térmica' },
    { id: 'acao-neve', label: '❄️ Sobrecarga Neve' },
    { id: 'acao-hidrostatica', label: '💧 Pressão Hidrostática' }
  ];
  
  checkboxes.forEach(({ id, label }) => {
    const checkbox = document.getElementById(id);
    if (!checkbox) return;
    
    checkbox.addEventListener('change', (e) => {
      const acaoId = id.replace('acao-', '');
      
      if (e.target.checked) {
        // Criar toggle para esta ação
        createAcaoToggle(acaoId, label);
      } else {
        // Remover toggle
        removeAcaoToggle(acaoId);
      }
    });
  });
  
  // Init: Criar toggles das ações já checked (ex: graviticas)
  checkboxes.forEach(({ id, label }) => {
    const checkbox = document.getElementById(id);
    if (checkbox?.checked) {
      const acaoId = id.replace('acao-', '');
      createAcaoToggle(acaoId, label);
    }
  });
}

// ===== CRIAR TOGGLE AÇÃO =====
function createAcaoToggle(acaoId, label) {
  const quadro2 = document.getElementById('sec7-quadro2');
  
  // Evitar duplicados
  if (document.getElementById(`toggle-${acaoId}`)) return;
  
  const toggleDiv = document.createElement('details');
  toggleDiv.id = `toggle-${acaoId}`;
  toggleDiv.style.cssText = 'margin-bottom: 30px;';
  
  toggleDiv.innerHTML = `
    <summary style="cursor: pointer; font-size: 1.2em; padding: 15px; background: #1a1a1a; border-radius: 8px; border-left: 4px solid #00aaff;">
      ${label}
    </summary>
    
    <div style="padding: 20px; background: #0d0d0d; margin-top: 10px; border-radius: 8px;">
      <p style="color: #999;">
        Configuração de <strong>${label}</strong> para o bloco <span id="bloco-name-${acaoId}"></span>.
      </p>
      
      <!-- TODO: Adicionar campos específicos de cada ação -->
      <div style="margin-top: 20px;">
        <label>Valor exemplo:</label>
        <input type="number" step="0.1" value="0" style="padding: 8px; background: #1a1a1a; border: 1px solid #333; border-radius: 4px; color: #fff; width: 200px;">
      </div>
    </div>
  `;
  
  // Inserir ANTES de 7.1 Zonamento Gráfico
  const zonamento = document.getElementById('sec7-1-zonamento');
  quadro2.insertBefore(toggleDiv, zonamento);
  
  // Update nome bloco
  updateBlocoNamesInToggles();
}

// ===== REMOVER TOGGLE AÇÃO =====
function removeAcaoToggle(acaoId) {
  const toggle = document.getElementById(`toggle-${acaoId}`);
  if (toggle) toggle.remove();
}

// ===== UPDATE NOME BLOCO EM TOGGLES =====
async function updateBlocoNamesInToggles() {
  if (!currentBlockId) return;
  
  const { data: block } = await window.supabaseClient
    .from('blocks')
    .select('name')
    .eq('id', currentBlockId)
    .single();
  
  if (!block) return;
  
  // Update todos os spans com nome do bloco
  document.querySelectorAll('[id^="bloco-name-"]').forEach(span => {
    span.textContent = block.name;
  });
}

// ===== EXPORTS =====
window.getCurrentProjectId = getCurrentProjectId;
window.loadFloorCanvas = loadFloorCanvas;
window.hideCanvas = hideCanvas;