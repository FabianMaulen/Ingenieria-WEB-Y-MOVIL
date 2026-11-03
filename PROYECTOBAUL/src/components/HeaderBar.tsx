import React, { useEffect, useState } from 'react';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonMenuButton, 
  IonButton, 
  IonIcon 
} from '@ionic/react';
import { moonOutline, sunnyOutline } from 'ionicons/icons';

interface HeaderBarProps {
  title?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ title }) => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [nombreUsuario, setNombreUsuario] = useState<string>('');

  useEffect(() => {
    // 1. Detectar si el modo oscuro está activo en la app
    const darkModeActive = document.body.classList.contains('dark');
    setIsDark(darkModeActive);

    // 2. Obtener el primer nombre del usuario logueado desde localStorage
    const savedName = localStorage.getItem('user_nombre');
    if (savedName) {
      setNombreUsuario(savedName.split(' ')[0]);
    }
  }, []);

  const toggleTheme = () => {
    const newDarkState = !isDark;
    setIsDark(newDarkState);
    document.body.classList.toggle('dark', newDarkState);
  };

  // Si la página le pasa un título (ej: "Mis Pólizas"), usa ese; de lo contrario usa "Baúl de [Nombre]"
  const tituloMostrar = title || (nombreUsuario ? `Baúl de ${nombreUsuario}` : 'Baúl Eterno');

  return (
    <IonHeader translucent={true}>
      <IonToolbar color="primary">
        {/* Botón de menú lateral hamburguesa */}
        <IonButtons slot="start">
          <IonMenuButton />
        </IonButtons>

        {/* Título dinámico de la cabecera */}
        <IonTitle>{tituloMostrar}</IonTitle>

        {/* Botón de cambio de tema Claro/Oscuro sin alerts basura */}
        <IonButtons slot="end">
          <IonButton onClick={toggleTheme} title="Cambiar tema">
            <IonIcon slot="icon-only" icon={isDark ? sunnyOutline : moonOutline} />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default HeaderBar;