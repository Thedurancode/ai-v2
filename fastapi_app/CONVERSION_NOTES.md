# Flask to FastAPI Conversion Notes

This document outlines the key changes made in converting the Dura application from Flask to FastAPI.

## Key Differences

### Architecture and Organization

- **Modular Structure**: Code has been reorganized into a more modular structure with separate files for utility functions, making it easier to maintain and extend.
- **Package Structure**: Proper Python package structure with `__init__.py` files.

### Framework Differences

1. **Routing**:
   - Flask: `@app.route('/path', methods=['GET'])`
   - FastAPI: `@app.get("/path")` or `@app.post("/path")`

2. **Request Handling**:
   - Flask: Accesses request data through the global `request` object.
   - FastAPI: Declares parameters in route functions and uses Pydantic models for request body validation.

3. **Response Models**:
   - Flask: Manual serialization of response data.
   - FastAPI: Automatic validation and serialization using Pydantic models.

4. **Error Handling**:
   - Flask: Returns tuples of (response, status_code) or uses `abort()`.
   - FastAPI: Uses the `HTTPException` class.

5. **Asynchronous Support**:
   - Flask: Limited async support.
   - FastAPI: Built-in support for async/await.

6. **Automatic Documentation**:
   - Flask: Requires extensions for API documentation.
   - FastAPI: Automatic interactive documentation via Swagger UI (/docs) and ReDoc (/redoc).

## Data Models

Pydantic models were introduced to validate both request and response data:

- `SearchQuery`: Validates search queries
- `SearchResponse`: Validates search responses
- `ErrorResponse`: Standard error response format

## API Endpoints

| Flask Endpoint | FastAPI Endpoint | Method | Description |
|----------------|-----------------|--------|-------------|
| `/search-status` | `/search-status` | GET | Get the current status of a search operation |
| `/api/search` | `/api/search` | POST | Start a new search |

## Benefits of FastAPI

1. **Performance**: FastAPI is built on Starlette and Uvicorn, making it one of the fastest Python frameworks available.
2. **Type Checking**: Built-in request and response validation with Pydantic.
3. **Documentation**: Automatic interactive API documentation.
4. **Modern Python Features**: Native support for async/await, Python type hints, and dependency injection.
5. **Standards-Based**: Built on and fully compatible with OpenAPI and JSON Schema.

## Migration Process

To migrate from the Flask app to this FastAPI implementation:

1. Run the `migrate.py` script to copy the necessary environment variables and database.
2. Test the new FastAPI implementation.
3. Update any client applications to work with the FastAPI endpoints.

## Future Enhancements

1. Implement additional endpoints for partner management.
2. Add authentication and authorization.
3. Create more detailed Pydantic models for better validation.
4. Add background tasks for long-running operations.
5. Implement websockets for real-time search status updates. 