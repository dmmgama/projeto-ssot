# 🧪 GUIA DE TESTES E VALIDAÇÃO

**Objectivo**: Checklist de validação obrigatória após qualquer alteração no código base.

---

## 1. TESTES DE REGRESSÃO OBRIGATÓRIOS

### 1.1 Teste de Persistência (IO)

**Quando executar**: Após QUALQUER alteração em:
- `collectAllData()`
- `loadAllData()`
- IDs de inputs HTML
- Estrutura de `projectData`

**Procedimento**:
```
1. Abre Index_v9.html no browser
2. Preenche dados mínimos:
   - Secção 1: ID JSJ, Nome
   - Secção 2: Adiciona 1 piso + 1 zona
   - Secção 5: Preenche geo_tipo_sismo
3. Clica "Exportar Dados" → salva backup_teste.json
4. Recarrega página (F5)
5. Clica "Importar Dados" → carrega backup_teste.json
6. VALIDA:
   ✅ Secção 1: Campos preenchidos
   ✅ Secção 2: Piso e zona aparecem
   ✅ Secção 5: geo_tipo_sismo mantém valor
   ✅ Console: 0 erros JavaScript
```

**Critério de Sucesso**:
- Todos os dados importados são idênticos aos exportados
- Nenhum erro na console do browser

---

### 1.2 Teste de Cálculo (EC1)

**Quando executar**: Após alteração em:
- `renderZoneActions()`
- `getUsoCategoryData()`
- `FloorViewer.calculatePointELU()`
- Campo `zone.uso`

**Procedimento**:
```
1. Abre Index_v9.html
2. Secção 2:
   - Adiciona Piso 0
   - Adiciona Zona A (Uso: "B", Tipo Laje: "Maciça", Esp: 0.25m)
3. Secção 7 → Aba "Gravíticas"
4. Selecciona Piso 0 / Zona A
5. VALIDA Tabela Analítica:
   ✅ qk = 3.0 kN/m² (Categoria B)
   ✅ Laje = 0.25 × 25 = 6.25 kN/m²
   ✅ RCP existe (mesmo que 0)
   ✅ Combinação ELU apresenta valor
```

**Valores Esperados (Categoria B)**:
```
qk = 3.0 kN/m²
ψ0 = 0.7
ψ1 = 0.5
ψ2 = 0.3
```

---

### 1.3 Teste de Editor Gráfico (postMessage)

**Quando executar**: Após alteração em:
- Estrutura `actionsData`
- Função `openZonesEditor()`
- Listener `window.addEventListener('message')`
- Classe `FloorViewer`

**Procedimento**:
```
1. Abre Index_v9.html
2. Secção 2: Adiciona Piso 0 com imagem (qualquer PNG)
3. Secção 7 → Aba "Gravíticas"
4. Clica "Editor de Zonas" (abre popup)
5. Em zonas.html:
   - Desenha 1 polígono (camada Lajes, espessura 0.25)
   - Clica "Enviar Dados para Index"
6. Volta ao Index_v9.html
7. VALIDA Viewer 2D:
   ✅ Polígono aparece no canvas
   ✅ Modo "Heatmap ELU" gera cores
   ✅ Modo "Sonda" mostra valor ao clicar
   ✅ Console: 0 erros
```

---

### 1.4 Teste de Ações Activadas (Toggles)

**Quando executar**: Após alteração em:
- Checkboxes `act_*`
- Função `toggleActionSection()`
- Função `updateActionsFloorTabs()`

**Procedimento**:
```
1. Abre Index_v9.html
2. Secção 2: Adiciona 1 piso
3. Secção 7:
   - Desmarca "Ação Sísmica" (checkbox)
   - VALIDA: Aba "Sismo" desaparece
   - Marca "Ação Sísmica"
   - VALIDA: Aba "Sismo" reaparece
4. Repete para Vento, Impulsos, etc.
```

---

### 1.5 Teste de Sync Geotécnico → Sismo

**Quando executar**: Após alteração em:
- ID `geo_tipo_sismo` ou `sismo_terreno`
- Listener entre estes campos

**Procedimento**:
```
1. Abre Index_v9.html
2. Secção 5 → Caracterização Geológica
3. Selecciona "Tipo Solo EC8": "A"
4. Vai à Secção 7 → Aba "Sismo"
5. VALIDA:
   ✅ Campo "Terreno" = "A" (copiado automaticamente)
6. Muda "Tipo Solo EC8" para "C"
7. VALIDA:
   ✅ Campo "Terreno" actualiza para "C"
```

---

## 2. TESTES DE INTEGRAÇÃO (Fluxo Completo)

### 2.1 Fluxo de Novo Projeto

**Duração**: ~5 min

```
1. Abre Index_v9.html (página limpa)
2. Secção 1:
   - ID JSJ: 999
   - Nome: "Teste Integração"
   - Cliente: "Cliente Teste"
   - Tipologia: Habitação
3. Secção 2:
   - Adiciona Piso 0 (Cota 0.00, Área 100m²)
   - Adiciona Zona A (Uso B, Laje Maciça 0.25m)
4. Secção 5:
   - Tipo Solo EC8: B
   - σadm: 200 kPa
5. Secção 7:
   - Activa "Ação Sísmica"
   - Zona: 1.3, q: 3.0, Amortecimento: 5%
6. Clica "Exportar Dados"
7. Recarrega página
8. Clica "Importar Dados"
9. VALIDA:
   ✅ Todas as secções mantêm dados
   ✅ KPIs actualizam (Nº Pisos = 1)
   ✅ Gráfico sísmico gera (Secção 7)
```

