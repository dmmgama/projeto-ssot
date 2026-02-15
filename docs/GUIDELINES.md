# SSOT JSJ — Guidelines de Desenvolvimento v11.1

Público-Alvo: Developers, Code Agents (Claude Code, Cursor)
Objectivo: Padrões e boas práticas para manter consistência no código
Última Actualização: 15/02/2026

1. NAMING CONVENTIONS
1.1 IDs HTML — snake_case (obrigatório)
html<!-- ✅ CORRECTO -->
<input id="id_jsj" />
<input id="geo_tipo_sismo" />

<!-- ❌ ERRADO -->
<input id="idJsj" />
<input id="sismo-terreno" />
IDs Dinâmicos (gerados por JS): {tipo}_{uuid} — ex: piso_name_a1b2c3d4-uuid
REGRA CRÍTICA: IDs são chave de persistência PostgreSQL. Nunca alterar sem migração (ver RISCOS.md §6).
1.2 Variáveis JavaScript — camelCase
javascriptlet projectData = {};
const blocoId = 'uuid-v4';
function updateKPIs() {}
Constantes Globais: UPPER_SNAKE_CASE
javascriptconst MAX_FLOORS = 100;
const GAMMA_BETAO = 25;  // kN/m³
1.3 Classes — PascalCase
javascriptclass FloorViewer {}
class ZoneCalculator {}
1.4 CSS Classes — kebab-case
css.zone-modal {}
.btn-primary {}
.load-breakdown-item {}
1.5 Tabelas/Colunas PostgreSQL — snake_case
sqlCREATE TABLE project_files (
  project_id UUID,
  image_path TEXT,
  created_at TIMESTAMPTZ
);

2. ESTRUTURA DE CÓDIGO
2.1 Ordem de Declaração
javascript// 0. IMPORTS (Supabase Client)
// 1. VARIÁVEIS GLOBAIS
// 2. CONSTANTES
// 3. CLASSES
// 4. FUNÇÕES DE ESTADO (collectAllData, loadAllData)
// 5. FUNÇÕES SUPABASE (CRUD, Storage, Realtime)
// 6. FUNÇÕES DE UI
// 7. FUNÇÕES DE CÁLCULO
// 8. EVENT LISTENERS (ao fim)
2.2 Indentação — 2 espaços (não tabs)
2.3 Comentários Obrigatórios
Funções críticas (listadas em RISCOS.md):
javascript/**
 * Carrega projeto do PostgreSQL via JOINs
 * @param {string} projectId - UUID do projeto
 * @returns {Promise<void>}
 * 🔥 CRÍTICO: RLS valida ownership, queries sem WHERE falham
 */
async function loadAllData(projectId) { ... }
Cálculos EC1/EC8:
javascript// Categoria B: Escritórios (EC1-1-1 Tabela 6.2)
// qk = 3.0 kN/m², ψ0 = 0.7, ψ1 = 0.5, ψ2 = 0.3
Workarounds:
javascript// v6 WORKAROUND: Max-thickness rule para lajes sobrepostas
// Apenas a laje MAIS ESPESSA conta (não soma)
🆕 Supabase Patterns:
javascript// RLS Policy: Owner-only access via foreign key JOIN
// Storage Policy: Validates ownership via Firestore lookup

3. BOAS PRÁTICAS
3.1 SSOT (Single Source of Truth)
REGRA DE OURO: Nunca ler do DOM para cálculos — ler de projectData.
javascript// ❌ ERRADO
const area = parseFloat(document.getElementById('zone_area').value);

