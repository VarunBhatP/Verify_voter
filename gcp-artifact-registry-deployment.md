# Deploying E-Vote Application to Google Cloud Platform with Artifact Registry

This guide provides detailed steps for deploying your E-Vote application to Google Cloud Platform using Artifact Registry and Cloud Run.

## Prerequisites

- A Google Cloud Platform account
- Docker installed on your local machine
- Your application code (already in your GitHub repository)
- MongoDB database (either MongoDB Atlas or self-hosted)

## Step 1: Set Up Google Cloud Project via Web Console

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project:
   - Click on the project dropdown at the top of the page
   - Click "NEW PROJECT"
   - Enter a project name (e.g., "E-Vote Application")
   - Click "CREATE"
3. Select your new project from the dropdown once it's created

## Step 2: Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable the following APIs:
   - Artifact Registry API
   - Cloud Run API
   - Cloud Build API

## Step 3: Set Up Artifact Registry

1. Go to "Artifact Registry" in the Google Cloud Console
2. Click "CREATE REPOSITORY"
3. Enter a name for your repository (e.g., "evote-docker-repo")
4. Select "Docker" as the format
5. Choose a region (e.g., "us-central1")
6. Click "CREATE"

## Step 4: Set Up MongoDB

### Option 1: MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free or paid cluster
3. Configure network access to allow connections from anywhere (or specifically from Google Cloud IPs)
4. Create a database user with appropriate permissions
5. Get your connection string

### Option 2: Self-hosted MongoDB on GCP

1. Create a Compute Engine VM instance
2. Install and configure MongoDB
3. Set up proper networking and security

## Step 5: Prepare Your Application for Deployment

1. Make sure your Dockerfile and Dockerfile.backend are optimized for production
2. Update any configuration files as needed
3. Test your Docker builds locally:
   ```
   docker build -t evote-face-verification:latest -f Dockerfile .
   docker build -t evote-backend:latest -f Dockerfile.backend .
   ```

## Step 6: Deploy Using Google Cloud Console

### For the Face Verification Server:

1. Go to "Cloud Run" in the Google Cloud Console
2. Click "CREATE SERVICE"
3. Choose "Deploy one revision from an existing container image"
4. Click "SELECT" to choose a container image
5. Select "Artifact Registry" and your repository
6. Click "SETUP WITH CLOUD BUILD"
7. Connect to your GitHub repository
8. Configure the build:
   - Set the Dockerfile path to `Dockerfile`
   - Set the context directory to the root of your repository
9. Click "CREATE" to build the image
10. Configure the service:
    - Set the service name to "evote-face-verification"
    - Choose a region
    - Set CPU allocation to "CPU is only allocated during request processing"
    - Set memory to 2GB
    - Set maximum number of instances (e.g., 10)
    - Set the container port to 5001
    - Add environment variables:
      - `PORT`: 5001
      - `PYTHONUNBUFFERED`: 1
      - `DEEPFACE_HOME`: /app/deepface_weights
    - Under "Container" settings, set the timeout to 300 seconds
    - Under "Security", select "Allow unauthenticated invocations"
11. Click "CREATE"

### For the Node.js Backend:

1. Go to "Cloud Run" in the Google Cloud Console
2. Click "CREATE SERVICE"
3. Choose "Deploy one revision from an existing container image"
4. Click "SELECT" to choose a container image
5. Select "Artifact Registry" and your repository
6. Click "SETUP WITH CLOUD BUILD"
7. Connect to your GitHub repository
8. Configure the build:
   - Set the Dockerfile path to `Dockerfile.backend`
   - Set the context directory to the root of your repository
9. Click "CREATE" to build the image
10. Configure the service:
    - Set the service name to "evote-backend"
    - Choose the same region as your face verification service
    - Set CPU allocation to "CPU is only allocated during request processing"
    - Set memory to 1GB
    - Set maximum number of instances (e.g., 10)
    - Set the container port to 3000
    - Add environment variables:
      - `NODE_ENV`: production
      - `PORT`: 3000
      - `MONGODB_URI`: Your MongoDB connection string
      - `JWT_SECRET`: Your JWT secret key
      - `FACE_VERIFICATION_URL`: URL of your face verification service (will be available after deployment)
    - Under "Security", select "Allow unauthenticated invocations"
11. Click "CREATE"

## Step 7: Configure Service Connections

1. After both services are deployed, go to the face verification service details page
2. Copy the URL (it will look like https://evote-face-verification-xxxxx-xx.a.run.app)
3. Go to the backend service
4. Click "EDIT & DEPLOY NEW REVISION"
5. Update the `FACE_VERIFICATION_URL` environment variable with the URL of your face verification service
6. Click "DEPLOY"

## Step 8: Set Up Continuous Deployment (Optional)

1. Go to "Cloud Build" in the Google Cloud Console
2. Click "TRIGGERS"
3. Click "CREATE TRIGGER"
4. Configure the trigger to automatically build and deploy when you push to your GitHub repository

## Step 9: Monitoring and Scaling

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
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
