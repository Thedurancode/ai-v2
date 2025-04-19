# Dura FastAPI Application

A FastAPI implementation of the Dura partnership search and analysis service.

## Setup Instructions

1. Clone the repository
2. Navigate to the fastapi_app directory
3. Create a virtual environment:
   ```
   python -m venv venv
   ```
4. Activate the virtual environment:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```
5. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```
6. Make sure to set up your `.env` file with the necessary API keys:
   ```
   EXA_API_KEY=your_exa_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```
7. Run the application:
   ```
   python run.py
   ```

The API will be available at http://localhost:8000

## API Endpoints

- `GET /search-status`: Get the current status of a search operation
- `POST /api/search`: Start a new search for potential partners in a specific industry

## Example Usage

```python
import requests
import json

# Start a new search
response = requests.post(
    "http://localhost:8000/api/search",
    json={"query": "artificial intelligence"}
)

# Check search status
status_response = requests.get("http://localhost:8000/search-status")
print(status_response.json())
```

## API Documentation

- Interactive API documentation is available at http://localhost:8000/docs
- ReDoc documentation is available at http://localhost:8000/redoc 