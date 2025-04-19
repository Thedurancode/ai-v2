# DuraAI - AI-Powered Company Intelligence

A modern, dark-themed web application that leverages Exa and OpenAI APIs to provide intelligent company research and analysis.

## Features

- Sleek, modern dark UI
- AI-powered company analysis
- Source tracking and citation
- Responsive design for all devices

## Technologies Used

- **Backend**: Flask (Python)
- **Frontend**: React, Vite
- **APIs**: 
  - Exa API for web search and content retrieval
  - OpenAI API for intelligent analysis

## Setup (Local)

1. Clone this repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   cd dura-react
   npm install
   ```
3. Configure your API keys in the `.env` file:
   ```
   EXA_API_KEY=your_exa_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```
4. Run the application:
   ```
   # To run backend and frontend separately
   python app.py
   cd dura-react
   npm run dev
   
   # Or use the provided script to run both concurrently
   ./run_dev_concurrent.sh
   ```
5. Open your browser and navigate to `http://127.0.0.1:5000` for Flask or `http://localhost:5173` for the React dev server

## Setup (Replit)

1. Fork this Replit
2. Configure your API keys in the `.env` file
3. Press the "Run" button - this will:
   - Build the React frontend
   - Start the Flask backend that serves the React app
4. The app will be available at the Replit URL provided

## Usage

1. Enter a company name in the search box
2. View the AI-generated analysis in the "AI Analysis" tab
3. Check the sources used for the analysis in the "Sources" tab

## Note

This application requires valid API keys for both Exa and OpenAI. The Exa API key is provided, but you'll need to add your own OpenAI API key in the `.env` file.

## License

MIT
