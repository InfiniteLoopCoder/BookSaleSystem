from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, BookSale, Book, User, FinancialTransaction, TransactionType

sales_bp = Blueprint('sales', __name__)

@sales_bp.route('', methods=['GET'])
@jwt_required()
def get_sales():
    sales = BookSale.query.all()
    sale_list = []
    
    for sale in sales:
        # Get user information
        user = User.query.get(sale.user_id)
        
        # Get book information
        book = Book.query.get(sale.book_id) if sale.book_id else None
        
        sale_data = {
            "id": sale.id,
            "book_id": sale.book_id,
            "quantity": sale.quantity,
            "unit_price": sale.unit_price,
            "total_price": sale.total_price,
            "user_id": sale.user_id,
            "created_at": sale.created_at.isoformat(),
            "book": {
                "id": book.id,
                "isbn": book.isbn,
                "title": book.title
            } if book else None,
            "user": {
                "id": user.id,
                "username": user.username,
                "real_name": user.real_name
            } if user else None
        }
        
        sale_list.append(sale_data)
    
    return jsonify(sale_list), 200

@sales_bp.route('/<int:sale_id>', methods=['GET'])
@jwt_required()
def get_sale(sale_id):
    sale = BookSale.query.get(sale_id)
    
    if not sale:
        return jsonify({"message": "Sale not found"}), 404
    
    # Get user information
    user = User.query.get(sale.user_id)
    
    # Get book information
    book = Book.query.get(sale.book_id) if sale.book_id else None
    
    return jsonify({
        "id": sale.id,
        "book_id": sale.book_id,
        "quantity": sale.quantity,
        "unit_price": sale.unit_price,
        "total_price": sale.total_price,
        "user_id": sale.user_id,
        "created_at": sale.created_at.isoformat(),
        "book": {
            "id": book.id,
            "isbn": book.isbn,
            "title": book.title
        } if book else None,
        "user": {
            "id": user.id,
            "username": user.username,
            "real_name": user.real_name
        } if user else None
    }), 200

@sales_bp.route('', methods=['POST'])
@jwt_required()
def create_sale():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"message": "User not found"}), 404
    
    data = request.get_json()
    
    # Check if data has 'items' array for multiple books
    if data.get('items') and isinstance(data.get('items'), list):
        # Process multiple books
        if len(data.get('items')) == 0:
            return jsonify({"message": "No items provided in sale"}), 400
        
        sale_ids = []
        
        for item in data['items']:
            # Validate required fields for each item
            required_fields = ['book_id', 'quantity']
            for field in required_fields:
                if not item.get(field):
                    return jsonify({"message": f"Missing required field: {field}"}), 400
            
            # Get book
            book_id = item.get('book_id')
            quantity = int(item.get('quantity'))
            
            book = Book.query.get(book_id)
            
            if not book:
                return jsonify({"message": f"Book with ID {book_id} not found"}), 404
            
            # Check if enough stock
            if book.stock_quantity < quantity:
                return jsonify({"message": f"Not enough stock available for book: {book.title}. Available: {book.stock_quantity}"}), 400
            
            # Calculate total price
            unit_price = item.get('unit_price', book.retail_price)
            total_price = unit_price * quantity
            
            # Create sale record
            sale = BookSale(
                book_id=book_id,
                quantity=quantity,
                unit_price=unit_price,
                total_price=total_price,
                user_id=current_user_id
            )
            
            # Reduce book stock
            book.stock_quantity -= quantity
            
            # Create financial transaction record for this item
            transaction = FinancialTransaction(
                transaction_type=TransactionType.INCOME,
                description=f"Book sale: {quantity} copies of {book.title}",
                amount=total_price,
                user_id=current_user_id
            )
            
            db.session.add(sale)
            db.session.add(transaction)
            db.session.flush()
            sale_ids.append(sale.id)
        
        db.session.commit()
        
        return jsonify({
            "message": "Sales created successfully",
            "sale_ids": sale_ids
        }), 201
    else:
        # Process single book (original implementation)
        # Validate required fields
        required_fields = ['book_id', 'quantity']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"message": f"Missing required field: {field}"}), 400
        
        # Get book
        book_id = data.get('book_id')
        quantity = int(data.get('quantity'))
        
        book = Book.query.get(book_id)
        
        if not book:
            return jsonify({"message": "Book not found"}), 404
        
        # Check if enough stock
        if book.stock_quantity < quantity:
            return jsonify({"message": "Not enough stock available"}), 400
        
        # Calculate total price
        unit_price = book.retail_price
        total_price = unit_price * quantity
        
        # Create sale record
        sale = BookSale(
            book_id=book_id,
            quantity=quantity,
            unit_price=unit_price,
            total_price=total_price,
            user_id=current_user_id
        )
        
        # Reduce book stock
        book.stock_quantity -= quantity
        
        # Create financial transaction record
        transaction = FinancialTransaction(
            transaction_type=TransactionType.INCOME,
            description=f"Book sale: {quantity} copies of {book.title}",
            amount=total_price,
            user_id=current_user_id
        )
        
        db.session.add(sale)
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            "message": "Sale created successfully",
            "id": sale.id
        }), 201 