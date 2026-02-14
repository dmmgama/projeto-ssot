# SSOT JSJ Template - Especificação Técnica v11.0

**Versão:** 11.0  
**Data:** Fevereiro 2026  
**Tipo:** Aplicação Web Cloud-Native (Firebase)  
**Objetivo:** Sistema unificado de gestão de projetos de engenharia estrutural

---

## 1. VISÃO GERAL

### 1.1 Arquitetura
- **Tipo**: Multi-Page Application (login.html → lobby.html → index.html)
- **Estado**: Firestore (persistência cloud real-time)
- **Auth**: Firebase Authentication (@jsj.pt whitelist obrigatório)
- **Navegação**: login.html → lobby.html (lista) → index.html?project=<uuid> (editor)
- **UI Lobby**: Grid de projetos com CRUD
- **UI Editor**: 8 secções (inalteradas vs v9.1)

### 1.2 Componentes Principais
```
Index_v11.0.html (3900+ linhas)
├── CSS (linhas 9-1220): Sistema de design dark theme
├── HTML (linhas 1221-2062): Estrutura das 8 secções
└── JavaScript (linhas 2063+): Lógica + Motor Gráfico + Firebase integration

firebase-config.js (~150 linhas)
├── Firebase SDK v10.7.1 imports
├── Config + initialization
└── Auth whitelist (@jsj.pt)

firebase-data.js (~500 linhas)
├── Firestore CRUD operations
├── Map/Array serialization
├── Nested arrays sanitization
└── Real-time subscriptions

login.html (~200 linhas)
└── Firebase Auth UI (Google Sign-In)

lobby.html (~400 linhas)
├── Auth guard
├── Projects grid (Firestore-backed)
└── CRUD operations
```

### 1.3 Fluxo de Dados (SSOT Principle)
```
User Input (DOM) → updateKPIs() → projectData (Global State)
                                       ↓
                        Auto-save (30s) → Firestore
                                       ↓
                            Real-time sync → onSnapshot
                                       ↓
                            Focus-aware update → loadAllData()
```

**REGRA CRÍTICA**: Nunca ler do DOM para cálculos. Sempre usar `projectData`.

### 1.4 Fluxo Multi-Projeto
```
User → login.html (Firebase Auth @jsj.pt)
    ↓
lobby.html (Firestore query: owner = user.uid)
    ↓
Clicar "Novo Projeto"
    ↓
index.html?project=new (cria Firestore doc + UUID)
    ↓
Preencher Secções 1-8
    ↓
Auto-save 30s → Firestore
    ↓
"🏠 Voltar ao Lobby"
    ↓
lobby.html (projeto aparece no grid)
    ↓
Clicar "Abrir"
    ↓
index.html?project=<uuid> (subscribe real-time)
```

**Firestore Schema** (v11.0):
```
projects (collection)
├── <projectId> (document)
    ├── owner: "user@jsj.pt"
    ├── id_jsj: "2026-001"
    ├── nome_projeto: "Edifício A"
    ├── floors: [...]  // Serialized from Map
    ├── geoHorizons: [...]
    └── updatedAt: timestamp
```

---

## 2. MODELO DE DADOS (Schema Completo)

### 2.1 Estrutura Global `projectData`

**NOTA v11.0**: 
- Runtime: `floors/zones/geoHorizons` são Maps (UUID keys)
- Firestore: Serialized como Arrays
- Conversão automática em `firebase-data.js`

```javascript
let projectData = {
  floors: [
    {
      id: 1234567890,              // Timestamp único (number)
      name: "Piso 0",              // string
      cota: 0.00,                  // float (m)
      area: 150.00,                // float (m²)
      imageData: "",               // Base64 string (PNG/JPG) - planta do piso
      zones: [
        {
          id: 9876543210,          // Timestamp único (number)
          name: "Zona A",          // string
          area: 50.00,             // float (m²)
          cotaLimpo: 0.00,         // float (m)
          acabamento: 50,          // int (mm)
          uso: "B",                // string - Categoria EC1 (A-H)
          tipoLaje: "Maciça",      // string - Tipo estrutural
          espessura: 0.25,         // float (m)
          vaoMax: 6.0,             // float (m)
          permanentes: [],         // Array<{nome: string, valor: float, tipo: string}>
          walls: []                // Array<{comprimento: float, espessura: float, altura: float, gamma: float}>
        }
      ],
      actionsData: {               // 🔥 CRÍTICO - Do zonas.html (editor gráfico)
        blueprint: {
          scale: 1.0,              // Escala m/px
          imageData: ""            // Base64 (duplicado por sync)
        },
        layers: {
          "Estrutura": [           // Layer de lajes
            {
              id: 123,
              design: "L1",
              uso: "B",
              manualLoad: "0.25",  // Espessura em m (string!)
              shapes: "[[[{\"x\":100,\"y\":200}]]]"  // 🔥 v11.0: JSON string (nested arrays)
            }
          ],
          "Sobrecargas": [         // Layer de sobrecargas
            {
              id: 124,
              uso: "B",            // Categoria EC1
              shapes: "[[[...]]]"  // JSON string
            }
          ],
          "Paredes_RP": [          // Layer de RCP (Revestimentos/Paredes)
            {
              id: 125,
              manualLoad: "1.5",   // kN/m² (string!)
              shapes: "[[[...]]]"  // JSON string
            }
          ]
        }
      }
    }
  ],
  geoHorizons: [
    {
      horizonte: "H1",             // string
      nspt: 10,                    // int
      gamma: 18.0,                 // float (kN/m³)
      c: 5,                        // float (kPa)
      phi: 30,                     // float (graus)
      e: 50,                       // float (MPa)
      sigma: 200,                  // float (kPa)
      escav: "Fácil"               // string
    }
  ]
};
```

