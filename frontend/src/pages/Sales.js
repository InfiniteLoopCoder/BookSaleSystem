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
  Typography,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { 
  ShoppingCartCheckout as ShoppingCartCheckoutIcon,
  PointOfSale as PointOfSaleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getSales } from '../services/saleService';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalAmount: 0,
    totalBooks: 0
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const response = await getSales();
      
      const allSales = Array.isArray(response) ? response : [];
      setSales(allSales);
      
      // Calculate summary data
      const totalAmount = allSales.reduce(
        (sum, sale) => sum + sale.total_price, 0
      );
      
      const totalBooks = allSales.reduce(
        (sum, sale) => sum + sale.quantity, 0
      );
      
      setSummary({
        totalSales: allSales.length,
        totalAmount,
        totalBooks
      });
    } catch (error) {
      console.error('Error fetching sales:', error);
      setError('Failed to fetch sales data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSale = () => {
    navigate('/sales/add');
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading sales data..." />;
  }

  return (
    <Box>
      <PageHeader 
        title="Sales Records" 
        buttonText="New Sale" 
        buttonPath="/sales/add"
        buttonIcon={<ShoppingCartCheckoutIcon />}
      />
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PointOfSaleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Sales</Typography>
              </Box>
              <Typography variant="h3">{summary.totalSales}</Typography>
              <Typography variant="body2" color="text.secondary">
                Transactions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Revenue
              </Typography>
              <Typography variant="h4" color="success.main">
                {formatCurrency(summary.totalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Books Sold
              </Typography>
              <Typography variant="h4">
                {summary.totalBooks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {error ? (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Book</TableCell>
                <TableCell>ISBN</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Sold By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No sales records found
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{formatDate(sale.created_at)}</TableCell>
                    <TableCell>{sale.book?.title || 'Unknown Book'}</TableCell>
                    <TableCell>{sale.book?.isbn || 'N/A'}</TableCell>
                    <TableCell align="right">{formatCurrency(sale.unit_price)}</TableCell>
                    <TableCell align="right">{sale.quantity}</TableCell>
                    <TableCell align="right">{formatCurrency(sale.total_price)}</TableCell>
                    <TableCell>{sale.user?.username || 'Unknown'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Sales; 