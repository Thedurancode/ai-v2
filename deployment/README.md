# Dura - React Frontend + Python Backend

This repository contains a full-stack application with a React frontend and Python Flask backend.

## Project Structure

```
dura/
├── backend/          # Python Flask backend
│   ├── app.py        # Main Flask application
│   ├── requirements.txt
│   └── .env.example  # Environment variables example
├── frontend/         # React frontend
│   ├── src/          # React source code
│   ├── public/       # Static assets
│   ├── package.json
│   └── .env.example  # Environment variables example
└── README.md         # This file
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create and activate a virtual environment:
   ```
   python3 -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on `.env.example` and fill in your environment variables.

5. Run the backend server:
   ```
   python app.py
   ```

The backend will be available at http://localhost:5000.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` and fill in your environment variables.

4. Run the development server:
   ```
   npm run dev
   ```

The frontend will be available at http://localhost:5173.

## Production Deployment

### Backend Deployment

1. Set up appropriate environment variables in your production environment.
2. Use a production WSGI server like Gunicorn:
   ```
   gunicorn app:app
   ```

### Frontend Deployment

1. Build the production React application:
   ```
   npm run build
   ```
2. The built files will be in the `dist` directory, which can be deployed to a static hosting service.

## Environment Variables

### Backend `.env` Variables
- `OPENAI_API_KEY` - Your OpenAI API key
- Other API keys and configuration

### Frontend `.env` Variables
- `VITE_API_URL` - URL of the backend API (e.g., http://localhost:5000 for development) 