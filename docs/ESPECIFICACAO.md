# SSOT JSJ Template - Especificação Técnica v11.1

**Versão:** 11.1
**Data:** 15 Fevereiro 2026
**Tipo:** AplicaÃƒÂ§ÃƒÂ£o Web Cloud-Native (Firebase)  
**Objetivo:** Sistema unificado de gestÃƒÂ£o de projetos de engenharia estrutural

---

## 1. VISÃƒÆ’O GERAL

### 1.1 Arquitetura
- **Tipo**: Multi-Page Application (login.html Ã¢â€ â€™ lobby.html Ã¢â€ â€™ index.html)
- **Estado**: Firestore (persistência cloud real-time)
- **Storage**: Firebase Storage (blob assets: imagens, PDFs, DXF)
- **Auth**: Firebase Authentication (@jsj.pt whitelist obrigatÃƒÂ³rio)
- **NavegaÃƒÂ§ÃƒÂ£o**: login.html Ã¢â€ â€™ lobby.html (lista) Ã¢â€ â€™ index.html?project=<uuid> (editor)
- **UI Lobby**: Grid de projetos com CRUD
- **UI Editor**: 8 secÃƒÂ§ÃƒÂµes (inalteradas vs v9.1)

### 1.2 Componentes Principais
```
Index_v11.1.html (3900+ linhas)
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ CSS (linhas 9-1220): Sistema de design dark theme
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ HTML (linhas 1221-2062): Estrutura das 8 secÃƒÂ§ÃƒÂµes
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ JavaScript (linhas 2063+): LÃƒÂ³gica + Motor GrÃƒÂ¡fico + Firebase integration

firebase-config.js (~150 linhas)
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Firebase SDK v10.7.1 imports
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Config + initialization
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ Auth whitelist (@jsj.pt)

firebase-data.js (~700 linhas  # v11.1: +Storage Layer)
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Firestore CRUD operations
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Map/Array serialization
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Nested arrays sanitization
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ Real-time subscriptions
└─ 🆕 Firebase Storage Layer (generic upload/download/delete)

login.html (~200 linhas)
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ Firebase Auth UI (Google Sign-In)

lobby.html (~400 linhas)
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Auth guard
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ Projects grid (Firestore-backed)
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ CRUD operations
migrate-v11.0-to-v11.1.html (~300 linhas)
└─ Migration script (Base64 → Storage)
```

### 1.3 Fluxo de Dados (SSOT Principle)
```
User Input (DOM) Ã¢â€ â€™ updateKPIs() Ã¢â€ â€™ projectData (Global State)
                                       Ã¢â€ â€œ
                        Auto-save (30s) Ã¢â€ â€™ Firestore
                                       Ã¢â€ â€œ
                            Real-time sync Ã¢â€ â€™ onSnapshot
                                       Ã¢â€ â€œ
                            Focus-aware update Ã¢â€ â€™ loadAllData()
```

**REGRA CRÃƒÂTICA**: Nunca ler do DOM para cÃƒÂ¡lculos. Sempre usar `projectData`.

### 1.4 Fluxo Multi-Projeto
```
User Ã¢â€ â€™ login.html (Firebase Auth @jsj.pt)
    Ã¢â€ â€œ
lobby.html (Firestore query: owner = user.uid)
    Ã¢â€ â€œ
Clicar "Novo Projeto"
    Ã¢â€ â€œ
index.html?project=new (cria Firestore doc + UUID)
    Ã¢â€ â€œ
Preencher SecÃƒÂ§ÃƒÂµes 1-8
    Ã¢â€ â€œ
Auto-save 30s Ã¢â€ â€™ Firestore
    Ã¢â€ â€œ
"Ã°Å¸ÂÂ  Voltar ao Lobby"
    Ã¢â€ â€œ
lobby.html (projeto aparece no grid)
    Ã¢â€ â€œ
Clicar "Abrir"
    Ã¢â€ â€œ
index.html?project=<uuid> (subscribe real-time)
```

**Firestore Schema** (v11.1):
```
projects (collection)
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ <projectId> (document)
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ owner: "user@jsj.pt"
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ id_jsj: "2026-001"
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ nome_projeto: "EdifÃƒÂ­cio A"
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ floors: [...]  // Serialized from Map
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ geoHorizons: [...]
    Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ updatedAt: timestamp
```

---

## 2. MODELO DE DADOS (Schema Completo)

### 2.1 Estrutura Global `projectData`

**NOTA v11.0**: 
- Runtime: `floors/zones/geoHorizons` sÃƒÂ£o Maps (UUID keys)
- Firestore: Serialized como Arrays
- ConversÃƒÂ£o automÃƒÂ¡tica em `firebase-data.js`

