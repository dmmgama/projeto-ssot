# ⚠️ ZONA DE PERIGO: MAPA DE DEPENDÊNCIAS E RISCOS

**Versão:** v11.1 (Supabase Backend + Schema Blocos)  
**Instrução para o Agente:** Não refatorizar ou alterar estas secções sem validação profunda.  
**Última Actualização:** 15/02/2026

---

## 1. TABELA DE IMPACTOS CRÍTICOS

| Origem (Se mexeres aqui...) | Impacto (Isto parte...) | Gravidade | Motivo |
| :--- | :--- | :--- | :--- |
| **`projectData.blocos`** (Estrutura Maps) | **Secção 2 + Secção 7 (Acções)** | 🔥 CRÍTICA | `renderBlocos()` e `populateActionsBlocoSelector()` iteram Maps. Mudar quebra UI. |
| **`zona.uso`** (Alterar valores ou campo) | **Cálculo de Cargas (Secção 7)** | 🔥 ALTA | `FloorViewer.getCategoryLoad()` lê categoria EC1. Mudança quebra qk/psi. |
| **`geo_tipo_sismo`** (ID ou listener) | **Acção Sísmica (Secção 7)** | 🔥 ALTA | Listener copia para `sismo_terreno`. Quebrar dessincroniza inputs. |
| **`actions_data.layers`** (Estrutura JSONB) | **Viewer 2D + Editor (zonas.html)** | 🔥 ALTA | `postMessage` espera formato específico. Alteração quebra comunicação. |
| **`FloorViewer` (classe)** | **Canvas Secção 7** | 🔥 ALTA | Motor gráfico completo. Alterar métodos quebra renderização. |
| **`collectAllData()` / `loadAllData()`** | **Import/Export + Auto-save** | 🔥 CRÍTICA | Persistência. Alteração quebra compatibilidade. |
| **Supabase RLS policies** | **Security + Auth** | 🔥 CRÍTICA | RLS misconfiguration expõe dados entre users. |
| **Foreign keys (CASCADE)** | **Data integrity** | 🔥 CRÍTICA | Remover CASCADE apaga dados órfãos silenciosamente. |
| **Tabela `project_files`** | **Catálogo servidor legacy** | 🟡 MÉDIA | Links UNC dependem de rede JSJ. Quebrar inutiliza histórico. |
| **`pisos.image_path`** (Storage path) | **Lazy loading imagens** | 🔥 ALTA | Alterar path pattern quebra Supabase Storage policies. |
| **🆕 `get_effective_param()` SQL function** | **Inherit-or-Override pattern (materiais/sismo/vento)** | 🔥 CRÍTICA | Função corrompida → TODOS cálculos params efetivos falham (NULL). |
| **🆕 `floors.floor_type` ENUM** | **Tipologia pisos (fundação/térreo/elevado/cobertura)** | 🟡 MÉDIA | Typo em INSERT rejeita row (constraint violation). |

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

### 2.11 🆕 Selectores Blocos (v11.1)
```
actionsBlockSelector    # Selector Bloco na Secção 7
actionsFloorSelector    # Selector Piso (filtered by bloco)
zonamentoFloorSelector  # Selector Piso no Viewer 2D
```

### 2.12 IDs Dinâmicos (Criados por JS)
**NOTA v11.1**: Agora com UUIDs PostgreSQL (não timestamps)

Padrão runtime (Maps):
```javascript
bloco_name_{blocoId}        // UUID
piso_name_{pisoId}          // UUID
piso_cota_{pisoId}          // UUID
piso_tipologia_{pisoId}     // UUID 🆕 Editável
zona_name_{zonaId}          // UUID
zona_uso_{zonaId}           // UUID
// ... etc
```

### 2.13 🆕 Floor Type Enum (v11.1)

**Campo:** `floors.floor_type`  
**Valores Permitidos:** `'fundacao'`, `'terreo'`, `'elevado'`, `'cobertura'`

**Risco:** Code typo → INSERT inválido  

**Exemplo Erro:**
```javascript
// ❌ ERRO (typo)
await createFloor({floor_type: 'elevation'});  
// PostgreSQL rejeita: invalid input value for enum floor_type: "elevation"

// ✅ CORRECTO
await createFloor({floor_type: 'elevado'});
```

