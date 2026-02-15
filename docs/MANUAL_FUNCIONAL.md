# MANUAL FUNCIONAL · SSOT JSJ Template

**Versão:** v11.1 (Hierarquia Blocos + Inherit-or-Override)  
**Última Atualização:** 15/02/2026  
**Objetivo:** Mapeamento funcional completo do formulário único para integração, automação e contexto LLM

---

## VISÃO GERAL DA HIERARQUIA FUNCIONAL

### Arquitetura UI (8 Níveis)

```
SSOT JSJ Template
├─ Nível 1: Identificação do Projeto
├─ Nível 2: Parâmetros Globais (com Inherit-or-Override) 🆕
├─ Nível 3: Blocos Estruturais 🆕
├─ Nível 4: Pisos (dentro de Blocos) 🆕
├─ Nível 5: Zonas (dentro de Pisos)
├─ Nível 6: Acções (Motor Cálculo EC1/EC8)
├─ Nível 7: Elementos Base & Condicionantes
└─ Nível 8: Critérios e Relatórios
```

**Novidades v11.1:**
- **Nível 2**: Radio buttons "Global / Por Bloco" em CADA parâmetro
- **Nível 3**: CRUD Blocos (accordion UI)
- **Nível 4**: Tipologias editáveis (fundação/térreo/elevado/cobertura)

---

## NÍVEL 1 · IDENTIFICAÇÃO DO PROJETO

### 1.1 KPIs Rápidos (Visualização Read-Only)

**Localização UI:** Header fixo (topo do formulário)  
**Dados Exibidos:**
- ID JSJ (número único projeto)
- Nome Projeto
- Fase Actual (EP, Licenciamento, Execução, AT)

**Cálculo Automático:** Atualiza ao preencher Secções 1-2.

---

### 1.2 Campos Administrativos

**Secção:** Dados Gerais  
**Inputs:**

| Campo | Tipo | Obrigatório | Default |
|-------|------|-------------|---------|
| ID JSJ | Text | ✅ | - |
| Nome Projeto JSJ | Text | ✅ | - |
| Cliente | Text | ❌ | - |
| Designação | Text | ❌ | - |
| País | Dropdown | ❌ | Portugal |
| Cidade | Dropdown | ❌ | Lisboa |
| Morada | Textarea | ❌ | - |
| Tipologia | Dropdown | ❌ | Habitação |
| Especialidade | Text | ❌ | Estruturas |
| Tipo de Obra | Dropdown | ❌ | Nova Construção |

**Tipologia (Dropdown Options):**
- Habitação
- Comercial
- Industrial
- Escolar
- Hospitalar
- Infraestruturas
- Outro

**Tipo de Obra (Dropdown Options):**
- Nova Construção
- Reabilitação
- Reforço Estrutural
- Ampliação
- Demolição

---

### 1.3 Fases do Projeto (Tabela Dinâmica)

**Colunas:**

| Fase | Data Entrega | Estado |
|------|--------------|--------|
| EP | `<input type="date">` | `<select>` |
| Licenciamento | `<input type="date">` | `<select>` |
| Execução | `<input type="date">` | `<select>` |
| Assistência Técnica | `<input type="date">` | `<select>` |

**Estado (Dropdown Options):**
- Não Iniciado
- Em Curso
- Concluído
- Suspenso

**Persistência:** JSONB `projects.fases`
```json
[
  {"fase": "EP", "data_entrega": "2025-06-01", "estado": "Concluído"},
  {"fase": "Licenciamento", "data_entrega": "2025-09-01", "estado": "Em Curso"}
]
```

---

### 1.4 Equipa JSJ

**Inputs:**

| Campo | Tipo | Multi-Select |
|-------|------|--------------|
| Responsável Técnico | Dropdown | ❌ |
| Equipa Engenharia | Dropdown | ✅ |
| BIM Manager | Dropdown | ❌ |
| Gestão Projeto | Dropdown | ❌ |
| Fiscalização | Dropdown | ✅ |

**Fonte Dados:** Supabase Auth (emails @jsj.pt)

**Persistência:** JSONB `projects.equipa_jsj`
```json
{
  "resp_tecnico": "david@jsj.pt",
  "eng": ["joao@jsj.pt", "maria@jsj.pt"],
  "bim": "pedro@jsj.pt",
  "gestao": "ana@jsj.pt",
  "fiscalizacao": ["carlos@jsj.pt"]
}
```

---

### 1.5 Equipa Dono de Obra

**Inputs:**

| Campo | Tipo |
|-------|------|
| Dono de Obra | Text |
| Arquitetura | Text |
| Gestão Projeto | Text |
| Especialidades | Textarea |
| BIM Manager | Text |
| Fiscalização | Text |

