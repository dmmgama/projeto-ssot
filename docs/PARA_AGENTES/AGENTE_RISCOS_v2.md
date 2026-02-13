# ⚠️ ZONA DE PERIGO: MAPA DE DEPENDÊNCIAS E RISCOS

**Instrução para o Agente:** Não refatorizar ou alterar estas secções sem validação profunda.

---

## 1. TABELA DE IMPACTOS CRÍTICOS (Arquitecturais)

| Origem (Se mexeres aqui...) | Impacto (Isto parte...) | Gravidade | Motivo |
| :--- | :--- | :--- | :--- |
| **`projectData.floors`** (Adicionar/Remover campo) | **Secção 7 (Ações)** | 🔥 ALTA | `updateActionsFloorTabs()` gera abas dinamicamente. Se estrutura mudar, UI fica vazia. |
| **`zone.uso`** (Alterar valores select ou campo) | **Cálculo de Cargas (Secção 7)** | 🔥 ALTA | `renderZoneActions()` e `getUsoCategoryData()` lêem categoria EC1 (ex: "B"). Mudança quebra cálculo qk/psi. |
| **`geo_tipo_sismo`** (ID ou listener) | **Ação Sísmica (Secção 7)** | 🔥 ALTA | Listener copia automaticamente para `sismo_terreno`. Quebrar esta ligação dessincroniza inputs. |
| **Estrutura `actionsData`** (layers/shapes) | **Viewer 2D + Editor (zonas.html)** | 🔥 ALTA | `postMessage` espera formato específico. Alteração unilateral quebra comunicação entre janelas. |
| **`FloorViewer` (classe)** | **Canvas Secção 7** | 🔥 ALTA | Motor gráfico completo. Remover ou alterar assinatura de métodos quebra renderização. |
| **Funções `collectAllData()` / `loadAllData()`** | **Import/Export JSON** | 🔥 CRÍTICA | Sistema de persistência. Alteração quebra compatibilidade com JSONs antigos. |

---

## 2. IDs HTML PROTEGIDOS (Críticos)

### 2.1 Secção 1 - Identificação
```
id_jsj              # ID do projeto (KPI)
nome_projeto        # Nome do projeto (KPI + título)
cliente             # Cliente
designacao          # Designação da obra
localizacao         # Morada
tipologia           # Dropdown tipologia
especialidade       # Especialidade JSJ
tipo_obra           # Tipo de obra (com custom)
tipo_obra_custom    # Input custom (toggled)
fase_atual          # Fase actual

# Fases (Tabela)
fase_ep_data
fase_ep_estado
fase_lic_data
fase_lic_estado
fase_exec_data
fase_exec_estado
fase_at_data
fase_at_estado

# Equipas
resp_tecnico
equipa_eng
bim
gestao_projeto
fiscalizacao
promotor
arquitetura
especialidades
bim_manager
outros_equipa
```

### 2.2 Secção 3 - Elementos Base
```
arq                 # Arquitetura
mep                 # MEP
escav               # Escavação
geotec              # Estudo geotécnico
hidro               # Estudo hidrogeológico
prosp               # Prospeções
carac               # Caracterização estrutural
insp                # Inspeção estrutural
ensaios             # Ensaios
orig                # Projetos originais
outros              # Outros estudos
```

### 2.3 Secção 4 - Condições Arquitectónicas
```
cond_arq            # Textarea condicionantes
```

### 2.4 Secção 5 - Geotecnia
```
# Caracterização Geral
geo_form            # Formações geológicas
geo_horiz           # Horizontes
geo_sub             # Profundidade substrato
geo_nat             # Natureza dos solos
geo_tipo_sismo      # 🔥 CRÍTICO: Tipo solo EC8 (tem listener!)
geo_sigma_adm       # Tensão admissível

# Hidrogeologia
hidro_nf            # Nível freático
hidro_col           # Coluna de água
hidro_xa            # Agressividade
hidro_obs           # Observações
```

### 2.5 Secção 6 - Solução Estrutural
```
sol_desc            # Descrição da solução (textarea)
```

