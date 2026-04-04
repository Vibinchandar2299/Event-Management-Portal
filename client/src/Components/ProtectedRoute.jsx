import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredDepartment = null }) => {
  // Get user department from localStorage
  const userDept = localStorage.getItem('user_dept');
  const token = localStorage.getItem('token');

  const deptRequired = typeof requiredDepartment === 'string' && requiredDepartment.trim().length > 0;
  const hasDeptAccess = !deptRequired || (userDept || '').toLowerCase() === requiredDepartment.trim().toLowerCase();
  
  if (!token) {
    // If not logged in, redirect to login page
    return <Navigate to="/" replace />;
  }
  
  // Check if user has the required department access
  if (!hasDeptAccess) {
    // If user doesn't have required department access, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  // If user has access, render the protected component
  return children;
};

export default ProtectedRoute; 