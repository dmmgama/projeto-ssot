# ESPECIFICAÇÃO TÉCNICA · SSOT JSJ Template

**Versão:** v11.1 (Supabase Backend + Schema Blocos + Asset Storage)  
**Última Atualização:** 15/02/2026  
**Objetivo:** Schema completo PostgreSQL, API Supabase, fluxos de dados, motor gráfico Canvas

---

## 1. VISÃO GERAL DA ARQUITETURA

### 1.1 Stack Tecnológico v11.1

**Frontend:**
- Vanilla JavaScript (ES6+)
- HTML5 + CSS3
- Canvas API (motor gráfico)
- Chart.js 4.x (espectros sísmicos)

**Backend (Supabase):**
- **PostgreSQL 15+**: Database relacional (JSONB, foreign keys, triggers)
- **Supabase Auth**: Autenticação email/password + magic link (@jsj.pt whitelist)
- **Supabase Storage**: Blob storage (PNGs, PDFs, DXFs, Excel, vídeos)
- **Supabase Realtime**: PostgreSQL WAL subscriptions (auto-sync multi-tab)
- **Row Level Security (RLS)**: Policies owner-only com cascade via JOINs

**Hosting:**
- Supabase Hosting (static files CDN)
- Deployment via CLI: `supabase deploy`

### 1.2 Filosofia Arquitetural

**Single Source of Truth (SSOT):**
- PostgreSQL = fonte de verdade persistente
- Runtime: Objecto global `projectData` (sincronizado via Realtime)
- DOM = reflexo visual (nunca ler do DOM para cálculos)

**Hierarquia Relacional:**
```
Projeto (1)
└─ Blocos (N)  ← 🆕 v11.1
   ├─ Nome, tipo (edifício/pavilhão/fundação)
   ├─ Parâmetros override (geotecnia, materiais, acções)
   └─ Pisos (N)
      ├─ Tipologia (fundação/térreo/elevado/cobertura)  ← 🆕 v11.1
      ├─ Geometria (cota, altura)
      ├─ Sobrecargas (sempre por piso)
      ├─ Cargas Permanentes (sempre por piso)
      ├─ Imagem (Supabase Storage, lazy load)  ← 🆕 v11.1
      └─ Zonas (N)
         ├─ Polígonos Canvas (shapes JSONB)
         ├─ Uso EC1, tipo laje, espessura
         └─ Acções combinadas (G+Q+Sismo/Vento)
```

**Inherit-or-Override Pattern:**
- Parâmetros globais (projeto) podem ser sobrescritos ao nível bloco
- Função `get_effective_param()` PostgreSQL (COALESCE block → project)
- UI: Radio buttons "Global / Por Bloco" em cada parâmetro

### 1.3 Fluxo de Dados (v11.1)

```
┌─ USER INPUT ──────────────────────────┐
│ Formulário HTML (8 secções)           │
│ └─ onChange → updateProjectData()     │
└───────────────┬───────────────────────┘
                ↓
┌─ RUNTIME STATE ───────────────────────┐
│ projectData (objeto JavaScript)       │
│ ├─ Blocos (array objetos)             │
│ │  └─ Pisos (array objetos)           │
│ │     └─ Zonas (array objetos)        │
│ └─ Auto-save timer (30s interval)     │
└───────────────┬───────────────────────┘
                ↓
┌─ PERSISTENCE (Supabase) ──────────────┐
│ PostgreSQL (6 tabelas relacionais)    │
│ ├─ projects                           │
│ ├─ blocks (foreign key project_id)    │
│ ├─ floors (foreign keys block_id)     │
│ ├─ zones (foreign key floor_id)       │
│ ├─ geo_horizons (foreign key proj_id) │
│ └─ project_files (catálogo assets)    │
│                                        │
│ Storage (blob files)                  │
│ └─ project-assets/{project_id}/...    │
│    ├─ floors/{floor_id}/image.png     │
│    ├─ blocks/{block_id}/report.pdf    │
│    └─ speckle/{model_id}.ifc          │
└───────────────┬───────────────────────┘
                ↓
┌─ REALTIME SYNC ───────────────────────┐
│ Supabase Realtime (PostgreSQL WAL)    │
│ └─ onUpdate → reloadProjectData()     │
└───────────────────────────────────────┘
```

---

## 2. DATABASE SCHEMA (PostgreSQL)

### 2.1 Tabela `projects` (Dados Globais)

```sql
CREATE TABLE projects (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Administrativo
  id_jsj TEXT,
  nome_projeto TEXT NOT NULL,
  cliente TEXT,
  designacao TEXT,
  localizacao JSONB,  -- {pais, cidade, morada}
  tipologia TEXT,
  especialidade TEXT,
  tipo_obra TEXT,
  fase_atual TEXT,
  
  -- Equipa JSJ
  equipa_jsj JSONB,  -- {resp_tecnico, eng, bim, gestao, ...}
  
  -- Equipa Dono de Obra
  equipa_dono_obra JSONB,  -- {dono_obra, arquitetura, gestao, ...}
  
  -- Fases (tabela dinâmica)
  fases JSONB,  -- [{fase:'EP', data_entrega:'2025-01-01', estado:'Concluído'}]
  
  -- PARÂMETROS GLOBAIS (can be overridden at block level)
  geotecnia JSONB,          -- {tipo_solo, nspt, sigma_adm, ...}
  materiais JSONB,          -- {betao:{classe:'C30/37', fck:30}, aco:{tipo:'A500NR'}}
  vento JSONB,              -- {velocidade_base, categoria_terreno, ...}
  neve JSONB,               -- {zona, altitude, sk, ...}
  temperatura JSONB,        -- {variacao_termica, alpha, ...}
  sismo JSONB,              -- {ag, espectro, classe_importancia, q, ...}
  
  -- Master switch (1 flag = todos params ou nenhum)
  use_global_params BOOLEAN DEFAULT true,
  
  -- Condicionantes
  elementos_base JSONB,     -- {arq, mep, escav, geotec, ...}
  cond_arq TEXT,
  cond_hidro JSONB,         -- {nivel_freatico, coluna_agua, xa, obs}
  
  -- Solução Estrutural
  sol_desc TEXT,
  
  -- Critérios
  crit_reg TEXT,
  crit_dim TEXT,
  
  -- Links Servidor Legacy 🆕
  server_path TEXT,  -- UNC path (\\jsjnas\Projectos\...)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_id_jsj ON projects(id_jsj);
```

