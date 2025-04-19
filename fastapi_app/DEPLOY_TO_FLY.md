# Deploying to Fly.io

This guide will walk you through deploying your Dura FastAPI application to Fly.io.

## Prerequisites

1. Install the Fly.io CLI (flyctl):
   ```bash
   # For macOS
   brew install flyctl
   
   # For Linux
   curl -L https://fly.io/install.sh | sh
   
   # For Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. Sign up for Fly.io (if you haven't already):
   ```bash
   fly auth signup
   ```

3. Or login if you already have an account:
   ```bash
   fly auth login
   ```

## Deployment Options

### Option 1: Using the Automated Script (Recommended)

The easiest way to deploy is using the included script:

1. Navigate to your FastAPI app directory:
   ```bash
   cd fastapi_app
   ```

2. Make the deployment script executable:
   ```bash
   chmod +x deploy.sh
   ```

3. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

The script will:
- Check if flyctl is installed (and install it if needed)
- Log you in if needed
- Create a new app on Fly.io if it doesn't exist
- Set up your API keys as secrets
- Deploy your application
- Open the application in your browser

### Option 2: Manual Deployment

If you prefer to deploy manually:

1. Navigate to your FastAPI app directory:
   ```bash
   cd fastapi_app
   ```

2. Create a new app on Fly.io:
   ```bash
   fly apps create dura-api
   ```
   
   If this name is taken, choose a different one and update your fly.toml file:
   ```bash
   sed -i.bak "s/^app = .*/app = \"your-unique-app-name\"/" fly.toml
   ```

3. Set up secrets for your API keys:
   ```bash
   fly secrets set EXA_API_KEY="your_exa_api_key" OPENAI_API_KEY="your_openai_api_key"
   ```

4. Deploy your application:
   ```bash
   fly deploy
   ```

5. Open your application in the browser:
   ```bash
   fly open
   ```

## Managing Your Deployment

- View deployment details:
  ```bash
  fly status
  ```

- Check logs:
  ```bash
  fly logs
  ```

- Connect to your app via SSH:
  ```bash
  fly ssh console
  ```

- Scale your app:
  ```bash
  fly scale count 2  # Scale to 2 instances
  ```

## Working with Databases

If your application needs a database, you can set up a PostgreSQL database on Fly.io:

```bash
fly postgres create --name dura-db
```

Then attach it to your application:

```bash
fly postgres attach --postgres-app dura-db --app your-app-name
```

## Next Steps

After deploying, visit your application at:
```
https://your-app-name.fly.dev
```

API documentation will be available at:
```
https://your-app-name.fly.dev/docs
```

## Troubleshooting

- If your deployment fails, check the logs:
  ```bash
  fly logs
  ```

- Make sure all environment variables are set correctly:
  ```bash
  fly secrets list
  ```

- If you need to update your app, simply make changes and run:
  ```bash
  fly deploy
  ```
  
- If you get "App not found" errors, ensure you're using the correct app name:
  ```bash
  fly apps list
  ```
  
  Then you can specify the app name with the `-a` flag:
  ```bash
  fly deploy -a your-app-name
  ``` 