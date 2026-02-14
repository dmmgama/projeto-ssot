# 🚀 ROADMAP SSOT JSJ - Atualizado 14/02/2026

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

## 🏗️ FASE 3.5: HIERARQUIA BLOCOS

### v11.1 - Schema Blocos (2 semanas)
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
- Firestore: `projects/{id}/blocos/{id}/pisos/{id}`
- UI Secção 2: CRUD Blocos + Tipologias
- UI Secção 5: Selector Bloco → Geotecnia
- UI Secção 7: Selector Bloco → Ações
- **Remove**: Conceito "zonas" (substituído por elementos canvas)
- Pisos editáveis: Nome/Cota/Tipologia mutáveis
- Migração v11.0→v11.1

**Breaking Change**: JSONs v11.0 incompatíveis

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

- Cloud Functions → DOCX reports automáticos
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
| v11.1 | 2 sem | 5 sem |
| v11.5 | 1 sem | 6 sem |
| v12.0 | 1 sem | 7 sem |
| v13.0 | 2 sem | 9 sem |
| v14.0 | 4 sem | 13 sem |

**Total**: ~3 meses (tempo parcial, 1 dev)

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. **Validar v10.4**: Testa color-trace offline (aprende OpenCV)
2. **Design v11.1**: Mock UI Blocos (papel/Figma)
3. **Setup Firebase**: Criar projeto, config auth

---

## 📝 NOTAS ESTRATÉGICAS

### Decisões Arquitecturais

**Blocos após Firebase** (v11.1):
- Firestore Collections mapeiam hierarquia natural
- Evita migração localStorage complexa

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
- 🔥 v11.0→v11.1: Breaking (schema Blocos)
- ✅ v11.1→v14.0: Backward compatible

---

**Última atualização**: 14/02/2026  
**Versão atual**: v10.2 (Lobby multi-projeto)  
**Próxima milestone**: v10.4 (Protótipo color-trace)
