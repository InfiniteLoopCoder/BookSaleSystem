import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Button,
  TextField,
  Alert,
  InputAdornment
} from '@mui/material';
import { 
  Edit as EditIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon 
} from '@mui/icons-material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { getBook, updateBook } from '../services/bookService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import StatusChip from '../components/common/StatusChip';
import { formatCurrency, formatDate, getStockStatus } from '../utils/formatters';

// Validation schema
const BookSchema = Yup.object().shape({
  title: Yup.string()
    .required('Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  author: Yup.string()
    .required('Author is required')
    .max(100, 'Author cannot exceed 100 characters'),
  publisher: Yup.string()
    .required('Publisher is required')
    .max(100, 'Publisher cannot exceed 100 characters'),
  retail_price: Yup.number()
    .required('Retail price is required')
    .positive('Retail price must be positive'),
});

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(queryParams.get('edit') === 'true');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const fetchBookDetails = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await getBook(id);
      setBook(response);
    } catch (error) {
      console.error('Error fetching book details:', error);
      setError('Failed to fetch book details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitError('');
    setIsSubmitting(true);
    
    try {
      await updateBook(id, values);
      setBook({ ...book, ...values });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating book:', error);
      setSubmitError(
        error.response?.data?.message || 
        'Failed to update book. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/books');
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading book details..." />;
  }

  if (error) {
    return (
      <Box>
        <PageHeader 
          title="Book Details" 
          showButton={false}
        />
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Books
        </Button>
      </Box>
    );
  }

  if (!book) {
    return <Typography>No book found with the given ID.</Typography>;
  }

  const stockStatus = getStockStatus(book.stock_quantity);

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Back to Books
      </Button>

      <PageHeader 
        title={isEditing ? "Edit Book" : "Book Details"} 
        buttonText={isEditing ? "Cancel" : "Edit Book"}
        buttonIcon={isEditing ? null : <EditIcon />}
        buttonPath={null}
        showButton={!isSubmitting}
        onButtonClick={toggleEditMode}
      />

      {isEditing ? (
        <Paper sx={{ p: 3 }}>
          {submitError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {submitError}
            </Alert>
          )}

          <Formik
            initialValues={{
              title: book.title,
              author: book.author,
              publisher: book.publisher,
              retail_price: book.retail_price,
            }}
            validationSchema={BookSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isValid }) => (
              <Form>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      ISBN: {book.isbn}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
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

                  <Grid item xs={12} md={6}>
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

                  <Grid item xs={12} md={6}>
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

                  <Grid item xs={12} md={6}>
                    <Field name="retail_price">
                      {({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label="Retail Price"
                          variant="outlined"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">$</InputAdornment>
                            ),
                          }}
                          error={touched.retail_price && Boolean(errors.retail_price)}
                          helperText={touched.retail_price && errors.retail_price}
                        />
                      )}
                    </Field>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Current Stock: {book.stock_quantity}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={toggleEditMode}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        disabled={!isValid || isSubmitting}
                      >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {book.title}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  by {book.author}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      ISBN
                    </Typography>
                    <Typography variant="body1">
                      {book.isbn}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Publisher
                    </Typography>
                    <Typography variant="body1">
                      {book.publisher}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Price
                    </Typography>
                    <Typography variant="body1">
                      {formatCurrency(book.retail_price)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Added to System
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(book.created_at)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(book.updated_at)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Inventory Status
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StatusChip 
                    label={stockStatus.label} 
                    color={stockStatus.color} 
                    size="medium"
                  />
                </Box>
                
                <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>
                  {book.stock_quantity}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Units Available
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Inventory Value
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(book.stock_quantity * book.retail_price)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default BookDetail; 