import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { createPurchase } from '../services/purchaseService';
import { searchBooks } from '../services/bookService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import { formatCurrency } from '../utils/formatters';

// Validation schema for book search
const BookSearchSchema = Yup.object().shape({
  isbn: Yup.string()
    .required('ISBN is required'),
  title: Yup.string()
    .required('Title is required'),
  author: Yup.string()
    .required('Author is required'),
  publisher: Yup.string()
    .required('Publisher is required'),
  purchase_price: Yup.number()
    .required('Purchase price is required')
    .positive('Purchase price must be positive'),
  quantity: Yup.number()
    .required('Quantity is required')
    .integer('Quantity must be an integer')
    .positive('Quantity must be positive')
});

const AddPurchase = () => {
  const [books, setBooks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  
  const navigate = useNavigate();

  // Calculate total whenever books change
  useEffect(() => {
    const total = books.reduce((sum, book) => sum + (book.purchase_price * book.quantity), 0);
    setCalculatedTotal(total);
  }, [books]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);
    
    try {
      const response = await searchBooks(searchTerm);
      if (response && response.length > 0) {
        // We found an existing book, pre-fill form
        const book = response[0];
        setSearchResult({
          book_id: book.id,
          isbn: book.isbn,
          title: book.title,
          author: book.author,
          publisher: book.publisher,
          purchase_price: '',
          quantity: 1
        });
      } else {
        // No book found, leave form empty except ISBN
        // Check if searchTerm is likely an ISBN (only digits and dashes)
        const isIsbn = /^[0-9\-]+$/.test(searchTerm);
        setSearchResult({
          isbn: isIsbn ? searchTerm : '',
          title: !isIsbn ? searchTerm : '',
          author: '',
          publisher: '',
          purchase_price: '',
          quantity: 1
        });
      }
    } catch (error) {
      console.error('Error searching books:', error);
      setSearchError('Error searching books. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddBook = (values, { resetForm }) => {
    // Check if a book with the same ISBN already exists in the list
    const existingBookIndex = books.findIndex(book => book.isbn === values.isbn);
    
    if (existingBookIndex >= 0) {
      // Update quantity of existing book
      const updatedBooks = [...books];
      updatedBooks[existingBookIndex].quantity += parseInt(values.quantity);
      setBooks(updatedBooks);
    } else {
      // Add new book to the list
      setBooks([...books, values]);
    }
    
    // Reset form and search result
    resetForm();
    setSearchResult(null);
    setSearchTerm('');
  };

  const handleRemoveBook = (index) => {
    const updatedBooks = [...books];
    updatedBooks.splice(index, 1);
    setBooks(updatedBooks);
  };

  const handleSubmitPurchase = async () => {
    if (books.length === 0) {
      setSubmitError('Please add at least one book to the purchase order.');
      return;
    }
    
    setIsLoading(true);
    setSubmitError('');
    
    try {
      await createPurchase({ books });
      navigate('/purchases');
    } catch (error) {
      console.error('Error creating purchase:', error);
      setSubmitError(
        error.response?.data?.message || 
        'Failed to create purchase. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/purchases');
  };

  if (isLoading) {
    return <LoadingSpinner message="Creating purchase..." />;
  }

  return (
    <Box>
      <PageHeader 
        title="Create Purchase Order" 
        showButton={false}
      />

      <Grid container spacing={3}>
        {/* Book Search and Add Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Add Books to Purchase
            </Typography>
            
            {searchError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {searchError}
              </Alert>
            )}
            
            {/* Search Input */}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by ISBN or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch} edge="end" disabled={isSearching}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            {isSearching ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography>Searching...</Typography>
              </Box>
            ) : searchResult && (
              <Formik
                initialValues={searchResult}
                validationSchema={BookSearchSchema}
                onSubmit={handleAddBook}
              >
                {({ errors, touched, isValid, dirty }) => (
                  <Form>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Field name="isbn">
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="ISBN"
                              variant="outlined"
                              error={touched.isbn && Boolean(errors.isbn)}
                              helperText={touched.isbn && errors.isbn}
                              disabled
                            />
                          )}
                        </Field>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Field name="title">
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Title"
                              variant="outlined"
                              error={touched.title && Boolean(errors.title)}
                              helperText={touched.title && errors.title}
                            />
                          )}
                        </Field>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Field name="author">
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Author"
                              variant="outlined"
                              error={touched.author && Boolean(errors.author)}
                              helperText={touched.author && errors.author}
                            />
                          )}
                        </Field>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Field name="publisher">
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Publisher"
                              variant="outlined"
                              error={touched.publisher && Boolean(errors.publisher)}
                              helperText={touched.publisher && errors.publisher}
                            />
                          )}
                        </Field>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Field name="purchase_price">
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              type="number"
                              label="Purchase Price"
                              variant="outlined"
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">$</InputAdornment>
                                ),
                              }}
                              error={touched.purchase_price && Boolean(errors.purchase_price)}
                              helperText={touched.purchase_price && errors.purchase_price}
                            />
                          )}
                        </Field>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Field name="quantity">
                          {({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              type="number"
                              label="Quantity"
                              variant="outlined"
                              error={touched.quantity && Boolean(errors.quantity)}
                              helperText={touched.quantity && errors.quantity}
                            />
                          )}
                        </Field>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          startIcon={<AddIcon />}
                          disabled={!isValid}
                          fullWidth
                        >
                          Add to Purchase
                        </Button>
                      </Grid>
                    </Grid>
                  </Form>
                )}
              </Formik>
            )}
          </Paper>
        </Grid>
        
        {/* Purchase Summary Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Purchase Summary
            </Typography>
            
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}
            
            {books.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No books added to this purchase yet.
              </Typography>
            ) : (
              <>
                <TableContainer sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ISBN</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {books.map((book, index) => (
                        <TableRow key={index}>
                          <TableCell>{book.isbn}</TableCell>
                          <TableCell>{book.title}</TableCell>
                          <TableCell align="right">{formatCurrency(book.purchase_price)}</TableCell>
                          <TableCell align="right">{book.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(book.purchase_price * book.quantity)}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleRemoveBook(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Total:
                  </Typography>
                  <Typography variant="h6" color="primary.main">
                    {formatCurrency(calculatedTotal)}
                  </Typography>
                </Box>
              </>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitPurchase}
                disabled={books.length === 0}
              >
                Create Purchase Order
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddPurchase; 