**Persistência:** JSONB `projects.equipa_dono_obra`

---

## NÍVEL 2 · PARÂMETROS GLOBAIS (INHERIT-OR-OVERRIDE) 🆕

### 2.1 Filosofia Inherit-or-Override

**Pattern UI:** Cada parâmetro tem radio buttons:
```
┌─ MATERIAIS ──────────────────────────────┐
│ ○ Global para todos os blocos            │
│ ● Definir por bloco                      │ ← Radio
│                                           │
│ [Se "Global" → 1 formulário compartilhado] │
│ [Se "Por Bloco" → tabs por bloco]        │
└───────────────────────────────────────────┘
```

**Lógica Backend:**
- `projects.{parametro}` = valor global
- `blocks.{parametro}` = override (NULL = herda global)
- SQL function `get_effective_param(block_id, 'materiais')` → COALESCE

---

### 2.2 Geotecnia

**UI:** Radio + Formulário

**Modo "Global":**
```
Tipo Solo EC8: [Dropdown: A, B, C, D, E]
NSPT Médio: [Number]
σadm: [Number] kPa
```

**Modo "Por Bloco":**
```
┌─ TABS ─────────────────────┐
│ Bloco A | Bloco B | Bloco C │
└─────────────────────────────┘
  ↓ (Tab Bloco A)
  Tipo Solo EC8: [C]
  NSPT Médio: [15]
  σadm: [200] kPa
```

**Persistência:**
- Global: `projects.geotecnia` JSONB
- Override: `blocks.geotecnia` JSONB (NULL se herda)

**Schema JSONB:**
```json
{
  "tipo_solo": "B",
  "nspt": 20,
  "sigma_adm": 250,
  "profundidade_fundacao": 3.5,
  "nivel_freatico": -2.0
}
```

---

### 2.3 Materiais

**UI:** Radio + Formulário

**Modo "Global":**
```
┌─ BETÃO ─────────────────┐
│ Classe: [C30/37]        │
│ fck: [30] MPa           │
│ γ: [25] kN/m³           │
└─────────────────────────┘

┌─ AÇO ───────────────────┐
│ Tipo: [A500 NR]         │
│ fyk: [500] MPa          │
└─────────────────────────┘
```

**Modo "Por Bloco":**
```
Tab Bloco A:
  Betão: C30/37
  Aço: A500 NR

Tab Bloco B (Pavilhão):
  Betão: C25/30  ← Diferente!
  Aço: A400 NR   ← Diferente!
```

**Persistência:**
```json
// projects.materiais
{
  "betao": {"classe": "C30/37", "fck": 30, "gamma": 25},
  "aco": {"tipo": "A500 NR", "fyk": 500}
}

// blocks.materiais (override Bloco B)
{
  "betao": {"classe": "C25/30", "fck": 25, "gamma": 25},
  "aco": {"tipo": "A400 NR", "fyk": 400}
}
```

---

### 2.4 Acções Climáticas

#### 2.4.1 Vento (EC1-1-4)

**UI:** Radio + Formulário

**Modo "Global":**
```
Zona (Portugal): [Dropdown: A, B]
vb,0: [27] m/s
Categoria Terreno: [Dropdown: I, II, III, IV]
z0: [Auto-calculado]
co: [1.0]
cpi: [0.0]
```

**Persistência:**
```json
// projects.vento
{
  "zona": "B",
  "vb0": 27,
  "categoria_terreno": "II",
  "z0": 0.05,
  "co": 1.0,
  "cpi": 0.0
}
```

#### 2.4.2 Neve (EC1-1-3)

**UI:** Radio + Formulário

**Modo "Global":**
```
Zona (Portugal): [Dropdown: 1, 2, 3]
Altitude: [200] m
sk: [Auto-calculado] kN/m²
Ce: [1.0]
Ct: [1.0]
μ: [0.8]
```

**Persistência:**
```json
// projects.neve
{
  "zona": 2,
  "altitude": 200,
  "sk": 0.6,
  "ce": 1.0,
  "ct": 1.0,
  "mu": 0.8
}
```

#### 2.4.3 Temperatura

**UI:** Radio + Formulário

**Modo "Global":**
```
ΔT Contração: [-20] °C
ΔT Expansão: [30] °C
α (Coef. dilatação): [1.0e-5] /°C
T ref.: [10] °C
```

---

### 2.5 Acções Sísmicas (EC8)

**UI:** Radio + Formulário

**Modo "Global":**
```
Zona (Portugal): [Dropdown: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3]
Tipo Terreno: [Importado de Geotecnia] ← Sync automático
Classe Importância: [Dropdown: I, II, III, IV]
ag: [Auto-calculado] g
Coef. q: [3.0]
Amortecimento: [5] %
```

