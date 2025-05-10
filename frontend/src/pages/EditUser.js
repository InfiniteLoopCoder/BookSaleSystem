import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  TextField, 
  Button, 
  Alert,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { 
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Lock as LockIcon,
  DeleteOutline as DeleteIcon
} from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useParams, useNavigate } from 'react-router-dom';
import { getUser, updateUser, resetUserPassword, deleteUser } from '../services/userService';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Validation schema
const UserSchema = Yup.object().shape({
  username: Yup.string()
    .required('Username is required')
    .max(50, 'Username cannot exceed 50 characters'),
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

// Password schema
const PasswordSchema = Yup.object().shape({
  new_password: Yup.string()
    .required('New password is required')
    .min(6, 'Password must be at least 6 characters long'),
  confirm_password: Yup.string()
    .required('Please confirm the new password')
    .oneOf([Yup.ref('new_password')], 'Passwords must match'),
});

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const userData = await getUser(id);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
      setSubmitError('Failed to fetch user information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/users');
  };

  const handleSubmit = async (values) => {
    setSubmitError('');
    setSubmitSuccess('');
    setIsLoading(true);
    
    try {
      await updateUser(id, values);
      setSubmitSuccess('User updated successfully!');
      setTimeout(() => {
        navigate('/users');
      }, 1500);
    } catch (error) {
      console.error('Error updating user:', error);
      setSubmitError(
        error.response?.data?.message || 
        'Failed to update user. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenResetDialog = () => {
    setIsResetDialogOpen(true);
    setResetPasswordError('');
    setResetPasswordSuccess('');
  };

  const handleCloseResetDialog = () => {
    setIsResetDialogOpen(false);
  };

  const handleOpenDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  const handleResetPassword = async (values, { resetForm }) => {
    setResetPasswordError('');
    setResetPasswordSuccess('');
    setIsLoading(true);
    
    try {
      await resetUserPassword(id, values.new_password);
      setResetPasswordSuccess('Password reset successfully');
      resetForm();
      setTimeout(() => {
        handleCloseResetDialog();
      }, 1500);
    } catch (error) {
      console.error('Error resetting password:', error);
      setResetPasswordError(
        error.response?.data?.message || 
        'Failed to reset password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsLoading(true);
    
    try {
      await deleteUser(id);
      handleCloseDeleteDialog();
      navigate('/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      setSubmitError(
        error.response?.data?.message || 
        'Failed to delete user. Please try again.'
      );
      handleCloseDeleteDialog();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !user) {
    return <LoadingSpinner message="Loading user information..." />;
  }

  if (!user) {
    return (
      <Box>
        <PageHeader title="Edit User" showButton={false} />
        <Paper sx={{ p: 3 }}>
          <Alert severity="error">
            User not found or you don't have permission to view this user.
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleCancel}
            >
              Back to Users
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader 
        title={`Edit User: ${user.real_name}`}
        buttonText="Back to Users"
        buttonPath="/users"
        buttonIcon={<ArrowBackIcon />}
      />

      <Paper sx={{ p: 3 }}>
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

        <Formik
          initialValues={{
            username: user.username || '',
            real_name: user.real_name || '',
            employee_id: user.employee_id || '',
            gender: user.gender || '',
            age: user.age || '',
          }}
          validationSchema={UserSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isValid }) => (
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
                  <Field name="gender">
                    {({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Gender"
                        variant="outlined"
                        select
                        error={touched.gender && Boolean(errors.gender)}
                        helperText={touched.gender && errors.gender}
                      >
                        <MenuItem value="">Select Gender</MenuItem>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2 }}>
                    <Box>
                      <Button
                        type="button"
                        variant="outlined"
                        color="primary"
                        startIcon={<LockIcon />}
                        onClick={handleOpenResetDialog}
                        sx={{ mr: 2 }}
                      >
                        Reset Password
                      </Button>
                      <Button
                        type="button"
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleOpenDeleteDialog}
                      >
                        Delete User
                      </Button>
                    </Box>
                    
                    <Box>
                      <Button
                        type="button"
                        variant="outlined"
                        color="secondary" 
                        onClick={handleCancel}
                        sx={{ mr: 2 }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        disabled={!isValid || isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
      </Paper>

      {/* Reset Password Dialog */}
      <Dialog open={isResetDialogOpen} onClose={handleCloseResetDialog}>
        <DialogTitle>Reset User Password</DialogTitle>
        <Formik
          initialValues={{
            new_password: '',
            confirm_password: ''
          }}
          validationSchema={PasswordSchema}
          onSubmit={handleResetPassword}
        >
          {({ errors, touched, isValid }) => (
            <Form>
              <DialogContent>
                <DialogContentText>
                  Enter a new password for {user?.real_name}. This will immediately reset their current password.
                </DialogContentText>

                {resetPasswordError && (
                  <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
                    {resetPasswordError}
                  </Alert>
                )}

                {resetPasswordSuccess && (
                  <Alert severity="success" sx={{ mb: 2, mt: 2 }}>
                    {resetPasswordSuccess}
                  </Alert>
                )}

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12}>
                    <Field name="new_password">
                      {({ field }) => (
                        <TextField
                          {...field}
                          type="password"
                          label="New Password"
                          fullWidth
                          error={touched.new_password && Boolean(errors.new_password)}
                          helperText={touched.new_password && errors.new_password}
                        />
                      )}
                    </Field>
                  </Grid>
                  <Grid item xs={12}>
                    <Field name="confirm_password">
                      {({ field }) => (
                        <TextField
                          {...field}
                          type="password"
                          label="Confirm Password"
                          fullWidth
                          error={touched.confirm_password && Boolean(errors.confirm_password)}
                          helperText={touched.confirm_password && errors.confirm_password}
                        />
                      )}
                    </Field>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseResetDialog} color="secondary">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  color="primary" 
                  disabled={!isValid || isLoading}
                >
                  Reset Password
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user {user?.real_name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteUser} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EditUser; 