```javascript
let projectData = {
  floors: [
    {
      id: 1234567890,              // Timestamp ÃƒÂºnico (number)
      name: "Piso 0",              // string
      cota: 0.00,                  // float (m)
      area: 150.00,                // float (mÃ‚Â²)
      imageURL: ""              // 🆕 v11.1: Storage path (gs://bucket/projects/{id}/floors/{id}/image.png)
      imageDownloadURL: ""      // 🆕 v11.1: Cached download URL (TTL 7 dias)
      imageURLExpiry: 0         // 🆕 v11.1: Timestamp expiration
      imageLoaded: false        // 🆕 v11.1: Client-side cache flag (não persiste Firestore),               // Base64 string (PNG/JPG) - planta do piso
      zones: [
        {
          id: 9876543210,          // Timestamp ÃƒÂºnico (number)
          name: "Zona A",          // string
          area: 50.00,             // float (mÃ‚Â²)
          cotaLimpo: 0.00,         // float (m)
          acabamento: 50,          // int (mm)
          uso: "B",                // string - Categoria EC1 (A-H)
          tipoLaje: "MaciÃƒÂ§a",      // string - Tipo estrutural
          espessura: 0.25,         // float (m)
          vaoMax: 6.0,             // float (m)
          permanentes: [],         // Array<{nome: string, valor: float, tipo: string}>
          walls: []                // Array<{comprimento: float, espessura: float, altura: float, gamma: float}>
        }
      ],
      actionsData: {               // Ã°Å¸â€Â¥ CRÃƒÂTICO - Do zonas.html (editor grÃƒÂ¡fico)
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
              shapes: "[[[{\"x\":100,\"y\":200}]]]"  // Ã°Å¸â€Â¥ v11.0: JSON string (nested arrays)
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
              manualLoad: "1.5",   // kN/mÃ‚Â² (string!)
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
      gamma: 18.0,                 // float (kN/mÃ‚Â³)
      c: 5,                        // float (kPa)
      phi: 30,                     // float (graus)
      e: 50,                       // float (MPa)
      sigma: 200,                  // float (kPa)
      escav: "FÃƒÂ¡cil"               // string
    }
  ]
};
```

### 2.2 ValidaÃƒÂ§ÃƒÂµes e RestriÃƒÂ§ÃƒÂµes

#### IDs ÃƒÅ¡nicos
- **MÃƒÂ©todo**: `Date.now()` (timestamp em ms)
- **ColisÃƒÂ£o**: ImprovÃƒÂ¡vel (user nÃƒÂ£o clica 2x no mesmo ms)
- **ValidaÃƒÂ§ÃƒÂ£o**: Nenhuma (assumes unicidade)

#### Tipos de Dados
```javascript
// ConversÃƒÂµes crÃƒÂ­ticas
parseFloat(input.value) || 0     // NÃƒÂºmeros com fallback 0
parseInt(input.value, 10) || 0   // Inteiros
input.value.trim() || ""         // Strings
```

#### Categorias EC1 (Uso)
```javascript
// Valores vÃƒÂ¡lidos para zone.uso
const VALID_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F', 'H'];
// A: 2.0 kN/mÃ‚Â² (HabitaÃƒÂ§ÃƒÂ£o)
// B: 3.0 kN/mÃ‚Â² (EscritÃƒÂ³rios)
// C: 4.0 kN/mÃ‚Â² (Escolas/Restaurantes)
// D: 5.0 kN/mÃ‚Â² (ComÃƒÂ©rcio)
// E: 7.5 kN/mÃ‚Â² (ArmazÃƒÂ©m)
// F: 2.5 kN/mÃ‚Â² (Garagem)
// H: 0.4 kN/mÃ‚Â² (Cobertura)
```

#### Tipos de Laje
```javascript
const SLAB_TYPES = ['MaciÃƒÂ§a', 'Fungiforme', 'Aligeirada', 'Vigada', 'PrÃƒÂ©-laje'];
```

---

## 3. SECÃƒâ€¡Ãƒâ€¢ES FUNCIONAIS (NÃƒÂ­veis 1-8)

### SecÃƒÂ§ÃƒÂ£o 1: IdentificaÃƒÂ§ÃƒÂ£o do Projeto

**IDs HTML CrÃƒÂ­ticos** (23 campos):
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

