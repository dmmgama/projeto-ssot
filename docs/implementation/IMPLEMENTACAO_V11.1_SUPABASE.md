# 🚀 IMPLEMENTAÇÃO v11.1 - Migração Supabase Backend

**Versão**: v11.1 NOVA (Supabase + Schema Blocos + Storage)  
**Data**: 15/02/2026  
**Duração estimada**: 3-4 semanas (4 sprints)  
**Branch**: `feature/v11.1-supabase-migration`

---

## 📋 PRÉ-REQUISITOS

Antes de começar, valida:
- ✅ Supabase projeto "SSOT-JSJ" configurado (schema + RLS + Storage)
- ✅ Credenciais disponíveis (Project URL + anon key)
- ✅ Branch `feature/v11.1-supabase-migration` criada a partir de `main`
- ✅ Backup completo v11.0 (Firebase) via `exportJSON()`
- ✅ Documentação lida: `ESPECIFICACAO.md` §2-5, `RISCOS.md` §9-11

---

## 🎯 OBJECTIVO GERAL

Migrar stack Firebase → Supabase mantendo funcionalidades v11.0 intactas:
- ❌ Firebase Auth, Firestore, Storage
- ✅ Supabase Auth, PostgreSQL, Storage, Realtime
- ✅ Nova hierarquia: Project → Blocks → Floors → Zones
- ✅ Lazy loading imagens (Supabase Storage signed URLs)
- ✅ RLS policies owner-only (cascading via JOINs)

**CRÍTICO**: Cada task termina com validação + commit. Não avançar sem confirmação.

---

## 📦 ESTRUTURA FICHEIROS (Novo v11.1)

```
/
├── index_v11.1.html              (novo, baseado em index_v11.0.html)
├── lobby_v11.1.html              (novo, baseado em lobby_v10.2.html)
├── js/
│   ├── supabase-config.js        (novo, credenciais)
│   ├── supabase-auth.js          (novo, signup/login/logout)
│   ├── supabase-database.js      (novo, CRUD todas tabelas)
│   ├── supabase-storage.js       (novo, upload/download/delete imagens)
│   ├── supabase-realtime.js      (novo, subscriptions)
│   ├── ui-blocos.js              (novo, accordion Secção 2)
│   ├── ui-acoes.js               (modificado, selector Bloco→Piso)
│   ├── FloorViewer.js            (modificado, lazy load imagens)
│   └── calculations.js           (sem alterações, mas validar)
├── css/
│   └── styles_v11.1.css          (novo, estilos accordion blocos)
└── migrations/
    └── migrate-firebase-to-supabase.html  (standalone, one-time)
```

**Nota**: Mantém ficheiros v11.0 intactos (não apagar). v11.1 coexiste.

---

## 🏗️ SPRINT 1: SETUP & AUTH (Tasks 1-5)

### TASK 1.1: Criar Branch & Estrutura Base

**Objectivo**: Preparar ambiente de trabalho isolado.

**Acções**:
1. Cria branch Git: `git checkout -b feature/v11.1-supabase-migration`
2. Cria pastas:
   - `js/` (se não existir)
   - `migrations/`
3. Cria ficheiros vazios (placeholder):
   - `js/supabase-config.js`
   - `js/supabase-auth.js`
   - `js/supabase-database.js`
   - `js/supabase-storage.js`
   - `js/supabase-realtime.js`
   - `lobby_v11.1.html`
   - `index_v11.1.html`

**Validação**:
```bash
# Lista ficheiros criados
ls -la js/supabase-*.js
ls -la *_v11.1.html
ls -la migrations/
```

**Esperado**: Todos os ficheiros listados (mesmo vazios).

**Commit**:
```bash
git add .
git commit -m "Task 1.1: Setup branch structure v11.1"
git push origin feature/v11.1-supabase-migration
```

---

### TASK 1.2: Supabase Config (Credenciais)

**Objectivo**: Configurar client Supabase com credenciais.

**Contexto**: Ver `ESPECIFICACAO.md` §5.1 (Supabase Client Init).

**Acções**:
1. Abre `js/supabase-config.js`
2. Implementa:
   - Importa Supabase CDN (via script tag em HTML ou module)
   - Define constantes `SUPABASE_URL` e `SUPABASE_ANON_KEY`
   - **NÃO hardcode credentials** → usa placeholders `YOUR_PROJECT_URL` e `YOUR_ANON_KEY`
   - Cria client: `const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`
   - Exporta `supabase` (ou torna global `window.supabase`)

**Referências**:
- Supabase JS docs: https://supabase.com/docs/reference/javascript/initializing
- `GUIDELINES.md` §8 (Supabase-specific gotchas)

**Validação**:
1. Cria ficheiro `test-supabase-config.html` temporário:
   - Importa `supabase-config.js`
   - Console: `console.log(supabase)` deve mostrar objeto Supabase Client
   - Testa: `supabase.auth.getSession()` deve retornar Promise (sem erro)
2. Abre no browser → Console deve mostrar client válido

**Commit**:
```bash
git add js/supabase-config.js
git commit -m "Task 1.2: Supabase config with client init"
git push
```

---

### TASK 1.3: Supabase Auth (Signup/Login/Logout)

**Objectivo**: Implementar autenticação @jsj.pt.

**Contexto**: Ver `ESPECIFICACAO.md` §2.8 (Auth trigger @jsj.pt).

**Acções em `js/supabase-auth.js`**:

Implementa 4 funções assíncronas:

1. **`async signupUser(email, password)`**
   - Usa `supabase.auth.signUp({ email, password })`
   - Retorna `{ success: true, user }` ou `{ success: false, error }`
   - Trigger SQL no backend valida @jsj.pt automaticamente

2. **`async loginUser(email, password)`**
   - Usa `supabase.auth.signInWithPassword({ email, password })`
   - Retorna `{ success: true, session }` ou `{ success: false, error }`

3. **`async logoutUser()`**
   - Usa `supabase.auth.signOut()`
   - Limpa qualquer estado local (se houver)

4. **`async getCurrentUser()`**
   - Usa `supabase.auth.getUser()`
   - Retorna `{ user }` ou `{ user: null }`

**Gestão de Estado**:
- Listener de auth state: `supabase.auth.onAuthStateChange((event, session) => {...})`
- Redireciona para lobby se autenticado, login se não

**Referências**:
- `RISCOS.md` §9.3 (Auth sessions e RLS)
- Supabase Auth docs: https://supabase.com/docs/guides/auth

**Validação**:
1. Cria `test-auth.html` temporário com:
   - Form signup (email @jsj.pt + password)
   - Form login
   - Botão logout
   - Display user email se autenticado
2. Testa fluxo:
   - Signup com `teste@jsj.pt` → deve criar user
   - Signup com `teste@gmail.com` → deve falhar "Only @jsj.pt emails allowed"
   - Login com credenciais correctas → console mostra session
   - Logout → session limpa
