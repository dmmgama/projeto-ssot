const BLOCO_TIPOLOGIAS = {
  'fundacao': '🏗️ Fundação',
  'enterrado': '⬇️ Enterrado',
  'elevado': '⬆️ Elevado',
  'cobertura': '🏠 Cobertura'
};

function createTipologiaHTML() {
  return Object.entries(BLOCO_TIPOLOGIAS).map(([key, label]) => `
    <div class="tipologia" data-tipo="${key}">
      <h4>${label}</h4>
      <div class="pisos-list"></div>
      <button class="btn-sm btn-add-piso" data-tipo="${key}" type="button">+ Piso</button>
    </div>
  `).join('');
}

async function fillPisosForBlock(blockElement, blockId) {
  const listResult = await window.listBlockFloors(blockId);
  const floors = listResult.success ? listResult.floors : [];

  blockElement.querySelectorAll('.tipologia').forEach((tipologiaElement) => {
    const tipologia = tipologiaElement.dataset.tipo;
    const pisosList = tipologiaElement.querySelector('.pisos-list');
    const pisos = floors.filter((floor) => (floor.tipologia || '') === tipologia);

    if (pisos.length === 0) {
      pisosList.innerHTML = '<div style="opacity:.7;font-size:12px;padding:8px;color:var(--muted)">Sem pisos</div>';
      return;
    }

    pisosList.innerHTML = '';
    pisos.forEach((floor) => {
      renderPiso(floor, pisosList);
    });
  });
}

// ===== RENDER PISO =====
function renderPiso(floor, parentElement) {
  const template = document.getElementById('template-piso-item');
  if (!template) {
    console.error('Template piso-item não encontrado');
    return;
  }
  
  const pisoItem = template.content.cloneNode(true);
  const pisoDiv = pisoItem.querySelector('.piso-item');
  
  pisoDiv.dataset.floorId = floor.id;
  
  // Nome editável
  const nameSpan = pisoItem.querySelector('.piso-name');
  nameSpan.textContent = floor.name || 'Piso';
  nameSpan.addEventListener('blur', async (e) => {
    const newName = e.target.textContent.trim() || 'Piso';
    await window.updateFloor(floor.id, { name: newName });
    e.target.textContent = newName;
  });
  
  // Tipologia dropdown
  const tipologiaSelect = pisoItem.querySelector('.piso-tipologia');
  tipologiaSelect.value = floor.tipologia || 'elevado';
  tipologiaSelect.addEventListener('change', async (e) => {
    await window.updateFloor(floor.id, { tipologia: e.target.value });
    // Re-render blocos para mover piso para tipologia correta
    if (window.currentBlocosProjectId) {
      await renderBlocos(window.currentBlocosProjectId);
    }
  });
  
  // Botão expandir
  const expandBtn = pisoItem.querySelector('.btn-expand-piso');
  const pisoBody = pisoDiv.querySelector('.piso-body');
  expandBtn.addEventListener('click', () => {
    const isOpen = pisoBody.style.display !== 'none';
    pisoBody.style.display = isOpen ? 'none' : 'block';
    expandBtn.textContent = isOpen ? '▼' : '▲';
    expandBtn.classList.toggle('expanded', !isOpen);
  });
  
  // Botão delete
  pisoItem.querySelector('.btn-delete-piso').addEventListener('click', async () => {
    if (!confirm(`Apagar piso "${floor.name || 'Piso'}"?`)) return;
    
    const result = await window.deleteFloor(floor.id);
    if (!result.success) {
      alert(result.error || 'Erro ao apagar piso');
      return;
    }
    
    if (window.currentBlocosProjectId) {
      await renderBlocos(window.currentBlocosProjectId);
    }
  });
  
  // Render cotas
  const cotasList = pisoItem.querySelector('.cotas-list');
  renderCotas(floor, cotasList);
  
  // Botão adicionar cota
  const addCotaBtn = pisoItem.querySelector('.btn-add-cota');
  addCotaBtn.addEventListener('click', async () => {
    const newCotaStr = prompt('Nova cota (m):', '0.00');
    if (!newCotaStr) return;
    
    const newCota = parseFloat(newCotaStr);
    if (isNaN(newCota)) {
      alert('Cota inválida');
      return;
    }
    
    const cotas = floor.cotas_tosco || [floor.cota];
    const updatedCotas = [...cotas, newCota];
    await window.updateFloor(floor.id, { cotas_tosco: updatedCotas });
    
    // Re-render este piso
    if (window.currentBlocosProjectId) {
      await renderBlocos(window.currentBlocosProjectId);
    }
  });
  
  // Upload imagem
  const uploadInput = pisoItem.querySelector('.piso-image-upload');
  const imagePreview = pisoItem.querySelector('.piso-image-preview');
  
  uploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!window.uploadFloorImage) {
      alert('Função uploadFloorImage não disponível');
      return;
    }
    
    const result = await window.uploadFloorImage(
      floor.id, 
      window.currentBlocosProjectId, 
      file
    );
    
    if (!result.success) {
      alert(result.error || 'Erro ao fazer upload');
      return;
    }
    
    // Mostrar preview
    const url = await window.getFloorImageURL(floor.id);
    if (url) {
      imagePreview.innerHTML = `<img src="${url}" style="max-width: 200px; margin-top: 10px; border: 1px solid var(--line); border-radius: 4px;">`;
    }
  });
  
  // Se já tem imagem, mostra preview
  if (floor.image_path && window.getFloorImageURL) {
    window.getFloorImageURL(floor.id).then(url => {
      if (url) {
        imagePreview.innerHTML = `<img src="${url}" style="max-width: 200px; margin-top: 10px; border: 1px solid var(--line); border-radius: 4px;">`;
      }
    }).catch(err => {
      console.error('Erro carregar preview imagem:', err);
    });
  }
  
  parentElement.appendChild(pisoItem);
}

