import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';

// Componente para proteger rutas privadas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuth = localStorage.getItem('auth_token') !== null;
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <IonRouterOutlet>
      {/* Ruta pública */}
      <Route path="/login" element={<Login />} />

      {/* Ruta protegida: exige login obligatorio */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Redirección por defecto */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </IonRouterOutlet>
  );
};