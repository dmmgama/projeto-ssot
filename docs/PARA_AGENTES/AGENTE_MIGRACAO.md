bjetivo: O diário de bordo. Integra o histórico do Versoes Index - Explicacao.md e prepara para as próximas versões.

Markdown

# 📜 REGISTO DE MIGRAÇÃO E VERSÕES

Este documento serve de "Memória de Longo Prazo" do projeto.
**Instrução:** Sempre que finalizares uma tarefa complexa ou mudares de versão, adiciona uma entrada aqui.

## Template de Registo

```text
### [vX.0 -> vY.0] - DD/MM/AAAA
**Autor:** (Nome do Agente/User)
**Resumo:** ...
**Alterações Arquiteturais:** ...
```

---

## 📅 Histórico de Versões

### [v10.2 → v10.4] - 14/02/2026
**Autor**: David + Claude Estratégico
**Resumo**: Fase 1.5 - Protótipo Color-Trace isolado (pré-Firebase)

**Decisão Estratégica**:
- Criar ficheiro standalone `color-trace-prototype.html` (não integra SSOT)
- Validar conceito OpenCV.js antes de schema Blocos v11.1
- Protótipo será adaptado/reescrito em v11.5 (Editor Integrado)

**Funcionalidades Protótipo**:
- Color-trace PNG → Auto-detecção elementos (lajes/vigas/pilares)
- OpenCV.js findContours
- Regras: Cor → Tipo elemento
- DXF parser básico (teste)
- PDF calibração escala (teste)

**Arquitetura**:
- Ficheiro isolado (sem dependências SSOT)
- Não persiste dados (demo técnico)
- Canvas imperativo (Vanilla JS)

**Motivação**:
- Schema v10 vai mudar drasticamente em v11.1 (Blocos)
- Evita refactor duplo (integrar agora + refactor depois)
- Permite aprendizagem OpenCV sem risco

**Compatibilidade**:
- ✅ Não afeta SSOT v10.2 (ficheiros separados)
- ✅ Código reutilizável em v11.5

**Próximos Passos**: Firebase v11.0 (mantém schema v10)

**Status**: 🚧 Planeado (1 semana dev)

---

### [v10.2 → v11.0] - 14/02/2026
**Autor**: David + Claude Strategic + IDE Agent
**Resumo**: Firebase Backend Integration COMPLETO

**Alterações Arquiteturais**:
- Firebase Auth (login/logout/whitelist @jsj.pt)
- Firestore CRUD (substitui localStorage)
- Real-time sync (subscribeToProject)
- Auto-save 30s
- Security Rules (owner-only access)

**Ficheiros Criados**:
- firebase-config.js (config + whitelist)
- firebase-data.js (CRUD layer)
- login.html (auth UI)

**Ficheiros Modificados**:
- Index_v10.2.html → Index_v11.0.html (auth + real-time)
- lobby.html (auth guard + Firestore integration)

**Breaking Changes**:
- Requer Firebase Auth obrigatório
- localStorage descontinuado para projetos
- JSONs v10.2 incompatíveis (dados em Firestore agora)

**Bugs Conhecidos** (não-bloqueantes):
- toggleActionSection timing (cosmético)
- localStorage logs legacy em shared.js

**Status**: ✅ Production Ready
**Próximos Passos**: v11.1 Schema Blocos (ver AGENTE_ROADMAP.md)

---

### [v10.0 → v10.2] - 13/02/2026
**Autor**: David + Claude Estratégico + Claude Code
**Resumo**: Fase 2 - Arquitetura Multi-Projeto COMPLETO

**Alterações Arquitecturais**:
- Novo ficheiro `lobby.html` (gestão projetos)
- Novo ficheiro `shared.js` (UUID + localStorage utilities)
- `index.html` agora recebe URL param `?project=<uuid>`
- Navegação: lobby.html → index.html?project=X → lobby.html

**Funcionalidades Novas**:
- Grid de projetos com cards (ID JSJ, Nome, Cliente)
- CRUD completo: Criar, Abrir, Apagar projetos
- Persistência automática em localStorage
- Botão "🏠 Voltar ao Lobby" no index.html
- Auto-save ao sair de projeto

**Persistência**:
- localStorage key: `ssot_projects`
- Formato: `{ projectId: { id, floors: Map, zones: Map, ... } }`
- Serialização Maps → Arrays no save
- Desserialização Arrays → Maps no load

**Migração v9→v10**:
- JSONs v9.1 migram automaticamente (single project → multi-project)
- Gera UUID novo para projeto migrado
- Mantém compatibilidade com estrutura antiga