### 2.2 Validações e Restrições

#### IDs Únicos
- **Método**: `Date.now()` (timestamp em ms)
- **Colisão**: Improvável (user não clica 2x no mesmo ms)
- **Validação**: Nenhuma (assumes unicidade)

#### Tipos de Dados
```javascript
// Conversões críticas
parseFloat(input.value) || 0     // Números com fallback 0
parseInt(input.value, 10) || 0   // Inteiros
input.value.trim() || ""         // Strings
```

#### Categorias EC1 (Uso)
```javascript
// Valores válidos para zone.uso
const VALID_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F', 'H'];
// A: 2.0 kN/m² (Habitação)
// B: 3.0 kN/m² (Escritórios)
// C: 4.0 kN/m² (Escolas/Restaurantes)
// D: 5.0 kN/m² (Comércio)
// E: 7.5 kN/m² (Armazém)
// F: 2.5 kN/m² (Garagem)
// H: 0.4 kN/m² (Cobertura)
```

#### Tipos de Laje
```javascript
const SLAB_TYPES = ['Maciça', 'Fungiforme', 'Aligeirada', 'Vigada', 'Pré-laje'];
```

---

## 3. SECÇÕES FUNCIONAIS (Níveis 1-8)

### Secção 1: Identificação do Projeto

**IDs HTML Críticos** (23 campos):
```
id_jsj, nome_projeto, cliente, designacao, localizacao,
tipologia, especialidade, tipo_obra, tipo_obra_custom, fase_atual,
fase_ep_data, fase_ep_estado, fase_lic_data, fase_lic_estado,
fase_exec_data, fase_exec_estado, fase_at_data, fase_at_estado,
resp_tecnico, equipa_eng, bim, gestao_projeto, fiscalizacao
```

**Outputs** (KPIs):
- `kpiID`, `kpiNome`, `kpiFase` (read-only displays)
- `kpiImplant`, `kpiABC`, `kpiPisos`, `kpiAltura` (calculados)

**Função de Actualização**:
```javascript
function updateKPIs() {
  document.getElementById('kpiID').textContent = 
    document.getElementById('id_jsj').value || '---';
  // ... (idem para nome, fase)
  
  // Cálculo de KPIs geométricos
  let totalImplant = 0, totalABC = 0, maxCota = 0, minCota = 0;
  projectData.floors.forEach(f => {
    totalImplant = Math.max(totalImplant, f.area || 0);
    totalABC += f.area || 0;
    maxCota = Math.max(maxCota, f.cota || 0);
    minCota = Math.min(minCota, f.cota || 0);
  });
  
  document.getElementById('kpiImplant').textContent = totalImplant.toFixed(0);
  document.getElementById('kpiABC').textContent = totalABC.toFixed(0);
  document.getElementById('kpiPisos').textContent = projectData.floors.length;
  document.getElementById('kpiAltura').textContent = (maxCota - minCota).toFixed(1);
}
```

---

### Secção 2: Caracterização Geral da Obra

**Estrutura Dinâmica**:
- Lista de pisos (renderizada por `renderFloors()`)
- Cada piso contém zonas (expandível)
- Modal para criar/editar zonas

**IDs Dinâmicos** (gerados por JS):
```javascript
// Padrão: {tipo}_{id do piso/zona}
floor_name_1234567890
floor_cota_1234567890
floor_area_1234567890
zone_name_9876543210
zone_uso_9876543210
zone_tipoLaje_9876543210
// ... etc
```

**Funções Críticas**:
```javascript
addFloor()                    // Adiciona piso ao array + renderiza
deleteFloor(floorId)          // Remove piso (valida se tem zonas)
renderFloors()                // Renderiza lista completa de pisos
toggleFloorZones(floorId)     // Expande/colapsa zonas

openAddZoneModal(floorId)     // Modal para criar zona
openEditZoneModal(floorId, zoneId)
saveZone()                    // Salva zona (create ou update)
deleteZone(floorId, zoneId)
```

