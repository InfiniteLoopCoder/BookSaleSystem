import api from './api';

// Get all financial transactions with optional date range filters
export const getTransactions = async (params = {}) => {
  try {
    const response = await api.get('/api/finance/transactions', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get summary of finances (total income, total expenses, profit)
export const getFinanceSummary = async (params = {}) => {
  try {
    const response = await api.get('/api/finance/summary', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
}; 