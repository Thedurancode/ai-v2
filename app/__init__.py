import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from .models.database import get_previously_considered_from_db, get_search_history_from_db
from .utils.helpers import load_previously_considered, load_search_history
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_app():
    """Create and configure the Flask application"""
    # Set up static folder for React build
    static_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'dura-react', 'dist')
    if not os.path.exists(static_folder):
        print(f"Warning: Static folder not found at {static_folder}. Creating it...")
        os.makedirs(static_folder, exist_ok=True)

    print(f"Using static folder: {static_folder}")
    app = Flask(__name__, static_folder=static_folder)
    CORS(app)

    # Load initial data from database
    load_previously_considered()
    load_search_history()

    # Register blueprints
    from .routes.api import api_bp
    from .routes.proxy import proxy_bp
    
    app.register_blueprint(api_bp)
    app.register_blueprint(proxy_bp)
    
    # Serve the React frontend
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        """Serve static files or index.html for SPA"""
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, 'index.html')
    
    return app
