# SSOT JSJ - Guidelines de Desenvolvimento v9.1

**Versão:** 9.1  
**Público-Alvo:** Developers, Code Agents (Claude Code, Cursor)  
**Objetivo:** Padrões e boas práticas para manter consistência no código

---

## 1. NAMING CONVENTIONS

### 1.1 IDs HTML

**Padrão**: `snake_case` (obrigatório)

```html
<!-- ✅ CORRETO -->
<input id="id_jsj" />
<input id="geo_tipo_sismo" />
<input id="sismo_terreno" />

<!-- ❌ ERRADO -->
<input id="idJsj" />
<input id="GeoTipoSismo" />
<input id="sismo-terreno" />
```

**IDs Dinâmicos** (gerados por JS):
```javascript
// Padrão: {tipo}_{id}
const inputId = `floor_name_${floorId}`;
const zoneId = `zone_uso_${zoneId}`;
```

**REGRA CRÍTICA**: IDs são chave de persistência. **Nunca** alterar sem migração.

---

### 1.2 Variáveis JavaScript

**Padrão**: `camelCase`

```javascript
// ✅ CORRETO
let projectData = {};
const floorId = Date.now();
function updateKPIs() {}

// ❌ ERRADO
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

**Padrão**: `PascalCase`

```javascript
// ✅ CORRETO
class FloorViewer {}
class ZoneCalculator {}

// ❌ ERRADO
class floorViewer {}
class zone_calculator {}
```

---

### 1.4 CSS Classes

**Padrão**: `kebab-case`

```css
/* ✅ CORRETO */
.zone-modal {}
.btn-primary {}
.load-breakdown-item {}

/* ❌ ERRADO */
.zoneModal {}
.btn_primary {}
.loadBreakdownItem {}
```

---

## 2. ESTRUTURA DE CÓDIGO

### 2.1 Ordem de Declaração (Template)

```javascript
// 0. IMPORTS (v10.1+)
<script src="shared.js"></script>  // UUID + localStorage utilities

// 1. VARIÁVEIS GLOBAIS
let projectData = { floors: [], geoHorizons: [] };

// 2. CONSTANTES
const SLAB_TYPES = ['Maciça', 'Fungiforme', ...];

// 3. CLASSES
class FloorViewer {
  constructor() {}
  render() {}
}

// 4. FUNÇÕES DE ESTADO (CORE)
function collectAllData() {}
function loadAllData(data) {}

// 5. FUNÇÕES DE UI (DINÂMICA)
function renderFloors() {}
function updateKPIs() {}

// 6. FUNÇÕES DE CÁLCULO
function calculateEquivThickness() {}

// 7. EVENT LISTENERS (ao fim)
window.addEventListener('DOMContentLoaded', () => {
  // Init code
});
```

---

### 2.2 Indentação e Espaçamento

**Indentação**: 2 espaços (não tabs)

```javascript
// ✅ CORRETO
function example() {
  if (condition) {
    doSomething();
  }
}

// ❌ ERRADO (4 espaços ou tabs)
function example() {
    if (condition) {
        doSomething();
    }
}
```

**Espaçamento**:
```javascript
// ✅ CORRETO
const total = (a + b) * c;
if (x > 0) { ... }
for (let i = 0; i < 10; i++) { ... }

// ❌ ERRADO (sem espaços)
const total=(a+b)*c;
if(x>0){...}
for(let i=0;i<10;i++){...}
```

---

### 2.3 Comentários Obrigatórios

**Funções Críticas** (lista em `@AGENTE_RISCOS_v2.md`):

```javascript
/**
 * Serializa todo o estado da aplicação para JSON
 * @returns {Object} JSON com campos fixos + projectData
 * 🔥 CRÍTICO: Não alterar sem validar compatibilidade JSONs antigos
 */