// ✅ CORRECTO
const zona = findZonaById(zonaId);  // Procura em projectData.blocos
return zona.area * 25;
Excepções (leitura DOM permitida): collectAllData(), updateKPIs() (display only).
3.2 Validação de Inputs — Sempre fallbacks
javascriptconst area = parseFloat(input.value) || 0;
const name = input.value.trim() || '';
3.3 Validação de Objectos — Guard clauses
javascriptconst bloco = projectData.blocos.get(blocoId);
if (!bloco) { console.error('Bloco não encontrado:', blocoId); return; }
3.4 Error Handling — try/catch em async
javascripttry {
  await saveProject(projectId, data);
} catch (err) {
  console.error('Erro ao salvar:', err);
  alert('Falha ao salvar projeto: ' + err.message);
}
3.5 Confirmação em Operações Destrutivas
javascriptif (bloco.pisos?.size > 0) {
  if (!confirm(`Bloco "${bloco.name}" tem ${bloco.pisos.size} piso(s). Apagar?`)) return;
}
3.6 Performance — Batch DOM, Event Delegation
javascript// Batch: innerHTML em vez de appendChild em loop
container.innerHTML = items.map(i => `<div>${i}</div>`).join('');

// Delegation: listener único no container
container.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    deleteBloco(e.target.dataset.blocoId);
  }
});

4. SUPABASE PATTERNS (v11.1) 🆕
4.1 Async/Await Obrigatório
javascript// ✅ CORRECTO
async function saveProject(projectId, data) {
  await supabase
    .from('projects')
    .update(data)
    .eq('id', projectId);
}

