# SSOT JSJ Template - Especificação Técnica v9.1

**Versão:** 9.1  
**Data:** Fevereiro 2026  
**Tipo:** Aplicação Web Standalone (HTML + Vanilla JS)  
**Objetivo:** Sistema unificado de gestão de projetos de engenharia estrutural

---

## 1. VISÃO GERAL

### 1.1 Arquitetura
- **Tipo**: Multi-Page Application (lobby.html + index.html)
- **Estado**: localStorage (persistência automática)
- **Navegação**: lobby.html (lista) → index.html?project=<uuid> (editor)
- **UI Lobby**: Grid de projetos com CRUD
- **UI Editor**: 8 secções (inalteradas vs v9.1)

### 1.2 Componentes Principais
```
Index_v9.1.html (3817 linhas)
├── CSS (linhas 9-1220): Sistema de design dark theme
├── HTML (linhas 1221-2062): Estrutura das 8 secções
└── JavaScript (linhas 2063-3814): Lógica + Motor Gráfico
```

### 1.3 Fluxo de Dados (SSOT Principle)
```
User Input (DOM) → updateKPIs() → projectData (Global State)
                                       ↓
                            collectAllData() → JSON Export
                                       ↓
                            loadAllData(JSON) → Repopulate DOM
```

**REGRA CRÍTICA**: Nunca ler do DOM para cálculos. Sempre usar `projectData`.

### 1.4 Fluxo Multi-Projeto
```
User → lobby.html (ponto de entrada)
    ↓
Clicar "Novo Projeto"
    ↓
index.html?project=new (cria UUID, abre vazio)
    ↓
Preencher Secções 1-8
    ↓
"🏠 Voltar ao Lobby"
    ↓
lobby.html (projeto aparece no grid)
    ↓
Clicar "Abrir"
    ↓
index.html?project=<uuid> (carrega dados)
```

**localStorage Schema** (v10.1):
```json
{
  "ssot_projects": {
    "uuid-1": {
      "id": "uuid-1",
      "id_jsj": "2026-001",
      "nome_projeto": "Edifício A",
      "floors": [{"id": "...", "name": "..."}],
      "zones": [{"id": "...", "name": "..."}],
      "geoHorizons": [{"horizonte": "..."}]
    },
    "uuid-2": { }
  }
}
```

---

## 2. MODELO DE DADOS (Schema Completo)

### 2.1 Estrutura Global `projectData`

