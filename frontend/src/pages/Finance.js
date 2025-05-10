import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Stack,
  Tab,
  Tabs,
  IconButton
} from '@mui/material';
import { 
  AttachMoney as AttachMoneyIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  TrendingUp as TrendingUpIcon,
  FilterAlt as FilterAltIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import moment from 'moment';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getTransactions, getFinanceSummary } from '../services/financeService';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Finance = () => {
  const [transactions, setTransactions] = useState([]);
  const [financeSummary, setFinanceSummary] = useState({
    total_income: 0,
    total_expense: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [transactionType, setTransactionType] = useState('all');
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Fetch transactions and summary with filters
      const filters = {
        ...(startDate && { start_date: moment(startDate).format('YYYY-MM-DD') }),
        ...(endDate && { end_date: moment(endDate).format('YYYY-MM-DD') }),
        ...(transactionType !== 'all' && { transaction_type: transactionType })
      };

      const [transactionsResponse, summaryResponse] = await Promise.all([
        getTransactions(filters),
        getFinanceSummary(filters)
      ]);

      // Correctly set transactions, assuming transactionsResponse is the array
      setTransactions(Array.isArray(transactionsResponse) ? transactionsResponse : []);
      // summaryResponse is already the correct object
      setFinanceSummary(summaryResponse);

      // Prepare chart data, assuming transactionsResponse is the array
      prepareChartData(Array.isArray(transactionsResponse) ? transactionsResponse : []);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      setError('Failed to fetch financial data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const prepareChartData = (transactions) => {
    // Group transactions by date
    const groupedByDate = {};
    const incomeByDate = {};
    const expensesByDate = {};

    // Get all unique dates and initialize with zero
    const dates = [...new Set(transactions.map(t => moment(t.created_at).format('YYYY-MM-DD')))].sort();
    
    dates.forEach(date => {
      incomeByDate[date] = 0;
      expensesByDate[date] = 0;
    });

    // Sum values for each date
    transactions.forEach(transaction => {
      const date = moment(transaction.created_at).format('YYYY-MM-DD');
      
      if (transaction.transaction_type === 'income') {
        incomeByDate[date] += transaction.amount;
      } else {
        expensesByDate[date] += transaction.amount;
      }
    });

    setChartData({
      labels: dates,
      datasets: [
        {
          label: 'Income',
          data: dates.map(date => incomeByDate[date] || 0),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.2
        },
        {
          label: 'Expenses',
          data: dates.map(date => expensesByDate[date] || 0),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.2
        }
      ]
    });
  };

  const handleFilterChange = (type) => {
    setTransactionType(type);
  };

  const handleDateChange = (field, date) => {
    if (field === 'start') {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };

  const applyFilters = () => {
    fetchFinanceData();
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setTransactionType('all');
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading financial data..." />;
  }

  return (
    <Box>
      <PageHeader 
        title="Financial Management" 
        showButton={false}
      />

      {error ? (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AttachMoneyIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
                    <Typography variant="h6">Total Income</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ color: 'success.main' }}>
                    {formatCurrency(financeSummary.total_income || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ArrowDownwardIcon color="error" sx={{ mr: 1, fontSize: 28 }} />
                    <Typography variant="h6">Total Expenses</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ color: 'error.main' }}>
                    {formatCurrency(financeSummary.total_expense || 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon 
                      color={(financeSummary.total_income || 0) - (financeSummary.total_expense || 0) >= 0 ? 'success' : 'error'} 
                      sx={{ mr: 1, fontSize: 28 }} 
                    />
                    <Typography variant="h6">Net Profit</Typography>
                  </Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: (financeSummary.total_income || 0) - (financeSummary.total_expense || 0) >= 0 
                        ? 'success.main' 
                        : 'error.main' 
                    }}
                  >
                    {formatCurrency((financeSummary.total_income || 0) - (financeSummary.total_expense || 0))}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Filters
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(date) => handleDateChange('start', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterMoment}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(date) => handleDateChange('end', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Tabs
                  value={transactionType}
                  onChange={(e, newValue) => handleFilterChange(newValue)}
                  textColor="primary"
                  indicatorColor="primary"
                >
                  <Tab value="all" label="All" />
                  <Tab value="income" label="Income" />
                  <Tab value="expense" label="Expenses" />
                </Tabs>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    startIcon={<FilterAltIcon />}
                    onClick={applyFilters}
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                  >
                    Clear
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Chart */}
          <Card sx={{ mb: 4 }}>
            <CardHeader title="Financial Overview" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 400, position: 'relative' }}>
                <Line 
                  data={chartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: false
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader title="Transaction History" />
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.created_at)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {transaction.transaction_type === 'income' ? (
                              <ArrowUpwardIcon color="success" sx={{ mr: 1 }} />
                            ) : (
                              <ArrowDownwardIcon color="error" sx={{ mr: 1 }} />
                            )}
                            {transaction.transaction_type === 'income' ? 'Income' : 'Expense'}
                          </Box>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.user?.username || 'Unknown'}</TableCell>
                        <TableCell align="right" sx={{ 
                          color: transaction.transaction_type === 'income' ? 'success.main' : 'error.main',
                          fontWeight: 'bold'
                        }}>
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Box>
  );
};

export default Finance; 