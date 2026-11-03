import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { IonRouterOutlet, IonSplitPane } from '@ionic/react';
import { AppMenu } from '../components/AppMenu';

import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Dashboard } from '../pages/Dashboard';
import { Polizas } from '../pages/Polizas';
import { Albaceas } from '../pages/Albaceas';
import { Mensajes } from '../pages/Mensajes';
import { Inventario } from '../pages/Inventario';
import { Apertura } from '../pages/Apertura';
import { Guia } from '../pages/Guia';
import { Configuracion } from '../pages/Configuracion'; // <--- Importación agregada

// Layout protegido: Mantiene un solo IonSplitPane y AppMenu para todas las rutas privadas
const ProtectedLayout: React.FC = () => {
  const isAuth = localStorage.getItem('auth_token') !== null;

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return (
    <IonSplitPane 
      contentId="main-content" 
      when="md"
      style={{
        '--side-width': '220px',
        '--side-min-width': '220px',
        '--side-max-width': '220px'
      } as any}
    >
      {/* El menú lateral único para toda la app protegida */}
      <AppMenu />

      {/* Salida donde se intercambian las páginas sin destruir el menú */}
      <IonRouterOutlet id="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/polizas" element={<Polizas />} />
          <Route path="/albaceas" element={<Albaceas />} />
          <Route path="/mensajes" element={<Mensajes />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/apertura" element={<Apertura />} />
          <Route path="/guia" element={<Guia />} />
          <Route path="/configuracion" element={<Configuracion />} /> 
        </Routes>
      </IonRouterOutlet>
    </IonSplitPane>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rutas Públicas (Sin menú lateral) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Rutas Protegidas (Con menú lateral global) */}
      <Route path="/*" element={<ProtectedLayout />} />

      {/* Redirección por defecto */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;