3. Valida Supabase Dashboard → Authentication → Users (deve ver user criado)

**Commit**:
```bash
git add js/supabase-auth.js
git commit -m "Task 1.3: Auth (signup/login/logout) with @jsj.pt whitelist"
git push
```

---

### TASK 1.4: Lobby UI v11.1 (Auth + Grid Vazio)

**Objectivo**: Adaptar lobby v10.2 para usar Supabase Auth.

**Contexto**: Ver `ROADMAP.md` FASE 2 (Lobby Multi-Projeto v10.2).

**Acções**:
1. Copia `lobby_v10.2.html` → `lobby_v11.1.html`
2. Substitui imports Firebase por Supabase:
   - Remove Firebase CDN scripts
   - Adiciona Supabase CDN: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`
   - Importa `js/supabase-config.js` e `js/supabase-auth.js`
3. Adapta lógica:
   - Auth check: Usa `getCurrentUser()` no load
   - Se não autenticado → mostra form login/signup inline (não redireciona ainda)
   - Se autenticado → mostra email user + botão logout
   - Grid projetos: Mantém HTML, mas **não carrega dados ainda** (placeholder vazio)
4. Estilo: Mantém CSS v10.2 (sem alterações visuais)

**Validação**:
1. Abre `lobby_v11.1.html` no browser
2. **Não autenticado**: Mostra form login/signup
3. Faz signup/login → Email aparece no topo, botão logout visível
4. Logout → Volta para form login
5. Console: 0 erros

**Commit**:
```bash
git add lobby_v11.1.html
git commit -m "Task 1.4: Lobby v11.1 with Supabase Auth UI (no data yet)"
git push
```

---

### TASK 1.5: Index Editor v11.1 (Auth Guard)

**Objectivo**: Proteger editor com auth obrigatória.

**Acções**:
1. Copia `index_v11.0.html` → `index_v11.1.html`
2. Substitui Firebase imports por Supabase (igual Task 1.4)
3. Adiciona guard no `window.onload`:
   - Chama `getCurrentUser()`
   - Se `user === null` → redireciona `window.location.href = 'lobby_v11.1.html'`
   - Se autenticado → mostra email no header (novo elemento HTML)
4. **NÃO alteres** conteúdo Secções 1-8 ainda (mantém estrutura v11.0)

**Validação**:
1. **Sem auth**: Abre `index_v11.1.html` → redireciona para lobby
2. **Com auth**: Login no lobby → clica "Novo Projeto" (placeholder) → abre editor
3. Editor mostra email user autenticado
4. Console: 0 erros

**Commit**:
```bash
git add index_v11.1.html
git commit -m "Task 1.5: Index v11.1 with Auth guard (no CRUD yet)"
git push
```

---

## 🔄 CHECKPOINT SPRINT 1

**Antes de avançar, valida**:
- ✅ Auth signup/login/logout funcional
- ✅ Whitelist @jsj.pt activa (teste com email não-jsj falha)
- ✅ Lobby mostra user autenticado
- ✅ Editor protegido (redireciona se não auth)
- ✅ 5 commits no GitHub

**Se tudo ✅**: Avança Sprint 2.  
**Se algum ❌**: Para, reporta erro antes de continuar.

---

## 🗄️ SPRINT 2: CRUD DATABASE (Tasks 2.1-2.6)

### TASK 2.1: Database Module - CRUD Projects

**Objectivo**: Implementar CRUD básico tabela `projects`.

**Contexto**: Ver `ESPECIFICACAO.md` §2.1 (Tabela projects), §3 (API Supabase).

**Acções em `js/supabase-database.js`**:

Implementa 5 funções:

1. **`async createProject(projectData)`**
   - `user_id`: Obtém de `getCurrentUser()`
   - INSERT: `supabase.from('projects').insert({ user_id, ...projectData }).select().single()`
   - Retorna `{ success: true, project }` ou `{ success: false, error }`

2. **`async getProject(projectId)`**
   - SELECT: `supabase.from('projects').select('*').eq('id', projectId).single()`
   - RLS valida ownership automaticamente
   - Retorna `{ project }` ou `{ project: null }`

3. **`async updateProject(projectId, updates)`**
   - UPDATE: `supabase.from('projects').update(updates).eq('id', projectId)`
   - Retorna `{ success: true }` ou `{ success: false, error }`

4. **`async deleteProject(projectId)`**
   - DELETE: `supabase.from('projects').delete().eq('id', projectId)`
   - Cascade delete automático (blocos/pisos/zonas via foreign keys)
   - Retorna `{ success: true }` ou `{ success: false, error }`

5. **`async listUserProjects()`**
   - SELECT: `supabase.from('projects').select('id, nome_projeto, cliente, updated_at').order('updated_at', { ascending: false })`
   - RLS filtra automaticamente por `user_id`
   - Retorna array `[{id, nome_projeto, cliente, updated_at}, ...]`

**Referências**:
- `RISCOS.md` §9.1 (RLS silent failures)
- `GUIDELINES.md` §6.1 (Naming conventions Supabase)

**Validação**:
1. Cria `test-database.html` temporário
2. Auth com user válido
3. Testa sequência:
   - `createProject({ nome_projeto: 'Teste 1', cliente: 'JSJ' })` → console mostra project criado
   - `listUserProjects()` → array com 1 project
   - `updateProject(id, { cliente: 'Cliente Novo' })` → success
   - `getProject(id)` → cliente atualizado
   - `deleteProject(id)` → success
   - `listUserProjects()` → array vazio
4. Valida Supabase Dashboard → Database → `projects` (rows criadas/apagadas)

**Commit**:
```bash
git add js/supabase-database.js
git commit -m "Task 2.1: CRUD projects with RLS validation"
git push
```

---

### TASK 2.2: Database Module - CRUD Blocks

**Objectivo**: Implementar hierarquia Projects → Blocks.

**Contexto**: Ver `ESPECIFICACAO.md` §2.2 (Tabela blocks).

**Acções em `js/supabase-database.js` (adiciona funções)**:

1. **`async createBlock(projectId, blockData)`**
   - INSERT: `supabase.from('blocks').insert({ project_id: projectId, ...blockData }).select().single()`
   - `blockData` exemplo: `{ name: 'Edifício A', block_type: 'building', description: '...' }`
   - Retorna `{ success: true, block }` ou erro

2. **`async updateBlock(blockId, updates)`**
   - UPDATE: `supabase.from('blocks').update(updates).eq('id', blockId)`
   - `updates` pode incluir `override_params` JSONB

3. **`async deleteBlock(blockId)`**
   - **CRÍTICO**: Confirmar com user antes (UI mostra confirm dialog)
   - DELETE cascade apaga floors/zones automaticamente
   - Retorna `{ success: true, deletedCount }` (conta pisos apagados para feedback)

4. **`async listProjectBlocks(projectId)`**
   - SELECT: `supabase.from('blocks').select('*').eq('project_id', projectId).order('created_at')`

**Validação**:
1. Usa `test-database.html`
2. Cria 1 project → cria 2 blocks
3. `listProjectBlocks(projectId)` → array com 2 blocks
4. `updateBlock(blockId, { name: 'Bloco Renomeado' })` → success
5. `deleteBlock(blockId)` → success
6. Lista novamente → só 1 block
7. Valida Supabase Dashboard → `blocks` table

**Commit**:
```bash
git add js/supabase-database.js
git commit -m "Task 2.2: CRUD blocks with cascade delete"
git push
```

---

### TASK 2.3: Database Module - CRUD Floors

**Objectivo**: Floors associados a Blocks.

**Contexto**: Ver `ESPECIFICACAO.md` §2.3 (Tabela floors).

**Acções em `js/supabase-database.js`**:

1. **`async createFloor(blockId, projectId, floorData)`**
   - `floorData` exemplo: `{ name: 'Piso 0', cota: 0.0, tipologia: 'Fundações', area: 250 }`
   - `image_path` fica NULL (imagem adicionada depois via Storage)

2. **`async updateFloor(floorId, updates)`**
   - UPDATE campos: name, cota, tipologia, area, image_path

3. **`async deleteFloor(floorId)`**
   - **ANTES de DELETE row**: Chama `deleteFloorImage(floorId)` (Task 3.2)
   - Depois DELETE row (cascade apaga zones)

4. **`async listBlockFloors(blockId)`**
   - SELECT: `supabase.from('floors').select('*').eq('block_id', blockId).order('cota')`

5. **`async getFloor(floorId)`**
   - SELECT single floor

**Validação**:
1. Cria project → block → 3 floors (diferentes tipologias)
2. `listBlockFloors(blockId)` → 3 floors ordenados por cota
3. `updateFloor(floorId, { cota: -3.5 })` → success
4. `deleteFloor(floorId)` → success (mesmo sem imagem)
5. Valida Supabase Dashboard

**Commit**:
```bash
git add js/supabase-database.js
git commit -m "Task 2.3: CRUD floors with block association"
git push
```

---

### TASK 2.4: Database Module - CRUD Zones

**Objectivo**: Zones dentro de Floors (geometrias Canvas).

**Contexto**: Ver `ESPECIFICACAO.md` §2.4 (Tabela zones).

**Acções em `js/supabase-database.js`**:

1. **`async createZone(floorId, projectId, zoneData)`**
   - `zoneData` JSONB: `{ name, uso_ec1, lajes, permanentes, walls, polygons }`
   - `polygons` é array de {x, y} coordenadas Canvas

2. **`async updateZone(zoneId, updates)`**
   - UPDATE JSONB fields

3. **`async deleteZone(zoneId)`**
   - DELETE directo (sem cascade, é leaf node)

4. **`async listFloorZones(floorId)`**
   - SELECT: `supabase.from('zones').select('*').eq('floor_id', floorId)`

**Validação**:
1. Cria floor → 2 zones com polígonos mock
2. `listFloorZones(floorId)` → 2 zones
3. `updateZone(zoneId, { uso_ec1: 'A - Residencial' })` → success
4. `deleteZone(zoneId)` → success

**Commit**:
```bash
git add js/supabase-database.js
git commit -m "Task 2.4: CRUD zones with JSONB polygons"
git push
```

---

### TASK 2.5: Database Module - Load Hierarchy Completa

**Objectivo**: Função helper que carrega Project + Blocks + Floors + Zones numa query.

**Contexto**: Ver `ESPECIFICACAO.md` §3.2 (Nested SELECT com JOINs).

**Acções em `js/supabase-database.js`**:

Implementa **`async loadProjectHierarchy(projectId)`**:

- SELECT com nested relations:
  ```javascript
  supabase
    .from('projects')
    .select(`
      *,
      blocks (
        *,
        floors (
          *,
          zones (*)
        )
      )
    `)
    .eq('id', projectId)
    .single()
  ```
- Retorna objeto completo estilo v11.0 `projectData`, mas estruturado:
  ```javascript
  {
    id, nome_projeto, cliente, ...,
    blocks: [
      {
        id, name, block_type, override_params,
        floors: [
          {
            id, name, cota, tipologia, image_path,
            zones: [
              { id, uso_ec1, polygons, ... }
            ]
          }
        ]
      }
    ]
  }
  ```

**Validação**:
1. Cria hierarquia completa: 1 project → 2 blocks → 3 floors cada → 2 zones cada
2. `loadProjectHierarchy(projectId)` → objeto nested completo
3. Console: `console.log(JSON.stringify(result, null, 2))` mostra estrutura legível
4. Valida contagens:
   - `result.blocks.length === 2`
   - `result.blocks[0].floors.length === 3`
   - `result.blocks[0].floors[0].zones.length === 2`

**Commit**:
```bash
git add js/supabase-database.js
git commit -m "Task 2.5: Load full project hierarchy (nested SELECT)"
git push
```

---

### TASK 2.6: Integrar Lobby com listUserProjects()

**Objectivo**: Lobby mostra projetos reais do user autenticado.

**Acções em `lobby_v11.1.html`**:
1. Importa `js/supabase-database.js`
2. Após auth success:
   - Chama `listUserProjects()`
   - Renderiza grid com cards (igual v10.2 layout):
     - Título: `nome_projeto`
     - Subtitle: `cliente`
     - Footer: `updated_at` (formatado)
     - Click → `window.location.href = 'index_v11.1.html?project=' + projectId`
3. Botão "Novo Projeto":
   - Modal/prompt nome + cliente
   - Chama `createProject({ nome_projeto, cliente })`
   - Recarrega grid

**Validação**:
1. Lobby sem projetos → mostra empty state
2. Cria 2 projetos via botão → grid mostra 2 cards
3. Click em card → redireciona para editor com `?project=<id>` no URL
4. Valida ordenação por `updated_at` DESC (mais recente primeiro)

**Commit**:
```bash
git add lobby_v11.1.html
git commit -m "Task 2.6: Lobby integrated with listUserProjects()"
git push
```

---

## 🔄 CHECKPOINT SPRINT 2

**Validações obrigatórias**:
- ✅ CRUD projects/blocks/floors/zones funcional
- ✅ RLS bloqueia cross-user access (testa com 2 users diferentes)
- ✅ Lobby mostra projetos do user autenticado
- ✅ Hierarchy load retorna estrutura nested completa
- ✅ 6 commits no GitHub

**Teste crítico RLS**:
1. Browser A: User1 cria projeto "Projeto A"
2. Browser B: User2 autentica
3. Browser B: `listUserProjects()` → NÃO deve mostrar "Projeto A"
4. Browser B: `getProject(idProjetoA)` → retorna `null` (RLS bloqueou)

Se tudo ✅ → Avança Sprint 3.

---

## 📦 SPRINT 3: STORAGE & LAZY LOAD (Tasks 3.1-3.4)

### TASK 3.1: Storage Module - Upload Floor Image

**Objectivo**: Upload PNG/JPG para Supabase Storage com path estruturado.

**Contexto**: Ver `ESPECIFICACAO.md` §4.2 (Supabase Storage), §5.3 (Storage Policies).

**Acções em `js/supabase-storage.js`**:

Implementa **`async uploadFloorImage(floorId, projectId, file)`**:

1. **Validações**:
   - `file.type` deve ser `image/png` ou `image/jpeg`
   - `file.size < 5MB` (5 * 1024 * 1024 bytes)
   - Se falhar → retorna `{ success: false, error: 'Invalid file type/size' }`

2. **Path estruturado**:
   - `const userId = (await getCurrentUser()).user.id`
   - `const path = `${userId}/${projectId}/${floorId}.png``
   - Estrutura: `<user_id>/<project_id>/<floor_id>.png`
   - Isto permite Storage policies validarem ownership via `foldername(name)[1]`

3. **Upload**:
   ```javascript
   const { data, error } = await supabase.storage
     .from('floor-images')
     .upload(path, file, { upsert: true })
   ```
   - `upsert: true` → sobrescreve se já existe

4. **Update Floors table**:
   - Após upload success:
     ```javascript
     await updateFloor(floorId, { image_path: path })
     ```
   - Guarda path no PostgreSQL para lazy load depois

5. **Retorno**:
   - `{ success: true, path }` ou `{ success: false, error }`

**Referências**:
- `RISCOS.md` §10.3 (Storage upload failures)
- `GUIDELINES.md` §8.4 (Storage URL expiry)

**Validação**:
1. Cria `test-storage.html` com input file
2. Seleciona PNG <1MB → upload
3. Console: `{ success: true, path: 'user-id/project-id/floor-id.png' }`
4. Valida Supabase Dashboard → Storage → Bucket `floor-images` → ver blob
5. Valida Database → `floors` table → `image_path` preenchido

**Commit**:
```bash
git add js/supabase-storage.js
git commit -m "Task 3.1: Upload floor images to Supabase Storage"
git push
```

---

### TASK 3.2: Storage Module - Get Signed URL

**Objectivo**: Lazy load imagens via signed URLs (TTL 7 dias).

**Contexto**: Ver `RISCOS.md` §10 (Storage policies validate ownership).

**Acções em `js/supabase-storage.js`**:

Implementa **`async getFloorImageURL(floorId)`**:

1. **Fetch image_path**:
   ```javascript
   const { data: floor } = await supabase
     .from('floors')
     .select('image_path')
     .eq('id', floorId)
     .single()
   ```

2. **Se `image_path === null`**:
   - Retorna `null` (floor sem imagem)

3. **Generate signed URL**:
   ```javascript
   const { data, error } = await supabase.storage
     .from('floor-images')
     .createSignedUrl(floor.image_path, 604800)  // 7 dias em segundos
   ```

4. **Retorno**:
   - `{ url: data.signedUrl }` ou `{ url: null }`

**CRÍTICO**: Signed URLs expiram após 7 dias. FloorViewer deve regenerar se expirado (detect 403/404).

**Validação**:
1. Usa floor com imagem (Task 3.1)
2. `getFloorImageURL(floorId)` → retorna URL `https://...supabase.co/storage/v1/...`
3. Abre URL no browser → imagem carrega
4. Copia URL → aguarda 1 min → abre novamente → ainda funciona (TTL válido)
5. Testa floor sem imagem → retorna `null` (sem erro)

