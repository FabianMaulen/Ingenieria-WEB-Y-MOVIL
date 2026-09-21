import React, { useState } from 'react';
import { IonPage, IonContent, IonInput, IonButton, IonText, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { lockClosedOutline } from 'ionicons/icons';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const onLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rut.trim() || !password.trim()) {
      setErrorMessage('Por favor ingresa tu RUT y contraseña.');
      return;
    }
    localStorage.setItem('user_token', 'session_active_token');
    setErrorMessage('');
    navigate('/vault/polizas');
  };

  return (
    <IonPage>
      <IonContent className="login-bg">
        <div className="login-container">
          <div className="login-card">
            
            {}
            <div className="login-brand-side">
              <div className="brand-header">
                <IonIcon icon={lockClosedOutline} style={{ fontSize: '36px' }} />
                <h1>Baúl Eterno</h1>
                <p className="brand-slogan">
                  Protegiendo tu legado y respaldando la tranquilidad de quienes más amas, hoy y siempre.
                </p>
              </div>
            </div>

            {}
            <div className="login-form-side">
              <h2>¡Bienvenido!</h2>
              <p className="login-subtitle">Ingresa tus credenciales para acceder a tu bóveda.</p>

              <form onSubmit={onLoginSubmit}>
                <IonInput 
                  label="RUT" 
                  labelPlacement="floating" 
                  fill="outline"
                  value={rut} 
                  onIonInput={(e) => setRut(e.detail.value!)} 
                  required 
                  className="custom-input"
                />
                
                <IonInput 
                  label="Contraseña" 
                  labelPlacement="floating" 
                  fill="outline"
                  type="password" 
                  value={password} 
                  onIonInput={(e) => setPassword(e.detail.value!)} 
                  required 
                  className="custom-input"
                />

                {errorMessage && (
                  <IonText color="danger">
                    <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>{errorMessage}</p>
                  </IonText>
                )}

                <IonButton expand="block" type="submit" className="btn-login">
                  Ingresar
                </IonButton>
              </form>
            </div>

          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};