**Cálculo de Espessura Equivalente**:
```javascript
function calculateEquivThickness(tipo, h) {
  const coefs = {
    'Maciça': 1.0,
    'Fungiforme': 0.85,
    'Aligeirada': 0.60,
    'Vigada': 0.50,
    'Pré-laje': 1.0
  };
  return h * (coefs[tipo] || 1.0);
}
```

---

### Secção 3: Elementos Base

**IDs HTML** (10 campos):
```
arq, mep, escav, geotec, hidro, prosp, carac, insp, ensaios, orig
```

**Tipo**: Textarea (histórico de documentos)

---

### Secção 4: Condicionantes

#### 4.1 Condições Arquitectónicas
```
cond_arq  // Textarea
```

#### 4.2 Condicionantes Geotécnicas
```
geo_form            // Formações geológicas
geo_horiz           // Horizontes
geo_sub             // Profundidade substrato
geo_nat             // Natureza dos solos
geo_tipo_sismo      // 🔥 CRÍTICO - Tipo solo EC8 (sync com sismo_terreno)
geo_sigma_adm       // Tensão admissível
```

**Tabela Dinâmica** (`geoHorizons`):
- Renderizada por `renderGeoTable()`
- Adicionada por `addGeoRow()`
- Campos: horizonte, nspt, gamma, c, phi, e, sigma, escav

#### 4.3 Condições Hidrogeológicas
```
hidro_nf            // Nível freático
hidro_col           // Coluna de água
hidro_xa            // Agressividade (XA)
hidro_obs           // Observações
```

---

### Secção 5: Solução Estrutural

```
sol_desc            // Textarea - Descrição da solução
```

---

### Secção 6: Ações (Motor de Cálculo)

#### 6.1 Seleção de Ações (Checkboxes)
```javascript
const actionsEnabled = {
  act_graviticas: true,     // Sempre true (hardcoded)
  act_sismo: false,
  act_vento: false,
  act_impulsos: false,
  act_retracao: false,
  act_temperatura: false,
  act_neve: false,
  act_agua: false
};
```

**Função de Toggle**:
```javascript
function toggleActionSection(name, enabled) {
  const section = document.querySelector(`[data-action="${name}"]`);
  section.style.display = enabled ? 'block' : 'none';
  
  if (name === 'sismo' && enabled) {
    generateSeismicCharts(); // Gera espectros EC8
  }
}
```

#### 6.2 Parâmetros por Ação

**A) Ação Sísmica (EC8)**
```
sismo_zona          // Zona sísmica (1.1 a 2.5)
sismo_terreno       // 🔥 AUTO-SYNC com geo_tipo_sismo
sismo_imp           // Coeficiente importância
sismo_q             // Coeficiente comportamento
sismo_amort         // Amortecimento (%)
```

**Gráficos**:
```javascript
function generateSeismicCharts() {
  const zona = parseFloat(document.getElementById('sismo_zona').value);
  const terreno = document.getElementById('sismo_terreno').value;
  const q = parseFloat(document.getElementById('sismo_q').value) || 1.5;
  const amort = parseFloat(document.getElementById('sismo_amort').value) || 5;
  
  // Gera espectros Tipo 1 e Tipo 2 usando Chart.js
  generateSeismicChart('seismicChart1', zona, terreno, q, amort, 1);
  generateSeismicChart('seismicChart2', zona, terreno, q, amort, 2);
}
```

**B) Ação do Vento (EC1-1-4)**
```
vento_zona, vento_vb0, vento_cat, vento_z0, vento_co, vento_cpi
```

**C) Impulsos de Terras**
```
impulsos_h, impulsos_gamma, impulsos_phi, impulsos_c, impulsos_k0, impulsos_q
```

**D) Retração/Fluência**
```
retracao_hr, retracao_t0, retracao_cimento, retracao_cura
```

**E) Temperatura**
```
temp_contracao, temp_expansao, temp_alfa, temp_tref
```

**F) Neve (EC1-1-3)**
```
neve_zona, neve_alt, neve_sk, neve_ce, neve_ct, neve_mu
```

**G) Água**
```
agua_nivel, agua_gamma, agua_sub, agua_dren
```

---

### Secção 7: Zonamento (Motor Gráfico)

**Arquitectura**:
- **Selector de Piso**: Dropdown dinâmico
- **Viewer 2D**: Canvas com classe `FloorViewer`
- **Modos de Visualização**: Estrutura, Sobrecargas, RCP, Combinações, Sonda

**Classe FloorViewer** (linhas 3253-3791):

