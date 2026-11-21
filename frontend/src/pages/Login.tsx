import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { mensajeError } from '../services/api';
import { login } from '../services/auth.service';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Todos los campos marcados con (*) son obligatorios.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setErrorMessage('');
    setCargando(true);

    try {
      await login(identifier.trim(), password);
      localStorage.setItem('modo_activo', 'TITULAR');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      setErrorMessage(mensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" fullscreen>
        <IonGrid style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IonRow style={{ width: '100%', justifyContent: 'center' }}>
            <IonCol size="12" sizeMd="8" sizeLg="5">
              <IonCard>
                <IonCardHeader className="ion-text-center">
                  <IonCardTitle style={{ fontSize: '1.6rem', color: 'var(--ion-text-color, #1E293B)' }}>
                    Baúl Eterno
                  </IonCardTitle>
                  <IonText color="medium">
                    <p>Plataforma de Legado Personal</p>
                  </IonText>
                </IonCardHeader>

                <IonCardContent>
                  <form onSubmit={handleLogin}>
                    <IonItem lines="inset" className="ion-margin-bottom">
                      <IonLabel position="stacked">Correo electrónico o RUT *</IonLabel>
                      <IonInput
                        type="text"
                        placeholder="ejemplo@correo.cl o 12345678-5"
                        value={identifier}
                        onIonInput={(e) => setIdentifier(e.detail.value || '')}
                      />
                    </IonItem>

                    <IonItem lines="inset" className="ion-margin-bottom">
                      <IonLabel position="stacked">Contraseña *</IonLabel>
                      <IonInput
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onIonInput={(e) => setPassword(e.detail.value || '')}
                      />
                    </IonItem>

                    {errorMessage && (
                      <IonText color="danger" className="ion-padding-start">
                        <p style={{ fontSize: '0.85rem' }}>{errorMessage}</p>
                      </IonText>
                    )}

                    <div className="ion-margin-top ion-padding-top">
                      <IonButton expand="block" type="submit" color="primary" disabled={cargando}>
                        {cargando ? <IonSpinner name="crescent" /> : 'Ingresar a tu Baúl'}
                      </IonButton>

                      <IonButton
                        expand="block"
                        fill="clear"
                        routerLink="/register"
                        className="ion-margin-top"
                        style={{ fontSize: '0.85rem', textTransform: 'none' }}
                      >
                        ¿No tienes cuenta? Registra tu Baúl aquí
                      </IonButton>
                    </div>
                  </form>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};
