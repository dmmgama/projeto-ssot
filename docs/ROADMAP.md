# 🚀 ROADMAP SSOT JSJ - Atualizado 15/02/2026

---

## ✅ FASE 1: SANEAMENTO (Completo)

### v10.0 - Refactor Arquitetural
**Duração**: 1 semana  
**Objetivo**: Eliminar arrays, implementar UUID Maps, preparar multi-projeto

**Entregas**:
- Array → UUID Maps (floors, zones, geoHorizons)
- `appState` global para multi-projeto
- Proxy legacy bridge (compatibilidade)

---

## ✅ FASE 2: ARQUITETURA MULTI-PROJETO (Completo)

### v10.2 - Lobby Multi-Projeto
**Duração**: 2 semanas  
**Objetivo**: Sistema gestão de múltiplos projetos com localStorage

**Entregas**:
- UI lobby (grid CRUD projetos)
- Navegação lobby ↔ editor
- Migração automática v9→v10

---

## ✅ FASE 3: BACKEND CLOUD (Completo)

### v11.0 - Firebase Backend
**Duração**: 2 semanas  
**Objetivo**: Persistência cloud com real-time sync

**Entregas**:
- Firestore collections (projects/{id})
- Firebase Auth (@jsj.pt whitelist)
- Real-time updates (onSnapshot)
- Auto-save 30s
- Migração localStorage→Firestore

**Breaking Change**: Auth obrigatória

---

## 🔨 FASE 3.1: FIREBASE STORAGE LAYER (NÃO REALIZADA)

### v11.1 - Generic Asset Storage ❌ CANCELADA
**Motivo**: Trabalho descartável antes de migração Supabase (v11.2)

**Decisão Estratégica**: 
- FUNDIR v11.1+v11.2 numa única milestone Supabase
- Uma migração (Firestore→Supabase) em vez de duas
- Momento ideal para breaking change total (schema blocos)

**🆕 NÃO REALIZADA POR OPÇÃO DE AVANÇAR PARA FASE 3.2, SENDO A FASE 3.2 A MIGRAÇÃO CORRENTE**

---

## 🔨 FASE 3.2: MIGRAÇÃO SUPABASE COMPLETA (EM CURSO)

### v11.1 NOVA - Supabase Backend + Schema Blocos + Asset Storage
**Duração**: 3-4 semanas  
**Objetivo**: Stack unificado PostgreSQL + hierarquia Blocos + storage genérico

**Stack Target**:
- PostgreSQL (foreign keys, joins, transactions)
- Supabase Auth (@jsj.pt whitelist SQL trigger)
- Supabase Storage (blobs) + links servidor legacy
- Row Level Security (RLS)
- Realtime (PostgreSQL WAL)

**Nova Hierarquia**:
```
Projecto → Blocos → Pisos (tipologias editáveis) → Zonas
```

**Entregas Core**:
- 6 tabelas relacionais (projects, blocos, pisos, zonas, geo_horizons, project_files)
- RLS policies owner-only (cascading via JOINs)
- Lazy loading imagens (Supabase Storage)
- CRUD Blocos (UI accordion Secção 2)
- Selector Bloco→Piso (Secção 7 Acções)
- Migration script Firebase→Supabase (one-time manual)

**🆕 Links Servidor Legacy**:
- Campo `projects.server_path` (UNC paths Windows)
- Tabela `project_files` (catálogo unificado server/storage/speckle)
- Preparado para RAG v13.0+ (campo `embedding VECTOR` vazio)

**Breaking Changes**:
- ❌ Firebase Auth sessions invalidadas (re-login)
- ❌ Schema incompatível (floors array → blocos relacionais)
- ❌ JSONs v11.0 não importáveis
- ✅ Migration script fornecido

**O que NÃO muda**:
- Frontend Vanilla JS
- Motor gráfico (FloorViewer, zonas.html)
- Cálculos EC1/EC8
- UI 8 secções (layout)

**Próximo**: v11.5 Editor Integrado

---

## 🗺️ FASE 4: EDITOR AVANÇADO

### v11.5 - Editor Integrado
**Duração**: 2 semanas  
**Objetivo**: OpenCV auto-trace adaptado para hierarquia Blocos

**Entregas**:
- Color-trace → Lajes/Vigas/Pilares por Bloco
- Click-to-link continuidade elementos
- Numeração pilares multi-piso
- Graph conectividade estrutural
- Pré-dimensionamento automático (EC2)
- Validações estruturais (alinhamento, simetria, vãos)

**Fundação**: Protótipo v10.4 (OpenCV isolado) adaptado para Blocos