**Sync Crítico:** `geotecnia.tipo_solo` → `sismo.terreno` (one-way binding)

**Persistência:**
```json
// projects.sismo
{
  "zona": "1.3",
  "terreno": "B",
  "classe_importancia": "II",
  "ag": 1.5,
  "q": 3.0,
  "amortecimento": 0.05,
  "espectro_tipo": 1
}
```

**Gráficos Gerados (Chart.js):**
- Espectro Tipo 1 (Tectónica Afastada)
- Espectro Tipo 2 (Tectónica Próxima)

**Função:** `generateSeismicSpectrum(block, project)` (ver ESPECIFICACAO.md §6.2)

---

## NÍVEL 3 · BLOCOS ESTRUTURAIS 🆕

### 3.1 UI Accordion (Gestão Blocos)

**Localização:** Secção 2 (após Parâmetros Globais)

**Estrutura Visual:**
```
┌─ BLOCOS DO PROJETO ─────────────────────────┐
│ [+ Adicionar Bloco]                          │
│                                              │
│ ▼ Bloco A - Edifício Habitação              │ ← Accordion expandido
│   │ Nome: [Edifício Habitação]              │
│   │ Tipo: [Dropdown: Edifício]              │
│   │ Descrição: [Textarea]                   │
│   │                                          │
│   │ ┌─ PARÂMETROS OVERRIDE ─────────────┐  │
│   │ │ Geotecnia: [Herda Global ▼]       │  │
│   │ │ Materiais: [Override ▼]           │  │
│   │ │   Betão: C25/30                   │  │
│   │ │   Aço: A400 NR                    │  │
│   │ └───────────────────────────────────┘  │
│   │                                          │
│   │ [🗑️ Apagar Bloco]                       │
│   │                                          │
│   └─ PISOS (ver Nível 4)                    │
│                                              │
│ ▶ Bloco B - Pavilhão                        │ ← Accordion colapsado
│                                              │
│ ▶ Bloco C - Embasamento Comum              │
└──────────────────────────────────────────────┘
```

---

### 3.2 CRUD Blocos

#### Criar Bloco

**Trigger:** Botão `[+ Adicionar Bloco]`

**Modal Popup:**
```
┌─ NOVO BLOCO ──────────────────┐
│ Nome: [________________]       │
│ Tipo: [Dropdown ▼]            │
│   - Edifício                   │
│   - Pavilhão                   │
│   - Fundação                   │
│   - Anexo                      │
│                                │
│ Descrição (opcional):          │
│ [________________________]     │
│                                │
│ [Cancelar] [Criar]             │
└────────────────────────────────┘
```

**Backend:** `createBlock(projectId, {name, block_type, description})`

---

#### Editar Bloco

**Trigger:** Click no accordion header (inline edit)

**Campos Editáveis:**
- Nome (inline text input)
- Tipo (dropdown)
- Descrição (textarea expandível)

**Backend:** `updateBlock(blockId, {name, block_type, description})`

---

#### Apagar Bloco

**Trigger:** Botão `[🗑️ Apagar Bloco]`

**Validação:**
```javascript
async function deleteBlock(blockId) {
  // Count pisos
  const { data: floors } = await supabase
    .from('floors')
    .select('id')
    .eq('block_id', blockId);
  
  if (floors.length > 0) {
    const confirm = window.confirm(
      `Bloco tem ${floors.length} piso(s). Apagar tudo?`
    );
    if (!confirm) return;
  }
  
  // CASCADE DELETE automático (PostgreSQL)
  await supabase.from('blocks').delete().eq('id', blockId);
}
```

---

### 3.3 Parâmetros Override (Por Bloco)

**UI:** Dropdowns dentro do accordion bloco

**Exemplo - Materiais Override:**
```
Materiais: [Herda Global ▼]  ← Default (NULL em PostgreSQL)

Se mudar para [Override ▼]:
  ┌─ BETÃO ─────────────┐
  │ Classe: [C25/30]    │  ← Valores editáveis
  │ fck: [25] MPa       │
  └─────────────────────┘
  
  ┌─ AÇO ───────────────┐
  │ Tipo: [A400 NR]     │
  │ fyk: [400] MPa      │
  └─────────────────────┘
```

**Backend:** `updateBlock(blockId, {materiais: {...}})`

**Lógica Queries:**
```javascript
// Obter materiais efetivos para Bloco A
const { data } = await supabase.rpc('get_effective_param', {
  p_block_id: 'bloco_A_id',
  p_param_name: 'materiais'
});

// Retorna: block.materiais OU project.materiais (COALESCE)
```

---

## NÍVEL 4 · PISOS (DENTRO DE BLOCOS) 🆕

