# 🧪 TESTE: actionsData Persistence
**Versão**: 10.2  
**Bug Original**: actionsData não persiste após reload  
**Status**: ✅ CORRIGIDO

---

## 🔧 CORREÇÕES IMPLEMENTADAS

### 1. PostMessage Handler (Index_v10.1.html)
```javascript
// ANTES: Apenas atribuía dados, não salvava
floor.actionsData = zonesData;
showStatus('Zonamento atualizado com sucesso!', 'ok');

// DEPOIS: Força save + validação
floor.actionsData = zonesData;
saveCurrentProject();  // ← CRÍTICO
const saved = JSON.parse(localStorage.getItem('ssot_projects'));
console.log('actionsData guardado:', saved[...].floors[pisoId]?.actionsData);
showStatus('Zonamento atualizado e guardado com sucesso!', 'ok');
```

### 2. Serialização (shared.js)
```javascript
// Já estava correto com spread operator
serialized[projectId].floors[fId] = {
  ...floor,  // ← Copia actionsData
  zones: {}
};

// Adicionado log de debug
if (floor.actionsData) {
  console.log(`Floor ${fId} serializado com actionsData`);
}
```

### 3. Desserialização (shared.js)
```javascript
// Já estava correto com spread operator
projects[projectId].floors.set(fId, {
  ...floor,  // ← Reconstrói actionsData
  zones: zonesMap
});

// Adicionado log de debug
if (floor.actionsData) {
  console.log(`Floor ${fId} tem actionsData com ${layers} layers`);
}
```

### 4. Validação ao Carregar (Index_v10.1.html)
```javascript
// DOMContentLoaded: Log de validação
for (const [fId, floor] of appState.activeProject.floors.entries()) {
  console.log(`Floor ${floor.name}:`, {
    hasActionsData: !!floor.actionsData,
    layersCount: Object.keys(floor.actionsData?.layers || {}).length
  });
}
```

---

## ✅ TESTE MANUAL COMPLETO

### Passo 1: Preparação
1. Abrir projeto existente ou criar novo
2. Adicionar pelo menos 1 piso (Secção 4)
3. Abrir DevTools (F12) → Console

### Passo 2: Criar Zonamento
1. Secção 7 → Selecionar piso
2. Clicar **"Abrir Editor de Zonas"**
3. Em `zonas.html`:
   - Desenhar 1+ polígonos
   - Clicar **"Enviar para Index"**
4. Verificar console:
   ```
   === postMessage DEBUG ===
   actionsData recebido: {layers: {...}}
   actionsData guardado em localStorage: {layers: {...}}
   actionsData guardado OK? true
   ```

### Passo 3: Validar Visualização Imediata
1. Voltar para Index
2. Secção 7 → Modo "Estrutura"
3. ✅ Polígonos aparecem no canvas

### Passo 4: Testar Persistência
1. Clicar **"Voltar ao Lobby"**
2. Reabrir o projeto
3. Verificar console ao carregar:
   ```
   [loadProjectsFromStorage] Floor <uuid> tem actionsData com N layers
   === DEBUG: Validação actionsData ao carregar ===
   Floor Piso 0 (<uuid>): {hasActionsData: true, layersCount: N}
   ```

### Passo 5: Validar Visualização Após Reload
1. Secção 7 → Selecionar piso
2. Modo "Estrutura"
3. ✅ **Polígonos aparecem** (dados persistiram!)

---

## 🔍 DEBUGGING CHECKLIST

Se actionsData **NÃO** aparecer após reload:

### Debug 1: Verificar postMessage
```javascript
// Console após enviar de zonas.html
✅ "actionsData recebido: {layers: {...}}"
✅ "actionsData guardado OK? true"
```
❌ Se false → `saveCurrentProject()` falhou

### Debug 2: Verificar localStorage
```javascript
// Console
const saved = JSON.parse(localStorage.getItem('ssot_projects'));
console.log(saved[projectId].floors);
// Deve mostrar: { 'uuid-floor': { ..., actionsData: {layers: {...}} } }
```
❌ Se actionsData undefined → Serialização falhou

