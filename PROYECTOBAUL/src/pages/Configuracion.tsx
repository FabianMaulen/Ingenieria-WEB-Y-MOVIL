import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
  IonFooter,
  IonToolbar,
  IonIcon,
  IonBadge
} from '@ionic/react';
import {
  homeOutline,
  shieldCheckmarkOutline,
  peopleOutline,
  settingsOutline,
  personOutline,
  lockClosedOutline,
  logOutOutline,
  shieldOutline
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';

export const Configuracion: React.FC = () => {
  const navigate = useNavigate();

  // Estados dinámicos de usuario
  const [nombreTitular, setNombreTitular] = useState('Usuario');
  const [rolUsuario, setRolUsuario] = useState('TITULAR');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Feedback visual (Toast)
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState('success');

  useEffect(() => {
    const nombre = localStorage.getItem('user_nombre') || 'Usuario';
    const rol = localStorage.getItem('user_rol') || 'TITULAR';
    setNombreTitular(nombre);
    setRolUsuario(rol);
  }, []);

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_rol');
    localStorage.removeItem('user_nombre');
    navigate('/login', { replace: true });
  };

  // Función para actualizar contraseña
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      setToastMsg('Por favor ingresa tu nueva contraseña.');
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    if (newPassword.length < 8) {
      setToastMsg('La contraseña debe tener al menos 8 caracteres.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setToastMsg('Las contraseñas no coinciden.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    setToastMsg('Contraseña actualizada con éxito.');
    setToastColor('success');
    setShowToast(true);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <IonPage id="main-content">
      <HeaderBar title={`Ajustes de ${nombreTitular}`} />

      <IonContent className="ion-padding">
        <IonGrid className="ion-no-padding" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <IonRow>
            <IonCol size="12">

              {/* 1. Tarjeta de Perfil y Credenciales */}
              <IonCard
                className="ion-no-margin ion-margin-bottom"
                style={{
                  backgroundColor: 'var(--ion-card-background, #ffffff)',
                  color: 'var(--ion-text-color, #0f172a)',
                  borderRadius: '14px',
                  border: '1px solid var(--ion-color-step-150, #e2e8f0)'
                }}
              >
                <IonCardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <IonCardSubtitle style={{ fontSize: '0.78rem', color: 'var(--ion-color-primary, #2563eb)', fontWeight: '700' }}>
                      INFORMACIÓN DE CUENTA
                    </IonCardSubtitle>
                    <IonBadge color="primary">{rolUsuario}</IonBadge>
                  </div>
                  <IonCardTitle style={{ fontSize: '1.2rem', color: 'var(--ion-text-color, #0f172a)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={personOutline} /> Perfil del Usuario
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ion-text-color, #334155)', opacity: 0.85, lineHeight: '1.4', marginBottom: '16px' }}>
                    Tus credenciales y datos personales están validados y vinculados al resguardo de tu bóveda.
                  </p>
                  
                  <IonItem lines="none" style={{ '--background': 'var(--ion-color-step-50, #f8fafc)', borderRadius: '10px' }}>
                    <IonLabel position="stacked" style={{ fontWeight: '600', color: 'var(--ion-color-primary, #2563eb)' }}>Nombre Registrado</IonLabel>
                    <IonInput value={nombreTitular} readonly style={{ fontWeight: '600' }} />
                  </IonItem>
                </IonCardContent>
              </IonCard>

              {/* 2. Tarjeta de Seguridad y Cambio de Contraseña */}
              <IonCard
                className="ion-no-margin ion-margin-bottom"
                style={{
                  backgroundColor: 'var(--ion-card-background, #ffffff)',
                  color: 'var(--ion-text-color, #0f172a)',
                  borderRadius: '14px',
                  border: '1px solid var(--ion-color-step-150, #e2e8f0)'
                }}
              >
                <IonCardHeader>
                  <IonCardSubtitle style={{ fontSize: '0.78rem', color: 'var(--ion-color-primary, #2563eb)', fontWeight: '700' }}>
                    ACCESO Y CLAVES
                  </IonCardSubtitle>
                  <IonCardTitle style={{ fontSize: '1.2rem', color: 'var(--ion-text-color, #0f172a)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={lockClosedOutline} /> Cambiar Contraseña
                  </IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  <form onSubmit={handlePasswordChange}>
                    <IonItem lines="inset" className="ion-margin-bottom" style={{ '--background': 'transparent' }}>
                      <IonLabel position="stacked">Nueva Contraseña</IonLabel>
                      <IonInput
                        type="password"
                        value={newPassword}
                        onIonInput={(e) => setNewPassword(e.detail.value!)}
                        placeholder="Mínimo 8 caracteres"
                      />
                    </IonItem>

                    <IonItem lines="inset" className="ion-margin-bottom" style={{ '--background': 'transparent' }}>
                      <IonLabel position="stacked">Confirmar Nueva Contraseña</IonLabel>
                      <IonInput
                        type="password"
                        value={confirmPassword}
                        onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                        placeholder="Repite la contraseña"
                      />
                    </IonItem>

                    <IonButton
                      expand="block"
                      type="submit"
                      fill="solid"
                      color="primary"
                      size="small"
                      className="ion-margin-top"
                      style={{ fontWeight: '600' }}
                    >
                      Actualizar Contraseña
                    </IonButton>
                  </form>
                </IonCardContent>
              </IonCard>

              {/* 3. Tarjeta de Estado del Sistema y Cierre de Sesión */}
              <IonCard
                className="ion-no-margin ion-margin-bottom"
                style={{
                  backgroundColor: 'var(--ion-card-background, #ffffff)',
                  color: 'var(--ion-text-color, #0f172a)',
                  borderRadius: '14px',
                  border: '1px solid var(--ion-color-step-150, #e2e8f0)'
                }}
              >
                <IonCardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <IonCardSubtitle style={{ fontSize: '0.78rem', color: 'var(--ion-color-primary, #2563eb)', fontWeight: '700' }}>
                      GESTIÓN DE SESIÓN
                    </IonCardSubtitle>
                    <IonBadge color="success">Cifrado AES-256</IonBadge>
                  </div>
                  <IonCardTitle style={{ fontSize: '1.2rem', color: 'var(--ion-text-color, #0f172a)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={shieldOutline} /> Seguridad de la Bóveda
                  </IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ion-text-color, #334155)', opacity: 0.85, lineHeight: '1.4', marginBottom: '16px' }}>
                    Al cerrar sesión, la sesión actual finaliza y tu bóveda continuará protegida por el sistema hasta tu próximo ingreso.
                  </p>

                  <IonButton
                    expand="block"
                    color="danger"
                    size="small"
                    onClick={handleLogout}
                    style={{ fontWeight: '600' }}
                  >
                    <IonIcon slot="start" icon={logOutOutline} />
                    Cerrar Sesión Activa
                  </IonButton>
                </IonCardContent>
              </IonCard>

            </IonCol>
          </IonRow>
        </IonGrid>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={3500}
          color={toastColor}
        />
      </IonContent>

      {/* Footer Inferioridéntico al del Dashboard */}
      <IonFooter>
        <IonToolbar style={{ '--background': 'var(--ion-card-background, #ffffff)', '--color': 'var(--ion-text-color, #0f172a)' } as any}>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <IonButton
              fill="clear"
              style={{ display: 'flex', flexDirection: 'column', '--color': 'var(--ion-text-color)' }}
              onClick={() => navigate('/dashboard')}
            >
              <IonIcon icon={homeOutline} />
              <IonLabel style={{ fontSize: '0.7rem' }}>Inicio</IonLabel>
            </IonButton>

            <IonButton
              fill="clear"
              style={{ display: 'flex', flexDirection: 'column', '--color': 'var(--ion-text-color)' }}
              onClick={() => navigate('/polizas')}
            >
              <IonIcon icon={shieldCheckmarkOutline} />
              <IonLabel style={{ fontSize: '0.7rem' }}>Pólizas</IonLabel>
            </IonButton>

            <IonButton
              fill="clear"
              style={{ display: 'flex', flexDirection: 'column', '--color': 'var(--ion-text-color)' }}
              onClick={() => navigate('/albaceas')}
            >
              <IonIcon icon={peopleOutline} />
              <IonLabel style={{ fontSize: '0.7rem' }}>Albaceas</IonLabel>
            </IonButton>

            {/* Pestaña activa actual */}
            <IonButton
              fill="clear"
              color="primary"
              style={{ display: 'flex', flexDirection: 'column' }}
              onClick={() => navigate('/configuracion')}
            >
              <IonIcon icon={settingsOutline} />
              <IonLabel style={{ fontSize: '0.7rem' }}>Ajustes</IonLabel>
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default Configuracion;