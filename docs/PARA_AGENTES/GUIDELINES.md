# SSOT JSJ - Guidelines de Desenvolvimento v9.1

**VersÃ£o:** 9.1  
**PÃºblico-Alvo:** Developers, Code Agents (Claude Code, Cursor)  
**Objetivo:** PadrÃµes e boas prÃ¡ticas para manter consistÃªncia no cÃ³digo

---

## 1. NAMING CONVENTIONS

### 1.1 IDs HTML

**PadrÃ£o**: `snake_case` (obrigatÃ³rio)

```html
<!-- âœ… CORRETO -->
<input id="id_jsj" />
<input id="geo_tipo_sismo" />
<input id="sismo_terreno" />

<!-- âŒ ERRADO -->
<input id="idJsj" />
<input id="GeoTipoSismo" />
<input id="sismo-terreno" />
```

**IDs DinÃ¢micos** (gerados por JS):
```javascript
// PadrÃ£o: {tipo}_{id}
const inputId = `floor_name_${floorId}`;
const zoneId = `zone_uso_${zoneId}`;
```

**REGRA CRÃTICA**: IDs sÃ£o chave de persistÃªncia. **Nunca** alterar sem migraÃ§Ã£o.

---

### 1.2 VariÃ¡veis JavaScript

**PadrÃ£o**: `camelCase`

```javascript
// âœ… CORRETO
let projectData = {};
const floorId = Date.now();
function updateKPIs() {}

// âŒ ERRADO
let project_data = {};
const floor_id = Date.now();
function update_kpis() {}
```

**Constantes Globais**: `UPPER_SNAKE_CASE`

```javascript
const MAX_FLOORS = 100;
const DEFAULT_SLAB_THICKNESS = 0.25;
```

---

### 1.3 Classes

**PadrÃ£o**: `PascalCase`

```javascript
// âœ… CORRETO
class FloorViewer {}
class ZoneCalculator {}

// âŒ ERRADO
class floorViewer {}
class zone_calculator {}
```

---

### 1.4 CSS Classes

**PadrÃ£o**: `kebab-case`

```css
/* âœ… CORRETO */
.zone-modal {}
.btn-primary {}
.load-breakdown-item {}

/* âŒ ERRADO */
.zoneModal {}
.btn_primary {}
.loadBreakdownItem {}
```

---

## 2. ESTRUTURA DE CÃ“DIGO

### 2.1 Ordem de DeclaraÃ§Ã£o (Template)

```javascript
// 0. IMPORTS (v10.1+)
<script src="shared.js"></script>  // UUID + localStorage utilities

// 1. VARIÃVEIS GLOBAIS
let projectData = { floors: [], geoHorizons: [] };

// 2. CONSTANTES
const SLAB_TYPES = ['MaciÃ§a', 'Fungiforme', ...];

// 3. CLASSES
class FloorViewer {
  constructor() {}
  render() {}
}

// 4. FUNÃ‡Ã•ES DE ESTADO (CORE)
function collectAllData() {}
function loadAllData(data) {}

// 5. FUNÃ‡Ã•ES DE UI (DINÃ‚MICA)
function renderFloors() {}
function updateKPIs() {}

// 6. FUNÃ‡Ã•ES DE CÃLCULO
function calculateEquivThickness() {}

// 7. EVENT LISTENERS (ao fim)
window.addEventListener('DOMContentLoaded', () => {
  // Init code
});
```

---

### 2.2 IndentaÃ§Ã£o e EspaÃ§amento

**IndentaÃ§Ã£o**: 2 espaÃ§os (nÃ£o tabs)

```javascript
// âœ… CORRETO
function example() {
  if (condition) {
    doSomething();
  }
}

// âŒ ERRADO (4 espaÃ§os ou tabs)
function example() {
    if (condition) {
        doSomething();
    }
}
```

**EspaÃ§amento**:
```javascript
// âœ… CORRETO
const total = (a + b) * c;
if (x > 0) { ... }
for (let i = 0; i < 10; i++) { ... }

// âŒ ERRADO (sem espaÃ§os)
const total=(a+b)*c;
if(x>0){...}
for(let i=0;i<10;i++){...}
```

---

### 2.3 ComentÃ¡rios ObrigatÃ³rios

**FunÃ§Ãµes CrÃ­ticas** (lista em `@AGENTE_RISCOS_v2.md`):