**FunÃƒÂ§ÃƒÂ£o de ActualizaÃƒÂ§ÃƒÂ£o**:
```javascript
function updateKPIs() {
  document.getElementById('kpiID').textContent = 
    document.getElementById('id_jsj').value || '---';
  // ... (idem para nome, fase)
  
  // CÃƒÂ¡lculo de KPIs geomÃƒÂ©tricos
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

### SecÃƒÂ§ÃƒÂ£o 2: CaracterizaÃƒÂ§ÃƒÂ£o Geral da Obra

**Estrutura DinÃƒÂ¢mica**:
- Lista de pisos (renderizada por `renderFloors()`)
- Cada piso contÃƒÂ©m zonas (expandÃƒÂ­vel)
- Modal para criar/editar zonas

**IDs DinÃƒÂ¢micos** (gerados por JS):
```javascript
// PadrÃƒÂ£o: {tipo}_{id do piso/zona}
floor_name_1234567890
floor_cota_1234567890
floor_area_1234567890
zone_name_9876543210
zone_uso_9876543210
zone_tipoLaje_9876543210
// ... etc
```

**FunÃƒÂ§ÃƒÂµes CrÃƒÂ­ticas**:
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

**CÃƒÂ¡lculo de Espessura Equivalente**:
```javascript
function calculateEquivThickness(tipo, h) {
  const coefs = {
    'MaciÃƒÂ§a': 1.0,
    'Fungiforme': 0.85,
    'Aligeirada': 0.60,
    'Vigada': 0.50,
    'PrÃƒÂ©-laje': 1.0
  };
  return h * (coefs[tipo] || 1.0);
}
```

---

### SecÃƒÂ§ÃƒÂ£o 3: Elementos Base

**IDs HTML** (10 campos):
```
arq, mep, escav, geotec, hidro, prosp, carac, insp, ensaios, orig
```

**Tipo**: Textarea (histÃƒÂ³rico de documentos)

---

### SecÃƒÂ§ÃƒÂ£o 4: Condicionantes

#### 4.1 CondiÃƒÂ§ÃƒÂµes ArquitectÃƒÂ³nicas
```
cond_arq  // Textarea
```

#### 4.2 Condicionantes GeotÃƒÂ©cnicas
```
geo_form            // FormaÃƒÂ§ÃƒÂµes geolÃƒÂ³gicas
geo_horiz           // Horizontes
geo_sub             // Profundidade substrato
geo_nat             // Natureza dos solos
geo_tipo_sismo      // Ã°Å¸â€Â¥ CRÃƒÂTICO - Tipo solo EC8 (sync com sismo_terreno)
geo_sigma_adm       // TensÃƒÂ£o admissÃƒÂ­vel
```

**Tabela DinÃƒÂ¢mica** (`geoHorizons`):
- Renderizada por `renderGeoTable()`
- Adicionada por `addGeoRow()`
- Campos: horizonte, nspt, gamma, c, phi, e, sigma, escav

#### 4.3 CondiÃƒÂ§ÃƒÂµes HidrogeolÃƒÂ³gicas
```
hidro_nf            // NÃƒÂ­vel freÃƒÂ¡tico
hidro_col           // Coluna de ÃƒÂ¡gua
hidro_xa            // Agressividade (XA)
hidro_obs           // ObservaÃƒÂ§ÃƒÂµes
```

---

### SecÃƒÂ§ÃƒÂ£o 5: SoluÃƒÂ§ÃƒÂ£o Estrutural

```
sol_desc            // Textarea - DescriÃƒÂ§ÃƒÂ£o da soluÃƒÂ§ÃƒÂ£o
```

---

### SecÃƒÂ§ÃƒÂ£o 6: AÃƒÂ§ÃƒÂµes (Motor de CÃƒÂ¡lculo)

#### 6.1 SeleÃƒÂ§ÃƒÂ£o de AÃƒÂ§ÃƒÂµes (Checkboxes)
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

**FunÃƒÂ§ÃƒÂ£o de Toggle**:
```javascript
function toggleActionSection(name, enabled) {
  const section = document.querySelector(`[data-action="${name}"]`);
  section.style.display = enabled ? 'block' : 'none';
  
  if (name === 'sismo' && enabled) {
    generateSeismicCharts(); // Gera espectros EC8
  }
}
```

#### 6.2 ParÃƒÂ¢metros por AÃƒÂ§ÃƒÂ£o

**A) AÃƒÂ§ÃƒÂ£o SÃƒÂ­smica (EC8)**
```
sismo_zona          // Zona sÃƒÂ­smica (1.1 a 2.5)
sismo_terreno       // Ã°Å¸â€Â¥ AUTO-SYNC com geo_tipo_sismo
sismo_imp           // Coeficiente importÃƒÂ¢ncia
sismo_q             // Coeficiente comportamento
sismo_amort         // Amortecimento (%)
```

**GrÃƒÂ¡ficos**:
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

**B) AÃƒÂ§ÃƒÂ£o do Vento (EC1-1-4)**
```
vento_zona, vento_vb0, vento_cat, vento_z0, vento_co, vento_cpi
```

**C) Impulsos de Terras**
```
impulsos_h, impulsos_gamma, impulsos_phi, impulsos_c, impulsos_k0, impulsos_q
```

**D) RetraÃƒÂ§ÃƒÂ£o/FluÃƒÂªncia**
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

**G) ÃƒÂgua**
```
agua_nivel, agua_gamma, agua_sub, agua_dren
```

---

### SecÃƒÂ§ÃƒÂ£o 7: Zonamento (Motor GrÃƒÂ¡fico)

**Arquitectura**:
- **Selector de Piso**: Dropdown dinÃƒÂ¢mico
- **Viewer 2D**: Canvas com classe `FloorViewer`
- **Modos de VisualizaÃƒÂ§ÃƒÂ£o**: Estrutura, Sobrecargas, RCP, CombinaÃƒÂ§ÃƒÂµes, Sonda

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
  
  // MÃƒÂ©todos principais
  render()                           // Renderiza canvas completo
  drawShapes()                       // Desenha polÃƒÂ­gonos das layers
  calculatePointELU(point)           // Ã°Å¸â€Â¥ CRÃƒÂTICO - Calcula carga num ponto
  displayZoneCombinations(info)      // Mostra combinaÃƒÂ§ÃƒÂµes ELU/ELS
  renderLoadTable(type)              // Tabela de sobrecargas/RCP
  
  // MÃƒÂ©todos auxiliares
  pointInPolygon(point, polygon)     // Ray-casting algorithm
  polygonArea(points)                // CÃƒÂ¡lculo de ÃƒÂ¡rea (mÃ‚Â²)
  getCategoryLoad(category)          // Tabela EC1 (qk por categoria)
}
```

**CÃƒÂ¡lculo de Cargas** (linha 3580-3640):
```javascript
displayZoneCombinations(info) {
  const { worldPoint } = info;
  let G = 0, Q = 0, details = [];
  let maxThicknessFound = 0;  // Ã°Å¸â€Â¥ v6 logic: Max-Thickness Rule
  
  // Para cada layer
  for (let layerName in this.data.layers) {
    const zones = this.data.layers[layerName];
    zones.forEach(zone => {
      // Ã°Å¸â€Â¥ v11.0: Parse shapes JSON string
      const shapes = JSON.parse(zone.shapes || '[]');
      
      if (shapes.length && this.pointInPolygon(worldPoint, shapes[0])) {
        
        // Lajes: apenas a MAIS ESPESSA conta
        if (layerName === 'Estrutura') {
          const h = parseFloat(zone.manualLoad) || 0;
          if (h > maxThicknessFound) {
            maxThicknessFound = h;
            G = (h * 25) + 1.5;  // ÃŽÂ³=25 kN/mÃ‚Â³ + Revestimentos 1.5 kN/mÃ‚Â²
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
  
  // CombinaÃƒÂ§ÃƒÂµes EC0
  const combinations = [
    { name: 'ELU Fund. 1', value: 1.35*G + 1.50*Q, formula: '1.35G + 1.50Q' },
    { name: 'ELU Fund. 2', value: 1.35*G + 1.50*0.7*Q, formula: '1.35G + 1.50ÃË†Ã¢â€šâ‚¬Q' },
    { name: 'SLS Caract.', value: G + Q, formula: 'G + Q' },
    { name: 'SLS Freq.', value: G + 0.5*Q, formula: 'G + ÃË†Ã¢â€šÂQ' },
    { name: 'SLS Q-perm.', value: G + 0.3*Q, formula: 'G + ÃË†Ã¢â€šâ€šQ' }
  ];
  
  // Display na UI
  document.getElementById('zonamentoInfoPanel').innerHTML = /* ... */;
}
```

