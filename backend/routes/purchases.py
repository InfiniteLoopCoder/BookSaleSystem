from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models.models import db, BookPurchase, Book, User, PurchaseStatus, FinancialTransaction, TransactionType

purchases_bp = Blueprint('purchases', __name__)

@purchases_bp.route('', methods=['GET'])
@jwt_required()
def get_purchases():
    status = request.args.get('status')
    
    # Base query
    query = BookPurchase.query
    
    # Apply status filter if provided
    if status:
        query = query.filter(BookPurchase.status == status)
    
    purchases = query.all()
    purchase_list = []
    
    for purchase in purchases:
        purchase_list.append({
            "id": purchase.id,
            "isbn": purchase.isbn,
            "title": purchase.title,
            "author": purchase.author,
            "publisher": purchase.publisher,
            "purchase_price": purchase.purchase_price,
            "quantity": purchase.quantity,
            "status": purchase.status.value,
            "user_id": purchase.user_id,
            "created_at": purchase.created_at.isoformat(),
            "updated_at": purchase.updated_at.isoformat()
        })
    
    return jsonify(purchase_list), 200

@purchases_bp.route('/<int:purchase_id>', methods=['GET'])
@jwt_required()
def get_purchase(purchase_id):
    purchase = BookPurchase.query.get(purchase_id)
    
    if not purchase:
        return jsonify({"message": "Purchase not found"}), 404
    
    return jsonify({
        "id": purchase.id,
        "isbn": purchase.isbn,
        "title": purchase.title,
        "author": purchase.author,
        "publisher": purchase.publisher,
        "purchase_price": purchase.purchase_price,
        "quantity": purchase.quantity,
        "status": purchase.status.value,
        "user_id": purchase.user_id,
        "created_at": purchase.created_at.isoformat(),
        "updated_at": purchase.updated_at.isoformat()
    }), 200

@purchases_bp.route('', methods=['POST'])
@jwt_required()
def create_purchase():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"message": "User not found"}), 404
    
    data = request.get_json()
    
    # Check if data has 'books' array
    if not data or not data.get('books') or not isinstance(data.get('books'), list) or len(data.get('books')) == 0:
        return jsonify({"message": "No books provided in purchase order"}), 400
    
    purchase_ids = []
    
    for book_data in data['books']:
        # Validate required fields for each book
        required_fields = ['purchase_price', 'quantity']
        for field in required_fields:
            if not book_data.get(field):
                return jsonify({"message": f"Missing required field: {field}"}), 400
        
        # If book_id is provided, use existing book info
        if book_data.get('book_id'):
            book = Book.query.get(book_data.get('book_id'))
            
            if not book:
                return jsonify({"message": f"Book with ID {book_data.get('book_id')} not found"}), 404
            
            # Create purchase for existing book
            purchase = BookPurchase(
                isbn=book.isbn,
                title=book.title,
                author=book.author,
                publisher=book.publisher,
                purchase_price=book_data.get('purchase_price'),
                quantity=book_data.get('quantity'),
                status=PurchaseStatus.PENDING,
                user_id=current_user_id
            )
        else:
            # For new book, validate additional fields
            additional_fields = ['isbn', 'title', 'author', 'publisher']
            for field in additional_fields:
                if not book_data.get(field):
                    return jsonify({"message": f"Missing required field for new book: {field}"}), 400
            
            # Create purchase for new book
            purchase = BookPurchase(
                isbn=book_data.get('isbn'),
                title=book_data.get('title'),
                author=book_data.get('author'),
                publisher=book_data.get('publisher'),
                purchase_price=book_data.get('purchase_price'),
                quantity=book_data.get('quantity'),
                status=PurchaseStatus.PENDING,
                user_id=current_user_id
            )
        
        db.session.add(purchase)
        db.session.flush()  # Get ID without committing
        purchase_ids.append(purchase.id)
    
    db.session.commit()
    
    return jsonify({
        "message": "Purchase orders created successfully",
        "purchase_ids": purchase_ids
    }), 201

@purchases_bp.route('/<int:purchase_id>/pay', methods=['POST'])
@jwt_required()
def pay_purchase(purchase_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"message": "User not found"}), 404
    
    purchase = BookPurchase.query.get(purchase_id)
    
    if not purchase:
        return jsonify({"message": "Purchase not found"}), 404
    
    # Can only pay for pending purchases
    if purchase.status != PurchaseStatus.PENDING:
        return jsonify({"message": f"Cannot pay for purchase with status {purchase.status.value}"}), 400
    
    # Update purchase status
    purchase.status = PurchaseStatus.PAID
    purchase.updated_at = datetime.utcnow()
    
    # Create financial transaction record
    transaction = FinancialTransaction(
        transaction_type=TransactionType.EXPENSE,
        description=f"Book purchase: {purchase.quantity} copies of {purchase.title}",
        amount=purchase.purchase_price * purchase.quantity,
        user_id=current_user_id
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({"message": "Purchase paid successfully"}), 200

@purchases_bp.route('/<int:purchase_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_purchase(purchase_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"message": "User not found"}), 404
    
    purchase = BookPurchase.query.get(purchase_id)
    
    if not purchase:
        return jsonify({"message": "Purchase not found"}), 404
    
    # Can only cancel pending purchases
    if purchase.status != PurchaseStatus.PENDING:
        return jsonify({"message": f"Cannot cancel purchase with status {purchase.status.value}"}), 400
    
    # Update purchase status
    purchase.status = PurchaseStatus.CANCELLED
    purchase.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({"message": "Purchase cancelled successfully"}), 200

@purchases_bp.route('/<int:purchase_id>/add-to-inventory', methods=['POST'])
@jwt_required()
def add_to_inventory(purchase_id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({"message": "User not found"}), 404
    
    purchase = BookPurchase.query.get(purchase_id)
    
    if not purchase:
        return jsonify({"message": "Purchase not found"}), 404
    
    # Can only add to inventory paid purchases
    if purchase.status != PurchaseStatus.PAID:
        return jsonify({"message": f"Cannot add to inventory purchase with status {purchase.status.value}"}), 400
    
    data = request.get_json()
    
    # Check if book already exists
    book = Book.query.filter_by(isbn=purchase.isbn).first()
    
    if book:
        # Update existing book - use existing retail price
        book.stock_quantity += purchase.quantity
        # Explicitly update the updated_at timestamp
        book.updated_at = datetime.utcnow()
        # If retail_price is provided, update it (optional)
        if data and data.get('retail_price'):
            book.retail_price = data.get('retail_price')
    else:
        # For new books, retail price is required
        retail_price = data.get('retail_price') if data else None
        
        if not retail_price:
            return jsonify({"message": "Missing retail price for new book"}), 400
        
        # Create new book entry with current timestamp
        book = Book(
            isbn=purchase.isbn,
            title=purchase.title,
            author=purchase.author,
            publisher=purchase.publisher,
            retail_price=retail_price,
            stock_quantity=purchase.quantity,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(book)
    
    # Update purchase status
    purchase.status = PurchaseStatus.ADDED_TO_INVENTORY
    purchase.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        "message": "Purchase added to inventory successfully",
        "is_new_book": book.id is None,
        "retail_price": book.retail_price
    }), 200 