**Commit**:
```bash
git add js/supabase-storage.js
git commit -m "Task 3.2: Get signed URLs for lazy loading (TTL 7d)"
git push
```

---

### TASK 3.3: Storage Module - Delete Floor Image

**Objectivo**: Apagar blob Storage + limpar `image_path`.

**Acções em `js/supabase-storage.js`**:

Implementa **`async deleteFloorImage(floorId)`**:

1. **Fetch image_path**:
   - Igual Task 3.2
   - Se `null` → retorna `{ success: true }` (nada a apagar)

2. **Delete blob**:
   ```javascript
   await supabase.storage
     .from('floor-images')
     .remove([floor.image_path])
   ```

3. **Update Floors table**:
   ```javascript
   await updateFloor(floorId, { image_path: null })
   ```

4. **ORDEM CRÍTICA**: Storage delete **ANTES** de PostgreSQL update.
   - Ver `RISCOS.md` §11 (dependências cruzadas)
   - Se inverter ordem → leak de blobs órfãos

**Validação**:
1. Floor com imagem → `deleteFloorImage(floorId)` → success
2. Valida Storage bucket → blob apagado
3. Valida `floors` table → `image_path = null`
4. Testa floor sem imagem → success (no-op)

**Commit**:
```bash
git add js/supabase-storage.js
git commit -m "Task 3.3: Delete floor images (blob + metadata)"
git push
```