function collectAllData() {
  // ...
}
```

**Cálculos EC1/EC8**:
```javascript
// Categoria B: Escritórios (EC1-1-1 Tabela 6.2)
// qk = 3.0 kN/m², ψ0 = 0.7, ψ1 = 0.5, ψ2 = 0.3
const qk = this.getCategoryLoad('B');
```

**Workarounds/Hacks**:
```javascript
// v6 WORKAROUND: Max-thickness rule para lajes sobrepostas
// Apenas a laje MAIS ESPESSA conta (não soma)
if (h > maxThicknessFound) {
  maxThicknessFound = h;
}
```

---

## 3. BOAS PRÁTICAS

### 3.1 SSOT (Single Source of Truth)

**v10.1 Update**: 
- `appState.projects[projectId]` é SSOT
- `appState.activeProject` é Proxy (getter para projeto activo)
- localStorage é cache persistente (não fonte de verdade em runtime)

**REGRA DE OURO**: Nunca ler do DOM para cálculos.

```javascript
// ❌ ERRADO - Lê do DOM
function calculateTotal() {
  const area = parseFloat(document.getElementById('zone_area').value);
  return area * 25;
}

// ✅ CORRETO - Lê de projectData
function calculateTotal(zoneId) {
  const zone = projectData.floors
    .flatMap(f => f.zones)
    .find(z => z.id === zoneId);
  return zone.area * 25;
}
```

**Exceções** (leitura do DOM permitida):
1. `collectAllData()` - serialização
2. `updateKPIs()` - display apenas (não cálculo)

---

### 3.2 Validação de Inputs

**Sempre** usar fallbacks com `||`:

```javascript
// ✅ CORRETO
const area = parseFloat(input.value) || 0;
const name = input.value.trim() || '';
const count = parseInt(input.value, 10) || 0;

// ❌ ERRADO (crash se vazio)
const area = parseFloat(input.value);  // NaN se vazio
const name = input.value;              // Pode ser undefined
```

**Validação de Objetos**:
```javascript
// ✅ CORRETO
const floor = projectData.floors.find(f => f.id === floorId);
if (!floor) {
  console.error('Piso não encontrado:', floorId);
  return;
}

// ❌ ERRADO (crash se não existir)
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
      alert('✅ Dados importados com sucesso!');
    } catch (err) {
      console.error('Erro ao importar:', err);
      alert('❌ Ficheiro inválido: ' + err.message);
    }
  };
  reader.readAsText(file);
}
```

**Operações Destrutivas** (confirmação):
```javascript
function deleteFloor(floorId) {
  const floor = projectData.floors.find(f => f.id === floorId);
  if (!floor) return;
  
  // ✅ Confirma se tem zonas
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
// ❌ ERRADO - Múltiplas manipulações (slow)
for (let i = 0; i < 100; i++) {
  const div = document.createElement('div');
  div.textContent = i;
  container.appendChild(div);  // Reflow a cada iteração
}

// ✅ CORRETO - Batch com innerHTML
const html = [];
for (let i = 0; i < 100; i++) {
  html.push(`<div>${i}</div>`);
}
container.innerHTML = html.join('');
```

**Event Delegation** (para listas dinâmicas):
```javascript
// ❌ ERRADO - Event listener em cada item
floors.forEach(floor => {
  document.getElementById(`delete_${floor.id}`)
    .addEventListener('click', () => deleteFloor(floor.id));
});

// ✅ CORRETO - Listener único no container
document.getElementById('floorsList').addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const floorId = parseInt(e.target.dataset.floorId);
    deleteFloor(floorId);
  }
});
```

---

## 4. PROTOCOLOS DE ALTERAÇÃO

### 4.1 Checklist Pré-Alteração

Antes de mexer em código, **SEMPRE** verifica:

- [ ] ID está em `@AGENTE_RISCOS_v2.md`? → Consulta secção relevante
- [ ] Função tem 0 callers? → Procura por nome (pode ser callback string)
- [ ] Mudança afecta `projectData`? → Valida schema em `ESPECIFICACAO.md`
- [ ] Mudança afecta `actionsData`? → Testa com `zonas.html`
- [ ] Mudança em cálculo EC1? → Atualiza **2 lugares** (tabela + gráfico)
- [ ] Listener será removido? → Valida se não quebra sync

---

### 4.2 Alteração de IDs HTML

**Cenário**: Renomear `id_antigo` → `id_novo`

**Procedimento**:
```javascript
// 1. HTML: Altera ID
<input id="id_novo" />  // Era "id_antigo"

