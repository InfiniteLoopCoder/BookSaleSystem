import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  TextField, 
  Button, 
  Alert,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Save as SaveIcon,
  Lock as LockIcon 
} from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword, getUser } from '../services/userService';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Validation schema for profile
const ProfileSchema = Yup.object().shape({
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
});

// Validation schema for password change
const PasswordSchema = Yup.object().shape({
  current_password: Yup.string()
    .required('Current password is required'),
  new_password: Yup.string()
    .required('New password is required')
    .min(6, 'Password must be at least 6 characters long'),
  confirm_password: Yup.string()
    .required('Please confirm your new password')
    .oneOf([Yup.ref('new_password')], 'Passwords must match'),
});

const UserProfile = () => {
  const { user, updateUserInfo } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch complete user details when component mounts
  useEffect(() => {
    if (user && user.id) {
      fetchUserDetails();
    }
  }, [user?.id]);

  const fetchUserDetails = async () => {
    // Only fetch if missing some fields that should be in profile
    if (!user.employee_id || !user.gender || user.age === undefined) {
      setIsLoading(true);
      try {
        const userData = await getUser(user.id);
        updateUserInfo(userData);
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    setSubmitError('');
    setSubmitSuccess('');
  };

  const handleProfileSubmit = async (values) => {
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true);
    
    try {
      const response = await updateProfile(values);
      updateUserInfo(response);
      setSubmitSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setSubmitError(
        error.response?.data?.message || 
        'Failed to update profile. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (values, { resetForm }) => {
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmitting(true);
    
    try {
      await changePassword({
        current_password: values.current_password,
        new_password: values.new_password
      });
      resetForm();
      setSubmitSuccess('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      setSubmitError(
        error.response?.data?.message || 
        'Failed to change password. Please check your current password and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user) {
    return <LoadingSpinner message="Loading user profile..." />;
  }

  return (
    <Box>
      <PageHeader 
        title="User Profile" 
        showButton={false}
      />

      <Paper sx={{ p: 3 }}>
        <Tabs 
          value={tabIndex} 
          onChange={handleTabChange}
          sx={{ mb: 3 }}
        >
          <Tab label="Profile Information" />
          <Tab label="Change Password" />
        </Tabs>

        <Divider sx={{ mb: 3 }} />

        {submitError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {submitError}
          </Alert>
        )}

        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {submitSuccess}
          </Alert>
        )}

        {tabIndex === 0 && (
          <Formik
            initialValues={{
              real_name: user.real_name || '',
              employee_id: user.employee_id || '',
              gender: user.gender || '',
              age: user.age || '',
            }}
            validationSchema={ProfileSchema}
            onSubmit={handleProfileSubmit}
          >
            {({ errors, touched, isValid }) => (
              <Form>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Username: {user.username}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Role: {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </Typography>
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
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
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
        )}

        {tabIndex === 1 && (
          <Formik
            initialValues={{
              current_password: '',
              new_password: '',
              confirm_password: '',
            }}
            validationSchema={PasswordSchema}
            onSubmit={handlePasswordSubmit}
          >
            {({ errors, touched, isValid, dirty }) => (
              <Form>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Field name="current_password">
                      {({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="password"
                          label="Current Password"
                          variant="outlined"
                          error={touched.current_password && Boolean(errors.current_password)}
                          helperText={touched.current_password && errors.current_password}
                        />
                      )}
                    </Field>
                  </Grid>

                  <Grid item xs={12} md={6}></Grid>

                  <Grid item xs={12} md={6}>
                    <Field name="new_password">
                      {({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="password"
                          label="New Password"
                          variant="outlined"
                          error={touched.new_password && Boolean(errors.new_password)}
                          helperText={touched.new_password && errors.new_password}
                        />
                      )}
                    </Field>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Field name="confirm_password">
                      {({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="password"
                          label="Confirm New Password"
                          variant="outlined"
                          error={touched.confirm_password && Boolean(errors.confirm_password)}
                          helperText={touched.confirm_password && errors.confirm_password}
                        />
                      )}
                    </Field>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<LockIcon />}
                        disabled={!isValid || !dirty || isSubmitting}
                      >
                        {isSubmitting ? 'Changing Password...' : 'Change Password'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        )}
      </Paper>
    </Box>
  );
};

export default UserProfile; 