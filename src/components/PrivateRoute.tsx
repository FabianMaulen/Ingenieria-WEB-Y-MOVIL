import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: React.ReactElement;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const isAuthenticated = Boolean(localStorage.getItem('user_token'));

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};