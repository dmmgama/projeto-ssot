/**
 * SSOT JSJ Template - Firebase Firestore Data Layer (v11.0)
 * Abstraction layer for Firestore CRUD operations
 * Handles Map serialization/deserialization for projectData structure
 */

// Assumes firebase-config.js is already loaded (provides 'db' global)

// ==================== CREATE ====================

/**
 * Creates a new project in Firestore with audit metadata
 * @param {Object} projectData - Project data with Maps (floors, zones, geoHorizons)
 * @param {string} userId - Firebase user UID (owner)
 * @returns {Promise<string>} - Project ID
 */
async function createProjectInFirestore(projectData, userId) {
  try {
    const now = new Date().toISOString();
    
    // Serialize Maps to Arrays for Firestore storage
    const serializedData = {
      ...projectData,
      owner: userId,
      createdAt: now,
      updatedAt: now,
      floors: serializeFloorsMap(projectData.floors),
      geoHorizons: serializeGeoHorizonsMap(projectData.geoHorizons)
    };
    
    // Save to Firestore
    await db.collection('projects').doc(projectData.id).set(serializedData);
    
    console.log('[firebase-data] Project created:', projectData.id);
    return projectData.id;
  } catch (error) {
    console.error('[firebase-data] Create error:', error);
    throw new Error('Erro ao criar projeto no Firestore: ' + error.message);
  }
}

// ==================== READ ====================

/**
 * Loads all projects for a specific user from Firestore
 * @param {string} userId - Firebase user UID
 * @returns {Promise<Object>} - Object with { projectId: projectData, ... }
 */
async function loadProjectsFromFirestore(userId) {
  try {
    const snapshot = await db.collection('projects')
      .where('owner', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get();
    
    const projects = {};
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      projects[doc.id] = deserializeProject(data);
    });
    
    console.log('[firebase-data] Loaded', Object.keys(projects).length, 'projects for user', userId);
    return projects;
  } catch (error) {
    console.error('[firebase-data] Load projects error:', error);
    throw new Error('Erro ao carregar projetos: ' + error.message);
  }
}

/**
 * Loads a single project by ID from Firestore
 * @param {string} projectId - Project UUID
 * @returns {Promise<Object>} - Project data with Maps reconstructed
 */
async function loadSingleProject(projectId) {
  try {
    const doc = await db.collection('projects').doc(projectId).get();
    
    if (!doc.exists) {
      throw new Error('Projeto não encontrado');
    }
    
    const projectData = deserializeProject(doc.data());
    console.log('[firebase-data] Loaded single project:', projectId);
    return projectData;
  } catch (error) {
    console.error('[firebase-data] Load single project error:', error);
    throw new Error('Erro ao carregar projeto: ' + error.message);
  }
}

// ==================== UPDATE ====================

/**
 * Updates existing project in Firestore
 * @param {Object} projectData - Project data with Maps
 * @returns {Promise<void>}
 */
async function saveProjectToFirestore(projectData) {
  try {
    const now = new Date().toISOString();
    
    // Serialize Maps to Arrays
    const serializedData = {
      ...projectData,
      updatedAt: now,
      floors: serializeFloorsMap(projectData.floors),
      geoHorizons: serializeGeoHorizonsMap(projectData.geoHorizons)
    };
    
    // Update in Firestore
    await db.collection('projects').doc(projectData.id).update(serializedData);
    
    console.log('[firebase-data] Project updated:', projectData.id);
  } catch (error) {
    console.error('[firebase-data] Update error:', error);
    throw new Error('Erro ao guardar projeto: ' + error.message);
  }
}

// ==================== DELETE ====================

/**
 * Deletes a project from Firestore
 * @param {string} projectId - Project UUID
 * @returns {Promise<void>}
 */
async function deleteProjectFromFirestore(projectId) {
  try {
    await db.collection('projects').doc(projectId).delete();
    console.log('[firebase-data] Project deleted:', projectId);
  } catch (error) {
    console.error('[firebase-data] Delete error:', error);
    throw new Error('Erro ao eliminar projeto: ' + error.message);
  }
}

// ==================== REAL-TIME LISTENER ====================

/**
 * Subscribes to real-time updates for a project
 * @param {string} projectId - Project UUID
 * @param {Function} callback - Called with deserialized projectData on updates
 * @returns {Function} - Unsubscribe function
 */
function subscribeToProject(projectId, callback) {
  console.log('[firebase-data] Subscribing to project:', projectId);
  
  const unsubscribe = db.collection('projects').doc(projectId).onSnapshot(
    (doc) => {
      if (!doc.exists) {
        console.warn('[firebase-data] Project no longer exists:', projectId);
        callback(null);
        return;
      }
      
      const projectData = deserializeProject(doc.data());
      console.log('[firebase-data] Real-time update received for:', projectId);
      callback(projectData);
    },
    (error) => {
      console.error('[firebase-data] Snapshot error:', error);
      callback(null, error);
    }
  );
  
  return unsubscribe;
}