```javascript
/**
 * Serializa todo o estado da aplicaÃ§Ã£o para JSON
 * @returns {Object} JSON com campos fixos + projectData
 * ðŸ”¥ CRÃTICO: NÃ£o alterar sem validar compatibilidade JSONs antigos
 */
function collectAllData() {
  // ...
}
```

**CÃ¡lculos EC1/EC8**:
```javascript
// Categoria B: EscritÃ³rios (EC1-1-1 Tabela 6.2)
// qk = 3.0 kN/mÂ², Ïˆ0 = 0.7, Ïˆ1 = 0.5, Ïˆ2 = 0.3
const qk = this.getCategoryLoad('B');
```

**Workarounds/Hacks**:
```javascript
// v6 WORKAROUND: Max-thickness rule para lajes sobrepostas
// Apenas a laje MAIS ESPESSA conta (nÃ£o soma)
if (h > maxThicknessFound) {
  maxThicknessFound = h;
}
```

---

## 3. BOAS PRÃTICAS

### 3.1 SSOT (Single Source of Truth)

**v10.1 Update**: 
- `appState.projects[projectId]` Ã© SSOT
- `appState.activeProject` Ã© Proxy (getter para projeto activo)
- localStorage Ã© cache persistente (nÃ£o fonte de verdade em runtime)

**REGRA DE OURO**: Nunca ler do DOM para cÃ¡lculos.

```javascript
// âŒ ERRADO - LÃª do DOM
function calculateTotal() {
  const area = parseFloat(document.getElementById('zone_area').value);
  return area * 25;
}

// âœ… CORRETO - LÃª de projectData
function calculateTotal(zoneId) {
  const zone = projectData.floors
    .flatMap(f => f.zones)
    .find(z => z.id === zoneId);
  return zone.area * 25;
}
```

**ExceÃ§Ãµes** (leitura do DOM permitida):
1. `collectAllData()` - serializaÃ§Ã£o
2. `updateKPIs()` - display apenas (nÃ£o cÃ¡lculo)

---

### 3.2 ValidaÃ§Ã£o de Inputs

**Sempre** usar fallbacks com `||`:

```javascript
// âœ… CORRETO
const area = parseFloat(input.value) || 0;
const name = input.value.trim() || '';
const count = parseInt(input.value, 10) || 0;

// âŒ ERRADO (crash se vazio)
const area = parseFloat(input.value);  // NaN se vazio
const name = input.value;              // Pode ser undefined
```

**ValidaÃ§Ã£o de Objetos**:
```javascript
// âœ… CORRETO
const floor = projectData.floors.find(f => f.id === floorId);
if (!floor) {
  console.error('Piso nÃ£o encontrado:', floorId);
  return;
}

// âŒ ERRADO (crash se nÃ£o existir)
const floor = projectData.floors.find(f => f.id === floorId);
floor.zones.push(newZone);  // TypeError se floor === undefined
```

---

### 3.3 Error Handling

**Import/Export**:
```javascript
function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      loadAllData(data);
      alert('âœ… Dados importados com sucesso!');
    } catch (err) {
      console.error('Erro ao importar:', err);
      alert('âŒ Ficheiro invÃ¡lido: ' + err.message);
    }
  };
  reader.readAsText(file);
}
```

**OperaÃ§Ãµes Destrutivas** (confirmaÃ§Ã£o):
```javascript
function deleteFloor(floorId) {
  const floor = projectData.floors.find(f => f.id === floorId);
  if (!floor) return;
  
  // âœ… Confirma se tem zonas
  if (floor.zones.length > 0) {
    const msg = `Piso "${floor.name}" tem ${floor.zones.length} zona(s). Apagar?`;
    if (!confirm(msg)) return;
  }
  
  projectData.floors = projectData.floors.filter(f => f.id !== floorId);
  renderFloors();
}
```

---

### 3.4 Performance

**DOM Manipulation**:
```javascript
// âŒ ERRADO - MÃºltiplas manipulaÃ§Ãµes (slow)
for (let i = 0; i < 100; i++) {
  const div = document.createElement('div');
  div.textContent = i;
  container.appendChild(div);  // Reflow a cada iteraÃ§Ã£o
}

// âœ… CORRETO - Batch com innerHTML
const html = [];
for (let i = 0; i < 100; i++) {
  html.push(`<div>${i}</div>`);
}
container.innerHTML = html.join('');
```

