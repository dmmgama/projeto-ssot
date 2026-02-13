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
📅 Histórico de Versões
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
Para v10 (Planeado)
Verificar @AGENTE_ROADMAP.md para instruções sobre a criação da "Secção 0".

Ao migrar para Firebase, criar script para converter os JSONs atuais em documentos NoSQL.
