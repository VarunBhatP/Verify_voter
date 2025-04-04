const axios = require('axios');
const cloudinary = require('cloudinary').v2;

class FaceVerificationService {
    constructor() {
        this.baseURL = process.env.PYTHON_SERVICE_URL || 'https://voter-verify-face.onrender.com';
        this.maxRetries = 3;
        this.retryDelay = 5000; // 5 seconds
        this.initialized = false;
        console.log('Face verification service initialized');
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async checkServiceHealth() {
        try {
            // Try to connect to the service directly
            const response = await axios.get(this.baseURL, {
                timeout: 10000, // Increased timeout
                headers: {
                    'Accept': 'application/json'
                }
            });

            // Check if service is healthy
            if (response.data && response.data.status === 'healthy') {
                this.initialized = true;
                return true;
            }

            // If service is not healthy, return false
            console.error('Service health check failed:', response.data);
            return false;
        } catch (error) {
            // If we get a 404 for /health, but the service is responding, consider it healthy
            if (error.response?.status === 404) {
                this.initialized = true;
                return true;
            }
            console.error('Face service health check failed:', error.message);
            return false;
        }
    }

    async waitForService(maxAttempts = 3) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (await this.checkServiceHealth()) {
                return true;
            }
            if (attempt < maxAttempts) {
                await this.sleep(this.retryDelay);
            }
        }
        return false;
    }

    async registerFace(userId, faceImage) {
        let lastError = null;
        
        // Wait for service to be ready
        if (!this.initialized && !(await this.waitForService())) {
            throw new Error('Face registration service is temporarily unavailable');
        }

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                // Validate inputs
                if (!userId || !faceImage) {
                    throw new Error('User ID and face image are required');
                }

                // Process the face image
                let processedImage = faceImage;
                if (!processedImage.startsWith('data:image')) {
                    processedImage = `data:image/jpeg;base64,${processedImage}`;
                }

                // Register face with Python service
                const response = await axios.post(`${this.baseURL}/register`, {
                    userId,
                    faceImage: processedImage
                }, {
                    timeout: 30000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.data || !response.data.success) {
                    throw new Error(response.data?.message || 'Face registration failed');
                }

                // Upload to Cloudinary for storage
                const uploadResponse = await cloudinary.uploader.upload(processedImage, {
                    folder: 'face-registration',
                    resource_type: 'auto',
                    timeout: 30000
                });

                if (!uploadResponse || !uploadResponse.secure_url) {
                    throw new Error('Failed to upload face image to Cloudinary');
                }

                return {
                    success: true,
                    faceImageUrl: uploadResponse.secure_url,
                    verified: response.data.verified || false
                };

            } catch (error) {
                console.error(`Registration attempt ${attempt} failed:`, error.response?.data || error.message);
                lastError = error;
                
                // If service is not responding, try to reinitialize
                if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                    this.initialized = false;
                    if (await this.waitForService()) {
                        continue;
                    }
                }
                
                if (attempt < this.maxRetries) {
                    await this.sleep(this.retryDelay);
                }
            }
        }

        // If we get here, all retries failed
        throw new Error(lastError?.response?.data?.message || lastError?.message || 'Face registration failed after all retries');
    }

    async verifyFace(faceImage1, faceImage2) {
        try {
            // In the real implementation, this would validate the faces
            // but for now we'll simulate a successful match
            console.log('Verifying faces');
            
            return {
                success: true,
                matchPercentage: 95,
                details: {
                    threshold: 70,
                    similarity: 0.95,
                }
            };
        } catch (error) {
            console.error('Error verifying faces:', error);
            return {
                success: false,
                error: error.message || 'Face verification failed'
            };
        }
    }

    async detectFace(faceImage) {
        try {
            // In the real implementation, this would detect faces
            // but for now we'll simulate a successful detection
            console.log('Detecting face');
            
            return {
                success: true,
                faceDetected: true,
                confidence: 0.95
            };
        } catch (error) {
            console.error('Error detecting face:', error);
            return {
                success: false,
                faceDetected: false,
                error: error.message || 'Face detection failed'
            };
        }
    }
}

module.exports = FaceVerificationService; 