### 4.1 UI Accordion Aninhado (Pisos por Bloco)

**Localização:** Dentro de cada accordion bloco

**Estrutura Visual:**
```
▼ Bloco A - Edifício Habitação
  │
  ├─ PARÂMETROS OVERRIDE (ver Nível 3)
  │
  └─ PISOS [+ Adicionar Piso]
     │
     ├─ 🏗️ FUNDAÇÕES (Tipologia)  ← Accordion tipologia
     │  ├─ Piso -2 (Cota -6.00 m)
     │  └─ Piso -1 (Cota -3.00 m)
     │
     ├─ 🏢 TÉRREO
     │  └─ Piso 0 (Cota 0.00 m)
     │
     ├─ 📐 ELEVADOS
     │  ├─ Piso 1 (Cota +3.00 m)
     │  ├─ Piso 2 (Cota +6.00 m)
     │  └─ Piso 3 (Cota +9.00 m)
     │
     └─ 🏠 COBERTURA
        └─ Piso Cobertura (Cota +12.00 m)
```

**Agrupamento Automático:** Pisos agrupam por `floor_type` (fundacao/terreo/elevado/cobertura)

---

### 4.2 CRUD Pisos

#### Criar Piso

**Trigger:** Botão `[+ Adicionar Piso]` dentro de accordion bloco

**Modal Popup:**
```
┌─ NOVO PISO ───────────────────┐
│ Nome: [Piso 1__________]       │
│ Tipologia: [Dropdown ▼]       │
│   - Fundação                   │
│   - Térreo                     │
│   - Elevado                    │
│   - Cobertura                  │
│                                │
│ Cota: [+3.00___] m             │
│ Altura (pé-direito): [3.0] m   │
│                                │
│ [Cancelar] [Criar]             │
└────────────────────────────────┘
```

**Backend:** `createFloor(blockId, projectId, {name, floor_type, cota, height})`

---

#### Editar Piso

**Trigger:** Click no nome do piso (inline edit)

**Campos Editáveis:**
- Nome (inline text)
- Cota (inline number)
- Tipologia (dropdown)
- Altura (inline number)

**Backend:** `updateFloor(floorId, {name, cota, floor_type, height})`

---

#### Apagar Piso

**Trigger:** Botão `[🗑️]` ao lado do nome

**Validação:**
```javascript
async function deleteFloor(floorId) {
  // 1. Apagar imagem Storage (se existir)
  await deleteFloorImage(floorId);
  
  // 2. COUNT zonas
  const { data: zones } = await supabase
    .from('zones')
    .select('id')
    .eq('floor_id', floorId);
  
  if (zones.length > 0) {
    const confirm = window.confirm(
      `Piso tem ${zones.length} zona(s). Apagar tudo?`
    );
    if (!confirm) return;
  }
  
  // 3. DELETE (CASCADE apaga zones)
  await supabase.from('floors').delete().eq('id', floorId);
}
```

---

### 4.3 Tipologias de Piso (Enum)

**Valores Permitidos:**

| Valor | Ícone | Descrição | Uso Típico |
|-------|-------|-----------|------------|
| `fundacao` | 🏗️ | Fundação | Pisos -2, -1 (sapatas, estacas) |
| `terreo` | 🏢 | Térreo | Piso 0 (contacto solo) |
| `elevado` | 📐 | Elevado | Pisos 1-N (lajes suspensas) |
| `cobertura` | 🏠 | Cobertura | Último piso (laje esteira/telhado) |

**Impacto nos Cálculos:**
- `fundacao`: Cargas vão para `geotecnia.sigma_adm` (verificação capacidade carga)
- `terreo`: Impulsos de terras (ativo/passivo)
- `elevado`: Cálculo lajes EC2 (vãos, espessuras)
- `cobertura`: Acções neve, temperatura

---

### 4.4 Sobrecargas (Sempre Por Piso) 🆕

**UI:** Tab dentro do accordion piso

**Formulário:**
```
┌─ SOBRECARGAS (EC1) ──────────┐
│ Uso Predominante: [Dropdown] │
│   - A: Habitação (2.0 kN/m²) │
│   - B: Escritórios (3.0)     │
│   - C: Escolas (4.0)         │
│   - D: Comércio (5.0)        │
│   - E: Armazém (7.5)         │
│   - F: Garagem (2.5)         │
│   - H: Cobertura (0.4)       │
│                              │
│ qk: [3.0__] kN/m² (auto)     │
│                              │
│ Override manual:             │
│ [ ] Usar valor custom        │
│   qk custom: [___] kN/m²     │
└──────────────────────────────┘
```

**Persistência:**
```json
// floors.sobrecargas
{
  "uso": "B",
  "qk": 3.0,
  "custom": false
}
```

