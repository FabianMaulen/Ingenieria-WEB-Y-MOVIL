import React, { useEffect, useState } from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonAvatar
} from '@ionic/react';
import {
  homeOutline,
  shieldCheckmarkOutline,
  peopleOutline,
  mailOutline,
  settingsOutline,
  logOutOutline
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

export const AppMenu: React.FC = () => {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState<string>('Usuario');
  const [rol, setRol] = useState<string>('TITULAR');

  useEffect(() => {
    const nombreGuardado = localStorage.getItem('user_nombre');
    const rolGuardado = localStorage.getItem('user_rol');

    if (nombreGuardado) setNombre(nombreGuardado);
    if (rolGuardado) setRol(rolGuardado);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login', { replace: true });
  };

  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Menú Principal</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Cabecera con datos del Usuario Activo */}
        <div style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'var(--header-avatar-bg, #f8fafc)',
          borderBottom: '1px solid var(--header-avatar-border, #e2e8f0)',
          color: 'var(--ion-text-color, #0f172a)'
        }}>
          <IonAvatar style={{
            width: '42px',
            height: '42px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.1rem'
          }}>
            {inicial}
          </IonAvatar>

          <div>
            <h3 style={{
              margin: 0,
              fontSize: '0.95rem',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              {nombre}
            </h3>
            <span style={{
              fontSize: '0.75rem',
              opacity: 0.7,
              textTransform: 'lowercase',
              color: 'var(--ion-text-color)'
            }}>
              {rol}
            </span>
          </div>
        </div>

        <IonList lines="none" style={{ background: 'transparent' }}>
          <IonMenuToggle autoHide={false}>
            <IonItem button onClick={() => navigate('/dashboard')}>
              <IonIcon slot="start" icon={homeOutline} />
              <IonLabel>Inicio (Dashboard)</IonLabel>
            </IonItem>

            <IonItem button onClick={() => navigate('/polizas')}>
              <IonIcon slot="start" icon={shieldCheckmarkOutline} />
              <IonLabel>Pólizas y Seguros</IonLabel>
            </IonItem>

            <IonItem button onClick={() => navigate('/albaceas')}>
              <IonIcon slot="start" icon={peopleOutline} />
              <IonLabel>Albaceas Designados</IonLabel>
            </IonItem>

            <IonItem button onClick={() => navigate('/mensajes')}>
              <IonIcon slot="start" icon={mailOutline} />
              <IonLabel>Mensajes Póstumos</IonLabel>
            </IonItem>

            <IonItem button onClick={() => navigate('/dashboard')}>
              <IonIcon slot="start" icon={settingsOutline} />
              <IonLabel>Configuración</IonLabel>
            </IonItem>

            <IonItem button onClick={handleLogout} style={{ marginTop: '16px' }}>
              <IonIcon slot="start" icon={logOutOutline} color="danger" />
              <IonLabel color="danger">Cerrar Sesión</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default AppMenu;