**Event Delegation** (para listas dinÃ¢micas):
```javascript
// âŒ ERRADO - Event listener em cada item
floors.forEach(floor => {
  document.getElementById(`delete_${floor.id}`)
    .addEventListener('click', () => deleteFloor(floor.id));
});

// âœ… CORRETO - Listener Ãºnico no container
document.getElementById('floorsList').addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const floorId = parseInt(e.target.dataset.floorId);
    deleteFloor(floorId);
  }
});
```

---

## 4. PROTOCOLOS DE ALTERAÃ‡ÃƒO

### 4.1 Checklist PrÃ©-AlteraÃ§Ã£o

Antes de mexer em cÃ³digo, **SEMPRE** verifica:

- [ ] ID estÃ¡ em `@AGENTE_RISCOS_v2.md`? â†’ Consulta secÃ§Ã£o relevante
- [ ] FunÃ§Ã£o tem 0 callers? â†’ Procura por nome (pode ser callback string)
- [ ] MudanÃ§a afecta `projectData`? â†’ Valida schema em `ESPECIFICACAO.md`
- [ ] MudanÃ§a afecta `actionsData`? â†’ Testa com `zonas.html`
- [ ] MudanÃ§a em cÃ¡lculo EC1? â†’ Atualiza **2 lugares** (tabela + grÃ¡fico)
- [ ] Listener serÃ¡ removido? â†’ Valida se nÃ£o quebra sync

---

### 4.2 AlteraÃ§Ã£o de IDs HTML

**CenÃ¡rio**: Renomear `id_antigo` â†’ `id_novo`

**Procedimento**:
```javascript
// 1. HTML: Altera ID
<input id="id_novo" />  // Era "id_antigo"

// 2. JS: Adiciona fallback em loadAllData()
function loadAllData(data) {
  // ... cÃ³digo existente ...
  
  // MIGRAÃ‡ÃƒO v9.1 â†’ v10: ID renomeado
  if (data.id_antigo && !data.id_novo) {
    data.id_novo = data.id_antigo;
  }
  
  // ... resto da funÃ§Ã£o ...
}

// 3. DOCS: Actualiza @AGENTE_RISCOS_v2.md
// 4. TESTE: Valida import de JSON v9.0
```

---

### 4.3 AlteraÃ§Ã£o de Estrutura `projectData`

**CenÃ¡rio**: Adicionar campo `floor.tipo`

**Procedimento**:
```javascript
// 1. Schema: Define valor default
function addFloor() {
  const floor = {
    id: Date.now(),
    name: `Piso ${projectData.floors.length}`,
    tipo: 'Corrente',  // ðŸ†• Novo campo
    // ... campos existentes ...
  };
  projectData.floors.push(floor);
}

// 2. MigraÃ§Ã£o: loadAllData() preenche default
function loadAllData(data) {
  if (data.projectData) {
    projectData = data.projectData;
    
    // MIGRAÃ‡ÃƒO v10: Adiciona campo tipo se nÃ£o existir
    projectData.floors.forEach(floor => {
      if (!floor.tipo) floor.tipo = 'Corrente';
    });
  }
  // ...
}

// 3. UI: Adiciona input em renderFloors()
// 4. DOCS: Actualiza ESPECIFICACAO.md secÃ§Ã£o 2.1
// 5. TESTE: Importa JSON v9.1 (sem campo tipo)
```

---

### 4.4 DuplicaÃ§Ã£o de LÃ³gica (EC1)

**ATENÃ‡ÃƒO**: CÃ¡lculo de cargas existe em **2 lugares**:

1. **Tabela AnalÃ­tica** (funÃ§Ã£o fictÃ­cia - nÃ£o existe no cÃ³digo real)
2. **FloorViewer** (mÃ©todo `displayZoneCombinations()`)

**Protocolo** se alterares valores EC1:

```javascript
// 1. Altera tabela em FloorViewer.getCategoryLoad()
getCategoryLoad(category) {
  const loads = {
    'B': 3.5,  // âœï¸ Mudou de 3.0 para 3.5
    // ...
  };
  return loads[category] || 3.0;
}

// 2. VALIDAÃ‡ÃƒO: Procura por "categoria B" ou "3.0" no cÃ³digo
//    e garante que nÃ£o hÃ¡ outra cÃ³pia da tabela

// 3. TESTE: Abre SecÃ§Ã£o 7, clica em zona tipo B, valida qk = 3.5
```

---

