import api from './api';

// Get all users (super admin only)
export const getUsers = async () => {
  try {
    const response = await api.get('/api/users');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get a single user by ID
export const getUser = async (id) => {
  try {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create a new user (super admin only)
export const createUser = async (userData) => {
  try {
    const response = await api.post('/api/users', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update user information
export const updateUser = async (id, userData) => {
  try {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update current user's profile
export const updateProfile = async (userData) => {
  try {
    const response = await api.put('/api/users/profile', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Change password
export const changePassword = async (passwords) => {
  try {
    const response = await api.post('/api/auth/change-password', passwords);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Reset user password (super admin only)
export const resetUserPassword = async (id, newPassword) => {
  try {
    const response = await api.post(`/api/users/${id}/reset-password`, { new_password: newPassword });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a user (super admin only)
export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 