from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
from models.models import db, Book, User
from datetime import datetime

books_bp = Blueprint('books', __name__)

@books_bp.route('', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_books():
    # Get query parameters for search/filter
    isbn = request.args.get('isbn')
    title = request.args.get('title')
    author = request.args.get('author')
    publisher = request.args.get('publisher')
    
    # Base query
    query = Book.query
    
    # Apply filters if provided
    if isbn:
        query = query.filter(Book.isbn.like(f'%{isbn}%'))
    if title:
        query = query.filter(Book.title.like(f'%{title}%'))
    if author:
        query = query.filter(Book.author.like(f'%{author}%'))
    if publisher:
        query = query.filter(Book.publisher.like(f'%{publisher}%'))
    
    books = query.all()
    book_list = []
    
    for book in books:
        book_list.append({
            "id": book.id,
            "isbn": book.isbn,
            "title": book.title,
            "author": book.author,
            "publisher": book.publisher,
            "retail_price": book.retail_price,
            "stock_quantity": book.stock_quantity,
            "created_at": book.created_at.isoformat() if book.created_at else None,
            "updated_at": book.updated_at.isoformat() if book.updated_at else None
        })
    
    return jsonify(book_list), 200

@books_bp.route('/search', methods=['GET'])
@jwt_required()
def search_books():
    # Get search term
    search_term = request.args.get('q', '')
    
    if not search_term:
        return jsonify([]), 200
    
    # Search in all relevant fields
    books = Book.query.filter(
        or_(
            Book.isbn.like(f'%{search_term}%'),
            Book.title.like(f'%{search_term}%'),
            Book.author.like(f'%{search_term}%'),
            Book.publisher.like(f'%{search_term}%')
        )
    ).all()
    
    book_list = []
    
    for book in books:
        book_list.append({
            "id": book.id,
            "isbn": book.isbn,
            "title": book.title,
            "author": book.author,
            "publisher": book.publisher,
            "retail_price": book.retail_price,
            "stock_quantity": book.stock_quantity,
            "created_at": book.created_at.isoformat() if book.created_at else None,
            "updated_at": book.updated_at.isoformat() if book.updated_at else None
        })
    
    return jsonify(book_list), 200

@books_bp.route('/<int:book_id>', methods=['GET'])
@jwt_required()
def get_book(book_id):
    book = Book.query.get(book_id)
    
    if not book:
        return jsonify({"message": "Book not found"}), 404
    
    return jsonify({
        "id": book.id,
        "isbn": book.isbn,
        "title": book.title,
        "author": book.author,
        "publisher": book.publisher,
        "retail_price": book.retail_price,
        "stock_quantity": book.stock_quantity,
        "created_at": book.created_at.isoformat() if book.created_at else None,
        "updated_at": book.updated_at.isoformat() if book.updated_at else None
    }), 200

@books_bp.route('', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_book():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['isbn', 'title', 'author', 'publisher', 'retail_price']
    for field in required_fields:
        if not data.get(field):
            return jsonify({"message": f"Missing required field: {field}"}), 400
    
    # Check if book with same ISBN already exists
    if Book.query.filter_by(isbn=data.get('isbn')).first():
        return jsonify({"message": "Book with this ISBN already exists"}), 400
    
    # Create new book
    new_book = Book(
        isbn=data.get('isbn'),
        title=data.get('title'),
        author=data.get('author'),
        publisher=data.get('publisher'),
        retail_price=data.get('retail_price'),
        stock_quantity=data.get('stock_quantity', 0)
    )
    
    db.session.add(new_book)
    db.session.commit()
    
    return jsonify({
        "message": "Book created successfully",
        "id": new_book.id
    }), 201

@books_bp.route('/<int:book_id>', methods=['PUT'])
@jwt_required()
def update_book(book_id):
    book = Book.query.get(book_id)
    
    if not book:
        return jsonify({"message": "Book not found"}), 404
    
    data = request.get_json()
    
    # Update book fields
    if data.get('title'):
        book.title = data.get('title')
    
    if data.get('author'):
        book.author = data.get('author')
    
    if data.get('publisher'):
        book.publisher = data.get('publisher')
    
    if data.get('retail_price'):
        book.retail_price = data.get('retail_price')
    
    # Explicitly update the timestamp
    book.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        "message": "Book updated successfully",
        "updated_at": book.updated_at.isoformat() if book.updated_at else None
    }), 200

@books_bp.route('/<int:book_id>', methods=['DELETE'])
@jwt_required()
def delete_book(book_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"message": "User not found"}), 404
    
    # Only super admin can delete books
    if not current_user.is_super_admin():
        return jsonify({"message": "Not authorized"}), 403
    
    book = Book.query.get(book_id)
    
    if not book:
        return jsonify({"message": "Book not found"}), 404
    
    db.session.delete(book)
    db.session.commit()
    
    return jsonify({"message": "Book deleted successfully"}), 200 