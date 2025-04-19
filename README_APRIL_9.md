# MLSE Partner Research Application

This repository contains a full-stack application with a React frontend and Python Flask backend for MLSE Partner Research.

## Project Structure

```
frontend-1-2/
├── app.py                # Main Flask application
├── requirements.txt      # Python dependencies
├── dura-react/           # React frontend
│   ├── src/              # React source code
│   ├── package.json      # Node.js dependencies
│   └── vite.config.js    # Vite configuration
└── README.md             # Project documentation
```

## Setup Instructions

### Backend Setup

1. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the Flask backend:
   ```
   python3 app.py
   ```
   The backend will run on http://localhost:5018

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd dura-react
   ```

2. Install Node.js dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```
   The frontend will run on http://localhost:5173

## Git Branches

- `final`: The main branch with the stable version
- `april-9`: Branch created on April 9, 2025 for new development

## Environment Variables

The application uses environment variables for configuration. See `.env.example` for required variables.

## API Endpoints

The backend provides several API endpoints:
- `/search`: Search for companies
- `/ai-search`: AI-powered search
- `/company-details`: Get detailed company information
- `/company-research`: Get research on a company
- `/history`: Get search history

## License

This project is proprietary and confidential.