### 2.6 Secção 7 - Ações (Checkboxes de Activação)
```
act_graviticas      # Sempre true (hardcoded)
act_sismo           # Activa aba Sismo
act_vento           # Activa aba Vento
act_impulsos        # Activa aba Impulsos
act_retracao        # Activa aba Retração
act_temperatura     # Activa aba Temperatura
act_neve            # Activa aba Neve
act_agua            # Activa aba Água
```

### 2.7 Secção 7 - Parâmetros Sísmicos
```
sismo_zona          # Zona sísmica (1.1 a 2.5)
sismo_terreno       # 🔥 Recebe de geo_tipo_sismo!
sismo_imp           # Coef. importância
sismo_q             # Coef. comportamento
sismo_amort         # Amortecimento (%)
```

### 2.8 Secção 7 - Outros Parâmetros
```
# Vento
vento_zona
vento_vb0
vento_cat
vento_z0
vento_co
vento_cpi

# Impulsos
impulsos_h
impulsos_gamma
impulsos_phi
impulsos_c
impulsos_k0
impulsos_q

# Retração
retracao_hr
retracao_t0
retracao_cimento
retracao_cura

# Temperatura
temp_contracao
temp_expansao
temp_alfa
temp_tref

# Neve
neve_zona
neve_alt
neve_sk
neve_ce
neve_ct
neve_mu

# Água
agua_nivel
agua_gamma
agua_sub
agua_dren
```

### 2.9 Secção 8 - Critérios
```
crit_reg            # Regulamentação
crit_dim            # Critérios dimensionamento
```

### 2.10 KPIs (Read-Only - NÃO inputs mas usados em código)
```
kpiID               # ID do projeto (display)
kpiNome             # Nome (display)
kpiFase             # Fase (display)
kpiImplant          # Área implantação (calculado)
kpiABC              # ABC (calculado)
kpiPisos            # Nº pisos (calculado)
kpiAltura           # Altura total (calculada)
```

### 2.11 IDs Dinâmicos (Criados por JS)
**PADRÃO**: `floor_name_{floorId}`, `zone_uso_{zoneId}`, etc.

⚠️ **Estes NÃO aparecem no HTML base** - são criados por:
- `addFloor()` → inputs de piso
- `renderZoneForm()` → inputs de zona no modal

---

## 3. FUNÇÕES JAVASCRIPT PROTEGIDAS

### 3.1 Funções de Estado (NÃO REMOVER)
```javascript
initializeProjectData()       // Inicializa projectData vazio
collectAllData()              // Serializa DOM → JSON
loadAllData(data)             // Deserializa JSON → DOM + renderiza
```

### 3.2 Funções de UI Dinâmica (NÃO REMOVER)
```javascript
// KPIs
updateKPIs()                  // Actualiza displays de resumo

// Secção 2 - Pisos
addFloor()                    // Adiciona piso ao array + DOM
renderFloors()                // Renderiza lista de pisos
updateFloorName(floorId, name)
updateFloorCota(floorId, cota)
deleteFloor(floorId)          // Remove piso (validação)
toggleFloorZones(floorId)     // Expande/colapsa zonas

// Secção 2 - Zonas
openAddZoneModal(floorId)     // Abre modal criar zona
openEditZoneModal(floorId, zoneId)  // Abre modal editar
renderZoneForm(zone)          // Popula form do modal
closeZoneModal()
saveZone()                    // Salva zona do modal
deleteZone(floorId, zoneId)

// Secção 2 - Cálculos
calculateEquivThickness(tipo, h)  // Espessura equivalente laje
updateGeneralStats()          // KPIs Secção 2

// Secção 5 - Geotecnia
addGeoRow()                   // Adiciona linha horizonte
renderGeoTable()              // Renderiza tabela geotécnica

// Secção 7 - Ações (UI)
toggleActionSection(name, enabled)  // Mostra/esconde secção
toggleActionBody(name)        // Expande/colapsa corpo
updateActionsFloorTabs()      // 🔥 CRÍTICO: Gera abas pisos
selectActionsFloor(floorId, btn)
selectActionsZone(floorId, zoneId, btn)
```