### 2.2 Tabela `blocks` (Blocos Estruturais) 🆕

```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Identificação
  name TEXT NOT NULL,             -- "Edifício A", "Pavilhão", "Embasamento"
  description TEXT,
  block_type TEXT,                -- 'building', 'annex', 'foundation', 'shared'
  
  -- OVERRIDE PARAMETERS (NULL = inherit from project)
  geotecnia JSONB,
  materiais JSONB,
  vento JSONB,
  neve JSONB,
  temperatura JSONB,
  sismo JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blocks_project ON blocks(project_id);
```

**Lógica Inherit-or-Override:**
```sql
-- Função PostgreSQL: obter parâmetro efetivo (block override OR project default)
CREATE OR REPLACE FUNCTION get_effective_param(
  p_block_id UUID,
  p_param_name TEXT  -- 'geotecnia', 'materiais', 'vento', etc
) RETURNS JSONB AS $$
  SELECT COALESCE(
    -- 1º: Tenta block override
    (SELECT (row_to_json(b)::jsonb) -> p_param_name
     FROM blocks b WHERE b.id = p_block_id),
    -- 2º: Fallback para project default
    (SELECT (row_to_json(p)::jsonb) -> p_param_name
     FROM projects p 
     JOIN blocks b ON p.id = b.project_id
     WHERE b.id = p_block_id)
  );
$$ LANGUAGE SQL;

-- Exemplo uso:
-- SELECT get_effective_param('bloco_A_id', 'materiais') AS materiais_efetivos;
```

### 2.3 Tabela `floors` (Pisos)

```sql
CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,  -- redundante para queries rápidas
  
  -- Identificação
  floor_number INTEGER NOT NULL,
  floor_type TEXT DEFAULT 'elevado',  -- 🆕 'fundacao', 'terreo', 'elevado', 'cobertura'
  name TEXT,                          -- "Piso 0", "Cave -1", etc
  
  -- Geometria
  cota REAL,              -- m (nível absoluto)
  height REAL,            -- m (pé-direito)
  area REAL,              -- m² (calculado auto se zonas existirem)
  
  -- FLOOR-SPECIFIC ACTIONS (sempre por piso, nunca herdado)
  sobrecargas JSONB,         -- {uso:'B', qk:3.0}
  cargas_permanentes JSONB,  -- {revestimento:1.5, divisorias:1.0}
  
  -- Asset Storage (Supabase Storage) 🆕
  image_storage_path TEXT,      -- 'project-assets/{proj_id}/floors/{floor_id}/image.png'
  image_download_url TEXT,      -- Signed URL (TTL 7 dias)
  image_url_expiry TIMESTAMPTZ, -- Timestamp para refresh
  image_file_size INTEGER,      -- bytes
  image_mime_type TEXT,         -- 'image/png', 'image/jpeg'
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_floors_block ON floors(block_id);
CREATE INDEX idx_floors_project ON floors(project_id);
CREATE INDEX idx_floors_type ON floors(floor_type);
```

**Tipologias de Piso (Enum-like):**
- `fundacao`: Pisos de fundação (sapatas, estacas, ensoleiramento)
- `terreo`: Piso térreo (contacto com solo)
- `elevado`: Pisos elevados (lajes entre pisos)
- `cobertura`: Cobertura (laje de esteira, telhado)

### 2.4 Tabela `zones` (Zonas Gráficas)

```sql
CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID REFERENCES floors(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,  -- redundante
  
  -- Identificação
  name TEXT,
  
  -- Geometria Canvas
  area REAL,              -- m² (calculado via polígonos)
  shapes JSONB,           -- [{type:'polygon', points:[{x,y}], color:'#...'}]
  
  -- Estrutural
  uso TEXT,               -- Categoria EC1 ('A'-'H')
  tipo_laje TEXT,         -- 'Maciça', 'Fungiforme', 'Aligeirada', etc
  espessura REAL,         -- m
  vao_max REAL,           -- m
  
  -- Cargas Adicionais
  permanentes JSONB,      -- [{nome:'Divisórias', valor:1.0, tipo:'kN/m²'}]
  walls JSONB,            -- [{comprimento:5, espessura:0.2, altura:3, gamma:25}]
  
  -- Canvas Editor Data (zonas.html legacy sync)
  actions_data JSONB,     -- 🔥 CRÍTICO - Estrutura complexa (ver §6)
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_zones_floor ON zones(floor_id);
CREATE INDEX idx_zones_project ON zones(project_id);
```