### Debug 3: Verificar Desserialização
```javascript
// Console ao recarregar (DOMContentLoaded)
✅ "[loadProjectsFromStorage] Floor ... tem actionsData com N layers"
✅ "Floor Piso 0: {hasActionsData: true, layersCount: N}"
```
❌ Se false → Desserialização falhou

### Debug 4: Verificar Estrutura
```javascript
// Console
const floor = appState.activeProject.floors.get('<uuid>');
console.log(floor.actionsData);
// Deve mostrar: {layers: {<layer-uuid>: {...}, ...}}
```
❌ Se undefined → Dados não carregados no appState

---

## 🐛 POSSÍVEIS PROBLEMAS

### Problema 1: actionsData é undefined após postMessage
**Causa**: `saveCurrentProject()` não foi chamado  
**Fix**: Verificar linha 3164 do Index_v10.1.html

### Problema 2: actionsData presente no appState mas não em localStorage
**Causa**: `saveProjectsToStorage()` não copia actionsData  
**Fix**: Spread operator `...floor` deve estar presente (linha 45 shared.js)

### Problema 3: actionsData em localStorage mas não carrega
**Causa**: `loadProjectsFromStorage()` não reconstrói actionsData  
**Fix**: Spread operator `...floor` deve estar presente (linha 111 shared.js)

### Problema 4: actionsData carrega mas desaparece ao mudar seção
**Causa**: Proxy `projectData` não reflete mudanças  
**Fix**: Não aplicável - usamos `appState.activeProject` diretamente

---

## 📊 RESULTADO ESPERADO

### Console ao Enviar de zonas.html:
```
=== postMessage DEBUG ===
pisoId: a1b2c3d4-...
actionsData recebido: {layers: {uuid1: {type: 'polygon', ...}, ...}}
Zones Count: 3
[saveProjectsToStorage] Floor a1b2c3d4 serializado com actionsData: 3 layers
actionsData guardado em localStorage: {layers: {...}}
actionsData guardado OK? true
Zonamento atualizado e guardado com sucesso!
```

### Console ao Recarregar Projeto:
```
[loadProjectsFromStorage] Floor a1b2c3d4 tem actionsData com 3 layers
=== DEBUG: Validação actionsData ao carregar ===
Floor Piso 0 (a1b2c3d4-...): {hasActionsData: true, layersCount: 3}
[Index_v10.1.html] Projeto carregado: project-uuid
```

### UI após Reload:
- Secção 7 → Modo "Estrutura" → ✅ Polígonos aparecem
- Console não mostra erros
- Status: "Zonamento atualizado e guardado com sucesso!" (verde)

---

## ✅ VALIDAÇÃO TÉCNICA

### Fluxo Correto:
```
zonas.html (desenhar) 
  → postMessage 
  → Index: floor.actionsData = data
  → saveCurrentProject()
  → saveProjectsToStorage() com {...floor}
  → localStorage.setItem()
  ✓ GUARDADO

Reload página
  → loadProjectsFromStorage()
  → JSON.parse()
  → {...floor} reconstrói actionsData
  → floors.set(id, {...floor, zones: Map})
  ✓ CARREGADO

Secção 7 → Modo Estrutura
  → floorViewer.loadData(floor.actionsData)
  → render()
  ✓ VISUALIZADO
```

---

## 📝 NOTAS FINAIS

1. **actionsData** é propriedade do floor, não do projeto
2. **Spread operator** (`...floor`) preserva todas as propriedades
3. **saveCurrentProject()** deve ser chamado após **QUALQUER** modificação
4. **localStorage** tem limite de ~5MB - considerar compressão para projetos grandes
5. **Maps** (floors, zones) são serializadas mas **actionsData** é objeto puro (OK)

---

**Teste Completo**: ✅ PRONTO PARA EXECUTAR  
**Data**: 2026-02-13  
**Versão**: 10.2