### 3.3 Funções de Cálculo EC1/EC8 (NÃO REMOVER)
```javascript
// v10.1 - Multi-Projeto
saveCurrentProject()          // Serializa projeto activo para localStorage
loadProjectFromStorage(id)    // Carrega projeto específico
backToLobby()                 // Salva + redirige para lobby.html
openZonesEditor(floorId)      // ⚠️ CRÍTICO: Envia actionsData existente

// Secção 7.1 - Gravíticas (Tabela Analítica)
renderZoneActions(floor, zone)  // 🔥 Gera tabela cargas EC1
getUsoCategoryData(uso)         // 🔥 Retorna {qk, psi0, psi1, psi2}

// Cargas Permanentes (Adicionais)
openAddPermanentModal(floorId, zoneId)
addPermanentAction()
deletePermanentAction(floorId, zoneId, index)

// Paredes (RCP)
openWallsModal(floorId, zoneId)
renderWallsTable(zone)
addWallRow()
calculateWalls(zone)          // Soma peso de paredes
saveWalls()

// Sismo
generateSeismicCharts()       // 🔥 Gera gráficos Chart.js
generateSeismicChart(canvasId, tipo, ag, params, q, amort, type)
```

### 3.4 Motor Gráfico (NÃO REMOVER)
```javascript
// Classe FloorViewer (Secção 7.2)
class FloorViewer {
  constructor(canvasId, floor) { ... }
  calculatePointELU(point) { ... }  // 🔥 Heatmap + Sonda
  drawShapes() { ... }
  handleClick(e) { ... }
  handleMouseDown(e) { ... }
  handleMouseMove(e) { ... }
  handleMouseUp(e) { ... }
  // ... métodos auxiliares
}

// Abertura de Editor
openZonesEditor(floorId)      // 🔥 Abre zonas.html (popup)
```

### 3.5 Funções de IO (NÃO REMOVER)
```javascript
exportJSON()                  // Exporta dados
importJSON(event)             // Importa JSON de file input
exportMarkdown()              // Gera relatório MD
generateMarkdownReport()
buildMarkdownReport()         // Constrói string MD
```

### 3.6 Funções Auxiliares (Validar antes de remover)
```javascript
toggleTipoObraCustom(value)   // Mostra input custom
closeModal(id)                // Fecha modal genérico
showStatus(msg, type)         // Notificação UI (assumido)
```

---

## 4. EVENT LISTENERS CRÍTICOS

### 4.1 Listener Copy Geo → Sismo
```javascript
// 🔥 CRÍTICO: Não remover!
document.getElementById('geo_tipo_sismo')?.addEventListener('change', function () {
  document.getElementById('sismo_terreno').value = this.value;
});
```
**Motivo**: Sincroniza tipo de solo entre Secção 5 e Secção 7 (Sismo)

### 4.2 Listener postMessage (zonas.html)
```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'zonesData') {
    // Recebe actionsData do editor
  }
});
```
**Motivo**: Comunicação com zonas.html (editor gráfico)

### 4.3 Listeners de Inputs (KPIs)
```javascript
document.getElementById(id)?.addEventListener('input', updateKPIs);
```
**Motivo**: Actualiza KPIs em tempo real (Secção 1)

### 4.5 Listener postMessage (zonas.html → index.html)
```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'zonesData') {
    floor.actionsData = event.data.data;
    saveCurrentProject();  // 🔥 CRÍTICO: Persistir após receber
  }
});
```
**Motivo**: actionsData deve persistir ao voltar ao lobby

### 4.4 Listeners Canvas (FloorViewer)
```javascript
this.canvas.addEventListener('click', (e) => this.handleClick(e));
this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
```
**Motivo**: Interactividade do Viewer 2D (Secção 7)

---

## 5. ESTRUTURA `projectData` (Schema Crítico)

### 5.1 Schema Completo
```javascript
let projectData = {
  floors: [
    {
      id: 123456789,            // Timestamp único
      name: "Piso 0",
      cota: 0.00,               // float
      area: 150.00,             // float
      imageData: "",            // Base64 (PNG/JPG)
      zones: [
        {
          id: 987654321,
          name: "Zona A",
          area: 50.00,          // float
          cotaLimpo: 0.00,      // float
          acabamento: 50,       // int (mm)
          uso: "B",             // 🔥 string EC1 category
          tipoLaje: "Maciça",   // string
          espessura: 0.25,      // float (m)
          vaoMax: 6.0,          // float (m)
          permanentes: [],      // array de {nome, valor, tipo}
          walls: []             // array de {comprimento, espessura, altura, gamma}
        }
      ],
      actionsData: {            // 🔥 CRÍTICO: Do zonas.html
        editorScale: 1.0,
        layers: {
          lajes: { shapes: [...] },
          sobrecargas: { shapes: [...] },
          rcp: { shapes: [...] }
        }
      }
    }
  ],
  geoHorizons: [
    {
      horizonte: "H1",
      nspt: 10,
      gamma: 18.0,
      c: 5,
      phi: 30,
      e: 50,
      sigma: 200,
      escav: "Fácil"
    }
  ]
  // Nota: actionsEnabled não está em projectData!
  // É lido directamente dos checkboxes act_*
};
```

