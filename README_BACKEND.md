# Dura Backend

This branch contains the Python backend for the Dura application. The backend is built with Flask and provides API endpoints for the React frontend.

## Files

- `app.py` - The main Flask application
- `requirements.txt` - Python dependencies
- `api/index.py` - Vercel serverless function handler
- `vercel.json` - Vercel deployment configuration
- `netlify/functions/api.py` - Netlify Functions handler
- `netlify.toml` - Netlify deployment configuration
- `runtime.txt` - Python version for Netlify

## Setup

1. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python3 app.py
```

The server will start on port 5018 by default.

## Deployment

### Vercel Deployment

The application is configured for deployment on Vercel using the serverless function handler in `api/index.py`.

### Netlify Deployment

To deploy to Netlify:

1. Ensure you have the Netlify CLI installed:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Initialize a new Netlify site:
```bash
netlify init
```

4. Deploy your site:
```bash
netlify deploy --prod
```

Once deployed, your backend will be available at `https://your-site-name.netlify.app/.netlify/functions/api`. 