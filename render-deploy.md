# Deploying Dura Flask API to Render

This guide provides step-by-step instructions for deploying your Flask API to [Render](https://render.com/).

## Prerequisites

1. A GitHub repository with your Flask application code
2. A Render account (sign up at https://render.com if you don't have one)

## Deployment Steps

### 1. Push your code to GitHub

Make sure your code is pushed to a GitHub repository, as Render can automatically deploy from Git.

### 2. Create a new Web Service on Render

1. Log in to your Render dashboard
2. Click **New** and select **Web Service**
3. Connect your GitHub repository
4. Select the repository with your Flask application

### 3. Configure your Web Service

Enter the following configuration details:

- **Name**: `dura-api` (or your preferred name)
- **Environment**: `Python 3`
- **Region**: Choose the region closest to your users
- **Branch**: `main` (or your default branch)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120`

### 4. Set Environment Variables

Add the following environment variables (copy values from your local `.env` file):

```
FLASK_APP=app.py
FLASK_ENV=production
FLASK_DEBUG=0
PYTHONUNBUFFERED=1
DB_PATH=dura_history.db

# Add your API keys (copy from .env)
EXA_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
PERPLEXITY_API_KEY=your_key_here
RAPIDAPI_KEY=your_key_here
CORESIGNAL_API_KEY=your_key_here
DEEPSEEK_API_KEY=your_key_here
```

### 5. Create and Deploy

1. Click **Create Web Service**
2. Render will automatically build and deploy your application
3. You can monitor the build and deployment process in real-time

### 6. Access Your API

Once deployed, your API will be accessible at:

```
https://dura-api.onrender.com
```

Or at the custom URL provided by Render.

### 7. Testing Your Deployment

Test your API by accessing the health endpoint:

```
curl https://dura-api.onrender.com/health
```

### Troubleshooting

If you encounter any issues:

1. Check the Render logs from your dashboard
2. Verify that all environment variables are set correctly
3. Ensure your database is properly configured for production
4. Verify the `/health` endpoint responds with status "healthy" 