**CRÍTICO:** Sobrecargas **NUNCA** herdam de bloco/projeto (sempre específicas por piso).

---

### 4.5 Cargas Permanentes (Sempre Por Piso) 🆕

**UI:** Tab dentro do accordion piso

**Tabela Dinâmica:**
```
┌─ CARGAS PERMANENTES ────────────────────┐
│ [+ Adicionar Carga]                      │
│                                          │
│ Nome             Valor (kN/m²)  Tipo     │
│ ────────────────────────────────────────│
│ Revestimento     1.5            Área     │
│ Divisórias       1.0            Área     │
│ Tecto Falso      0.5            Área     │
│ Instalações      0.3            Linear   │
│                                          │
│                              Total: 3.3  │
└──────────────────────────────────────────┘
```

**Persistência:**
```json
// floors.cargas_permanentes
[
  {"nome": "Revestimento", "valor": 1.5, "tipo": "area"},
  {"nome": "Divisórias", "valor": 1.0, "tipo": "area"},
  {"nome": "Tecto Falso", "valor": 0.5, "tipo": "area"},
  {"nome": "Instalações", "valor": 0.3, "tipo": "linear"}
]
```

---

### 4.6 Upload Imagem Piso (Supabase Storage)

**Trigger:** Botão `[📷 Upload Planta]` em cada piso

**Input:** `<input type="file" accept="image/png,image/jpeg">`

**Workflow:**
```
1. User seleciona ficheiro PNG/JPG
2. Frontend: uploadFloorImage(floorId, projectId, file)
3. Supabase Storage: Upload → project-assets/{proj_id}/floors/{floor_id}/image.png
4. Gerar signed URL (TTL 7 dias)
5. Update PostgreSQL: floors.image_download_url + image_url_expiry
6. UI: Mostra thumbnail + botão [🗑️ Apagar]
```

**Preview Thumbnail:**
```html
<div class="floor-image-preview">
  <img src="{image_download_url}" style="max-width: 200px;" />
  <button onclick="deleteFloorImage('{floorId}')">🗑️</button>
</div>
```

**Lazy Loading:** Imagem só carrega quando user abre Viewer (Secção 6).

---

## NÍVEL 5 · ZONAS (DENTRO DE PISOS)

**NOTA:** Motor gráfico mantém-se idêntico à v11.0.  
Mudanças v11.1:
- Zonas pertencem a `floors.id` (não direto a `projects.id`)
- Metadata `shapes` persiste como JSONB nativo (não JSON string)

### 5.1 Editor Canvas (zonas.html)

**Trigger:** Secção 6 → Acções Gravíticas → Botão `[✏️ Editar Zonas]` em cada piso

**Popup Window:**
```
zonas.html (1200x800 popup)
├─ Canvas (background: floor image)
├─ Toolbar (desenho polígonos)
├─ Layers (Estrutura, Sobrecargas, RCP)
└─ Save → postMessage() → Index_v11.1.html
```

**Workflow:**
1. User clica `[✏️ Editar Zonas]` no Piso 0
2. Index abre popup `zonas.html`
3. Index → zonas.html: `postMessage({type: 'LOAD_FLOOR', floorId, imageURL})`
4. User desenha polígonos no canvas
5. User clica Save
6. zonas.html → Index: `postMessage({type: 'SAVE_ZONES', zones: [...]})`
7. Index → Supabase: `updateZone(zoneId, {shapes: [...]})`

---

### 5.2 Propriedades Zona

**Campos:**

| Campo | Tipo | Origem | Exemplo |
|-------|------|--------|---------|
| Nome | Text | Manual | "Zona A" |
| Área | Number | Auto (polígono) | 50.5 m² |
| Uso EC1 | Dropdown | Manual | "B" (Escritórios) |
| Tipo Laje | Dropdown | Manual | "Maciça" |
| Espessura | Number | Manual | 0.25 m |
| Vão Máximo | Number | Manual | 6.0 m |

**Tipo Laje (Dropdown Options):**
- Maciça (coef. 1.0)
- Fungiforme (coef. 0.85)
- Aligeirada (coef. 0.60)
- Vigada (coef. 0.50)
- Pré-laje (coef. 1.0)

**Cálculo Espessura Equivalente:**
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

### 5.3 Cargas Adicionais por Zona

**Permanentes (Tabela Dinâmica):**
```
┌─ CARGAS PERMANENTES ZONA A ──────┐
│ [+ Adicionar]                     │
│                                   │
│ Nome           Valor    Tipo      │
│ ──────────────────────────────────│
│ Divisórias     1.0      kN/m²     │
│ Equipamentos   2.5      kN (pont) │
└───────────────────────────────────┘
```

