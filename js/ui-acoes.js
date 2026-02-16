async function populateBlockSelector(projectId) {
  const blockSelect = document.getElementById('sec7-select-bloco');
  const floorSelect = document.getElementById('sec7-select-piso');
  if (!blockSelect || !floorSelect || !projectId) return;

  const blocksResult = await window.listProjectBlocks(projectId);
  const blocks = blocksResult.success ? blocksResult.blocks : [];

  blockSelect.innerHTML = '<option value="">Seleccionar Bloco...</option>';
  blocks.forEach((block) => {
    const option = document.createElement('option');
    option.value = block.id;
    option.textContent = block.name || 'Bloco sem nome';
    blockSelect.appendChild(option);
  });

  floorSelect.innerHTML = '<option value="">Seleccionar Piso...</option>';
  floorSelect.disabled = true;
}

async function populateFloorSelector(blockId) {
  const floorSelect = document.getElementById('sec7-select-piso');
  if (!floorSelect) return;

  floorSelect.innerHTML = '<option value="">Seleccionar Piso...</option>';

  if (!blockId) {
    floorSelect.disabled = true;
    return;
  }

  const floorsResult = await window.listBlockFloors(blockId);
  const floors = floorsResult.success ? floorsResult.floors : [];

  floors.forEach((floor) => {
    const option = document.createElement('option');
    option.value = floor.id;
    const cota = Number.isFinite(Number(floor.cota)) ? Number(floor.cota) : 0;
    option.textContent = `${floor.name || 'Piso'} (Cota ${cota})`;
    floorSelect.appendChild(option);
  });

  floorSelect.disabled = false;
}

async function onSec7BlockChange() {
  const blockSelect = document.getElementById('sec7-select-bloco');
  const blockId = blockSelect ? blockSelect.value : '';
  await populateFloorSelector(blockId);

  if (window.floorViewer) {
    window.floorViewer.clear();
  }
}

async function onSec7FloorChange() {
  const floorSelect = document.getElementById('sec7-select-piso');
  const floorId = floorSelect ? floorSelect.value : '';

  if (!floorId) {
    if (window.floorViewer) {
      window.floorViewer.clear();
    }
    return;
  }

  if (typeof window.onZonamentoFloorChangeById === 'function') {
    await window.onZonamentoFloorChangeById(floorId);
  }
}

window.populateBlockSelector = populateBlockSelector;
window.populateFloorSelector = populateFloorSelector;
window.onSec7BlockChange = onSec7BlockChange;
window.onSec7FloorChange = onSec7FloorChange;