**Bugs Corrigidos Durante Implementação**:
1. Maps não serializavam (fix em saveProjectsToStorage)
2. actionsData não persistia (fix: saveCurrentProject após postMessage)
3. zonas.html abria vazio (fix: enviar actionsData existente no initEditor)

**Breaking Changes**:
- `index.html` sem URL param redirige para lobby.html
- JSONs v10.2 incompatíveis com Index_v9.html (estrutura diferente)

**Compatibilidade**:
- ✅ Secções 1-8 inalteradas (funcionam igual)
- ✅ zonas.html compatível (postMessage mantido)
- ✅ Import v9 → v10 automático
- ✅ appState.activeProject Proxy funcional

**Ficheiros Novos**:
- `lobby.html` (~280 linhas)
- `shared.js` (~120 linhas)

**Ficheiros Modificados**:
- `Index_v10.html` (+ URL param logic, + botão lobby, + auto-save)

**Próximos Passos**: Fase 1.5 (Protótipo Color-Trace v10.4)

**Status**: ✅ Production Ready

---

### [v9.1 → v10.0] - 13/02/2026
**Autor**: David + Claude Strategic + Claude Code
**Resumo**: Refactor invisível para arquitetura multi-projeto Firebase-ready

**Alterações Arquiteturais**:
- Novo SSOT: `appState = { activeProjectId, projects: {} }`
- `projectData` agora é Proxy (legacy bridge)
- `floors`, `zones`, `geoHorizons` → Mapas UUID
- Migração automática v9→v10 em `loadAllData()`

**Bugs Corrigidos**:
- findPisoById: parseInt() → comparação string direta
- postMessage: Escrita em appState (não Proxy)
- loadAllData: Chamadas render no final (fora de ifs)

**Breaking Changes**:
- Mutação directa `projectData.floors.push()` NÃO funciona
- Funções DEVEM usar `appState` directamente

**Compatibilidade**:
- ✅ JSONs v9.1 migram automaticamente
- ✅ UI inalterada (refactor invisível)
- ✅ zonas.html não afectado

**Status**: ✅ Production Ready
**Próximos Passos**: Fase 2 (UI Lobby v10.2) agora segura para implementar


[v9.1] - Documentação Técnica Completa - 13/02/2026
**Autor**: Claude (Conselheiro Estratégico)
**Resumo**: Gerados ESPECIFICACAO.md + GUIDELINES.md baseados em análise de Index_v9.1.html

**Adições**:
- ESPECIFICACAO.md (7200 palavras): Schema completo, API interna, protocolo zonas.html
- GUIDELINES.md (3800 palavras): Naming, estrutura, protocolos alteração, testes

**Observações**:
- Tag `<title>` ainda diz v6.0 (corrigir em v9.2)
- Confirmada limpeza v9.0→v9.1 (código morto removido)
- Nenhuma alteração funcional vs v9.0

[v9.1] - Limpeza de Código Morto - 12/02/2026
Autor: Antigravity Agent
Resumo: Auditoria e remoção de funcionalidades quebradas ou não utilizadas.
Alterações:
- Removido script `updateTosco` (ignorado por innerHTML injection).
- Removido método `getZoneCentroid` (não utilizado).
- Validado integridade dos restantes componentes.



[v9.0] - Versão Estável (Atual)
Status: Production Ready
Resumo: Consolidação do editor gráfico e lógica de ações.

Viewer: Implementado FloorViewer com Heatmap ELU e Sonda.

Editor: zonas.html estabilizado com comunicação via postMessage.

Features: Análise Analítica Avançada, Mapa ELU, Pré-Dimensionamento de Pilares.

[v7.0 - v8.0] - Iterações do Editor
Resumo: Implementação inicial e melhoria do editor de cargas base. Introdução da lógica "Max-Thickness" para lajes sobrepostas.

[v3.0 - v6.0] - Versões Descontinuadas
Resumo: Tentativas falhadas de implementação do editor de cargas ("LIXO"). Código removido e reescrito na v7.

[v2.0] - Melhorias de UI
Resumo: Refinamento da Secção 1 (Identificação) e estrutura visual.

[v1.0] - Versão Original
Resumo: MVP inicial do formulário.

🔄 Guias de Migração Futura
Para v11.1 (Planeado - Schema Blocos)
**BREAKING CHANGE CRÍTICO**: 
- Estrutura `zones` será deprecada
- Nova hierarquia: Projeto → Blocos → Tipologias → Pisos
- Geotecnia e Ações passam a ser por Bloco (não global)
- Migração automática v11.0→v11.1 requerida

Ao migrar para Firebase (v11.0), criar script para converter localStorage em documentos Firestore.
