# Firebase Backend Implementation Plan (v10.2 → v11.0)

**Target**: Migrate SSOT JSJ Template from localStorage to Firebase (Auth + Firestore)
**Estimated Time**: 4-5 hours
**Version**: v11.0

---

## PREREQUISITES

### Required Information (ASK USER)
1. **Firebase Config Object**: Get from Firebase Console → Project Settings → General
2. **JSJ Email Whitelist**: List of authorized @jsj.pt emails

### Required Reading (IN ORDER)
1. `@AGENTE_ARQUITETURA.md` - Data flow (projectData structure)
2. `AGENTE_RISCOS_v2.md` - Protected IDs/functions (168 cataloged)
3. `@AGENTE_ROADMAP.md` - Phase 3 context

---

## CRITICAL RULES

### DO NOT
- ❌ Change HTML IDs without checking AGENTE_RISCOS_v2.md
- ❌ Break projectData structure (floors/zones MUST be Maps in runtime)
- ❌ Remove localStorage logic before migration tested
- ❌ Deploy without Security Rules configured

### MUST
- ✅ Serialize Maps → Arrays before Firestore save
- ✅ Deserialize Arrays → Maps after Firestore load
- ✅ Maintain v10.2 schema compatibility
- ✅ Add auth guards to ALL entry points (lobby.html, index.html)

---

## TASK 2: Create firebase-config.js

**File**: `firebase-config.js` (new, root directory)

**Action**: Create Firebase configuration file

**Code**:
```javascript
// Firebase Configuration
// INSTRUCTION: Replace with your firebaseConfig from Firebase Console
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

// JSJ Email Whitelist
// INSTRUCTION: Add JSJ team emails here
const JSJ_EMAIL_WHITELIST = [
  "email1@jsj.pt",
  "email2@jsj.pt"
  // Add more emails as needed
];

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Helper: Check if email is authorized
function isJSJEmail(email) {
  return email.endsWith('@jsj.pt') || 
         JSJ_EMAIL_WHITELIST.includes(email.toLowerCase());
}
```

**Validation**:
- [ ] File created in project root
- [ ] firebaseConfig populated (no REPLACE_ME)
- [ ] Whitelist has ≥1 email
- [ ] No console errors when loaded

**Ask User**: Paste firebaseConfig object and whitelist emails

---

## TASK 3: Create login.html

**File**: `login.html` (new, root directory)

**Action**: Create authentication UI

**Requirements**:
- Dark theme matching lobby.html aesthetic
- Email/password form
- Whitelist validation (@jsj.pt only)
- Error messages for common auth errors
- Redirect to lobby.html on success

**Template Structure**:
```html
<!DOCTYPE html>
<html>
<head>
  <title>SSOT JSJ - Login</title>
  <style>
    /* Reuse lobby.html gradient background */
    /* Center login card (400px wide, white bg, rounded) */
    /* Input fields + submit button */
  </style>
</head>
<body>
  <div class="login-container">
    <h1>🏛️ SSOT JSJ Template</h1>
    <form id="loginForm">
      <input type="email" id="email" placeholder="email@jsj.pt" required>
      <input type="password" id="password" placeholder="Password" required>
      <button type="submit">Entrar</button>
    </form>
    <div id="error"></div>
  </div>

  <!-- Firebase SDKs v10.7.1 -->
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
  <script src="firebase-config.js"></script>
  
  <script>
    // Login form handler
    // 1. Validate whitelist (isJSJEmail)
    // 2. auth.signInWithEmailAndPassword()
    // 3. Redirect lobby.html on success
    // 4. Show error messages (user-friendly Portuguese)
  </script>
</body>
</html>
```

**Error Messages** (Portuguese):
- `auth/user-not-found` → "Utilizador não encontrado"
- `auth/wrong-password` → "Password incorrecta"
- `auth/invalid-email` → "Email inválido"
- `auth/too-many-requests` → "Muitas tentativas. Aguarda 5 min."

