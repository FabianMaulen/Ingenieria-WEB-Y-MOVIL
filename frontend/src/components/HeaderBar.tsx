import React, { useEffect, useState } from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { arrowBackOutline, moonOutline, sunnyOutline } from 'ionicons/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { alternarTema, obtenerTemaOscuro } from '../utils/theme';

interface HeaderBarProps {
  title?: string;
  showBack?: boolean;
}

const RUTAS_PRINCIPALES = ['/dashboard', '/guia'];

export const HeaderBar: React.FC<HeaderBarProps> = ({ title, showBack }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isDark, setIsDark] = useState<boolean>(() => obtenerTemaOscuro());
  const [nombreUsuario, setNombreUsuario] = useState<string>('');

  useEffect(() => {
    const savedName = localStorage.getItem('user_nombre');
    if (savedName) {
      setNombreUsuario(savedName.split(' ')[0]);
    }

    const onThemeChange = () => setIsDark(obtenerTemaOscuro());
    window.addEventListener('theme-changed', onThemeChange);
    return () => window.removeEventListener('theme-changed', onThemeChange);
  }, []);

  const handleToggleTheme = () => {
    const nuevo = alternarTema();
    setIsDark(nuevo);
  };

  const debeMostrarVolver =
    typeof showBack === 'boolean' ? showBack : !RUTAS_PRINCIPALES.includes(pathname);

  const handleVolver = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      const modo = localStorage.getItem('modo_activo');
      navigate(modo === 'ALBACEA' ? '/guia' : '/dashboard');
    }
  };

  const tituloMostrar = title || (nombreUsuario ? `Baúl de ${nombreUsuario}` : 'Baúl Eterno');

  return (
    <IonHeader className="ion-no-border">
      <IonToolbar
        style={
          {
            '--background': 'var(--ion-toolbar-background)',
            '--color': 'var(--ion-toolbar-color)',
            '--min-height': '56px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          } as React.CSSProperties
        }
      >
        <IonButtons slot="start">
          {debeMostrarVolver && (
            <IonButton
              className="be-back-mobile-only"
              onClick={handleVolver}
              aria-label="Volver atrás"
              title="Volver"
            >
              <IonIcon slot="icon-only" icon={arrowBackOutline} />
            </IonButton>
          )}
          <IonMenuButton autoHide={true} />
        </IonButtons>

        <IonTitle style={{ fontSize: '1.02rem', fontWeight: 700 }}>{tituloMostrar}</IonTitle>

        <IonButtons slot="end">
          <IonButton
            onClick={handleToggleTheme}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <IonIcon slot="icon-only" icon={isDark ? sunnyOutline : moonOutline} />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default HeaderBar;