---

### TASK 3.4: Integrar FloorViewer com Lazy Load

**Objectivo**: FloorViewer carrega imagens on-demand via signed URLs.

**Contexto**: Ver `ESPECIFICACAO.md` §6 (Motor Gráfico FloorViewer).

**Acções em `js/FloorViewer.js`**:

Modifica método **`async loadFloorImage(floorId)`**:

1. **Remove** lógica Base64 antiga (v11.0):
   - ❌ `const base64 = floor.image_base64`
   - ❌ `img.src = base64`

2. **Nova lógica**:
   ```javascript
   async loadFloorImage(floorId) {
     const { url } = await getFloorImageURL(floorId);
     
     if (!url) {
       // Sem imagem: canvas branco
       this.backgroundImage = null;
       this.render();
       return;
     }
     
     const img = new Image();
     img.onload = () => {
       this.backgroundImage = img;
       this.render();
     };
     img.onerror = () => {
       console.error('Failed to load floor image');
       this.backgroundImage = null;
       this.render();
     };
     img.src = url;
   }
   ```

3. **Cleanup**:
   - Se FloorViewer já tinha `this.imageObjectURL` (v11.0) → remove lógica `URL.createObjectURL`
   - Supabase signed URLs não precisam revoke

**Referências**:
- `RISCOS.md` §11 (FloorViewer.loadImage depende de getFloorImageURL)
- `TESTES.md` §1.10 (Lazy Loading Imagens)

**Validação**:
1. Abre `index_v11.1.html` com projeto (Task 2.6)
2. Secção 7 → Selector Piso (ainda não filtrado por bloco, mas funciona)
3. Seleciona floor com imagem → Canvas renderiza imagem
4. Network tab (DevTools):
   - **NÃO** carrega imagem no page load
   - **SIM** carrega após selecionar floor (lazy load ✅)
   - Request: `storage/v1/object/sign/floor-images/...`
