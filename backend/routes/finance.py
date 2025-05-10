from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, FinancialTransaction, TransactionType, User
from datetime import datetime

finance_bp = Blueprint('finance', __name__)

@finance_bp.route('/transactions', methods=['GET'])
@jwt_required()
def get_transactions():
    # Get query parameters
    transaction_type = request.args.get('type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Base query
    query = FinancialTransaction.query
    
    # Apply filters if provided
    if transaction_type:
        if transaction_type.lower() == 'income':
            query = query.filter(FinancialTransaction.transaction_type == TransactionType.INCOME)
        elif transaction_type.lower() == 'expense':
            query = query.filter(FinancialTransaction.transaction_type == TransactionType.EXPENSE)
    
    if start_date:
        try:
            start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(FinancialTransaction.created_at >= start_datetime)
        except ValueError:
            return jsonify({"message": "Invalid start_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"}), 400
    
    if end_date:
        try:
            end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(FinancialTransaction.created_at <= end_datetime)
        except ValueError:
            return jsonify({"message": "Invalid end_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"}), 400
    
    # Order by created_at (newest first)
    transactions = query.order_by(FinancialTransaction.created_at.desc()).all()
    
    transaction_list = []
    
    for transaction in transactions:
        # Get user information
        user = User.query.get(transaction.user_id)
        
        transaction_data = {
            "id": transaction.id,
            "transaction_type": transaction.transaction_type.value,
            "description": transaction.description,
            "amount": transaction.amount,
            "user_id": transaction.user_id,
            "created_at": transaction.created_at.isoformat(),
            "user": {
                "id": user.id,
                "username": user.username,
                "real_name": user.real_name
            } if user else None
        }
        
        transaction_list.append(transaction_data)
    
    return jsonify(transaction_list), 200

@finance_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_financial_summary():
    # Get query parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Base queries
    income_query = FinancialTransaction.query.filter(FinancialTransaction.transaction_type == TransactionType.INCOME)
    expense_query = FinancialTransaction.query.filter(FinancialTransaction.transaction_type == TransactionType.EXPENSE)
    
    # Apply date filters if provided
    if start_date:
        try:
            start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            income_query = income_query.filter(FinancialTransaction.created_at >= start_datetime)
            expense_query = expense_query.filter(FinancialTransaction.created_at >= start_datetime)
        except ValueError:
            return jsonify({"message": "Invalid start_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"}), 400
    
    if end_date:
        try:
            end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            income_query = income_query.filter(FinancialTransaction.created_at <= end_datetime)
            expense_query = expense_query.filter(FinancialTransaction.created_at <= end_datetime)
        except ValueError:
            return jsonify({"message": "Invalid end_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)"}), 400
    
    # Calculate totals
    total_income = sum(transaction.amount for transaction in income_query.all())
    total_expense = sum(transaction.amount for transaction in expense_query.all())
    net_profit = total_income - total_expense
    
    return jsonify({
        "total_income": total_income,
        "total_expense": total_expense,
        "net_profit": net_profit
    }), 200 