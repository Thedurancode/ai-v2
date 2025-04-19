import uvicorn
import argparse

if __name__ == "__main__":
    # Set up command line argument parsing
    parser = argparse.ArgumentParser(description='MLSE Partnership Analyzer FastAPI')
    parser.add_argument('--port', type=int, default=5020, help='Port to run the server on')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to run the server on')
    parser.add_argument('--reload', action='store_true', help='Enable auto-reload')
    args = parser.parse_args()

    # Run the FastAPI application
    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )
