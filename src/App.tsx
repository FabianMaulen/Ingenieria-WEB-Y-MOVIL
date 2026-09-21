import React, { useState } from 'react';
import { Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './theme/custom.css';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PolizasPage } from './pages/PolizasPage';
import { AlbaceasPage } from './pages/AlbaceasPage';
import { MensajesPage } from './pages/MensajesPage';
import { CheckInPage } from './pages/CheckInPage';
import { SolicitudAperturaPage } from './pages/SolicitudAperturaPage';
import { GuiaCobroPage } from './pages/GuiaCobroPage';
import { InventarioDigitalPage } from './pages/InventarioDigitalPage';
import { PrivateRoute } from './components/PrivateRoute';

setupIonicReact();

const SidebarNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const mainMenuItems = [
    { label: 'Pólizas', path: '/vault/polizas' },
    { label: 'Albaceas', path: '/vault/albaceas' },
    { label: 'Mensajes', path: '/vault/mensajes' },
    { label: 'Inventario', path: '/vault/inventario' },
    { label: 'Vigencia', path: '/vault/checkin' },
    { label: 'Apertura', path: '/vault/solicitud' },
    { label: 'Guía', path: '/vault/guia' },
  ];

  const userMenuItems = [
    { label: 'Perfil', path: '/vault/perfil' },
    { label: 'Cerrar Sesión', path: '/login' },
  ];

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: isCollapsed ? '60px' : '240px',
      }}
    >
      {}
      <div style={styles.header}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={styles.toggleBtn}
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {isCollapsed ? '☰' : '✕'}
        </button>

        {!isCollapsed && <span style={styles.title}>Baúl Eterno</span>}
      </div>

      {}
      <nav style={styles.navList}>
        {mainMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navButton,
                ...(isActive ? styles.activeButton : {}),
                justifyContent: isCollapsed ? 'center' : 'flex-start',
              }}
              title={isCollapsed ? item.label : undefined}
            >
              {isCollapsed ? item.label.charAt(0) : item.label}
            </button>
          );
        })}
      </nav>

      {}
      <div style={styles.bottomSection}>
        <div style={styles.divider} />
        {userMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                if (item.path === '/login') {
                  localStorage.removeItem('auth_token');
                }
                navigate(item.path);
              }}
              style={{
                ...styles.navButton,
                ...(isActive ? styles.activeButton : {}),
                color: item.path === '/login' ? '#ef4444' : '#ced4da',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
              }}
              title={isCollapsed ? item.label : undefined}
            >
              {isCollapsed ? item.label.charAt(0) : item.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

const VaultLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <SidebarNav />
      <div style={{ flex: 1, position: 'relative', height: '100%', overflowY: 'auto' }}>
        <IonRouterOutlet>
          <Route path="polizas" element={<PrivateRoute><PolizasPage /></PrivateRoute>} />
          <Route path="albaceas" element={<PrivateRoute><AlbaceasPage /></PrivateRoute>} />
          <Route path="mensajes" element={<PrivateRoute><MensajesPage /></PrivateRoute>} />
          <Route path="inventario" element={<PrivateRoute><InventarioDigitalPage /></PrivateRoute>} />
          <Route path="checkin" element={<PrivateRoute><CheckInPage /></PrivateRoute>} />
          <Route path="solicitud" element={<PrivateRoute><SolicitudAperturaPage /></PrivateRoute>} />
          <Route path="guia" element={<PrivateRoute><GuiaCobroPage /></PrivateRoute>} />
        </IonRouterOutlet>
      </div>
    </div>
  );
};

export const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/vault/*" element={<VaultLayout />} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

const styles: { [key: string]: React.CSSProperties } = {
  sidebar: {
    backgroundColor: '#1b222c',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 12px',
    boxSizing: 'border-box',
    borderRight: '1px solid #2d3748',
    transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 1000,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '16px',
    borderBottom: '1px solid #2d3748',
    marginBottom: '16px',
    height: '40px',
  },
  toggleBtn: {
    backgroundColor: '#2d3748',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    width: '36px',
    height: '36px',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    color: '#ffffff',
  },
  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  navButton: {
    backgroundColor: 'transparent',
    color: '#cbd5e1',
    border: 'none',
    textAlign: 'left',
    padding: '12px 14px',
    fontSize: '14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    transition: 'all 0.15s ease',
  },
  activeButton: {
    backgroundColor: '#2563eb', 
    color: '#ffffff',
    fontWeight: 600,
  },
  bottomSection: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#2d3748',
    marginBottom: '8px',
  },
};

export default App;