// ===== RENDER COTAS =====
function renderCotas(floor, cotasContainer) {
  const template = document.getElementById('template-cota-item');
  if (!template) {
    console.error('Template cota-item não encontrado');
    return;
  }
  
  cotasContainer.innerHTML = '';
  
  const cotas = floor.cotas_tosco || [floor.cota || 0];
  
  cotas.forEach((cotaValue, index) => {
    const cotaItem = template.content.cloneNode(true);
    
    const input = cotaItem.querySelector('.cota-value');
    input.value = cotaValue;
    
    // Label "Principal" na primeira
    const label = cotaItem.querySelector('.cota-label');
    if (index === 0) {
      label.textContent = '(Principal)';
      label.style.fontWeight = 'bold';
    }
    
    // Update on blur
    input.addEventListener('blur', async (e) => {
      const newValue = parseFloat(e.target.value);
      if (isNaN(newValue)) {
        e.target.value = cotaValue;
        return;
      }
      
      const updatedCotas = [...cotas];
      updatedCotas[index] = newValue;
      
      // Primeira cota também atualiza campo `cota` (principal)
      const updates = { cotas_tosco: updatedCotas };
      if (index === 0) {
        updates.cota = newValue;
      }
      
      await window.updateFloor(floor.id, updates);
    });
    
    // Delete cota (exceto primeira - sempre tem 1 mínimo)
    const deleteBtn = cotaItem.querySelector('.btn-delete-cota');
    if (index === 0 || cotas.length === 1) {
      deleteBtn.style.display = 'none'; // Não pode apagar principal ou única cota
    } else {
      deleteBtn.addEventListener('click', async () => {
        const updatedCotas = cotas.filter((_, i) => i !== index);
        await window.updateFloor(floor.id, { cotas_tosco: updatedCotas });
        
        // Re-render
        if (window.currentBlocosProjectId) {
          await renderBlocos(window.currentBlocosProjectId);
        }
      });
    }
    
    cotasContainer.appendChild(cotaItem);
  });
}