**Validation**:
- [ ] Opens in browser without errors
- [ ] Non-@jsj.pt email shows whitelist error
- [ ] Correct email + wrong password shows Firebase error
- [ ] Form submits on Enter key

---

## TASK 4: Modify lobby.html - Add Auth Guard

**File**: `lobby.html` (modify existing)

**Action**: Add Firebase authentication + redirect logic

**Changes**:

### A) Add Firebase SDK imports (in `<head>`)
```html
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="firebase-config.js"></script>
```

### B) Add auth guard (BEGINNING of `<script>` section)
```javascript
// Auth Guard - MUST be FIRST in script
firebase.auth().onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  document.body.style.display = 'block'; // Show UI
  initLobby(user);
});
```

### C) Add user info header (in HTML, before project grid)
```html
<div class="header">
  <h1>🏛️ SSOT JSJ Template</h1>
  <div class="user-info">
    <span id="userEmail"></span>
    <button id="logoutBtn" class="btn-secondary">Sair</button>
  </div>
</div>
```

### D) Add CSS for header
```css
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
}
```

### E) Modify initLobby function
```javascript
function initLobby(user) {
  // Display user email
  document.getElementById('userEmail').textContent = user.email;
  
  // Load projects (will be replaced in Task 6)
  loadProjectsFromStorage(); // Keep for now
  
  // Event listeners
  document.getElementById('createProjectBtn').addEventListener('click', createProject);
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = 'login.html';
  });
}
```

**Validation**:
- [ ] Open lobby.html without auth → redirects to login.html
- [ ] Login → returns to lobby.html
- [ ] Header shows user email
- [ ] "Sair" button logs out and redirects

---

## TASK 5: Create firebase-data.js

**File**: `firebase-data.js` (new, root directory)

**Action**: Create Firestore CRUD abstraction layer

**Purpose**: Encapsulate all Firestore operations (replaces localStorage)

**Key Functions**:

### CREATE
```javascript
async function createProjectInFirestore(projectData, userId) {
  // 1. Add audit metadata (owner, createdAt, updatedAt)
  // 2. Serialize Maps → Arrays (floors, zones)
  // 3. db.collection('projects').doc(projectData.id).set()
  // 4. Return projectId
}
```

### READ
```javascript
async function loadProjectsFromFirestore(userId) {
  // 1. Query: where('owner', '==', userId)
  // 2. OrderBy: updatedAt desc
  // 3. Deserialize Arrays → Maps (floors, zones)
  // 4. Return { projectId: projectData, ... }
}

async function loadSingleProject(projectId) {
  // 1. db.collection('projects').doc(projectId).get()
  // 2. Deserialize Arrays → Maps
  // 3. Return projectData
}
```

### UPDATE
```javascript
async function saveProjectToFirestore(projectData) {
  // 1. Serialize Maps → Arrays
  // 2. Update updatedAt timestamp
  // 3. db.collection('projects').doc(projectData.id).update()
}
```

### DELETE
```javascript
async function deleteProjectFromFirestore(projectId) {
  // db.collection('projects').doc(projectId).delete()
}
```

### REAL-TIME LISTENER
```javascript
function subscribeToProject(projectId, callback) {
  // Return unsubscribe function
  // db.collection('projects').doc(projectId).onSnapshot(callback)
  // Deserialize in callback before calling user callback
}
```

**Critical Logic - Map Serialization**:
```javascript
// Serialize (before Firestore save)
floors: Array.from(projectData.floors.values())
zones: Array.from(projectData.zones.values())

// Deserialize (after Firestore load)
floors: new Map(data.floors?.map(f => [f.id, f]) || [])
zones: new Map(data.zones?.map(z => [z.id, z]) || [])
```

**Validation**:
- [ ] File created
- [ ] All 6 functions defined
- [ ] No syntax errors
- [ ] Imports firebase-config.js (uses `db` global)

---

## TASK 6: Modify lobby.html - Integrate Firestore

**File**: `lobby.html` (modify existing)

**Action**: Replace localStorage calls with Firestore

**Changes**:

### A) Add import
```html
<script src="firebase-data.js"></script>
```

### B) Replace createProject function
```javascript
async function createProject() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  const projectId = generateUUID();
  const newProject = {
    id: projectId,
    id_jsj: '',
    nome_projeto: 'Novo Projeto',
    cliente: '',
    floors: new Map(),
    zones: new Map(),
    geoHorizons: [],
    // ... all other empty fields ...
  };
  
  try {
    await createProjectInFirestore(newProject, user.uid);
    window.location.href = `index.html?project=${projectId}`;
  } catch (error) {
    alert('❌ Erro ao criar projeto: ' + error.message);
  }
}
```

### C) Replace loadProjectsFromStorage
```javascript
async function loadAllProjects() {
  const user = firebase.auth().currentUser;
  if (!user) return;
  
  try {
    const projects = await loadProjectsFromFirestore(user.uid);
    renderProjectsGrid(projects);
  } catch (error) {
    console.error('Erro ao carregar:', error);
    alert('❌ Erro ao carregar projetos');
  }
}
```

### D) Replace deleteProject function
```javascript
async function deleteProject(projectId) {
  if (!confirm('Eliminar projeto? Esta acção é irreversível.')) return;
  
  try {
    await deleteProjectFromFirestore(projectId);
    document.querySelector(`[data-project-id="${projectId}"]`).remove();
  } catch (error) {
    alert('❌ Erro ao eliminar: ' + error.message);
  }
}
```

### E) Update initLobby
```javascript
function initLobby(user) {
  document.getElementById('userEmail').textContent = user.email;
  
  loadAllProjects(); // Changed from loadProjectsFromStorage
  
  document.getElementById('createProjectBtn').addEventListener('click', createProject);
  document.getElementById('logoutBtn').addEventListener('click', logout);
}
```

**Validation**:
- [ ] Create project → appears in Firestore Console
- [ ] Delete project → disappears from Firestore
- [ ] Reload page → projects load from Firestore
- [ ] No localStorage calls remaining

---

## TASK 7: Modify Index_v10.html - Add Auth + Real-Time Sync

**File**: `Index_v10.html` (modify existing)

**Action**: Add authentication guard + Firestore integration + auto-save

**Changes**:

### A) Add Firebase SDK imports (in `<head>`)
```html
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="firebase-config.js"></script>
<script src="firebase-data.js"></script>
```

### B) Add auth guard (BEGINNING of `<script>`)
```javascript
firebase.auth().onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  initEditor(user);
});
```

### C) Create initEditor function
```javascript
async function initEditor(user) {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('project');
  
  if (!projectId) {
    window.location.href = 'lobby.html';
    return;
  }
  
  try {
    // Load project from Firestore
    const project = await loadSingleProject(projectId);
    
    // Populate appState (v10.2 structure)
    appState.activeProjectId = projectId;
    appState.projects[projectId] = project;
    
    // Populate DOM
    loadAllData(project);
    
    // Real-time listener
    const unsubscribe = subscribeToProject(projectId, (updatedProject) => {
      console.log('🔄 Real-time update received');
      appState.projects[projectId] = updatedProject;
      
      // Re-render only if window not focused (change from another tab/user)
      if (!document.hasFocus()) {
        loadAllData(updatedProject);
      }
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      unsubscribe();
      saveCurrentProject();
    });
    
  } catch (error) {
    alert('❌ Erro ao carregar projeto: ' + error.message);
    window.location.href = 'lobby.html';
  }
}
```

### D) Replace saveCurrentProject function
```javascript
async function saveCurrentProject() {
  if (!appState.activeProjectId) return;
  
  const project = appState.activeProject; // Proxy getter
  const formData = collectAllData(); // v10.2 function
  
  const updatedProject = {
    ...project,
    ...formData,
    floors: project.floors,
    zones: project.zones,
    geoHorizons: project.geoHorizons
  };
  
  try {
    await saveProjectToFirestore(updatedProject);
    console.log('✅ Saved to Firestore');
  } catch (error) {
    console.error('❌ Save error:', error);
    // Don't block UI - just log
  }
}
```