---

## 🔗 FASE 5: SPECKLE LIVE SYNC

### v12.0 - Integração Speckle
**Duração**: 1 semana  
**Objetivo**: Live-sync com modelos BIM (Revit, Rhino, etc)

**Entregas**:
- Speckle Viewer JS embebido
- Webhook auto-refresh plantas
- Mode toggle: Manual upload vs Live sync
- Conflict resolution UI
- Map Revit floors → SSOT Blocos/Pisos

**Fundação**: PostgreSQL (queries cross-model via foreign keys)

**Requisito**: Speckle Server (cloud €50/mês ou self-hosted)

---

## 🤖 FASE 6: AUTOMAÇÃO + IA

### v13.0 - Reports & RAG
**Duração**: 3 semanas  
**Objetivo**: Automação reports + pesquisa semântica

**Entregas**:

**Automação**:
- Supabase Edge Functions → DOCX reports (templates EC0/1/2/8)
- Export peças desenhadas (auto-fill)
- Quadro cargas PDF (1-página)
- Checklist EC automático

**🆕 RAG (Pesquisa Semântica)**:
- pgvector extension (PostgreSQL)
- Embedding pipeline OpenAI (ou Ollama local)
- Semantic search: "encontra estudo geotécnico SPT>20"
- Chat interface: "quais vãos máximos Bloco A?"
- IA extraction: Parse PDFs geotécnicos → auto-fill campos

**Fundação**: Tabela `project_files` já preparada (campo `embedding` vazio preenchido agora)

---

## ⚛️ FASE 7: ESCALABILIDADE

### v14.0 - React Migration
**Duração**: 4 semanas  
**Objetivo**: Componentização para manutenibilidade longo prazo

**Entregas**:
- Supabase React SDK (queries + real-time hooks)
- State management (Zustand + Supabase)
- Modularização 50+ componentes
- TypeScript (opcional)
- Canvas mantém Vanilla (useRef wrapper)

---

## 📋 CRONOGRAMA

| Versão | Duração | Acumulado |
|--------|---------|-----------|
| v10.0 | 1 sem | 1 sem |
| v10.2 | 2 sem | 3 sem |
| v11.0 | 2 sem | 5 sem |
| v11.1 NOVA | 4 sem | 9 sem |
| v11.5 | 2 sem | 11 sem |
| v12.0 | 1 sem | 12 sem |
| v13.0 | 3 sem | 15 sem |
| v14.0 | 4 sem | 19 sem |

**Total**: ~5 meses (tempo parcial, 1 dev)

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. **Implementar v11.1 NOVA**: Seguir spec em `ESPECIFICACAO.md`
2. **Design UI Blocos**: Mock accordion Secção 2 (papel/Figma)
3. **Validar protótipo OpenCV**: Testar color-trace offline

---

## 📝 DECISÕES ESTRATÉGICAS

### Supabase vs Firebase
**Escolha**: Supabase PostgreSQL  
**Motivos**:
- Relacional (foreign keys, joins, transactions)
- Sem limite 1MB docs
- RLS nativo (vs Firestore Rules complexidade)
- pgvector built-in (IA sem infra adicional)
- Speckle integration natural (ambos PostgreSQL)
- Edge Functions Deno (vs Cloud Functions Node.js)

**Trade-offs**:
- ❌ Community menor que Firebase
- ❌ Real-time table-level (não document-level granular)

### Schema Blocos
**Motivos**:
- Hierarquia natural engenharia (Projecto → Blocos → Pisos → Zonas)
- Geotecnia/Acções por bloco (diferentes condições)
- Elimina "zonas" como top-level (agora só geometrias com uso)

### Links Servidor Legacy
**Motivos**:
- Bridge para ficheiros históricos (sem migração inicial)
- Preparado para migração gradual server → cloud
- Catálogo unificado (server + storage + speckle)

### React Fase Final
**Motivos**:
- Vanilla primeiro (aprende fundamentos JS)
- Codebase estável antes de componentizar
- Canvas imperativo (sem ganho React)

---

## 🔄 COMPATIBILIDADE

- ✅ v10.0→v10.2: Auto-migração
- ⚠️ v10.2→v11.0: Requer Firebase auth
- 🔥 v11.0→v11.1: Breaking (migration script manual)
- ✅ v11.1→v14.0: Backward compatible (SQL migrations)

---

**Última atualização**: 15/02/2026  
**Versão atual**: v11.0  
**Próxima milestone**: v11.1 NOVA (Supabase + Blocos + Storage)