```javascript
class FloorViewer {
  constructor(canvasId, floorData) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.data = floorData.actionsData || { layers: {} };
    this.mode = 'Estrutura';
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1.0;
    this.isDragging = false;
    
    this.setupCanvas();
    this.setupInteractions();
    this.render();
  }
  
  // Métodos principais
  render()                           // Renderiza canvas completo
  drawShapes()                       // Desenha polígonos das layers
  calculatePointELU(point)           // 🔥 CRÍTICO - Calcula carga num ponto
  displayZoneCombinations(info)      // Mostra combinações ELU/ELS
  renderLoadTable(type)              // Tabela de sobrecargas/RCP
  
  // Métodos auxiliares
  pointInPolygon(point, polygon)     // Ray-casting algorithm
  polygonArea(points)                // Cálculo de área (m²)
  getCategoryLoad(category)          // Tabela EC1 (qk por categoria)
}
```

**Cálculo de Cargas** (linha 3580-3640):
```javascript
displayZoneCombinations(info) {
  const { worldPoint } = info;
  let G = 0, Q = 0, details = [];
  let maxThicknessFound = 0;  // 🔥 v6 logic: Max-Thickness Rule
  
  // Para cada layer
  for (let layerName in this.data.layers) {
    const zones = this.data.layers[layerName];
    zones.forEach(zone => {
      // 🔥 v11.0: Parse shapes JSON string
      const shapes = JSON.parse(zone.shapes || '[]');
      
      if (shapes.length && this.pointInPolygon(worldPoint, shapes[0])) {
        
        // Lajes: apenas a MAIS ESPESSA conta
        if (layerName === 'Estrutura') {
          const h = parseFloat(zone.manualLoad) || 0;
          if (h > maxThicknessFound) {
            maxThicknessFound = h;
            G = (h * 25) + 1.5;  // γ=25 kN/m³ + Revestimentos 1.5 kN/m²
          }
        }
        
        // Sobrecargas: usa tabela EC1
        else if (layerName === 'Sobrecargas') {
          Q = this.getCategoryLoad(zone.uso || 'B');
        }
        
        // RCP: acumula
        else if (layerName.includes('Paredes') || layerName.includes('RCP')) {
          G += parseFloat(zone.manualLoad) || 0;
        }
      }
    });
  }
  
  // Combinações EC0
  const combinations = [
    { name: 'ELU Fund. 1', value: 1.35*G + 1.50*Q, formula: '1.35G + 1.50Q' },
    { name: 'ELU Fund. 2', value: 1.35*G + 1.50*0.7*Q, formula: '1.35G + 1.50ψ₀Q' },
    { name: 'SLS Caract.', value: G + Q, formula: 'G + Q' },
    { name: 'SLS Freq.', value: G + 0.5*Q, formula: 'G + ψ₁Q' },
    { name: 'SLS Q-perm.', value: G + 0.3*Q, formula: 'G + ψ₂Q' }
  ];
  
  // Display na UI
  document.getElementById('zonamentoInfoPanel').innerHTML = /* ... */;
}
```

**Tabela EC1** (linha 3778-3790):
```javascript
getCategoryLoad(category) {
  const loads = {
    'A': 2.0,   // Habitação
    'B': 3.0,   // Escritórios
    'C': 4.0,   // Escolas/Restaurantes
    'D': 5.0,   // Comércio
    'E': 7.5,   // Armazém
    'F': 2.5,   // Garagem
    'H': 0.4    // Cobertura
  };
  return loads[category.substring(0,1).toUpperCase()] || 3.0;
}
```

---

### Secção 8: Critérios e Relatórios

```
crit_reg            // Regulamentação (textarea)
crit_dim            // Critérios dimensionamento (textarea)
```

**Exportação**:
```javascript
function exportJSON() {
  const data = collectAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], 
    { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `projeto_${data.id_jsj || 'sem_id'}_${Date.now()}.json`;
  a.click();
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      loadAllData(data);
      alert('Dados importados com sucesso!');
    } catch (err) {
      alert('Erro ao importar: ' + err.message);
    }
  };
  reader.readAsText(file);
}
```

---

## 4. API INTERNA (Funções Públicas)

### 4.1 Estado e Persistência

#### `collectAllData()`
**Assinatura**: `() => Object`  
**Retorna**: JSON com todos os dados do formulário  
**Uso**: Chamada antes de exportar ou salvar

```javascript
function collectAllData() {
  const data = {
    // Secção 1: IDs fixos
    id_jsj: document.getElementById('id_jsj')?.value || '',
    nome_projeto: document.getElementById('nome_projeto')?.value || '',
    // ... (todos os 168 IDs catalogados)
    
    // Secção 2: Estrutura dinâmica
    projectData: projectData
  };
  return data;
}
```

#### `loadAllData(data)`
**Assinatura**: `(data: Object) => void`  
**Efeito**: Repopula DOM e `projectData`  
**Validações**: Nenhuma (assumes JSON válido)