**Tabela EC1** (linha 3778-3790):
```javascript
getCategoryLoad(category) {
  const loads = {
    'A': 2.0,   // HabitaÃƒÂ§ÃƒÂ£o
    'B': 3.0,   // EscritÃƒÂ³rios
    'C': 4.0,   // Escolas/Restaurantes
    'D': 5.0,   // ComÃƒÂ©rcio
    'E': 7.5,   // ArmazÃƒÂ©m
    'F': 2.5,   // Garagem
    'H': 0.4    // Cobertura
  };
  return loads[category.substring(0,1).toUpperCase()] || 3.0;
}
```

---

### SecÃƒÂ§ÃƒÂ£o 8: CritÃƒÂ©rios e RelatÃƒÂ³rios

```
crit_reg            // RegulamentaÃƒÂ§ÃƒÂ£o (textarea)
crit_dim            // CritÃƒÂ©rios dimensionamento (textarea)
```

**ExportaÃƒÂ§ÃƒÂ£o**:
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

## 4. API INTERNA (FunÃƒÂ§ÃƒÂµes PÃƒÂºblicas)

### 4.1 Estado e PersistÃƒÂªncia

#### `collectAllData()`
**Assinatura**: `() => Object`  
**Retorna**: JSON com todos os dados do formulÃƒÂ¡rio  
**Uso**: Chamada antes de exportar ou salvar

```javascript
function collectAllData() {
  const data = {
    // SecÃƒÂ§ÃƒÂ£o 1: IDs fixos
    id_jsj: document.getElementById('id_jsj')?.value || '',
    nome_projeto: document.getElementById('nome_projeto')?.value || '',
    // ... (todos os 168 IDs catalogados)
    
    // SecÃƒÂ§ÃƒÂ£o 2: Estrutura dinÃƒÂ¢mica
    projectData: projectData
  };
  return data;
}
```

#### `loadAllData(data)`
**Assinatura**: `(data: Object) => void`  
**Efeito**: Repopula DOM e `projectData`  
**ValidaÃƒÂ§ÃƒÂµes**: Nenhuma (assumes JSON vÃƒÂ¡lido)

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
  
  // 3. Re-renderiza UI dinÃƒÂ¢mica
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
**ValidaÃƒÂ§ÃƒÂ£o**: Confirma se piso tem zonas

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
**Contexto**: LÃƒÂª dados do modal `#zoneModal`  
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

### 4.3 Motor GrÃƒÂ¡fico

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
      saveCurrentProject();  // Ã°Å¸â€Â¥ v11.0: Persist to Firestore
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
User Ã¢â€ â€™ Firebase Auth Ã¢â€ â€™ Firestore CRUD Ã¢â€ â€™ Real-time Sync
                           Ã¢â€ â€œ
                Auto-save (30s interval)
```

### 5.3 Security
- Rules: Owner-only access (isOwner() + isJSJEmail())
- Auth required for all operations

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

#### Auto-save (Index_v11.1.html)
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

## 5.7 FIREBASE STORAGE LAYER (v11.1+) 🆕

### 5.7.1 Arquitetura
**Pattern**: Firestore-Centric (metadata) + Storage (blobs)
- **Firestore**: Queryable metadata (storage paths, download URLs, expiry timestamps)
- **Storage**: Binary assets (images, PDFs, DXF files)
- **Security**: Parallel rules (Firestore + Storage validate ownership independently)

**Motivação**:
- Firestore document limit: **1MB**
- v11.0 problem: 10 floors × 500KB Base64 images = **5MB doc** → Firestore **REJECTS**
- v11.1 solution: 10 floors × 50 bytes URL strings = **500 bytes** → **OK**

**Design Philosophy**: Generic asset storage (type-agnostic from the start)
- v11.1 implements: Floor PNG images
- v11.2+ ready: Geotechnical PDFs, DXF floor plans, Excel reports, videos
- Same API functions serve all asset types

### 5.7.2 Storage Paths (Generic Schema)
```
gs://ssot-jsj.appspot.com/
└─ projects/{projectId}/
    ├─ floors/{floorId}/image.png           # v11.1 ✅ IMPLEMENTED
    ├─ geotecnia/{docId}.pdf                # v11.2+ (planned)
    ├─ plantas/{dwgId}.dxf                  # v11.2+ (planned)
    ├─ reports/{reportId}.docx              # v13.0+ (planned)
    └─ media/{videoId}.mp4                  # Future
```

**Path Pattern Rules**:
- ✅ Always namespace under `projects/{projectId}/`
- ✅ Use descriptive folders (`floors/`, `geotecnia/`)
- ✅ Include entity ID in filename or parent folder
- ❌ Never hardcode asset types in function names (use generic `uploadAsset()`)

### 5.7.3 Storage API (firebase-data.js)

#### Generic Functions (Type-Agnostic)

```javascript
/**
 * Upload any asset to Firebase Storage
 * @param {string} projectId - Project UUID
 * @param {string} path - Relative path under projects/{id}/ (e.g., "floors/123/image.png")
 * @param {File|Blob} file - Binary data to upload
 * @param {Object} metadata - Optional { contentType, customMetadata }
 * @returns {Promise<Object>} { storageURL, downloadURL, expiry }
 */
