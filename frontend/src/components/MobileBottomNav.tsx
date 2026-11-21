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
} from 'ionicons/icons';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Barra de navegación inferior exclusiva para pantallas móviles (< 768px).
 * Sincroniza el contexto activo con AppMenu mediante el evento 'modo-cambiado'.
 */
export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const modo = localStorage.getItem('modo_activo') || 'TITULAR';
  const enModoAlbacea = modo === 'ALBACEA' || pathname === '/guia' || pathname === '/apertura';

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
    { path: '/dashboard', label: 'Mi Baúl', icon: swapHorizontalOutline, switchToTitular: true },
    { path: '/configuracion', label: 'Ajustes', icon: settingsOutline },
  ];

  const items = enModoAlbacea ? itemsAlbacea : itemsTitular;

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
            const isActive = pathname === item.path && !('switchToTitular' in item);
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
