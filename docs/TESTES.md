# 🧪 GUIA DE TESTES E VALIDAÇÃO

**Versão:** v11.1 (Supabase Backend + Schema Blocos)  
**Objectivo:** Checklist de validação obrigatória após qualquer alteração no código base.  
**Última Actualização:** 15/02/2026

---

## 1. TESTES DE REGRESSÃO OBRIGATÓRIOS

### 1.1 Teste de Persistência (IO)

**Quando executar:** Após alteração em `collectAllData()`, `loadAllData()`, IDs de inputs, estrutura de `projectData`.
```
1. Abre Index_v11.1.html no browser (autenticado @jsj.pt)
2. URL: ?project=new
3. Preenche dados mínimos:
   - Secção 1: ID JSJ, Nome
   - Secção 2: Adiciona 1 bloco + 1 piso (tipologia Elevação) + 1 zona
   - Secção 5: Preenche geo_tipo_sismo
4. Aguarda auto-save (30s) OU clica "Voltar ao Lobby" (força save)
5. Lobby → Reabre projeto (clica card)
6. VALIDA:
   ✅ Secção 1: Campos preenchidos
   ✅ Secção 2: Bloco, piso e zona aparecem
   ✅ Secção 5: geo_tipo_sismo mantém valor
   ✅ Console: 0 erros JavaScript
   ✅ Network tab: Query Supabase SELECT bem-sucedido
```

---

### 1.2 Teste de Cálculo (EC1)

**Quando executar:** Após alteração em `FloorViewer.calculatePointELU()`, `getCategoryLoad()`, campo `zona.uso`.
```
1. Secção 2: Bloco A → Piso 0 (Elevação) → Zona A
   - Uso: "B"
   - Tipo Laje: "Maciça"
   - Espessura: 0.25m
2. Secção 7 → Selecciona Bloco A → Piso 0
3. VALIDA Tabela Analítica (inferior):
   ✅ qk = 3.0 kN/m² (Categoria B)
   ✅ Laje = 0.25 × 25 = 6.25 kN/m²
   ✅ RCP existe (mesmo que 0)
   ✅ Combinação ELU apresenta valor (1.35G + 1.50Q)
4. VALIDA Viewer 2D (se tiver polígonos):
   ✅ Modo "Heatmap ELU" gera cores
   ✅ Modo "Sonda" mostra combinações ao clicar
```

**Valores esperados Categoria B**: `qk=3.0, ψ0=0.7, ψ1=0.5, ψ2=0.3`

---

### 1.3 Teste de Editor Gráfico (postMessage)

**Quando executar:** Após alteração em `actions_data`, `openZonesEditor()`, listener `message`, classe `FloorViewer`.
```
1. Secção 2: Bloco A → Piso 0 com imagem (qualquer PNG)
2. Secção 7 → Clica "Editor de Zonas" (abre popup zonas.html)
3. Em zonas.html: Desenha 1 polígono (camada Lajes, espessura 0.25)
4. Clica "Enviar Dados para Index"
5. VALIDA:
   ✅ Polígono aparece no canvas Index
   ✅ Modo "Heatmap ELU" gera cores
   ✅ Modo "Sonda" mostra valor ao clicar
   ✅ Console: 0 erros
   ✅ Supabase: pisos.actions_data actualizado (JSONB)
```

---

### 1.4 Teste de Acções Activadas (Toggles)
```
1. Secção 2: Adiciona 1 bloco + 1 piso
2. Secção 7: Desmarca "Sismo" → aba desaparece → Marca → reaparece
3. Repete para Vento, Impulsos, etc.
4. VALIDA: Checkboxes persistem em Supabase (projects.act_sismo = true/false)
```

---

### 1.5 Teste de Sync Geotécnico → Sismo
```
1. Secção 5 → "Tipo Solo EC8": "A"
2. Secção 7 → Sismo → VALIDA: "Terreno" = "A"
3. Muda para "C" → VALIDA: actualiza para "C"
4. VALIDA: Supabase projects.sismo_terreno = projects.geo_tipo_sismo
```

---

### 1.6 Teste Supabase Auth (v11.1) 🆕