5. Seleciona floor sem imagem → Canvas branco (sem erro)

**Commit**:
```bash
git add js/FloorViewer.js
git commit -m "Task 3.4: FloorViewer lazy load via signed URLs"
git push
```

---

## 🔄 CHECKPOINT SPRINT 3

**Validações**:
- ✅ Upload PNG funcional (< 5MB)
- ✅ Signed URLs gerados (TTL 7 dias)
- ✅ Delete remove blob + metadata
- ✅ FloorViewer lazy load (Network tab confirma)
- ✅ Storage policies bloqueiam cross-user (testa com 2 users)

**Teste crítico Storage RLS**:
1. User1 faz upload floor image
2. User2 tenta `getFloorImageURL(floorIdUser1)` → 403 ou `null` (RLS bloqueou)

Se tudo ✅ → Avança Sprint 4.

---

## 🔴 SPRINT 4: REALTIME & UI BLOCOS (Tasks 4.1-4.5)

### TASK 4.1: Realtime Module - Subscriptions

**Objectivo**: Real-time sync entre browsers (multi-user).

**Contexto**: Ver `ESPECIFICACAO.md` §7 (Supabase Realtime), `RISCOS.md` §9.2 (Realtime table-level).

**Acções em `js/supabase-realtime.js`**:

Implementa **`subscribeToProject(projectId, callback)`**:

1. **Subscription filtrada**:
   ```javascript
   const channel = supabase
     .channel(`project-${projectId}`)
     .on(
       'postgres_changes',
       {
         event: '*',  // INSERT, UPDATE, DELETE
         schema: 'public',
         table: 'projects',
         filter: `id=eq.${projectId}`  // CRÍTICO: filter server-side
       },
       (payload) => {
         callback(payload);
       }
     )
     .subscribe();
   ```

2. **Callback payload**:
   - `payload.eventType`: 'INSERT' | 'UPDATE' | 'DELETE'
   - `payload.new`: novo estado row (UPDATE/INSERT)
   - `payload.old`: estado anterior (UPDATE/DELETE)

3. **Cleanup**:
   ```javascript
   window.addEventListener('beforeunload', () => {
     supabase.removeChannel(channel);
   });
   ```

4. **Retorno**: Objeto `{ channel, unsubscribe: () => supabase.removeChannel(channel) }`

**CRÍTICO**: **SEMPRE** usar `filter` server-side. Sem filtro → subscreve TODA a tabela (recebe updates de TODOS os projects de TODOS os users).

**Referências**:
- `RISCOS.md` §9.2 (Realtime table-level vs document-level)
- `GUIDELINES.md` §8.5 (Realtime channel limits)

**Validação**:
1. Browser A: Abre projeto "Projeto A"
2. Browser A: `subscribeToProject(projectIdA, (payload) => console.log('A:', payload))`
3. Browser B: Mesmo user, edita "Projeto A" nome via `updateProject()`
4. Browser A Console: Mostra `payload.eventType = 'UPDATE'` com `new.nome_projeto` alterado
5. Browser B: Edita "Projeto B" (diferente) → Browser A **NÃO** recebe update (filtro funciona ✅)

**Commit**:
```bash
git add js/supabase-realtime.js
git commit -m "Task 4.1: Realtime subscriptions with server-side filter"
git push
```

---

### TASK 4.2: UI Blocos - Accordion Secção 2

**Objectivo**: CRUD Blocos com accordion colapsável (Secção 2).

**Contexto**: Ver `MANUAL_FUNCIONAL.md` Nível 2.2 (Gestão Blocos), `ESPECIFICACAO.md` §2.2.

**Acções em `index_v11.1.html` + novo `js/ui-blocos.js`**:

1. **HTML Secção 2** (substituir conteúdo antigo v11.0):
   ```html
   <section id="secao-2">
     <h2>Nível 2 · Blocos</h2>
     <button id="btn-add-bloco">+ Adicionar Bloco</button>
     <div id="blocos-container">
       <!-- Accordion items dinamicamente -->
     </div>
   </section>
   
   <template id="template-bloco-item">
     <div class="bloco-accordion" data-block-id="">
       <div class="bloco-header">
         <span class="bloco-name" contenteditable="true"></span>
         <button class="btn-collapse">▼</button>
         <button class="btn-delete-bloco">🗑️</button>
       </div>
       <div class="bloco-body" style="display: none;">
         <textarea class="bloco-description" placeholder="Descrição..."></textarea>
         
         <!-- Tipologias accordion aninhado -->
         <div class="tipologias-accordion">
           <div class="tipologia" data-tipo="Fundações">
             <h4>Fundações</h4>
             <div class="pisos-list"></div>
             <button class="btn-add-piso" data-tipo="Fundações">+ Piso</button>
           </div>
           <!-- Repetir para Enterrados, Elevação, Cobertura -->
         </div>
       </div>
     </div>
   </template>
   ```

2. **`js/ui-blocos.js`** (novo ficheiro):

   Implementa funções:
   
   - **`renderBlocos(projectId)`**:
     - Chama `listProjectBlocks(projectId)`
     - Para cada block → clona `#template-bloco-item`
     - Preenche `data-block-id`, `.bloco-name` (contenteditable)
     - Attach listeners:
       - `.bloco-name` blur → `updateBlock(blockId, { name: newName })`
       - `.btn-collapse` → toggle `.bloco-body` visibility
       - `.btn-delete-bloco` → confirm dialog + `deleteBlock(blockId)` + re-render
     - Append to `#blocos-container`

   - **`#btn-add-bloco` click**:
     - Prompt nome (default: "Novo Bloco")
     - `createBlock(projectId, { name, block_type: 'building' })`
     - Re-render accordion

   - **`.btn-add-piso` click**:
     - Obtém `blockId` do parent `.bloco-accordion`
     - Obtém `tipologia` do `data-tipo`
     - Prompt nome piso (default: "Piso X")
     - `createFloor(blockId, projectId, { name, tipologia, cota: 0 })`
     - Re-render pisos deste bloco

3. **CSS** (`css/styles_v11.1.css`):
   - Accordion collapsible (transition smooth)
   - Nested accordion tipologias
   - Contenteditable inline edit visual feedback

**Referências**:
- `RISCOS.md` §2 (IDs HTML novos: adicionar à lista)
- `TESTES.md` §1.13 (Hierarquia Blocos)

**Validação**:
1. Abre editor (projeto vazio)
2. Secção 2 → Adiciona 2 blocos ("Bloco A", "Bloco B")
3. Expande "Bloco A" (accordion abre)
4. Tipologia "Fundações" → Adiciona 2 pisos
5. Edita nome bloco inline → blur → nome persiste (auto-save)
6. Apaga "Bloco B" → confirm dialog → desaparece
7. Valida Database: blocos + floors criados