## 5. TESTES OBRIGATÃ“RIOS

Ver `@AGENTE_TESTES.md` para suite completa.

**MÃ­nimo** apÃ³s qualquer alteraÃ§Ã£o:

### 5.1 Smoke Test (2 min)

```bash
1. Abre Index_v9.1.html no browser
2. Abre DevTools Console
3. Valida: 0 erros JavaScript
4. Clica "Exportar Dados"
5. Valida: Download de .json
```

---

### 5.2 Regression Test (5 min)

```bash
1. Preenche SecÃ§Ã£o 1 (ID, Nome)
2. Adiciona 1 piso em SecÃ§Ã£o 2
3. Adiciona 1 zona (Uso: B, Laje: MaciÃ§a 0.25m)
4. Exporta JSON
5. Recarrega pÃ¡gina (F5)
6. Importa JSON
7. Valida: Dados idÃªnticos
8. Console: 0 erros
```

---

### 5.3 Integration Test (10 min)

```bash
1. Preenche SecÃ§Ãµes 1-5 (completo)
2. Activa "AÃ§Ã£o SÃ­smica" (SecÃ§Ã£o 6)
3. Preenche parÃ¢metros sÃ­smicos (Zona 1.3, q=3.0)
4. SecÃ§Ã£o 7: Seleciona piso criado
5. Valida: GrÃ¡fico sÃ­smico renderiza
6. Modo "Sonda": Clica em zona
7. Valida: Mostra combinaÃ§Ãµes ELU/ELS
8. Exporta JSON + Markdown
```

---

## 6. DOCUMENTAÃ‡ÃƒO OBRIGATÃ“RIA

### 6.1 Quando Actualizar `@AGENTE_RISCOS_v2.md`

**Triggers**:
- Adicionar ID HTML novo
- Adicionar funÃ§Ã£o crÃ­tica (estado, cÃ¡lculo, IO)
- Adicionar event listener com side-effects
- Alterar estrutura `projectData` ou `actionsData`

**Template**:
```markdown
### X.Y Novo ID/FunÃ§Ã£o

#### ID: `novo_campo`
**Tipo**: Input text
**Usado em**: SecÃ§Ã£o Z, cÃ¡lculo de ABC
**DependÃªncias**: Listener em `outro_campo`
```

---

### 6.2 Quando Actualizar `@AGENTE_MIGRACAO.md`

**Triggers**:
- Incremento de versÃ£o (vX â†’ vY)
- AlteraÃ§Ã£o arquitectural (ex: adicionar classe nova)
- Breaking change (ex: remover funÃ§Ã£o pÃºblica)

**Template**:
```markdown
### [v9.1 â†’ v10.0] - DD/MM/AAAA
**Autor**: Nome do Dev/Agent
**Resumo**: Adiciona funcionalidade X

**AlteraÃ§Ãµes**:
- Novo campo `floor.tipo` em projectData
- Nova funÃ§Ã£o `calculateTipo()`
- Removido mÃ©todo `FloorViewer.oldMethod()` (deprecated)

**Breaking Changes**:
- JSONs v9.1 precisam migraÃ§Ã£o (ver loadAllData())

**Testes**:
- âœ… Import/Export v9.1 â†’ v10.0
- âœ… Todos os regression tests passam
```

---

### 6.3 Quando Actualizar `ESPECIFICACAO.md`

**Triggers**:
- AlteraÃ§Ã£o de schema (projectData, actionsData)
- Nova API pÃºblica (funÃ§Ã£o que outros devs usam)
- MudanÃ§a de protocolo (postMessage, JSON format)

**SecÃ§Ãµes afectadas**:
- SecÃ§Ã£o 2: Schema
- SecÃ§Ã£o 4: API Interna
- SecÃ§Ã£o 5: IntegraÃ§Ã£o zonas.html
- ApÃªndice C: Changelog

---

## 7. CODE STYLE

### 7.1 VariÃ¡veis

**Preferir `const`** quando possÃ­vel:
```javascript
// âœ… CORRETO
const floorId = Date.now();
const zones = floor.zones.filter(z => z.area > 10);

// âŒ ERRADO (let desnecessÃ¡rio)
let floorId = Date.now();  // Nunca reatribuÃ­do
let zones = floor.zones.filter(...);
```

**Usar `let`** apenas se reatribuiÃ§Ã£o:
```javascript
let total = 0;
for (const zone of zones) {
  total += zone.area;  // ReatribuiÃ§Ã£o necessÃ¡ria
}
```

