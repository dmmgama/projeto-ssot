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
    
    // Destructure to remove formData noise (project, metadata, legacyInputs)
    const { floors, geoHorizons, project, metadata, legacyInputs, ...cleanData } = projectData;
    
    // Serialize Maps/Objects to Arrays for Firestore storage
    const serializedData = {
      ...cleanData,
      owner: userId,
      createdAt: now,
      updatedAt: now,
      floors: serializeFloorsMap(floors),
      geoHorizons: serializeGeoHorizonsMap(geoHorizons)
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
    
    // Destructure to remove formData noise (project, metadata, legacyInputs)
    // These come from collectAllData() spread and contain unserialized nested data
    const { floors, geoHorizons, project, metadata, legacyInputs, ...cleanData } = projectData;
    
    // Serialize Maps/Objects to Arrays
    const serializedData = {
      ...cleanData,
      updatedAt: now,
      floors: serializeFloorsMap(floors),
      geoHorizons: serializeGeoHorizonsMap(geoHorizons)
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
 * Deep sanitizer: recursively walks an object and JSON.stringify's any
 * nested arrays (arrays that contain arrays) so Firestore won't reject them.
 * @param {*} value - Any value to sanitize
 * @returns {*} - Sanitized value safe for Firestore
 */
function sanitizeNestedArrays(value) {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  
  if (Array.isArray(value)) {
    // If any element is itself an array → stringify the whole thing
    const hasNestedArray = value.some(item => Array.isArray(item));
    if (hasNestedArray) {
      return JSON.stringify(value);
    }
    // Otherwise sanitize each element
    return value.map(item => sanitizeNestedArrays(item));
  }
  
  // Plain object: sanitize each property
  const result = {};
  for (const [key, val] of Object.entries(value)) {
    result[key] = sanitizeNestedArrays(val);
  }
  return result;
}

/**
 * Serializes floors (Map OR Object) to Array for Firestore.
 * Handles nested zones (Map or Object), and stringifies nested arrays
 * inside actionsData.layers[].shapes.
 * @param {Map|Object} floorsInput - Map or Object of floors
 * @returns {Array} - Array of floor objects safe for Firestore
 */
function serializeFloorsMap(floorsInput) {
  // Accept Map or Object
  let floorsArray;
  if (floorsInput instanceof Map) {
    floorsArray = Array.from(floorsInput.values());
  } else if (floorsInput && typeof floorsInput === 'object' && !Array.isArray(floorsInput)) {
    floorsArray = Object.values(floorsInput);
  } else {
    console.warn('[firebase-data] serializeFloorsMap: unexpected input type', typeof floorsInput);
    return [];
  }
  
  return floorsArray.map(floor => {
    if (!floor) return floor;
    
    // Handle zones — could be Map, Object, or Array
    let zonesArray;
    if (floor.zones instanceof Map) {
      zonesArray = Array.from(floor.zones.values());
    } else if (floor.zones && typeof floor.zones === 'object' && !Array.isArray(floor.zones)) {
      zonesArray = Object.values(floor.zones);
    } else if (Array.isArray(floor.zones)) {
      zonesArray = floor.zones;
    } else {
      zonesArray = [];
    }
    
    // Serialize actionsData — sanitize all nested arrays recursively
    let serializedActionsData = floor.actionsData
      ? sanitizeNestedArrays(floor.actionsData)
      : undefined;
    
    const result = {
      ...floor,
      zones: zonesArray,
    };
    
    // Only include actionsData if it exists
    if (serializedActionsData !== undefined) {
      result.actionsData = serializedActionsData;
    }
    
    return result;
  });
}

/**
 * Serializes geoHorizons (Map OR Object) to Array for Firestore.
 * @param {Map|Object} geoInput - Map or Object of geo horizons
 * @returns {Array} - Array of geo horizon objects
 */
function serializeGeoHorizonsMap(geoInput) {
  if (geoInput instanceof Map) {
    return Array.from(geoInput.values());
  } else if (geoInput && typeof geoInput === 'object' && !Array.isArray(geoInput)) {
    return Object.values(geoInput);
  }
  return [];
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
    // Deserialize zones Array → Map
    const zonesMap = new Map();
    if (floor.zones && Array.isArray(floor.zones)) {
      floor.zones.forEach(zone => {
        zonesMap.set(zone.id, zone);
      });
    }
    
    // Deserialize actionsData — parse any stringified arrays back
    let deserializedActionsData = floor.actionsData
      ? deserializeNestedStrings(floor.actionsData)
      : undefined;
    
    floorsMap.set(floor.id, {
      ...floor,
      zones: zonesMap,
      actionsData: deserializedActionsData
    });
  });
  
  return floorsMap;
}

/**
 * Reverse of sanitizeNestedArrays: recursively walks an object and
 * JSON.parse's any string values that look like JSON arrays.
 * @param {*} value - Any value to deserialize
 * @returns {*} - Deserialized value with arrays restored
 */
function deserializeNestedStrings(value) {
  if (value === null || value === undefined) return value;
  
  // If it's a string that looks like a JSON array, try to parse it
  if (typeof value === 'string') {
    if (value.startsWith('[')) {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.warn('[firebase-data] Failed to parse string as JSON:', e);
        return value;
      }
    }
    return value;
  }
  
  if (typeof value !== 'object') return value;
  
  if (Array.isArray(value)) {
    return value.map(item => deserializeNestedStrings(item));
  }
  
  // Plain object: deserialize each property
  const result = {};
  for (const [key, val] of Object.entries(value)) {
    result[key] = deserializeNestedStrings(val);
  }
  return result;
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