**Commit**:
```bash
git add index_v11.1.html js/ui-blocos.js css/styles_v11.1.css
git commit -m "Task 4.2: UI Blocos accordion (Secção 2 CRUD)"
git push
```

---

### TASK 4.3: UI Acções - Selector Bloco→Piso Filtrado

**Objectivo**: Secção 7 filtra pisos por bloco seleccionado.

**Contexto**: Ver `ESPECIFICACAO.md` §6.3 (Selector Acções), `RISCOS.md` §3 (IDs alterados).

**Acções em `js/ui-acoes.js`** (modificar ficheiro existente):

1. **Substituir dropdown único** por **2 dropdowns cascading**:

   HTML (modificar Secção 7):
   ```html
   <select id="sec7-select-bloco">
     <option value="">Seleccionar Bloco...</option>
   </select>
   
   <select id="sec7-select-piso" disabled>
     <option value="">Seleccionar Piso...</option>
   </select>
   ```

2. **Lógica `ui-acoes.js`**:

   - **`populateBlockSelector(projectId)`**:
     - `listProjectBlocks(projectId)` → preenche `#sec7-select-bloco`
     - Options: `<option value="blockId">Bloco Name</option>`

   - **`#sec7-select-bloco` change**:
     - Obtém `blockId` seleccionado
     - Chama `listBlockFloors(blockId)`
     - Preenche `#sec7-select-piso` (habilita dropdown)
     - Options: `<option value="floorId">Floor Name (Cota X)</option>`

   - **`#sec7-select-piso` change**:
     - Obtém `floorId`
     - Chama `FloorViewer.loadFloor(floorId)` (já implementado Task 3.4)
     - Carrega zonas via `listFloorZones(floorId)`

3. **CRÍTICO - Actualizar `RISCOS.md`**:
   - Remover ID: `sec7-select-floor` (antigo)
   - Adicionar IDs: `sec7-select-bloco`, `sec7-select-piso` (novos)
   - Marcar como "IDs protegidos v11.1"

**Validação**:
1. Projeto com 2 blocos, 3 pisos cada
2. Secção 7 → Dropdown Bloco mostra 2 opções
3. Selecciona "Bloco A" → Dropdown Piso habilita, mostra 3 pisos
4. Selecciona "Piso 0" → FloorViewer carrega (lazy load imagem se existir)
5. Muda para "Bloco B" → Dropdown Piso actualiza (mostra pisos de Bloco B)

**Commit**:
```bash
git add js/ui-acoes.js index_v11.1.html
git commit -m "Task 4.3: Selector Bloco→Piso filtrado (Secção 7)"
git push
```

---

### TASK 4.4: Auto-save com Realtime Feedback

**Objectivo**: Auto-save 30s + notificação visual de updates remotos.

**Acções em `index_v11.1.html`** (adicionar lógica global):

1. **Auto-save interval**:
   ```javascript
   let autoSaveTimer;
   let isDirty = false;
   
   function markDirty() {
     isDirty = true;
     clearTimeout(autoSaveTimer);
     autoSaveTimer = setTimeout(async () => {
       if (isDirty) {
         await saveCurrentProject();
         isDirty = false;
       }
     }, 30000);  // 30 segundos
   }
   
   async function saveCurrentProject() {
     // Colecta estado actual de todos os campos editáveis
     const updates = {
       nome_projeto: document.getElementById('nome-projeto').value,
       cliente: document.getElementById('cliente').value,
       // ... outros campos Secção 1
     };
     await updateProject(currentProjectId, updates);
     console.log('✅ Auto-save completo');
   }
   ```

2. **Trigger `markDirty()` em**:
   - Qualquer `input`, `textarea`, `select` change (Secções 1-8)
   - Inline edit blocos/pisos (já faz `updateBlock`/`updateFloor` directo)

3. **Realtime feedback**:
   ```javascript
   subscribeToProject(currentProjectId, (payload) => {
     if (payload.eventType === 'UPDATE') {
       // Mostra notificação "Projeto actualizado por outro utilizador"
       showToast('⚠️ Projeto actualizado remotamente. Recarregar?');
       // Opcional: auto-reload ou botão manual
     }
   });
   ```

4. **Toast notification** (criar helper):
   - Div fixed top-right
   - Fade in/out animation (CSS)
   - Auto-dismiss 5s

**Validação**:
1. Browser A: Edita campo "Cliente" → aguarda 30s → console "✅ Auto-save"
2. Browser B: Mesmo projeto aberto → Toast aparece "Projeto actualizado remotamente"
3. Browser B: Recarrega → vê cliente alterado
4. Valida Database: `updated_at` timestamp actualizado

**Commit**:
```bash
git add index_v11.1.html
git commit -m "Task 4.4: Auto-save 30s + Realtime toast notifications"
git push
```

---

### TASK 4.5: SQL Function get_effective_param() - Herança Params

**Objectivo**: Blocos herdam params globais ou fazem override.

**Contexto**: Ver `ESPECIFICACAO.md` §2.6 (Função SQL herança).

**Acções**:

1. **Validar função já existe** (criada no setup Supabase):
   - SQL Editor: `SELECT get_effective_param('block-uuid'::uuid, 'materiais');`
   - Deve retornar JSONB (global ou override)

2. **Integrar em cálculos** (`js/calculations.js`):

   Modifica funções que usam parâmetros (ex: `calculateZoneELU`):
   
   ```javascript
   async function calculateZoneELU(zone, floor, block, project) {
     // Obter params efectivos via SQL function
     const { data: materiais } = await supabase.rpc('get_effective_param', {
       p_block_id: block.id,
       p_param_name: 'materiais'
     });
     
     const fck = materiais.betao.fck;  // Usa override ou global
     // ... resto cálculo
   }
   ```

3. **UI Override Params** (Secção 2 accordion):
   - Dentro de `.bloco-body`: Checkbox "Override Params Globais"
   - Se checked → mostra form clone Secções 3-6 (materiais, sismo, etc)
   - onChange → `updateBlock(blockId, { override_params: { materiais: {...} } })`

**Referências**:
- `TESTES.md` §1.14 (Inherit-or-Override)
- `RISCOS.md` §11 (get_effective_param depende de blocks/projects válidos)

**Validação**:
1. Projeto: Global materiais C30/37
2. Bloco A: Herda global (sem override)
3. Bloco B: Override C25/30
4. Secção 7 → Bloco A → Adiciona zona → Calcula ELU
5. Console: `fck = 30` (global)
6. Muda para Bloco B → Calcula ELU
7. Console: `fck = 25` (override)
8. SQL Editor: Testa função directo → resultados consistentes

**Commit**:
```bash
git add js/calculations.js js/ui-blocos.js
git commit -m "Task 4.5: get_effective_param() integration + UI override"
git push
```

---

## 🔄 CHECKPOINT SPRINT 4