---

## 6. DUPLICAÇÃO DE LÓGICA (Cuidado no Refactor)

### 6.1 Cálculo de Cargas EC1
A lógica de cálculo existe em **DOIS lugares**:

1. **`renderZoneActions(floor, zone)`** (linha ~1500-1700)
   - Gera tabela HTML com cargas
   - Lê `zone.uso` → chama `getUsoCategoryData(uso)`
   - Aplica fórmulas EC1 → gera HTML

2. **`FloorViewer.calculatePointELU(point)`** (linha ~2200-2400)
   - Gera heatmap no Canvas
   - Lê polígonos de `floor.actionsData`
   - Aplica **mesmas fórmulas EC1**

⚠️ **REGRA**: Se alterares fórmula numa → **TENS** de alterar na outra!

**Exemplo**: Se mudares `qk` da categoria "B" de 3.0 para 3.5:
```javascript
// Alterar em getUsoCategoryData():
case 'B': return { qk: 3.5, psi0: 0.7, psi1: 0.5, psi2: 0.3 };

// E também em FloorViewer.calculatePointELU():
// (procurar "case 'B'" dentro da classe)
```

---

## 7. INTEGRIDADE DOS IDs HTML

### 7.1 Regra de Ouro
**Se mudares o `id` de um input**:
- `collectAllData()` deixa de o serializar
- JSONs antigos deixam de carregar esse campo
- **Resultado**: Perda silenciosa de dados

### 7.2 Migração Segura (Se TENS de mudar ID)
```javascript
// 1. Muda o ID no HTML
<input id="novo_id" />  // era "id_antigo"

// 2. Adiciona fallback em loadAllData():
const el = document.getElementById('novo_id');
if (el && data.id_antigo) {  // Compatibilidade
  el.value = data.id_antigo;
}

// 3. Testa com JSON antigo!
```

---

## 8. COMPATIBILIDADE zonas.html

### 8.1 Estrutura `actionsData` (Contrato)
**zonas.html envia** via `postMessage`:
```javascript
{
  type: 'zonesData',
  data: {
    editorScale: 1.0,
    layers: {
      lajes: { shapes: [...] },
      sobrecargas: { shapes: [...] },
      rcp: { shapes: [...] }
    }
  }
}
```

**Index.html recebe** e guarda em `floor.actionsData`

⚠️ **Se mudares esta estrutura**:
- Altera em **AMBOS** os ficheiros (Index + zonas.html)
- Valida que `postMessage` funciona
- Testa no Viewer 2D

---

## 9. CHECKLIST PRÉ-ALTERAÇÃO

Antes de mexer em código, valida:

- [ ] O ID está em `CODIGO_PROTEGIDO.md`? → Pede confirmação
- [ ] A função tem 0 callers? → Procura por nome (pode ser callback)
- [ ] Mudança afecta `projectData`? → Valida contra schema
- [ ] Mudança afecta `actionsData`? → Testa zonas.html
- [ ] Mudança em cálculo EC1? → Altera AMBOS os lugares
- [ ] Listener será removido? → Valida se não quebra sync

---

## 10. TESTES OBRIGATÓRIOS (Pós-Alteração)

Ver ficheiro `@AGENTE_TESTES.md` completo.

**Mínimo**:
1. ✅ Import JSON → Dados carregam
2. ✅ Export JSON → Ficheiro válido
3. ✅ Viewer 2D → Canvas renderiza
4. ✅ Console → 0 erros JavaScript

---

*Última actualização: 12/02/2026 (Extracção de Index_v9.html)*