```javascript
function loadAllData(data) {
  // 1. Preenche inputs fixos
  for (const key in data) {
    if (key !== 'projectData') {
      const el = document.getElementById(key);
      if (el) el.value = data[key] || '';
    }
  }
  
  // 2. Restaura projectData
  if (data.projectData) {
    projectData = data.projectData;
  }
  
  // 3. Re-renderiza UI dinâmica
  renderFloors();
  renderGeoTable();
  updateKPIs();
  updateActionsFloorTabs();
}
```

---

### 4.2 Pisos e Zonas

#### `addFloor()`
**Assinatura**: `() => void`  
**Efeito**: Adiciona piso vazio ao `projectData.floors` e renderiza

```javascript
function addFloor() {
  const floor = {
    id: Date.now(),
    name: `Piso ${projectData.floors.length}`,
    cota: 0.00,
    area: 0.00,
    imageData: '',
    zones: [],
    actionsData: { layers: {} }
  };
  projectData.floors.push(floor);
  renderFloors();
  updateKPIs();
}
```

#### `deleteFloor(floorId)`
**Assinatura**: `(floorId: number) => void`  
**Validação**: Confirma se piso tem zonas

```javascript
function deleteFloor(floorId) {
  const floor = projectData.floors.find(f => f.id === floorId);
  if (!floor) return;
  
  if (floor.zones.length > 0) {
    if (!confirm(`Piso "${floor.name}" tem ${floor.zones.length} zona(s). Apagar mesmo assim?`)) {
      return;
    }
  }
  
  projectData.floors = projectData.floors.filter(f => f.id !== floorId);
  renderFloors();
  updateKPIs();
  updateActionsFloorTabs();
}
```

#### `saveZone()`
**Assinatura**: `() => void`  
**Contexto**: Lê dados do modal `#zoneModal`  
**Efeito**: Cria ou atualiza zona no piso ativo

```javascript
function saveZone() {
  const floorId = parseInt(document.getElementById('zoneFloorId').value);
  const zoneId = parseInt(document.getElementById('zoneId').value);
  const floor = projectData.floors.find(f => f.id === floorId);
  if (!floor) return;
  
  const zoneData = {
    id: zoneId || Date.now(),
    name: document.getElementById('zoneName').value,
    area: parseFloat(document.getElementById('zoneArea').value) || 0,
    // ... (restantes campos)
  };
  
  if (zoneId) {
    // Update
    const idx = floor.zones.findIndex(z => z.id === zoneId);
    if (idx !== -1) floor.zones[idx] = zoneData;
  } else {
    // Create
    floor.zones.push(zoneData);
  }
  
  renderFloors();
  closeZoneModal();
}
```

---

### 4.3 Motor Gráfico

#### `initFloorViewer()`
**Assinatura**: `() => void`  
**Efeito**: Instancia `FloorViewer` para o piso selecionado

```javascript
function initFloorViewer() {
  const selector = document.getElementById('zonamentoFloorSelector');
  if (!selector || !selector.value) return;
  
  const floorId = parseInt(selector.value);
  const floor = projectData.floors.find(f => f.id === floorId);
  if (!floor) return;
  
  // Destroi viewer anterior se existir
  if (window.currentFloorViewer) {
    window.currentFloorViewer = null;
  }
  
  window.currentFloorViewer = new FloorViewer('zonamentoCanvas', floor);
}
```

#### `openZonesEditor(floorId)`
**Assinatura**: `(floorId: number) => void`  
**Efeito**: Abre `zonas.html` em popup e envia dados via `postMessage`

```javascript
function openZonesEditor(floorId) {
  const floor = projectData.floors.find(f => f.id === floorId);
  if (!floor) return;
  
  // Abre popup
  const popup = window.open('zonas.html', '_blank', 
    'width=1400,height=900,resizable=yes');
  
  // Aguarda carga e envia dados
  popup.addEventListener('load', () => {
    popup.postMessage({
      type: 'initEditor',
      data: floor.actionsData || { layers: {} },
      floorId: floorId
    }, '*');
  });
  
  // Listener para receber dados de volta
  window.addEventListener('message', (event) => {
    if (event.data.type === 'zonesData') {
      floor.actionsData = event.data.data;
      saveCurrentProject();  // 🔥 v11.0: Persist to Firestore
      initFloorViewer();  // Atualiza viewer
    }
  });
}
```

---

## 5. FIREBASE BACKEND (v11.0+)

### 5.1 Arquitetura
- **Auth**: Firebase Authentication (whitelist @jsj.pt)
- **Database**: Cloud Firestore (projects collection)
- **Real-time**: onSnapshot listeners
- **Files**: firebase-config.js, firebase-data.js, login.html

### 5.2 Data Flow
```
User → Firebase Auth → Firestore CRUD → Real-time Sync
                           ↓
                Auto-save (30s interval)
```

