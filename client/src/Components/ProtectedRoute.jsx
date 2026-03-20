import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredDepartment = 'iqac' }) => {
  // Get user department from localStorage
  const userDept = localStorage.getItem('user_dept');
  const token = localStorage.getItem('token');
  
  console.log('ProtectedRoute Debug:', {
    userDept,
    requiredDepartment,
    hasToken: !!token,
    hasAccess: userDept?.toLowerCase() === requiredDepartment.toLowerCase()
  });
  
  if (!token) {
    // If not logged in, redirect to login page
    console.log('No token found, redirecting to login');
    return <Navigate to="/" replace />;
  }
  
  // Check if user has the required department access
  if (requiredDepartment && userDept?.toLowerCase() !== requiredDepartment.toLowerCase()) {
    // If user doesn't have required department access, redirect to dashboard
    console.log(`Access denied: User department '${userDept}' does not match required '${requiredDepartment}'`);
    return <Navigate to="/dashboard" replace />;
  }
  
  // If user has access, render the protected component
  console.log('Access granted to protected route');
  return children;
};

export default ProtectedRoute; 