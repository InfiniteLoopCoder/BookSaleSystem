import moment from 'moment';

// Format date to readable format with seconds for more precision
export const formatDate = (date) => {
  if (!date) return 'N/A';
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Format book status based on stock quantity
export const getStockStatus = (quantity) => {
  if (quantity <= 0) {
    return { label: 'Out of Stock', color: 'error' };
  } else if (quantity < 5) {
    return { label: 'Low Stock', color: 'warning' };
  } else {
    return { label: 'In Stock', color: 'success' };
  }
};

// Format purchase status
export const formatPurchaseStatus = (status) => {
  switch (status) {
    case 'pending':
      return { label: 'Pending', color: 'warning' };
    case 'paid':
      return { label: 'Paid', color: 'info' };
    case 'cancelled':
      return { label: 'Cancelled', color: 'error' };
    case 'added_to_inventory':
      return { label: 'Added to Inventory', color: 'success' };
    default:
      return { label: status, color: 'default' };
  }
}; 