# ⚠️ ZONA DE PERIGO: MAPA DE DEPENDÊNCIAS E RISCOS

**Versão:** v11.1 (Firebase Storage Layer)  
**Instrução para o Agente:** Não refatorizar ou alterar estas secções sem validação profunda.  
**Última Actualização:** 15/02/2026

---

## 1. TABELA DE IMPACTOS CRÍTICOS

| Origem (Se mexeres aqui...) | Impacto (Isto parte...) | Gravidade | Motivo |
| :--- | :--- | :--- | :--- |
| **`projectData.floors`** (Adicionar/Remover campo) | **Secção 7 (Acções)** | 🔥 ALTA | `updateActionsFloorTabs()` gera abas dinamicamente. Se estrutura mudar, UI fica vazia. |
| **`zone.uso`** (Alterar valores select ou campo) | **Cálculo de Cargas (Secção 7)** | 🔥 ALTA | `renderZoneActions()` e `getUsoCategoryData()` lêem categoria EC1. Mudança quebra qk/psi. |
| **`geo_tipo_sismo`** (ID ou listener) | **Acção Sísmica (Secção 7)** | 🔥 ALTA | Listener copia para `sismo_terreno`. Quebrar dessincroniza inputs. |
| **Estrutura `actionsData`** (layers/shapes) | **Viewer 2D + Editor (zonas.html)** | 🔥 ALTA | `postMessage` espera formato específico. Alteração unilateral quebra comunicação. |
| **`FloorViewer` (classe)** | **Canvas Secção 7** | 🔥 ALTA | Motor gráfico completo. Alterar assinatura de métodos quebra renderização. |
| **`collectAllData()` / `loadAllData()`** | **Import/Export JSON** | 🔥 CRÍTICA | Persistência. Alteração quebra compatibilidade com JSONs antigos. |
| **Firebase CRUD functions** (v11.0+) | **Multi-user sync + Auth** | 🔥 CRÍTICA | Alterar serialização quebra Firestore. Memory leaks se listeners não limpos. |
| **Storage Layer functions** (v11.1+) | **Image persistence + Lazy load** | 🔥 CRÍTICA | Alterar URL schema quebra migration. TTL errado causa 404s. |

---

## 2. IDS HTML PROTEGIDOS

### 2.1 Secção 1 – Identificação
```
id_jsj, nome_projeto, cliente, designacao, localizacao
tipologia, especialidade, tipo_obra, tipo_obra_custom, fase_atual
fase_ep_data, fase_ep_estado, fase_lic_data, fase_lic_estado
fase_exec_data, fase_exec_estado, fase_at_data, fase_at_estado
resp_tecnico, equipa_eng, bim, gestao_projeto, fiscalizacao
promotor, arquitetura, especialidades, bim_manager, outros_equipa
```

### 2.2 Secção 3 – Elementos Base
```
arq, mep, escav, geotec, hidro, prosp, carac, insp, ensaios, orig, outros
```

### 2.3 Secção 4 – Condicionantes
```
cond_arq
```

### 2.4 Secção 5 – Geotecnia
```
geo_form, geo_horiz, geo_sub, geo_nat
geo_tipo_sismo      # 🔥 CRÍTICO: Tipo solo EC8 (tem listener!)
geo_sigma_adm
hidro_nf, hidro_col, hidro_xa, hidro_obs
```

### 2.5 Secção 6 – Solução Estrutural
```
sol_desc
```

### 2.6 Secção 7 – Checkboxes de Activação
```
act_graviticas      # Sempre true (hardcoded)
act_sismo, act_vento, act_impulsos, act_retracao
act_temperatura, act_neve, act_agua
```

### 2.7 Secção 7 – Parâmetros Sísmicos
```
sismo_zona, sismo_terreno (🔥 auto-sync), sismo_imp, sismo_q, sismo_amort
```

### 2.8 Secção 7 – Outros Parâmetros
```
vento_zona, vento_vb0, vento_cat, vento_z0, vento_co, vento_cpi
impulsos_h, impulsos_gamma, impulsos_phi, impulsos_c, impulsos_k0, impulsos_q
retracao_hr, retracao_t0, retracao_cimento, retracao_cura
temp_contracao, temp_expansao, temp_alfa, temp_tref
neve_zona, neve_alt, neve_sk, neve_ce, neve_ct, neve_mu
agua_nivel, agua_gamma, agua_sub, agua_dren
```

### 2.9 Secção 8 – Critérios
```
crit_reg, crit_dim
```

### 2.10 KPIs (Read-Only)
```
kpiID, kpiNome, kpiFase, kpiImplant, kpiABC, kpiPisos, kpiAltura
```

### 2.11 IDs Dinâmicos (Criados por JS)
Padrão: `floor_name_{floorId}`, `zone_uso_{zoneId}`, etc.
Criados por `addFloor()` e `renderZoneForm()` – NÃO aparecem no HTML base.

---

## 3. FUNÇÕES PROTEGIDAS