// ❌ ERRADO — não aguarda
function saveProject(projectId, data) {
  supabase.from('projects').update(data).eq('id', projectId);
  console.log('Saved'); // Executa antes do save!
}
4.2 Error Handling Supabase
javascriptconst { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('id', projectId)
  .single();

if (error) {
  console.error('Supabase error:', error);
  throw error;  // Propaga para try/catch superior
}

// Usa data
4.3 RLS-Aware Queries
javascript// ✅ CORRECTO: RLS filtra automaticamente
const { data: projects } = await supabase
  .from('projects')
  .select('*');  // Retorna só projects onde owner_id = auth.uid()

// ❌ EVITAR: WHERE redundante (RLS já filtra)
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('owner_id', user.id);  // Redundante!
4.4 Foreign Key JOINs
javascript// ✅ CORRECTO: Nested SELECT (1 query)
const { data: blocos } = await supabase
  .from('blocos')
  .select(`
    *,
    pisos (
      *,
      zonas (*)
    )
  `)
  .eq('project_id', projectId);

// ❌ EVITAR: N+1 queries
const { data: blocos } = await supabase.from('blocos').select('*');
for (const bloco of blocos) {
  const { data: pisos } = await supabase.from('pisos').select('*').eq('bloco_id', bloco.id);
  // ... N queries!
}
4.5 Upsert Pattern
javascript// Insert ou Update (baseado em primary key)
await supabase
  .from('projects')
  .upsert({
    id: projectId,  // Se existe → UPDATE, se não → INSERT
    nome_projeto: 'Novo Nome',
    updated_at: new Date()
  });
4.6 Realtime Subscription Cleanup
javascriptlet subscription;

function subscribeToProject(projectId) {
  subscription = supabase
    .from(`projects:id=eq.${projectId}`)
    .on('UPDATE', (payload) => {
      if (!document.hasFocus()) {
        loadAllData(projectId);
      }
    })
    .subscribe();
}

// SEMPRE cleanup
window.addEventListener('beforeunload', () => {
  if (subscription) {
    supabase.removeSubscription(subscription);
  }
});
4.7 Storage Upload Pattern
javascriptasync function uploadImage(projectId, pisoId, file) {
  const path = `project-assets/${projectId}/pisos/${pisoId}/image.png`;
  
  // Upload com upsert (sobrescreve se existe)
  const { data, error } = await supabase.storage
    .from('project-assets')
    .upload(path, file, {
      cacheControl: '604800',  // 7 dias
      upsert: true
    });
  
  if (error) throw error;
  
  // Actualiza piso.image_path
  await supabase
    .from('pisos')
    .update({ image_path: path })
    .eq('id', pisoId);
  
  return path;
}
4.8 Storage Signed URL Pattern
javascriptasync function getImageURL(pisoId) {
  // 1. Get path
  const { data: piso } = await supabase
    .from('pisos')
    .select('image_path')
    .eq('id', pisoId)
    .single();
  
  if (!piso?.image_path) return null;
  
  // 2. Generate signed URL (TTL 7 dias)
  const { data: urlData } = await supabase.storage
    .from('project-assets')
    .createSignedUrl(piso.image_path, 604800);
  
  return urlData.signedUrl;
}
4.9 Maps ↔ PostgreSQL Conversion
javascript// Runtime: Maps para performance
projectData.blocos = new Map();

// PostgreSQL: Arrays (serialização automática em supabase-data.js)
const blocosArray = Array.from(projectData.blocos.values());
await supabase.from('blocos').insert(blocosArray);

// Load: Arrays → Maps
const { data: blocos } = await supabase.from('blocos').select('*');
projectData.blocos = new Map(blocos.map(b => [b.id, b]));

5. CODE STYLE
5.1 Preferir const, usar let só se reatribuição
5.2 Template literals para strings com variáveis
5.3 Arrow functions para callbacks curtos, NÃO para métodos de classe
5.4 Destructuring quando acede a múltiplos campos
javascript// ✅ CORRECTO
const { data, error } = await supabase.from('projects').select('*');

// ❌ EVITAR
const result = await supabase.from('projects').select('*');
const data = result.data;
const error = result.error;
5.5 Early returns em vez de deep nesting
5.6 Evitar magic numbers — usar constantes nomeadas

6. ANTI-PATTERNS
6.1 Global Pollution
javascript// ❌ ERRADO
window.tempData = {...};

// ✅ CORRECTO
const tempData = {...};  // Scoped
6.2 Magic Numbers
javascript// ❌ ERRADO
espessura * 25 + 1.5

// ✅ CORRECTO
const GAMMA_BETAO = 25;  // kN/m³
const REVESTIMENTOS = 1.5;  // kN/m²
return espessura * GAMMA_BETAO + REVESTIMENTOS;
6.3 Deep Nesting
javascript// ❌ ERRADO
if (bloco) {
  if (bloco.pisos) {
    if (bloco.pisos.size > 0) {
      // ...
    }
  }
}

// ✅ CORRECTO
if (!bloco) return;
if (!bloco.pisos) return;
if (bloco.pisos.size === 0) return;
// ...
6.4 Mutação de Parâmetros
javascript// ❌ EVITAR (exceto projectData por design)
function updateBloco(bloco, newData) {
  bloco.name = newData.name;  // Mutação
  return bloco;
}

// ✅ PREFERIR
function updateBloco(bloco, newData) {
  return { ...bloco, ...newData };  // Novo objecto
}
6.5 Sync em Async Context
javascript// ❌ ERRADO
async function saveAll() {
  saveProject(projectId, data);  // Sem await!
  console.log('Saved');  // Executa antes
}

// ✅ CORRECTO
async function saveAll() {
  await saveProject(projectId, data);
  console.log('Saved');
}
```

---

## 7. GIT WORKFLOW

### Branch Naming
```
feature/adiciona-crud-blocos
fix/corrige-rls-policy-pisos
refactor/extrai-logica-storage
```

### Commit Messages — `tipo(scope): mensagem`
```
feat(blocos): adiciona CRUD hierarquia
fix(rls): corrige policy ownership pisos
refactor(storage): extrai lazy load helpers
perf(queries): optimiza JOINs blocos/pisos
docs(riscos): actualiza secção Supabase
test(storage): adiciona teste upload/delete
Tipos: feat, fix, refactor, perf, docs, test, chore

8. SUPABASE-SPECIFIC GOTCHAS 🆕
8.1 RLS Debugging
javascript// Se query retorna vazio (RLS bloqueou):
// 1. Verifica user autenticado
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user?.id);