### 5.3 Security
- Rules: Owner-only access (isOwner() + isJSJEmail())
- Auth required for all operations
- Email whitelist enforced at login

### 5.4 Serialization

#### Maps to Arrays (Runtime → Firestore)
```javascript
// firebase-data.js
function serializeFloorsMap(floorsMapOrArray) {
  const floorsArray = Array.isArray(floorsMapOrArray) 
    ? floorsMapOrArray 
    : Array.from(floorsMapOrArray.values());
  
  return floorsArray.map(floor => {
    const result = { ...floor };
    
    // Serialize zones Map → Array
    if (floor.zones instanceof Map) {
      result.zones = Array.from(floor.zones.values());
    }
    
    // 🔥 CRITICAL: Sanitize nested arrays in actionsData
    if (floor.actionsData) {
      result.actionsData = sanitizeNestedArrays(floor.actionsData);
    }
    
    return result;
  });
}
```

#### Nested Arrays Sanitization
```javascript
// firebase-data.js
function sanitizeNestedArrays(value) {
  if (Array.isArray(value)) {
    // Check if array contains arrays → stringify
    if (value.some(item => Array.isArray(item))) {
      return JSON.stringify(value);
    }
    return value.map(item => sanitizeNestedArrays(item));
  }
  
  if (value && typeof value === 'object') {
    const sanitized = {};
    for (const key in value) {
      sanitized[key] = sanitizeNestedArrays(value[key]);
    }
    return sanitized;
  }
  
  return value;
}
```

#### Arrays to Maps (Firestore → Runtime)
```javascript
// firebase-data.js
function deserializeFloorsArray(floorsArray) {
  return floorsArray.map(floor => {
    const result = { ...floor };
    
    // Deserialize zones Array → Map
    if (Array.isArray(floor.zones)) {
      result.zones = new Map(floor.zones.map(z => [z.id, z]));
    }
    
    // 🔥 CRITICAL: Parse nested array strings
    if (floor.actionsData) {
      result.actionsData = deserializeNestedStrings(floor.actionsData);
    }
    
    return result;
  });
}

function deserializeNestedStrings(value) {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.map(item => deserializeNestedStrings(item));
  }
  
  if (value && typeof value === 'object') {
    const deserialized = {};
    for (const key in value) {
      deserialized[key] = deserializeNestedStrings(value[key]);
    }
    return deserialized;
  }
  
  return value;
}
```

### 5.5 CRUD Operations

#### Create Project
```javascript
// firebase-data.js
async function createProjectInFirestore(projectData) {
  const user = firebase.auth().currentUser;
  if (!user) throw new Error('Not authenticated');
  
  const projectId = generateUUID();
  const docRef = db.collection('projects').doc(projectId);
  
  const sanitized = {
    ...projectData,
    owner: user.uid,
    floors: serializeFloorsMap(projectData.floors || []),
    geoHorizons: Array.isArray(projectData.geoHorizons) 
      ? projectData.geoHorizons 
      : [],
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  
  await docRef.set(sanitized);
  return projectId;
}
```

#### Real-time Subscribe
```javascript
// firebase-data.js
function subscribeToProject(projectId, callback) {
  const docRef = db.collection('projects').doc(projectId);
  
  const unsubscribe = docRef.onSnapshot(snapshot => {
    if (!snapshot.exists) {
      callback(null);
      return;
    }
    
    const data = snapshot.data();
    
    // Deserialize
    const deserialized = {
      ...data,
      floors: deserializeFloorsArray(data.floors || []),
      geoHorizons: data.geoHorizons || []
    };
    
    callback(deserialized);
  });
  
  return unsubscribe;  // 🔥 ALWAYS clean up in beforeunload!
}
```

#### Auto-save (Index_v11.0.html)
```javascript
// Auto-save every 30s
let autoSaveInterval;

function startAutoSave() {
  autoSaveInterval = setInterval(async () => {
    await saveCurrentProject();
  }, 30000);  // 30s
}

window.addEventListener('beforeunload', () => {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  if (unsubscribe) unsubscribe();
});
```

