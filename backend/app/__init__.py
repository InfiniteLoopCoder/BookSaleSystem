from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from dotenv import load_dotenv
import os
from flask import request
from models.models import db, User, UserRole

def create_app():
    app = Flask(__name__)
    load_dotenv()
    
    # Configure the application
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URI', 'mysql+pymysql://root:password@localhost/library_management')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400  # Token过期时间为1天
    
    # Initialize extensions with proper CORS settings
    CORS(app, 
         origins=['http://localhost:3000', 'http://127.0.0.1:3000','http://192.168.0.210:3000'],
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization', 'authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    db.init_app(app)
    migrate = Migrate(app, db)
    jwt = JWTManager(app)
    
    # Register blueprints
    from routes.auth import auth_bp
    from routes.books import books_bp
    from routes.users import users_bp
    from routes.purchases import purchases_bp
    from routes.sales import sales_bp
    from routes.finance import finance_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(books_bp, url_prefix='/api/books', strict_slashes=False)
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(purchases_bp, url_prefix='/api/purchases')
    app.register_blueprint(sales_bp, url_prefix='/api/sales')
    app.register_blueprint(finance_bp, url_prefix='/api/finance')
    
    # Create super admin user function
    def create_super_admin():
        if not User.query.filter_by(username='admin').first():
            super_admin = User(
                username='admin',
                real_name='Super Admin',
                employee_id='ADMIN001',
                gender='Male',
                age=30,
                role=UserRole.SUPER_ADMIN
            )
            super_admin.set_password('admin123')
            db.session.add(super_admin)
            db.session.commit()
    
    # Store the function to be called in init_db.py
    app.create_super_admin = create_super_admin
    
    return app 