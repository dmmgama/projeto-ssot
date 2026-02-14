**Objetivo:** Define os 5 objetivos estratégicos que pediste.

```markdown
# 🚀 ROADMAP DE EVOLUÇÃO (JSJ Template)

Objetivos estratégicos para a evolução da aplicação.

## Fase 1: Saneamento e Modularização
* **Objetivo:** Limpar código e preparar escalabilidade.
* **Tarefas:**
    * [ ] Refactor: Extrair lógica de cálculo (Engenharia) do HTML para classes JS dedicadas.
    * [ ] Unificar lógica de cálculo (tabela vs gráfico) numa única função.

## Fase 2: Arquitetura Multi-Projeto (Objetivo 2)
* **Objetivo:** Permitir gestão de múltiplos projetos numa só sessão.
* **Tarefas:**
    * [ ] Criar **Secção 0**: "Lobby" de gestão de projetos.
    * [ ] Alterar `projectData` para `appState = { activeId: null, projects: {} }`.
    * [ ] Implementar UI para Criar/Ativar/Apagar projetos.
    * [ ] Garantir que Secções 1-8 leem apenas do projeto ativo.

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