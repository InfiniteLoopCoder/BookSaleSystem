from app import create_app
from models.models import db, User, UserRole, Book, BookPurchase, PurchaseStatus, BookSale, FinancialTransaction, TransactionType
from datetime import datetime

def init_database():
    """Initialize the database and create the super admin user and sample data."""
    app = create_app()
    
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # --- Super Admin User ---
        print("Checking if super admin exists...")
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            print("Creating super admin user...")
            admin_user = User(
                username='admin',
                real_name='Super Admin',
                employee_id='ADMIN001',
                gender='Male',
                age=30,
                role=UserRole.SUPER_ADMIN
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            db.session.commit() # Commit to get admin_user.id
            admin_user = User.query.filter_by(username='admin').first() # Re-fetch to ensure ID is loaded
            print("Super admin user created successfully.")
        else:
            print("Super admin user already exists.")

        # --- Additional Admin User ---
        print("Checking if sample admin user 'lib_admin' exists...")
        sample_admin_user = User.query.filter_by(username='lib_admin').first()
        if not sample_admin_user:
            print("Creating sample admin user 'lib_admin'...")
            sample_admin_user = User(
                username='lib_admin',
                real_name='Library Admin',
                employee_id='LIB001',
                gender='Female',
                age=28,
                role=UserRole.ADMIN
            )
            sample_admin_user.set_password('adminpass')
            db.session.add(sample_admin_user)
            print("Sample admin user 'lib_admin' created.")
        else:
            print("Sample admin user 'lib_admin' already exists.")
        
        db.session.commit() # Commit users to get their IDs

        # Ensure we have a user for transactions (prefer admin_user if available)
        acting_user = admin_user if admin_user else sample_admin_user
        if not acting_user:
            print("CRITICAL: No admin user found to associate with data. Aborting sample data population.")
            return


        # --- Sample Books ---
        print("Checking if sample books exist...")
        if Book.query.count() < 5: # Only add if not many books already
            print("Creating sample books...")
            books_data = [
                {'isbn': '978-0321765723', 'title': 'Effective Java', 'author': 'Joshua Bloch', 'publisher': 'Addison-Wesley', 'retail_price': 45.99, 'stock_quantity': 15},
                {'isbn': '978-0132350884', 'title': 'Clean Code', 'author': 'Robert C. Martin', 'publisher': 'Prentice Hall', 'retail_price': 38.50, 'stock_quantity': 25},
                {'isbn': '978-0201633610', 'title': 'Design Patterns', 'author': 'Erich Gamma', 'publisher': 'Addison-Wesley', 'retail_price': 55.00, 'stock_quantity': 10},
                {'isbn': '978-1934356591', 'title': 'The Pragmatic Programmer', 'author': 'Andrew Hunt', 'publisher': 'Addison-Wesley', 'retail_price': 42.75, 'stock_quantity': 20},
                {'isbn': '978-0596007126', 'title': 'Python Cookbook', 'author': 'Alex Martelli', 'publisher': 'O\'Reilly Media', 'retail_price': 49.99, 'stock_quantity': 12},
                {'isbn': '978-0134685991', 'title': 'Fluent Python', 'author': 'Luciano Ramalho', 'publisher': 'O\'Reilly Media', 'retail_price': 59.99, 'stock_quantity': 8},
                {'isbn': '978-0321573513', 'title': 'Algorithms', 'author': 'Robert Sedgewick', 'publisher': 'Addison-Wesley', 'retail_price': 75.20, 'stock_quantity': 18},
            ]
            for book_data in books_data:
                if not Book.query.filter_by(isbn=book_data['isbn']).first():
                    book = Book(**book_data)
                    db.session.add(book)
            db.session.commit()
            print(f"{len(books_data)} sample books processed.")
        else:
            print("Sample books seem to exist already or count is sufficient.")

        # --- Sample Book Purchases ---
        print("Checking if sample purchases exist...")
        if BookPurchase.query.count() < 3:
            print("Creating sample book purchases...")
            # Fetch some books to reference in purchases
            book1 = Book.query.filter_by(isbn='978-0321765723').first() # Effective Java
            book2 = Book.query.filter_by(isbn='978-0132350884').first() # Clean Code
            
            purchases_data = []
            if book1:
                purchases_data.append(
                    {'isbn': book1.isbn, 'title': book1.title, 'author': book1.author, 'publisher': book1.publisher, 'purchase_price': 30.00, 'quantity': 10, 'status': PurchaseStatus.ADDED_TO_INVENTORY, 'user_id': acting_user.id}
                )
            if book2:
                 purchases_data.append(
                    {'isbn': book2.isbn, 'title': book2.title, 'author': book2.author, 'publisher': book2.publisher, 'purchase_price': 25.00, 'quantity': 15, 'status': PurchaseStatus.PAID, 'user_id': acting_user.id}
                 )
            if book1: # Another purchase for the same book
                purchases_data.append(
                    {'isbn': book1.isbn, 'title': book1.title, 'author': book1.author, 'publisher': book1.publisher, 'purchase_price': 32.50, 'quantity': 5, 'status': PurchaseStatus.PENDING, 'user_id': acting_user.id}
                )

            for pur_data in purchases_data:
                purchase = BookPurchase(**pur_data)
                db.session.add(purchase)
                
                # Corresponding Financial Transaction for PAID or ADDED_TO_INVENTORY purchases
                if purchase.status in [PurchaseStatus.PAID, PurchaseStatus.ADDED_TO_INVENTORY]:
                    ft = FinancialTransaction(
                        transaction_type=TransactionType.EXPENSE,
                        description=f"Purchase of {purchase.quantity} x '{purchase.title}'",
                        amount=purchase.purchase_price * purchase.quantity,
                        user_id=acting_user.id
                    )
                    db.session.add(ft)
                
                # Update stock if added to inventory
                if purchase.status == PurchaseStatus.ADDED_TO_INVENTORY:
                    book_to_update = Book.query.filter_by(isbn=purchase.isbn).first()
                    if book_to_update:
                        book_to_update.stock_quantity += purchase.quantity
            db.session.commit()
            print(f"{len(purchases_data)} sample purchases created.")
        else:
            print("Sample purchases seem to exist already.")

        # --- Sample Book Sales ---
        print("Checking if sample sales exist...")
        if BookSale.query.count() < 3:
            print("Creating sample book sales...")
            # Fetch some books to reference in sales (ensure they have stock)
            book_to_sell1 = Book.query.filter_by(isbn='978-0321765723').first() # Effective Java
            book_to_sell2 = Book.query.filter_by(isbn='978-0132350884').first() # Clean Code
            
            sales_data = []
            if book_to_sell1 and book_to_sell1.stock_quantity >= 2:
                sales_data.append({'book_id': book_to_sell1.id, 'quantity': 2, 'unit_price': book_to_sell1.retail_price, 'user_id': acting_user.id})
            if book_to_sell2 and book_to_sell2.stock_quantity >= 1:
                sales_data.append({'book_id': book_to_sell2.id, 'quantity': 1, 'unit_price': book_to_sell2.retail_price, 'user_id': acting_user.id})
            if book_to_sell1 and book_to_sell1.stock_quantity >= 3: # Assuming stock was updated by purchase
                 sales_data.append({'book_id': book_to_sell1.id, 'quantity': 3, 'unit_price': book_to_sell1.retail_price, 'user_id': acting_user.id})


            for sale_data in sales_data:
                book = Book.query.get(sale_data['book_id'])
                if book and book.stock_quantity >= sale_data['quantity']:
                    sale = BookSale(
                        book_id=sale_data['book_id'],
                        quantity=sale_data['quantity'],
                        unit_price=sale_data['unit_price'],
                        total_price=sale_data['quantity'] * sale_data['unit_price'],
                        user_id=sale_data['user_id']
                    )
                    db.session.add(sale)
                    
                    # Update book stock
                    book.stock_quantity -= sale.quantity
                    
                    # Corresponding Financial Transaction
                    ft = FinancialTransaction(
                        transaction_type=TransactionType.INCOME,
                        description=f"Sale of {sale.quantity} x '{book.title}'",
                        amount=sale.total_price,
                        user_id=acting_user.id
                    )
                    db.session.add(ft)
            db.session.commit()
            print(f"{len(sales_data)} sample sales created.")
        else:
            print("Sample sales seem to exist already.")
        
        print("Sample data population completed.")

if __name__ == '__main__':
    init_database()