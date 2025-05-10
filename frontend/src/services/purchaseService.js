import api from './api';

// Get all purchases with optional filter params
export const getPurchases = async (params = {}) => {
  try {
    const response = await api.get('/api/purchases', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get a single purchase by ID
export const getPurchase = async (id) => {
  try {
    const response = await api.get(`/api/purchases/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create a new purchase order
export const createPurchase = async (purchaseData) => {
  try {
    const response = await api.post('/api/purchases', purchaseData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update purchase status to paid
export const markAsPaid = async (id) => {
  try {
    const response = await api.post(`/api/purchases/${id}/pay`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update purchase status to cancelled (returned)
export const cancelPurchase = async (id) => {
  try {
    const response = await api.post(`/api/purchases/${id}/cancel`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add purchased books to inventory
export const addToInventory = async (id, retailPrice) => {
  try {
    const response = await api.post(`/api/purchases/${id}/add-to-inventory`, { retail_price: retailPrice });
    return response.data;
  } catch (error) {
    throw error;
  }
}; 