### 2.5 Tabela `geo_horizons` (Geotecnia Detalhada)

```sql
CREATE TABLE geo_horizons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Caracterização
  horizonte TEXT,         -- "H1", "H2", etc
  nspt REAL,              -- SPT
  gamma REAL,             -- kN/m³
  c REAL,                 -- kPa (coesão)
  phi REAL,               -- º (ângulo atrito)
  e REAL,                 -- Módulo deformação (MPa)
  sigma_adm REAL,         -- kPa
  escavabilidade TEXT,    -- 'Fácil', 'Difícil', 'Explosivos'
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_geo_project ON geo_horizons(project_id);
```

### 2.6 Tabela `project_files` (Catálogo Asset Storage + Servidor) 🆕

```sql
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Identificação
  file_name TEXT NOT NULL,
  file_type TEXT,  -- 'floor_image', 'pdf', 'dxf', 'excel', 'video', 'speckle_ifc'
  
  -- Localização (ENUM-like: storage OU server OU speckle)
  source_type TEXT,  -- 'supabase_storage', 'server_unc', 'speckle_url'
  
  -- Supabase Storage
  storage_path TEXT,       -- 'project-assets/{proj_id}/...'
  download_url TEXT,       -- Signed URL (TTL)
  url_expiry TIMESTAMPTZ,
  
  -- Servidor Legacy (UNC paths Windows)
  server_path TEXT,        -- '\\jsjnas\Projectos\2025\P123\Memorias\...'
  
  -- Speckle BIM
  speckle_url TEXT,        -- 'https://app.speckle.systems/projects/{id}/models/{id}'
  speckle_model_id TEXT,
  
  -- Metadata
  file_size INTEGER,       -- bytes
  mime_type TEXT,
  description TEXT,
  tags TEXT[],             -- ['geotécnico', 'aprovado', 'rev2']
  
  -- RAG Future (v13.0+)
  embedding VECTOR,        -- pgvector (512 dim) - vazio por agora
  
  -- Entity Association (opcional)
  entity_type TEXT,        -- 'floor', 'block', 'project'
  entity_id UUID,
  
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_files_project ON project_files(project_id);
CREATE INDEX idx_files_entity ON project_files(entity_type, entity_id);
CREATE INDEX idx_files_type ON project_files(file_type);
```

**Filosofia Catálogo Unificado:**
- 1 tabela para **3 fontes** de ficheiros:
  1. **Supabase Storage**: Novos uploads (PNGs, PDFs)
  2. **Servidor Legacy**: Paths UNC Windows (só metadata, ficheiro no NAS)
  3. **Speckle**: URLs BIM models (live-sync v12.0+)
- Preparado para RAG v13.0 (campo `embedding` vazio)

---

### 2.7 Row Level Security (RLS Policies)

**Princípio:** Owner-only access cascading via JOINs.

```sql
-- Enable RLS em todas as tabelas
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE geo_horizons ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Policy: projects (direto ownership)
CREATE POLICY "Users can CRUD own projects" ON projects
FOR ALL USING (auth.uid() = user_id);

-- Policy: blocks (ownership via projects.user_id)
CREATE POLICY "Users can CRUD own blocks" ON blocks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = blocks.project_id 
    AND p.user_id = auth.uid()
  )
);

-- Policy: floors (ownership via blocks → projects)
CREATE POLICY "Users can CRUD own floors" ON floors
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = floors.project_id 
    AND p.user_id = auth.uid()
  )
);

-- Policy: zones (ownership via floors → projects)
CREATE POLICY "Users can CRUD own zones" ON zones
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = zones.project_id 
    AND p.user_id = auth.uid()
  )
);

-- Policy: geo_horizons
CREATE POLICY "Users can CRUD own geo_horizons" ON geo_horizons
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = geo_horizons.project_id 
    AND p.user_id = auth.uid()
  )
);

-- Policy: project_files
CREATE POLICY "Users can CRUD own project_files" ON project_files
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_files.project_id 
    AND p.user_id = auth.uid()
  )
);
```

**Segurança Adicional:**
- Foreign keys `ON DELETE CASCADE` garantem limpeza automática
- RLS aplicado mesmo com direct SQL queries (bypass impossível via API)
- Storage policies validam ownership antes de gerar signed URLs

---

### 2.8 Auth Whitelist (@jsj.pt)

**SQL Trigger:** Valida email no signup.

```sql
-- Função trigger: rejeita emails não @jsj.pt
CREATE OR REPLACE FUNCTION check_jsj_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email NOT LIKE '%@jsj.pt' THEN
    RAISE EXCEPTION 'Only @jsj.pt emails allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger em auth.users (Supabase internal table)
CREATE TRIGGER enforce_jsj_email_only
BEFORE INSERT OR UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION check_jsj_email();
```

**Alternativa Manual (Admin Panel):**
- Supabase Dashboard → Authentication → Policies → Email Domain Restriction
- Configuração UI: `Allowed email domains: jsj.pt`

---

### 2.9 Migration Strategy v11.0 → v11.1

**Script SQL (One-Time Manual):**

