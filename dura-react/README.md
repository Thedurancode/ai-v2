# MLSE Partner Research React App

A modern React application for MLSE Partner Research with a dark theme and animations. This application provides a sleek interface for searching and analyzing partnership opportunities.

## Features

- Modern dark theme design
- Smooth animations using Framer Motion
- Responsive layout
- Real-time search status updates
- Company cards with partnership scores
- Detailed company modal view
- Industry analysis with tabs
- Perplexity AI integration for deep research

## Technologies Used

- React
- Styled Components
- Framer Motion
- Axios
- React Router DOM
- Perplexity AI API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Perplexity AI API key (for deep research functionality)

### Installation

1. Clone the repository or navigate to the project directory
```bash
cd dura-react
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Copy the example env file
cp .env.example .env

# Edit the .env file to add your Perplexity API key
```

4. Start the development server
```bash
npm run dev
```

The application will be available at http://localhost:5173

## Perplexity AI Integration

This application uses the Perplexity AI API to perform deep research on companies. To use this feature:

1. Sign up for an account at [Perplexity AI](https://www.perplexity.ai/)
2. Get your API key from the Perplexity AI dashboard
3. Add your API key to the `.env` file:
```
VITE_PERPLEXITY_API_KEY=your_api_key_here
```

If the API key is not configured, the application will fall back to opening the Perplexity website in a new tab when the "Perplexity AI" button is clicked.

## Project Structure

- `src/` - Contains all the source code
  - `components/` - Reusable UI components
  - `context/` - React context for state management (theme)
  - `pages/` - Page components
  - `services/` - API service integrations
  - `styles/` - Global styles
  - `utils/` - Utility functions

## API Integration

This React app communicates with both the existing Flask backend and external APIs:

- `/search` - POST request to search for companies
- `/ai-search` - GET request to perform an AI-powered search
- `/search-status` - GET request to check the status of a search
- Perplexity AI API - External API for deep company research

## Build for Production

To build the app for production:

```bash
npm run build
```

This will create a production-ready build in the `dist/` directory, which can be served by any static file server.

## Connecting to Your Backend

The application is configured to connect to the Flask backend running on port 8000. If you need to change this, modify the `vite.config.js` file. 