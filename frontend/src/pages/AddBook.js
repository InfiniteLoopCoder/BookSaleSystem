import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Alert,
  InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { addBook } from '../services/bookService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';

// Validation schema
const BookSchema = Yup.object().shape({
  isbn: Yup.string()
    .required('ISBN is required')
    .matches(/^[0-9-]+$/, 'ISBN can only contain numbers and hyphens')
    .min(10, 'ISBN must be at least 10 characters'),
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
  stock_quantity: Yup.number()
    .required('Stock quantity is required')
    .integer('Stock quantity must be an integer')
    .min(0, 'Stock quantity cannot be negative')
});

const AddBook = () => {
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const initialValues = {
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    retail_price: '',
    stock_quantity: ''
  };

  const handleSubmit = async (values, { resetForm }) => {
    setSubmitError('');
    setIsSubmitting(true);

    try {
      await addBook(values);
      resetForm();
      navigate('/books');
    } catch (error) {
      console.error('Error adding book:', error);
      setSubmitError(
        error.response?.data?.message || 
        'Failed to add book. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/books');
  };

  if (isSubmitting) {
    return <LoadingSpinner message="Adding book..." />;
  }

  return (
    <Box>
      <PageHeader 
        title="Add New Book" 
        showButton={false}
      />

      <Paper sx={{ p: 3 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={BookSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isValid, dirty }) => (
            <Form>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Field name="isbn">
                    {({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="ISBN"
                        variant="outlined"
                        error={touched.isbn && Boolean(errors.isbn)}
                        helperText={touched.isbn && errors.isbn}
                      />
                    )}
                  </Field>
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

                <Grid item xs={12} md={6}>
                  <Field name="stock_quantity">
                    {({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Stock Quantity"
                        variant="outlined"
                        error={touched.stock_quantity && Boolean(errors.stock_quantity)}
                        helperText={touched.stock_quantity && errors.stock_quantity}
                      />
                    )}
                  </Field>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={!isValid || !dirty}
                    >
                      Add Book
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </Paper>
    </Box>
  );
};

export default AddBook; 