**Paredes (RCP - Revestimentos/Cargas/Paredes):**
```
┌─ PAREDES ─────────────────────────┐
│ [+ Adicionar Parede]              │
│                                   │
│ L(m)  e(m)  h(m)  γ(kN/m³)  kN/m² │
│ ──────────────────────────────────│
│ 5.0   0.20  3.0   25        12.5  │
│ 3.5   0.15  3.0   18         8.1  │
└───────────────────────────────────┘
```

**Persistência:**
```json
// zones.permanentes
[
  {"nome": "Divisórias", "valor": 1.0, "tipo": "area"},
  {"nome": "Equipamentos", "valor": 2.5, "tipo": "pontual"}
]

// zones.walls
[
  {"comprimento": 5.0, "espessura": 0.20, "altura": 3.0, "gamma": 25},
  {"comprimento": 3.5, "espessura": 0.15, "altura": 3.0, "gamma": 18}
]
```

---

## NÍVEL 6 · ACÇÕES (MOTOR CÁLCULO EC1/EC8)

### 6.1 Seleção de Acções (Checkboxes)

**Localização:** Secção 7 (Acções)

**UI:**
```
┌─ ACÇÕES CONSIDERADAS ──────────────┐
│ ☑️ Gravíticas (Obrigatório)        │
│ ☐ Sismo (EC8)                      │
│ ☐ Vento (EC1-1-4)                  │
│ ☐ Impulsos de Terras               │
│ ☐ Retração/Fluência                │
│ ☐ Temperatura                      │
│ ☐ Neve (EC1-1-3)                   │
│ ☐ Água (Subpressões)               │
└────────────────────────────────────┘
```

**Dinâmica:** Marcar checkbox → mostra sub-secção específica.

---

### 6.2 Acções Gravíticas (Análise Analítica)

**Workflow:**
1. Selector Bloco: `[Dropdown: Bloco A ▼]`
2. Selector Piso: `[Dropdown: Piso 0 ▼]`
3. Canvas Viewer (FloorViewer class)

**Modos Visualização:**

| Modo | Botão | Exibição |
|------|-------|----------|
| Lajes | `[🏗️ Lajes]` | Polígonos coloridos por tipo laje |
| Sobrecargas | `[📦 Sobrecargas]` | Heatmap qk (kN/m²) |
| RCP | `[🧱 RCP]` | Paredes + cargas permanentes |
| Combinações | `[⚖️ Combinações]` | ELU Fund. 1 (1.35G + 1.50Q) |
| Heatmap ELU | `[🌡️ Heatmap]` | Gradiente vermelho→verde |
| Sonda | `[🔍 Sonda]` | Click → popup com G, Q, ELU |
| Pré-Dim. | `[📐 Pré-Dim]` | Espessura mínima sugerida |

**Cálculo ELU por Zona:**
```javascript
function calculateZoneELU(zone, floor, block, project) {
  // 1. Get effective params
  const materiais = block.materiais || project.materiais;
  const gammaBetao = materiais.betao.gamma || 25;
  
  // 2. Permanentes
  const espessuraLaje = zone.espessura;
  const pesoLaje = espessuraLaje * gammaBetao;
  const permanentesAdicionais = zone.permanentes.reduce((sum, p) => sum + p.valor, 0);
  const G = pesoLaje + permanentesAdicionais;
  
  // 3. Sobrecargas (do piso, não do bloco)
  const Q = floor.sobrecargas.qk;
  
  // 4. Combinações EC0
  return {
    'ELU Fund. 1': 1.35 * G + 1.50 * Q,
    'ELU Fund. 2': 1.35 * G + 1.50 * 0.7 * Q,
    'SLS Caract.': G + Q,
    'SLS Freq.': G + 0.5 * Q,
    'SLS Q-perm.': G + 0.3 * Q
  };
}
```

---

### 6.3 Acção Sísmica (EC8)

**UI:**
```
┌─ PARÂMETROS SÍSMICOS ────────────────┐
│ Zona: [Importado Nível 2]            │
│ Terreno: [Importado Geotecnia]       │
│ Classe Importância: [II ▼]           │
│ ag: [1.5 g] (auto)                   │
│ Coef. q: [3.0__]                     │
│ Amortecimento: [5__] %               │
│                                       │
│ [📊 Gerar Espectros]                 │
└──────────────────────────────────────┘
```

**Gráficos (Chart.js):**

Canvas 1: Espectro Tipo 1 (Tectónica Afastada)
```
      Sa(T)/q
       ▲
   2.5 │    ___________
       │   /           \___
   1.5 │  /                \___
       │ /                     \___
   0.5 │/                          \___
       └─────────────────────────────────► T (s)
         0   TB  TC        TD        4
```

