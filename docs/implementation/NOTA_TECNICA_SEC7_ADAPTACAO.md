# NOTA TÉCNICA: Adaptação JavaScript Secção 7 v11.0 → v11.1

**Data**: 2026-02-16  
**Status**: Estrutura HTML completa ✅ | JavaScript requer adaptação ⚠️

---

## RESUMO

Estrutura HTML da Secção 7 v11.0 **foi copiada com sucesso** para `index_v11.1.html` com adição do selector de bloco no topo.

**Próximo passo crítico**: Adaptar JavaScript (~1200 linhas) de Firebase → Supabase

---

## FICHEIROS AFETADOS

### ✅ Completos
- `zonas.html` - Copiado de `zonas_v0.html` (editor canvas original)
- `index_v11.1.html` - Secção 7 HTML com estrutura híbrida (selector bloco + conteúdo v11.0)
- `migrations/2026-02-16-add-actions-data-to-floors.sql` - Script para adicionar campo `actions_data`

### ⚠️ Requer Ação
- **`js/sec7-viewer.js`** (novo) - Adaptar código JavaScript do `Index_v11.0.html`

---

## CÓDIGO JAVASCRIPT A ADAPTAR

### Localização no `Index_v11.0.html`

#### 1. **Funções de Toggle** (linhas 2268-2310)
```javascript
function toggleActionSection(name, enabled)
function toggleActionBody(name)  
function getUsoCategoryData(uso)
```

####2. **Gestão Zonamento** (linhas 3074-3245)
```javascript
let floorViewer = null
let currentZonamentoFloor = null

function initFloorViewer()
function populateZonamentoFloorSelector()
function onZonamentoFloorChange()
function openZonamentoEditor()
function setViewerMode(mode)
```

#### 3. **Classe FloorViewer** (linhas 3250-3900+)
```javascript
class FloorViewer {
  constructor(canvas)
  loadData(data)
  render()
  renderLajes(alpha)
  renderSobrecargas(alpha)
  renderRCP(alpha)
  renderCombinacoes()
  renderHeatmap()
  renderProbe()
  renderPreDimensionamento()
  renderPreDimPilares()
  // + helpers: drawPolygon, polygonArea, getCategoryLoad, etc
}
```

---

## ADAPTAÇÕES NECESSÁRIAS

### A. Selector de Bloco (NOVO v11.1)

**Adicionar no topo do ficheiro JS**:

```javascript
// ===== v11.1: BLOCO SELECTOR =====
let currentBlockId = null;

async function initSec7BlocoSelector() {
  const projectId = getActiveProjectId();
  if (!projectId) return;
  
  const { data: blocks } = await window.supabaseClient
    .from('blocks')
    .select('id, name')
    .eq('project_id', projectId)
    .order('created_at');
  
  const select = document.getElementById('sec7-bloco-principal');
  select.innerHTML = '<option value="">-- Escolher bloco --</option>';
  
  (blocks || []).forEach(block => {
    const option = document.createElement('option');
    option.value = block.id;
    option.textContent = block.name;
    select.appendChild(option);
  });
  
  select.addEventListener('change', async (e) => {
    currentBlockId = e.target.value;
    const conteudo = document.getElementById('sec7-conteudo-v11');
    
    if (!currentBlockId) {
      conteudo.style.display = 'none';
      return;
    }
    
    conteudo.style.display = 'block';
    
    // CRÍTICO: Recarregar selectores de pisos filtrados por bloco
    await populateZonamentoFloorSelector();
  });
}
```

---

### B. Populate Floor Selector (Adaptação Firebase → Supabase)

**ANTES (Firebase)**:
```javascript
function populateZonamentoFloorSelector() {
  const select = document.getElementById('zonamentoFloorSelect');
  select.innerHTML = '<option value="">-- Selecione um piso --</option>';
  projectData.floors.forEach(floor => {
    const option = document.createElement('option');
    option.value = floor.id;
    option.textContent = `${floor.name} (Cota: ${floor.cota}m)`;
    select.appendChild(option);
  });
}
```