**Quando executar:** Após alteração em `supabase-config.js`, `login.html`, SQL trigger whitelist.
```
1. Sessão limpa (incognito) → login.html
2. Email NÃO @jsj.pt → VALIDA: Rejeitado (SQL trigger exception)
3. Email @jsj.pt → VALIDA: Redirige para lobby
4. Lobby → Lista projects (só do user)
5. VALIDA Supabase Dashboard (Authentication):
   ✅ User criado
   ✅ Email confirmado (se configurado)
```

---

### 1.7 Teste Supabase Real-time (v11.1) 🆕

**Quando executar:** Após alteração em `subscribeToProject()`, triggers PostgreSQL.
```
1. Browser A: Login user1@jsj.pt → Abre Projeto X
2. Browser B: Login user1@jsj.pt → Abre MESMO Projeto X
3. Browser A: Edita nome projeto
4. VALIDA Browser B:
   ✅ Nome actualiza automaticamente (<3s)
   ✅ Console: "🔄 Realtime update" log
5. Browser A: Adiciona bloco
6. VALIDA Browser B:
   ✅ Bloco aparece sem refresh manual
```

**Cleanup**: Fecha Browser A → VALIDA Browser B continua funcional (sem crashes).

---

### 1.8 Teste RLS Ownership (v11.1) 🆕

**Quando executar:** Após alteração em RLS policies (ver RISCOS.md §9.1).
```
1. Browser A: user1@jsj.pt cria Projeto A
2. Browser B: user2@jsj.pt tenta aceder Projeto A (URL directo)
3. VALIDA:
   ✅ RLS bloqueia (403 Forbidden OU redirect lobby)
   ✅ Console: Erro RLS logged
4. Browser B: user2@jsj.pt cria Projeto B
5. VALIDA:
   ✅ Lobby user1 NÃO mostra Projeto B
   ✅ Lobby user2 NÃO mostra Projeto A
```

**CRÍTICO**: Testar com 2 users reais (não simular).

---

### 1.9 Teste Supabase Storage Upload (v11.1) 🆕

**Quando executar:** Após alteração em `uploadFloorImage()`, Storage policies.
```
1. Secção 2: Bloco A → Piso 0 → Botão [📷 Upload Planta]
2. Selecciona PNG (500KB)
3. VALIDA:
   ✅ Upload completo (<5s)
   ✅ Thumbnail aparece
   ✅ Supabase Storage: Blob existe no path correcto
   ✅ pisos.image_path preenchido
   ✅ pisos.image_download_url válido (TTL 7 dias)
4. Testa tipos inválidos (PDF, TXT):
   ✅ Rejeitado com mensagem erro
```

---

### 1.10 Teste Lazy Loading Imagens (v11.1) 🆕

**Quando executar:** Após alteração em `FloorViewer.loadFloorImage()`, `getFloorImageURL()`.
```
1. Projeto com 3 pisos (todos com imagem)
2. Lobby → Abre projeto
3. VALIDA (Network tab):
   ✅ NÃO carrega nenhuma imagem no load inicial
   ✅ Supabase query: SELECT projects + blocos + pisos (sem blobs)
4. Secção 7 → Selecciona Piso 0
5. VALIDA (Network tab):
   ✅ Storage signed URL request: 1 (só Piso 0)
   ✅ Image blob download: 1
6. Selecciona Piso 1
7. VALIDA:
   ✅ Storage request: 1 (só Piso 1)
8. Volta a Piso 0
9. VALIDA:
   ✅ NO download (cached client-side URL.createObjectURL)
```

**Performance target**: Lobby <500ms (sem images), Viewer image load <1s

---

### 1.11 Teste Storage Delete (v11.1) 🆕

**Quando executar:** Após alteração em `deletePiso()`, `deleteFloorImage()`.
```
1. Projeto com 2 pisos (ambos com imagem)
2. Supabase Dashboard → Storage: Nota blob paths
3. Secção 2 → Apaga Piso 0
4. VALIDA:
   ✅ Supabase Database → pisos: só 1 row
   ✅ Supabase Storage: blob Piso 0 apagado
   ✅ Supabase Storage: blob Piso 1 mantém-se
   ✅ Console: 0 erros
```

