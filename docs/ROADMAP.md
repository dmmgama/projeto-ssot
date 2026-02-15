# 🚀 ROADMAP SSOT JSJ - Atualizado 15/02/2026

---

## ✅ FASE 1: SANEAMENTO (Completo)

### v10.0 - Refactor Arquitetural
- Array → UUID Maps
- `appState` multi-projeto
- Proxy legacy bridge

---

## ✅ FASE 2: ARQUITETURA MULTI-PROJETO (Completo)

### v10.2 - Lobby Multi-Projeto
- UI gestão projetos (CRUD)
- localStorage persistência
- Navegação lobby ↔ editor
- Migração automática v9→v10

---

## 🔨 FASE 1.5: EDITOR AVANÇADO (Pré-Firebase)

### v10.4 - Protótipo Color-Trace (1 semana)
**Objetivo**: Validar conceito técnico OpenCV (ficheiro isolado)

- Color-trace PNG → Auto-detecção elementos
- OpenCV.js findContours
- Regras: Cor → Tipo elemento
- DXF parser básico (teste)
- PDF calibração escala (teste)

**Entregável**: Ficheiro standalone `color-trace-prototype.html`  
**Status**: Não integra SSOT (schema v10 vai mudar)

---

## ✅ FASE 3: FIREBASE BACKEND (Completo)

### v11.0 - Firebase Básico ✅ COMPLETO
**Schema**: Mantém estrutura v10 (sem blocos ainda)

- Firestore Collections: `projects/{id}/floors/{id}`
- Firebase Auth (JSJ users)
- Cloud sync (substitui localStorage)
- Real-time updates
- Migração localStorage→Firestore

**Breaking Change**: Requer auth obrigatório

---

## 🔨 FASE 3.1: FIREBASE STORAGE LAYER (1 semana)

### v11.1 - Generic Asset Storage ✅ SPEC FINALIZADA
**Branch Git**: V3.2-firebase-storage  
**Objetivo**: Infraestrutura genérica para assets pesados (PNGs, PDFs, DXF, etc)

**Motivação**:
- Firestore docs limitados a 1MB
- **Agora**: Floor images Base64 (~500KB cada) → 10 pisos = 5MB doc (rejects)
- **Futuro**: PDFs geotécnicos, DXF plantas, Excel maps, videos
- Storage: 5GB free (Spark plan) vs Firestore 1GB

**Arquitectura Final (Firestore-Centric)**:
```javascript
// Firestore Schema (Array mantido, subcollection adiada para v11.2)
projects/{projectId} (document)
  ├─ metadata fields (id_jsj, nome_projeto, etc.)
  └─ floors: [
      {
        id: timestamp,
        name, cota, area,
        imageURL: "gs://bucket/projects/{id}/floors/{id}/image.png",
        imageDownloadURL: "https://...", // Cached (TTL 7 dias)
        imageURLExpiry: timestamp,
        zones: [...]
      }
    ]

// Storage Paths (Genérico)
gs://ssot-jsj.appspot.com/
  └─ projects/{projectId}/
      ├─ floors/{floorId}/image.png
      ├─ geotecnia/{docId}.pdf        // Futuro v11.2+
      ├─ plantas/{dwgId}.dxf          // Futuro v11.2+
      └─ reports/{reportId}.docx      // Futuro v13.0+
```

**Implementação v11.1 (Assets Only - Imagens)**:

**Funções Genéricas (firebase-data.js)**:
```javascript
// Generic upload (preparado para qualquer tipo)
async uploadAsset(projectId, path, file, metadata)
  → { storageURL, downloadURL, expiry }

// Lazy load com cache TTL
async getAssetURL(storageURL, cachedURL, expiry)
  → downloadURL (regenera se expirado)

// Generic delete
async deleteAsset(storageURL)
  → void

// Floor-specific wrappers (v11.1)
async uploadFloorImage(projectId, floorId, file)
async getFloorImageURL(floor)
async deleteFloorImage(floor.imageURL)
```

**Lazy Loading Obrigatório**:
- ❌ NO eager load (lobby.html → index.html)
- ✅ Load on-demand (Secção 7 Viewer, quando user seleciona piso)
- Cache client-side (URL.createObjectURL + flag `floor.imageLoaded`)

**Security Rules**:
```javascript
// Storage Rules (paralelo a Firestore Rules)
match /projects/{projectId}/{allPaths=**} {
  allow read, write: if isOwner(projectId) && isJSJEmail();
  // Valida ownership via Firestore doc lookup
}
```

**Migration Script**:
- `migrate-v11.0-to-v11.1.html` (one-time manual)
- Converte `floor.imageData` (Base64) → Upload Storage → `floor.imageURL`
- Backup Firestore obrigatório antes

**Breaking Change**: 
- Floor images: Base64 string → Storage URLs
- Migração manual obrigatória (script fornecido)

**Files Modified**:
- `firebase-data.js` (+ generic storage layer ~200 linhas)
- `Index_v11.0.html` → `Index_v11.1.html` (lazy load images)
- `lobby.html` (metadata only, sem image load)
- Firebase Console (Storage Rules deployment)

**Files Created**:
- `migrate-v11.0-to-v11.1.html` (migration script)

**Futuro (v11.2+)**: 
- Mesmas funções genéricas servem PDFs (Secção 3), DXF (auto-trace), DOCX (reports)
- Subcollection migration (floors array → subcollection)

