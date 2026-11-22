import React from 'react';
import { IonFooter, IonToolbar, IonIcon } from '@ionic/react';
import {
  homeOutline,
  shieldCheckmarkOutline,
  folderOpenOutline,
  peopleOutline,
  settingsOutline,
  helpCircleOutline,
  documentAttachOutline,
  swapHorizontalOutline,
  analyticsOutline,
  pulseOutline,
} from 'ionicons/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { esSoloAlbacea, usuarioGuardado } from '../services/auth.service';

/**
 * Barra de navegación inferior exclusiva para pantallas móviles (< 768px).
 * Sincroniza el contexto activo con AppMenu mediante el evento 'modo-cambiado'.
 */
export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const rol = localStorage.getItem('user_rol');
  const soloAlbacea = esSoloAlbacea(usuarioGuardado());
  const modo = localStorage.getItem('modo_activo') || (rol === 'ADMIN' ? 'ADMIN' : soloAlbacea ? 'ALBACEA' : 'TITULAR');
  const enModoAdmin = rol === 'ADMIN' && (modo === 'ADMIN' || pathname === '/admin');
  const enModoAlbacea = !enModoAdmin && (soloAlbacea || modo === 'ALBACEA' || pathname === '/guia' || pathname === '/apertura');

  const itemsAdmin = [
    { path: '/admin?tab=resumen', label: 'Resumen', icon: analyticsOutline },
    { path: '/admin?tab=solicitudes', label: 'Alertas', icon: documentAttachOutline },
    { path: '/admin?tab=usuarios', label: 'Usuarios', icon: peopleOutline },
    { path: '/admin?tab=auditoria', label: 'Auditoría', icon: pulseOutline },
    { path: '/configuracion', label: 'Ajustes', icon: settingsOutline },
  ];

  const itemsTitular = [
    { path: '/dashboard', label: 'Inicio', icon: homeOutline },
    { path: '/polizas', label: 'Pólizas', icon: shieldCheckmarkOutline },
    { path: '/inventario', label: 'Activos', icon: folderOpenOutline },
    { path: '/albaceas', label: 'Albaceas', icon: peopleOutline },
    { path: '/configuracion', label: 'Ajustes', icon: settingsOutline },
  ];

  const itemsAlbacea = [
    { path: '/guia', label: 'Panel', icon: helpCircleOutline },
    { path: '/apertura', label: 'Apertura', icon: documentAttachOutline },
    ...(!soloAlbacea
      ? [{ path: '/dashboard', label: 'Mi Baúl', icon: swapHorizontalOutline, switchToTitular: true }]
      : []),
    { path: '/configuracion', label: 'Ajustes', icon: settingsOutline },
  ];

  const items = enModoAdmin ? itemsAdmin : enModoAlbacea ? itemsAlbacea : itemsTitular;

  return (
    <IonFooter className="be-mobile-footer">
      <IonToolbar
        style={
          {
            '--background': 'var(--be-surface)',
            '--color': 'var(--be-text)',
            '--min-height': '56px',
            '--padding-top': '0px',
            '--padding-bottom': '0px',
          } as React.CSSProperties
        }
      >
        <nav className="be-mobile-nav-bar" aria-label="Navegación móvil">
          {items.map((item) => {
            const fullCurrent = pathname + search;
            const isActive =
              (item.path.includes('?') ? fullCurrent === item.path : pathname === item.path) &&
              !('switchToTitular' in item);
            return (
              <button
                key={item.path + item.label}
                type="button"
                className={`be-mobile-nav-btn${isActive ? ' active' : ''}`}
                onClick={() => {
                  if ('switchToTitular' in item && item.switchToTitular) {
                    localStorage.setItem('modo_activo', 'TITULAR');
                    window.dispatchEvent(new Event('modo-cambiado'));
                  }
                  navigate(item.path);
                }}
              >
                <IonIcon icon={item.icon} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </IonToolbar>
    </IonFooter>
  );
};

export default MobileBottomNav;
