# 🧪 GUIA DE TESTES E VALIDAÇÃO

**Versão:** v11.1 (Firebase Storage Layer)  
**Objectivo:** Checklist de validação obrigatória após qualquer alteração no código base.  
**Última Actualização:** 15/02/2026

---

## 1. TESTES DE REGRESSÃO OBRIGATÓRIOS

### 1.1 Teste de Persistência (IO)

**Quando executar:** Após alteração em `collectAllData()`, `loadAllData()`, IDs de inputs, estrutura de `projectData`.

```
1. Abre Index_v11.1.html no browser (autenticado)
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

---

### 1.2 Teste de Cálculo (EC1)

**Quando executar:** Após alteração em `renderZoneActions()`, `getUsoCategoryData()`, `FloorViewer.calculatePointELU()`, campo `zone.uso`.

```
1. Secção 2: Adiciona Piso 0, Zona A (Uso: "B", Laje Maciça, Esp: 0.25m)
2. Secção 7 → Aba "Gravíticas" → Selecciona Piso 0 / Zona A
3. VALIDA Tabela Analítica:
   ✅ qk = 3.0 kN/m² (Categoria B)
   ✅ Laje = 0.25 × 25 = 6.25 kN/m²
   ✅ RCP existe (mesmo que 0)
   ✅ Combinação ELU apresenta valor
```

Valores esperados Categoria B: `qk=3.0, ψ0=0.7, ψ1=0.5, ψ2=0.3`

---

### 1.3 Teste de Editor Gráfico (postMessage)

**Quando executar:** Após alteração em `actionsData`, `openZonesEditor()`, listener `message`, classe `FloorViewer`.

```
1. Secção 2: Adiciona Piso 0 com imagem (qualquer PNG)
2. Secção 7 → Clica "Editor de Zonas" (abre popup)
3. Em zonas.html: Desenha 1 polígono (camada Lajes, espessura 0.25)
4. Clica "Enviar Dados para Index"
5. VALIDA:
   ✅ Polígono aparece no canvas
   ✅ Modo "Heatmap ELU" gera cores
   ✅ Modo "Sonda" mostra valor ao clicar
   ✅ Console: 0 erros
```

---

### 1.4 Teste de Acções Activadas (Toggles)

```
1. Secção 2: Adiciona 1 piso
2. Secção 7: Desmarca "Sismo" → aba desaparece → Marca → reaparece
3. Repete para Vento, Impulsos, etc.
```

---

### 1.5 Teste de Sync Geotécnico → Sismo

```
1. Secção 5 → "Tipo Solo EC8": "A"
2. Secção 7 → Sismo → VALIDA: "Terreno" = "A"
3. Muda para "C" → VALIDA: actualiza para "C"
```

---

### 1.6 Teste Firebase Auth (v11.0)

**Quando executar:** Após alteração em `firebase-config.js`, `login.html`, `initEditor()`.

```
1. Sessão limpa (incognito) → login.html
2. Email NÃO @jsj.pt → VALIDA: Rejeitado
3. Email @jsj.pt → VALIDA: Redirige para lobby
4. Acesso directo a Index sem auth → VALIDA: Redirige para login
5. Logout → VALIDA: Volta a login
```

---

### 1.7 Teste Firebase Sync (v11.0)

**Quando executar:** Após alteração em `firebase-data.js`, `saveCurrentProject()`, `subscribeToProject()`.

```
1. Browser A: Abre projecto, Nome = "Teste Sync"
2. Aguarda auto-save (30s) ou volta ao lobby e reabre
3. Browser B: Abre mesmo projecto → VALIDA: "Teste Sync"
4. Browser B: Muda para "Sync OK"
5. Desfoca Browser A → VALIDA: Actualiza para "Sync OK"
```

---

### 1.8 Teste Nested Arrays (v11.0)

**Quando executar:** Após alteração em serialização ou `actionsData.layers[].shapes`.

```
1. Projecto com polígonos → Exporta JSON
2. Verifica: shapes é string (stringify), não array aninhado
3. Lobby → Reabre → VALIDA: Polígonos aparecem
4. Firestore Console → VALIDA: shapes é string
```

---

### 1.9 Teste Storage Upload (v11.1) 🆕

**Quando executar:** Após alteração em `uploadFloorImage()`, Storage Rules.

```
1. Secção 2: Adiciona Piso 0
2. Clica "Upload Imagem" → Selecciona PNG (500KB)
3. Aguarda upload (progress indicator aparece)
4. VALIDA:
   ✅ Firebase Console → Storage: blob em projects/{id}/floors/{id}/image.png
   ✅ Firestore: floor.imageURL = "gs://..."
   ✅ Firestore: floor.imageDownloadURL começa com "https://"
   ✅ Firestore: floor.imageURLExpiry > Date.now()
   ✅ Console: 0 erros