// 2. JS: Adiciona fallback em loadAllData()
function loadAllData(data) {
  // ... código existente ...
  
  // MIGRAÇÃO v9.1 → v10: ID renomeado
  if (data.id_antigo && !data.id_novo) {
    data.id_novo = data.id_antigo;
  }
  
  // ... resto da função ...
}

// 3. DOCS: Actualiza @AGENTE_RISCOS_v2.md
// 4. TESTE: Valida import de JSON v9.0
```

---

### 4.3 Alteração de Estrutura `projectData`

**Cenário**: Adicionar campo `floor.tipo`

**Procedimento**:
```javascript
// 1. Schema: Define valor default
function addFloor() {
  const floor = {
    id: Date.now(),
    name: `Piso ${projectData.floors.length}`,
    tipo: 'Corrente',  // 🆕 Novo campo
    // ... campos existentes ...
  };
  projectData.floors.push(floor);
}

// 2. Migração: loadAllData() preenche default
function loadAllData(data) {
  if (data.projectData) {
    projectData = data.projectData;
    
    // MIGRAÇÃO v10: Adiciona campo tipo se não existir
    projectData.floors.forEach(floor => {
      if (!floor.tipo) floor.tipo = 'Corrente';
    });
  }
  // ...
}

// 3. UI: Adiciona input em renderFloors()
// 4. DOCS: Actualiza ESPECIFICACAO.md secção 2.1
// 5. TESTE: Importa JSON v9.1 (sem campo tipo)
```

---

### 4.4 Duplicação de Lógica (EC1)

**ATENÇÃO**: Cálculo de cargas existe em **2 lugares**:

1. **Tabela Analítica** (função fictícia - não existe no código real)
2. **FloorViewer** (método `displayZoneCombinations()`)

**Protocolo** se alterares valores EC1:

```javascript
// 1. Altera tabela em FloorViewer.getCategoryLoad()
getCategoryLoad(category) {
  const loads = {
    'B': 3.5,  // ✏️ Mudou de 3.0 para 3.5
    // ...
  };
  return loads[category] || 3.0;
}

// 2. VALIDAÇÃO: Procura por "categoria B" ou "3.0" no código
//    e garante que não há outra cópia da tabela

// 3. TESTE: Abre Secção 7, clica em zona tipo B, valida qk = 3.5
```

---

## 5. TESTES OBRIGATÓRIOS

Ver `@AGENTE_TESTES.md` para suite completa.

**Mínimo** após qualquer alteração:

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
1. Preenche Secção 1 (ID, Nome)
2. Adiciona 1 piso em Secção 2
3. Adiciona 1 zona (Uso: B, Laje: Maciça 0.25m)
4. Exporta JSON
5. Recarrega página (F5)
6. Importa JSON
7. Valida: Dados idênticos
8. Console: 0 erros
```

---

### 5.3 Integration Test (10 min)

```bash
1. Preenche Secções 1-5 (completo)
2. Activa "Ação Sísmica" (Secção 6)
3. Preenche parâmetros sísmicos (Zona 1.3, q=3.0)
4. Secção 7: Seleciona piso criado
5. Valida: Gráfico sísmico renderiza
6. Modo "Sonda": Clica em zona
7. Valida: Mostra combinações ELU/ELS
8. Exporta JSON + Markdown
```

---

## 6. DOCUMENTAÇÃO OBRIGATÓRIA

### 6.1 Quando Actualizar `@AGENTE_RISCOS_v2.md`

**Triggers**:
- Adicionar ID HTML novo
- Adicionar função crítica (estado, cálculo, IO)
- Adicionar event listener com side-effects
- Alterar estrutura `projectData` ou `actionsData`

**Template**:
```markdown
### X.Y Novo ID/Função

#### ID: `novo_campo`
**Tipo**: Input text
**Usado em**: Secção Z, cálculo de ABC
**Dependências**: Listener em `outro_campo`
```

---

### 6.2 Quando Actualizar `@AGENTE_MIGRACAO.md`

**Triggers**:
- Incremento de versão (vX → vY)
- Alteração arquitectural (ex: adicionar classe nova)
- Breaking change (ex: remover função pública)

