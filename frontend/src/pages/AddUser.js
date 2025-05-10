import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  Alert,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { createUser } from '../services/userService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';

// Validation schema
const UserSchema = Yup.object().shape({
  username: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(80, 'Username cannot exceed 80 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  real_name: Yup.string()
    .required('Name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  employee_id: Yup.string()
    .required('Employee ID is required')
    .max(50, 'Employee ID cannot exceed 50 characters'),
  gender: Yup.string()
    .required('Gender is required'),
  age: Yup.number()
    .required('Age is required')
    .positive('Age must be positive')
    .integer('Age must be a whole number')
    .min(18, 'Age must be at least 18')
    .max(100, 'Age cannot exceed 100'),
  is_super_admin: Yup.boolean()
});

const AddUser = () => {
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const initialValues = {
    username: '',
    password: '',
    real_name: '',
    employee_id: '',
    gender: '',
    age: '',
    is_super_admin: false
  };

  const handleSubmit = async (values, { resetForm }) => {
    setSubmitError('');
    setIsSubmitting(true);

    try {
      // Transform values to match API expectations
      const userData = {
        ...values,
        role: values.is_super_admin ? 'super_admin' : 'admin'
      };
      delete userData.is_super_admin;

      await createUser(userData);
      resetForm();
      navigate('/users');
    } catch (error) {
      console.error('Error creating user:', error);
      setSubmitError(
        error.response?.data?.message || 
        'Failed to create user. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/users');
  };

  if (isSubmitting) {
    return <LoadingSpinner message="Creating user..." />;
  }

  return (
    <Box>
      <PageHeader 
        title="Add New User" 
        showButton={false}
      />

      <Paper sx={{ p: 3 }}>
        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        <Typography variant="h6" gutterBottom>
          User Information
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Formik
          initialValues={initialValues}
          validationSchema={UserSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isValid, dirty, values, setFieldValue }) => (
            <Form>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Field name="username">
                    {({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Username"
                        variant="outlined"
                        error={touched.username && Boolean(errors.username)}
                        helperText={touched.username && errors.username}
                      />
                    )}
                  </Field>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field name="password">
                    {({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Password"
                        type="password"
                        variant="outlined"
                        error={touched.password && Boolean(errors.password)}
                        helperText={touched.password && errors.password}
                      />
                    )}
                  </Field>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field name="real_name">
                    {({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Full Name"
                        variant="outlined"
                        error={touched.real_name && Boolean(errors.real_name)}
                        helperText={touched.real_name && errors.real_name}
                      />
                    )}
                  </Field>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field name="employee_id">
                    {({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Employee ID"
                        variant="outlined"
                        error={touched.employee_id && Boolean(errors.employee_id)}
                        helperText={touched.employee_id && errors.employee_id}
                      />
                    )}
                  </Field>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field name="gender">
                    {({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Gender"
                        variant="outlined"
                        select
                        SelectProps={{ native: true }}
                        error={touched.gender && Boolean(errors.gender)}
                        helperText={touched.gender && errors.gender}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </TextField>
                    )}
                  </Field>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field name="age">
                    {({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Age"
                        variant="outlined"
                        error={touched.age && Boolean(errors.age)}
                        helperText={touched.age && errors.age}
                      />
                    )}
                  </Field>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={values.is_super_admin}
                        onChange={(e) => setFieldValue('is_super_admin', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Super Administrator Access"
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 2 }}>
                    Super Administrators can manage all users and system functions
                  </Typography>
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
                      disabled={!isValid || !dirty || isSubmitting}
                    >
                      Create User
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

export default AddUser; 