async function renderBlocos(projectId) {
  const container = document.getElementById('blocos-container');
  const addBlocoBtn = document.getElementById('btn-add-bloco');
  if (!container || !projectId || typeof window.listProjectBlocks !== 'function') {
    return;
  }

  window.currentBlocosProjectId = projectId;

  const listResult = await window.listProjectBlocks(projectId);
  if (!listResult.success) {
    container.innerHTML = '<div class="card">Erro ao carregar blocos.</div>';
    return;
  }

  const blocks = listResult.blocks || [];
  if (blocks.length === 0) {
    container.innerHTML = '<div class="card">Sem blocos ainda.</div>';
  } else {
    container.innerHTML = '';
  }

  for (const block of blocks) {
    const blockElement = document.createElement('div');
    blockElement.className = 'bloco-accordion';
    blockElement.dataset.blockId = block.id;
    blockElement.innerHTML = `
      <div class="bloco-header">
        <span class="bloco-name" contenteditable="true">${block.name || 'Novo Bloco'}</span>
        <button class="btn-sm btn-collapse" type="button">▼</button>
        <button class="btn-danger btn-delete-bloco" type="button">🗑️</button>
      </div>
      <div class="bloco-body">
        <textarea class="bloco-description" placeholder="Descrição...">${block.description || ''}</textarea>
        <label style="display:flex;gap:8px;align-items:center;margin-bottom:8px;font-size:12px;color:var(--muted)">
          <input class="bloco-override-toggle" type="checkbox" ${block.override_params ? 'checked' : ''} />
          Override Params Globais
        </label>
        <textarea class="bloco-override-json" placeholder='{"materiais":{"betao":{"fck":25}}}' style="display:${block.override_params ? 'block' : 'none'};margin-bottom:10px;">${block.override_params ? JSON.stringify(block.override_params, null, 2) : ''}</textarea>
        <div class="tipologias-accordion">
          ${createTipologiaHTML()}
        </div>
      </div>
    `;

    const nameEl = blockElement.querySelector('.bloco-name');
    const collapseBtn = blockElement.querySelector('.btn-collapse');
    const deleteBtn = blockElement.querySelector('.btn-delete-bloco');
    const bodyEl = blockElement.querySelector('.bloco-body');
    const descEl = blockElement.querySelector('.bloco-description');
    const overrideToggle = blockElement.querySelector('.bloco-override-toggle');
    const overrideJson = blockElement.querySelector('.bloco-override-json');

    nameEl.addEventListener('blur', async () => {
      const newName = nameEl.textContent.trim() || 'Novo Bloco';
      await window.updateBlock(block.id, { name: newName });
      nameEl.textContent = newName;
    });

    collapseBtn.addEventListener('click', () => {
      bodyEl.classList.toggle('open');
      collapseBtn.textContent = bodyEl.classList.contains('open') ? '▲' : '▼';
    });

    deleteBtn.addEventListener('click', async () => {
      const ok = confirm(`Apagar bloco "${block.name || 'Sem Nome'}" e respetivos pisos/zonas?`);
      if (!ok) return;
      const result = await window.deleteBlock(block.id);
      if (!result.success) {
        alert(result.error || 'Erro ao apagar bloco');
        return;
      }
      await renderBlocos(projectId);
    });

    descEl.addEventListener('change', async () => {
      await window.updateBlock(block.id, { description: descEl.value });
    });

    overrideToggle.addEventListener('change', async () => {
      const enabled = overrideToggle.checked;
      overrideJson.style.display = enabled ? 'block' : 'none';
      if (!enabled) {
        overrideJson.value = '';
        await window.updateBlock(block.id, { override_params: null });
      }
    });

    overrideJson.addEventListener('change', async () => {
      try {
        const parsed = overrideJson.value.trim() ? JSON.parse(overrideJson.value) : null;
        await window.updateBlock(block.id, { override_params: parsed });
      } catch (_error) {
        alert('JSON inválido em override params');
      }
    });

    blockElement.querySelectorAll('.btn-add-piso').forEach((addPisoBtn) => {
      addPisoBtn.addEventListener('click', async () => {
        const tipologia = addPisoBtn.dataset.tipo;
        const name = prompt('Nome do piso:', `Piso ${BLOCO_TIPOLOGIAS[tipologia] || tipologia}`) || 'Piso X';
        const cotaInput = prompt('Cota principal (m):', '0.00');
        const cota = parseFloat(cotaInput);

        if (isNaN(cota)) {
          alert('Cota inválida');
          return;
        }

        const createResult = await window.createFloor(block.id, projectId, {
          name,
          tipologia,
          cota: cota,
          cotas_tosco: [cota] // Array com cota principal
        });

        if (!createResult.success) {
          alert(createResult.error || 'Erro ao criar piso');
          return;
        }

        await renderBlocos(projectId);
      });
    });

    container.appendChild(blockElement);
    await fillPisosForBlock(blockElement, block.id);
  }

  if (addBlocoBtn) {
    addBlocoBtn.onclick = async () => {
      const name = prompt('Nome do bloco:', 'Novo Bloco') || 'Novo Bloco';
      const createResult = await window.createBlock(projectId, {
        name,
        block_type: 'building'
      });

      if (!createResult.success) {
        alert(createResult.error || 'Erro ao criar bloco');
        return;
      }

      await renderBlocos(projectId);
    };
  }
}

window.renderBlocos = renderBlocos;
