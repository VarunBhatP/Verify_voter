# Google Cloud Platform Deployment Guide for E-Vote Application

This guide will walk you through deploying your E-Vote application on Google Cloud Platform using Docker containers.

## Prerequisites

- A Google Cloud Platform account
- Your application code (already available in your GitHub repository)
- MongoDB database (either MongoDB Atlas or self-hosted)

## Step 1: Set Up Your Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
   - Click on the project dropdown at the top of the page
   - Click "NEW PROJECT"
   - Enter a project name (e.g., "E-Vote Application")
   - Click "CREATE"

3. Enable required APIs:
   - Go to "APIs & Services" > "Library"
   - Search for and enable the following APIs:
     - Container Registry API
     - Cloud Run API
     - Cloud Build API
     - Artifact Registry API

## Step 2: Set Up MongoDB

### Option 1: MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free or paid cluster
3. Configure network access to allow connections from anywhere (or specifically from Google Cloud IPs)
4. Create a database user with appropriate permissions
5. Get your connection string (format: `mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority`)

### Option 2: Self-hosted MongoDB on GCP

1. Create a Compute Engine VM instance
2. Install and configure MongoDB
3. Set up proper networking and security

## Step 3: Push Your Code to Cloud Source Repositories (Optional)

1. Go to "Source Repositories" in Google Cloud Console
2. Click "ADD REPOSITORY"
3. Select "Connect external repository"
4. Connect to your GitHub repository

## Step 4: Build and Deploy Using Cloud Build and Cloud Run

### For the Face Verification Server:

1. Go to "Cloud Run" in the Google Cloud Console
2. Click "CREATE SERVICE"
3. Choose "Continuously deploy from a repository" or "Deploy a container image"
4. If deploying from repository:
   - Connect your repository
   - Configure the build
   - Set the Dockerfile path to `Dockerfile`
   - Set the service name to "evote-face-verification"
   - Configure memory (2GB) and CPU (2)
   - Set the port to 5001
   - Add environment variables:
     - `PORT`: 5001
     - `PYTHONUNBUFFERED`: 1
     - `DEEPFACE_HOME`: /app/deepface_weights
   - Set the timeout to 300 seconds
   - Click "CREATE"

### For the Node.js Backend:

1. Go to "Cloud Run" in the Google Cloud Console
2. Click "CREATE SERVICE"
3. Choose "Continuously deploy from a repository" or "Deploy a container image"
4. If deploying from repository:
   - Connect your repository
   - Configure the build
   - Set the Dockerfile path to `Dockerfile.backend`
   - Set the service name to "evote-backend"
   - Configure memory (1GB) and CPU (1)
   - Set the port to 3000
   - Add environment variables:
     - `NODE_ENV`: production
     - `PORT`: 3000
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: Your JWT secret key
     - `FACE_VERIFICATION_URL`: URL of your face verification service (will be available after deployment)
   - Click "CREATE"

5. After the face verification service is deployed, update the `FACE_VERIFICATION_URL` environment variable in the backend service with the actual URL.

## Step 5: Configure Service Connections

1. Go to "Cloud Run" and select your backend service
2. Click "EDIT & DEPLOY NEW REVISION"
3. Update the `FACE_VERIFICATION_URL` environment variable with the URL of your face verification service
4. Click "DEPLOY"

## Step 6: Set Up Custom Domain (Optional)

1. Go to "Cloud Run" and select your backend service
2. Click on the "DOMAIN MAPPINGS" tab
3. Click "ADD MAPPING"
4. Follow the instructions to map your custom domain

## Step 7: Monitoring and Scaling

1. Go to "Monitoring" in the Google Cloud Console
2. Set up dashboards and alerts for your services
3. Configure auto-scaling in the Cloud Run service settings

## Troubleshooting

- Check service logs in the Cloud Run console
- Verify environment variables are correctly set
- Ensure services can communicate with each other
- Check MongoDB connection is working properly

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Google Cloud Build Documentation](https://cloud.google.com/build/docs)