**NOTA v10.1**: Em runtime, `floors/zones/geoHorizons` são Maps.
No localStorage, são serializados como Arrays.
Conversão automática em `shared.js` (saveProjectsToStorage / loadProjectsFromStorage).

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
              shapes: [            // Array de polígonos
                [                  // Polígono = array de pontos
                  {x: 100, y: 200},
                  {x: 300, y: 200},
                  {x: 300, y: 400},
                  {x: 100, y: 400}
                ]
              ]
            }
          ],
          "Sobrecargas": [         // Layer de sobrecargas
            {
              id: 124,
              uso: "B",            // Categoria EC1
              shapes: [...]
            }
          ],
          "Paredes_RP": [          // Layer de RCP (Revestimentos/Paredes)
            {
              id: 125,
              manualLoad: "1.5",   // kN/m² (string!)
              shapes: [...]
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

**Função de Atualização**:
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

#### 4.1 Condições Arquitetónicas
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

**Arquitetura**:
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
      if (zone.shapes && this.pointInPolygon(worldPoint, zone.shapes[0])) {
        
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
      initFloorViewer();  // Atualiza viewer
    }
  });
}
```

---

## 5. INTEGRAÇÃO GRÁFICA (Contrato zonas.html ↔ Index)

### 5.1 Protocolo `postMessage`

**Direção**: Index → zonas.html (init)
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

**Direção**: zonas.html → Index (retorno)
```javascript
{
  type: 'zonesData',
  data: {
    blueprint: { scale: 1.0, imageData: "..." },
    layers: { /* estrutura idêntica ao enviado */ }
  }
}
```

### 5.2 Estrutura de Layer (Schema)

```javascript
{
  "NomeDaLayer": [
    {
      id: 123,                    // Timestamp único
      design: "L1",               // Designação (ex: "L1", "Z-A")
      uso: "B",                   // Categoria EC1 (apenas em Sobrecargas)
      manualLoad: "0.25",         // String! (espessura ou carga)
      shapes: [                   // Array de polígonos
        [                         // Polígono = array de {x, y}
          {x: 100, y: 200},
          {x: 300, y: 200},
          {x: 300, y: 400}
        ]
      ]
    }
  ]
}
```

### 5.3 Regras de Negócio

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

## 6. PERSISTÊNCIA (Formato JSON)

### 6.1 Schema de Export

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

### 6.2 Compatibilidade entre Versões

**Retrocompatibilidade**: ❌ Não garantida  
**Motivo**: IDs podem mudar entre versões

**Migração Manual** (se ID mudou):
```javascript
// Exemplo: ID "id_antigo" renomeado para "id_novo"
function loadAllData(data) {
  // Fallback para JSONs antigos
  if (data.id_antigo && !data.id_novo) {
    data.id_novo = data.id_antigo;
  }
  
  // ... resto da função
}
```

---

## 7. EVENT LISTENERS CRÍTICOS

### 7.1 Sync Geotécnica ↔ Sismo

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

### 7.2 Navegação de Secções

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

### 7.3 Inicialização (DOMContentLoaded)

```javascript
window.addEventListener('DOMContentLoaded', () => {
  updateKPIs();
  renderFloors();
  renderGeoTable();
  updateActionsFloorTabs();
  initFloorViewer();
  populateZonamentoFloorSelector();
  
  // Sync geo → sismo (ver 7.1)
});
```

---

## 8. DEPENDÊNCIAS EXTERNAS

### 8.1 CDN Libraries

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

**Versão**: Latest (não fixada - risco de breaking changes)  
**Uso**: Gráficos sísmicos (espectros EC8)

### 8.2 Browser APIs

- **Canvas API**: Motor gráfico (FloorViewer)
- **FileReader API**: Import de JSON
- **Blob API**: Export de JSON
- **postMessage API**: Comunicação com zonas.html

---

## 9. LIMITAÇÕES CONHECIDAS

### 9.1 Arquiteturais

1. **Estado Volátil**: Dados perdidos ao fechar browser (sem auto-save)
2. **Single-Project**: Apenas 1 projeto por sessão
3. **No Undo/Redo**: Alterações irreversíveis (exceto re-import)
4. **No Versionamento**: JSONs incompatíveis entre versões

### 9.2 Performance

- **Máximo testado**: 20 pisos × 10 zonas = 200 zonas
- **Bottleneck**: Rendering de canvas com >1000 polígonos

### 9.3 Validação

- **Nenhuma validação** de tipos em runtime
- **Assumes**: User insere dados corretos
- **Fallback**: `parseFloat() || 0` (valor 0 como default)

---

## 10. ROADMAP (Próximas Versões)

Ver `@AGENTE_ROADMAP.md` para detalhes.

**Fase 1** (v10): Refactor + Modularização  
**Fase 2** (v11): Multi-Projeto (Lobby)  
**Fase 3** (v12): Backend Firebase  
**Fase 4** (v13): Automação (Cloud Functions)  
**Fase 5** (v14): Framework Reativo (Vue/React)

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

// UI
showSection(sectionId)
toggleTipoObraCustom(value)
closeModal(id)
```

### C. Changelog v9.0 → v9.1

**Remoções**:
- Função `updateTosco()` (código morto)
- Método `FloorViewer.getZoneCentroid()` (não utilizado)

**Correções**:
- Tag `<title>` ainda diz v6.0 (deve ser v9.1)

**Adições**:
- Nenhuma (apenas limpeza)

---

**Fim da Especificação Técnica v9.1**  
**Próximo passo**: Ver `GUIDELINES.md` para padrões de desenvolvimento