**Validação Obrigatória:**
- UI dropdown (só permite valores válidos)
- PostgreSQL ENUM constraint automático
- Client-side validation antes de INSERT

**Mitigação:**
```javascript
// supabase-data.js
const FLOOR_TYPES = ['fundacao', 'terreo', 'elevado', 'cobertura'];

async function createFloor(pisoData) {
  if (!FLOOR_TYPES.includes(pisoData.floor_type)) {
    throw new Error(`Invalid floor_type: ${pisoData.floor_type}`);
  }
  // ... proceed
}
```

**Impacto Futuro (v14.0 React):**
```typescript
// TypeScript enum (type-safe)
enum FloorType {
  FUNDACAO = 'fundacao',
  TERREO = 'terreo',
  ELEVADO = 'elevado',
  COBERTURA = 'cobertura'
}
```

---

## 3. FUNÇÕES PROTEGIDAS

### 3.1 Estado
```
initializeProjectData()
collectAllData()      # 🆕 v11.1: Apenas metadata project-level
loadAllData(projectId)  # 🆕 v11.1: Query PostgreSQL com JOINs
updateKPIs()
```

### 3.2 UI Dinâmica – Blocos 🆕
```
renderBlocos()              # Accordion hierárquico
addBloco(projectId)
deleteBloco(blocoId)
updateBloco(blocoId, field, value)
toggleBlocoContent(blocoId)
```

### 3.3 UI Dinâmica – Pisos (Modificado)
```
addPiso(blocoId, tipologia)     # 🆕 Com tipologia
deletePiso(pisoId)
updatePiso(pisoId, field, value)  # 🆕 Editável (nome/cota/tipologia)
togglePisoZonas(pisoId)
```

### 3.4 UI Dinâmica – Zonas (Modificado)
```
openAddZonaModal(pisoId)      # 🆕 pisoId em vez de floorId
openEditZonaModal(pisoId, zonaId)
renderZonaForm(zona)
closeZonaModal()
saveZona(pisoId, zonaData)    # 🆕 Async Supabase upsert
deleteZona(zonaId)
```

### 3.5 Cálculos EC1/EC8 (Mantidos)
```
calculateEquivThickness(tipo, h)
updateGeneralStats()
getUsoCategoryData() (🔥)
openAddPermanentModal()
addPermanentAction()
deletePermanentAction(zoneId, index)
openAddWallModal()
addWall()
deleteWall(zoneId, index)
```

### 3.6 Acções (Mantidos)
```
toggleActionSection(name, enabled)
updateActionsFloorTabs()
selectActionsFloor(floorId, btn)
renderZoneActions(piso, zona) (🔥 DUPLICA LÓGICA §5)
generateSeismicChart(canvasId, zona, terreno, q, amort, type)
```

### 3.7 Geotecnia (Mantidos)
```
addGeoRow()
deleteGeoRow(index)
renderGeoTable()
```

### 3.8 Motor Gráfico (Mantidos)
```
initFloorViewer()
populateZonamentoFloorSelector()
openZonesEditor(floorId)
class FloorViewer {
  loadFloor(floorId)
  renderZones()
  calculatePointELU(x, y) (🔥)
  displayZoneCombinations() (🔥 DUPLICA LÓGICA §5)
  getCategoryLoad(category) (🔥)
}
```

### 3.9 🆕 Supabase CRUD (v11.1)
```
// Auth
signupUser(email, password)
loginUser(email, password)
logoutUser()
getCurrentUser()

// Projects
createProject(data)
getProject(id)
listUserProjects()
updateProject(id, updates)
deleteProject(id)

// Blocos
createBlock(projectId, data)
getBlock(id)
updateBlock(id, updates)
deleteBlock(id)

// Pisos
createFloor(blockId, projectId, data)
updateFloor(id, updates)
deleteFloor(id)

// Zonas
createZone(floorId, projectId, data)
updateZone(id, updates)
deleteZone(id)

// Storage
uploadFloorImage(floorId, projectId, file)
getFloorImageURL(floorId)
deleteFloorImage(floorId)

// Realtime
subscribeToProject(projectId)
```

---

## 4. EVENT LISTENERS CRÍTICOS

