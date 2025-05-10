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
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  Card,
  CardContent,
  Typography
} from '@mui/material';
import { 
  Search as SearchIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusChip from '../components/common/StatusChip';
import { getBooks, searchBooks } from '../services/bookService';
import { formatCurrency, getStockStatus } from '../utils/formatters';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalBooks, setTotalBooks] = useState(0);
  const [summary, setSummary] = useState({
    totalBooks: 0,
    totalValue: 0,
    outOfStock: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, [page, rowsPerPage]);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const responseData = await getBooks({ 
        page: page + 1, 
        per_page: rowsPerPage 
      });
      
      // Assuming responseData is the array of books for the current page
      setBooks(Array.isArray(responseData) ? responseData : []);
      // If the backend sends total count in a header (e.g., 'X-Total-Count') or a structured response,
      // this needs to be adjusted. For now, if it's a simple array per page,
      // we might not have the grand total easily unless the API provides it.
      // If responseData.total was how it was before, and backend API for paginated books is
      // { books: [], total: X }, then the original setBooks(responseData.books || []) and setTotalBooks(responseData.total || 0) was correct.
      // Based on current info (backend returns direct array), we'll estimate total or expect it differently.
      // For now, let's assume the 'total' field might come if the response *was* an object.
      // If the API for paginated books truly sends just an array for the page,
      // then 'totalBooks' needs a different source or the backend API needs to change.
      // Let's assume for a moment the backend *does* send { books: [], total: X } for paginated `getBooks`
      // as the `totalBooks` state implies this. If not, this part is still problematic.
      if (responseData && typeof responseData === 'object' && 'books' in responseData) {
        setBooks(responseData.books || []);
        setTotalBooks(responseData.total || 0);
        
        const allReturnedBooks = responseData.books || [];
        const totalValue = allReturnedBooks.reduce(
          (sum, book) => sum + (book.retail_price * book.stock_quantity), 0
        );
        const outOfStock = allReturnedBooks.filter(book => book.stock_quantity <= 0).length;
        setSummary({
          totalBooks: responseData.total || 0,
          totalValue,
          outOfStock
        });
      } else if (Array.isArray(responseData)) {
        // If it's a direct array, we don't have total from this response.
        // This will break pagination controls unless total is fetched another way.
        setBooks(responseData);
        setTotalBooks(responseData.length); // This is only total for current page!
        
        const totalValue = responseData.reduce(
          (sum, book) => sum + (book.retail_price * book.stock_quantity), 0
        );
        const outOfStock = responseData.filter(book => book.stock_quantity <= 0).length;
        setSummary({
          totalBooks: responseData.length, // Placeholder, actual total unknown
          totalValue,
          outOfStock
        });
      } else {
        setBooks([]);
        setTotalBooks(0);
        setSummary({ totalBooks: 0, totalValue: 0, outOfStock: 0 });
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      setBooks([]); // Clear books on error
      setTotalBooks(0);
      setSummary({ totalBooks: 0, totalValue: 0, outOfStock: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchBooks(); // Reset to full paginated list
      return;
    }

    setIsLoading(true);
    try {
      const responseData = await searchBooks(searchTerm);
      // Assuming searchBooks also returns a direct array or { books: [] }
      if (responseData && typeof responseData === 'object' && 'books' in responseData) {
        setBooks(responseData.books || []);
        setTotalBooks(responseData.books?.length || 0); // Total is just the length of search results
      } else if (Array.isArray(responseData)) {
        setBooks(responseData);
        setTotalBooks(responseData.length); // Total is just the length of search results
      } else {
        setBooks([]);
        setTotalBooks(0);
      }
    } catch (error) {
      console.error('Error searching books:', error);
      setBooks([]); // Clear books on error
      setTotalBooks(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    fetchBooks();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddBook = () => {
    navigate('/books/add');
  };

  const handleViewBook = (id) => {
    navigate(`/books/${id}`);
  };

  const handleEditBook = (id) => {
    navigate(`/books/${id}?edit=true`);
  };

  return (
    <Box>
      <PageHeader 
        title="Books Inventory" 
        buttonText="Add New Book" 
        buttonPath="/books/add"
      />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Books
              </Typography>
              <Typography variant="h4">
                {summary.totalBooks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Inventory Value
              </Typography>
              <Typography variant="h4">
                {formatCurrency(summary.totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Out of Stock
              </Typography>
              <Typography variant="h4" color="error.main">
                {summary.outOfStock}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by ISBN, title, author, or publisher..."
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={handleClearSearch} edge="end">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Books Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ISBN</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Publisher</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {books.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No books found
                    </TableCell>
                  </TableRow>
                ) : (
                  books.map((book) => {
                    const stockStatus = getStockStatus(book.stock_quantity);
                    
                    return (
                      <TableRow key={book.id}>
                        <TableCell>{book.isbn}</TableCell>
                        <TableCell>{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell>{book.publisher}</TableCell>
                        <TableCell align="right">{formatCurrency(book.retail_price)}</TableCell>
                        <TableCell align="right">{book.stock_quantity}</TableCell>
                        <TableCell align="center">
                          <StatusChip 
                            label={stockStatus.label} 
                            color={stockStatus.color} 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton 
                            color="primary" 
                            onClick={() => handleViewBook(book.id)}
                            title="View"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton 
                            color="secondary" 
                            onClick={() => handleEditBook(book.id)}
                            title="Edit"
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={totalBooks}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </>
      )}
    </Box>
  );
};

export default Books; 