**DEPOIS (Supabase + filtro por bloco)**:
```javascript
async function populateZonamentoFloorSelector() {
  const select = document.getElementById('zonamentoFloorSelect');
  if (!select) return;
  
  select.innerHTML = '<option value="">-- Selecione um piso --</option>';
  
  if (!currentBlockId) {
    select.disabled = true;
    return;
  }
  
  // Query Supabase filtrado por bloco
  const { data: floors, error } = await window.supabaseClient
    .from('floors')
    .select('id, name, cota, actions_data')
    .eq('block_id', currentBlockId)
    .order('cota');
  
  if (error) {
    console.error('Erro carregar pisos:', error);
    return;
  }
  
  (floors || []).forEach(floor => {
    const zoneCount = floor.actions_data?.layers ? Object.keys(floor.actions_data.layers).length : 0;
    const option = document.createElement('option');
    option.value = floor.id;
    option.textContent = `${floor.name} (Cota: ${floor.cota}m, ${zoneCount} zonas)`;
    select.appendChild(option);
  });
  
  select.disabled = false;
}
```

---

### C. Load Floor Data (Adaptação Firebase → Supabase)

**ANTES (Firebase)**:
```javascript
function onZonamentoFloorChange() {
  const floorId = select.value;
  const floor = findPisoById(floorId); // Helper busca em projectData.floors
  if (floor && floor.actionsData) {
    floorViewer.loadData(floor.actionsData);
  }
}
```

**DEPOIS (Supabase)**:
```javascript
async function onZonamentoFloorChange() {
  const select = document.getElementById('zonamentoFloorSelect');
  const floorId = select.value;
  
  if (!floorId) {
    currentZonamentoFloor = null;
    if (floorViewer) floorViewer.clear();
    return;
  }
  
  // Query Supabase
  const { data: floor, error } = await window.supabaseClient
    .from('floors')
    .select('*')
    .eq('id', floorId)
    .single();
  
  if (error || !floor) {
    console.error('Erro carregar floor:', error);
    return;
  }
  
  currentZonamentoFloor = floor;
  
  if (floorViewer && floor.actions_data) {
    floorViewer.loadData(floor.actions_data);
    floorViewer.render();
  } else if (floorViewer) {
    floorViewer.clear();
  }
}
```

---

### D. Open Zonamento Editor (Adaptação)

**ANTES (Firebase)**:
```javascript
function openZonamentoEditor() {
  const floorId = select.value;
  const floor = findPisoById(floorId);
  sessionStorage.setItem(`zonas_input_${floorId}`, JSON.stringify(floor.actionsData));
  window.open('zonas.html?piso=' + floorId, '_blank', 'width=1400,height=900');
}
```

**DEPOIS (Supabase - passar floor ID via URL)**:
```javascript
function openZonamentoEditor() {
  const select = document.getElementById('zonamentoFloorSelect');
  const floorId = select.value;
  
  if (!floorId) {
    alert('Selecione um piso primeiro.');
    return;
  }
  
  // NOTA: zonas.html v0 carrega dados via URL param + Supabase diretamente
  window.open(`zonas.html?floor=${floorId}`, '_blank', 'width=1400,height=900');
}
```

---

### E. Message Listener (Guardar dados de zonas.html)

**Adicionar listener para receber dados do editor**:

```javascript
window.addEventListener('message', async (event) => {
  if (event.data.type === 'zonesData') {
    const { floorId, actionsData } = event.data;
    
    // Guardar no Supabase
    const { error } = await window.supabaseClient
      .from('floors')
      .update({ actions_data: actionsData })
      .eq('id', floorId);
    
    if (error) {
      console.error('Erro guardar zonamento:', error);
      alert('⚠️ Erro ao guardar. Tente novamente.');
    } else {
      console.log('✅ Zonamento guardado com sucesso');
      
      // Refresh viewer
      if (currentZonamentoFloor && currentZonamentoFloor.id === floorId) {
        currentZonamentoFloor.actions_data = actionsData;
        if (floorViewer) {
          floorViewer.loadData(actionsData);
          floorViewer.render();
        }
      }
    }
  }
});
```

