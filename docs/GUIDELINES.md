# SSOT JSJ — Guidelines de Desenvolvimento v11.0

**Público-Alvo:** Developers, Code Agents (Claude Code, Cursor)  
**Objectivo:** Padrões e boas práticas para manter consistência no código  
**Última Actualização:** 15/02/2026

---

## 1. NAMING CONVENTIONS

### 1.1 IDs HTML — `snake_case` (obrigatório)
```html
<!-- ✅ CORRECTO -->
<input id="id_jsj" />
<input id="geo_tipo_sismo" />

<!-- ❌ ERRADO -->
<input id="idJsj" />
<input id="sismo-terreno" />
```

**IDs Dinâmicos** (gerados por JS): `{tipo}_{id}` — ex: `floor_name_${floorId}`

**REGRA CRÍTICA**: IDs são chave de persistência. Nunca alterar sem migração (ver `RISCOS.md` §6).

### 1.2 Variáveis JavaScript — `camelCase`
```javascript
let projectData = {};
const floorId = Date.now();
function updateKPIs() {}
```

**Constantes Globais**: `UPPER_SNAKE_CASE`
```javascript
const MAX_FLOORS = 100;
const GAMMA_BETAO = 25;  // kN/m³
```

### 1.3 Classes — `PascalCase`
```javascript
class FloorViewer {}
class ZoneCalculator {}
```

### 1.4 CSS Classes — `kebab-case`
```css
.zone-modal {}
.btn-primary {}
.load-breakdown-item {}
```

---

## 2. ESTRUTURA DE CÓDIGO

### 2.1 Ordem de Declaração
```javascript
// 0. IMPORTS (scripts externos)
// 1. VARIÁVEIS GLOBAIS
// 2. CONSTANTES
// 3. CLASSES
// 4. FUNÇÕES DE ESTADO (collectAllData, loadAllData)
// 5. FUNÇÕES DE UI
// 6. FUNÇÕES DE CÁLCULO
// 7. EVENT LISTENERS (ao fim)
```

### 2.2 Indentação — 2 espaços (não tabs)

### 2.3 Comentários Obrigatórios

**Funções críticas** (listadas em `RISCOS.md`):
```javascript
/**
 * Serializa todo o estado da aplicação para JSON
 * @returns {Object} JSON com campos fixos + projectData
 * 🔥 CRÍTICO: Não alterar sem validar compatibilidade JSONs antigos
 */
function collectAllData() { ... }
```

**Cálculos EC1/EC8**:
```javascript
// Categoria B: Escritórios (EC1-1-1 Tabela 6.2)
// qk = 3.0 kN/m², ψ0 = 0.7, ψ1 = 0.5, ψ2 = 0.3
```

**Workarounds**:
```javascript
// v6 WORKAROUND: Max-thickness rule para lajes sobrepostas
// Apenas a laje MAIS ESPESSA conta (não soma)
```

---

## 3. BOAS PRÁTICAS

### 3.1 SSOT (Single Source of Truth)
**REGRA DE OURO**: Nunca ler do DOM para cálculos — ler de `projectData`.

```javascript
// ❌ ERRADO
const area = parseFloat(document.getElementById('zone_area').value);

// ✅ CORRECTO
const zone = projectData.floors.flatMap(f => f.zones).find(z => z.id === zoneId);
return zone.area * 25;
```

**Excepções** (leitura DOM permitida): `collectAllData()`, `updateKPIs()` (display only).

### 3.2 Validação de Inputs — Sempre fallbacks
```javascript
const area = parseFloat(input.value) || 0;
const name = input.value.trim() || '';
```

### 3.3 Validação de Objectos — Guard clauses
```javascript
const floor = projectData.floors.find(f => f.id === floorId);
if (!floor) { console.error('Piso não encontrado:', floorId); return; }
```

### 3.4 Error Handling — try/catch em IO
```javascript
try {
  const data = JSON.parse(e.target.result);
  loadAllData(data);
} catch (err) {
  console.error('Erro ao importar:', err);
  alert('Ficheiro inválido: ' + err.message);
}
```

### 3.5 Confirmação em Operações Destrutivas
```javascript
if (floor.zones.length > 0) {
  if (!confirm(`Piso "${floor.name}" tem ${floor.zones.length} zona(s). Apagar?`)) return;
}
```

### 3.6 Performance — Batch DOM, Event Delegation
```javascript
// Batch: innerHTML em vez de appendChild em loop
container.innerHTML = items.map(i => `<div>${i}</div>`).join('');

// Delegation: listener único no container
container.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    deleteFloor(parseInt(e.target.dataset.floorId));
  }
});
```

---

## 4. FIREBASE PATTERNS (v11.0+)

### 4.1 Async/Await Obrigatório
```javascript
// ✅ CORRECTO
async function saveProject() {
  await saveProjectToFirestore(data);
}

// ❌ ERRADO — não aguarda
function saveProject() {
  saveProjectToFirestore(data);
  console.log('Saved'); // Executa antes do save
}
```

### 4.2 Maps ↔ Arrays Serialização
```javascript
// Runtime → Firestore
const serialized = Array.from(floors.values()).map(f => ({
  ...f, zones: Array.from(f.zones.values())
}));

// Firestore → Runtime (inverso)
```

### 4.3 Listener Cleanup
```javascript
let unsubscribe = subscribeToProject(id, callback);
window.addEventListener('beforeunload', () => {
  if (unsubscribe) unsubscribe();
});
```

### 4.4 Focus-Aware Updates
```javascript
if (!document.hasFocus()) {
  loadAllData(updatedData); // Só actualiza se user não está a editar
}
```

---

## 5. CODE STYLE

### 5.1 Preferir `const`, usar `let` só se reatribuição
### 5.2 Template literals para strings com variáveis
### 5.3 Arrow functions para callbacks curtos, NÃO para métodos de classe
### 5.4 Destructuring quando acede a múltiplos campos
### 5.5 Early returns em vez de deep nesting
### 5.6 Evitar magic numbers — usar constantes nomeadas

---

## 6. ANTI-PATTERNS

- **Global Pollution**: Não usar `window.tempData` — scoped variables
- **Magic Numbers**: `espessura * 25 + 1.5` → usar `GAMMA_BETAO` e `REVESTIMENTOS`
- **Deep Nesting**: Usar early returns
- **Mutação de Parâmetros**: Retornar novo objecto (excepção: `projectData` mutável por design)

---

## 7. GIT WORKFLOW

### Branch Naming
```
feature/adiciona-campo-tipo-piso
fix/corrige-calculo-ec1-categoria-b
refactor/extrai-logica-lajes
```

### Commit Messages — `tipo(scope): mensagem`
```
feat(pisos): adiciona campo tipo
fix(ec1): corrige qk categoria B
refactor(viewer): extrai método calculateLoads()
```

---

## 8. GLOSSÁRIO

| Termo | Significado |
|---|---|
| SSOT | Single Source of Truth — `projectData` é a única fonte de verdade |
| ELU | Estado Limite Último (Ultimate Limit State) |
| ELS | Estado Limite de Serviço (Serviceability Limit State) |
| qk | Sobrecarga característica (kN/m²) |
| EC1/EC8 | Eurocódigo 1 (Acções) / Eurocódigo 8 (Sismo) |
| RCP | Revestimentos, Cargas Permanentes |
| γ | Peso volúmico (kN/m³) |
| ψ0, ψ1, ψ2 | Coeficientes de combinação EC0 |

---

**Próxima leitura:** `ESPECIFICACAO.md` para schema técnico completo

*Última actualização: 15/02/2026 (v11.0)*