### 5.6 Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isJSJEmail() {
      return request.auth.token.email.matches('.*@jsj[.]pt$');
    }
    
    function isOwner(projectId) {
      return get(/databases/$(database)/documents/projects/$(projectId)).data.owner == request.auth.uid;
    }
    
    match /projects/{projectId} {
      // Read: owner only
      allow read: if isAuthenticated() && isJSJEmail() && isOwner(projectId);
      
      // Create: JSJ email + sets owner
      allow create: if isAuthenticated() && isJSJEmail() 
                    && request.resource.data.owner == request.auth.uid;
      
      // Update/Delete: owner only
      allow update, delete: if isAuthenticated() && isJSJEmail() && isOwner(projectId);
    }
  }
}
```

---

## 6. INTEGRAÇÃO GRÁFICA (Contrato zonas.html ↔ Index)

### 6.1 Protocolo `postMessage`

**Direcção**: Index → zonas.html (init)
```javascript
{
  type: 'initEditor',
  data: {
    blueprint: { scale: 1.0, imageData: "data:image/png;base64,..." },
    layers: {
      "Estrutura": [...],
      "Sobrecargas": [...],
      "Paredes_RP": [...]
    }
  },
  floorId: 1234567890
}
```

**Direcção**: zonas.html → Index (retorno)
```javascript
{
  type: 'zonesData',
  data: {
    blueprint: { scale: 1.0, imageData: "..." },
    layers: { /* estrutura idêntica ao enviado */ }
  }
}
```

### 6.2 Estrutura de Layer (Schema)

```javascript
{
  "NomeDaLayer": [
    {
      id: 123,                    // Timestamp único
      design: "L1",               // Designação (ex: "L1", "Z-A")
      uso: "B",                   // Categoria EC1 (apenas em Sobrecargas)
      manualLoad: "0.25",         // String! (espessura ou carga)
      shapes: "[[[{\"x\":100}]]]" // 🔥 v11.0: JSON string (nested arrays)
    }
  ]
}
```

### 6.3 Regras de Negócio

#### Max-Thickness Rule (v6+)
**Problema**: Lajes sobrepostas (ex: laje de piso + laje de varanda)  
**Solução**: Apenas a laje MAIS ESPESSA conta para cálculo de G

```javascript
// Em FloorViewer.displayZoneCombinations()
let maxThicknessFound = 0;
for (layerName in layers) {
  if (layerName === 'Estrutura') {
    const h = parseFloat(zone.manualLoad);
    if (h > maxThicknessFound) {
      maxThicknessFound = h;
      // Sobrescreve G (não acumula!)
    }
  }
}
```

#### Área em Metros Quadrados
**Conversão**: Coordenadas estão em pixels, área em m²

```javascript
polygonArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    let j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  const editorScale = this.data.blueprint?.scale || 1; // px/m
  return Math.abs(area) / (2 * editorScale * editorScale);
}
```

---

## 7. PERSISTÊNCIA (Formato JSON)

### 7.1 Schema de Export

```json
{
  "id_jsj": "2024-001",
  "nome_projeto": "Edifício Exemplo",
  "cliente": "Cliente XYZ",
  "projectData": {
    "floors": [ /* ... */ ],
    "geoHorizons": [ /* ... */ ]
  },
  "geo_tipo_sismo": "B",
  "sismo_terreno": "B",
  "crit_reg": "EC0, EC1, EC2, EC8",
  // ... (todos os IDs catalogados)
}
```

### 7.2 Compatibilidade entre Versões

**Retrocompatibilidade**: ❌ v11.0 incompatível com v10.2  
**Motivo**: Dados em Firestore, não localStorage

**Migração v10.2→v11.0**:
- Manual: Import JSON v10.2 → Export → Upload Firestore
- Automático: Script migrate-to-firebase.html (se presente)

---

## 8. EVENT LISTENERS CRÍTICOS

### 8.1 Sync Geotécnica ↔ Sismo

```javascript
// Linhas 3805-3812
const geoSismo = document.getElementById('geo_tipo_sismo');
if (geoSismo) {
  const sismoTerreno = document.getElementById('sismo_terreno');
  sismoTerreno.value = geoSismo.value;  // Init sync
  
  geoSismo.addEventListener('change', () => {
    sismoTerreno.value = geoSismo.value;  // Live sync
  });
}
```

### 8.2 Navegação de Secções

```javascript
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => 
    s.classList.remove('active')
  );
  document.getElementById(sectionId).classList.add('active');
  
  document.querySelectorAll('.nav button').forEach(btn => 
    btn.classList.remove('active')
  );
  event.target.classList.add('active');
}
```

### 8.3 Inicialização (DOMContentLoaded)

```javascript
window.addEventListener('DOMContentLoaded', async () => {
  // 🔥 v11.0: Auth guard
  const user = firebase.auth().currentUser;
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  
  await initEditor(user);
  
  updateKPIs();
  renderFloors();
  renderGeoTable();
  updateActionsFloorTabs();
  initFloorViewer();
  populateZonamentoFloorSelector();
  
  // Sync geo → sismo (ver 8.1)
  
  // 🔥 v11.0: Auto-save
  startAutoSave();
});
```

---

## 9. DEPENDÊNCIAS EXTERNAS

### 9.1 CDN Libraries

```html
<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- Firebase SDK v10.7.1 (compat) -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
```

**Versão**: Firebase 10.7.1 (fixada) ✅  
**Versão**: Chart.js latest (não fixada - risco breaking changes) ⚠️

### 9.2 Browser APIs

- **Canvas API**: Motor gráfico (FloorViewer)
- **FileReader API**: Import de JSON
- **Blob API**: Export de JSON
- **postMessage API**: Comunicação com zonas.html

---

## 10. LIMITAÇÕES CONHECIDAS

### 10.1 Arquitecturais

1. **Auth Obrigatória**: Sem Firebase Auth, app não funciona
2. **Network Required**: Sem Firestore, sem dados (no offline mode)
3. **No Undo/Redo**: Alterações irreversíveis (exceto re-load real-time)
4. **No Versionamento**: Firestore sobrescreve (no Git-style history)

### 10.2 Performance

- **Máximo testado**: 20 pisos × 10 zonas = 200 zonas
- **Bottleneck**: Rendering de canvas com >1000 polígonos
- **Auto-save**: 30s interval (otimizado Spark plan, não customizável)

### 10.3 Validação

- **Nenhuma validação** de tipos em runtime
- **Assumes**: User insere dados corretos
- **Fallback**: `parseFloat() || 0` (valor 0 como default)

---

## 11. ROADMAP (Próximas Versões)

Ver `@AGENTE_ROADMAP.md` para detalhes completos e cronograma.

**Fase 1** (v10.0): ✅ COMPLETO - Refactor Arquitetural (UUID Maps, appState)  
**Fase 2** (v10.2): ✅ COMPLETO - Multi-Projeto (Lobby, localStorage)  
**Fase 3** (v11.0): ✅ COMPLETO - Firebase Backend (auth, Firestore sync)  
**Fase 1.5** (v10.4): 🚧 EM PLANEAMENTO - Protótipo Color-Trace (OpenCV isolado)  
**Fase 3.5** (v11.1): Schema Blocos (nova hierarquia Projeto→Blocos→Pisos)  
**Fase 4** (v12.0): Speckle Live Sync (integração BIM)  
**Fase 5** (v13.0): Automação (Cloud Functions, reports DOCX)  
**Fase 6** (v14.0): React Migration (componentização, escalabilidade)

**Cronograma Total**: ~3 meses (tempo parcial)

---

## APÊNDICES

### A. Índice de IDs HTML

Ver `@AGENTE_RISCOS_v2.md` (168 IDs catalogados)

### B. Índice de Funções JavaScript

```
// Estado
initializeProjectData()
collectAllData()
loadAllData(data)
updateKPIs()