---

### F. Init Function (DOMContentLoaded)

**Adicionar no final do ficheiro**:

```javascript
// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  initSec7BlocoSelector(); // v11.1 novo
  initFloorViewer();
  
  // Listeners para checkboxes ações
  document.querySelectorAll('[id^="act_"]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const name = e.target.id.replace('act_', '');
      toggleActionSection(name, e.target.checked);
    });
  });
});
```

---

## FICHEIRO FINAL ESPERADO

### Estrutura de `js/sec7-viewer.js`

```
// ===== CONFIG =====
let currentBlockId = null
let floorViewer = null
let currentZonamentoFloor = null

// ===== FUNÇÕES PRINCIPAIS =====
initSec7BlocoSelector()
populateZonamentoFloorSelector()
onZonamentoFloorChange()
openZonamentoEditor()
setViewerMode(mode)
toggleActionSection(name, enabled)
toggleActionBody(name)

// ===== CLASSE VIEWER =====
class FloorViewer {
  // (copiar inteiro de v11.0, não requer alterações se usar actions_data)
}

// ===== HELPERS =====
getUsoCategoryData(uso)
generateSeismicCharts()

// ===== INIT =====
window.addEventListener('DOMContentLoaded', ...)
window.addEventListener('message', ...)
```

---

## IMPORTS NO INDEX_V11.1.HTML

**Adicionar antes de `</body>`**:

```html
<!-- Secção 7: Ações e Zonamento -->
<script src="js/sec7-viewer.js"></script>
```

---

## VALIDAÇÃO FINAL

### Checklist Funcionalidades

1. **Selector Bloco** ✅
   - [ ] Populate com blocos do projeto
   - [ ] Mostrar conteúdo após seleção
   
2. **Selector Piso** ✅
   - [ ] Populate com pisos do bloco selecionado
   - [ ] Load actions_data do piso
   
3. **Editor Zonamento** ✅
   - [ ] Abrir zonas.html em popup
   - [ ] Canvas mostra imagem do floor
   - [ ] Guardar polygons no Supabase
   
4. **Viewer Canvas** ✅
   - [ ] Tabs funcionais (Limpa, Lajes, Sobrecargas, etc)
   - [ ] Render layers corretamente
   - [ ] Modo Sonda, Heatmap, Pré-Dim
   
5. **Toggles Ações** ✅
   - [ ] Checkboxes mostram/escondem secções
   - [ ] Gráficos sísmicos (se aplicável)

---

## PRÓXIMOS PASSOS

1. **Criar `js/sec7-viewer.js`** com código adaptado
2. **Testar incrementalmente**:
   - Selector bloco → ok?
   - Selector piso → ok?
   - Botão editar → popup abre?
   - Guardar → persiste em Supabase?
3. **Validar FloorViewer** render com `actions_data` formato correto
4. **Commit final**

---

## NOTAS ADICIONAIS

- **zonas.html** (v0) usa comunicação via `window.opener` + `sessionStorage`. Pode ser adaptado para usar postMessage consistentemente.
- **Campo `actions_data`** deve ter estrutura:
  ```json
  {
    "blueprint": { "image": "data:image/png;base64,..." },
    "layers": {
      "Estrutura": [...],
      "Sobrecargas": [...],
      "RCP": [...]
    }
  }
  ```

- **FloorViewer** não requer adaptação se `actions_data` mantiver estrutura original

---

**Autor**: GitHub Copilot  
**Branch**: `feature/v11.1-supabase-migration`  
**Commit**: Pendente após criação de `js/sec7-viewer.js`