### 4.1 Sync Geotécnica ↔ Sismo (🔥 NÃO TOCAR)
```javascript
// Linha ~3800 (Index_v11.1.html)
const geoSismo = document.getElementById('geo_tipo_sismo');
const sismoTerreno = document.getElementById('sismo_terreno');

sismoTerreno.value = geoSismo.value;  // Init sync

geoSismo.addEventListener('change', () => {
  sismoTerreno.value = geoSismo.value;  // Live sync
});
```

**Risco:** Remover listener → `sismo_terreno` dessincronizado → EC8 errado.

### 4.2 🆕 Inherit-or-Override Radio Buttons (v11.1)
```javascript
// UI Nível 2: Radio buttons "Global / Por Bloco"
document.querySelectorAll('input[name="materiais_scope"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (e.target.value === 'global') {
      // Mostra 1 formulário global
      document.getElementById('materiaisGlobalForm').style.display = 'block';
      document.getElementById('materiaisBlocosForm').style.display = 'none';
    } else {
      // Mostra tabs por bloco
      document.getElementById('materiaisGlobalForm').style.display = 'none';
      document.getElementById('materiaisBlocosForm').style.display = 'block';
      populateBlocoTabs();
    }
  });
});
```

**Risco:** Remover listener → UI não troca entre global/per-block.

---

## 5. DUPLICAÇÃO DE LÓGICA EC1

Cálculo de cargas existe em **DOIS lugares**:
1. `renderZoneActions(piso, zona)` – tabela HTML (Secção 7 inferior)
2. `FloorViewer.displayZoneCombinations()` – heatmap Canvas (Secção 7 Viewer)

**REGRA**: Se alterares fórmula numa → TENS de alterar na outra.

**Exemplo**: Max-Thickness Rule (v6+)
```javascript
// AMBOS os lugares têm esta lógica:
let maxThicknessFound = 0;
for (layerName in layers) {
  if (layerName === 'Estrutura') {
    const h = parseFloat(zone.manualLoad);
    if (h > maxThicknessFound) {
      maxThicknessFound = h;
      G = (h * 25) + 1.5;  // Sobrescreve (não acumula!)
    }
  }
}
```

---

## 6. INTEGRIDADE DOS IDs HTML

Se mudares o `id` de um input → `collectAllData()` deixa de o serializar → dados perdidos.

**Migração segura v11.1**:
1. Adiciona novo campo na tabela `projects` (ALTER TABLE)
2. Actualiza `collectAllData()` para ler novo ID
3. Actualiza `loadAllData()` para popular novo ID
4. Testa com projeto existente
5. Deploy migration SQL

---

## 7. CONTRATO zonas.html (postMessage)
```javascript
// zonas.html → Index:
{
  type: 'zonesData',
  data: {
    blueprint: {...},
    layers: {
      "Estrutura": [
        {
          id: 123,
          design: "L1",
          uso: "B",
          manualLoad: "0.25",
          shapes: [[[{x:100, y:200}]]]  // 🆕 v11.1: Array nativo (não string!)
        }
      ],
      "Sobrecargas": [...],
      "Paredes_RP": [...]
    }
  }
}
```

**🆕 v11.1 MUDANÇA**: `shapes` agora é array nativo (PostgreSQL JSONB), não string JSON.

Se mudares estrutura → altera em AMBOS os ficheiros:
1. `zonas.html` (envia)
2. `Index_v11.1.html` (recebe + FloorViewer renderiza)

**Testa**: Viewer 2D após editar em zonas.html

---

## 8. CHECKLIST PRÉ-ALTERAÇÃO

- [ ] ID está neste documento? → Pede confirmação
- [ ] Função tem 0 callers? → Procura por nome (pode ser callback)
- [ ] Afecta `projectData.blocos`? → Valida schema em `ESPECIFICACAO.md`
- [ ] Afecta `actions_data`? → Testa zonas.html
- [ ] Cálculo EC1? → Altera AMBOS os lugares (§5)
- [ ] Listener removido? → Valida sync
- [ ] Supabase async? → Valida `await` + error handling
- [ ] Storage path mudado? → Quebra Supabase Storage policies
- [ ] RLS policy alterada? → Testa ownership validation
- [ ] Foreign key CASCADE mudado? → Testa delete cascading
- [ ] 🆕 Floor type typo? → Valida dropdown values
- [ ] 🆕 Inherit-or-Override params? → Testa `get_effective_param()` SQL function

---

## 9. RISCOS SUPABASE v11.1 🆕

