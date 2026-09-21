import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Polizas } from '../pages/Polizas';
import { Mensajes } from '../pages/Mensajes';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuth = localStorage.getItem('auth_token') !== null;
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <IonRouterOutlet>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/polizas"
          element={
            <ProtectedRoute>
              <Polizas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mensajes"
          element={
            <ProtectedRoute>
              <Mensajes />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </IonRouterOutlet>
  );
};