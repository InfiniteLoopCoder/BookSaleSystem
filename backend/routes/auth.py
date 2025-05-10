from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', ''))
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response
    
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"message": "Missing username or password"}), 400
    
    user = User.query.filter_by(username=data.get('username')).first()
    
    if not user or not user.check_password(data.get('password')):
        return jsonify({"message": "Invalid username or password"}), 401
    
    # Create JWT token
    access_token = create_access_token(identity=str(user.id))
    
    response = jsonify({
        "token": access_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "real_name": user.real_name,
            "employee_id": user.employee_id,
            "gender": user.gender,
            "age": user.age,
            "role": user.role.value,
            "is_super_admin": user.is_super_admin()
        }
    })
    response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', ''))
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response, 200

@auth_bp.route('/me', methods=['OPTIONS'])
def get_me_options():
    response = jsonify({})
    response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', ''))
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me_get():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    response_data = {
        "id": user.id,
        "username": user.username,
        "real_name": user.real_name,
        "employee_id": user.employee_id,
        "gender": user.gender,
        "age": user.age,
        "role": user.role.value,
        "is_super_admin": user.is_super_admin()
    }
    response = jsonify(response_data)
    response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', ''))
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response, 200

@auth_bp.route('/change-password', methods=['POST', 'OPTIONS'])
@jwt_required()
def change_password():
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', ''))
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response
        
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    data = request.get_json()
    
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({"message": "Missing current or new password"}), 400
    
    if not user.check_password(data.get('current_password')):
        return jsonify({"message": "Current password is incorrect"}), 401
    
    user.set_password(data.get('new_password'))
    db.session.commit()
    
    response = jsonify({"message": "Password updated successfully"})
    response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', ''))
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response, 200 