```sql
-- FASE 1: Criar bloco default para cada projeto
INSERT INTO blocks (project_id, name, block_type)
SELECT id, 'Edifício Principal', 'building' 
FROM projects;

-- FASE 2: Migrar floors para block_id
UPDATE floors f
SET block_id = (
  SELECT b.id FROM blocks b 
  WHERE b.project_id = f.project_id 
  LIMIT 1
);

-- FASE 3: Validar (TODOS os floors devem ter block_id)
SELECT COUNT(*) FROM floors WHERE block_id IS NULL;
-- Esperado: 0

-- FASE 4: Tornar block_id NOT NULL (após validar)
ALTER TABLE floors ALTER COLUMN block_id SET NOT NULL;
```

**Notas:**
- Projetos v11.0 (Firebase) → exportar JSON via `exportJSON()`
- Upload JSON para v11.1 via import wizard (parsing manual)
- Imagens Base64 v11.0 → upload para Supabase Storage (conversão manual)

---

## 3. API SUPABASE (JavaScript SDK)

### 3.1 Inicialização (supabase-config.js)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';
const supabaseAnonKey = 'YOUR_ANON_KEY';  // Public API key (safe para frontend)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10  // Throttle realtime events
    }
  }
});
```

---

### 3.2 Auth (supabase-data.js)

#### Signup
```javascript
async function signupUser(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  });
  
  if (error) throw error;
  
  // Email confirmation enviado
  // Aguardar user.email_confirmed_at !== null
  
  return data.user;
}
```

#### Login
```javascript
async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });
  
  if (error) throw error;
  
  return data.session;
}
```

#### Logout
```javascript
async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
```

#### Get Current User
```javascript
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

---

### 3.3 CRUD Projects