**Template**:
```markdown
### [v9.1 → v10.0] - DD/MM/AAAA
**Autor**: Nome do Dev/Agent
**Resumo**: Adiciona funcionalidade X

**Alterações**:
- Novo campo `floor.tipo` em projectData
- Nova função `calculateTipo()`
- Removido método `FloorViewer.oldMethod()` (deprecated)

**Breaking Changes**:
- JSONs v9.1 precisam migração (ver loadAllData())

**Testes**:
- ✅ Import/Export v9.1 → v10.0
- ✅ Todos os regression tests passam
```

---

### 6.3 Quando Actualizar `ESPECIFICACAO.md`

**Triggers**:
- Alteração de schema (projectData, actionsData)
- Nova API pública (função que outros devs usam)
- Mudança de protocolo (postMessage, JSON format)

**Secções afectadas**:
- Secção 2: Schema
- Secção 4: API Interna
- Secção 5: Integração zonas.html
- Apêndice C: Changelog

---

## 7. CODE STYLE

### 7.1 Variáveis

**Preferir `const`** quando possível:
```javascript
// ✅ CORRETO
const floorId = Date.now();
const zones = floor.zones.filter(z => z.area > 10);

// ❌ ERRADO (let desnecessário)
let floorId = Date.now();  // Nunca reatribuído
let zones = floor.zones.filter(...);
```

**Usar `let`** apenas se reatribuição:
```javascript
let total = 0;
for (const zone of zones) {
  total += zone.area;  // Reatribuição necessária
}
```

---

### 7.2 Template Literals

**Preferir** `backticks` para strings com variáveis:

```javascript
// ✅ CORRECTO
const msg = `Piso "${floor.name}" tem ${floor.zones.length} zonas`;

// ❌ ERRADO (concatenação)
const msg = 'Piso "' + floor.name + '" tem ' + floor.zones.length + ' zonas';
```

---

### 7.3 Arrow Functions

**Usar** para callbacks curtos:

```javascript
// ✅ CORRETO
floors.forEach(f => updateFloor(f));
zones.map(z => z.area);
zones.filter(z => z.uso === 'B');

// ❌ ERRADO (function desnecessário)
floors.forEach(function(f) { updateFloor(f); });
```

**NÃO usar** para métodos de classe:

```javascript
class FloorViewer {
  // ✅ CORRETO
  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
  
  // ❌ ERRADO (arrow não tem `this` próprio)
  render = () => {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
```

---

### 7.4 Destructuring

**Usar** quando acede a múltiplos campos:

```javascript
// ✅ CORRETO
const { name, area, cota } = floor;
console.log(name, area, cota);

// ❌ ERRADO (repetição)
console.log(floor.name, floor.area, floor.cota);
```

---

## 8. ANTI-PATTERNS (Evitar)

### 8.1 Global Pollution

```javascript
// ❌ ERRADO - Variável global desnecessária
window.tempData = { ... };

// ✅ CORRETO - Scoped
function processData() {
  const tempData = { ... };
  // Usa tempData localmente
}
```

---

### 8.2 Magic Numbers

```javascript
// ❌ ERRADO
const peso = espessura * 25 + 1.5;

// ✅ CORRETO
const GAMMA_BETAO = 25;  // kN/m³
const REVESTIMENTOS = 1.5;  // kN/m²
const peso = espessura * GAMMA_BETAO + REVESTIMENTOS;
```

---

### 8.3 Deep Nesting

```javascript
// ❌ ERRADO (pirâmide da desgraça)
function example() {
  if (condition1) {
    if (condition2) {
      if (condition3) {
        // ...
      }
    }
  }
}

// ✅ CORRETO (early returns)
function example() {
  if (!condition1) return;
  if (!condition2) return;
  if (!condition3) return;
  // ...
}
```

---

### 8.4 Mutação de Parâmetros

```javascript
// ❌ ERRADO
function addZone(floor, zone) {
  floor.zones.push(zone);  // Mutação directa
}

// ✅ CORRETO
function addZone(floor, zone) {
  return {
    ...floor,
    zones: [...floor.zones, zone]
  };
}
```

**Exceção**: Estruturas `projectData` (estado global mutável por design)

---

## 9. GIT WORKFLOW (Futuro)