async function uploadAsset(projectId, path, file, metadata = {}) {
  const fullPath = `projects/${projectId}/${path}`;
  const ref = storage.ref(fullPath);
  
  // Upload blob
  await ref.put(file, metadata);
  
  // Get download URL
  const downloadURL = await ref.getDownloadURL();
  
  // TTL: 7 days (604800000 ms)
  const expiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
  
  return {
    storageURL: `gs://${storage.app.options.storageBucket}/${fullPath}`,
    downloadURL,
    expiry
  };
}

/**
 * Get asset download URL with cache TTL validation
 * @param {string} storageURL - gs:// path
 * @param {string} cachedURL - Previously cached download URL (if any)
 * @param {number} expiry - Cached URL expiry timestamp
 * @returns {Promise<string>} Valid download URL
 */
async function getAssetURL(storageURL, cachedURL, expiry) {
  const now = Date.now();
  
  // If cached URL still valid → return immediately
  if (cachedURL && expiry > now) {
    return cachedURL;
  }
  
  // Regenerate URL (expired or missing)
  const ref = storage.refFromURL(storageURL);
  return await ref.getDownloadURL();
}

/**
 * Delete asset from Storage
 * @param {string} storageURL - gs:// path
 * @returns {Promise<void>}
 */
async function deleteAsset(storageURL) {
  if (!storageURL) return;
  const ref = storage.refFromURL(storageURL);
  await ref.delete();
}
```

#### Floor-Specific Wrappers (v11.1)

```javascript
/**
 * Upload floor image (PNG/JPG)
 * @param {string} projectId - Project UUID
 * @param {number} floorId - Floor timestamp ID
 * @param {File} file - Image file from input[type=file]
 * @returns {Promise<Object>} { imageURL, imageDownloadURL, imageURLExpiry }
 */
async function uploadFloorImage(projectId, floorId, file) {
  const path = `floors/${floorId}/image.png`;
  
  const result = await uploadAsset(projectId, path, file, {
    contentType: file.type,
    customMetadata: {
      floorId: floorId.toString(),
      uploadedBy: firebase.auth().currentUser?.email || 'unknown'
    }
  });
  
  return {
    imageURL: result.storageURL,
    imageDownloadURL: result.downloadURL,
    imageURLExpiry: result.expiry
  };
}

/**
 * Get floor image download URL (with cache refresh if expired)
 * @param {Object} floor - Floor object from projectData
 * @returns {Promise<string|null>} Valid download URL or null
 */
async function getFloorImageURL(floor) {
  if (!floor.imageURL) return null;
  
  const url = await getAssetURL(
    floor.imageURL,
    floor.imageDownloadURL,
    floor.imageURLExpiry
  );
  
  // If URL was regenerated → update Firestore cache
  if (url !== floor.imageDownloadURL) {
    const projectId = new URLSearchParams(location.search).get('project');
    const floorIndex = projectData.floors.findIndex(f => f.id === floor.id);
    
    if (floorIndex !== -1) {
      await db.collection('projects').doc(projectId).update({
        [`floors.${floorIndex}.imageDownloadURL`]: url,
        [`floors.${floorIndex}.imageURLExpiry`]: Date.now() + (7 * 24 * 60 * 60 * 1000)
      });
      
      // Update local state
      floor.imageDownloadURL = url;
      floor.imageURLExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
    }
  }
  
  return url;
}

/**
 * Delete floor image from Storage
 * @param {string} imageURL - gs:// storage path
 * @returns {Promise<void>}
 */
async function deleteFloorImage(imageURL) {
  await deleteAsset(imageURL);
}
```

### 5.7.4 Lazy Loading Pattern (CRITICAL)

**Rule**: NEVER eager-load images. ALWAYS load on-demand.

**Bad Pattern** ❌ (DO NOT USE):
```javascript
// ❌ This loads ALL images upfront → 10 floors × 500KB = 5MB download
async function loadProject(projectId) {
  const data = await loadSingleProject(projectId);
  
  // BAD: Eager loading
  for (const floor of data.floors) {
    const url = await getFloorImageURL(floor);
    const blob = await fetch(url).then(r => r.blob());
    floor.imageData = URL.createObjectURL(blob);  // Memory leak!
  }
  
  return data;
}
```

**Good Pattern** ✅ (USE THIS):
```javascript
// ✅ Load metadata only, image on-demand
class FloorViewer {
  /**
   * Lazy load floor image (called when user selects floor in Viewer)
   * @param {Object} floor - Floor object
   * @returns {Promise<string>} Object URL for canvas rendering
   */
  async loadImage(floor) {
    // If already loaded → return cached
    if (floor.imageLoaded && floor.imageData) {
      return floor.imageData;
    }
    
    // Fetch download URL (with TTL cache validation)
    const downloadURL = await getFloorImageURL(floor);
    if (!downloadURL) return null;
    
    // Download blob
    const response = await fetch(downloadURL);
    const blob = await response.blob();
    
    // Create object URL for canvas (client-side cache)
    floor.imageData = URL.createObjectURL(blob);
    floor.imageLoaded = true;  // Flag to avoid re-downloading
    
    return floor.imageData;
  }
  
  /**
   * Cleanup object URLs on destroy (prevent memory leaks)
   */
  destroy() {
    if (this.data.imageData) {
      URL.revokeObjectURL(this.data.imageData);
    }
  }
}