**CRÍTICO**: Storage delete ANTES de PostgreSQL delete (evita leaks).

---

### 1.12 Teste Foreign Key Cascade (v11.1) 🆕

**Quando executar:** Após alteração em schema SQL (foreign keys).
```
1. Projeto com hierarquia:
   - Bloco A
     - Piso 0 (2 zonas)
     - Piso 1 (1 zona)
2. Apaga Bloco A
3. VALIDA:
   ✅ Supabase Database → pisos: 0 rows (cascade delete)
   ✅ Supabase Database → zonas: 0 rows (cascade delete)
   ✅ UI: Bloco desaparece do accordion
   ✅ Console: 0 erros
4. VALIDA (antes de apagar):
   ✅ Confirm dialog: "Bloco A tem 2 piso(s). Apagar?"
```

---

### 1.13 Teste Hierarquia Blocos (v11.1) 🆕

**Quando executar:** Após alteração em UI Secção 2 (accordion blocos).
```
1. Secção 2: Adiciona 2 blocos
   - Bloco A: 2 pisos (Fundações, Elevação)
   - Bloco B: 1 piso (Cobertura)
2. Bloco A → Piso 0 (Fundações): Adiciona 2 zonas
3. VALIDA:
   ✅ Accordion mostra hierarquia correcta
   ✅ Tipologias agrupam pisos (accordion aninhado)
   ✅ Editar nome piso funciona (inline edit)
4. Secção 7:
   ✅ Selector Bloco mostra "Bloco A" e "Bloco B"
   ✅ Seleccionar Bloco A filtra pisos (só 2 aparecem)
5. VALIDA Supabase Database:
   ✅ blocos: 2 rows (Bloco A, Bloco B)
   ✅ pisos: 3 rows (com bloco_id foreign keys correctos)
   ✅ zonas: 2 rows (com piso_id foreign keys correctos)
```

---

### 1.14 🆕 Teste Inherit-or-Override (v11.1)

**Quando executar:** Após alteração em `get_effective_param()` SQL function, UI radio buttons Nível 2, queries COALESCE.

#### Setup
```
1. Supabase SQL Editor → Valida função existe:
   SELECT get_effective_param('00000000-0000-0000-0000-000000000000'::uuid, 'materiais');
   ✅ Esperado: NULL (não erro)

2. Projeto novo:
   - projects.materiais = {"betao": {"classe": "C30/37", "fck": 30}, "aco": {"tipo": "A500NR"}}
   - projects.use_global_params = true

3. Adiciona 2 blocos:
   - Bloco A: materiais = NULL (herda global)
   - Bloco B: materiais = {"betao": {"classe": "C25/30", "fck": 25}, "aco": {"tipo": "A400NR"}}
```

#### Validação SQL
```sql
-- Bloco A (herda global)
SELECT get_effective_param(
  (SELECT id FROM blocks WHERE name = 'Bloco A' LIMIT 1),
  'materiais'
);
-- Esperado: {"betao": {"classe": "C30/37", "fck": 30}, "aco": {"tipo": "A500NR"}}

-- Bloco B (override)
SELECT get_effective_param(
  (SELECT id FROM blocks WHERE name = 'Bloco B' LIMIT 1),
  'materiais'
);
-- Esperado: {"betao": {"classe": "C25/30", "fck": 25}, "aco": {"tipo": "A400NR"}}

-- Edge case: Parâmetro inexistente
SELECT get_effective_param(
  (SELECT id FROM blocks WHERE name = 'Bloco A' LIMIT 1),
  'parametro_fake'
);
-- Esperado: NULL (não erro)
```

