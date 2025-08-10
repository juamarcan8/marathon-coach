import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  // Si no hay token, lo mandamos al login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}