### 3.1 Estado
```
initializeProjectData()    collectAllData()    loadAllData(data)
```

### 3.2 UI Dinâmica
```
updateKPIs()
addFloor()    renderFloors()    deleteFloor()    toggleFloorZones()
updateFloorName()    updateFloorCota()
openAddZoneModal()    openEditZoneModal()    renderZoneForm()
closeZoneModal()    saveZone()    deleteZone()
calculateEquivThickness()    updateGeneralStats()
addGeoRow()    renderGeoTable()
toggleActionSection()    toggleActionBody()
updateActionsFloorTabs() (🔥)    selectActionsFloor()    selectActionsZone()
```

### 3.3 Cálculo EC1/EC8
```
renderZoneActions() (🔥)    getUsoCategoryData() (🔥)
openAddPermanentModal()    addPermanentAction()    deletePermanentAction()
openWallsModal()    renderWallsTable()    addWallRow()    calculateWalls()    saveWalls()
generateSeismicCharts() (🔥)    generateSeismicChart()
```

### 3.4 Motor Gráfico
```
class FloorViewer { constructor, calculatePointELU (🔥), displayZoneCombinations,
  drawShapes, handleClick/MouseDown/MouseMove/MouseUp,
  pointInPolygon, polygonArea, getCategoryLoad (🔥), loadImage (🔥 v11.1) }
openZonesEditor() (🔥)    initFloorViewer()    populateZonamentoFloorSelector()
```

### 3.5 IO
```
exportJSON()    importJSON()    exportMarkdown()    generateMarkdownReport()
```

### 3.6 Firebase v11.0
```
# firebase-data.js
createProjectInFirestore() (🔥)    loadAllProjectsFromFirestore() (🔥)
loadSingleProject() (🔥)    saveProjectToFirestore() (🔥)
deleteProjectFromFirestore() (🔥)    subscribeToProject() (🔥)
serializeFloorsMap()    deserializeFloorsArray()
sanitizeNestedArrays() (🔥)    deserializeNestedStrings() (🔥)

# Index_v11.0.html
initEditor(user) (🔥)    saveCurrentProject() (🔥 async)    backToLobby() (🔥 async)

# lobby.html
loadProjects() (🔥)    createProject() (🔥)    deleteProject() (🔥)
```

**Regras Firebase:**
- `saveCurrentProject()` é async – sempre `await`
- `subscribeToProject()` retorna unsubscribe – SEMPRE limpar em `beforeunload`
- `initEditor(user)` depende de auth – não chamar se user null
- Real-time listener só re-renderiza se `!document.hasFocus()`
- Auto-save 30s – não reduzir (custo Firestore)

### 3.7 Firebase Storage v11.1 🆕
```
# firebase-data.js (Generic Layer)
uploadAsset(projectId, path, file, metadata) (🔥)
getAssetURL(storageURL, cachedURL, expiry) (🔥)
deleteAsset(storageURL) (🔥)

# Floor-specific wrappers
uploadFloorImage(projectId, floorId, file) (🔥)
getFloorImageURL(floor) (🔥)
deleteFloorImage(storageURL) (🔥)

# Index_v11.1.html
FloorViewer.loadImage(floor) (🔥 async lazy load)

# Migration
migrateFloorImagesToStorage() (🔥 one-time script)
```

**Regras Storage:**
- **NUNCA** alterar storage path pattern (`projects/{id}/floors/{id}/image.png`)
- **TTL fixo 7 dias** – não mudar sem impacto analysis
- **Lazy load obrigatório** – sem eager load no lobby
- **Cache client-side** – `URL.createObjectURL()` + flag `floor.imageLoaded`
- **Migration script** – backup Firestore antes de executar

---

## 4. EVENT LISTENERS CRÍTICOS

| Listener | Motivo | Ficheiro |
|---|---|---|
| `geo_tipo_sismo` → `change` → copia para `sismo_terreno` | Sync Secção 5 ↔ 7 | Index |
| `window` → `message` → `zonesData` → `floor.actionsData` + save | Comunicação com zonas.html | Index |
| Inputs → `input` → `updateKPIs()` | KPIs tempo real | Index |
| Canvas → click/mousedown/mousemove/mouseup | Interactividade Viewer 2D | FloorViewer |
| `window` → `beforeunload` → `unsubscribe()` | Limpar listener Firestore | Index |

---

## 5. DUPLICAÇÃO DE LÓGICA EC1

Cálculo de cargas existe em **DOIS lugares**:
1. `renderZoneActions(floor, zone)` – tabela HTML
2. `FloorViewer.displayZoneCombinations()` – heatmap Canvas

**REGRA**: Se alterares fórmula numa → TENS de alterar na outra.

---

## 6. INTEGRIDADE DOS IDs HTML

Se mudares o `id` de um input → `collectAllData()` deixa de o serializar → JSONs antigos perdem dados silenciosamente.

**Migração segura**: Adiciona fallback em `loadAllData()` + testa com JSON antigo.

