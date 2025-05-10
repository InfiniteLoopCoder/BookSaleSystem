import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent,
  CardHeader,
  Divider 
} from '@mui/material';
import { 
  MenuBook as MenuBookIcon,
  ShoppingCart as ShoppingCartIcon,
  PointOfSale as PointOfSaleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBooks } from '../services/bookService';
import { getPurchases } from '../services/purchaseService';
import { getSales } from '../services/saleService';
import { getFinanceSummary } from '../services/financeService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, getStockStatus } from '../utils/formatters';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const DashboardStat = ({ title, value, icon, color, onClick }) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-5px)' } : {}
      }} 
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            sx={{ 
              bgcolor: `${color}.light`, 
              color: `${color}.main`,
              p: 1,
              borderRadius: 1
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" sx={{ ml: 1 }}>{title}</Typography>
        </Box>
        <Typography variant="h4" sx={{ textAlign: 'center', mt: 2 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    lowStockBooks: 0,
    pendingPurchases: 0,
    monthlySales: 0,
    financeSummary: {
      total_income: 0,
      total_expense: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all required data
        const booksResponse = await getBooks();
        const purchasesResponse = await getPurchases();
        const salesResponse = await getSales();
        const financeSummaryResponse = await getFinanceSummary();

        // Process books data
        const books = Array.isArray(booksResponse) ? booksResponse : [];
        const lowStockBooks = books.filter(book => book.stock_quantity < 5).length;

        // Process purchases data
        const purchases = Array.isArray(purchasesResponse) ? purchasesResponse : [];
        const pendingPurchases = purchases.filter(purchase => purchase.status === 'pending').length;

        // Process sales data
        const sales = Array.isArray(salesResponse) ? salesResponse : [];
        const monthlySales = sales.filter(sale => {
          const saleDate = new Date(sale.created_at);
          const currentDate = new Date();
          return saleDate.getMonth() === currentDate.getMonth() &&
                 saleDate.getFullYear() === currentDate.getFullYear();
        }).length;

        // Set summary data
        setStats({
          totalBooks: books.length,
          lowStockBooks,
          pendingPurchases,
          monthlySales,
          financeSummary: financeSummaryResponse
        });

        // Prepare chart data
        const chartLabels = ['Income', 'Expenses'];
        const chartDataValues = [
          financeSummaryResponse.total_income || 0,
          financeSummaryResponse.total_expense || 0
        ];

        setChartData({
          labels: chartLabels,
          datasets: [
            {
              label: 'Amount (USD)',
              data: chartDataValues,
              backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
              borderColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'],
              borderWidth: 1,
            },
          ],
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const navigateToSection = (path) => {
    navigate(path);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard data..." />;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardStat 
            title="Total Books"
            value={stats.totalBooks}
            icon={<MenuBookIcon />}
            color="primary"
            onClick={() => navigateToSection('/books')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardStat 
            title="Low Stock Books"
            value={stats.lowStockBooks}
            icon={<WarningIcon />}
            color="warning"
            onClick={() => navigateToSection('/books')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardStat 
            title="Pending Purchases"
            value={stats.pendingPurchases}
            icon={<ShoppingCartIcon />}
            color="info"
            onClick={() => navigateToSection('/purchases')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardStat 
            title="Monthly Sales"
            value={stats.monthlySales}
            icon={<PointOfSaleIcon />}
            color="success"
            onClick={() => navigateToSection('/sales')}
          />
        </Grid>

        {/* Financial Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Financial Summary" />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="body1">Total Income</Typography>
                </Box>
                <Typography variant="h6">
                  {formatCurrency(stats.financeSummary.total_income)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                  <Typography variant="body1">Total Expenses</Typography>
                </Box>
                <Typography variant="h6">
                  {formatCurrency(stats.financeSummary.total_expense)}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" fontWeight="bold">Net Profit</Typography>
                <Typography variant="h6" color={(stats.financeSummary.total_income || 0) - (stats.financeSummary.total_expense || 0) >= 0 ? 'success.main' : 'error.main'}>
                  {formatCurrency((stats.financeSummary.total_income || 0) - (stats.financeSummary.total_expense || 0))}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Financial Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Financial Overview" />
            <Divider />
            <CardContent>
              <Bar 
                data={chartData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: false
                    },
                  },
                }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 