---

### 7.2 Template Literals

**Preferir** `backticks` para strings com variÃ¡veis:

```javascript
// âœ… CORRECTO
const msg = `Piso "${floor.name}" tem ${floor.zones.length} zonas`;

// âŒ ERRADO (concatenaÃ§Ã£o)
const msg = 'Piso "' + floor.name + '" tem ' + floor.zones.length + ' zonas';
```

---

### 7.3 Arrow Functions

**Usar** para callbacks curtos:

```javascript
// âœ… CORRETO
floors.forEach(f => updateFloor(f));
zones.map(z => z.area);
zones.filter(z => z.uso === 'B');

// âŒ ERRADO (function desnecessÃ¡rio)
floors.forEach(function(f) { updateFloor(f); });
```

**NÃƒO usar** para mÃ©todos de classe:

```javascript
class FloorViewer {
  // âœ… CORRETO
  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
  
  // âŒ ERRADO (arrow nÃ£o tem `this` prÃ³prio)
  render = () => {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
```

---

### 7.4 Destructuring

**Usar** quando acede a mÃºltiplos campos:

```javascript
// âœ… CORRETO
const { name, area, cota } = floor;
console.log(name, area, cota);

// âŒ ERRADO (repetiÃ§Ã£o)
console.log(floor.name, floor.area, floor.cota);
```

---

## 8. ANTI-PATTERNS (Evitar)

### 8.1 Global Pollution

```javascript
// âŒ ERRADO - VariÃ¡vel global desnecessÃ¡ria
window.tempData = { ... };

// âœ… CORRETO - Scoped
function processData() {
  const tempData = { ... };
  // Usa tempData localmente
}
```

---

### 8.2 Magic Numbers

```javascript
// âŒ ERRADO
const peso = espessura * 25 + 1.5;

// âœ… CORRETO
const GAMMA_BETAO = 25;  // kN/mÂ³
const REVESTIMENTOS = 1.5;  // kN/mÂ²
const peso = espessura * GAMMA_BETAO + REVESTIMENTOS;
```

---

### 8.3 Deep Nesting

```javascript
// âŒ ERRADO (pirÃ¢mide da desgraÃ§a)
function example() {
  if (condition1) {
    if (condition2) {
      if (condition3) {
        // ...
      }
    }
  }
}

// âœ… CORRETO (early returns)
function example() {
  if (!condition1) return;
  if (!condition2) return;
  if (!condition3) return;
  // ...
}
```

---

### 8.4 MutaÃ§Ã£o de ParÃ¢metros

```javascript
// âŒ ERRADO
function addZone(floor, zone) {
  floor.zones.push(zone);  // MutaÃ§Ã£o directa
}

// âœ… CORRETO
function addZone(floor, zone) {
  return {
    ...floor,
    zones: [...floor.zones, zone]
  };
}
```

**ExceÃ§Ã£o**: Estruturas `projectData` (estado global mutÃ¡vel por design)

---

## 9. GIT WORKFLOW (Futuro)

**Ainda nÃ£o implementado**, mas para quando migrarmos:

### 9.1 Branch Naming

```
feature/adiciona-campo-tipo-piso
fix/corrige-calculo-ec1-categoria-b
refactor/extrai-logica-lajes
docs/atualiza-especificacao-v10
```

---

### 9.2 Commit Messages

**Formato**: `tipo(scope): mensagem`

```
feat(pisos): adiciona campo tipo
fix(ec1): corrige qk categoria B (3.0 â†’ 3.5)
refactor(viewer): extrai mÃ©todo calculateLoads()
docs(spec): actualiza schema projectData
test(io): adiciona teste import JSON v9.1
```

---

### 9.3 Pull Request Template

```markdown
## Objectivo
[O que esta PR faz]

## AlteraÃ§Ãµes
- [ ] CÃ³digo
- [ ] Testes
- [ ] Docs

## Breaking Changes
[Lista ou "Nenhum"]

## Testes Executados
- [ ] Smoke test
- [ ] Regression test
- [ ] Integration test

## Checklist
- [ ] Actualizado @AGENTE_RISCOS_v2.md (se aplicÃ¡vel)
- [ ] Actualizado @AGENTE_MIGRACAO.md
- [ ] Actualizado ESPECIFICACAO.md (se schema mudou)
- [ ] Console sem erros
```

---

