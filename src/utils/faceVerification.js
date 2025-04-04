// Simple mock implementation without TensorFlow dependencies
const fs = require('fs');
const path = require('path');

// Mocked initialization function
const initModels = async () => {
  console.log('Using simple face verification implementation (no TensorFlow)');
  return true;
};

// Mocked face verification with fixed responses
const verifyFace = async (image1Base64, image2Base64) => {
  try {
    // Check if the images are valid base64
    if (!image1Base64 || !image2Base64) {
      return { 
        success: false, 
        message: 'Invalid image data provided' 
      };
    }
    
    // Always return successful verification with random similarity
    // In a real implementation, this would use actual face comparison
    const similarity = Math.random() * 0.3 + 0.7; // Random value between 0.7 and 1.0
    
    return {
      success: true,
      verified: true,
      distance: similarity,
      threshold: 0.7,
      confidence: 0.95,
      liveness: 0.9,
      livenessPass: true,
      spoofScore: 0.85,
      spoofPass: true,
      details: {
        faceDetected: {
          image1: true,
          image2: true,
        },
        faceCount: {
          image1: 1,
          image2: 1,
        },
      }
    };
  } catch (error) {
    console.error('Error in face verification:', error);
    return {
      success: false,
      message: `Error verifying face: ${error.message}`
    };
  }
};

// Mocked face validation with fixed responses
const validateFace = async (imageBase64) => {
  try {
    // Check if the image is valid base64
    if (!imageBase64) {
      return { 
        success: false, 
        message: 'Invalid image data provided' 
      };
    }
    
    // Always return successful validation
    // In a real implementation, this would detect actual faces
    return {
      success: true,
      faceDetected: true,
      confidence: 0.95,
      liveness: 0.9,
      livenessPass: true,
      spoofScore: 0.85,
      spoofPass: true,
      details: {
        faceCount: 1,
        boundingBox: { x: 100, y: 100, width: 200, height: 200 },
        landmarks: {
          eyes: [
            { x: 150, y: 150 },
            { x: 250, y: 150 }
          ],
          nose: { x: 200, y: 200 },
          mouth: { x: 200, y: 250 }
        }
      }
    };
  } catch (error) {
    console.error('Error validating face:', error);
    return {
      success: false,
      message: `Error validating face: ${error.message}`
    };
  }
};

// Export functions
module.exports = {
  initModels,
  verifyFace,
  validateFace
}; 