### E) Add auto-save interval
```javascript
// Auto-save every 30 seconds
setInterval(() => {
  if (appState.activeProjectId) {
    saveCurrentProject();
  }
}, 30000);
```

### F) Update "Voltar ao Lobby" button handler
```javascript
document.getElementById('backToLobbyBtn').addEventListener('click', async () => {
  await saveCurrentProject(); // Ensure save before leaving
  window.location.href = 'lobby.html';
});
```

**Validation**:
- [ ] Open index.html?project=X without auth → redirects to login.html
- [ ] Login + open project → fields populate correctly
- [ ] Edit field → auto-saves after 30s (check Firestore Console)
- [ ] Open same project in 2 tabs → changes sync
- [ ] "Voltar ao Lobby" saves before redirect

---

## TASK 8: Configure Firestore Security Rules

**File**: Firebase Console → Firestore Database → Rules (manual)

**Action**: Set production-ready security rules

**Rules Code**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isJSJEmail() {
      return request.auth.token.email.matches('.*@jsj[.]pt$');
    }
    
    function isOwner(projectId) {
      return get(/databases/$(database)/documents/projects/$(projectId)).data.owner == request.auth.uid;
    }
    
    match /projects/{projectId} {
      allow read: if isAuthenticated() && isJSJEmail() && isOwner(projectId);
      allow create: if isAuthenticated() && isJSJEmail() && 
                       request.resource.data.owner == request.auth.uid;
      allow update: if isAuthenticated() && isJSJEmail() && isOwner(projectId);
      allow delete: if isAuthenticated() && isJSJEmail() && isOwner(projectId);
    }
  }
}
```

**Steps**:
1. Go to Firebase Console
2. Firestore Database → Rules tab
3. Replace default rules with above code
4. Click "Publish"

**Validation** (Rules Playground in Console):
- [ ] Unauthenticated user → Read DENIED
- [ ] Authenticated but non-@jsj.pt → Read DENIED
- [ ] Authenticated @jsj.pt but not owner → Read DENIED
- [ ] Authenticated @jsj.pt and owner → Read ALLOWED

---

## TASK 9: Create Migration Script

**File**: `migrate-to-firebase.html` (new, TEMPORARY)

**Action**: One-time migration localStorage → Firestore

**Purpose**: Convert v10.2 localStorage projects to v11.0 Firestore

**Code**:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Migração v10.2 → v11.0</title>
  <style>
    body { font-family: Arial; padding: 40px; }
    button { padding: 12px 24px; font-size: 16px; cursor: pointer; }
    #status { margin-top: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Migração localStorage → Firebase</h1>
  <p>⚠️ Certifica-te que fizeste login antes de migrar</p>
  <button id="migrateBtn">Migrar Projetos</button>
  <div id="status"></div>

  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
  <script src="firebase-config.js"></script>
  <script src="firebase-data.js"></script>
  <script src="shared.js"></script>
  
  <script>
    document.getElementById('migrateBtn').addEventListener('click', async () => {
      const user = firebase.auth().currentUser;
      if (!user) {
        alert('❌ Faz login primeiro (abre login.html)');
        return;
      }
      
      const statusDiv = document.getElementById('status');
      statusDiv.innerHTML = '⏳ A migrar...';
      
      try {
        // Load from localStorage
        const localProjects = loadProjectsFromStorage(); // from shared.js
        
        if (!localProjects || Object.keys(localProjects).length === 0) {
          statusDiv.innerHTML = '⚠️ Nenhum projeto no localStorage';
          return;
        }
        
        // Migrate each project
        let migrated = 0;
        const total = Object.keys(localProjects).length;
        
        for (const [projectId, project] of Object.entries(localProjects)) {
          await createProjectInFirestore(project, user.uid);
          migrated++;
          statusDiv.innerHTML = `⏳ Migrados ${migrated}/${total}`;
        }
        
        statusDiv.innerHTML = `
          ✅ Migração completa! ${migrated} projetos migrados.<br>
          <small>Valida no Firestore Console antes de limpar localStorage.</small><br>
          <button onclick="clearLocal()">Limpar localStorage</button>
        `;
        
      } catch (error) {
        statusDiv.innerHTML = '❌ Erro: ' + error.message;
        console.error(error);
      }
    });
    
    function clearLocal() {
      if (confirm('⚠️ Apagar localStorage? Certifica-te que migração foi bem sucedida!')) {
        localStorage.removeItem('ssot_projects');
        alert('✅ localStorage limpo');
      }
    }
  </script>
</body>
</html>
```

