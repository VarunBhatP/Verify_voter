const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middleware/authMiddleware');

// Get the face verification URL from environment variables
const FACE_VERIFICATION_URL = process.env.FACE_VERIFICATION_URL || 'https://face-verification-369369713332.us-central1.run.app';

// Proxy endpoint for face registration
router.post('/proxy/register', authenticate, async (req, res) => {
  try {
    console.log('Proxying face registration request');
    const response = await axios.post(`${FACE_VERIFICATION_URL}/api/register`, req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error proxying face registration request:', error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ error: 'Failed to proxy request to face verification service' });
  }
});

// Proxy endpoint for face verification
router.post('/proxy/verify', authenticate, async (req, res) => {
  try {
    console.log('Proxying face verification request');
    const response = await axios.post(`${FACE_VERIFICATION_URL}/api/verify`, req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error proxying face verification request:', error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ error: 'Failed to proxy request to face verification service' });
  }
});

// Proxy endpoint for verify-voting
router.post('/proxy/verify-voting', authenticate, async (req, res) => {
  try {
    console.log('Proxying verify-voting request');
    const response = await axios.post(`${FACE_VERIFICATION_URL}/verify-voting`, req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error proxying verify-voting request:', error.message);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ error: 'Failed to proxy request to face verification service' });
  }
});

module.exports = router;
