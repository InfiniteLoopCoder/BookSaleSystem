import api from './api';

// Get all sales with optional filter params
export const getSales = async (params = {}) => {
  try {
    const response = await api.get('/api/sales', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get a single sale by ID
export const getSale = async (id) => {
  try {
    const response = await api.get(`/api/sales/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create a new sale
export const createSale = async (saleData) => {
  try {
    const response = await api.post('/api/sales', saleData);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 