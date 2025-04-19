from functools import wraps
from flask import request, jsonify, g
from clerk.backend import verify_token
import jwt

CLERK_SECRET_KEY = 'sk_test_Bxe10N0qt6K1k3slO9PX1GnVHMHPMvOJkgL25dEfD5'

def clerk_auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                "status": "error",
                "message": "Authorization header is required"
            }), 401

        try:
            token = auth_header.split(' ')[1]
            payload = verify_token(token, CLERK_SECRET_KEY)
            g.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({
                "status": "error",
                "message": "Token has expired"
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "status": "error",
                "message": "Invalid token"
            }), 401
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 401

        return f(*args, **kwargs)
    return decorated_function
