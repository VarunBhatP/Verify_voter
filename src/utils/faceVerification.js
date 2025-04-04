const Human = require('@vladmandic/human');
const canvas = require('canvas');
const fs = require('fs');
const path = require('path');

// Initialize Human with needed models
const human = new Human.Human({
  // Optimize for memory usage in Render's free tier
  backend: 'wasm',
  modelBasePath: path.join(__dirname, '../../models'),
  face: {
    enabled: true,
    detector: {
      enabled: true,
      rotation: false,
      return: true,
      maxDetected: 10,
      minConfidence: 0.3,
      cropFactor: 1.4,
    },
    description: {
      enabled: true,
    },
    antispoof: {
      enabled: true,
    },
    liveness: {
      enabled: true,
    },
  },
  body: { enabled: false },
  hand: { enabled: false },
  object: { enabled: false },
  gesture: { enabled: false },
});

// Directory for model caching
const modelsDir = path.join(__dirname, '../../models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// Initialize face models (run once at startup)
const initModels = async () => {
  console.log('Initializing face verification models...');
  await human.load();
  console.log('Face verification models loaded successfully');
  return true;
};

// Compare two face images
const verifyFace = async (image1Base64, image2Base64) => {
  try {
    // Decode base64 images
    const img1Buffer = Buffer.from(image1Base64.split(',')[1] || image1Base64, 'base64');
    const img2Buffer = Buffer.from(image2Base64.split(',')[1] || image2Base64, 'base64');
    
    // Create canvas images
    const img1 = await canvas.loadImage(img1Buffer);
    const img2 = await canvas.loadImage(img2Buffer);
    
    // Create canvases
    const cnv1 = canvas.createCanvas(img1.width, img1.height);
    const ctx1 = cnv1.getContext('2d');
    ctx1.drawImage(img1, 0, 0);
    
    const cnv2 = canvas.createCanvas(img2.width, img2.height);
    const ctx2 = cnv2.getContext('2d');
    ctx2.drawImage(img2, 0, 0);
    
    // Detect faces and get embeddings
    const result1 = await human.detect(cnv1);
    const result2 = await human.detect(cnv2);
    
    // Check if faces were found in both images
    if (!result1.face || result1.face.length === 0) {
      return { success: false, message: 'No face detected in the first image' };
    }
    
    if (!result2.face || result2.face.length === 0) {
      return { success: false, message: 'No face detected in the second image' };
    }
    
    // Get the descriptors (embeddings)
    const descriptor1 = result1.face[0].embedding;
    const descriptor2 = result2.face[0].embedding;
    
    if (!descriptor1 || !descriptor2) {
      return { success: false, message: 'Failed to extract face features' };
    }
    
    // Calculate similarity (cosine distance)
    const distance = human.similarity(descriptor1, descriptor2);
    
    // Check liveness and spoof detection
    const liveness1 = result1.face[0].liveness?.score || 0;
    const liveness2 = result2.face[0].liveness?.score || 0;
    const spoof1 = result1.face[0].anti?.spoof?.score || 0;
    const spoof2 = result2.face[0].anti?.spoof?.score || 0;
    
    // Threshold for face match
    const threshold = 0.7; // Adjust based on testing
    const livenessThreshold = 0.5;
    const spoofThreshold = 0.5;
    
    // Prepare response
    const response = {
      success: true,
      verified: distance > threshold,
      distance: distance,
      threshold: threshold,
      confidence: result1.face[0].score,
      liveness: (liveness1 + liveness2) / 2,
      livenessPass: (liveness1 + liveness2) / 2 > livenessThreshold,
      spoofScore: (spoof1 + spoof2) / 2,
      spoofPass: (spoof1 + spoof2) / 2 > spoofThreshold,
      details: {
        faceDetected: {
          image1: result1.face.length > 0,
          image2: result2.face.length > 0,
        },
        faceCount: {
          image1: result1.face.length,
          image2: result2.face.length,
        },
      }
    };
    
    return response;
  } catch (error) {
    console.error('Error verifying face:', error);
    return {
      success: false,
      message: `Error verifying face: ${error.message}`,
    };
  }
};

// Check if a single image contains a valid face
const validateFace = async (imageBase64) => {
  try {
    // Decode base64 image
    const imgBuffer = Buffer.from(imageBase64.split(',')[1] || imageBase64, 'base64');
    
    // Create canvas image
    const img = await canvas.loadImage(imgBuffer);
    
    // Create canvas
    const cnv = canvas.createCanvas(img.width, img.height);
    const ctx = cnv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    // Detect face
    const result = await human.detect(cnv);
    
    // Check if face was found
    if (!result.face || result.face.length === 0) {
      return { success: false, message: 'No face detected in the image' };
    }
    
    // Check liveness and spoof detection
    const liveness = result.face[0].liveness?.score || 0;
    const spoof = result.face[0].anti?.spoof?.score || 0;
    
    // Thresholds
    const livenessThreshold = 0.5;
    const spoofThreshold = 0.5;
    
    // Prepare response
    const response = {
      success: true,
      faceDetected: result.face.length > 0,
      confidence: result.face[0].score,
      liveness: liveness,
      livenessPass: liveness > livenessThreshold,
      spoofScore: spoof,
      spoofPass: spoof > spoofThreshold,
      details: {
        faceCount: result.face.length,
        boundingBox: result.face[0].box,
        landmarks: result.face[0].landmarks,
      }
    };
    
    return response;
  } catch (error) {
    console.error('Error validating face:', error);
    return {
      success: false,
      message: `Error validating face: ${error.message}`,
    };
  }
};

// Export functions
module.exports = {
  initModels,
  verifyFace,
  validateFace
}; 