#### Validação UI
```
1. Secção 2 (Nível 2 - Parâmetros Globais):
   - Radio "Materiais": Selecciona "Global para todos os blocos"
   - Preenche:
     Betão: C30/37, fck: 30
     Aço: A500 NR

2. Bloco A (accordion):
   - Expande → Parâmetros Override
   - VALIDA dropdown: "Materiais: [Herda Global ▼]"
   - NÃO mostra formulário materiais (herda)

3. Bloco B (accordion):
   - Expande → Parâmetros Override
   - Dropdown: Selecciona "Override"
   - VALIDA: Formulário materiais aparece
   - Preenche:
     Betão: C25/30, fck: 25
     Aço: A400 NR
   - Aguarda auto-save (30s)

4. Secção 7 (Acções Gravíticas):
   - Selector Bloco: Selecciona "Bloco A"
   - Adiciona 1 piso + 1 zona (espessura 0.25m)
   - Viewer 2D → Modo "Sonda" → Click em zona
   
5. VALIDA Popup Sonda (Bloco A):
   ✅ Materiais exibidos: C30/37 (global)
   ✅ Cálculo G: 0.25 × 25 = 6.25 kN/m² (usa gamma betão C30/37)
   ✅ Console: 0 erros

6. Selector Bloco: Muda para "Bloco B"
   - Adiciona 1 piso + 1 zona (espessura 0.25m)
   - Sonda → Click em zona

7. VALIDA Popup Sonda (Bloco B):
   ✅ Materiais exibidos: C25/30 (override)
   ✅ Cálculo G: 0.25 × 25 = 6.25 kN/m² (usa gamma betão C25/30)
   ✅ Console: 0 erros
```

#### Validação Supabase Database
```
1. Supabase Dashboard → Table Editor:
   - projects: materiais = {...C30/37...}
   - blocks (Bloco A): materiais = NULL
   - blocks (Bloco B): materiais = {...C25/30...}

2. Console Browser → Network tab:
   ✅ Query get_effective_param executado (RPC call)
   ✅ Retorna JSONB correcto
```

#### Validação Multi-Parâmetro
```
Repete teste para TODOS os parâmetros Inherit-or-Override:
- Geotecnia (tipo_solo, nspt, sigma_adm)
- Vento (velocidade_base, categoria_terreno)
- Neve (zona, altitude, sk)
- Temperatura (variacao_termica, alpha)
- Sismo (ag, espectro, q)

Para cada parâmetro:
1. Define global
2. Bloco A herda
3. Bloco B override
4. VALIDA função SQL retorna valores correctos
5. VALIDA UI exibe valores correctos (Sonda/Tabelas)
```

#### Critério Sucesso
- ✅ SQL function `get_effective_param()` retorna valores correctos (6/6 queries)
- ✅ UI exibe materiais efetivos (2/2 blocos)
- ✅ Cálculos EC1 usam params correctos (2/2 blocos)
- ✅ Radio buttons "Global/Override" funcionam (toggle UI)
- ✅ Supabase Database: NULL vs override correctos
- ✅ Console: 0 erros JavaScript
- ✅ Performance: get_effective_param <50ms (RPC call)

#### Edge Cases Obrigatórios
```
1. Projeto sem blocos:
   - VALIDA: Radio buttons desabilitados ("Por Bloco" disabled)

2. Mudar de "Por Bloco" → "Global" (após override):
   - VALIDA Confirm dialog: "Apagar overrides em 2 bloco(s)?"
   - Se aceita → SET blocks.materiais = NULL (todos)

3. Apagar projeto com overrides:
   - VALIDA: CASCADE delete funciona (blocks apagados)

4. SQL function missing (simulação):
   - DROP FUNCTION get_effective_param;
   - VALIDA: Fallback client-side funciona
   - VALIDA: Console warning logged
```

---

## 2. TESTES DE INTEGRAÇÃO

### 2.1 Fluxo Novo Projecto (~5 min)
```
1. Login @jsj.pt → lobby
2. "Novo Projecto"
3. Preenche Secções 1-2-5-7:
   - Secção 1: ID JSJ, Nome, Cliente
   - Secção 2: 1 bloco + 2 pisos (Fundações, Elevação) + 1 zona em cada + upload 1 imagem
   - Secção 5: geo_tipo_sismo = "B"
   - Secção 7: Activa Sismo, preenche parâmetros
4. Aguarda auto-save (30s) → Lobby → Reabre
5. VALIDA:
   ✅ Tudo persiste
   ✅ Imagens lazy load
   ✅ Sismo sincronizado
```

---

