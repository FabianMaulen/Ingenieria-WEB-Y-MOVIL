import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { IonRouterOutlet, IonSplitPane } from '@ionic/react';
import { AppMenu } from '../components/AppMenu';
import { RutaProtegida } from './RutaProtegida';

import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { ForgotPassword } from '../pages/ForgotPassword';
import { GoogleCallback } from '../pages/GoogleCallback';
import { Dashboard } from '../pages/Dashboard';
import { Polizas } from '../pages/Polizas';
import { Albaceas } from '../pages/Albaceas';
import { Mensajes } from '../pages/Mensajes';
import { Inventario } from '../pages/Inventario';
import { Apertura } from '../pages/Apertura';
import { Guia } from '../pages/Guia';
import { Configuracion } from '../pages/Configuracion';
import { AdminPanel } from '../pages/AdminPanel';

const AppShellProtegido: React.FC = () => (
  <IonSplitPane
    contentId="main-content"
    when="md"
    style={
      {
        '--side-width': '250px',
        '--side-min-width': '250px',
        '--side-max-width': '250px',
      } as React.CSSProperties
    }
  >
    <AppMenu />

    <IonRouterOutlet id="main-content">
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/polizas" element={<Polizas />} />
        <Route path="/inventario" element={<Inventario />} />
        <Route path="/albaceas" element={<Albaceas />} />
        <Route path="/mensajes" element={<Mensajes />} />
        <Route path="/apertura" element={<Apertura />} />
        <Route path="/guia" element={<Guia />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route
          path="/admin"
          element={
            <RutaProtegida roles={['ADMIN']}>
              <AdminPanel />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </IonRouterOutlet>
  </IonSplitPane>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/recuperar" element={<ForgotPassword />} />
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Rutas Privadas protegidas con RutaProtegida */}
      <Route
        path="/*"
        element={
          <RutaProtegida>
            <AppShellProtegido />
          </RutaProtegida>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
