# Migrating to Neon PostgreSQL Database

This document outlines the steps to migrate the Dura API from SQLite to Neon PostgreSQL.

## Setup Steps

### 1. Create a Neon PostgreSQL Account

1. Sign up for a free account at [https://neon.tech](https://neon.tech)
2. Create a new project
3. Once your project is created, navigate to the dashboard
4. Copy your connection string which will look like: `postgres://user:password@hostname:port/dbname`

### 2. Configure Environment Variables

Update your environment variables to include the Neon database URL:

```bash
# Add this to your .env file
DATABASE_URL=postgres://user:password@hostname:port/dbname
```

### 3. Install Required Dependencies

Make sure you have the necessary dependencies installed:

```bash
pip install -r requirements.txt
```

### 4. Run Database Migration Script

To migrate your existing data from SQLite to PostgreSQL:

```bash
# Make sure your DATABASE_URL and DB_PATH (SQLite path) are set in your .env file
python -m fastapi_app.app.migrate_to_postgres
```

## Verification

To verify that the migration was successful:

1. Run the application with the DATABASE_URL environment variable set
2. Check the application logs to confirm it's connecting to PostgreSQL
3. Test the API endpoints to ensure data is being retrieved correctly

## Troubleshooting

### Common Issues

- **Connection Error**: Ensure your DATABASE_URL is correctly formatted and that your IP is allowed in Neon's connection settings
- **Migration Failures**: If the migration script fails, check if your SQLite database structure matches what the script expects
- **Schema Issues**: If you encounter schema mismatches, you might need to modify the models in `main.py` to match your existing data

### PostgreSQL Specific Settings

In the Neon dashboard, you can configure:

- Connection pooling
- Database size limits
- Backup settings
- Performance monitoring

## Development vs Production

For development, you can create a branch in Neon which gives you a separate database for testing.

For production:
- Set up connection pooling
- Configure appropriate database scale settings
- Set up automated backups
- Implement proper security measures

## Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/en/20/)
- [FastAPI with SQL Databases](https://fastapi.tiangolo.com/tutorial/sql-databases/) 