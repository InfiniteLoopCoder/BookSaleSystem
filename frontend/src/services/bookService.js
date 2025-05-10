import api from './api';

// Get all books with optional search and filter params
export const getBooks = async (params = {}) => {
  try {
    const response = await api.get('/api/books', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get a single book by ID
export const getBook = async (id) => {
  try {
    const response = await api.get(`/api/books/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add a new book
export const addBook = async (bookData) => {
  try {
    const response = await api.post('/api/books', bookData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a book
export const updateBook = async (id, bookData) => {
  try {
    const response = await api.put(`/api/books/${id}`, bookData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Search books by term (can be ISBN, title, author, publisher)
export const searchBooks = async (searchTerm) => {
  try {
    const response = await api.get('/api/books/search', { params: { q: searchTerm } });
    return response.data;
  } catch (error) {
    throw error;
  }
}; 