# Deployment Guide

This guide will help you prepare and deploy your React frontend and Python backend application to a new repository.

## Step 1: Prepare Your Code for the New Repository

1. **Create a new GitHub repository**
   - Go to GitHub and create a new repository
   - Do not initialize it with a README, .gitignore, or license

2. **Clone your new repository locally**
   ```bash
   git clone https://github.com/yourusername/your-new-repo.git
   cd your-new-repo
   ```

3. **Copy the deployment files to your new repository**
   ```bash
   # Copy all deployment files
   cp -r /path/to/deployment/* .
   ```

## Step 2: Organize Your Codebase

1. **Prepare the backend**
   ```bash
   # Copy your backend Python code
   cp /path/to/app.py backend/
   cp /path/to/.env backend/ # Be careful not to commit sensitive information
   
   # If you have other backend files, copy them as well
   # cp /path/to/other_files backend/
   ```

2. **Prepare the frontend**
   ```bash
   # Copy your React frontend code
   cp -r /path/to/dura-react/src frontend/
   cp -r /path/to/dura-react/public frontend/ # If you have a public directory
   cp /path/to/dura-react/package.json frontend/
   cp /path/to/dura-react/package-lock.json frontend/
   cp /path/to/dura-react/vite.config.js frontend/
   cp /path/to/dura-react/index.html frontend/
   
   # Copy .env file (make sure to remove sensitive information)
   cp /path/to/dura-react/.env frontend/
   ```

## Step 3: Update Configuration Files

1. **Update backend environment variables**
   - Review and update the `.env` file in the `backend` directory
   - Make sure all required environment variables are set

2. **Update frontend environment variables**
   - Review and update the `.env` file in the `frontend` directory
   - Update API URL if needed (e.g., `VITE_API_URL=/api`)

3. **Adjust Docker Compose configuration if needed**
   - Review `docker-compose.yml` and make any necessary changes

## Step 4: Commit and Push to GitHub

1. **Initialize Git, commit and push your code**
   ```bash
   git add .
   git commit -m "Initial commit: Deploy React frontend and Python backend"
   git push origin main
   ```

## Step 5: Deploy Your Application

### Option 1: Deploy with Docker Compose

1. **On your server, clone the repository**
   ```bash
   git clone https://github.com/yourusername/your-new-repo.git
   cd your-new-repo
   ```

2. **Create .env files**
   ```bash
   # Create backend .env file
   cp backend/.env.example backend/.env
   # Edit the .env file with your actual values
   
   # Create frontend .env file if needed
   cp frontend/.env.example frontend/.env
   # Edit the .env file with your actual values
   ```

3. **Build and start the containers**
   ```bash
   docker-compose up -d --build
   ```

### Option 2: Deploy to a PaaS Provider

Many Platform as a Service (PaaS) providers like Heroku, Render, or Railway support deploying both frontend and backend applications.

1. Follow the provider's instructions for deploying:
   - Backend: Python Flask application
   - Frontend: Static React application

## Step 6: Post-Deployment Tasks

1. **Set up a custom domain (if needed)**
2. **Configure SSL/TLS**
3. **Set up CI/CD pipelines**
4. **Monitor your application**

## Troubleshooting

- **Backend API not accessible**: Ensure your CORS settings are properly configured
- **Frontend not connecting to backend**: Check that API URLs are correctly set
- **Database issues**: Verify database connection parameters and ensure the database is running 