// ==================== SERIALIZATION HELPERS ====================

/**
 * Serializes floors Map to Array for Firestore
 * Handles nested zones Map within each floor
 * @param {Map} floorsMap - Map of floors
 * @returns {Array} - Array of floor objects
 */
function serializeFloorsMap(floorsMap) {
  if (!floorsMap || !(floorsMap instanceof Map)) {
    return [];
  }
  
  const floorsArray = Array.from(floorsMap.values()).map(floor => {
    const zonesArray = floor.zones instanceof Map 
      ? Array.from(floor.zones.values())
      : [];
    
    // FIX: Serialize actionsData.layers (stringify shapes to avoid nested arrays)
    let serializedActionsData = floor.actionsData;
    if (floor.actionsData?.layers) {
      serializedActionsData = {
        blueprint: floor.actionsData.blueprint,
        layers: {}
      };
      
      // Process each layer
      for (const [layerName, zones] of Object.entries(floor.actionsData.layers)) {
        if (Array.isArray(zones)) {
          serializedActionsData.layers[layerName] = zones.map(zone => {
            if (!zone) return zone;
            
            return {
              ...zone,
              shapes: Array.isArray(zone.shapes) ? JSON.stringify(zone.shapes) : zone.shapes
            };
          });
        } else {
          serializedActionsData.layers[layerName] = zones;
        }
      }
    }
    
    return {
      ...floor,
      zones: zonesArray,
      actionsData: serializedActionsData
    };
  });
  
  return floorsArray;
}

/**
 * Serializes geoHorizons Map to Array for Firestore
 * @param {Map} geoHorizonsMap - Map of geo horizons
 * @returns {Array} - Array of geo horizon objects
 */
function serializeGeoHorizonsMap(geoHorizonsMap) {
  if (!geoHorizonsMap || !(geoHorizonsMap instanceof Map)) {
    return [];
  }
  
  return Array.from(geoHorizonsMap.values());
}

// ==================== DESERIALIZATION HELPERS ====================

/**
 * Deserializes project data from Firestore format to runtime format
 * Reconstructs Maps from Arrays
 * @param {Object} data - Raw Firestore data
 * @returns {Object} - Project data with Maps
 */
function deserializeProject(data) {
  return {
    ...data,
    floors: deserializeFloorsArray(data.floors),
    geoHorizons: deserializeGeoHorizonsArray(data.geoHorizons)
  };
}

/**
 * Deserializes floors Array to Map
 * Handles nested zones Array → Map conversion
 * @param {Array} floorsArray - Array of floor objects
 * @returns {Map} - Map of floors with zones Maps
 */
function deserializeFloorsArray(floorsArray) {
  const floorsMap = new Map();
  
  if (!Array.isArray(floorsArray)) {
    return floorsMap;
  }
  
  floorsArray.forEach(floor => {
    const zonesMap = new Map();
    if (floor.zones && Array.isArray(floor.zones)) {
      floor.zones.forEach(zone => {
        zonesMap.set(zone.id, zone);
      });
    }
    
    // FIX: Deserialize actionsData.layers (parse stringified shapes)
    let deserializedActionsData = floor.actionsData;
    if (floor.actionsData?.layers) {
      deserializedActionsData = {
        blueprint: floor.actionsData.blueprint,
        layers: {}
      };
      
      // Process each layer
      for (const [layerName, zones] of Object.entries(floor.actionsData.layers)) {
        if (Array.isArray(zones)) {
          deserializedActionsData.layers[layerName] = zones.map(zone => {
            if (!zone) return zone;
            
            // Parse shapes if they're strings
            let parsedShapes = zone.shapes;
            if (typeof zone.shapes === 'string') {
              try {
                parsedShapes = JSON.parse(zone.shapes);
              } catch (e) {
                console.error('[Deserialize] Failed to parse shapes:', e);
                parsedShapes = [];
              }
            }
            
            return {
              ...zone,
              shapes: parsedShapes
            };
          });
        } else {
          deserializedActionsData.layers[layerName] = zones;
        }
      }
    }
    
    floorsMap.set(floor.id, {
      ...floor,
      zones: zonesMap,
      actionsData: deserializedActionsData
    });
  });
  
  return floorsMap;
}

/**
 * Deserializes geoHorizons Array to Map
 * @param {Array} geoHorizonsArray - Array of geo horizon objects
 * @returns {Map} - Map of geo horizons
 */
function deserializeGeoHorizonsArray(geoHorizonsArray) {
  if (!geoHorizonsArray || !Array.isArray(geoHorizonsArray)) {
    return new Map();
  }
  
  const geoHorizonsMap = new Map();
  geoHorizonsArray.forEach(geo => {
    geoHorizonsMap.set(geo.id, geo);
  });
  
  return geoHorizonsMap;
}
