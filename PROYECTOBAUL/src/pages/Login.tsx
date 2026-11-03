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
  IonSpinner
} from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../services/api'; // Importa el servicio que conecta con Axios

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
      // 1. Petición real al backend
      const data = await loginApi({
        correo_usuario: identifier.trim().toLowerCase(),
        password: password
      });

      // 2. Almacenamiento de credenciales y datos
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_rol', data.usuario.rol);
      localStorage.setItem('user_nombre', data.usuario.nombre || data.usuario.nombre_usuario || 'Usuario');

      // 3. Redirección estricta por rol (Criterio de Privacidad)
      if (data.usuario.rol === 'ALBACEA') {
        navigate('/guia', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      
    } catch (error: any) {
      // Captura el error exacto que envía Node.js (ej: "Credenciales inválidas")
      setErrorMessage(
        error.response?.data?.error || 
        error.message || 
        'Error de conexión con el servidor.'
      );
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
                      <IonButton expand="block" type="submit" color="primary" disabled={cargando}>
                        {cargando ? <IonSpinner name="crescent" /> : 'Ingresar a tu Baúl'}
                      </IonButton>

                      {/* Enlace habilitado para redirigir al formulario de Registro */}
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