// 2. Verifica policy no Supabase Dashboard → Database → RLS
// 3. Testa query manual no SQL Editor COM auth context
8.2 Foreign Key Errors
javascript// Error: insert or update on table "pisos" violates foreign key constraint
// Causa: bloco_id não existe na tabela blocos
// Fix: Inserir bloco ANTES de piso
await supabase.from('blocos').insert({ id: blocoId, ... });
await supabase.from('pisos').insert({ bloco_id: blocoId, ... });
8.3 JSONB Query Gotchas
javascript// ❌ ERRADO: Acesso directo JSONB em SQL (não indexado)
.select('actions_data->layers->Estrutura')

// ✅ CORRECTO: Retorna JSONB inteiro, parse client-side
.select('actions_data')
// Depois: data.actions_data.layers.Estrutura
8.4 Storage URL Expiry
javascript// Signed URLs expiram (7 dias)
// ✅ Regenerar se expirado (já implementado em getFloorImageURL)
// ❌ NUNCA guardar signed URL em localStorage
8.5 Realtime Channel Limits
javascript// Spark plan: 200 canais simultâneos
// ✅ SEMPRE usar filters específicos
supabase.from(`projects:id=eq.${projectId}`)

// ❌ EVITAR subscriptions genéricas
supabase.from('projects')  // Subscreve TUDO!
```

---

## 9. GLOSSÁRIO

| Termo | Significado |
|---|---|
| SSOT | Single Source of Truth — `projectData` é a única fonte de verdade |
| RLS | Row Level Security — PostgreSQL security policies |
| ELU | Estado Limite Último (Ultimate Limit State) |
| ELS | Estado Limite de Serviço (Serviceability Limit State) |
| qk | Sobrecarga característica (kN/m²) |
| EC1/EC8 | Eurocódigo 1 (Acções) / Eurocódigo 8 (Sismo) |
| RCP | Revestimentos, Cargas Permanentes |
| γ | Peso volumétrico (kN/m³) |
| ψ0, ψ1, ψ2 | Coeficientes de combinação EC0 |
| UUID | Universally Unique Identifier (PostgreSQL primary keys) |
| JSONB | PostgreSQL binary JSON type |
| WAL | Write-Ahead Log (PostgreSQL replication para Realtime) |
| TTL | Time To Live (Storage signed URL expiry) |

---

**Próxima leitura:** `ESPECIFICACAO.md` para schema técnico completo

*Última actualização: 15/02/2026 (v11.1)*
</document>

---

## 7/7 — MANUAL_FUNCIONAL.md

<document>
# Mapeamento Formulário · SSOT JSJ v11.1

Este documento descreve a estrutura hierárquica e funcional do formulário único de projeto ("SSOT JSJ"). Cada nível representa um grupo de dados e funcionalidades correlacionadas. Objetivo: servir de referência para integração, automação e contexto para LLMs.

**Versão:** v11.1 (Supabase Backend + Schema Blocos)  
**Última Actualização:** 15/02/2026

---

## Nível 1 · Identificação do Projeto

### 1.1 KPIs Rápidos (Visualização)
**Output:** ID, Nome, Fase

### 1.2 Campos Principais (Administrativo)
**Inputs:**
- ID JSJ  
- Nome Projeto JSJ  
- Cliente  
- Designação  
- Localização: País (Dropdown), Cidade (Dropdown), Morada  
- Tipologia (Dropdown)  
- Especialidade  
- Tipo de Obra  
- Fase Atual  

### 1.3 Acompanhamento de Fases (Tabela Dinâmica)
**Fases:** EP, Licenciamento, Execução, Assistência Técnica  
**Dados:** Data de Entrega, Estado (Dropdown)

### 1.4 Equipa do Projeto JSJ
**Inputs:** Resp. Técnico, Equipa Eng., BIM, Gestão, Fiscalização, Promotor, Arquitetura, Especialidades, BIM Manager

### 1.5 Equipa do Projeto Dono de Obra
**Inputs:** Dono de Obra, Arquitetura, Gestão de Projeto, Especialidades, BIM Manager, Fiscalização

---

## Nível 2 · Caracterização Geral da Obra 🆕

### 2.1 Resumo Geral (KPIs Automáticos)
**Outputs:** Implantação (m²), ABC (m²), Nº Pisos, Altura Total (m)

### 2.2 Gestão de Blocos (Estrutura Hierárquica Dinâmica) 🆕

**Hierarquia v11.1**:
```
Projecto
└─ Blocos (CRUD)
   └─ Tipologias (Accordion)
      ├─ Fundações
      ├─ Enterrados
      ├─ Elevação
      └─ Cobertura
         └─ Pisos (editáveis: nome, cota, tipologia)
            ├─ Área
            ├─ Imagem (PNG/JPG, Supabase Storage)
            └─ Zonas (CRUD)