#### Create
```javascript
async function createProject(projectData) {
  const user = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      nome_projeto: projectData.nome_projeto,
      cliente: projectData.cliente,
      // ... resto dos campos
      geotecnia: projectData.geotecnia,  // JSONB direto
      materiais: projectData.materiais,
      use_global_params: true  // default
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

#### Read (Single)
```javascript
async function getProject(projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      blocks (
        *,
        floors (
          *,
          zones (*)
        )
      ),
      geo_horizons (*),
      project_files (*)
    `)
    .eq('id', projectId)
    .single();
  
  if (error) throw error;
  return data;
}
```

**Nota:** Query aninhada retorna hierarquia completa (1 request).

#### Read (List - Lobby)
```javascript
async function listUserProjects() {
  const user = await getCurrentUser();
  
  const { data, error } = await supabase
    .from('projects')
    .select('id, nome_projeto, cliente, updated_at, id_jsj')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data;
}
```

**Performance:** Não carrega blocos/pisos/zonas no lobby (lazy load).

#### Update
```javascript
async function updateProject(projectId, updates) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)  // Partial update (só campos changed)
    .eq('id', projectId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

**Auto-save Example:**
```javascript
// Index_v11.1.html
let autoSaveTimer;

function startAutoSave() {
  autoSaveTimer = setInterval(async () => {
    const updates = collectChangedFields();  // Diff vs last save
    if (Object.keys(updates).length > 0) {
      await updateProject(currentProjectId, updates);
      console.log('✅ Auto-save:', updates);
    }
  }, 30000);  // 30s
}

window.addEventListener('beforeunload', () => {
  clearInterval(autoSaveTimer);
});
```

#### Delete
```javascript
async function deleteProject(projectId) {
  // CASCADE automático: apaga blocks → floors → zones
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);
  
  if (error) throw error;
}
```

---

### 3.4 CRUD Blocks (🆕 v11.1)

#### Create
```javascript
async function createBlock(projectId, blockData) {
  const { data, error } = await supabase
    .from('blocks')
    .insert({
      project_id: projectId,
      name: blockData.name,
      block_type: blockData.block_type || 'building',
      description: blockData.description,
      // Overrides (NULL = inherit from project)
      geotecnia: blockData.geotecnia || null,
      materiais: blockData.materiais || null,
      vento: blockData.vento || null
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

#### Read (com pisos)
```javascript
async function getBlock(blockId) {
  const { data, error } = await supabase
    .from('blocks')
    .select(`
      *,
      floors (
        *,
        zones (*)
      )
    `)
    .eq('id', blockId)
    .single();
  
  if (error) throw error;
  return data;
}
```

#### Update
```javascript
async function updateBlock(blockId, updates) {
  const { data, error } = await supabase
    .from('blocks')
    .update(updates)
    .eq('id', blockId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

#### Delete
```javascript
async function deleteBlock(blockId) {
  // Validar antes: tem pisos?
  const { data: floors } = await supabase
    .from('floors')
    .select('id')
    .eq('block_id', blockId);
  
  if (floors.length > 0) {
    const confirmDelete = confirm(
      `Bloco tem ${floors.length} piso(s). Apagar tudo?`
    );
    if (!confirmDelete) return;
  }
  
  // CASCADE automático: apaga floors → zones
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('id', blockId);
  
  if (error) throw error;
}
```

---

### 3.5 CRUD Floors

#### Create
```javascript
async function createFloor(blockId, projectId, floorData) {
  const { data, error } = await supabase
    .from('floors')
    .insert({
      block_id: blockId,
      project_id: projectId,  // redundante para queries rápidas
      floor_number: floorData.floor_number,
      floor_type: floorData.floor_type || 'elevado',
      name: floorData.name,
      cota: floorData.cota,
      height: floorData.height,
      sobrecargas: floorData.sobrecargas,
      cargas_permanentes: floorData.cargas_permanentes
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

#### Update
```javascript
async function updateFloor(floorId, updates) {
  const { data, error } = await supabase
    .from('floors')
    .update(updates)
    .eq('id', floorId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

#### Delete
```javascript
async function deleteFloor(floorId) {
  // 1. Apagar imagem Storage (se existir)
  const { data: floor } = await supabase
    .from('floors')
    .select('image_storage_path')
    .eq('id', floorId)
    .single();
  
  if (floor?.image_storage_path) {
    await deleteFloorImage(floorId);  // Ver §4.2
  }
  
  // 2. Apagar row (CASCADE apaga zones)
  const { error } = await supabase
    .from('floors')
    .delete()
    .eq('id', floorId);
  
  if (error) throw error;
}
```

---

### 3.6 CRUD Zones

#### Create
```javascript
async function createZone(floorId, projectId, zoneData) {
  const { data, error } = await supabase
    .from('zones')
    .insert({
      floor_id: floorId,
      project_id: projectId,
      name: zoneData.name,
      area: zoneData.area,
      shapes: zoneData.shapes,  // JSONB
      uso: zoneData.uso,
      tipo_laje: zoneData.tipo_laje,
      espessura: zoneData.espessura,
      vao_max: zoneData.vao_max,
      permanentes: zoneData.permanentes,
      walls: zoneData.walls,
      actions_data: zoneData.actions_data  // zonas.html legacy
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

#### Update
```javascript
async function updateZone(zoneId, updates) {
  const { data, error } = await supabase
    .from('zones')
    .update(updates)
    .eq('id', zoneId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

#### Delete
```javascript
async function deleteZone(zoneId) {
  const { error } = await supabase
    .from('zones')
    .delete()
    .eq('id', zoneId);
  
  if (error) throw error;
}
```

---

### 3.7 Realtime Subscriptions

**Pattern:** Subscribe ao nível `projects` (inclui changes em blocks/floors/zones via triggers).

```javascript
// Index_v11.1.html
let realtimeSubscription;

async function subscribeToProject(projectId) {
  realtimeSubscription = supabase
    .channel(`project:${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',  // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'projects',
        filter: `id=eq.${projectId}`
      },
      (payload) => {
        console.log('🔄 Realtime update:', payload);
        reloadProjectData(projectId);  // Re-fetch completo
      }
    )
    .subscribe();
}

// Cleanup obrigatório
window.addEventListener('beforeunload', async () => {
  if (realtimeSubscription) {
    await supabase.removeChannel(realtimeSubscription);
  }
});
```

**Trigger PostgreSQL (propagar changes de blocks/floors/zones para projects):**

```sql
-- Função: touch project.updated_at quando child tables mudam
CREATE OR REPLACE FUNCTION touch_project_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects SET updated_at = now()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers em blocks, floors, zones
CREATE TRIGGER touch_project_on_blocks AFTER INSERT OR UPDATE OR DELETE ON blocks
FOR EACH ROW EXECUTE FUNCTION touch_project_updated_at();

CREATE TRIGGER touch_project_on_floors AFTER INSERT OR UPDATE OR DELETE ON floors
FOR EACH ROW EXECUTE FUNCTION touch_project_updated_at();

CREATE TRIGGER touch_project_on_zones AFTER INSERT OR UPDATE OR DELETE ON zones
FOR EACH ROW EXECUTE FUNCTION touch_project_updated_at();
```

**Resultado:** 1 subscription captura TODAS as mudanças hierarquia.

---

## 4. SUPABASE STORAGE (Asset Storage Layer) 🆕

### 4.1 Arquitetura Storage

**Bucket:** `project-assets` (público com RLS via path prefix)

**Estrutura Paths:**
```
project-assets/
├─ {project_id}/
│  ├─ floors/
│  │  ├─ {floor_id}/
│  │  │  └─ image.png
│  ├─ blocks/
│  │  ├─ {block_id}/
│  │  │  ├─ report.pdf
│  │  │  └─ calcs.xlsx
│  ├─ speckle/
│  │  └─ {model_id}.ifc
│  └─ general/
│     ├─ geotecnico.pdf
│     └─ arquitetura.dxf
```

**Filosofia:**
- **Lazy Loading**: Imagens carregam on-demand (Viewer), nunca no lobby
- **Signed URLs**: TTL 7 dias (refreshed automaticamente)
- **Metadata Firestore**: Paths + expiry timestamps (queryable)

---

### 4.2 Upload Floor Image

```javascript
async function uploadFloorImage(floorId, projectId, file) {
  // 1. Validar tipo
  if (!file.type.startsWith('image/')) {
    throw new Error('Só imagens PNG/JPG');
  }
  
  // 2. Path Storage
  const storagePath = `${projectId}/floors/${floorId}/image.png`;
  
  // 3. Upload blob
  const { data, error } = await supabase.storage
    .from('project-assets')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: true  // Overwrite se existir
    });
  
  if (error) throw error;
  
  // 4. Gerar signed URL (TTL 7 dias)
  const { data: urlData } = await supabase.storage
    .from('project-assets')
    .createSignedUrl(storagePath, 604800);  // 7 dias em segundos
  
  const downloadURL = urlData.signedUrl;
  const expiry = new Date(Date.now() + 604800 * 1000);
  
  // 5. Update metadata em floors table
  await supabase
    .from('floors')
    .update({
      image_storage_path: storagePath,
      image_download_url: downloadURL,
      image_url_expiry: expiry.toISOString(),
      image_file_size: file.size,
      image_mime_type: file.type
    })
    .eq('id', floorId);
  
  return downloadURL;
}
```

---

### 4.3 Download Floor Image (Lazy Load)

```javascript
async function getFloorImageURL(floorId) {
  // 1. Fetch metadata
  const { data: floor } = await supabase
    .from('floors')
    .select('image_storage_path, image_download_url, image_url_expiry')
    .eq('id', floorId)
    .single();
  
  if (!floor.image_storage_path) return null;
  
  // 2. Check expiry
  const now = new Date();
  const expiry = new Date(floor.image_url_expiry);
  
  if (now < expiry) {
    // URL ainda válido
    return floor.image_download_url;
  }
  
  // 3. Refresh signed URL (expirou)
  const { data: urlData } = await supabase.storage
    .from('project-assets')
    .createSignedUrl(floor.image_storage_path, 604800);
  
  const newURL = urlData.signedUrl;
  const newExpiry = new Date(Date.now() + 604800 * 1000);
  
  // 4. Update metadata
  await supabase
    .from('floors')
    .update({
      image_download_url: newURL,
      image_url_expiry: newExpiry.toISOString()
    })
    .eq('id', floorId);
  
  return newURL;
}
```

**Client-side Caching:**
```javascript
// FloorViewer.js
class FloorViewer {
  constructor() {
    this.imageCache = new Map();  // {floorId: blob URL}
  }
  
  async loadFloorImage(floorId) {
    // Cache check
    if (this.imageCache.has(floorId)) {
      return this.imageCache.get(floorId);
    }
    
    // Fetch signed URL
    const signedURL = await getFloorImageURL(floorId);
    if (!signedURL) return null;
    
    // Download blob
    const response = await fetch(signedURL);
    const blob = await response.blob();
    
    // Create object URL (cache client-side)
    const objectURL = URL.createObjectURL(blob);
    this.imageCache.set(floorId, objectURL);
    
    return objectURL;
  }
  
  cleanup() {
    // Revoke object URLs (evitar memory leak)
    for (const url of this.imageCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.imageCache.clear();
  }
}
```

---

### 4.4 Delete Floor Image

```javascript
async function deleteFloorImage(floorId) {
  // 1. Fetch path
  const { data: floor } = await supabase
    .from('floors')
    .select('image_storage_path')
    .eq('id', floorId)
    .single();
  
  if (!floor.image_storage_path) return;
  
  // 2. Delete blob
  const { error } = await supabase.storage
    .from('project-assets')
    .remove([floor.image_storage_path]);
  
  if (error) throw error;
  
  // 3. Clear metadata
  await supabase
    .from('floors')
    .update({
      image_storage_path: null,
      image_download_url: null,
      image_url_expiry: null,
      image_file_size: null,
      image_mime_type: null
    })
    .eq('id', floorId);
}
```

---

### 4.5 Storage Policies (RLS)

```sql
-- Policy: Users can upload/download own project assets
CREATE POLICY "Users can CRUD own project assets" ON storage.objects
FOR ALL USING (
  bucket_id = 'project-assets' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE user_id = auth.uid()
  )
);
```

**Explicação:**
- Path: `{project_id}/floors/{floor_id}/image.png`
- `(storage.foldername(name))[1]` → extrai `{project_id}` do path
- Valida se user owns project via JOIN `projects.user_id`

---

## 5. MOTOR GRÁFICO (Canvas + FloorViewer)

**NOTA:** Motor gráfico mantém-se **idêntico** à v11.0 (zonas.html + FloorViewer class).  
Mudanças v11.1:
- Imagens carregam via `getFloorImageURL()` (Supabase Storage)
- Metadata `actions_data` persiste em `zones.actions_data` (PostgreSQL JSONB)

### 5.1 Estrutura `actions_data` (JSONB)

```javascript
// zones.actions_data (PostgreSQL JSONB)
{
  blueprint: {
    scale: 1.0,              // m/px
    imageData: ""            // 🆕 v11.1: Supabase Storage URL (não Base64)
  },
  layers: {
    "Estrutura": [
      {
        id: 123,
        design: "L1",
        uso: "B",
        manualLoad: "0.25",  // m (espessura laje)
        shapes: [[[{x:100, y:200}, {x:300, y:200}, ...]]]  // Array nativo (não string)
      }
    ],
    "Sobrecargas": [
      {
        id: 124,
        uso: "B",
        shapes: [[[...]]]
      }
    ],
    "Paredes_RP": [
      {
        id: 125,
        manualLoad: "1.5",  // kN/m² (RCP)
        shapes: [[[...]]]
      }
    ]
  }
}
```

**Diferenças v11.0 → v11.1:**
- ❌ Firebase: `shapes` como JSON string (`"[[[...]]]"`)
- ✅ Supabase: `shapes` como array nativo (JSONB suporta nested arrays)
- ❌ Firebase: `blueprint.imageData` Base64 (limite 1MB)
- ✅ Supabase: `blueprint.imageData` Supabase Storage URL

---

### 5.2 FloorViewer Class (Unchanged)

```javascript
// Index_v11.1.html (linhas 4500-5200)
class FloorViewer {
  constructor(canvasId, projectData) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.projectData = projectData;
    this.currentFloorId = null;
    this.currentMode = 'lajes';  // 'lajes', 'sobrecargas', 'rcp', 'combinacoes', 'heatmap', 'sonda', 'predim'
    this.scale = 1.0;            // m/px (auto-detect from blueprint)
    this.imageCache = new Map(); // {floorId: blob URL}
  }
  
  async loadFloor(floorId) {
    this.currentFloorId = floorId;
    
    // 1. Load imagem (Supabase Storage)
    const imageURL = await this.loadFloorImage(floorId);
    if (imageURL) {
      const img = new Image();
      img.src = imageURL;
      await img.decode();
      this.ctx.drawImage(img, 0, 0);
    }
    
    // 2. Load zones
    const floor = this.projectData.floors.find(f => f.id === floorId);
    if (floor) {
      this.renderZones(floor.zones);
    }
  }
  
  async loadFloorImage(floorId) {
    // Cache check
    if (this.imageCache.has(floorId)) {
      return this.imageCache.get(floorId);
    }
    
    // Fetch via Supabase
    const signedURL = await getFloorImageURL(floorId);
    if (!signedURL) return null;
    
    const response = await fetch(signedURL);
    const blob = await response.blob();
    const objectURL = URL.createObjectURL(blob);
    
    this.imageCache.set(floorId, objectURL);
    return objectURL;
  }
  
  renderZones(zones) {
    for (const zone of zones) {
      if (!zone.shapes) continue;
      
      for (const shape of zone.shapes) {
        if (shape.type === 'polygon') {
          this.ctx.beginPath();
          this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          this.ctx.closePath();
          this.ctx.fillStyle = shape.color + '33';  // Alpha 20%
          this.ctx.fill();
          this.ctx.strokeStyle = shape.color;
          this.ctx.stroke();
        }
      }
    }
  }
  
  calculatePointELU(x, y) {
    // Sonda: click → calcula ELU nesse ponto
    const floor = this.projectData.floors.find(f => f.id === this.currentFloorId);
    if (!floor) return null;
    
    // Find zone containing point
    const zone = floor.zones.find(z => this.isPointInZone(x, y, z));
    if (!zone) return null;
    
    // Get effective params (block override OR project default)
    const block = this.projectData.blocks.find(b => 
      b.floors.some(f => f.id === this.currentFloorId)
    );
    const geotecnia = block.geotecnia || this.projectData.geotecnia;
    const materiais = block.materiais || this.projectData.materiais;
    const sismo = block.sismo || this.projectData.sismo;
    
    // Calc ELU
    const G = zone.permanentes.reduce((sum, p) => sum + p.valor, 0);
    const Q = this.getCategoryLoad(zone.uso);  // EC1 table
    const ELU = 1.35 * G + 1.50 * Q;
    
    return { zone: zone.name, G, Q, ELU };
  }
  
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
  
  cleanup() {
    // Revoke object URLs
    for (const url of this.imageCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.imageCache.clear();
  }
}
```

---

### 5.3 Comunicação zonas.html ↔ Index (Unchanged)

**Pattern:** `postMessage` bidireccional.

```javascript
// Index_v11.1.html → zonas.html
function openZonesEditor(floorId) {
  const floor = projectData.floors.find(f => f.id === floorId);
  const popup = window.open('zonas.html', '_blank', 'width=1200,height=800');
  
  popup.addEventListener('load', () => {
    popup.postMessage({
      type: 'LOAD_FLOOR',
      floorId: floorId,
      imageURL: floor.image_download_url,  // 🆕 Supabase Storage URL
      actions_data: floor.zones.map(z => z.actions_data)
    }, '*');
  });
}

// zonas.html → Index_v11.1.html
window.addEventListener('message', async (event) => {
  if (event.data.type === 'SAVE_ZONES') {
    const floorId = event.data.floorId;
    const zones = event.data.zones;
    
    // Update PostgreSQL
    for (const zone of zones) {
      await updateZone(zone.id, {
        shapes: zone.shapes,       // Array nativo (não string)
        actions_data: zone.actions_data
      });
    }
    
    console.log('✅ Zones saved');
  }
});
```

---

## 6. ACÇÕES (Motor Cálculo EC1/EC8)

**NOTA:** Lógica de cálculos mantém-se idêntica à v11.0.  
Novidades v11.1:
- Parâmetros efectivos via `get_effective_param()` (block override OR project default)
- Sobrecargas sempre por piso (`floors.sobrecargas`)

### 6.1 Acções Gravíticas (Análise Analítica)

```javascript
function calculateZoneELU(zone, floor, block, project) {
  // 1. Get effective params
  const materiais = block.materiais || project.materiais;
  const gammaBetao = materiais.betao.gamma || 25;  // kN/m³
  
  // 2. Permanentes
  const espessuraLaje = zone.espessura;  // m
  const pesoLaje = espessuraLaje * gammaBetao;  // kN/m²
  const permanentesAdicionais = zone.permanentes.reduce((sum, p) => sum + p.valor, 0);
  const G = pesoLaje + permanentesAdicionais;
  
  // 3. Sobrecargas (sempre do piso, não do bloco/projeto)
  const Q = floor.sobrecargas?.qk || this.getCategoryLoad(zone.uso);
  
  // 4. Combinação ELU
  const ELU = 1.35 * G + 1.50 * Q;
  
  return { G, Q, ELU };
}
```

### 6.2 Acção Sísmica (EC8)

```javascript
function generateSeismicSpectrum(block, project) {
  // 1. Get effective params
  const sismo = block.sismo || project.sismo;
  const geotecnia = block.geotecnia || project.geotecnia;
  
  const ag = sismo.ag;              // g (aceleração base)
  const terreno = geotecnia.tipo_solo;  // A, B, C, D, E
  const q = sismo.q || 3.0;
  const amort = sismo.amortecimento || 0.05;
  
  // 2. Parâmetros terreno (EC8 Tabela 3.2)
  const params = {
    'A': { S: 1.0, TB: 0.15, TC: 0.40, TD: 2.0 },
    'B': { S: 1.2, TB: 0.15, TC: 0.50, TD: 2.0 },
    'C': { S: 1.15, TB: 0.20, TC: 0.60, TD: 2.0 },
    'D': { S: 1.35, TB: 0.20, TC: 0.80, TD: 2.0 },
    'E': { S: 1.4, TB: 0.15, TC: 0.50, TD: 2.0 }
  }[terreno];
  
  const { S, TB, TC, TD } = params;
  const eta = Math.sqrt(10 / (5 + amort * 100));  // Coef. amortecimento
  
  // 3. Calcular espectro (0 a 4s)
  const periods = [];
  const spectrum = [];
  
  for (let T = 0; T <= 4.0; T += 0.01) {
    let Sa;
    
    if (T <= TB) {
      Sa = ag * S * (1 + T/TB * (eta * 2.5 - 1));
    } else if (T <= TC) {
      Sa = ag * S * eta * 2.5;
    } else if (T <= TD) {
      Sa = ag * S * eta * 2.5 * (TC / T);
    } else {
      Sa = ag * S * eta * 2.5 * (TC * TD / T**2);
    }
    
    periods.push(T);
    spectrum.push(Sa / q);  // Design spectrum
  }
  
  return { periods, spectrum };
}
```

**Chart Rendering:**
```javascript
function renderSeismicChart(canvasId, block, project) {
  const { periods, spectrum } = generateSeismicSpectrum(block, project);
  
  const ctx = document.getElementById(canvasId).getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: periods,
      datasets: [{
        label: 'Espectro Resposta Elástico (EC8)',
        data: spectrum,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: 'Período T (s)' } },
        y: { title: { display: true, text: 'Sa(T) / q (g)' } }
      }
    }
  });
}
```

---

## 7. DEPENDÊNCIAS EXTERNAS

### 7.1 CDN Libraries

```html
<!-- Supabase JS Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
```

### 7.2 Browser APIs

- Canvas API (motor gráfico)
- FileReader API (import JSON/images)
- Blob API (export JSON)
- postMessage API (comunicação zonas.html)
- Fetch API (Supabase Storage downloads)

---

## 8. LIMITAÇÕES CONHECIDAS

### 8.1 Arquitecturais

1. **Auth Obrigatória**: Sem Supabase Auth, app não funciona
2. **Network Required**: Sem PostgreSQL, sem dados (no offline mode)
3. **No Undo/Redo**: Alterações irreversíveis (exceto Realtime re-sync)
4. **No Versionamento Git-style**: PostgreSQL sobrescreve (no history)

### 8.2 Performance

- **Máximo testado**: 20 blocos × 10 pisos × 10 zonas = 2000 zonas
- **Bottleneck**: Rendering Canvas >1000 polígonos (lento em mobile)
- **Auto-save**: 30s interval (não customizável)
- **Lazy Load**: Crítico para >10 imagens (senão lobby timeout)

### 8.3 Validação

- Nenhuma validação de tipos runtime (assumes user input correcto)
- Fallback: `parseFloat() || 0` (valor 0 como default)
- RLS policies garantem ownership, mas não validam business logic

---

## 9. ROADMAP (Próximas Versões)

Ver `ROADMAP.md` para detalhes completos.

**v11.5** (Editor Integrado): OpenCV color-trace auto-polygon  
**v12.0** (Speckle Live Sync): BIM integration (Revit → Supabase)  
**v13.0** (Automação): Cloud Functions (DOCX reports, RAG docs)  
**v14.0** (React Migration): Componentização, escalabilidade

---

## APÊNDICES

### A. Índice de IDs HTML

Ver `RISCOS.md` (168 IDs catalogados)

### B. Índice de Funções JavaScript

```
// Auth
signupUser(email, password)
loginUser(email, password)
logoutUser()
getCurrentUser()

// CRUD Projects
createProject(data)
getProject(id)
listUserProjects()
updateProject(id, updates)
deleteProject(id)

// CRUD Blocks 🆕
createBlock(projectId, data)
getBlock(id)
updateBlock(id, updates)
deleteBlock(id)

// CRUD Floors
createFloor(blockId, projectId, data)
updateFloor(id, updates)
deleteFloor(id)

// CRUD Zones
createZone(floorId, projectId, data)
updateZone(id, updates)
deleteZone(id)

// Storage
uploadFloorImage(floorId, projectId, file)
getFloorImageURL(floorId)
deleteFloorImage(floorId)

// Realtime
subscribeToProject(projectId)

// Motor Gráfico
class FloorViewer {
  loadFloor(floorId)
  loadFloorImage(floorId)
  renderZones(zones)
  calculatePointELU(x, y)
  getCategoryLoad(category)
  cleanup()
}

// Acções
calculateZoneELU(zone, floor, block, project)
generateSeismicSpectrum(block, project)
renderSeismicChart(canvasId, block, project)

// Helpers
get_effective_param(blockId, paramName)  // SQL function
collectAllData()
loadAllData(data)
updateKPIs()
```

---

**FIM ESPECIFICAÇÃO TÉCNICA v11.1**

Última Atualização: 15/02/2026  
Maintainer: David (JSJ)  
Stack: Supabase (PostgreSQL + Storage + Realtime) + Vanilla JS + Canvas API
