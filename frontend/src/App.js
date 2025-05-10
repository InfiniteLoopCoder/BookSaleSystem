import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import AddBook from './pages/AddBook';
import Purchases from './pages/Purchases';
import AddPurchase from './pages/AddPurchase';
import Sales from './pages/Sales';
import AddSale from './pages/AddSale';
import Users from './pages/Users';
import AddUser from './pages/AddUser';
import EditUser from './pages/EditUser';
import UserProfile from './pages/UserProfile';
import Finance from './pages/Finance';
import NotFound from './pages/NotFound';

// Protected Route component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Check if role is required and user has that role
  if (requiredRole === 'super_admin' && !user.is_super_admin) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Books Routes */}
        <Route path="books" element={<Books />} />
        <Route path="books/:id" element={<BookDetail />} />
        <Route path="books/add" element={<AddBook />} />
        
        {/* Purchases Routes */}
        <Route path="purchases" element={<Purchases />} />
        <Route path="purchases/add" element={<AddPurchase />} />
        
        {/* Sales Routes */}
        <Route path="sales" element={<Sales />} />
        <Route path="sales/add" element={<AddSale />} />
        
        {/* Finance Routes */}
        <Route path="finance" element={<Finance />} />
        
        {/* User Routes */}
        <Route path="users" element={
          <ProtectedRoute requiredRole="super_admin">
            <Users />
          </ProtectedRoute>
        } />
        <Route path="users/add" element={
          <ProtectedRoute requiredRole="super_admin">
            <AddUser />
          </ProtectedRoute>
        } />
        <Route path="users/:id/edit" element={
          <ProtectedRoute requiredRole="super_admin">
            <EditUser />
          </ProtectedRoute>
        } />
        <Route path="profile" element={<UserProfile />} />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App; 