import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  ButtonGroup,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Grid,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon,
  Payment as PaymentIcon,
  Inventory as InventoryIcon,
  Cancel as CancelIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getPurchases, markAsPaid, cancelPurchase, addToInventory } from '../services/purchaseService';
import { getBooks } from '../services/bookService';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import StatusChip from '../components/common/StatusChip';
import { formatCurrency, formatDate, formatPurchaseStatus } from '../utils/formatters';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [addToInventoryDialogOpen, setAddToInventoryDialogOpen] = useState(false);
  const [retailPrice, setRetailPrice] = useState('');
  const [retailPriceError, setRetailPriceError] = useState('');
  const [existingBook, setExistingBook] = useState(null);
  const [checkingInventory, setCheckingInventory] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const response = await getPurchases();
      setPurchases(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setError('Failed to fetch purchases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPurchase = () => {
    navigate('/purchases/add');
  };

  const handlePay = (purchase) => {
    setSelectedPurchase(purchase);
    setConfirmDialogAction('pay');
    setConfirmDialogOpen(true);
  };

  const handleCancel = (purchase) => {
    setSelectedPurchase(purchase);
    setConfirmDialogAction('cancel');
    setConfirmDialogOpen(true);
  };

  const handleAddToInventory = async (purchase) => {
    setSelectedPurchase(purchase);
    setCheckingInventory(true);
    
    try {
      // Check if book already exists in inventory
      const booksResponse = await getBooks({ isbn: purchase.isbn });
      const matchingBooks = Array.isArray(booksResponse) ? booksResponse.filter(book => book.isbn === purchase.isbn) : [];
      
      if (matchingBooks.length > 0) {
        setExistingBook(matchingBooks[0]);
        setRetailPrice(matchingBooks[0].retail_price.toString());
      } else {
        setExistingBook(null);
        setRetailPrice('');
      }
    } catch (error) {
      console.error('Error checking inventory:', error);
      setExistingBook(null);
    } finally {
      setCheckingInventory(false);
      setAddToInventoryDialogOpen(true);
    }
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
    setSelectedPurchase(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedPurchase) return;

    setIsLoading(true);
    try {
      if (confirmDialogAction === 'pay') {
        await markAsPaid(selectedPurchase.id);
      } else if (confirmDialogAction === 'cancel') {
        await cancelPurchase(selectedPurchase.id);
      }
      await fetchPurchases();
    } catch (error) {
      console.error(`Error ${confirmDialogAction}ing purchase:`, error);
      setError(`Failed to ${confirmDialogAction} purchase. Please try again.`);
    } finally {
      setIsLoading(false);
      setConfirmDialogOpen(false);
      setSelectedPurchase(null);
    }
  };

  const handleAddToInventorySubmit = async () => {
    if (!selectedPurchase) return;
    
    if (!existingBook && (!retailPrice || isNaN(retailPrice) || parseFloat(retailPrice) <= 0)) {
      setRetailPriceError('Please enter a valid retail price');
      return;
    }

    setIsLoading(true);
    try {
      // Always send a retail price to the backend
      // If it's an existing book, the backend will use the existing price unless we specify otherwise
      await addToInventory(selectedPurchase.id, parseFloat(retailPrice));
      await fetchPurchases();
      setAddToInventoryDialogOpen(false);
      setSelectedPurchase(null);
      setRetailPrice('');
      setRetailPriceError('');
      setExistingBook(null);
    } catch (error) {
      console.error('Error adding to inventory:', error);
      setError('Failed to add purchase to inventory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAddToInventoryDialog = () => {
    setAddToInventoryDialogOpen(false);
    setSelectedPurchase(null);
    setRetailPrice('');
    setRetailPriceError('');
    setExistingBook(null);
  };

  if (isLoading && purchases.length === 0) {
    return <LoadingSpinner message="Loading purchases..." />;
  }

  return (
    <Box>
      <PageHeader 
        title="Purchase Management" 
        buttonText="Add New Purchase" 
        buttonPath="/purchases/add"
        buttonIcon={<AddIcon />}
      />

      {error && (
        <Typography color="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>ISBN</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Publisher</TableCell>
              <TableCell align="right">Purchase Price</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No purchases found
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((purchase) => {
                const status = formatPurchaseStatus(purchase.status);
                const total = purchase.purchase_price * purchase.quantity;
                
                return (
                  <TableRow key={purchase.id}>
                    <TableCell>{formatDate(purchase.created_at)}</TableCell>
                    <TableCell>{purchase.isbn}</TableCell>
                    <TableCell>{purchase.title}</TableCell>
                    <TableCell>{purchase.publisher}</TableCell>
                    <TableCell align="right">{formatCurrency(purchase.purchase_price)}</TableCell>
                    <TableCell align="right">{purchase.quantity}</TableCell>
                    <TableCell align="right">{formatCurrency(total)}</TableCell>
                    <TableCell align="center">
                      <StatusChip 
                        label={status.label} 
                        color={status.color} 
                      />
                    </TableCell>
                    <TableCell align="center">
                      <ButtonGroup size="small" variant="outlined">
                        {purchase.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => handlePay(purchase)}
                              startIcon={<PaymentIcon />}
                              color="primary"
                            >
                              Pay
                            </Button>
                            <Button
                              onClick={() => handleCancel(purchase)}
                              startIcon={<CancelIcon />}
                              color="error"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {purchase.status === 'paid' && (
                          <Button
                            onClick={() => handleAddToInventory(purchase)}
                            startIcon={<InventoryIcon />}
                            color="success"
                          >
                            Add to Inventory
                          </Button>
                        )}
                      </ButtonGroup>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        title={confirmDialogAction === 'pay' ? 'Confirm Payment' : 'Confirm Cancellation'}
        message={
          confirmDialogAction === 'pay'
            ? `Are you sure you want to mark this purchase as paid? This will create a financial record for the purchase amount of ${selectedPurchase ? formatCurrency(selectedPurchase.purchase_price * selectedPurchase.quantity) : ''}.`
            : 'Are you sure you want to cancel this purchase? This action cannot be undone.'
        }
        confirmText={confirmDialogAction === 'pay' ? 'Pay' : 'Cancel Purchase'}
        confirmButtonColor={confirmDialogAction === 'pay' ? 'primary' : 'error'}
        onConfirm={handleConfirmAction}
        onCancel={handleConfirmDialogClose}
      />

      {/* Add to Inventory Dialog */}
      <Dialog
        open={addToInventoryDialogOpen}
        onClose={handleCloseAddToInventoryDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add to Inventory</DialogTitle>
        <DialogContent>
          {checkingInventory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {existingBook ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    This book already exists in inventory with retail price of {formatCurrency(existingBook.retail_price)} and current stock of {existingBook.stock_quantity} units.
                  </Typography>
                </Alert>
              ) : (
                <DialogContentText sx={{ mb: 2 }}>
                  Enter the retail price for these books before adding them to inventory.
                </DialogContentText>
              )}
              
              {selectedPurchase && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">
                      {selectedPurchase.title} ({selectedPurchase.quantity} copies)
                    </Typography>
                  </Grid>
                  
                  {existingBook ? (
                    <Grid item xs={12}>
                      <TextField
                        label="Retail Price (Optional - leave unchanged to keep current price)"
                        type="number"
                        fullWidth
                        value={retailPrice}
                        onChange={(e) => {
                          setRetailPrice(e.target.value);
                          setRetailPriceError('');
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">$</InputAdornment>
                          ),
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Current retail price: {formatCurrency(existingBook.retail_price)}. Leave blank to keep current price.
                      </Typography>
                    </Grid>
                  ) : (
                    <Grid item xs={12}>
                      <TextField
                        label="Retail Price"
                        type="number"
                        fullWidth
                        required
                        value={retailPrice}
                        onChange={(e) => {
                          setRetailPrice(e.target.value);
                          setRetailPriceError('');
                        }}
                        error={!!retailPriceError}
                        helperText={retailPriceError}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">$</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  )}
                  
                  {retailPrice && !isNaN(retailPrice) && parseFloat(retailPrice) > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        These books were purchased at {formatCurrency(selectedPurchase.purchase_price)} each.
                        Setting retail price to {formatCurrency(parseFloat(retailPrice))} will result in a 
                        {' '}{Math.round((parseFloat(retailPrice) - selectedPurchase.purchase_price) / selectedPurchase.purchase_price * 100)}% markup.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddToInventoryDialog}>Cancel</Button>
          <Button 
            onClick={handleAddToInventorySubmit} 
            variant="contained" 
            color="primary"
            disabled={isLoading || checkingInventory || (!existingBook && (!retailPrice || isNaN(retailPrice) || parseFloat(retailPrice) <= 0))}
          >
            Add to Inventory
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Purchases; 