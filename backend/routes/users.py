from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, User, UserRole

users_bp = Blueprint('users', __name__)

@users_bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"message": "User not found"}), 404
    
    # Check if user is super admin
    if not current_user.is_super_admin():
        return jsonify({"message": "Not authorized"}), 403
    
    users = User.query.all()
    user_list = []
    
    for user in users:
        user_list.append({
            "id": user.id,
            "username": user.username,
            "real_name": user.real_name,
            "employee_id": user.employee_id,
            "gender": user.gender,
            "age": user.age,
            "role": user.role.value,
            "is_super_admin": user.is_super_admin()
        })
    
    return jsonify(user_list), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"message": "User not found"}), 404
    
    # If not super admin and not requesting their own info
    if not current_user.is_super_admin() and current_user_id != user_id:
        return jsonify({"message": "Not authorized"}), 403
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    return jsonify({
        "id": user.id,
        "username": user.username,
        "real_name": user.real_name,
        "employee_id": user.employee_id,
        "gender": user.gender,
        "age": user.age,
        "role": user.role.value,
        "is_super_admin": user.is_super_admin()
    }), 200

@users_bp.route('', methods=['POST'])
@jwt_required()
def create_user():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"message": "User not found"}), 404
    
    # Check if user is super admin
    if not current_user.is_super_admin():
        return jsonify({"message": "Not authorized to create users"}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'password', 'real_name', 'employee_id', 'gender', 'age']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"message": f"Missing required field: {field}"}), 400
    
    # Check if username or employee_id already exists
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({"message": "Username already exists"}), 400
    
    if User.query.filter_by(employee_id=data.get('employee_id')).first():
        return jsonify({"message": "Employee ID already exists"}), 400
    
    # Create new user
    new_user = User(
        username=data.get('username'),
        real_name=data.get('real_name'),
        employee_id=data.get('employee_id'),
        gender=data.get('gender'),
        age=data.get('age'),
        role=UserRole.ADMIN
    )
    
    new_user.set_password(data.get('password'))
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "message": "User created successfully",
        "id": new_user.id
    }), 201

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"message": "User not found"}), 404
    
    # If not super admin and not updating their own info
    if not current_user.is_super_admin() and current_user_id != user_id:
        return jsonify({"message": "Not authorized"}), 403
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    data = request.get_json()
    
    # Update user fields
    if data.get('real_name'):
        user.real_name = data.get('real_name')
    
    if data.get('gender'):
        user.gender = data.get('gender')
    
    if data.get('age'):
        user.age = data.get('age')
    
    # Only super admin can update username, employee_id and role
    if current_user.is_super_admin():
        if data.get('username'):
            # Check if new username already exists (except current user)
            existing_user = User.query.filter_by(username=data.get('username')).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({"message": "Username already exists"}), 400
            user.username = data.get('username')
        
        if data.get('employee_id'):
            # Check if new employee_id already exists (except current user)
            existing_user = User.query.filter_by(employee_id=data.get('employee_id')).first()
            if existing_user and existing_user.id != user_id:
                return jsonify({"message": "Employee ID already exists"}), 400
            user.employee_id = data.get('employee_id')
    
    db.session.commit()
    
    return jsonify({"message": "User updated successfully"}), 200

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"message": "User not found"}), 404
    
    # Only super admin can delete users
    if not current_user.is_super_admin():
        return jsonify({"message": "Not authorized"}), 403
    
    # Cannot delete self
    if current_user_id == user_id:
        return jsonify({"message": "Cannot delete your own account"}), 400
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    # Cannot delete other super admins
    if user.is_super_admin():
        return jsonify({"message": "Cannot delete super admin account"}), 400
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({"message": "User deleted successfully"}), 200

@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"message": "User not found"}), 404
    
    data = request.get_json()
    
    # Update user fields
    if data.get('real_name'):
        current_user.real_name = data.get('real_name')
    
    if data.get('gender'):
        current_user.gender = data.get('gender')
    
    if data.get('age'):
        current_user.age = data.get('age')
    
    db.session.commit()
    
    return jsonify({
        "id": current_user.id,
        "username": current_user.username,
        "real_name": current_user.real_name,
        "employee_id": current_user.employee_id,
        "gender": current_user.gender,
        "age": current_user.age,
        "role": current_user.role.value,
        "is_super_admin": current_user.is_super_admin()
    }), 200

@users_bp.route('/<int:user_id>/reset-password', methods=['POST'])
@jwt_required()
def reset_user_password(user_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"message": "User not found"}), 404
    
    # Only super admin can reset passwords
    if not current_user.is_super_admin():
        return jsonify({"message": "Not authorized"}), 403
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    data = request.get_json()
    
    if not data or not data.get('new_password'):
        return jsonify({"message": "Missing new password"}), 400
    
    user.set_password(data.get('new_password'))
    db.session.commit()
    
    return jsonify({"message": "Password reset successfully"}), 200 