### 9.1 RLS Misconfiguration
**Problema**: Policy mal escrita expõe dados entre users.

**Exemplo perigoso**:
```sql
-- ❌ ERRADO: Qualquer user autenticado vê todos projects
CREATE POLICY "bad_policy" ON projects
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ✅ CORRECTO: Apenas owner vê
CREATE POLICY "correct_policy" ON projects
  FOR SELECT USING (user_id = auth.uid());
```

**Validação**: Testar com 2 users diferentes (@jsj.pt):
1. User A cria project
2. User B tenta aceder project de A
3. Esperado: 403 Forbidden (RLS bloqueia)

**Mitigação**: SEMPRE testar policies com multi-user (ver TESTES.md §1.6).

---

### 9.2 Foreign Key Cascade Deletion
**Problema**: Apagar `projects` row → CASCADE apaga blocos/pisos/zonas silenciosamente.

**Validação**:
```sql
-- Antes de DELETE project
SELECT COUNT(*) FROM blocos WHERE project_id = 'uuid';
SELECT COUNT(*) FROM pisos WHERE project_id = 'uuid';
SELECT COUNT(*) FROM zonas WHERE project_id = 'uuid';

-- DELETE project
DELETE FROM projects WHERE id = 'uuid';

-- Validar CASCADE funcionou
SELECT COUNT(*) FROM blocos WHERE project_id = 'uuid';  -- Esperado: 0
```

**Mitigação**:
- UI: Confirm dialog com count (ex: "Projeto tem 3 blocos, 10 pisos. Apagar?")
- Backend: Trigger audit log antes de CASCADE

---

### 9.3 Storage Policies Path Validation
**Problema**: Policy valida ownership via path prefix.

**Path esperado**: `project-assets/{project_id}/floors/{floor_id}/image.png`

**Se quebrar path pattern**:
```javascript
// ❌ ERRADO: Path diferente
const wrongPath = `assets/${projectId}/${floorId}.png`;
await supabase.storage.from('project-assets').upload(wrongPath, file);
// Resultado: 403 Forbidden (policy rejeita)

// ✅ CORRECTO
const correctPath = `${projectId}/floors/${floorId}/image.png`;
await supabase.storage.from('project-assets').upload(correctPath, file);
```

**Validação**: Verificar path com regex antes de upload.

**Mitigação**:
```javascript
// Helper function
function buildStoragePath(projectId, entityType, entityId, filename) {
  return `${projectId}/${entityType}/${entityId}/${filename}`;
}
```

---

### 9.4 🆕 Inherit-or-Override Query Pattern (v11.1)

**Função SQL Crítica:**
```sql
CREATE OR REPLACE FUNCTION get_effective_param(
  p_block_id UUID,
  p_param_name TEXT
) RETURNS JSONB AS $$
  SELECT COALESCE(
    (SELECT (row_to_json(b)::jsonb) -> p_param_name FROM blocks b WHERE b.id = p_block_id),
    (SELECT (row_to_json(p)::jsonb) -> p_param_name FROM projects p 
     JOIN blocks b ON p.id = b.project_id WHERE b.id = p_block_id)
  );
$$ LANGUAGE SQL;
```

**Risco:** Se função corrompida/apagada → TODOS os cálculos param efetivos falham.

**Impacto:**
- Materiais/Sismo/Vento retornam `NULL`
- Cálculos EC1/EC8 crasham (divisão por zero, NaN)
- UI mostra campos vazios

**Exemplo Erro:**
```javascript
// Query param efetivo
const { data } = await supabase.rpc('get_effective_param', {
  p_block_id: 'bloco_A_id',
  p_param_name: 'materiais'
});

// Se função não existe:
// Error: function get_effective_param(uuid, text) does not exist
// → materiais = NULL → gammaBetao = undefined → G = NaN
```

**Validação Obrigatória:**
```sql
-- Testar função existe e retorna valores
SELECT get_effective_param('test_block_id', 'materiais');
-- Esperado: JSONB válido OU NULL (não erro)

-- Testar COALESCE funciona
-- Bloco sem override → retorna project default
SELECT get_effective_param('bloco_sem_override', 'sismo');
-- Esperado: project.sismo (JSONB)

-- Bloco com override → retorna block value
SELECT get_effective_param('bloco_com_override', 'materiais');
-- Esperado: blocks.materiais (JSONB)
```