**Usage Instructions**:
1. Open `login.html` → login with @jsj.pt email
2. Open `migrate-to-firebase.html`
3. Click "Migrar Projetos"
4. Validate in Firestore Console (projects appear with correct owner)
5. Click "Limpar localStorage"
6. **DELETE THIS FILE** after migration complete

**Validation**:
- [ ] Projects appear in Firestore Console
- [ ] owner field = current user.uid
- [ ] floors/zones structure correct (Arrays in Firestore)
- [ ] Open project in index.html → loads correctly

---

## TASK 10: Validation Testing

**Checklist**: Execute ALL tests before marking v11.0 complete

### Auth Flow
- [ ] Open lobby.html unauthenticated → redirects login.html
- [ ] Login with non-@jsj.pt email → shows whitelist error
- [ ] Login with correct email → redirects lobby.html
- [ ] Logout button works → redirects login.html

### CRUD Operations
- [ ] Create project → appears in Firestore Console
- [ ] Open project → fields load correctly
- [ ] Edit field → auto-saves after 30s
- [ ] Delete project → disappears from Firestore

### Real-Time Sync
- [ ] Open project in 2 browser tabs
- [ ] Edit field in Tab 1
- [ ] Tab 2 updates automatically within 2-3 seconds

### Security
- [ ] User A cannot see User B's projects (test with 2 accounts)
- [ ] Firestore Rules Playground validates correctly

### Migration
- [ ] v10.2 projects migrate without data loss
- [ ] Migrated projects load correctly in index.html
- [ ] floors/zones/geoHorizons structure intact

### Performance
- [ ] No console errors in any page
- [ ] Page load < 3 seconds (with internet)
- [ ] Auto-save doesn't block UI

POST-v11.0 CLEANUP (After Task 10)
Add to list:

Renomear Index_v10.2.html → Index_v11.0.html
Update lobby.html redirects
Update backToLobby() links
Fix toggleActionSection timing
Remove localStorage logs (shared.js)
---

## POST-IMPLEMENTATION

### Clean Up
- [ ] Delete `migrate-to-firebase.html`
- [ ] Remove localStorage code comments (optional - can keep for reference)

### Documentation
- [ ] Update `@AGENTE_MIGRACAO.md` with entry (ask Strategic Chat for template)
- [ ] Generate REPORT.md for Strategic Chat validation

### Next Steps
- [ ] Monitor Firebase Console for quota usage (Spark plan limits)
- [ ] Plan v11.1 (Schema Blocos) after v11.0 stable

---

## TROUBLESHOOTING

### "Firebase not defined"
→ Check script order: firebase SDK must load BEFORE firebase-config.js

### "Permission denied" in Firestore
→ Check Security Rules published correctly
→ Verify user email ends with @jsj.pt

### Projects not loading
→ Check browser console for errors
→ Verify projectId in URL matches Firestore document ID
→ Check owner field matches current user.uid

### Auto-save not working
→ Check 30s interval is set
→ Verify saveCurrentProject() has no errors in console
→ Check Firestore Console "updatedAt" timestamp updates

---

## COMPLETION CRITERIA

v11.0 is complete when:
- ✅ All 10 tasks executed
- ✅ All validations passed
- ✅ No console errors
- ✅ Strategic Chat approved REPORT.md
- ✅ Migration successful (if applicable)
- ✅ Firestore Console shows correct data structure

**Estimated Total Time**: 4-5 hours