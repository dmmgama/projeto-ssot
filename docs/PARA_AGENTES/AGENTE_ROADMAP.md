**Objetivo:** Define os 5 objetivos estratégicos que pediste.

```markdown
# 🚀 ROADMAP DE EVOLUÇÃO (JSJ Template)

Objetivos estratégicos para a evolução da aplicação.

## Fase 1: Saneamento ✅ COMPLETO (v10.0)
- [x] Refactor Array→UUID
- [x] appState multi-projeto
- [x] Proxy legacy bridge

## Fase 2: Arquitetura Multi-Projeto ✅ COMPLETO (v10.1)
* **Objetivo:** Permitir gestão de múltiplos projetos numa só sessão.
* **Tarefas:**
    * [x] Criar lobby.html (gestão de projetos)
    * [x] Criar shared.js (utilities)
    * [x] Adaptar index.html para URL params
    * [x] Implementar persistência localStorage
    * [x] UI CRUD completa (Criar/Abrir/Apagar)
    * [x] Integração com zonas.html (actionsData)
    * [x] Migração automática v9→v10

**Implementação**: lobby.html (ponto entrada) + index.html (editor projeto único)
**Persistência**: localStorage (Maps serializados como Arrays)

## Fase 3: Backend & Web App (Objetivo 3)
* **Objetivo:** Dados consistentes e acessíveis.
* **Tarefas:**
    * [ ] Integração com **Firebase** (Firestore).
    * [ ] Autenticação (Login JSJ).
    * [ ] Substituir Import/Export JSON por Save/Load Cloud.

## Fase 4: Automação e Integração (Objetivo 4)
* **Objetivo:** Ligar o formulário a ferramentas externas.
* **Tarefas:**
    * [ ] Criar Cloud Functions para gerar Relatórios (.docx) automáticos.
    * [ ] Automatizar preenchimento de peças desenhadas (se possível).

## Fase 5: Escalabilidade (Objetivo 5)
* **Objetivo:** Incluir novas funcionalidades sem "baralhar".
* **Tarefas:**
    * [ ] Migração para Framework Reativo (Vue/React) ou Componentização Web Components.
    * [ ] Modularização estrita de ficheiros CSS/JS.