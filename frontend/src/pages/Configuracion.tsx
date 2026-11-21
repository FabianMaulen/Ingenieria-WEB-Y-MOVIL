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
  IonBadge,
  IonSpinner,
} from '@ionic/react';
import {
  homeOutline,
  shieldCheckmarkOutline,
  peopleOutline,
  settingsOutline,
  personOutline,
  lockClosedOutline,
  logOutOutline,
  shieldOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';
import { mensajeError } from '../services/api';
import { cambiarPassword, logout, usuarioGuardado } from '../services/auth.service';

export const Configuracion: React.FC = () => {
  const navigate = useNavigate();

  const [nombreTitular, setNombreTitular] = useState('Usuario');
  const [correoUsuario, setCorreoUsuario] = useState('');
  const [rutUsuario, setRutUsuario] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState('success');

  useEffect(() => {
    const usuario = usuarioGuardado();
    setNombreTitular(usuario?.nombre || localStorage.getItem('user_nombre') || 'Usuario');
    setCorreoUsuario(usuario?.correo || '');
    setRutUsuario(usuario?.rut || '');
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setToastMsg('Completa todos los campos de contraseña.');
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    if (newPassword.length < 8) {
      setToastMsg('La nueva contraseña debe tener al menos 8 caracteres.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setToastMsg('La nueva contraseña y su confirmación no coinciden.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    try {
      setEnviando(true);
      const res = await cambiarPassword(currentPassword, newPassword);
      setToastMsg(res.mensaje || 'Contraseña actualizada exitosamente.');
      setToastColor('success');
      setShowToast(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setToastMsg(mensajeError(error));
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <IonPage id="main-content">
      <HeaderBar title={`Ajustes de ${nombreTitular}`} />

      <IonContent className="ion-padding">
        <IonGrid className="ion-no-padding" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <IonRow>
            <IonCol size="12">
              {/* 1. Tarjeta de Perfil */}
              <IonCard
                className="ion-no-margin ion-margin-bottom"
                style={{
                  backgroundColor: 'var(--ion-card-background, #ffffff)',
                  color: 'var(--ion-text-color, #0f172a)',
                  borderRadius: '14px',
                  border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                }}
              >
                <IonCardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <IonCardSubtitle style={{ fontSize: '0.78rem', color: 'var(--ion-color-primary, #2563eb)', fontWeight: '700' }}>
                      INFORMACIÓN DE CUENTA
                    </IonCardSubtitle>
                    <IonBadge color="primary">Cuenta Dual</IonBadge>
                  </div>
                  <IonCardTitle
                    style={{
                      fontSize: '1.2rem',
                      color: 'var(--ion-text-color, #0f172a)',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <IonIcon icon={personOutline} /> Perfil del Usuario
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p
                    style={{
                      fontSize: '0.88rem',
                      color: 'var(--ion-text-color, #334155)',
                      opacity: 0.85,
                      lineHeight: '1.4',
                      marginBottom: '16px',
                    }}
                  >
                    Tu cuenta te permite resguardar tu propia bóveda patrimonial y, a la vez, actuar como albacea de
                    terceros si te designan con tu RUT.
                  </p>

                  <IonItem lines="none" style={{ '--background': 'var(--ion-color-step-50, #f8fafc)', borderRadius: '10px', marginBottom: '8px' }}>
                    <IonLabel position="stacked" style={{ fontWeight: '600', color: 'var(--ion-color-primary, #2563eb)' }}>
                      Nombre Registrado
                    </IonLabel>
                    <IonInput value={nombreTitular} readonly style={{ fontWeight: '600' }} />
                  </IonItem>

                  {rutUsuario && (
                    <IonItem lines="none" style={{ '--background': 'var(--ion-color-step-50, #f8fafc)', borderRadius: '10px', marginBottom: '8px' }}>
                      <IonLabel position="stacked" style={{ fontWeight: '600', color: 'var(--ion-color-primary, #2563eb)' }}>
                        RUT
                      </IonLabel>
                      <IonInput value={rutUsuario} readonly />
                    </IonItem>
                  )}

                  {correoUsuario && (
                    <IonItem lines="none" style={{ '--background': 'var(--ion-color-step-50, #f8fafc)', borderRadius: '10px' }}>
                      <IonLabel position="stacked" style={{ fontWeight: '600', color: 'var(--ion-color-primary, #2563eb)' }}>
                        Correo Electrónico
                      </IonLabel>
                      <IonInput value={correoUsuario} readonly />
                    </IonItem>
                  )}
                </IonCardContent>
              </IonCard>

              {/* 2. Tarjeta de Seguridad y Cambio de Contraseña */}
              <IonCard
                className="ion-no-margin ion-margin-bottom"
                style={{
                  backgroundColor: 'var(--ion-card-background, #ffffff)',
                  color: 'var(--ion-text-color, #0f172a)',
                  borderRadius: '14px',
                  border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                }}
              >
                <IonCardHeader>
                  <IonCardSubtitle style={{ fontSize: '0.78rem', color: 'var(--ion-color-primary, #2563eb)', fontWeight: '700' }}>
                    ACCESO Y CLAVES
                  </IonCardSubtitle>
                  <IonCardTitle
                    style={{
                      fontSize: '1.2rem',
                      color: 'var(--ion-text-color, #0f172a)',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <IonIcon icon={lockClosedOutline} /> Cambiar Contraseña
                  </IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  <form onSubmit={handlePasswordChange}>
                    <IonItem lines="inset" className="ion-margin-bottom" style={{ '--background': 'transparent' }}>
                      <IonLabel position="stacked">Contraseña Actual *</IonLabel>
                      <IonInput
                        type="password"
                        value={currentPassword}
                        onIonInput={(e) => setCurrentPassword(e.detail.value || '')}
                        placeholder="Ingresa tu contraseña actual"
                      />
                    </IonItem>

                    <IonItem lines="inset" className="ion-margin-bottom" style={{ '--background': 'transparent' }}>
                      <IonLabel position="stacked">Nueva Contraseña *</IonLabel>
                      <IonInput
                        type="password"
                        value={newPassword}
                        onIonInput={(e) => setNewPassword(e.detail.value || '')}
                        placeholder="Mínimo 8 caracteres"
                      />
                    </IonItem>

                    <IonItem lines="inset" className="ion-margin-bottom" style={{ '--background': 'transparent' }}>
                      <IonLabel position="stacked">Confirmar Nueva Contraseña *</IonLabel>
                      <IonInput
                        type="password"
                        value={confirmPassword}
                        onIonInput={(e) => setConfirmPassword(e.detail.value || '')}
                        placeholder="Repite la nueva contraseña"
                      />
                    </IonItem>

                    <IonButton
                      expand="block"
                      type="submit"
                      fill="solid"
                      color="primary"
                      size="small"
                      disabled={enviando}
                      className="ion-margin-top"
                      style={{ fontWeight: '600' }}
                    >
                      {enviando ? <IonSpinner name="crescent" /> : 'Actualizar Contraseña'}
                    </IonButton>
                  </form>
                </IonCardContent>
              </IonCard>

              {/* 3. Tarjeta de Cierre de Sesión */}
              <IonCard
                className="ion-no-margin ion-margin-bottom"
                style={{
                  backgroundColor: 'var(--ion-card-background, #ffffff)',
                  color: 'var(--ion-text-color, #0f172a)',
                  borderRadius: '14px',
                  border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                }}
              >
                <IonCardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <IonCardSubtitle style={{ fontSize: '0.78rem', color: 'var(--ion-color-primary, #2563eb)', fontWeight: '700' }}>
                      GESTIÓN DE SESIÓN
                    </IonCardSubtitle>
                    <IonBadge color="success">Cifrado AES-256</IonBadge>
                  </div>
                  <IonCardTitle
                    style={{
                      fontSize: '1.2rem',
                      color: 'var(--ion-text-color, #0f172a)',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <IonIcon icon={shieldOutline} /> Seguridad de la Bóveda
                  </IonCardTitle>
                </IonCardHeader>

                <IonCardContent>
                  <p
                    style={{
                      fontSize: '0.88rem',
                      color: 'var(--ion-text-color, #334155)',
                      opacity: 0.85,
                      lineHeight: '1.4',
                      marginBottom: '16px',
                    }}
                  >
                    Al cerrar sesión, el token local se elimina de este dispositivo y tu bóveda continuará protegida
                    hasta tu próximo ingreso.
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

      <IonFooter>
        <IonToolbar
          style={
            {
              '--background': 'var(--ion-card-background, #ffffff)',
              '--color': 'var(--ion-text-color, #0f172a)',
            } as any
          }
        >
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