// Pisos
addFloor()
deleteFloor(floorId)
renderFloors()
toggleFloorZones(floorId)
updateFloorName(floorId, name)
updateFloorCota(floorId, cota)

// Zonas
openAddZoneModal(floorId)
openEditZoneModal(floorId, zoneId)
saveZone()
deleteZone(floorId, zoneId)
closeZoneModal()
renderZoneForm(zone)

// Cálculos
calculateEquivThickness(tipo, h)
updateGeneralStats()

// Geotecnia
addGeoRow()
renderGeoTable()

// Ações
toggleActionSection(name, enabled)
updateActionsFloorTabs()
selectActionsFloor(floorId, btn)
generateSeismicCharts()
generateSeismicChart(canvasId, zona, terreno, q, amort, type)

// Motor Gráfico
initFloorViewer()
populateZonamentoFloorSelector()
openZonesEditor(floorId)
class FloorViewer { /* ... */ }

// IO
exportJSON()
importJSON(event)
exportMarkdown()
generateMarkdownReport()

// Firebase (v11.0+)
initEditor(user)
saveCurrentProject()
backToLobby()
createProjectInFirestore(data)
loadAllProjectsFromFirestore()
loadSingleProject(id)
saveProjectToFirestore(id, data)
deleteProjectFromFirestore(id)
subscribeToProject(id, callback)

// UI
showSection(sectionId)
toggleTipoObraCustom(value)
closeModal(id)
```

### C. Changelog v10.2 → v11.0

**Adições**:
- Firebase Authentication (@jsj.pt whitelist)
- Firestore CRUD layer (firebase-data.js)
- Real-time sync (onSnapshot listeners)
- Auto-save 30s interval
- Deep sanitization nested arrays (critical fix)
- login.html (Auth UI)
- Security Rules (owner-only + email validation)

**Modificações**:
- `saveCurrentProject()` → async (await required)
- `backToLobby()` → async + save before redirect
- `collectAllData()` → remove Firestore noise (project, metadata, legacyInputs)
- `loadAllData()` → deserialize nested strings

**Remoções**:
- localStorage dependency (deprecated, legacy calls remain for debug)

**Breaking Changes**:
- Auth obrigatória (sem login, sem acesso)
- localStorage → Firestore (incompatível v10.2 JSONs)
- Network required (sem offline mode)

---

**Fim da Especificação Técnica v11.0**  
**Próximo passo**: Ver `GUIDELINES.md` para padrões de desenvolvimento