```

---

### 1.10 Teste Storage Lazy Load (v11.1) 🆕

**Quando executar:** Após alteração em `FloorViewer.loadImage()`, `getFloorImageURL()`.

```
1. Projecto com 3 pisos (todos com imagem)
2. Lobby → Abre projecto
3. VALIDA (Network tab):
   ✅ NÃO carrega nenhuma imagem no load inicial
   ✅ Firestore read: 1 doc (metadata only)
4. Secção 7 → Selecciona Piso 0
5. VALIDA (Network tab):
   ✅ Download URL request: 1 (só Piso 0)
   ✅ Image blob download: 1
6. Selecciona Piso 1
7. VALIDA:
   ✅ Download URL request: 1 (só Piso 1)
8. Volta a Piso 0
9. VALIDA:
   ✅ NO download (cached)
```

**Performance target**: <500ms para load lobby (10 floors).

---

### 1.11 Teste Storage TTL Cache (v11.1) 🆕

**Quando executar:** Após alteração em TTL logic ou `getFloorImageURL()`.

```
1. Projecto com 1 piso + imagem
2. Firestore Console: Edita floor.imageURLExpiry = Date.now() - 1000 (expirado)
3. Secção 7 → Selecciona piso
4. VALIDA:
   ✅ Regenera download URL (API call)
   ✅ Firestore actualiza imageDownloadURL + imageURLExpiry
   ✅ Imagem aparece no canvas
   ✅ Console: 0 erros
```

---

### 1.12 Teste Storage Delete (v11.1) 🆕

**Quando executar:** Após alteração em `deleteFloor()`, `deleteFloorImage()`.

```
1. Projecto com 2 pisos (ambos com imagem)
2. Firebase Console → Storage: Nota blob paths
3. Secção 2 → Apaga Piso 0
4. VALIDA:
   ✅ Firestore: floors array só tem 1 elemento
   ✅ Storage: blob Piso 0 apagado
   ✅ Storage: blob Piso 1 mantém-se
   ✅ Console: 0 erros
```

**CRÍTICO**: Storage delete ANTES de Firestore delete (evita leaks).

---

### 1.13 Teste Storage Security (v11.1) 🆕

**Quando executar:** Após alteração em Storage Rules.

```
1. User A (@jsj.pt): Cria projecto P1 + upload imagem
2. Firebase Console: Copia download URL da imagem
3. User B (@jsj.pt): Tenta aceder URL directamente
4. VALIDA:
   ❌ 403 Forbidden (User B não é owner)
5. User B: Cria projecto P2 + upload imagem
6. VALIDA:
   ✅ User B vê sua imagem
   ❌ User B NÃO vê imagem P1 (mesmo com URL)
```

---

### 1.14 Teste Migration Script (v11.1) 🆕

**Quando executar:** Antes de deploy v11.1 para produção.

```
1. Backup completo Firestore (export)
2. Projecto v11.0 com 3 floors (Base64 images)
3. Abre migrate-v11.0-to-v11.1.html
4. Executa migration
5. VALIDA:
   ✅ Firestore: floor.imageData removido
   ✅ Firestore: floor.imageURL existe (3 pisos)
   ✅ Storage: 3 blobs criados
   ✅ Firestore doc size < 100KB (era ~2MB)
6. Abre Index_v11.1.html
7. VALIDA:
   ✅ Imagens aparecem no Viewer
   ✅ Console: 0 erros
```

**CRÍTICO**: NUNCA executar migration 2x (duplica blobs).

---

## 2. TESTES DE INTEGRAÇÃO

### 2.1 Fluxo Novo Projecto (~5 min)

```
1. Login @jsj.pt → lobby
2. "Novo Projecto"
3. Secções 1-2-5-7: Preenche dados mínimos + upload 1 imagem
4. Aguarda auto-save → Lobby → Reabre
5. VALIDA: 
   ✅ Todos os dados mantidos
   ✅ KPIs correctos
   ✅ Imagem aparece em Viewer (lazy load)
   ✅ Gráfico sísmico renderiza