// Usage in initFloorViewer()
async function initFloorViewer() {
  const selector = document.getElementById('zonamentoFloorSelector');
  const floorId = parseInt(selector.value);
  const floor = projectData.floors.find(f => f.id === floorId);
  if (!floor) return;
  
  // Cleanup previous viewer
  if (window.currentFloorViewer) {
    window.currentFloorViewer.destroy();
  }
  
  // Create new viewer
  window.currentFloorViewer = new FloorViewer('zonamentoCanvas', floor);
  
  // 🆕 v11.1: Lazy load image only when needed
  if (floor.imageURL) {
    try {
      const imageURL = await window.currentFloorViewer.loadImage(floor);
      if (imageURL) {
        window.currentFloorViewer.render();  // Re-render with image
      }
    } catch (err) {
      console.error('Failed to load floor image:', err);
      alert('Erro ao carregar imagem do piso');
    }
  }
}
```

**Performance Validation**:
- ✅ Lobby load (10 floors): **<500ms** (no image downloads)
- ✅ Viewer image load: **<1s** per floor (500KB PNG)
- ✅ Switching floors: **instant** (client-side cached)

### 5.7.5 Security Rules (Storage)

**Firestore Rules** (unchanged from v11.0):
```javascript
// Already deployed
match /projects/{projectId} {
  allow read, write: if isOwner(projectId) && isJSJEmail();
}
```

**Storage Rules** (🆕 ADD THIS):
```javascript
service firebase.storage {
  match /b/{bucket}/o {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isJSJEmail() {
      return request.auth.token.email.matches('.*@jsj[.]pt$');
    }
    
    function isOwner(projectId) {
      // 🔥 CRITICAL: Storage can validate via Firestore doc
      return firestore.get(/databases/(default)/documents/projects/$(projectId)).data.owner == request.auth.uid;
    }
    
    match /projects/{projectId}/{allPaths=**} {
      // Read: authenticated JSJ user who owns the project
      allow read: if isAuthenticated() && isJSJEmail() && isOwner(projectId);
      
      // Write: same as read (owner only)
      allow write: if isAuthenticated() && isJSJEmail() && isOwner(projectId);
    }
  }
}
```

**Key Feature**: Storage Rules can query Firestore to validate ownership (`firestore.get()`).

**Validation Checklist**:
- ✅ User A cannot read User B's blobs (even with URL)
- ✅ Unauthenticated users get 403 Forbidden
- ✅ Non-@jsj.pt emails rejected
- ✅ Storage paths enforce project ownership

### 5.7.6 Migration Script (v11.0 → v11.1)

**File**: `migrate-v11.0-to-v11.1.html` (standalone tool)

**Workflow**:
1. **Pre-migration**: User exports Firestore backup (Firebase Console)
2. **Script execution**: Iterates user's projects, converts Base64 → Storage
3. **Post-migration**: Validate Firestore doc sizes <100KB

**Implementation**:
```javascript
/**
 * Migrate single project from Base64 to Storage
 * @param {string} projectId - Project UUID
 */
async function migrateProject(projectId) {
  const docRef = db.collection('projects').doc(projectId);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    console.error(`Project ${projectId} not found`);
    return;
  }
  
  const data = doc.data();
  
  for (let i = 0; i < data.floors.length; i++) {
    const floor = data.floors[i];
    
    // Skip if already migrated
    if (floor.imageURL) {
      console.log(`✅ Floor ${floor.id} already migrated (has imageURL)`);
      continue;
    }
    
    // Skip if no Base64 data
    if (!floor.imageData) {
      console.log(`⚠️ Floor ${floor.id} has no imageData (skip)`);
      continue;
    }
    
    try {
      // Convert Base64 → Blob
      const base64Data = floor.imageData.split(',')[1];  // Remove data:image/png;base64, prefix
      const blob = base64ToBlob(base64Data, 'image/png');
      
      // Upload to Storage
      const result = await uploadFloorImage(projectId, floor.id, blob);
      
      // Update Firestore (this floor only, preserves other floors)
      await docRef.update({
        [`floors.${i}.imageURL`]: result.imageURL,
        [`floors.${i}.imageDownloadURL`]: result.imageDownloadURL,
        [`floors.${i}.imageURLExpiry`]: result.imageURLExpiry,
        [`floors.${i}.imageData`]: firebase.firestore.FieldValue.delete()  // Remove Base64
      });
      
      console.log(`✅ Migrated floor ${floor.id} (${floor.name})`);
      
    } catch (err) {
      console.error(`❌ Failed to migrate floor ${floor.id}:`, err);
      throw err;  // Stop migration on error
    }
  }
  
  console.log(`🎉 Project ${projectId} fully migrated`);
}

/**
 * Helper: Base64 string → Blob
 */
function base64ToBlob(base64, contentType = '') {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  
  return new Blob(byteArrays, { type: contentType });
}

/**
 * Migrate all projects for current user
 */
async function migrateAllProjects() {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert('Not authenticated');
    return;
  }
  
  console.log(`Starting migration for user ${user.email}...`);
  
  const snapshot = await db.collection('projects')
    .where('owner', '==', user.uid)
    .get();
  
  console.log(`Found ${snapshot.size} projects to migrate`);
  
  for (const doc of snapshot.docs) {
    await migrateProject(doc.id);
  }
  
  console.log('🎉 All projects migrated successfully!');
}
```

**Safety Checklist**:
- ❌ NEVER run migration twice (duplicates Storage blobs)
- ✅ ALWAYS backup Firestore before migration
- ✅ VALIDATE all floors have `imageURL` after migration
- ✅ DELETE old Base64 data (`imageData` field removed)
- ✅ CHECK Firestore doc size <100KB

**Rollback Plan** (if migration fails):
1. Restore Firestore from backup (Firebase Console)
2. Delete orphaned Storage blobs (manual cleanup via Console)
3. Fix migration script bugs
4. Re-run migration

### 5.7.7 Breaking Changes (v11.0 → v11.1)

| Aspect | v11.0 | v11.1 | Migration Required |
|--------|-------|-------|-------------------|
| **Floor image storage** | `imageData` (Base64 string) | `imageURL` (Storage gs:// path) | ✅ YES (script) |
| **Firestore doc size** | ~5MB (10 floors) | ~50KB (10 floors) | Auto after migration |
| **Image loading** | Synchronous (inline Base64) | Asynchronous (lazy fetch) | ✅ YES (code update) |
| **FloorViewer API** | `new FloorViewer(id, data)` sync | `await viewer.loadImage(floor)` | ✅ YES (add await) |
| **JSON export format** | Compatible v10.2-v11.0 | **INCOMPATIBLE** (new fields) | Manual re-export |
| **Network dependency** | Images work offline (Base64) | Images require network (URLs) | N/A (already online) |

**Compatibility Matrix**:
- ❌ v11.0 JSONs **cannot** be imported to v11.1 (missing `imageURL` fields)
- ❌ v11.1 Firestore data **cannot** be read by v11.0 code (no `imageData`)
- ✅ Migration script converts v11.0 → v11.1 (one-way)

**Post-Migration Code Changes**:
```javascript
// v11.0 (BEFORE)
const viewer = new FloorViewer('canvas', floor);
viewer.render();  // Image already in floor.imageData