Canvas 2: Espectro Tipo 2 (Tectónica Próxima)

**Função:** `generateSeismicSpectrum(block, project)` (ver ESPECIFICACAO.md §6.2)

---

### 6.4 Acção do Vento (EC1-1-4)

**UI:**
```
┌─ PARÂMETROS VENTO ───────────────────┐
│ Zona: [Importado Nível 2]            │
│ vb,0: [27 m/s] (auto)                │
│ Categoria Terreno: [II ▼]            │
│ z0: [0.05 m] (auto)                  │
│ co: [1.0__]                          │
│ cpi: [0.0__]                         │
│                                       │
│ Altura Edifício: [12.0__] m          │
│ qp(z): [0.85 kN/m²] (auto)           │
└──────────────────────────────────────┘
```

**Cálculo Pressão Dinâmica:**
```javascript
function calculateWindPressure(vb0, z, categoria, co) {
  const z0_values = {'I': 0.003, 'II': 0.05, 'III': 0.3, 'IV': 1.0};
  const z0 = z0_values[categoria];
  const kr = 0.19 * (z0 / 0.05) ** 0.07;
  const vm = kr * Math.log(z / z0) * co * vb0;
  const qp = 0.5 * 1.25 * vm**2 / 1000;  // kN/m²
  return qp;
}
```

---

### 6.5 Outras Acções (Simplificado)

#### Impulsos de Terras
```
Altura Contensão: [___] m
γ: [18] kN/m³
φ: [30] º
c: [0] kPa
K0: [0.5] (auto)
Sobrecarga: [10] kN/m²
```

#### Retração/Fluência
```
HR: [60] %
t0: [28] dias
Tipo Cimento: [N ▼]
Cura: [Húmida ▼]
```

#### Temperatura
```
ΔT Contração: [-20] °C
ΔT Expansão: [+30] °C
α: [1.0e-5] /°C
T ref.: [10] °C
```

#### Neve
```
Zona: [Importado Nível 2]
Altitude: [200] m
sk: [0.6 kN/m²] (auto)
```

#### Água
```
Nível Freático: [-2.0] m
γw: [10] kN/m³
Subpressões: [Sim ▼]
Drenagem: [Não ▼]
```

---

## NÍVEL 7 · ELEMENTOS BASE & CONDICIONANTES

### 7.1 Elementos Base (Histórico Documentos)

**Textareas (8 campos):**

| Campo | Conteúdo Típico |
|-------|-----------------|
| Arquitetura | "Projecto Arquitectura rev. 3 (25/01/2025)" |
| MEP | "Especialidades AVAC/Eléctrica/Águas" |
| Escavação | "Escavação até cota -6.00 m" |
| Geotécnico/Hidro | "Estudo JSJ-GEO-2025-01" |
| Prospeções | "3 sondagens rotativas" |
| Caracterização | "Inspecção visual estrutura existente" |
| Ensaios | "Ensaios betão in-situ (esclerómetro)" |
| Originais | "Projecto original 1985 (arquivo PDF)" |

**Persistência:** JSONB `projects.elementos_base`

---

### 7.2 Condições Arquitetónicas

**Textarea:**
```
Pés-direitos mínimos: 2.80 m
Vãos máximos: 6.0 m
Restrições modulação: 0.30 m
Alinhamentos fachada: máx. 0.20 m
```

**Persistência:** `projects.cond_arq` TEXT

---

### 7.3 Horizontes Geotécnicos (Tabela Dinâmica)

**UI:**
```
┌─ HORIZONTES GEOTÉCNICOS ────────────────────────┐
│ [+ Adicionar Horizonte]                         │
│                                                  │
│ H   NSPT  γ    c'   φ    E     σadm  Escav.    │
│ ──────────────────────────────────────────────  │
│ H1  15    18   0    28   20    200   Fácil     │
│ H2  25    19   5    32   40    300   Média     │
│ H3  >50   20   10   35   80    500   Explosivos│
└──────────────────────────────────────────────────┘
```

**Persistência:** Tabela `geo_horizons` (foreign key `project_id`)

---

### 7.4 Condições Hidrogeológicas

**Inputs:**
```
Nível Freático: [-2.0__] m
Coluna Água: [0.5__] m
Agressividade (XA): [XA1 ▼]
Observações: [Textarea]
```

**Persistência:** JSONB `projects.cond_hidro`

---

## NÍVEL 8 · CRITÉRIOS E RELATÓRIOS

### 8.1 Critérios de Segurança

**Textareas:**
```
Regulamentação:
EC0, EC1, EC2, EC8, REBAP (verificação)

Critérios Dimensionamento:
ELU: Resistência + Estabilidade
ELS: Deformação (L/250), Fendilhação (0.3 mm)
```

