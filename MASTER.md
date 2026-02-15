# 🤖 MANIFESTO MESTRE: Template Edifício JSJ

**Status:** Documentação Viva  
**Versão Actual:** v11.0 (Firebase Backend)  
**Objectivo:** Guia central para Agentes de Código e Developers.  
**Última Actualização:** 15/02/2026

---

## 🚨 PROTOCOLO DE INICIALIZAÇÃO (Boot Sequence)

Sempre que iniciares uma sessão ou fores instruído a trabalhar neste projecto, segue esta ordem:

1. **Identificar a Versão Actual:** Procura na raiz o ficheiro principal (`Index_v11.0.html`). Verifica `<title>` ou variável `version`.

2. **Ler Contexto (Pela ordem abaixo):**
   1. `ESPECIFICACAO.md` — Schema completo, API interna, fluxos de dados, Firebase backend, motor gráfico
   2. `RISCOS.md` — **CRÍTICO.** IDs/funções protegidas, dependências cruzadas. Lê ANTES de alterar qualquer código.
   3. `TESTES.md` — Casos de teste obrigatórios (regressão, integração, Firebase)
   4. `GUIDELINES.md` — Padrões de código, naming, boas práticas
   5. `ROADMAP.md` — Objectivos futuros (opcional, contexto estratégico)

3. **Referência funcional** (se precisares entender o "quê" sem o "como"):
   - `MANUAL_FUNCIONAL.md` — Hierarquia funcional do formulário (7 níveis)

---

## 🧭 Princípios de Desenvolvimento

1. **SSOT (Single Source of Truth):** O objecto global `projectData` é a fonte de verdade. O HTML é reflexo visual. **Nunca** ler do DOM para cálculos — ler de `projectData`.
2. **Continuidade Gráfica:** Alterações em `floors` ou `zones` devem ser validadas contra `zonas.html` (Editor Gráfico) via `postMessage`.
3. **Preservação de IDs:** O sistema de Import/Export JSON depende dos `id` dos inputs HTML. Não alterar sem migração.
4. **Firebase-First (v11.0+):** Persistência é Firestore. Funções CRUD são async — sempre usar `await`. Listeners real-time devem ser limpos em `beforeunload`.
5. **Protótipos Isolados:** Tecnologia nova (ex: OpenCV) → ficheiro standalone FORA do SSOT.

---

## 🗺️ Mapa de Ficheiros

### Aplicação
| Ficheiro | Descrição | Versão |
|---|---|---|
| `Index_v11.0.html` | Core App (UI + Lógica + Estado) | v11.0 |
| `lobby.html` | Gestão multi-projecto (grid + CRUD) | v11.0 |
| `login.html` | Firebase Auth UI (Google Sign-In) | v11.0 |
| `firebase-config.js` | Firebase SDK config + Auth whitelist | v11.0 |
| `firebase-data.js` | Firestore CRUD + serialização + real-time | v11.0 |
| `zonas.html` | Editor Canvas isolado (popup) | v9.0+ |

### Protótipos
| Ficheiro | Descrição | Status |
|---|---|---|
| `color-trace-prototype.html` | OpenCV auto-trace | Não integra SSOT |

### Documentação (7 ficheiros)
| Ficheiro | Conteúdo |
|---|---|
| `MASTER.md` | **Este ficheiro.** Boot sequence + mapa |
| `ESPECIFICACAO.md` | Schema, API, fluxos, Firebase, motor gráfico |
| `RISCOS.md` | IDs protegidos, funções críticas, dependências |
| `TESTES.md` | Suite de testes (regressão + integração + Firebase) |
| `GUIDELINES.md` | Naming, code style, padrões Firebase |
| `ROADMAP.md` | Fases de evolução (v11.1 → v14.0) |
| `MANUAL_FUNCIONAL.md` | Hierarquia funcional do formulário |

---

## ⚡ Referência Rápida: O Que Consultar Quando

| Situação | Documento |
|---|---|
| Preciso entender o schema / fluxo de dados | `ESPECIFICACAO.md` §2 |
| Vou alterar um ID HTML ou função | `RISCOS.md` §2-3 |
| Vou mexer em `actionsData` ou `FloorViewer` | `RISCOS.md` §1 + `ESPECIFICACAO.md` §6-7 |
| Vou mexer em Firebase/Firestore | `RISCOS.md` §11 + `ESPECIFICACAO.md` §5 |
| Preciso testar alterações | `TESTES.md` |
| Dúvida de naming ou code style | `GUIDELINES.md` |
| Planeamento futuro | `ROADMAP.md` |

---

*Ao leres este ficheiro, assume a persona de "Senior Lead Developer" da JSJ: pragmático, focado na escalabilidade e obcecado por não quebrar código legado.*