**Mitigação:**
1. **Deploy via migration script** (versionado Git)
```sql
-- migrations/003_create_get_effective_param.sql
CREATE OR REPLACE FUNCTION get_effective_param(...) RETURNS JSONB AS $$ ... $$;
```

2. **Teste unitário em TESTES.md** (ver §1.14)

3. **Fallback client-side redundante:**
```javascript
// supabase-data.js
async function getEffectiveParam(blockId, paramName) {
  try {
    const { data, error } = await supabase.rpc('get_effective_param', {
      p_block_id: blockId,
      p_param_name: paramName
    });
    
    if (error) throw error;
    return data;
    
  } catch (err) {
    // Fallback: Query manual (menos eficiente)
    console.warn('get_effective_param failed, using fallback:', err);
    
    const { data: block } = await supabase
      .from('blocks')
      .select(`${paramName}, projects!inner(${paramName})`)
      .eq('id', blockId)
      .single();
    
    return block[paramName] || block.projects[paramName];
  }
}
```

4. **Health check startup:**
```javascript
// Index_v11.1.html - DOMContentLoaded
async function validateSupabaseFunctions() {
  try {
    await supabase.rpc('get_effective_param', {
      p_block_id: '00000000-0000-0000-0000-000000000000',  // Dummy UUID
      p_param_name: 'materiais'
    });
    console.log('✅ Supabase functions OK');
  } catch (err) {
    console.error('🔥 CRITICAL: get_effective_param missing!', err);
    alert('Erro crítico: Funções PostgreSQL não disponíveis. Contacte suporte.');
  }
}
```

**Impacto Futuro (v13.0+ Cloud Functions):**
- Migrar lógica para Cloud Function server-side
- Cache params efetivos em Redis (performance)

---

### 9.5 Realtime Subscription Leaks
**Problema**: Subscrições não limpas → memory leaks + performance degradation.

**Exemplo erro**:
```javascript
// ❌ ERRADO: Sem cleanup
function loadProject(id) {
  supabase
    .from(`projects:id=eq.${id}`)
    .on('UPDATE', callback)
    .subscribe();
  // Múltiplas chamadas = múltiplas subscriptions activas!
}
```

**Mitigação**:
```javascript
// ✅ CORRECTO: Cleanup em beforeunload
let currentSubscription = null;

async function loadProject(id) {
  // Limpa subscrição anterior
  if (currentSubscription) {
    await supabase.removeChannel(currentSubscription);
  }
  
  currentSubscription = supabase
    .channel(`project:${id}`)
    .on('postgres_changes', {...}, callback)
    .subscribe();
}

window.addEventListener('beforeunload', async () => {
  if (currentSubscription) {
    await supabase.removeChannel(currentSubscription);
  }
});
```

---

### 9.6 Realtime Filter Scope
**Problema**: Subscrever sem filtros → recebe updates de TODOS projects.

**Exemplo perigoso**:
```javascript
// ❌ ERRADO
// Subscreve a TABELA inteira (recebe updates de TODOS projects!)
const subscription = supabase
  .from('projects')
  .on('UPDATE', callback)
  .subscribe();

// ✅ Filtrar server-side
const subscription = supabase
  .from(`projects:id=eq.${projectId}`)  // Filter server-side
  .on('UPDATE', callback)
  .subscribe();
```

**Mitigação**: Sempre usar filters em subscriptions (`table:column=eq.value`).

---

## 10. RISCOS MIGRATION SCRIPT 🆕

### 10.1 One-Time Execution
**CRÍTICO**: Migration script `migrate-firebase-to-supabase.html` **NUNCA** executar 2x.

**Consequências**:
- Duplica projects/blocos/pisos/zonas
- Duplica blobs Supabase Storage
- Incrementa quota desnecessariamente

**Mitigação**:
- Script verifica se project já existe (query `id_jsj` antes de insert)
- Backup Firestore obrigatório antes de executar
- Validation step final (count rows antes/depois)

### 10.2 Foreign Key Order
**Problema**: INSERT em ordem errada quebra foreign keys.

**Ordem correcta**:
```
1. INSERT projects
2. INSERT blocos (requer project_id)
3. INSERT pisos (requer bloco_id)
4. INSERT zonas (requer piso_id)
5. INSERT geo_horizons (requer project_id)
```