```

### 2.2 Fluxo Edição Existente

```
1. Abre projecto → Adiciona piso → Upload imagem → Muda Uso de zona
2. Lobby → Reabre
3. VALIDA: 
   ✅ Piso novo mantido
   ✅ Imagem nova aparece
   ✅ Uso actualizado
   ✅ Cálculos EC1 correctos
```

---

### 2.3 Fluxo Multi-Device Sync (v11.1) 🆕

```
1. Browser A: Abre projecto, upload imagem Piso 0
2. Aguarda auto-save (30s)
3. Browser B: Abre mesmo projecto
4. VALIDA:
   ✅ Piso 0 aparece
   ✅ Imagem lazy-load funciona
   ✅ Ambos browsers vêem mesma imagem
```

---

## 3. DIAGNÓSTICO RÁPIDO (Console)

```javascript
// Estado
console.table({
  floors: projectData.floors.length,
  zones: projectData.floors.reduce((s,f) => s + (f.zones?.length||0), 0),
  geoHorizons: projectData.geoHorizons?.length || 0
});

// Firebase
console.log('Auth:', firebase.auth().currentUser?.email);
console.log('Project:', new URLSearchParams(location.search).get('project'));

// Storage (v11.1)
console.table(projectData.floors.map(f => ({
  id: f.id,
  name: f.name,
  hasURL: !!f.imageURL,
  cached: !!f.imageDownloadURL,
  expired: f.imageURLExpiry < Date.now()
})));

// IDs órfãos
const d = collectAllData();
console.log('Órfãos:', Object.keys(d).filter(k => k!=='projectData' && !document.getElementById(k)));
```

---

## 4. CHECKLIST DE QUALIDADE

### Antes de Commitar
- [ ] IO: Import/Export funciona
- [ ] Visual: 0 erros console
- [ ] Cálculo: EC1 correcto (se aplicável)
- [ ] Gráfico: Canvas renderiza (se aplicável)
- [ ] Firebase: Sync cross-session (se persistência)
- [ ] Auth: Login/logout (se auth)
- [ ] Storage: Upload/Download/Delete (v11.1)
- [ ] Lazy Load: NO eager load (v11.1)
- [ ] Docs: `RISCOS.md` actualizado (se novos IDs/funções)

### Antes de Nova Versão
- [ ] Todos acima ✅
- [ ] ≥2 JSONs testados
- [ ] Viewer 2D com polígonos
- [ ] Gráficos sísmicos renderizam
- [ ] Firestore Console: dados correctos
- [ ] Storage Console: blobs existem (v11.1)
- [ ] Migration script testado (v11.1)

---

## 5. TROUBLESHOOTING

| Problema | Causa | Debug |
|---|---|---|
| Dados não carregam | ID mudou / `loadAllData` incompleto | Console + valida IDs |
| Canvas branco | `actionsData` vazio OU imagem não carregada (v11.1) | `console.log(floor.actionsData?.layers, floor.imageLoaded)` |
| EC1 errados | Lógica duplicada dessincronizada | Compara ambas implementações |
| Sísmico não gera | Chart.js / params | Verifica CDN + params default |
| Dados perdidos lobby | Save não chamado | `backToLobby()` chama save? |
| Firestore rejeita | Nested arrays / doc > 1MB | Verifica sanitize + migrou para Storage? |
| Imagem 404 (v11.1) | URL expirado / blob apagado | Console: `floor.imageURL`, Storage Console |
| Upload falha (v11.1) | Auth / Rules / Quota | Console errors, Firebase Usage tab |
| Lazy load não funciona (v11.1) | `imageLoaded` flag errado | `console.log(floor.imageLoaded)` |

---

## 6. TESTES DE PERFORMANCE v11.1 🆕

### 6.1 Lobby Load Time
**Target**: <500ms para 10 floors

```javascript
// Console (lobby.html)
console.time('lobby-load');
await loadProjects();
console.timeEnd('lobby-load');
// Expected: <500ms
```

### 6.2 Viewer Image Load
**Target**: <1s por imagem (lazy)

```javascript
// Console (Index, Secção 7)
console.time('image-load');
await FloorViewer.loadImage(floor);
console.timeEnd('image-load');
// Expected: <1000ms (500KB PNG)
```

### 6.3 Firestore Doc Size
**Target**: <100KB por project doc

```javascript
// Firestore Console
// projects/{id} → Size < 100KB
// (v11.0 com 10 floors Base64 = ~5MB → REJECT)
// (v11.1 com 10 floors Storage = ~50KB → OK)
```

---

*Última actualização: 15/02/2026 (v11.1)*
