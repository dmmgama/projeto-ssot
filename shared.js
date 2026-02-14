/**
 * SSOT JSJ Template - Shared Utilities (v10.2)
 * Funções partilhadas entre lobby.html e index.html
 */

// ==================== UUID Generation ====================
function generateUUID() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para browsers antigos
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ==================== Storage Keys ====================
const StorageKeys = {
  PROJECTS: 'ssot_projects',
  ACTIVE_PROJECT: 'ssot_active_project'
};

// ==================== Storage Operations ====================

/**
 * Serializa Maps para arrays antes de guardar em localStorage
 * @param {Object} projects - Objeto com todos os projetos
 */
function saveProjectsToStorage(projects) {
  try {
    const serialized = {};
    
    for (const [projectId, project] of Object.entries(projects)) {
      serialized[projectId] = {
        ...project,
        floors: {},
        geoHorizons: {}
      };

      // Converter Maps de floors (contém zones Map aninhado)
      if (project.floors instanceof Map) {
        for (const [fId, floor] of project.floors.entries()) {
          serialized[projectId].floors[fId] = {
            ...floor,
            zones: {} // Converte Map de zones aninhado
          };
          
          // DEBUG: Validar actionsData na serialização
          if (floor.actionsData) {
            console.log(`[saveProjectsToStorage] Floor ${fId} serializado com actionsData:`, 
              Object.keys(floor.actionsData.layers || {}).length, 'layers');
          }
          
          if (floor.zones instanceof Map) {
            for (const [zId, zone] of floor.zones.entries()) {
              serialized[projectId].floors[fId].zones[zId] = zone;
            }
          } else {
            serialized[projectId].floors[fId].zones = floor.zones || {};
          }
        }
      } else {
        serialized[projectId].floors = project.floors || {};
      }

      // Converter geoHorizons Map
      if (project.geoHorizons instanceof Map) {
        for (const [gId, geo] of project.geoHorizons.entries()) {
          serialized[projectId].geoHorizons[gId] = geo;
        }
      } else {
        serialized[projectId].geoHorizons = project.geoHorizons || {};
      }
    }
    
    localStorage.setItem(StorageKeys.PROJECTS, JSON.stringify(serialized));
    return true;
  } catch (error) {
    console.error('Erro ao guardar projetos:', error);
    // Pode ser problema de quota (>5MB)
    if (error.name === 'QuotaExceededError') {
      alert('⚠️ Limite de armazenamento excedido. Considere apagar projetos antigos ou exportar para ficheiro JSON.');
    }
    return false;
  }
}

/**
 * Carrega projetos de localStorage e reconstrói Maps
 * @returns {Object} - Objeto com todos os projetos
 */
function loadProjectsFromStorage() {
  try {
    const data = localStorage.getItem(StorageKeys.PROJECTS);
    if (!data) return {};
    
    const parsed = JSON.parse(data);
    const projects = {};
    
    for (const [projectId, project] of Object.entries(parsed)) {
      projects[projectId] = {
        ...project,
        floors: new Map(),
        geoHorizons: new Map()
      };

      // Reconstrói floors Map com zones Map aninhado
      if (project.floors) {
        for (const [fId, floor] of Object.entries(project.floors)) {
          const zonesMap = new Map();
          if (floor.zones) {
            for (const [zId, zone] of Object.entries(floor.zones)) {
              zonesMap.set(zId, zone);
            }
          }
          projects[projectId].floors.set(fId, {
            ...floor,
            zones: zonesMap
          });
          
          // DEBUG: Validar actionsData na desserialização
          if (floor.actionsData) {
            console.log(`[loadProjectsFromStorage] Floor ${fId} tem actionsData com`, 
              Object.keys(floor.actionsData.layers || {}).length, 'layers');
          }
        }
      }

      // Reconstrói geoHorizons Map
      if (project.geoHorizons) {
        for (const [gId, geo] of Object.entries(project.geoHorizons)) {
          projects[projectId].geoHorizons.set(gId, geo);
        }
      }
    }
    
    return projects;
  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
    return {};
  }
}

/**
 * Guarda ID do projeto ativo
 * @param {string} projectId - UUID do projeto
 */
function saveActiveProjectId(projectId) {
  localStorage.setItem(StorageKeys.ACTIVE_PROJECT, projectId);
}

/**
 * Carrega ID do projeto ativo
 * @returns {string|null} - UUID do projeto ou null
 */
function loadActiveProjectId() {
  return localStorage.getItem(StorageKeys.ACTIVE_PROJECT);
}

// ==================== Validação ====================
console.log('[shared.js] Carregado com sucesso');
console.log('- generateUUID disponível:', typeof generateUUID === 'function');
console.log('- StorageKeys disponível:', typeof StorageKeys === 'object');
console.log('- Teste UUID:', generateUUID());
