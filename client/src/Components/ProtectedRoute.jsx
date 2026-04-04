import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const isAcademicDepartment = (deptRaw) => {
  const dept = String(deptRaw || '').trim().toLowerCase();
  if (!dept) return false;

  const collegeWide = new Set(['iqac', 'admin', 'system admin', 'systemadmin']);
  const serviceTeams = new Set([
    'communication',
    'media',
    'food',
    'transport',
    'guestroom',
    'guest room',
    'guest department',
    'guest deparment',
  ]);

  if (collegeWide.has(dept)) return false;
  if (serviceTeams.has(dept)) return false;
  if (dept.includes('admin')) return false;
  return true;
};

const ProtectedRoute = ({ children, requiredDepartment = null, blockAcademic = false }) => {
  const userDept = localStorage.getItem('user_dept');
  const token = localStorage.getItem('token');

  let effectiveDept = userDept;
  if (!effectiveDept && token) {
    try {
      const decoded = jwtDecode(token);
      effectiveDept = decoded?.dept || '';
    } catch {
      effectiveDept = '';
    }
  }

  const normalize = (value) => String(value || '').trim().toLowerCase();
  const canonicalize = (dept) => {
    const d = normalize(dept);
    if (!d) return '';
    if (d === 'systemadmin' || d === 'admin') return 'system admin';
    return d;
  };

  const requiredList = Array.isArray(requiredDepartment)
    ? requiredDepartment.map(canonicalize).filter(Boolean)
    : typeof requiredDepartment === 'string'
      ? [canonicalize(requiredDepartment)].filter(Boolean)
      : [];

  const hasDeptAccess =
    requiredList.length === 0 || requiredList.includes(canonicalize(effectiveDept));

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (blockAcademic && isAcademicDepartment(effectiveDept)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!hasDeptAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;