**Próximo**: v11.2 Schema Blocos

---

## 🏗️ FASE 3.5: HIERARQUIA BLOCOS

### v11.2 - Schema Blocos (2 semanas)
**Nova Estrutura**:
```
Projeto
└─ Blocos
   ├─ Geotecnia (por bloco)
   ├─ Ações (por bloco)
   └─ Tipologias (Fundações, Enterrados, Elevação, Cobertura)
      └─ Pisos (editáveis: nome, cota, tipo)
```

**Implementação**:
- Firestore: `projects/{id}/blocos/{id}/pisos/{id}` (SUBCOLLECTION)
- UI Secção 2: CRUD Blocos + Tipologias
- UI Secção 5: Selector Bloco → Geotecnia
- UI Secção 7: Selector Bloco → Ações
- **Remove**: Conceito "zonas" (substituído por elementos canvas)
- Pisos editáveis: Nome/Cota/Tipologia mutáveis
- Migração v11.1→v11.2 (array→subcollection)

**Breaking Change**: JSONs v11.1 incompatíveis

---

### v11.5 - Editor Integrado (1 semana)
**Usa**: Protótipo v10.4 adaptado para Blocos

- Color-trace → Lajes/Vigas/Pilares por Bloco
- Click-to-link continuidade vigas
- Numeração pilares multi-piso
- Graph conectividade estrutural
- Cálculo cargas acumuladas
- Pré-dim automático:
  - Momentos vigas (isolada vs contínua)
  - Espessura lajes L/h (EC2)
  - Secções sugeridas
- Validações automáticas:
  - Alinhamento pilares
  - Simetria estrutural
  - Vãos máximos

**Integração**: postMessage → Firebase (salva `actionsData` por Bloco)

---

## 🔗 FASE 4: SPECKLE LIVE SYNC

### v12.0 - Integração Speckle (1 semana)

- Speckle Viewer JS
- Webhook auto-refresh plantas
- Mode toggle: Manual upload vs Live sync
- Conflict resolution UI
- Map: Revit floors → SSOT Blocos/Pisos

**Requisito**: Speckle Server (cloud €50/mês ou self-hosted)

---

## 🤖 FASE 5: AUTOMAÇÃO

### v13.0 - Reports & Export (2 semanas)

- Cloud Functions → DOCX reports automáticos (usa Storage genérico v11.1)
- Templates regulamentação (EC0/1/2/8)
- Export peças desenhadas (auto-fill)
- Quadro cargas PDF (1-página)
- Mapa calor σ_solo (heatmap fundações)
- Checklist EC automático

---

## ⚛️ FASE 6: ESCALABILIDADE

### v14.0 - React Migration (3-4 semanas)

- Componentização UI
- State management (Redux/Zustand)
- Modularização ficheiros (50+ componentes)
- TypeScript (opcional)
- Canvas mantém Vanilla (useRef wrapper)

**Objetivo**: Manutenibilidade longo prazo

---

## 📋 CRONOGRAMA ESTIMADO

| Versão | Duração | Acumulado |
|--------|---------|-----------|
| v10.4 | 1 sem | 1 sem |
| v11.0 | 2 sem | 3 sem |
| v11.1 | 1 sem | 4 sem |
| v11.2 | 2 sem | 6 sem |
| v11.5 | 1 sem | 7 sem |
| v12.0 | 1 sem | 8 sem |
| v13.0 | 2 sem | 10 sem |
| v14.0 | 4 sem | 14 sem |

**Total**: ~3.5 meses (tempo parcial, 1 dev)

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. **Implementar v11.1**: Firebase Storage Layer (ver spec finalizada acima)
2. **Design v11.2**: Mock UI Blocos (papel/Figma)
3. **Validar v10.4**: Testa color-trace offline (aprende OpenCV)

---

## 📝 NOTAS ESTRATÉGICAS

### Decisões Arquitecturais

**Storage Genérico v11.1**:
- Funções agnósticas de tipo (upload/download/delete)
- Implementa só imagens agora, preparado para PDFs/DXF futuro
- Evita refactor quando adicionar novos asset types

**Array mantido v11.1**:
- Subcollection adiada para v11.2 (evita 2 migrações)
- Array funciona <20 floors (scope JSJ)
- v11.2 já refactora schema inteiro (Blocos)

**Lazy Loading obrigatório**:
- Deep search Gemini validou crítico para performance
- Cache TTL 7 dias (balanço freshness vs API calls)

**Blocos após Storage** (v11.2):
- Firestore Collections mapeiam hierarquia natural
- Evita migração localStorage complexa
- Storage genérico já preparado para assets por bloco

**Editor protótipo v10.4**:
- Valida tech (OpenCV) sem comprometer schema
- Reaproveitado v11.5 (adapta para Blocos)

**React fase final** (v14.0):
- Mantém Vanilla até codebase estável
- Aprende fundamentos JS primeiro
- Canvas continua imperativo (sem ganho React)

### Compatibilidade

- ✅ v10.0→v10.2: Auto-migração
- ⚠️ v10.2→v11.0: Requer Firebase auth
- 🔥 v11.0→v11.1: Breaking (Base64→Storage, script manual)
- 🔥 v11.1→v11.2: Breaking (schema Blocos)
- ✅ v11.2→v14.0: Backward compatible

---

**Última atualização**: 15/02/2026  
**Versão atual**: v11.0  
**Próxima milestone**: v11.1 (Asset Storage Layer)
