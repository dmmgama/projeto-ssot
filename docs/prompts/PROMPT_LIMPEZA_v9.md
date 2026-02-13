# PROMPT: Limpeza de Código (v9.0 → v9.1)

**COPIAR E COLAR NO AGENTE DE CÓDIGO (Claude Code, Cursor, Windsurf)**

---

```markdown
# TASK: Limpeza de Código Morto (v9.0 → v9.1)

## CONTEXTO
Ficheiro: `Index_v9.html` (3828 linhas, webapp standalone)
Objetivo: Remover HTML/JS/CSS não utilizado mantendo funcionalidade intacta

## PROTOCOLO OBRIGATÓRIO DE INICIALIZAÇÃO

**ANTES de qualquer acção, lê OBRIGATORIAMENTE nesta ordem:**

1. `docs/@AGENTE_MASTER.md` (Protocolo de boot + Princípios SSOT)
2. `docs/@AGENTE_ARQUITETURA.md` (Estrutura projectData + Ciclo de vida)
3. `docs/AGENTE_RISCOS_v2.md` (Tabela de IDs/funções protegidas - 168 IDs catalogados)
4. `docs/AGENTE_TESTES.md` (Casos de teste obrigatórios)

**Após leitura, confirma:**
- ✅ Entendeste a estrutura do objeto `projectData`
- ✅ Identificaste os 168 IDs protegidos (Secções 1-8)
- ✅ Memorizaste as funções críticas (collectAllData, loadAllData, FloorViewer, etc)
- ✅ Compreendeste o fluxo postMessage (Index ↔ zonas.html)

---

## FASE 1: AUDITORIA (Output: Lista de Candidatos)

### Objectivo
Gera ficheiro `AUDIT_v9.md` com lista de elementos a remover, classificados por confiança.

### Metodologia

#### A) HTML - Candidatos a Remoção
Para cada `<input>`, `<select>`, `<textarea>` com `id`:

1. **Busca ID em AGENTE_RISCOS_v2.md**
   - Se listado → **PROTEGIDO** (não tocar)
   
2. **Busca ID em collectAllData()** (linha ~2605)
   - Procura por: `document.getElementById('ID')`
   - Se não encontrado → Candidato

3. **Busca ID em loadAllData()** (linha ~2615)
   - Se não encontrado → Reforça candidatura

4. **Busca global no ficheiro**
   - Procura string "ID" (ex: `'id_jsj'`, `"id_jsj"`)
   - Se 0 resultados → **Alta Confiança**
   - Se 1-2 resultados só em comentários → **Média Confiança**
   - Se >2 resultados → **Baixa Confiança** (investigar)

#### B) JavaScript - Funções Órfãs
Para cada `function nomeFuncao()`:

1. **Busca função em AGENTE_RISCOS_v2.md (Secção 3)**
   - Se listada → **PROTEGIDA** (não tocar)
   
2. **Busca callers**
   - Procura: `nomeFuncao(` no código
   - Conta ocorrências (excluir a própria declaração)
   
3. **Valida event handlers inline**
   - Procura: `onclick="nomeFuncao"`, `onchange="nomeFuncao"`
   
4. **Classifica**:
   - 0 callers + não é handler → **Alta Confiança**
   - 1-2 callers suspeitos → **Média Confiança**
   - >2 callers ou é método de classe → **Baixa Confiança**

**EXCEÇÕES - NUNCA considerar órfãs**:
- Funções dentro de classes (`FloorViewer.metodo`)
- Callbacks de `postMessage`
- Funções globais listadas em AGENTE_RISCOS_v2.md (Secção 3)

#### C) CSS - Classes Não Usadas
Para cada `.className` em CSS:

1. **Busca no HTML**
   - Procura: `class="className"`
   
2. **Busca em JS**
   - Procura: `.classList.add('className')`
   - Procura: `.className =`
   
3. **Classifica**:
   - 0 ocorrências → **Alta Confiança**
   - 1-2 ocorrências → **Média Confiança**
   - >2 ocorrências → Manter

### Output: AUDIT_v9.md

Gera ficheiro com esta estrutura:

```markdown
# AUDITORIA DE LIMPEZA v9.0 → v9.1

Data: 12/02/2026
Total de IDs no HTML: 168 (catalogados em AGENTE_RISCOS_v2.md)
Linhas actuais: 3828

---

## HTML - Candidatos a Remoção

### Alta Confiança (Remover com segurança)
- `id="exemplo_antigo"` - Linha XXX - Não usado em collectAllData/loadAllData/código

### Média Confiança (Investigar)
- `id="campo_suspeito"` - Linha YYY - Usado apenas em comentário

### Baixa Confiança (NÃO TOCAR sem validação)
- `id="geo_tipo_sismo"` - **PROTEGIDO** (AGENTE_RISCOS_v2.md - Listener crítico)

---

## JavaScript - Funções Órfãs

### Alta Confiança
- `function funcaoAntiga()` - Linha XXX - 0 callers

### Média Confiança
- `function duvidosa()` - Linha YYY - 1 caller em comentário

### Baixa Confiança (NÃO TOCAR)
- `function collectAllData()` - **PROTEGIDA** (IO crítico)

---

## CSS - Classes Não Usadas

### Alta Confiança
- `.classe-antiga` - 0 ocorrências no HTML/JS

---

## SUMMARY
- HTML a remover: X IDs
- JS a remover: Y funções
- CSS a remover: Z classes
- Linhas estimadas a poupar: ~N
```

**STOP AQUI**: Envia `AUDIT_v9.md` para aprovação antes de FASE 2.

---

## FASE 2: REMOÇÃO CIRÚRGICA (Após Aprovação)

### Protocolo de Segurança

Para cada item aprovado:

#### 1. BACKUP
```bash
# Cria cópia de segurança ANTES de alterar
cp Index_v9.html Index_v9_BACKUP_$(date +%Y%m%d_%H%M%S).html
```

#### 2. REMOVE

**HTML**:
```html
<!-- Remove tag completa -->
<div class="card">
  <label>Campo Antigo</label>
  <input id="campo_antigo" />  <!-- REMOVE ISTO -->
</div>
```

**JavaScript**:
```javascript
// Remove função completa
function funcaoAntiga() {  // REMOVE daqui
  // ...
}  // até aqui
```

**CSS**:
```css
/* Remove classe */
.classe-antiga {  /* REMOVE */
  color: red;
}
```

#### 3. TESTA IMEDIATAMENTE

**Após cada remoção**:
```
1. Abre Index_v9.html no browser
2. Abre Console (F12)
3. VALIDA:
   ✅ 0 erros JavaScript
   ✅ Página renderiza normalmente
4. Clica "Importar Dados"
5. Carrega backup_v9_minimal.json (fixture)
6. VALIDA:
   ✅ Dados carregam
   ✅ Secções 1-7 funcionais
```

#### 4. SE FALHA → REVERTE
```bash
# Restaura backup imediatamente
mv Index_v9_BACKUP_*.html Index_v9.html
```

#### 5. SE OK → COMMIT
```bash
git add Index_v9.html
git commit -m "Remove [item]: validado com testes IO"
```

### Ordem de Remoção Recomendada

1. **CSS** (menos risco)
2. **HTML comentado** (0 risco)
3. **HTML órfão** (risco médio - testar bem)
4. **JS funções órfãs** (risco alto - testar exaustivamente)

**NUNCA remover múltiplos elementos de uma vez** - trabalha item a item.

---

## FASE 3: REGISTO (Obrigatório)

### Actualização de Documentação

#### A) Actualiza `docs/@AGENTE_MIGRACAO.md`

Adiciona entrada:

```markdown
### [v9.0 -> v9.1] - 12/02/2026
**Autor:** [Claude Code / Nome do Agente]
**Resumo:** Limpeza de código morto pré-Fase 2 (Roadmap)

**Removido:**
- HTML: [lista IDs removidos]
- JS: [lista funções removidas]
- CSS: [lista classes removidas]
- Total linhas: 3828 → XXXX (-YYY)

**Alterações Arquitecturais:**
- Nenhuma (limpeza apenas)

**Validação:**
- ✅ Teste IO: Import/Export backup_v9_minimal.json
- ✅ Teste Cálculo: Categoria B → qk=3.0
- ✅ Teste Gráfico: Viewer 2D renderiza
- ✅ Console: 0 erros

**Compatibilidade:**
- ✅ JSONs v9.0 continuam a funcionar
```

#### B) OPCIONAL: Actualiza `docs/AGENTE_RISCOS_v2.md`

**Apenas se removeste IDs/funções que estavam documentados** (improvável, pois são protegidos).

---

## RESTRIÇÕES CRÍTICAS (Red Flags)

### Do `AGENTE_RISCOS_v2.md` - NÃO TOCAR:

#### IDs HTML Intocáveis
```
# Secção 1
id_jsj, nome_projeto, cliente, designacao, localizacao
tipologia, especialidade, tipo_obra, fase_atual
fase_*_data, fase_*_estado
resp_tecnico, equipa_eng, bim, gestao_projeto, etc.

# Secção 5 - CRÍTICOS
geo_tipo_sismo          # 🔥 Tem listener para sismo_terreno!
sismo_terreno           # 🔥 Recebe de geo_tipo_sismo!

# Secção 7
act_sismo, act_vento, etc.   # Toggles de acções
sismo_zona, sismo_terreno, sismo_imp, sismo_q, sismo_amort

# KPIs
kpiID, kpiNome, kpiFase, kpiImplant, kpiABC, kpiPisos, kpiAltura
```

#### Funções JavaScript Intocáveis
```javascript
// Estado
initializeProjectData()
collectAllData()
loadAllData()

// UI Dinâmica
addFloor(), renderFloors(), deleteFloor()
addZone(), saveZone(), deleteZone()
updateActionsFloorTabs()

// Cálculo
renderZoneActions()
getUsoCategoryData()
generateSeismicCharts()

// Motor Gráfico
class FloorViewer { ... }  // Classe completa
openZonesEditor()

// IO
exportJSON()
importJSON()
```

#### Event Listeners Intocáveis
```javascript
// Sync Geo → Sismo
document.getElementById('geo_tipo_sismo')?.addEventListener('change', ...)

// postMessage
window.addEventListener('message', ...)

// Canvas
this.canvas.addEventListener('click', ...)
```

---

## TESTES DE REGRESSÃO (Obrigatórios Após FASE 2)

### Checklist Mínima

Execute **TODOS** estes testes antes de considerar concluído:

#### 1. Teste de Persistência
```
[ ] Exporta JSON de projeto preenchido
[ ] Recarrega página (F5)
[ ] Importa JSON
[ ] Valida: Secções 1-7 idênticas
[ ] Console: 0 erros
```

#### 2. Teste de Cálculo
```
[ ] Cria Zona com Uso "B"
[ ] Valida Tabela Analítica: qk = 3.0 kN/m²
[ ] Valida: Combinação ELU apresenta valor
```

#### 3. Teste Gráfico (SE zonas.html disponível)
```
[ ] Abre Editor de Zonas
[ ] Desenha 1 polígono
[ ] Envia para Index
[ ] Valida: Polígono aparece no Viewer 2D
[ ] Modo Heatmap gera cores
```

#### 4. Teste de Sync Geotécnico
```
[ ] Secção 5: Selecciona geo_tipo_sismo = "A"
[ ] Secção 7: Valida sismo_terreno = "A"
[ ] Muda para "C"
[ ] Valida actualização automática
```

Ver `docs/AGENTE_TESTES.md` para testes completos.

---

## STOP CONDITIONS (Quando Parar e Pedir Ajuda)

Se encontrares:

❌ **Função com nome ambíguo** (não sabes se é usada)
   → **COMENTA** com `// TODO: validar remoção`, não apagues

❌ **ID referenciado em string dinâmica** (ex: `getElementById(varName)`)
   → **MANTÉM**, marca como `// PROTEGIDO: referência dinâmica`

❌ **Código suspeito mas sem certeza**
   → **MARCA** com `// SUSPEITO: investigar`, não remover

❌ **Teste de regressão FAIL**
   → **REVERTE** imediatamente, investiga causa

❌ **>3 items falharam testes**
   → **STOP**, reporta problema, aguarda validação manual

**PRINCÍPIO**: Em caso de dúvida, **NÃO REMOVER**. É melhor deixar código morto que quebrar funcionalidade.

---

## DELIVERABLES FINAIS

Após concluir FASE 2 + FASE 3:

1. ✅ `Index_v9.html` (limpo, testado)
2. ✅ `AUDIT_v9.md` (lista do que foi removido)
3. ✅ `docs/@AGENTE_MIGRACAO.md` (entrada v9.0→v9.1)
4. ✅ Backups em `/backups/Index_v9_BACKUP_*.html`
5. ✅ Relatório de testes (✅ PASS ou ❌ FAIL com detalhes)

---

## EXEMPLO DE OUTPUT ESPERADO

**Antes**:
```
Index_v9.html: 3828 linhas
```

**Depois**:
```
Index_v9.html: ~3400-3600 linhas (-200 a -400)
+ AUDIT_v9.md (documentação do que foi removido)
+ Testes: ✅ PASS
+ AGENTE_MIGRACAO.md actualizado
```

---

**Confirma leitura dos 4 MDs obrigatórios antes de começar FASE 1.**

Se tiveres dúvidas sobre algum ID ou função, consulta `AGENTE_RISCOS_v2.md` ou pergunta antes de remover.
```

---

**NOTAS PARA O UTILIZADOR (David)**

Esta prompt está pronta para copiar e colar directamente no teu agente de código (Claude Code, Cursor, Windsurf, etc.).

**Como usar**:
1. Copia todo o bloco dentro das ` ```markdown ... ``` `
2. Cola no chat do agente
3. Agente lerá os MDs e começará FASE 1 (Auditoria)
4. Receberás `AUDIT_v9.md` para aprovares
5. Aprovas ou rejeitas itens
6. Agente executa FASE 2 (Remoção)
7. Agente executa FASE 3 (Registo)

**Duração estimada**: 
- FASE 1 (Auditoria): 10-15 min
- FASE 2 (Remoção): 30-60 min (depende de quantos items)
- FASE 3 (Registo): 5 min
- **Total**: ~1-1.5h