---

## 7. CONTRATO zonas.html (postMessage)

```javascript
// zonas.html → Index:
{ type: 'zonesData', data: { blueprint: {...}, layers: { "Estrutura": [...], "Sobrecargas": [...], "Paredes_RP": [...] } } }
```
Se mudares estrutura → altera em AMBOS os ficheiros + testa Viewer 2D.

---

## 8. CHECKLIST PRÉ-ALTERAÇÃO

- [ ] ID está neste documento? → Pede confirmação
- [ ] Função tem 0 callers? → Procura por nome (pode ser callback)
- [ ] Afecta `projectData`? → Valida schema em `ESPECIFICACAO.md`
- [ ] Afecta `actionsData`? → Testa zonas.html
- [ ] Cálculo EC1? → Altera AMBOS os lugares (§5)
- [ ] Listener removido? → Valida sync
- [ ] Firebase async? → Valida await + error handling
- [ ] Storage path mudado? (v11.1) → Quebra migration script

---

## 9. RISCOS FIREBASE v11.0

### 9.1 Nested Arrays
Firestore rejeita arrays aninhados. `sanitizeNestedArrays()` / `deserializeNestedStrings()` fazem stringify/parse. **NUNCA remover.**

### 9.2 Memory Leaks
`onSnapshot` continua após sair. Sempre guardar `unsubscribe` e limpar em `beforeunload`.

### 9.3 Focus-Aware Updates
Real-time update pode sobrescrever edição. Verificar `!document.hasFocus()` antes de `loadAllData()`.

---

## 10. RISCOS FIREBASE STORAGE v11.1 🆕

### 10.1 Storage Path Pattern
```
projects/{projectId}/floors/{floorId}/image.png
```
**CRÍTICO**: Se mudares padrão → Migration script quebra. Sempre manter compatibilidade.

### 10.2 URL Expiration (Cache TTL)
- Download URLs têm TTL **7 dias**
- `getFloorImageURL()` regenera se expirado
- **NÃO alterar TTL** sem validar impacto (API calls vs freshness)

### 10.3 Lazy Loading Dependency
```javascript
// ❌ NUNCA fazer eager load
floors.forEach(f => loadImage(f));

// ✅ SEMPRE lazy load
if (!floor.imageLoaded) {
  await FloorViewer.loadImage(floor);
}
```
**Motivo**: 10 floors × 500KB = 5MB download upfront → timeout/crash.

### 10.4 Security Rules Sync
Storage Rules **DEVEM** validar ownership via Firestore:
```javascript
firestore.get(/databases/(default)/documents/projects/$(projectId)).data.owner == request.auth.uid
```
Se mudares Firestore schema → **actualiza Storage Rules**.

### 10.5 Migration Script (One-Time)
`migrate-v11.0-to-v11.1.html`:
- **SEMPRE** backup Firestore antes
- **NUNCA** executar 2x (duplica Storage blobs)
- **VALIDAR** todos os floors têm `imageURL` após migração

### 10.6 Quota Limits (Spark Plan)
- Storage: 5GB free
- Downloads: 1GB/dia free
- **Monitor usage** a 80% → alerta
- **Não redimensionar imagens** client-side em v11.1 (v11.2+)

---

## 11. DEPENDÊNCIAS CRUZADAS STORAGE v11.1 🆕

| Função | Depende de | Se quebrar |
|--------|-----------|------------|
| `uploadFloorImage()` | Auth user, projectId válido | Upload falha, sem rollback |
| `getFloorImageURL()` | `floor.imageURL` existe | 404 em Viewer |
| `FloorViewer.loadImage()` | `getFloorImageURL()` retorna URL válido | Canvas branco |
| `deleteFloor()` | Chama `deleteFloorImage()` ANTES de remover doc | Storage leak (blob órfão) |
| Migration script | Firestore read permissions | Migração parcial |

**REGRA**: Sempre chamar Storage delete **antes** de Firestore delete.

---

## 12. BREAKING CHANGES v11.1

### 12.1 Schema Floor (Firestore)
```javascript
// v11.0 (ANTIGO)
floor = {
  imageData: "data:image/png;base64,iVBOR..." // ~500KB
}

// v11.1 (NOVO)
floor = {
  imageURL: "gs://bucket/projects/{id}/floors/{id}/image.png",
  imageDownloadURL: "https://firebasestorage.googleapis.com/...",
  imageURLExpiry: 1739750400000  // timestamp
}
```

**Impacto**: JSONs v11.0 **incompatíveis** com v11.1 (requer migration).

### 12.2 FloorViewer API
```javascript
// v11.0 (ANTIGO)
new FloorViewer(canvasId, floorData); // Sync

// v11.1 (NOVO)
const viewer = new FloorViewer(canvasId, floorData);
await viewer.loadImage(floor); // Async
```

**Impacto**: Código que depende de imagem síncrona quebra.

---

*Última actualização: 15/02/2026 (v11.1)*
