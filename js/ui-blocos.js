const BLOCO_TIPOLOGIAS = ['Fundações', 'Enterrados', 'Elevação', 'Cobertura'];

function createTipologiaHTML() {
  return BLOCO_TIPOLOGIAS.map((tipo) => `
    <div class="tipologia" data-tipo="${tipo}">
      <h4>${tipo}</h4>
      <div class="pisos-list"></div>
      <button class="btn-sm btn-add-piso" data-tipo="${tipo}" type="button">+ Piso</button>
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
      pisosList.innerHTML = '<div class="piso-item" style="opacity:.7">Sem pisos</div>';
      return;
    }

    pisosList.innerHTML = pisos.map((floor) => {
      const cota = Number.isFinite(Number(floor.cota)) ? Number(floor.cota) : 0;
      return `<div class="piso-item">${floor.name || 'Piso'} (Cota ${cota})</div>`;
    }).join('');
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

    blockElement.querySelectorAll('.btn-add-piso').forEach((addPisoBtn) => {
      addPisoBtn.addEventListener('click', async () => {
        const tipologia = addPisoBtn.dataset.tipo;
        const name = prompt('Nome do piso:', 'Piso X') || 'Piso X';
        const cotaInput = prompt('Cota do piso:', '0');
        const cota = Number(cotaInput);

        const createResult = await window.createFloor(block.id, projectId, {
          name,
          tipologia,
          cota: Number.isFinite(cota) ? cota : 0
        });

        if (!createResult.success) {
          alert(createResult.error || 'Erro ao criar piso');
          return;
        }

        await fillPisosForBlock(blockElement, block.id);
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
