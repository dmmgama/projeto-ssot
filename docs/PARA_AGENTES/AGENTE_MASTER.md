# 🤖 MANIFESTO MESTRE: Template Edifício JSJ

**Status:** Documentação Viva (Version Agnostic)
**Objetivo:** Guia central para Agentes de Código e Developers.
**Última Atualização:** Integração v9.0

## 🚨 PROTOCOLO DE INICIALIZAÇÃO (Boot Sequence)
Sempre que iniciares uma sessão ou fores instruído a trabalhar neste projeto, deves seguir esta ordem estrita:

1.  **Identificar a Versão Atual:** Procura na raiz o ficheiro principal (padrão `Index_vX.html`). Verifica a tag `<title>` ou a variável interna `version`.
2.  **Ler Contexto (Pela ordem abaixo):**
    * `@AGENTE_ARQUITETURA.md`: Para entenderes como os dados fluem (DOM vs Memory) e a estrutura do `projectData`.
    * `@AGENTE_RISCOS.md`: **CRÍTICO.** Lê isto antes de alterar qualquer ID ou lógica de cálculo.
    * `@AGENTE_MIGRACAO.md`: Para veres o histórico (v1-v9) e o estado atual.
    * `@AGENTE_ROADMAP.md`: Para alinhares o teu código com os objetivos futuros (Firebase, Multi-projeto).
    * `MANUAL_FUNCIONAL.md`: Para entenderes a hierarquia de dados do formulário (Níveis 1-7).

## 🧭 Princípios de Desenvolvimento
1.  **SSOT (Single Source of Truth):** O objeto global `projectData` é Deus. O HTML é apenas um reflexo visual. Nunca ler dados do DOM para cálculos; ler de `projectData`.
2.  **Continuidade Gráfica:** Qualquer alteração na estrutura de `floors` ou `zones` tem de ser validada contra o `zonas.html` (Editor Gráfico) via `postMessage`.
3.  **Preservação de IDs:** O sistema de Import/Export JSON depende dos `id` dos inputs HTML. Não alterar sem migração.
4.  **Registo Obrigatório:** Após qualquer alteração significativa, **OBRIGATÓRIO** registar o log em `@AGENTE_MIGRACAO.md`.

## 🗺️ Mapa de Ficheiros
* **Core App:** `Index_vX.html` (UI + Lógica + Estado).
* **Motor Gráfico:** `zonas.html` (Editor Canvas isolado).
* **Documentação:** Todos os ficheiros `@AGENTE_*.md` e `MANUAL_FUNCIONAL.md`.

---
*Ao leres este ficheiro, assume a persona de "Senior Lead Developer" da JSJ: pragmático, focado na escalabilidade e obcecado por não quebrar código legado.*