Bloco (Novo v11.1):

Nome (editável inline)
Descrição (textarea expandível)
Botão "Adicionar Piso" (por tipologia)
Botão "Apagar Bloco" (confirma se tem pisos)

Piso (Modificado v11.1):

Nome (editável inline) 🆕
Cota (editável inline) 🆕
Tipologia (dropdown: Fundações/Enterrados/Elevação/Cobertura) 🆕
Área (readonly, calculada via zonas)
Imagem (upload PNG/JPG → Supabase Storage, lazy load)
Botão "Adicionar Zona"
Botão "Editor de Zonas" (abre zonas.html popup)

Zona (Mantida):

Nome
Área
Cota ao Limpo
Acabamento (mm)
Uso EC1 (Dropdown: A-H)
Tipo Laje (Dropdown: Maciça, Fungiforme, Aligeirada, Vigada, Pré-laje)
Espessura (m)
Vão Máximo (m)
Acções Permanentes (tabela dinâmica)
Paredes (tabela dinâmica)

Backend (PostgreSQL):

Tabela blocos (project_id, name, description, sort_order)
Tabela pisos (bloco_id, name, cota, area, tipologia, image_path, actions_data)
Tabela zonas (piso_id, name, area, uso, tipo_laje, espessura, ...)
Foreign keys ON DELETE CASCADE


Nível 3 · Elementos Base
3.1 Elementos Base (Histórico)
Campos:
Arquitetura, MEP, Escavação, Estudo Geotécnico/Hidro, Prospeções, Caracterização/Inspeção Estrutural, Ensaios, Projetos Originais
🆕 Link Servidor Legacy (v11.1):

Campo projects.server_path (UNC path Windows)
Ex: \\SERVIDOR\Projectos\2024-001

🆕 Catálogo Ficheiros (v11.1):

Tabela project_files (catálogo unificado)
Campos: name, file_type, source (server/storage/speckle), server_path, storage_path, tags, fase
Preparado para RAG (v13.0+): campo embedding VECTOR(1536) vazio


Nível 4 · Condicionantes
4.1 Condições Arquitetónicas
Área de Texto: Condicionantes Principais (pés-direitos, vãos, restrições)
4.2 Condicionantes Geotécnicas
4.2.1 Caracterização Geológica
Inputs:
Formações, Horizontes, Prof. Substrato, Natureza, Tipo Solo EC8 (Dropdown), σadm
4.2.2 Parâmetros por Horizonte (Tabela)
Colunas: Horizonte, NSPT, γ, c', φ, E, σadm, Escavabilidade
Backend (PostgreSQL):

Tabela geo_horizons (project_id, horizonte, nspt, gamma, c, phi, e, sigma, escav)

4.3 Condições Hidrogeológicas
Inputs: Nível Freático, Coluna Água, Agressividade (XA), Observações

Nível 5 · Solução Estrutural
5.1 Descrição da Solução
Área de Texto: Sistema estrutural, materiais, fundações