**Validações finais**:
- ✅ Realtime sync funcional (2 browsers)
- ✅ Accordion blocos CRUD completo
- ✅ Selector Bloco→Piso filtra correctamente
- ✅ Auto-save 30s activo
- ✅ Herança params global/override funcional
- ✅ 5 commits no GitHub

**Teste integração completa**:
1. Cria projeto completo: 2 blocos, 3 pisos cada, 2 zonas por piso
2. Upload imagem 1 piso
3. Override params 1 bloco
4. Secção 7 → Navega blocos/pisos → Viewer renderiza
5. Browser 2 (mesmo user) → Edita nome projeto → Browser 1 vê toast
6. Aguarda 30s → Auto-save → Database actualizado

Se tudo ✅ → Avança Sprint Final.

---

## 🎯 SPRINT FINAL: MIGRATION & QA (Tasks 5.1-5.5)

### TASK 5.1: Migration Script Firebase→Supabase

**Objectivo**: Migrar projetos existentes v11.0 (Firebase) para v11.1 (Supabase).

**Contexto**: Ver `RISCOS.md` §10 (Migration one-time), `ESPECIFICACAO.md` §2.9.

**Acções em `migrations/migrate-firebase-to-supabase.html`** (novo standalone):

1. **Estrutura HTML**:
   - Form auth Firebase (API key, project ID)
   - Form auth Supabase (URL, anon key)
   - Botão "Conectar Firebase"
   - Lista projetos Firebase (checkboxes)
   - Botão "Migrar Seleccionados"
   - Progress bar + log console

2. **Lógica Migration**:

   ```javascript
   async function migrateProject(firebaseProject) {
     console.log(`Migrando ${firebaseProject.nome_projeto}...`);
     
     // 1. INSERT project (converte timestamp ID → UUID)
     const { data: newProject } = await supabase
       .from('projects')
       .insert({
         nome_projeto: firebaseProject.nome_projeto,
         cliente: firebaseProject.cliente,
         // ... copiar todos campos (exceto floors array)
       })
       .select()
       .single();
     
     // 2. INSERT bloco default
     const { data: defaultBlock } = await supabase
       .from('blocks')
       .insert({
         project_id: newProject.id,
         name: 'Edifício Principal',
         block_type: 'building'
       })
       .select()
       .single();
     
     // 3. Para cada floor Firebase → INSERT em Supabase
     for (const [floorId, floor] of Object.entries(firebaseProject.floors)) {
       const { data: newFloor } = await supabase
         .from('floors')
         .insert({
           block_id: defaultBlock.id,
           project_id: newProject.id,
           name: floor.name,
           cota: floor.cota,
           tipologia: floor.tipologia,
           area: floor.area
         })
         .select()
         .single();
       
       // 4. Se floor tem imagem Base64 → upload Storage
       if (floor.image_base64) {
         const blob = base64ToBlob(floor.image_base64);
         await uploadFloorImage(newFloor.id, newProject.id, blob);
       }
       
       // 5. Para cada zona → INSERT
       for (const [zoneId, zone] of Object.entries(floor.zones || {})) {
         await supabase.from('zones').insert({
           floor_id: newFloor.id,
           project_id: newProject.id,
           name: zone.name,
           uso_ec1: zone.uso_ec1,
           lajes: zone.lajes,
           permanentes: zone.permanentes,
           walls: zone.walls,
           polygons: zone.polygons
         });
       }
     }
     
     console.log(`✅ ${firebaseProject.nome_projeto} migrado`);
   }
   
   function base64ToBlob(base64) {
     const parts = base64.split(',');
     const contentType = parts[0].match(/:(.*?);/)[1];
     const raw = atob(parts[1]);
     const array = new Uint8Array(raw.length);
     for (let i = 0; i < raw.length; i++) {
       array[i] = raw.charCodeAt(i);
     }
     return new Blob([array], { type: contentType });
   }
   ```

3. **Validação duplicação**:
   - Antes de INSERT project: Query `SELECT id FROM projects WHERE id_jsj = '...'`
   - Se existe → skip com warning "Projeto já migrado"

4. **Error handling**:
   - Try/catch por projeto
   - Se 1 projeto falhar → continua próximo (não para tudo)
   - Log detalhado: `console.error('Erro projeto X:', error)`

**CRÍTICO**: **NÃO executar 2x** no mesmo projeto (duplica dados).

**Referências**:
- `TESTES.md` §2.3 (Fluxo Migration Script)
- `RISCOS.md` §10.1-10.4 (Riscos migration)

**Validação**:
1. Backup Firebase completo (export JSON todos projetos)
2. Abre `migrations/migrate-firebase-to-supabase.html`
3. Autentica ambos backends
4. Selecciona 1 projeto teste (poucos pisos)
5. Clica "Migrar" → progress bar
6. Console: "✅ Projeto X migrado"
7. Valida Supabase Database:
   - `projects`: 1 row
   - `blocks`: 1 row (default)
   - `floors`: N rows
   - `zones`: M rows
8. Valida Storage: imagens uploaded (se existiam)
9. Abre `index_v11.1.html` → carrega projeto migrado → funcional

**Commit**:
```bash
git add migrations/migrate-firebase-to-supabase.html
git commit -m "Task 5.1: Firebase→Supabase migration script (one-time)"
git push
```

---

### TASK 5.2: Testes Regressão v11.0 Features

**Objectivo**: Garantir funcionalidades v11.0 ainda funcionam em v11.1.

**Contexto**: Ver `TESTES.md` §1-2 (Suite regressão).

**Acções**:

Executa **manualmente** (não automatizado):

1. **Teste Persistência** (`TESTES.md` §1.1):
   - Cria projeto → preenche Secções 1-8 → aguarda auto-save
   - Fecha browser → reabre → tudo persiste ✅

2. **Teste CRUD Básico** (`TESTES.md` §1.1.2):
   - Cria/edita/apaga project → valida Database

3. **Teste Multi-Bloco** (`TESTES.md` §2.2):
   - 3 blocos, pisos diferentes, override params
   - Secção 7 navega correctamente

4. **Teste Lazy Loading** (`TESTES.md` §1.10):
   - Network tab: imagens só carregam ao seleccionar piso

5. **Teste RLS** (`TESTES.md` §4.3):
   - 2 users diferentes → cross-access bloqueado

6. **Teste Cálculos** (`TESTES.md` §5.1-5.3):
   - ELU zones, espectro sísmico, heatmap → valores correctos

**Checklist**:
```markdown
- [ ] §1.1 Persistência
- [ ] §1.1.2 CRUD Projects
- [ ] §1.2 Storage Upload/Download
- [ ] §1.7 Realtime Sync
- [ ] §2.2 Multi-Bloco
- [ ] §4.3 RLS Bypass
- [ ] §5.1 Cálculo ELU
- [ ] §5.2 Espectro Sísmico
```

**Se algum ❌**: Para, reporta bug antes de commit.

