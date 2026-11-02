import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { IonRouterOutlet, IonSplitPane } from '@ionic/react';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { Dashboard } from '../pages/Dashboard';
import { Polizas } from '../pages/Polizas';
import { Apertura } from '../pages/Apertura';
import { Mensajes } from '../pages/Mensajes';
import { Albaceas } from '../pages/Albaceas';
import { Inventario } from '../pages/Inventario';
import { Guia } from '../pages/Guia';

// Layout protegido con verificación de autenticación
const ProtectedLayout: React.FC<{ component: React.ComponentType<any> }> = ({ component: Component }) => {
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
      <Component />
    </IonSplitPane>
  );
};

export const AppRoutes: React.FC = () => {
  return (
    <IonRouterOutlet>
      {/* Rutas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Rutas Protegidas */}
      <Route path="/dashboard" element={<ProtectedLayout component={Dashboard} />} />
      <Route path="/polizas" element={<ProtectedLayout component={Polizas} />} />
      <Route path="/albaceas" element={<ProtectedLayout component={Albaceas} />} />
      <Route path="/mensajes" element={<ProtectedLayout component={Mensajes} />} />
      <Route path="/inventario" element={<ProtectedLayout component={Inventario} />} />
      <Route path="/apertura" element={<ProtectedLayout component={Apertura} />} />
      <Route path="/guia" element={<ProtectedLayout component={Guia} />} />

      {/* Redirección por defecto */}
      <Route path="/" element={<Navigate to="/login" replace />} />
    </IonRouterOutlet>
  );
};

export default AppRoutes;