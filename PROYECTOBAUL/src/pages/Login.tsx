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
  IonText
} from '@ionic/react';
import { useHistory  } from 'react-router-dom';

export const Login: React.FC = () => {
const history = useHistory ();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
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
    // Simulación de autenticación exitosa
    localStorage.setItem('auth_token', 'session_activa_token');
    history('/dashboard', { replace: true });
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" fullscreen>
        <IonGrid style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IonRow style={{ width: '100%', justifyContent: 'center' }}>
            <IonCol size="12" sizeMd="8" sizeLg="5">
              <IonCard>
                <IonCardHeader className="ion-text-center">
                  <IonCardTitle style={{ fontSize: '1.6rem', color: '#1E293B' }}>Baúl Eterno</IonCardTitle>
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
                        placeholder="ejemplo@correo.cl o 12.345.678-9"
                        value={identifier}
                        onIonInput={(e) => setIdentifier(e.detail.value!)}
                      />
                    </IonItem>

                    <IonItem lines="inset" className="ion-margin-bottom">
                      <IonLabel position="stacked">Contraseña *</IonLabel>
                      <IonInput
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={password}
                        onIonInput={(e) => setPassword(e.detail.value!)}
                      />
                    </IonItem>

                    {errorMessage && (
                      <IonText color="danger" className="ion-padding-start">
                        <p style={{ fontSize: '0.85rem' }}>{errorMessage}</p>
                      </IonText>
                    )}

                    <div className="ion-margin-top ion-padding-top">
                      <IonButton expand="block" type="submit" color="primary">
                        Ingresar a tu Baúl
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