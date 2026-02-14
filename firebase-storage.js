// Firebase Storage Module
// SSOT JSJ Template v11.1 - Image Storage Management
// Purpose: Upload floor images to Firebase Storage instead of Base64 in Firestore

// Initialize Storage instance (requires firebase-config.js to be loaded first)
const storage = firebase.storage();

/**
 * Upload floor image to Firebase Storage
 * @param {string} projectId - Project identifier
 * @param {string} floorId - Floor identifier
 * @param {Blob} imageBlob - Image as Blob object
 * @returns {Promise<string>} Download URL of uploaded image
 */
async function uploadFloorImage(projectId, floorId, imageBlob) {
  try {
    // Create storage reference: projects/{projectId}/floors/{floorId}.png
    const storageRef = storage.ref(`projects/${projectId}/floors/${floorId}.png`);
    
    // Upload blob to Storage
    const snapshot = await storageRef.put(imageBlob, {
      contentType: 'image/png',
      cacheControl: 'public,max-age=3600'
    });
    
    // Get download URL
    const downloadURL = await snapshot.ref.getDownloadURL();
    
    console.log(`✅ Image uploaded: ${downloadURL}`);
    return downloadURL;
    
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    throw error;
  }
}

/**
 * Delete floor image from Firebase Storage
 * @param {string} imageUrl - Full download URL of the image to delete
 * @returns {Promise<void>}
 */
async function deleteFloorImage(imageUrl) {
  try {
    // Extract storage path from URL
    // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token=...
    const storageRef = storage.refFromURL(imageUrl);
    
    // Delete the file
    await storageRef.delete();
    
    console.log(`✅ Image deleted: ${imageUrl}`);
    
  } catch (error) {
    // Ignore error if file doesn't exist
    if (error.code === 'storage/object-not-found') {
      console.warn('⚠️ Image not found (already deleted?):', imageUrl);
    } else {
      console.error('❌ Error deleting image:', error);
      throw error;
    }
  }
}

/**
 * Convert Base64 string to Blob object
 * @param {string} base64String - Base64 encoded image (with data:image/... prefix)
 * @returns {Blob} Blob object ready for upload
 */
function base64ToBlob(base64String) {
  try {
    // Extract content type and data
    // Example: "data:image/png;base64,iVBORw0KG..."
    const parts = base64String.split(',');
    const contentType = parts[0].match(/:(.*?);/)[1];
    const base64Data = parts[1];
    
    // Decode Base64 to binary
    const binaryString = atob(base64Data);
    
    // Convert binary string to byte array
    const byteArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      byteArray[i] = binaryString.charCodeAt(i);
    }
    
    // Create and return Blob
    return new Blob([byteArray], { type: contentType });
    
  } catch (error) {
    console.error('❌ Error converting Base64 to Blob:', error);
    throw error;
  }
}

// Export functions (for module usage)
// If using as script tag, functions are already globally available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    uploadFloorImage,
    deleteFloorImage,
    base64ToBlob
  };
}
