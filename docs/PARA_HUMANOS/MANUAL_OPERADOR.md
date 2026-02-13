# 📘 MANUAL DO OPERADOR: Gestão de Agentes no SSOT

**Para**: David (Diretor Técnico JSJ)
**Objectivo**: Guia passo-a-passo para implementar alterações usando agentes de código sem perder o controlo.

---

## ÍNDICE

1. [Setup Inicial](#1-setup-inicial)
2. [Workflow de Alteração](#2-workflow-de-alteração)
3. [Quando Criar Chat Novo vs Continuar](#3-quando-criar-chat-novo-vs-continuar)
4. [Troubleshooting (Agente Baralhado)](#4-troubleshooting-agente-baralhado)
5. [Checklist de Qualidade](#5-checklist-de-qualidade)
6. [Exemplos Práticos](#6-exemplos-práticos)
7. [Gestão do Projeto Claude](#7-gestão-do-projeto-claude)

---

## 1. SETUP INICIAL

### 1.1 Primeira Vez no IDE (10 min)

**Estrutura de ficheiros**:
```
/projeto-ssot/
├── Index_v9.html              # App actual
├── zonas.html                 # Editor gráfico
├── docs/
│   ├── PARA_AGENTES/
│   │   ├── @AGENTE_MASTER.md
│   │   ├── @AGENTE_ARQUITETURA.md
│   │   ├── AGENTE_RISCOS_v2.md
│   │   └── @AGENTE_TESTES.md
│   ├── PARA_HUMANOS/
│   │   ├── @AGENTE_ROADMAP.md
│   │   ├── @AGENTE_MIGRACAO.md
│   │   └── MANUAL_FUNCIONAL.md
│   └── fixtures/
│       ├── backup_v9_minimal.json
│       └── backup_v9_completo.json
└── backups/
    └── [backups automáticos]
```

**Validação**:
```bash
# No terminal do IDE:
ls docs/PARA_AGENTES/  # Deve mostrar 4 ficheiros
```

---

### 1.2 Primeira Vez no Projeto Claude (5 min)

**Passos**:
1. Vai a claude.ai → Projects → "Create Project"
2. Nome: **"SSOT - Diretor Estratégico"**
3. **Instructions**: Cola conteúdo de `INSTRUCTIONS_PROJETO_CLAUDE.md`
4. **Knowledge Base**: Anexa todos os ficheiros de `/docs/`
   - @AGENTE_MASTER.md
   - @AGENTE_ARQUITETURA.md
   - AGENTE_RISCOS_v2.md
   - @AGENTE_TESTES.md
   - @AGENTE_ROADMAP.md
   - @AGENTE_MIGRACAO.md
   - MANUAL_FUNCIONAL.md

**Teste**:
```
TU: "Estás pronto? Resume o estado actual do projeto."
CLAUDE: [Deve responder com contexto de v9.0, roadmap, riscos]
```

---

## 2. WORKFLOW DE ALTERAÇÃO (Receita de Bolo)

### Passo 1: Define O QUE Vais Mudar

**ANTES de falar com qualquer agente**, faz isto:

#### Opção A: Alteração de UI/Funcionalidade
```markdown
## O que quero mudar
[Descreve em 3-5 frases]

## Exemplo:
"Adicionar campo 'Email do Cliente' na Secção 1, após o campo 'Cliente'.
Deve ser input tipo email, obrigatório, e aparecer no Export JSON."
```

#### Opção B: Alteração Estrutural (Nova Secção, Refactor)
```markdown
## O que quero mudar
[Descreve]

## Impacto esperado
- Ficheiros alterados: [lista]
- Funcionalidades afectadas: [lista]

## Exemplo:
"Implementar Secção 0 (Lobby) para gestão multi-projeto.
Impacto: Refactor de projectData → appState, nova UI, mudar Import/Export."
```

**💡 TIP**: Se não sabes o impacto, pergunta no **Projeto Claude** primeiro (brainstorming).

---

### Passo 2: Escolhe a Ferramenta Certa

| Se queres... | Usa... | Onde? |
|--------------|--------|-------|
| **Brainstorming de soluções** | Projeto Claude | claude.ai |
| **Decisão estratégica** (Firebase vs Supabase) | Projeto Claude | claude.ai |
| **Plano de implementação** (tasks ordenadas) | Projeto Claude | claude.ai |
| **Escrever código** | Agente no IDE | Claude Code / Cursor / Windsurf |
| **Testar/validar** | Manual (tu) | Browser |

**Fluxo típico**:
```
Projeto Claude (brainstorm) 
    ↓ [aprova solução]
Projeto Claude (gera diretivas)
    ↓ [copia prompt]
Agente IDE (implementa)
    ↓ [testa]
TU (valida)
```

---

### Passo 3: Trabalhar com Agente no IDE

#### Template de Prompt Inicial

**SEMPRE começa assim** (copia-cola):

```markdown
# TASK: [Descrição curta - ex: "Adicionar campo Email na Secção 1"]

## CONTEXTO
Projecto: SSOT JSJ Template (v9.X)
Ficheiro: Index_v9.html

## PROTOCOLO OBRIGATÓRIO
Lê ANTES de começar (ordem):
1. docs/PARA_AGENTES/@AGENTE_MASTER.md
2. docs/PARA_AGENTES/@AGENTE_ARQUITETURA.md
3. docs/PARA_AGENTES/AGENTE_RISCOS_v2.md
4. docs/PARA_AGENTES/@AGENTE_TESTES.md

Confirma leitura antes de prosseguir.

## ALTERAÇÃO PEDIDA
[Descreve aqui em 3-5 frases o que queres]

Exemplo:
"Adicionar input de email após o campo 'cliente' na Secção 1.
- ID: 'cliente_email'
- Tipo: email
- Obrigatório: sim
- Incluir em collectAllData() e loadAllData()
- Testar: Export → Import → Valida campo"

## RESTRIÇÕES
- Consulta AGENTE_RISCOS_v2.md antes de tocar em qualquer ID
- Testa após implementação (ver @AGENTE_TESTES.md)
- Actualiza docs/@AGENTE_MIGRACAO.md no final
```

---

#### Deixa Agente Trabalhar

**Agente deve**:
1. ✅ Confirmar leitura dos 4 MDs (2 min)
2. ❓ Fazer perguntas de clarificação (SE necessário)
3. 🔨 Implementar
4. 🧪 Testar
5. 📝 Propor actualização de docs

**TU fazes**:
- ✅ Responde perguntas de clarificação
- ❌ **NÃO dês** novas instruções a meio (espera finalizar)
- ❌ **NÃO digas** "usa tua criatividade" (sê específico)

---

### Passo 4: Validação (Checklist)

Após agente dizer "concluído", **TU testas**:

```markdown
## Checklist de Aceitação Mínima

- [ ] Abro Index_vX.html no browser
- [ ] Console (F12): 0 erros JavaScript
- [ ] Funcionalidade nova funciona
- [ ] Testo Import JSON antigo → Dados carregam
- [ ] Testo Export JSON novo → Ficheiro válido
- [ ] [SE gráfico] Viewer 2D renderiza
- [ ] [SE cálculo] Valores EC1 correctos
- [ ] docs/@AGENTE_MIGRACAO.md actualizado
```

**Resultado**:
- ✅ **Tudo OK** → Commit + Fecha chat
- ❌ **1+ item falha** → Volta ao agente (ou chat novo se muito baralhado)

---

## 3. QUANDO CRIAR CHAT NOVO vs CONTINUAR

### 3.1 Regra de Ouro

| Situação | Acção |
|----------|-------|
| Alteração **diferente** da anterior | ✅ Chat **NOVO** |
| Bug/refinamento da **mesma** alteração | ✅ **CONTINUA** chat |
| Passou >1 dia desde último chat | ✅ Chat **NOVO** |
| Agente deu 3+ respostas confusas | ✅ Chat **NOVO** |
| Já fizeste >5 idas-vindas no chat | ✅ Chat **NOVO** |
| Chat tem >20 mensagens | ✅ Chat **NOVO** |

---

### 3.2 Sinais de Alerta (Agente Baralhado)

| Sintoma | Significado | Acção |
|---------|-------------|-------|
| Repete código já implementado | Perdeu contexto | 🆕 Chat NOVO |
| Ignora `AGENTE_RISCOS_v2.md` | Não leu docs | 🆕 Chat NOVO + reforça protocolo |
| Sugere apagar função crítica | Contexto contaminado | 🆕 Chat NOVO |
| Implementa MAS não testa | Pressa/contexto cheio | 🆕 Chat NOVO |
| >10 msgs sem progresso | Loop de confusão | 🆕 Chat NOVO |
| Dá respostas genéricas | Contexto saturado | 🆕 Chat NOVO |

---

### 3.3 Como Criar Chat Novo Produtivo

**NÃO faças**:
```
❌ "Continua de onde paramos"
❌ "Lembras-te do que estávamos a fazer?"
❌ [Cola 50 linhas de código sem contexto]
```

**FAZ**:
```
✅ Usa template de Prompt Inicial (Passo 3)
✅ Resume o que foi feito até agora:
   "Contexto: Já implementei campo X na Secção 1.
    Agora preciso: Adicionar validação de email ao campo X."
✅ Anexa ficheiros relevantes se necessário
```

---

## 4. TROUBLESHOOTING (Agente Baralhado)

### 4.1 Problema: "Agente apagou código importante"

**Causa**: Não leu `AGENTE_RISCOS_v2.md` ou ignorou

**Fix Imediato**:
```bash
# 1. Reverte (se tens git)
git checkout Index_v9.html

# 2. OU restaura backup
cp backups/Index_v9_BACKUP_*.html Index_v9.html
```

**Prevenção**:
- Reforça no prompt: **"Consulta AGENTE_RISCOS_v2.md ANTES de remover qualquer função"**
- Pede auditoria primeiro: **"Lista o que vais remover antes de remover"**

---

### 4.2 Problema: "Import JSON deixou de funcionar"

**Causa**: Agente mudou ID de input ou estrutura de `projectData`

**Diagnóstico**:
```javascript
// Cola na console do browser após importar:
console.log(projectData);  // Valida estrutura

// Procura erros específicos:
const data = collectAllData();
console.log(Object.keys(data));  // Lista IDs serializados
```

**Fix**:
- Identifica ID que mudou (compara com `AGENTE_RISCOS_v2.md`)
- Pede ao agente: **"Restaura ID original ou adiciona fallback em loadAllData()"**

---

### 4.3 Problema: "Viewer 2D não renderiza"

**Causa**: Estrutura `actionsData` foi alterada

**Diagnóstico**:
```javascript
// Console do browser:
const floor = projectData.floors[0];
console.log(floor.actionsData);  // Valida estrutura
// Esperado: { editorScale, layers: { lajes, sobrecargas, rcp } }
```

**Fix**:
- Valida se `zonas.html` foi alterado também (deve ser sincronizado)
- Restaura estrutura original de `actionsData` (ver `@AGENTE_ARQUITETURA.md`)

---

### 4.4 Problema: "Agente não sabe por onde começar"

**Causa**: Prompt muito vago ou tarefa muito complexa

**Fix**:
1. **Divide tarefa** em sub-tarefas menores
2. **Sê mais específico**:
   ```
   ❌ "Melhora a Secção 2"
   ✅ "Adiciona botão 'Duplicar Piso' que copia piso existente com novo ID"
   ```
3. **Fornece exemplo**:
   ```
   "Quando clico 'Duplicar Piso 0', cria 'Piso 0 (cópia)' com:
   - Mesmo nome + ' (cópia)'
   - Mesma cota + 0.01
   - Mesmas zonas (duplicadas)"
   ```

---

## 5. CHECKLIST DE QUALIDADE

### 5.1 Antes de Commitar

```markdown
## Checklist Técnica

- [ ] Código compila/abre sem erros
- [ ] Console do browser: 0 erros JavaScript
- [ ] Teste IO: Import/Export funciona
- [ ] Teste visual: UI renderiza correctamente
- [ ] [SE cálculo] Valores EC1/EC8 correctos
- [ ] [SE gráfico] Canvas renderiza

## Checklist Documentação

- [ ] `docs/@AGENTE_MIGRACAO.md` actualizado com entrada vX→vY
- [ ] `docs/AGENTE_RISCOS_v2.md` actualizado (SE adicionou IDs/funções críticas)
- [ ] Commit message descritivo (ex: "feat: adiciona campo email Secção 1")
```

---

### 5.2 Antes de Incrementar Versão (vX → vY)

```markdown
## Checklist Versão Major

- [ ] Todos os testes de `@AGENTE_TESTES.md` ✅ PASS
- [ ] Testado com ≥3 JSONs diferentes:
  - [ ] backup_v9_minimal.json
  - [ ] backup_v9_completo.json
  - [ ] JSON de projeto real
- [ ] Viewer 2D testado com polígonos complexos
- [ ] Relatório Markdown gera sem erros
- [ ] Gráficos sísmicos renderizam (Chart.js)
- [ ] Compatibilidade: JSONs de versão anterior carregam
- [ ] Criada tag git: `git tag v9.1`
```

---

## 6. EXEMPLOS PRÁTICOS

### 6.1 Exemplo: Adicionar Campo Simples

**Situação**: Queres adicionar campo "NIF do Cliente" na Secção 1.

**Fluxo**:

#### No Projeto Claude:
```
TU: "Preciso adicionar campo NIF na Secção 1. Como faço?"

CLAUDE: [Dá diretivas: onde inserir HTML, como actualizar collectAllData, etc]
```

#### No IDE (Agente):
```
TU: [Cola prompt do template]

# TASK: Adicionar campo NIF na Secção 1

## ALTERAÇÃO PEDIDA
Adicionar input após campo "Cliente":
- Label: "NIF do Cliente"
- ID: "cliente_nif"
- Tipo: text
- Placeholder: "999999999"
- Incluir em collectAllData() e loadAllData()
- Incluir em buildMarkdownReport() (Secção 1)

AGENTE: [Implementa + testa + actualiza docs]

TU: [Valida com checklist]
```

---

### 6.2 Exemplo: Refactor Complexo (Multi-Projeto)

**Situação**: Implementar Fase 2 do Roadmap (Secção 0 - Lobby).

**Fluxo**:

#### No Projeto Claude (Brainstorming):
```
TU: "Vou implementar Fase 2 (Multi-Projeto). Qual a melhor abordagem?"

CLAUDE: [Apresenta 2-3 opções de arquitectura]
        [Tu escolhes uma]

TU: "Opta pela Opção B. Dá-me o plano de implementação."

CLAUDE: [Gera tasks ordenadas, ex:]
        Task 1: Refactor projectData → appState
        Task 2: Criar UI Secção 0
        Task 3: Adaptar Secções 1-8
        Task 4: Migrar Import/Export
```

#### No IDE (Agente) - Task 1:
```
TU: [Cola prompt gerado pelo Projeto Claude]

AGENTE: [Implementa Task 1]
        [Testa]

TU: [Valida]
    ✅ OK → Chat NOVO para Task 2
```

#### No IDE (Agente) - Task 2:
```
TU: [NOVO CHAT]
    [Cola prompt para Task 2]

AGENTE: [Implementa Task 2]

[... repete até Task 4]
```

**💡 TIP**: **1 chat = 1 task** para refactors complexos. Mantém foco.

---

### 6.3 Exemplo: Bug Urgente

**Situação**: Viewer 2D parou de renderizar após última alteração.

**Fluxo**:

#### Diagnóstico (TU):
```bash
# Abre browser, console (F12)
# Procura erro JavaScript

# Erro encontrado: "Cannot read property 'layers' of undefined"
# Causa: actionsData vazio
```

#### No IDE (Agente):
```
TU: [CONTINUA chat anterior OU chat novo]

"Bug: Viewer 2D não renderiza. Erro na console:
'Cannot read property layers of undefined'

Causa provável: actionsData não está a ser inicializado.

Fix: Garante que addFloor() cria actionsData com estrutura:
{ editorScale: 1.0, layers: { lajes: {shapes:[]}, sobrecargas: {shapes:[]}, rcp: {shapes:[]} } }"

AGENTE: [Fix + testa]
```

---

## 7. GESTÃO DO PROJETO CLAUDE

### 7.1 Quando Usar o Projeto Claude

| Situação | Usar Projeto Claude? |
|----------|---------------------|
| **Brainstorming** de soluções | ✅ SIM |
| **Decisão estratégica** (stack, arquitectura) | ✅ SIM |
| **Plano de implementação** (tasks ordenadas) | ✅ SIM |
| **Troubleshooting conceptual** (ex: "Porquê X falha?") | ✅ SIM |
| **Escrever código** | ❌ NÃO (usa agente IDE) |
| **Testar funcionalidades** | ❌ NÃO (fazes tu) |

---

### 7.2 Como Estruturar Conversas no Projeto

#### Conversas Dedicadas por Fase

Cria chats separados para cada Fase do Roadmap:

```
📁 Projeto Claude: "SSOT - Diretor Estratégico"
  ├─ 💬 "Fase 1: Limpeza v9→v9.1" (concluído)
  ├─ 💬 "Fase 2: Multi-Projeto - Planeamento"
  ├─ 💬 "Fase 2: Multi-Projeto - Troubleshooting"
  └─ 💬 "Fase 3: Firebase - Decisão de Stack"
```

**Vantagem**: Histórico focado, fácil retomar contexto.

---

### 7.3 Actualizar Knowledge Base

**Quando?**
- Após cada incremento de versão (vX → vY)
- Quando documentação muda significativamente

**Como?**
```
1. Vai ao Projeto Claude
2. Settings → Knowledge
3. Remove ficheiros antigos (ex: AGENTE_RISCOS.md)
4. Anexa ficheiros novos (ex: AGENTE_RISCOS_v2.md)
```

---

## 8. BOAS PRÁTICAS (Lições Aprendidas)

### 8.1 DOs

✅ **Sê específico** nos prompts (exemplos concretos ajudam)
✅ **Divide tarefas complexas** em sub-tarefas pequenas
✅ **Valida sempre** com checklist (não assumes que funciona)
✅ **Cria backups** antes de alterações grandes
✅ **Documenta imediatamente** (não deixes para depois)
✅ **1 chat = 1 tarefa** (ou feature relacionada)

---

### 8.2 DON'Ts

❌ **NÃO digas** "faz como achares melhor" (agente precisa direcção)
❌ **NÃO faças** 10 pedidos diferentes num só chat (agente baralha-se)
❌ **NÃO assumes** que agente leu os docs (reforça no prompt)
❌ **NÃO deixes** chat com >20 mensagens (cria novo)
❌ **NÃO saltas** testes (bugs acumulam-se)
❌ **NÃO commitas** sem validar (podes partir prod)

---

## 9. COMANDOS ÚTEIS (Cheat Sheet)

### 9.1 Git (Gestão de Versões)

```bash
# Criar backup antes de alteração
git commit -am "checkpoint: antes de [tarefa]"

# Reverter alteração
git checkout Index_v9.html

# Ver histórico
git log --oneline

# Criar tag de versão
git tag v9.1
git push --tags
```

---

### 9.2 Browser (Diagnóstico)

```javascript
// Validar estrutura de projectData
console.log(projectData);

// Validar IDs serializados
const data = collectAllData();
console.log(Object.keys(data));

// Testar cálculo EC1
const cat = getUsoCategoryData('B');
console.log(cat);  // { qk: 3.0, psi0: 0.7, ... }

// Diagnosticar Viewer 2D
const floor = projectData.floors[0];
console.log(floor.actionsData);
```

---

### 9.3 IDE (Busca Rápida)

```bash
# Procurar ID no código
grep -n 'id="cliente"' Index_v9.html

# Procurar função
grep -n 'function collectAllData' Index_v9.html

# Procurar listener
grep -n 'addEventListener.*geo_tipo_sismo' Index_v9.html

# Contar linhas
wc -l Index_v9.html
```

---

## 10. QUANDO PEDIR AJUDA

### 10.1 Sinais de que Deves Parar

🛑 **Pára e pede ajuda se**:
- Agente sugeriu apagar função listada em `AGENTE_RISCOS_v2.md`
- Import JSON deixou de funcionar e não sabes porquê
- Viewer 2D dá erro que não consegues diagnosticar
- Fizeste >3 tentativas de fix sem sucesso
- Estás a "tentar coisas" sem plano

---

### 10.2 Onde Pedir Ajuda

| Problema | Onde? |
|----------|-------|
| **Decisão estratégica** | Projeto Claude (brainstorming) |
| **Bug técnico** | Projeto Claude (troubleshooting) |
| **Agente baralhado** | Este manual (Secção 4) |
| **Erro desconhecido** | Google + Stack Overflow |
| **Emergência** | Restaura backup + recomeça |

---

## 11. CHECKLIST SEMANAL (Manutenção)

```markdown
## Todas as Semanas

- [ ] Fazer backup manual do projeto (zip completo)
- [ ] Validar que testes continuam a passar
- [ ] Limpar chats antigos (IDE e Projeto Claude)
- [ ] Rever `@AGENTE_MIGRACAO.md` (histórico actualizado?)
- [ ] Testar com JSON real de projeto JSJ
```

---

## 12. RECURSOS ADICIONAIS

### 12.1 Documentação de Referência

- **Eurocódigos**: Assumes que conheces (não coberto aqui)
- **JavaScript**: [MDN Web Docs](https://developer.mozilla.org)
- **Chart.js**: [chartjs.org/docs](https://chartjs.org/docs)
- **Firebase** (Fase 3): [firebase.google.com/docs](https://firebase.google.com/docs)

---

### 12.2 Ferramentas Recomendadas

| Ferramenta | Para quê | Custo |
|------------|----------|-------|
| **Claude Code** | Agente IDE (Terminal) | Grátis (com limite) |
| **Cursor** | Agente IDE (VSCode fork) | €20/mês |
| **Windsurf** | Agente IDE (alternativa) | Grátis/Pago |
| **Git** | Controlo de versões | Grátis |
| **GitHub/GitLab** | Hosting remoto | Grátis |

---

## 13. CONCLUSÃO

### O Que Aprendeste

✅ Como estruturar prompts eficazes para agentes
✅ Quando criar chat novo vs continuar
✅ Como diagnosticar problemas comuns
✅ Como usar Projeto Claude para estratégia
✅ Como usar agentes IDE para implementação
✅ Como validar alterações com checklists

### Próximos Passos

1. ✅ **Agora**: Limpeza v9→v9.1 (usa `PROMPT_LIMPEZA_v9.md`)
2. ⏭️ **Depois**: Fase 2 do Roadmap (Multi-Projeto)
3. 🎯 **Meta**: Aplicação cloud com multi-projetos (Fase 3)

---

**BOA SORTE! 🚀**

Se tiveres dúvidas, consulta este manual ou pergunta no Projeto Claude.

---

*Última actualização: 12/02/2026*
*Versão: 1.0*