**Ainda não implementado**, mas para quando migrarmos:

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
fix(ec1): corrige qk categoria B (3.0 → 3.5)
refactor(viewer): extrai método calculateLoads()
docs(spec): actualiza schema projectData
test(io): adiciona teste import JSON v9.1
```

---

### 9.3 Pull Request Template

```markdown
## Objectivo
[O que esta PR faz]

## Alterações
- [ ] Código
- [ ] Testes
- [ ] Docs

## Breaking Changes
[Lista ou "Nenhum"]

## Testes Executados
- [ ] Smoke test
- [ ] Regression test
- [ ] Integration test

## Checklist
- [ ] Actualizado @AGENTE_RISCOS_v2.md (se aplicável)
- [ ] Actualizado @AGENTE_MIGRACAO.md
- [ ] Actualizado ESPECIFICACAO.md (se schema mudou)
- [ ] Console sem erros
```

---

## 10. TROUBLESHOOTING COMUM

### 10.1 "Dados não carregam após import"

**Sintomas**: JSON importa mas campos ficam vazios

**Causas**:
1. ID mudou entre versões
2. `loadAllData()` não processa novo campo
3. JSON corrupto (sintaxe inválida)

**Debug**:
```javascript
// Cola na console após import
const data = collectAllData();
console.log('IDs no JSON:', Object.keys(data));
console.log('IDs no DOM:', 
  Array.from(document.querySelectorAll('[id]')).map(el => el.id)
);
```

---

### 10.2 "Canvas fica em branco"

**Sintomas**: Secção 7 (Zonamento) não mostra nada

**Causas**:
1. `actionsData` vazio ou undefined
2. Imagem não carregou (`imageData` vazio)
3. Escala incorrecta (`scale = 0`)

**Debug**:
```javascript
const floor = projectData.floors[0];
console.log('actionsData:', floor.actionsData);
console.log('Layers:', floor.actionsData?.layers);
console.log('Blueprint:', floor.actionsData?.blueprint);
```

---

### 10.3 "Cálculos EC1 errados"

**Sintomas**: Sonda mostra valor diferente da tabela

**Causa**: Duplicação de lógica dessincronizada

**Debug**:
```javascript
// Compara ambas as implementações
const category = 'B';

// 1. FloorViewer
const viewer = window.currentFloorViewer;
const qk1 = viewer.getCategoryLoad(category);

// 2. Verifica se há outra função com mesma lógica
// (procura por "case 'B':" no código)
```

### 10.4 "Dados não aparecem após voltar ao lobby"

**Sintomas**: Editar projeto → Voltar lobby → Reabrir → Campos vazios

**Causas**:
1. `saveCurrentProject()` não chamado ao voltar
2. `loadProjectsFromStorage()` não reconstrói Maps

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

## 11. RECURSOS ÚTEIS

### 11.1 Docs Internas
- `ESPECIFICACAO.md` - Schema e API
- `@AGENTE_RISCOS_v2.md` - IDs e funções críticas
- `@AGENTE_TESTES.md` - Suite de testes
- `@AGENTE_ROADMAP.md` - Evolução futura

### 11.2 Normas (Referência)
- EC0: Bases de projecto
- EC1: Acções em estruturas
- EC2: Projecto de estruturas de betão
- EC8: Projecto de estruturas para resistência aos sismos

### 11.3 Bibliotecas
- Chart.js: https://www.chartjs.org/docs/
- Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

---

## 12. GLOSSÁRIO

**SSOT**: Single Source of Truth - `projectData` é a única fonte de verdade  
**ELU**: Estado Limite Último (Ultimate Limit State)  
**ELS**: Estado Limite de Serviço (Serviceability Limit State)  
**qk**: Sobrecarga característica (kN/m²)  
**EC1/EC8**: Eurocódigo 1 (Ações) / Eurocódigo 8 (Sismo)  
**RCP**: Revestimentos, Cargas Permanentes  
**γ**: Peso volúmico (kN/m³)  
**ψ0, ψ1, ψ2**: Coeficientes de combinação EC0

---

**Fim das Guidelines v9.1**  
**Próxima leitura**: `ESPECIFICACAO.md` para detalhes técnicos completos