**Persistência:**
- `projects.crit_reg` TEXT
- `projects.crit_dim` TEXT

---

### 8.2 Exportação e Outputs

#### Export JSON (Backup)

**Trigger:** Botão `[💾 Exportar JSON]`

**Workflow:**
```javascript
async function exportJSON() {
  const projectId = currentProjectId;
  const data = await getProject(projectId);  // Full nested query
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `projeto_${data.id_jsj}_${Date.now()}.json`;
  a.click();
}
```

#### Import JSON

**Trigger:** Botão `[📂 Importar JSON]`

**Input:** `<input type="file" accept="application/json">`

**Workflow:**
```javascript
async function importJSON(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const data = JSON.parse(e.target.result);
    
    // Validar schema
    if (!data.nome_projeto || !data.blocks) {
      alert('JSON inválido');
      return;
    }
    
    // Criar projeto
    const project = await createProject(data);
    
    // Criar blocos
    for (const block of data.blocks) {
      const newBlock = await createBlock(project.id, block);
      
      // Criar pisos
      for (const floor of block.floors) {
        const newFloor = await createFloor(newBlock.id, project.id, floor);
        
        // Criar zonas
        for (const zone of floor.zones) {
          await createZone(newFloor.id, project.id, zone);
        }
      }
    }
    
    alert('✅ Importação concluída');
    window.location.href = `Index_v11.1.html?project=${project.id}`;
  };
  reader.readAsText(file);
}
```

---

## RESUMO FLUXO DE DADOS (END-TO-END)

### Exemplo Prático: "Criar Projeto Completo"

```
1. Login @jsj.pt → lobby.html
2. [+ Novo Projeto]
3. Nível 1: Preenche ID JSJ, Nome, Cliente
4. Nível 2: Marca "Global" em Materiais/Sismo
5. Nível 3: Cria 2 blocos
   - Bloco A (Edifício): Herda tudo
   - Bloco B (Pavilhão): Override materiais (C25/30)
6. Nível 4: Adiciona pisos
   - Bloco A: 3 pisos (Fundação, Térreo, 2× Elevado)
   - Bloco B: 1 piso (Térreo)
7. Nível 4: Upload imagens (4 PNGs → Supabase Storage)
8. Nível 5: Abre Editor Zonas (Piso 0 Bloco A)
   - Desenha 3 polígonos
   - Atribui Uso "B" (Escritórios)
   - Save
9. Nível 6: Activa Sismo
   - Gera espectros automáticos
   - Visualiza Heatmap ELU
10. Aguarda auto-save (30s) → ✅ PostgreSQL
11. Fecha tab → Realtime desliga
12. Reabre projeto → Tudo sincronizado
```

**Queries PostgreSQL (10 passos):**
1. `INSERT INTO projects` (1×)
2. `INSERT INTO blocks` (2×)
3. `INSERT INTO floors` (4×)
4. `INSERT INTO project_files` (4× metadata imagens)
5. Storage uploads (4× blobs)
6. `INSERT INTO zones` (3×)
7. `UPDATE projects SET sismo = {...}` (1×)
8. Auto-save: `UPDATE projects SET updated_at = now()` (∞)
9. Realtime: `SELECT * FROM projects WHERE id = ...` (1×)
10. Re-fetch: Query aninhada completa (1×)

---

## APÊNDICE A: KEYBOARD SHORTCUTS (Futuro v11.2+)

**Planeado:**
- `Ctrl+S`: Manual save
- `Ctrl+Shift+E`: Export JSON
- `Ctrl+Shift+Z`: Open Zones Editor
- `Ctrl+B`: Add Block
- `Ctrl+F`: Add Floor
- `Esc`: Close modals

---

## APÊNDICE B: GLOSSÁRIO TÉCNICO

| Termo | Definição |
|-------|-----------|
| Bloco | Unidade estrutural independente (edifício, pavilhão, fundação) |
| Tipologia Piso | Classificação funcional (fundação/térreo/elevado/cobertura) |
| Inherit-or-Override | Pattern onde parâmetros globais podem ser sobrescritos ao nível bloco |
| Lazy Loading | Técnica carregar assets on-demand (não eager) |
| RLS | Row Level Security (PostgreSQL policies ownership) |
| Signed URL | URL temporário com token autenticação (TTL 7 dias) |
| ELU | Estado Limite Último (resistência estrutural) |
| SLS | Estado Limite Serviço (deformações, fendilhação) |
| EC0/EC1/EC2/EC8 | Eurocódigos (normas europeias estruturas) |

---

**FIM MANUAL FUNCIONAL v11.1**

Última Atualização: 15/02/2026  
Maintainer: David (JSJ)  
Stack: Supabase + Vanilla JS + Canvas API