Nível 6 · Acções (Motor de Cálculo)
6.1 Seleção de Acções (Quadro 1)
Checkboxes:
Gravíticas (Mandatory), Sismo, Vento, Impulsos, Retração, Temperatura, Neve, Água
Backend (PostgreSQL):

Campos boolean: act_sismo, act_vento, act_impulsos, etc. (tabela projects)

6.2 Detalhamento de Acções (Quadro 2)
🆕 Selector de Bloco (v11.1)

Dropdown "Seleccionar Bloco" (populated via projectData.blocos)
Dropdown "Seleccionar Piso" (filtered by bloco)

A) Gravíticas (Análise Analítica v9.0)

Seletor de Piso (filtered by bloco selected)
Visualizador 2D (Canvas): Modos Lajes, Sobrecargas, RCP, Combinações, Heatmap ELU, Sonda, Pré-Dim.

Backend (PostgreSQL):

Campo pisos.actions_data (JSONB) — contém layers do editor gráfico
Estrutura: { blueprint: {...}, layers: { Estrutura: [...], Sobrecargas: [...], Paredes_RP: [...] } }

B) Ação Sísmica (EC8)

Parâmetros: Zona, Terreno (Importado de Secção 5), Importância, Coef. q, Amortecimento
Gráficos: Espectros Tipo 1 e Tipo 2 (Chart.js)

Backend (PostgreSQL):

Campos TEXT: sismo_zona, sismo_terreno, sismo_imp, sismo_q, sismo_amort (tabela projects)

C) Ação do Vento (EC1-1-4)

Zona, vb,0, Categoria, z0, co, cpi

Backend (PostgreSQL):

Campos TEXT: vento_zona, vento_vb0, vento_cat, etc. (tabela projects)

D) Impulsos de Terras

Altura, γ, φ, c, K0, q

E) Retração/Fluência

HR, t0, Tipo Cimento, Cura

F) Temperatura

ΔT Contração/Expansão, α, T ref.

G) Neve (EC1-1-3)

Zona, Altitude, sk, Ce, Ct, μ

H) Água

Nível, γw, Subpressões, Drenagem


Nível 7 · Critérios e Relatórios
7.1 Critérios de Segurança
Campos: Regulamentação, Critérios Dimensionamento (ELU/ELS)
Backend (PostgreSQL):

Campos TEXT: crit_reg, crit_dim (tabela projects)

7.2 Exportação e Outputs
Funcionalidades:

Exportar JSON (metadata project-level apenas, sem blocos/pisos — v11.1)
Gerar Relatório Markdown (deprecated v11.1 — usar Supabase Edge Functions v13.0)


🆕 Mudanças v11.0 → v11.1
Nível 2 — Caracterização Geral

❌ REMOVIDO: Conceito "Zonas" como top-level (agora são apenas geometrias em pisos)
✅ ADICIONADO: Hierarquia Blocos → Tipologias → Pisos
✅ ADICIONADO: Pisos editáveis (nome, cota, tipologia mutáveis)
✅ ADICIONADO: UI accordion hierárquico (Blocos expandem → Tipologias expandem → Pisos)

Nível 3 — Elementos Base

✅ ADICIONADO: Campo server_path (link servidor legacy Windows)
✅ ADICIONADO: Tabela project_files (catálogo ficheiros preparado RAG)

Nível 6 — Acções

✅ ADICIONADO: Selector Bloco (filtra pisos)
✅ MODIFICADO: Selector Piso (agora filtered by bloco)
✅ MODIFICADO: Campo actions_data JSONB nativo (não string JSON)

Backend Geral

❌ REMOVIDO: Firestore (documents, nested arrays sanitization)
✅ ADICIONADO: PostgreSQL (6 tabelas relacionais, foreign keys, RLS)
✅ ADICIONADO: Supabase Storage (lazy load images, signed URLs)
✅ ADICIONADO: Supabase Realtime (table-level subscriptions)