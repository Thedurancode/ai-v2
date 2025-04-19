# Partnership Finder - Refactored Application

This is a refactored version of the Partnership Finder application, designed with a modular structure for better maintainability and scalability.

## Project Structure

The application is now organized into a package structure:

```
app/
  ├── __init__.py          # Main application factory
  ├── models/              # Database models
  │   ├── __init__.py
  │   └── database.py      # Supabase database operations
  ├── routes/              # API routes
  │   ├── __init__.py
  │   ├── api.py           # API endpoints
  │   └── proxy.py         # Proxy routes for frontend
  ├── services/            # Business logic 
  │   ├── __init__.py
  │   ├── company_service.py  # Company processing logic
  │   └── search_service.py   # Search functionality
  └── utils/               # Utility functions
      ├── __init__.py
      └── helpers.py       # Helper functions
```

## Key Changes

1. **Modular Organization**: Code is now organized into logical modules instead of one large file.
2. **Separation of Concerns**: Database operations, business logic, and API routes are separated.
3. **Application Factory Pattern**: Using Flask's application factory pattern for better testability.
4. **Improved Error Handling**: Consistent error handling across modules.

## How to Run

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Set up environment variables in `.env` file:
   ```
   OPENAI_API_KEY=your_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   ```

3. Run the application:
   ```
   python3 main.py
   ```

## API Endpoints

All the original API endpoints are preserved:

- `/api/search` - Search for companies in an industry
- `/api/search-status` - Get current search status
- `/api/potential-partners` - Get potential partners
- `/api/company-details` - Get company details
- `/api/reset-history` - Reset search history
- `/api/search-history` - Get search history
- `/api/history` - Get full history
- `/api/stats` - Get statistics
- `/api/company-research` - Save/retrieve company research

## Development

To modify or extend the application:

1. **Database Operations**: Edit `app/models/database.py`
2. **API Endpoints**: Edit `app/routes/api.py`
3. **Business Logic**: Edit files in `app/services/`
4. **Utilities**: Edit `app/utils/helpers.py`

## Testing

Run tests with:
```
python -m pytest tests/
```

## Deployment

The application can be deployed using the same methods as before:
- Render
- Fly.io
- Vercel
- Other platforms that support Python/Flask applications 