---

### 2.2 Fluxo de Edição de Projecto Existente

**Pré-requisito**: JSON de projeto real (ex: backup_v9_completo.json)

```
1. Importa JSON existente
2. Adiciona novo piso (Piso 1)
3. Edita zona existente (muda Uso de B para E)
4. Exporta JSON
5. Recarrega
6. Importa novo JSON
7. VALIDA:
   ✅ Piso novo aparece
   ✅ Zona editada tem novo Uso
   ✅ Cálculos EC1 usam novo qk (Categoria E)
```

---

## 3. FIXTURES DE TESTE (JSONs de Referência)

### 3.1 backup_v9_minimal.json
**Conteúdo**: 1 piso, 1 zona, campos mínimos preenchidos
**Uso**: Teste rápido de IO (< 1 min)

### 3.2 backup_v9_completo.json
**Conteúdo**: Projeto real JSJ com múltiplos pisos/zonas
**Uso**: Teste exaustivo de compatibilidade

### 3.3 Como criar fixtures:
```
1. Preenche manualmente um projeto (minimal ou completo)
2. Exporta JSON
3. Salva em /docs/fixtures/
4. Usa para testes automatizados
```

---

## 4. COMANDOS DE VALIDAÇÃO AUTOMÁTICA

### 4.1 Diagnóstico Rápido (Console do Browser)

Após importar JSON, cola na console:
```javascript
// Validação de Estado
const diagnostics = {
  floors: projectData.floors.length,
  zones: projectData.floors.reduce((sum, f) => sum + f.zones.length, 0),
  geoHorizons: projectData.geoHorizons.length,
  actionsEnabled: Object.keys(document.querySelectorAll('[id^="act_"]:checked'))
    .map(cb => cb.id.replace('act_', ''))
};
console.table(diagnostics);

// Output Esperado (exemplo):
// ┌─────────────────┬───────┐
// │     (index)     │ Values│
// ├─────────────────┼───────┤
// │ floors          │   3   │
// │ zones           │   5   │
// │ geoHorizons     │   2   │
// │ actionsEnabled  │ [...] │
// └─────────────────┴───────┘
```

### 4.2 Verificação de IDs Órfãos
```javascript
// Cola na console após importar JSON
const data = collectAllData();
const missingIds = Object.keys(data).filter(key => 
  key !== 'projectData' && !document.getElementById(key)
);
console.log('IDs no JSON mas não no DOM:', missingIds);
// Output esperado: [] (array vazio)
```

---

## 5. CHECKLIST DE QUALIDADE (Pós-Alteração)

### 5.1 Antes de Commitar

- [ ] **Teste IO**: Import/Export funciona
- [ ] **Teste Visual**: Abre no browser, sem erros console
- [ ] **Teste Cálculo**: Valores EC1 corretos (se aplicável)
- [ ] **Teste Gráfico**: Canvas renderiza (se aplicável)
- [ ] **Teste Compatibilidade**: JSON antigo carrega (se mudou estrutura)
- [ ] **Documentação**: Actualizado `HISTORICO.md`
- [ ] **Documentação**: Actualizado `CODIGO_PROTEGIDO.md` (se adicionou IDs/funções críticas)

### 5.2 Antes de Incrementar Versão (vX → vY)

- [ ] Todos os testes acima ✅
- [ ] Testado com ≥3 JSONs diferentes (minimal + completo + edge case)
- [ ] Viewer 2D testado com polígonos complexos
- [ ] Relatório Markdown gera sem erros
- [ ] Gráficos sísmicos renderizam (Chart.js)
- [ ] Criada entrada em `HISTORICO.md` com changelog

---

## 6. TESTES DE EDGE CASES (Opcional mas Recomendado)

### 6.1 Valores Extremos
```
- Piso com cota -50.00m (subsolo profundo)
- Zona com área 0.01m² (mínimo)
- Laje com espessura 1.50m (máximo)
- qk = 10.0 kN/m² (Categoria E)
```

### 6.2 Stress Test
```
- 20 pisos
- 10 zonas por piso
- JSON > 500KB
- Valida: Performance de renderização < 3s
```

### 6.3 Dados Corruptos
```
- JSON com campo faltando (ex: sem "floors")
- JSON com tipo errado (ex: cota = "abc")
- JSON de versão antiga (v1-v8)
- Valida: App não quebra, mostra erro graceful
```

---

## 7. TROUBLESHOOTING (Problemas Comuns)

### 7.1 "Dados não carregam após import"
**Causa**: ID mudou ou `loadAllData()` não processa campo
**Fix**: Verifica console → procura erro → valida ID no HTML

### 7.2 "Canvas fica em branco"
**Causa**: `actionsData` vazio ou estrutura incorrecta
**Fix**: Valida `floor.actionsData.layers` existe → abre zonas.html e reenvia dados

### 7.3 "Cálculos EC1 errados"
**Causa**: Duplicação de lógica dessincronizada
**Fix**: Compara `getUsoCategoryData()` com `FloorViewer.calculatePointELU()`

### 7.4 "Gráfico sísmico não gera"
**Causa**: Chart.js não carregou ou parâmetros inválidos
**Fix**: Verifica console → valida CDN Chart.js → testa com parâmetros default

---

## 8. AUTOMAÇÃO (Futuro)

### 8.1 Script de Testes (Node.js + Puppeteer)
```javascript
// TODO: Implementar quando migrar para framework
// Testa automaticamente:
// - Import/Export de 10 JSONs
// - Screenshots do Viewer 2D
// - Validação de cálculos
```

---

*Última actualização: 12/02/2026 (v9.0)*
