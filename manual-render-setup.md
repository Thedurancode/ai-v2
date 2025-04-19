# Manual Render Deployment Setup

Since Render is using the `main` branch by default instead of our `neon-migration` branch, let's manually configure a deployment:

## Step 1: Create a New Web Service

1. Go to your Render Dashboard: https://dashboard.render.com/
2. Click on "New" in the top right corner
3. Select "Web Service"

## Step 2: Connect Your Repository

1. Connect your GitHub repository if you haven't already
2. Select "Thedurancode/frontend" as your repository
3. **Important**: Select the "neon-migration" branch from the dropdown

## Step 3: Configure Your Service

Enter the following configuration:
- **Name**: dura-api
- **Environment**: Python
- **Region**: Oregon
- **Branch**: neon-migration
- **Build Command**: 
```
pip install -r requirements.txt && python -c "import os; os.makedirs('/app/data', exist_ok=True)"
```
- **Start Command**: 
```
gunicorn app:app --bind 0.0.0.0:$PORT --timeout 900
```
- **Instance Type**: Free

## Step 4: Add Environment Variables

Add the following environment variables:
- FLASK_APP = app.py
- FLASK_ENV = production
- DB_PATH = dura_history.db
- DATABASE_PATH = /app/data/dura_history.db
- PYTHONUNBUFFERED = 1
- CORS_ALLOW_ALL = true
- OPENAI_API_MODEL = gpt-4o
- GUNICORN_TIMEOUT = 900
- GUNICORN_WORKERS = 2
- GUNICORN_THREADS = 8
- GUNICORN_GRACEFUL_TIMEOUT = 600
- GUNICORN_KEEPALIVE = 120
- AXIOS_TIMEOUT = 60000
- USE_POSTGRES = true

## Step 5: Add Secret Environment Variables
These need to be added manually:
- EXA_API_KEY
- OPENAI_API_KEY
- PERPLEXITY_API_KEY
- RAPIDAPI_KEY
- CORESIGNAL_API_KEY
- DEEPSEEK_API_KEY

## Step 6: Create a PostgreSQL Database

1. Go back to your Render Dashboard
2. Click on "New" again
3. Select "PostgreSQL"
4. Configure:
   - **Name**: dura-db
   - **Region**: Oregon
   - **Instance Type**: Free
5. After creation, get the Internal Database URL
6. Add the DATABASE_URL environment variable to your web service with this connection string

## Step 7: Deploy

Click "Create Web Service" to deploy your application.

After deployment, your application will be available at https://dura-api.onrender.com (or a custom URL provided by Render). 