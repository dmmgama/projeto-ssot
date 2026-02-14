/**
 * SSOT JSJ Template - Firebase Firestore Data Layer (v11.1)
 * Abstraction layer for Firestore CRUD operations
 * Handles Map serialization/deserialization for projectData structure
 * v11.1: Firebase Storage integration + Flatten nested arrays
 */

// Assumes firebase-config.js is already loaded (provides 'db' global)
// Assumes firebase-storage.js is already loaded (provides Storage functions)

// ==================== CREATE ====================

/**
 * Creates a new project in Firestore with audit metadata
 * v11.1: Upload images to Storage before saving
 * @param {Object} projectData - Project data with Maps (floors, zones, geoHorizons)
 * @param {string} userId - Firebase user UID (owner)
 * @returns {Promise<string>} - Project ID
 */
async function createProjectInFirestore(projectData, userId) {
  try {
    const now = new Date().toISOString();
    
    // v11.1: Upload Base64 images to Storage
    await uploadFloorImagesToStorage(projectData);
    
    // Serialize Maps to Arrays + Flatten nested arrays
    const serializedData = flattenProjectData({
      ...projectData,
      owner: userId,
      createdAt: now,
      updatedAt: now
    });
    
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
 * v11.1: Upload images to Storage before saving
 * @param {Object} projectData - Project data with Maps
 * @returns {Promise<void>}
 */
async function saveProjectToFirestore(projectData) {
  try {
    const now = new Date().toISOString();
    
    // v11.1: Upload Base64 images to Storage
    await uploadFloorImagesToStorage(projectData);
    
    // Serialize Maps to Arrays + Flatten nested arrays
    const serializedData = flattenProjectData({
      ...projectData,
      updatedAt: now
    });
    
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

// ==================== STORAGE INTEGRATION (v11.1) ====================

/**
 * Upload floor images from Base64 to Firebase Storage
 * Replaces imageData with imageUrl in actionsData.blueprint
 * @param {Object} projectData - Project data with floors Map
 * @returns {Promise<void>}
 */
async function uploadFloorImagesToStorage(projectData) {
  if (!projectData.floors || !(projectData.floors instanceof Map)) {
    return;
  }
  
  const uploadPromises = [];
  
  for (const [floorId, floor] of projectData.floors.entries()) {
    // Check if floor has Base64 image data
    if (floor.actionsData?.blueprint?.imageData?.startsWith('data:image')) {
      const uploadPromise = (async () => {
        try {
          // Convert Base64 to Blob
          const blob = base64ToBlob(floor.actionsData.blueprint.imageData);
          
          // Upload to Storage
          const url = await uploadFloorImage(projectData.id, floorId, blob);
          
          // Replace imageData with imageUrl
          floor.actionsData.blueprint.imageUrl = url;
          delete floor.actionsData.blueprint.imageData;
          
          console.log(`[firebase-data] Uploaded image for floor ${floorId}`);
        } catch (error) {
          console.error(`[firebase-data] Failed to upload image for floor ${floorId}:`, error);
          // Keep imageData if upload fails (fallback)
        }
      })();
      
      uploadPromises.push(uploadPromise);
    }
  }
  
  // Wait for all uploads to complete
  await Promise.all(uploadPromises);
}

/**
 * Flatten project data for Firestore storage
 * Converts Maps to Arrays and flattens nested arrays in shapes
 * @param {Object} projectData - Project data with Maps
 * @returns {Object} - Flattened data ready for Firestore
 */
function flattenProjectData(projectData) {
  const floorsArray = serializeFloorsMap(projectData.floors);
  
  // Flatten nested arrays in actionsData.layers
  const flattenedFloors = floorsArray.map(floor => {
    if (floor.actionsData?.layers) {
      const flattenedLayers = floor.actionsData.layers.map(layer => {
        // Flatten shapes: [[{x,y}]] → [{points: [{x,y}]}]
        if (layer.shapes && Array.isArray(layer.shapes)) {
          const flattenedShapes = layer.shapes.map(shape => {
            if (Array.isArray(shape) && shape.length > 0 && Array.isArray(shape[0])) {
              // Nested array detected: [[{x,y}]] → {points: [{x,y}]}
              return {
                points: shape[0] || []
              };
            }
            // Already flattened or object format
            return shape;
          });
          
          return {
            ...layer,
            shapes: flattenedShapes
          };
        }
        return layer;
      });
      
      return {
        ...floor,
        actionsData: {
          ...floor.actionsData,
          layers: flattenedLayers
        }
      };
    }
    return floor;
  });
  
  return {
    ...projectData,
    floors: flattenedFloors,
    geoHorizons: serializeGeoHorizonsMap(projectData.geoHorizons)
  };
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
    // Serialize nested zones Map
    const zonesArray = floor.zones instanceof Map 
      ? Array.from(floor.zones.values())
      : [];
    
    return {
      ...floor,
      zones: zonesArray
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
 * v11.1: Unflatten shapes back to nested arrays
 * @param {Array} floorsArray - Array of floor objects
 * @returns {Map} - Map of floors with zones Maps
 */
function deserializeFloorsArray(floorsArray) {
  if (!floorsArray || !Array.isArray(floorsArray)) {
    return new Map();
  }
  
  const floorsMap = new Map();
  
  floorsArray.forEach(floor => {
    // Deserialize nested zones Array to Map
    const zonesMap = new Map();
    if (floor.zones && Array.isArray(floor.zones)) {
      floor.zones.forEach(zone => {
        zonesMap.set(zone.id, zone);
      });
    }
    
    // v11.1: Unflatten shapes in actionsData.layers
    let processedFloor = { ...floor, zones: zonesMap };
    
    if (floor.actionsData?.layers) {
      const unflatttenedLayers = floor.actionsData.layers.map(layer => {
        // Unflatten shapes: [{points: [{x,y}]}] → [[{x,y}]]
        if (layer.shapes && Array.isArray(layer.shapes)) {
          const unflattenedShapes = layer.shapes.map(shape => {
            if (shape.points && Array.isArray(shape.points)) {
              // Flattened format detected: {points: [...]} → [[...]]
              return [shape.points];
            }
            // Already in nested array format or other format
            return shape;
          });
          
          return {
            ...layer,
            shapes: unflattenedShapes
          };
        }
        return layer;
      });
      
      processedFloor = {
        ...processedFloor,
        actionsData: {
          ...floor.actionsData,
          layers: unflatttenedLayers
        }
      };
    }
    
    floorsMap.set(floor.id, processedFloor);
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
