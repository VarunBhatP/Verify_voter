const express = require('express');
const router = express.Router();
const { verifyFace, validateFace } = require('../utils/faceVerification');

// Middleware to check if request has image data
const validateImageData = (req, res, next) => {
  if (!req.body.faceImage) {
    return res.status(400).json({
      success: false,
      message: 'Missing required field: faceImage'
    });
  }
  next();
};

// Initialize face models
router.get('/health', (req, res) => {
  return res.json({
    status: 'healthy',
    message: 'Face verification service is running'
  });
});

// Validate a single face image
router.post('/validate', validateImageData, async (req, res) => {
  try {
    const result = await validateFace(req.body.faceImage);
    return res.json(result);
  } catch (error) {
    console.error('Error validating face:', error);
    return res.status(500).json({
      success: false,
      message: `Error validating face: ${error.message}`
    });
  }
});

// Compare two face images for verification
router.post('/verify', async (req, res) => {
  try {
    if (!req.body.faceImage1 || !req.body.faceImage2) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: faceImage1 and faceImage2'
      });
    }

    const result = await verifyFace(req.body.faceImage1, req.body.faceImage2);
    return res.json(result);
  } catch (error) {
    console.error('Error verifying faces:', error);
    return res.status(500).json({
      success: false,
      message: `Error verifying faces: ${error.message}`
    });
  }
});

module.exports = router; 