**Commit**:
```bash
git add TESTES.md  # Se adicionaste notas
git commit -m "Task 5.2: Regression tests v11.0 features ✅"
git push
```

---

### TASK 5.3: Documentação Actualizada

**Objectivo**: Actualizar docs Knowledge Base com mudanças v11.1.

**Acções**:

1. **`ESPECIFICACAO.md`**:
   - Já actualizado (schema Supabase §2, Storage §4, Realtime §7)
   - Valida secções correctas

2. **`RISCOS.md`**:
   - Adiciona IDs novos Secção 2 (§2):
     - `sec2-blocos-container`
     - `template-bloco-item`
     - `btn-add-bloco`
   - Adiciona IDs alterados Secção 7 (§3):
     - ❌ `sec7-select-floor` (removido)
     - ✅ `sec7-select-bloco` (novo)
     - ✅ `sec7-select-piso` (novo)
   - Actualiza §9-11 se faltou algo

3. **`ROADMAP.md`**:
   - Marca v11.1 como **Completo** ✅
   - Adiciona data conclusão: `15/02/2026`
   - Próxima milestone: v11.5 (Editor Integrado OpenCV)

4. **`MASTER.md`**:
   - Actualiza quick start (Supabase setup)
   - Substitui referências Firebase por Supabase

5. **`GUIDELINES.md`**:
   - Valida §8 (Supabase gotchas) completo

6. **`TESTES.md`**:
   - Adiciona §1.14 se faltou (Inherit-or-Override)

**Commit**:
```bash
git add ESPECIFICACAO.md RISCOS.md ROADMAP.md MASTER.md GUIDELINES.md TESTES.md
git commit -m "Task 5.3: Update Knowledge Base docs for v11.1"
git push
```

---

### TASK 5.4: Performance Benchmarks

**Objectivo**: Validar targets performance.

**Contexto**: Ver `TESTES.md` §3 (Performance).

**Acções**:

Executa benchmarks com **Chrome DevTools Performance tab**:

1. **Lobby Load Time** (`TESTES.md` §3.1):
   - Setup: 20 projects no Supabase (cria via script loop)
   - Abre `lobby_v11.1.html`
   - DevTools Network: Measure time to interactive
   - **Target**: <500ms
   - **Validar**: 1 query SELECT projects (metadata only, sem lazy load)

2. **Viewer 2D Render** (`TESTES.md` §3.2):
   - Piso com 100 polígonos (10 zonas × 10 polígonos cada)
   - FloorViewer.render()
   - DevTools Performance: Canvas draw time
   - **Target**: <1s

3. **Auto-save Latency** (`TESTES.md` §3.3):
   - Edita campo → trigger auto-save
   - Network tab: UPDATE query duration
   - **Target**: <200ms
   - **Realtime propagation**: outro browser vê update <3s

**Resultados esperados**:
```
✅ Lobby load: 450ms (< 500ms target)
✅ Viewer render: 850ms (< 1s target)
✅ Auto-save: 180ms (< 200ms target)
✅ Realtime: 2.1s (< 3s target)
```

Se algum **excede target**: Optimiza antes de merge (ex: adicionar indexes, lazy load adicional).

**Commit**:
```bash
# Adiciona resultados no commit message
git commit --allow-empty -m "Task 5.4: Performance benchmarks ✅
Lobby: 450ms | Viewer: 850ms | Auto-save: 180ms | Realtime: 2.1s"
git push
```

---

### TASK 5.5: Merge para Main & Tag v11.1

**Objectivo**: Integrar feature branch em produção.

**Acções**:

1. **Final validation checklist**:
   ```markdown
   - [ ] Todos testes TESTES.md passam
   - [ ] Performance targets atingidos
   - [ ] Docs Knowledge Base actualizados
   - [ ] Migration script testado (1 projeto completo)
   - [ ] 0 erros console em produção
   - [ ] RLS funcional (2 users testados)
   - [ ] Storage policies activas
   ```

2. **Merge**:
   ```bash
   git checkout main
   git pull origin main
   git merge feature/v11.1-supabase-migration
   # Resolve conflitos se houver
   git push origin main
   ```

3. **Tag release**:
   ```bash
   git tag -a v11.1 -m "v11.1: Supabase Backend + Schema Blocos + Storage
   
   - Migração Firebase → Supabase PostgreSQL
   - Nova hierarquia: Project → Blocks → Floors → Zones
   - RLS policies owner-only cascading
   - Lazy loading imagens (Storage signed URLs TTL 7d)
   - Realtime sync multi-user
   - Auth whitelist @jsj.pt
   - SQL function get_effective_param() herança params
   - Migration script Firebase→Supabase (one-time)
   
   Breaking changes:
   - Auth sessions Firebase invalidadas (re-login obrigatório)
   - Schema incompatível v11.0 (usar migration script)"
   
   git push origin v11.1
   ```

4. **Deploy production**:
   - Firebase Hosting (ou plataforma escolhida):
     ```bash
     # Se usar Firebase Hosting
     firebase deploy --only hosting
     ```
   - URL production: `https://ssot-jsj.web.app` (ou teu domínio)

5. **Notifica equipa JSJ**:
   - Email/Slack: "v11.1 deployed. Re-login obrigatório (@jsj.pt)."
   - Link migration script para migrar projetos v11.0

**Commit final**:
```bash
git commit --allow-empty -m "🚀 v11.1 PRODUCTION RELEASE"
git push
```

---

## ✅ CONCLUSÃO IMPLEMENTAÇÃO v11.1

**Entregas completas**:
- ✅ Supabase Backend (PostgreSQL + Storage + Realtime)
- ✅ Schema Blocos (hierarquia relacional)
- ✅ RLS policies (owner-only cascading)
- ✅ Lazy loading imagens (signed URLs)
- ✅ Auth whitelist @jsj.pt
- ✅ UI Blocos accordion (Secção 2)
- ✅ Selector Bloco→Piso (Secção 7)
- ✅ Auto-save 30s + Realtime sync
- ✅ SQL function herança params
- ✅ Migration script Firebase→Supabase

**Próximos passos** (v11.5+):
- OpenCV color-trace auto-polygon
- Speckle integration (BIM live-sync)
- Cloud Functions (DOCX reports, RAG)
- React migration (componentização)

---

**Data conclusão**: [Data actual]  
**Branch**: `main` (tag `v11.1`)  
**Status**: ✅ PRODUCTION READY

---

## 📞 SUPORTE PÓS-IMPLEMENTAÇÃO

**Se bugs em produção**:
1. Cria issue GitHub com:
   - Descrição detalhada
   - Steps to reproduce
   - Console errors (screenshot)
   - User afectado (email @jsj.pt)
2. Hotfix branch: `hotfix/v11.1.1-[descrição]`
3. Fix → test → merge → tag `v11.1.1`

**Contacto**: David (diretor técnico JSJ)

---

**FIM IMPLEMENTAÇÃO v11.1** 🎉
