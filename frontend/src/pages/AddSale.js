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
  TableRow,
  Autocomplete,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getBooks, searchBooks } from '../services/bookService';
import { createSale } from '../services/saleService';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusChip from '../components/common/StatusChip';
import { formatCurrency, getStockStatus } from '../utils/formatters';

const AddSale = () => {
  const [books, setBooks] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [selectedBook, setSelectedBook] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [quantityError, setQuantityError] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const navigate = useNavigate();

  // Fetch all available books on component mount
  useEffect(() => {
    fetchBooks();
  }, []);

  // Calculate total amount when cart items change
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.book.retail_price), 0);
    setTotalAmount(total);
  }, [cartItems]);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const response = await getBooks();
      // Filter out books with zero stock
      const availableBooks = Array.isArray(response) ? response.filter(book => book.stock_quantity > 0) : [];
      setBooks(availableBooks);
    } catch (error) {
      console.error('Error fetching books:', error);
      setError('Failed to fetch available books. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults(books);
      return;
    }
    
    setIsSearching(true);
    setError('');
    
    try {
      const response = await searchBooks(searchTerm);
      // Filter out books with zero stock
      const availableBooks = Array.isArray(response) ? response.filter(book => book.stock_quantity > 0) : [];
      setSearchResults(availableBooks);
    } catch (error) {
      console.error('Error searching books:', error);
      setError('Error searching books. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddToCart = () => {
    if (!selectedBook) {
      setError('Please select a book to add to cart');
      return;
    }

    if (!quantity || quantity <= 0 || quantity > selectedBook.stock_quantity) {
      setQuantityError(`Quantity must be between 1 and ${selectedBook.stock_quantity}`);
      return;
    }

    // Check if this book is already in the cart
    const existingItemIndex = cartItems.findIndex(item => item.book.id === selectedBook.id);
    
    if (existingItemIndex >= 0) {
      // Check if the total quantity would exceed stock
      const existingItem = cartItems[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > selectedBook.stock_quantity) {
        setQuantityError(`Cannot add ${quantity} more. Only ${selectedBook.stock_quantity - existingItem.quantity} more available.`);
        return;
      }
      
      // Update quantity of existing item
      const updatedCart = [...cartItems];
      updatedCart[existingItemIndex].quantity = newQuantity;
      setCartItems(updatedCart);
    } else {
      // Add new item to cart
      setCartItems([...cartItems, { book: selectedBook, quantity }]);
    }
    
    // Reset selection and quantity
    setSelectedBook(null);
    setQuantity(1);
    setQuantityError('');
  };

  const handleRemoveFromCart = (index) => {
    const updatedCart = [...cartItems];
    updatedCart.splice(index, 1);
    setCartItems(updatedCart);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      setError('Cart is empty. Please add items before checkout.');
      return;
    }
    setConfirmDialogOpen(true);
  };

  const handleConfirmSale = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Format data for API
      const saleItems = cartItems.map(item => ({
        book_id: item.book.id,
        quantity: item.quantity,
        unit_price: item.book.retail_price
      }));
      
      await createSale({ items: saleItems });
      setConfirmDialogOpen(false);
      navigate('/sales');
    } catch (error) {
      console.error('Error creating sale:', error);
      setError(
        error.response?.data?.message || 
        'Failed to complete sale. Please try again.'
      );
      setConfirmDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/sales');
  };

  if (isLoading && books.length === 0) {
    return <LoadingSpinner message="Loading books..." />;
  }

  return (
    <Box>
      <PageHeader 
        title="New Sale" 
        showButton={false}
      />

      <Grid container spacing={3}>
        {/* Book Selection Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Books
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {/* Search Input */}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search books by ISBN, title, author..."
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
            
            {/* Book Selection */}
            <Autocomplete
              options={searchTerm ? searchResults : books}
              getOptionLabel={(book) => `${book.title} - ${book.author} (${book.isbn})`}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedBook}
              onChange={(event, newValue) => {
                setSelectedBook(newValue);
                setQuantityError('');
              }}
              renderOption={(props, book) => (
                <Box component="li" {...props}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1">{book.title}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <Typography variant="body2" color="text.secondary">
                        {book.author} | ISBN: {book.isbn}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2">
                          {formatCurrency(book.retail_price)}
                        </Typography>
                        <StatusChip 
                          label={`${book.stock_quantity} in stock`} 
                          color={book.stock_quantity < 5 ? 'warning' : 'success'} 
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select a book"
                  fullWidth
                  variant="outlined"
                />
              )}
              noOptionsText="No books found"
              sx={{ mb: 2 }}
            />
            
            {/* Quantity Input */}
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(parseInt(e.target.value) || '');
                    setQuantityError('');
                  }}
                  disabled={!selectedBook}
                  error={!!quantityError}
                  helperText={quantityError}
                  InputProps={{
                    inputProps: { 
                      min: 1, 
                      max: selectedBook ? selectedBook.stock_quantity : 1 
                    }
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                {selectedBook && (
                  <Typography variant="body2">
                    Max available: {selectedBook.stock_quantity}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddToCart}
                  disabled={!selectedBook}
                >
                  Add to Cart
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Cart Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Shopping Cart
            </Typography>
            
            {cartItems.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Cart is empty. Add books to proceed with sale.
              </Typography>
            ) : (
              <>
                <TableContainer sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Book</TableCell>
                        <TableCell align="right">Price</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cartItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.book.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              ISBN: {item.book.isbn}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{formatCurrency(item.book.retail_price)}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.book.retail_price * item.quantity)}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleRemoveFromCart(index)}
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
                    {formatCurrency(totalAmount)}
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
                startIcon={<ShoppingCartIcon />}
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
              >
                Complete Sale
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Confirm Sale Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Sale</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to complete this sale for {formatCurrency(totalAmount)}? 
            This will update inventory and add a financial record.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmSale} color="primary" variant="contained">
            Confirm Sale
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddSale; 