### 2.2 Fluxo Multi-Bloco Complexo (~10 min)
```
1. Projeto com 3 blocos:
   - Bloco A (Edifício): 5 pisos (2 fundações + 3 elevados) + override materiais
   - Bloco B (Pavilhão): 1 piso (térreo) + herda global
   - Bloco C (Piscina): 1 piso (cobertura) + override sismo

2. Cada piso: 2-3 zonas com polígonos (via zonas.html)

3. Secção 7: Testa selectores filtrados por bloco
   ✅ Selector Bloco → filtra pisos correctamente
   ✅ Viewer 2D → renderiza zonas correctas
   ✅ Heatmap ELU → cores diferentes (params override)

4. Apaga Bloco B:
   ✅ Confirm dialog
   ✅ CASCADE delete pisos/zonas
   ✅ Selectores actualizam

5. Export JSON:
   ✅ Ficheiro contém hierarquia completa
   ✅ Overrides preservados
```

---

### 2.3 Fluxo Migration Script (~15 min)

**Quando executar:** Antes de deploy v11.1 production (one-time).
```
1. Backup Firestore completo (export JSON)
2. Abre migrate-firebase-to-supabase.html
3. Autentica Firestore + Supabase
4. Selecciona 1 projeto teste (poucos pisos)
5. Clica "Migrate"
6. VALIDA:
   ✅ Supabase Database: project + blocos + pisos + zonas criados
   ✅ Supabase Storage: imagens uploaded (se existiam)
   ✅ Console: "✅ Migration completa" + summary
7. Abre Index_v11.1.html → Valida projeto migrado funcional
8. VALIDA edge cases:
   - Projeto sem pisos → cria bloco default vazio
   - Projeto com >10 pisos → todas imagens migram
   - Firestore IDs timestamp → convertidos UUID
```

**CRÍTICO**: NÃO executar 2x no mesmo projeto (duplica dados).

---

## 3. TESTES DE PERFORMANCE

### 3.1 Lobby Load Time
```
Target: <500ms (sem imagens)
Setup: 20 projects no Supabase
VALIDA:
- Network tab: 1 query SELECT projects (metadata only)
- NO lazy load imagens (só metadata)
- Render <500ms
```

### 3.2 Viewer 2D Render
```
Target: <1s (com 100 polígonos)
Setup: Piso com 10 zonas × 10 polígonos cada
VALIDA:
- Canvas draw <1s
- Heatmap generation <2s
- Sonda click response <100ms
```

### 3.3 Auto-save Latency
```
Target: <200ms (update PostgreSQL)
Setup: Edita nome projeto
VALIDA:
- Network tab: UPDATE query <200ms
- Real-time propagation <3s (outro browser)
```

---

## 4. TESTES DE SEGURANÇA

### 4.1 SQL Injection (Mitigado por Supabase)
```
1. Campo "Nome Projeto": Insere `'; DROP TABLE projects; --`
2. VALIDA:
   ✅ Supabase sanitiza (parametrized queries)
   ✅ Texto salvo literalmente (não executa SQL)
```

### 4.2 XSS (Cross-Site Scripting)
```
1. Campo "Nome Projeto": Insere `<script>alert('XSS')</script>`
2. VALIDA:
   ✅ DOM sanitiza (não executa script)
   ✅ Exibe texto escapado
```

### 4.3 RLS Bypass Attempt
```
1. Browser A: user1 cria projeto
2. Browser B: user2 abre DevTools
3. Executa: supabase.from('projects').select('*')
4. VALIDA:
   ✅ Retorna só projects de user2 (RLS bloqueia)
```

---

## 5. CHECKLIST PRÉ-DEPLOY

- [ ] Todos testes §1 (Regressão) passam
- [ ] Teste §2.1 (Novo Projeto) funciona end-to-end
- [ ] RLS policies testadas com 2 users reais
- [ ] Storage policies validadas (upload/download/delete)
- [ ] Migration script testado em staging
- [ ] Backup Firestore completo (se v11.0 → v11.1)
- [ ] SQL function `get_effective_param()` deployed
- [ ] Supabase triggers (updated_at) funcionais
- [ ] Network tab: NO 403/404/500 errors
- [ ] Console: 0 erros JavaScript
- [ ] Performance targets cumpridos (§3)
- [ ] Documentação actualizada (RISCOS.md, ESPECIFICACAO.md)

---

*Última actualização: 15/02/2026 (v11.1)*
