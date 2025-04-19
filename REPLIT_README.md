# MLSE AI Search - Replit Setup

This application combines a React frontend (dura-react) with a Flask backend (app.py) to provide a powerful search and analysis tool for potential business partners.

## Setup Instructions

1. **Environment Variables**:
   - Copy the contents of `.env.replit` to the Replit Secrets panel
   - Make sure to replace all placeholder values with your actual API keys and credentials

2. **Running the Application**:
   - Click the "Run" button in Replit
   - The setup script will:
     - Install Python dependencies
     - Install Node.js dependencies
     - Build the React frontend
     - Start the Flask backend

3. **Accessing the Application**:
   - Once running, click on the browser icon in the Replit window
   - The application should load with the login screen

## Troubleshooting

If you encounter any issues:

1. **Frontend Build Fails**:
   - Check the console for error messages
   - Make sure Node.js and npm are properly installed
   - Try running `npm install` and `npm run build` manually in the dura-react directory

2. **Backend Fails to Start**:
   - Check that all required environment variables are set
   - Verify that the port (5020) is available
   - Check for any Python dependency issues

3. **API Connection Issues**:
   - Verify that the backend is running on port 5020
   - Check that CORS is properly configured
   - Ensure the frontend is configured to connect to the correct backend URL

## File Structure

- `app.py`: Main Flask application
- `dura-react/`: React frontend
  - `src/`: Source code
  - `dist/`: Built application (created during setup)
- `run.sh`: Setup and run script
- `.replit`: Replit configuration
- `replit.nix`: Nix environment configuration
- `Procfile`: Process configuration for deployment