// v11.1 (AFTER)
const viewer = new FloorViewer('canvas', floor);
await viewer.loadImage(floor);  // 🆕 Async load
viewer.render();
```

---

## 6. INTEGRAÃƒâ€¡ÃƒÆ’O GRÃƒÂFICA (Contrato zonas.html Ã¢â€ â€ Index)

### 6.1 Protocolo `postMessage`

**DirecÃƒÂ§ÃƒÂ£o**: Index Ã¢â€ â€™ zonas.html (init)
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

**DirecÃƒÂ§ÃƒÂ£o**: zonas.html Ã¢â€ â€™ Index (retorno)
```javascript
{
  type: 'zonesData',
  data: {
    blueprint: { scale: 1.0, imageData: "..." },
    layers: { /* estrutura idÃƒÂªntica ao enviado */ }
  }
}
```

### 6.2 Estrutura de Layer (Schema)

```javascript
{
  "NomeDaLayer": [
    {
      id: 123,                    // Timestamp ÃƒÂºnico
      design: "L1",               // DesignaÃƒÂ§ÃƒÂ£o (ex: "L1", "Z-A")
      uso: "B",                   // Categoria EC1 (apenas em Sobrecargas)
      manualLoad: "0.25",         // String! (espessura ou carga)
      shapes: "[[[{\"x\":100}]]]" // Ã°Å¸â€Â¥ v11.0: JSON string (nested arrays)
    }
  ]
}
```

### 6.3 Regras de NegÃƒÂ³cio

#### Max-Thickness Rule (v6+)
**Problema**: Lajes sobrepostas (ex: laje de piso + laje de varanda)  
**SoluÃƒÂ§ÃƒÂ£o**: Apenas a laje MAIS ESPESSA conta para cÃƒÂ¡lculo de G

```javascript
// Em FloorViewer.displayZoneCombinations()
let maxThicknessFound = 0;
for (layerName in layers) {
  if (layerName === 'Estrutura') {
    const h = parseFloat(zone.manualLoad);
    if (h > maxThicknessFound) {
      maxThicknessFound = h;
      // Sobrescreve G (nÃƒÂ£o acumula!)
    }
  }
}
```

#### ÃƒÂrea em Metros Quadrados
**ConversÃƒÂ£o**: Coordenadas estÃƒÂ£o em pixels, ÃƒÂ¡rea em mÃ‚Â²

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

## 7. PERSISTÃƒÅ NCIA (Formato JSON)

### 7.1 Schema de Export

```json
{
  "id_jsj": "2024-001",
  "nome_projeto": "EdifÃƒÂ­cio Exemplo",
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

### 7.2 Compatibilidade entre VersÃƒÂµes

**Retrocompatibilidade**: Ã¢ÂÅ’ v11.0 incompatÃƒÂ­vel com v10.2  
**Motivo**: Dados em Firestore, nÃƒÂ£o localStorage

**MigraÃƒÂ§ÃƒÂ£o v10.2Ã¢â€ â€™v11.0**:
- Manual: Import JSON v10.2 Ã¢â€ â€™ Export Ã¢â€ â€™ Upload Firestore
- AutomÃƒÂ¡tico: Script migrate-to-firebase.html (se presente)

---

## 8. EVENT LISTENERS CRÃƒÂTICOS

### 8.1 Sync GeotÃƒÂ©cnica Ã¢â€ â€ Sismo

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

### 8.2 NavegaÃƒÂ§ÃƒÂ£o de SecÃƒÂ§ÃƒÂµes

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

### 8.3 InicializaÃƒÂ§ÃƒÂ£o (DOMContentLoaded)

```javascript
window.addEventListener('DOMContentLoaded', async () => {
  // Ã°Å¸â€Â¥ v11.0: Auth guard
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
  
  // Sync geo Ã¢â€ â€™ sismo (ver 8.1)
  
  // Ã°Å¸â€Â¥ v11.0: Auto-save
  startAutoSave();
});
```

---

## 9. DEPENDÃƒÅ NCIAS EXTERNAS

### 9.1 CDN Libraries

```html
<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- Firebase SDK v10.7.1 (compat) -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
```

**VersÃƒÂ£o**: Firebase 10.7.1 (fixada) Ã¢Å“â€¦  
**VersÃƒÂ£o**: Chart.js latest (nÃƒÂ£o fixada - risco breaking changes) Ã¢Å¡Â Ã¯Â¸Â

### 9.2 Browser APIs

- **Canvas API**: Motor grÃƒÂ¡fico (FloorViewer)
- **FileReader API**: Import de JSON
- **Blob API**: Export de JSON
- **postMessage API**: ComunicaÃƒÂ§ÃƒÂ£o com zonas.html

---

## 10. LIMITAÃƒâ€¡Ãƒâ€¢ES CONHECIDAS

### 10.1 Arquitecturais

1. **Auth ObrigatÃƒÂ³ria**: Sem Firebase Auth, app nÃƒÂ£o funciona
2. **Network Required**: Sem Firestore, sem dados (no offline mode)
3. **No Undo/Redo**: AlteraÃƒÂ§ÃƒÂµes irreversÃƒÂ­veis (exceto re-load real-time)
4. **No Versionamento**: Firestore sobrescreve (no Git-style history)

### 10.2 Performance

- **MÃƒÂ¡ximo testado**: 20 pisos Ãƒâ€” 10 zonas = 200 zonas
- **Bottleneck**: Rendering de canvas com >1000 polÃƒÂ­gonos
- **Auto-save**: 30s interval (otimizado Spark plan, nÃƒÂ£o customizÃƒÂ¡vel)

### 10.3 ValidaÃƒÂ§ÃƒÂ£o

- **Nenhuma validaÃƒÂ§ÃƒÂ£o** de tipos em runtime
- **Assumes**: User insere dados corretos
- **Fallback**: `parseFloat() || 0` (valor 0 como default)

---

## 11. ROADMAP (PrÃƒÂ³ximas VersÃƒÂµes)

Ver `@AGENTE_ROADMAP.md` para detalhes completos e cronograma.

**Fase 1** (v10.0): Ã¢Å“â€¦ COMPLETO - Refactor Arquitetural (UUID Maps, appState)  
**Fase 2** (v10.2): Ã¢Å“â€¦ COMPLETO - Multi-Projeto (Lobby, localStorage)  
**Fase 3** (v11.0): Ã¢Å“â€¦ COMPLETO - Firebase Backend (auth, Firestore sync)  
**Fase 1.5** (v10.4): Ã°Å¸Å¡Â§ EM PLANEAMENTO - ProtÃƒÂ³tipo Color-Trace (OpenCV isolado)  
**Fase 3.5** (v11.1): Schema Blocos (nova hierarquia ProjetoÃ¢â€ â€™BlocosÃ¢â€ â€™Pisos)  
**Fase 4** (v12.0): Speckle Live Sync (integraÃƒÂ§ÃƒÂ£o BIM)  
**Fase 5** (v13.0): AutomaÃƒÂ§ÃƒÂ£o (Cloud Functions, reports DOCX)  
**Fase 6** (v14.0): React Migration (componentizaÃƒÂ§ÃƒÂ£o, escalabilidade)

**Cronograma Total**: ~3 meses (tempo parcial)

---

## APÃƒÅ NDICES

### A. ÃƒÂndice de IDs HTML

Ver `@AGENTE_RISCOS_v2.md` (168 IDs catalogados)

### B. ÃƒÂndice de FunÃƒÂ§ÃƒÂµes JavaScript

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

// CÃƒÂ¡lculos
calculateEquivThickness(tipo, h)
updateGeneralStats()

// Geotecnia
addGeoRow()
renderGeoTable()

// AÃƒÂ§ÃƒÂµes
toggleActionSection(name, enabled)
updateActionsFloorTabs()
selectActionsFloor(floorId, btn)
generateSeismicCharts()
generateSeismicChart(canvasId, zona, terreno, q, amort, type)

// Motor GrÃƒÂ¡fico
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

### C. Changelog v10.2 Ã¢â€ â€™ v11.0

**AdiÃƒÂ§ÃƒÂµes**:
- Firebase Authentication (@jsj.pt whitelist)
- Firestore CRUD layer (firebase-data.js)
- Real-time sync (onSnapshot listeners)
- Auto-save 30s interval
- Deep sanitization nested arrays (critical fix)

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

// Firebase Storage (v11.1+) 🆕
uploadAsset(projectId, path, file, metadata)
getAssetURL(storageURL, cachedURL, expiry)
deleteAsset(storageURL)
uploadFloorImage(projectId, floorId, file)
getFloorImageURL(floor)
deleteFloorImage(imageURL)

// UI
showSection(sectionId)
toggleTipoObraCustom(value)
closeModal(id)
```

### C. Changelog v11.0 → v11.1 🆕

**Adições**:
- Firebase Storage Layer (generic asset management)
- Storage security rules (parallel to Firestore)
- Lazy loading pattern (FloorViewer.loadImage async)
- TTL cache system (7 days download URL validity)
- Migration script (Base64 → Storage)
- Storage quota monitoring (5GB Spark plan)

**Modificações**:
- Floor schema: `imageData` (Base64) → `imageURL/imageDownloadURL/imageURLExpiry`
- `FloorViewer` class: Add async `loadImage()` method
- `initFloorViewer()`: Add lazy load logic
- `deleteFloor()`: Add Storage cleanup (delete blob before Firestore doc)
- `firebase-data.js`: +200 lines (generic Storage API)

**Remoções**:
- Floor `imageData` field (Base64 removed after migration)

**Breaking Changes**:
- Floor images: Base64 → Storage URLs (migration script required)
- Image loading: Sync → Async (code updates required)
- JSON format: v11.0 incompatible (new fields)
- Network required: Images won't work offline (Storage dependency)

**Performance Gains**:
- Firestore doc size: ~5MB → ~50KB (10 floors)
- Lobby load time: ~5s → <500ms (no eager image load)
- First floor view: ~200ms → ~1s (lazy download trade-off)
- Subsequent floor views: cached (instant)

### D. Changelog v10.2 → v11.0

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

**Fim da Especificação Técnica v11.1**  
**Versão**: 11.1 (Firebase Storage Layer)  
**Data**: 15/02/2026  
**Próximo passo**: Ver `ROADMAP.md` para v11.2 (Schema Blocos)