**Script valida**: Aguarda cada INSERT antes de próximo.

### 10.3 Base64 → Storage Upload Failures
**Problema**: Upload imagem pode falhar (network, quota, etc).

**Mitigação**:
- Script usa try/catch por image
- Continua migration se 1 image falhar (log error)
- Validation step lista pisos sem `image_path`

### 10.4 UUID vs Timestamp IDs
**Problema**: Firebase usava timestamps (`Date.now()`), Supabase usa UUIDs.

**Impacto**: IDs incompatíveis → `collectAllData()` legacy queries falham.

**Mitigação**:
- Migration script gera novos UUIDs PostgreSQL
- NÃO tenta preservar IDs Firebase
- `loadAllData()` v11.1 usa UUIDs nativos

---

## 11. DEPENDÊNCIAS CRUZADAS SUPABASE v11.1 🆕

| Função | Depende de | Se quebrar |
|--------|-----------|------------|
| `createBloco()` | RLS policy projects, auth user | INSERT falha silent (403) |
| `uploadFloorImage()` | Storage policy, `pisoId` válido | Upload 403, `image_path` null |
| `getFloorImageURL()` | `piso.image_path` existe, Storage blob existe | 404 em Viewer, canvas branco |
| `FloorViewer.loadImage()` | `getFloorImageURL()` retorna URL | Canvas sem imagem, erro console |
| `deletePiso()` | Chama `deleteFloorImage()` ANTES de DELETE row | Storage leak (blob órfão) |
| `subscribeToProject()` | Auth válida, projectId existe, RLS permite | Subscription silent fail (no error) |
| `loadAllData()` | Foreign keys intactos, JOINs válidos | Dados parciais ou erro SQL |
| Migration script | Firestore read permissions, Supabase write permissions | Migration parcial, rollback manual |
| 🆕 `get_effective_param()` | Função SQL existe, blocks/projects válidos | Retorna NULL → cálculos falham |

**REGRA**: Sempre chamar Storage delete **antes** de PostgreSQL delete.

---

## 12. BREAKING CHANGES v11.0 → v11.1

### 12.1 Auth
```javascript
// v11.0 (Firebase)
const user = firebase.auth().currentUser;

// v11.1 (Supabase)
const { data: { user } } = await supabase.auth.getUser();
```

**Impacto**: Re-login obrigatório (sessions Firebase invalidadas).

### 12.2 Schema
```javascript
// v11.0 (Firestore)
projectData.floors = [...]  // Array flat

// v11.1 (Supabase)
projectData.blocos = new Map([...])  // Hierarquia Blocos → Pisos → Zonas
```

**Impacto**: JSONs v11.0 incompatíveis (migration script obrigatório).

### 12.3 CRUD
```javascript
// v11.0 (Firestore)
await saveProjectToFirestore(projectId, data);

// v11.1 (Supabase)
await saveProject(projectId, data);  // Upsert projects table
await createPiso(blocoId, pisoData);  // Separado (foreign key)
```

**Impacto**: Código cliente requer refactor (CRUD separado por tabela).

### 12.4 Real-time
```javascript
// v11.0 (Firestore onSnapshot)
const unsubscribe = onSnapshot(doc(db, 'projects', id), callback);

// v11.1 (Supabase Realtime)
const subscription = supabase
  .from(`projects:id=eq.${id}`)
  .on('UPDATE', callback)
  .subscribe();
const unsubscribe = () => supabase.removeSubscription(subscription);
```

**Impacto**: Granularidade diferente (table-level vs document-level).

### 12.5 Storage
```javascript
// v11.0 (Firestore inline Base64)
floor.imageData = "data:image/png;base64,iVBOR..."  // String inline

// v11.1 (Supabase Storage path)
piso.image_path = "project-assets/{id}/pisos/{id}/image.png"  // Path reference
```

**Impacto**: Lazy load obrigatório (async fetch).

### 12.6 Actions Data JSONB
```javascript
// v11.0 (Firestore nested arrays stringify)
layer.shapes = "[[[{\"x\":100}]]]"  // String JSON

// v11.1 (Supabase JSONB nativo)
layer.shapes = [[[{x:100}]]]  // Array nativo
```

**Impacto**: `JSON.parse()` removido (direto).

---

*Última actualização: 15/02/2026 (v11.1)*