## 10. TROUBLESHOOTING COMUM

### 10.1 "Dados nÃ£o carregam apÃ³s import"

**Sintomas**: JSON importa mas campos ficam vazios

**Causas**:
1. ID mudou entre versÃµes
2. `loadAllData()` nÃ£o processa novo campo
3. JSON corrupto (sintaxe invÃ¡lida)

**Debug**:
```javascript
// Cola na console apÃ³s import
const data = collectAllData();
console.log('IDs no JSON:', Object.keys(data));
console.log('IDs no DOM:', 
  Array.from(document.querySelectorAll('[id]')).map(el => el.id)
);
```

---

### 10.2 "Canvas fica em branco"

**Sintomas**: SecÃ§Ã£o 7 (Zonamento) nÃ£o mostra nada

**Causas**:
1. `actionsData` vazio ou undefined
2. Imagem nÃ£o carregou (`imageData` vazio)
3. Escala incorrecta (`scale = 0`)

**Debug**:
```javascript
const floor = projectData.floors[0];
console.log('actionsData:', floor.actionsData);
console.log('Layers:', floor.actionsData?.layers);
console.log('Blueprint:', floor.actionsData?.blueprint);
```

---

### 10.3 "CÃ¡lculos EC1 errados"

**Sintomas**: Sonda mostra valor diferente da tabela

**Causa**: DuplicaÃ§Ã£o de lÃ³gica dessincronizada

**Debug**:
```javascript
// Compara ambas as implementaÃ§Ãµes
const category = 'B';

// 1. FloorViewer
const viewer = window.currentFloorViewer;
const qk1 = viewer.getCategoryLoad(category);

// 2. Verifica se hÃ¡ outra funÃ§Ã£o com mesma lÃ³gica
// (procura por "case 'B':" no cÃ³digo)
```

### 10.4 "Dados nÃ£o aparecem apÃ³s voltar ao lobby"

**Sintomas**: Editar projeto â†’ Voltar lobby â†’ Reabrir â†’ Campos vazios

**Causas**:
1. `saveCurrentProject()` nÃ£o chamado ao voltar
2. `loadProjectsFromStorage()` nÃ£o reconstrÃ³i Maps

**Debug**:
```javascript
// Antes de voltar ao lobby
console.log('Antes save:', appState.activeProject.floors.size);
saveCurrentProject();
const saved = JSON.parse(localStorage.getItem('ssot_projects'));
console.log('Guardado:', saved[appState.activeProjectId].floors.length);
```

**Fix**: Garantir que `backToLobby()` chama `saveCurrentProject()` antes de redirigir.

---

## 11. RECURSOS ÃšTEIS

### 11.1 Docs Internas
- `ESPECIFICACAO.md` - Schema e API
- `@AGENTE_RISCOS_v2.md` - IDs e funÃ§Ãµes crÃ­ticas
- `@AGENTE_TESTES.md` - Suite de testes
- `@AGENTE_ROADMAP.md` - EvoluÃ§Ã£o futura

### 11.2 Normas (ReferÃªncia)
- EC0: Bases de projecto
- EC1: AcÃ§Ãµes em estruturas
- EC2: Projecto de estruturas de betÃ£o
- EC8: Projecto de estruturas para resistÃªncia aos sismos

### 11.3 Bibliotecas
- Chart.js: https://www.chartjs.org/docs/
- Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

---

## 12. GLOSSÃRIO

**SSOT**: Single Source of Truth - `projectData` Ã© a Ãºnica fonte de verdade  
**ELU**: Estado Limite Ãšltimo (Ultimate Limit State)  
**ELS**: Estado Limite de ServiÃ§o (Serviceability Limit State)  
**qk**: Sobrecarga caracterÃ­stica (kN/mÂ²)  
**EC1/EC8**: EurocÃ³digo 1 (AÃ§Ãµes) / EurocÃ³digo 8 (Sismo)  
**RCP**: Revestimentos, Cargas Permanentes  
**Î³**: Peso volÃºmico (kN/mÂ³)  
**Ïˆ0, Ïˆ1, Ïˆ2**: Coeficientes de combinaÃ§Ã£o EC0

---

**Fim das Guidelines v10.2**  
**Versão atual**: Fase 2 Completa (Multi-Projeto)  
**Próxima leitura**: `ESPECIFICACAO.md` para detalhes técnicos completos, `@AGENTE_ROADMAP.md` para evolução futura
