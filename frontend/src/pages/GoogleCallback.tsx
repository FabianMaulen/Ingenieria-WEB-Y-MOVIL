import React, { useEffect, useRef, useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { alertCircleOutline, arrowBackOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { iniciarSesionConGoogle } from '../services/auth.service';
import { mensajeError } from '../services/api';
import { VaultChestIcon } from '../components/VaultChestIcon';

/**
 * Ruta de retorno de Google OAuth 2.0 (/auth/google/callback).
 * Protegida contra doble ejecución de React.StrictMode mediante useRef (Taller 10).
 */
export const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const yaProcesado = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [abriendo, setAbriendo] = useState(false);

  useEffect(() => {
    if (yaProcesado.current) return;
    yaProcesado.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const oauthError = params.get('error');

    // Limpiar el code de la barra de direcciones inmediatamente (buena práctica de seguridad)
    window.history.replaceState({}, '', '/auth/google/callback');

    if (oauthError) {
      setError(
        oauthError === 'access_denied'
          ? 'Cancelaste la autorización con Google.'
          : `Google informó un error de autorización (${oauthError}).`
      );
      return;
    }

    if (!code || !state) {
      setError('Faltan parámetros de verificación de Google (code o state).');
      return;
    }

    iniciarSesionConGoogle(code, state)
      .then((usuario) => {
        const destino = usuario.rol === 'ADMIN' ? '/admin?tab=resumen' : '/dashboard';
        localStorage.setItem('modo_activo', usuario.rol === 'ADMIN' ? 'ADMIN' : 'TITULAR');
        setAbriendo(true);
        setTimeout(() => {
          navigate(destino, { replace: true });
        }, 850);
      })
      .catch((err) => {
        setError(mensajeError(err));
      });
  }, [navigate]);

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="be-auth-wrapper">
          <div className="be-card" style={{ width: '100%', maxWidth: '440px', textAlign: 'center', padding: '38px 28px', borderRadius: '22px' }}>
            {error ? (
              <>
                <IonIcon icon={alertCircleOutline} style={{ fontSize: '3rem', color: 'var(--be-danger)', marginBottom: '10px' }} />
                <h2 style={{ margin: '0 0 8px 0', fontSize: '1.35rem', color: 'var(--be-text)' }}>
                  No se pudo completar el acceso
                </h2>
                <p style={{ margin: '0 0 22px 0', fontSize: '0.9rem', color: 'var(--be-text-muted)', lineHeight: 1.5 }}>
                  {error}
                </p>
                <button
                  type="button"
                  className="be-btn be-btn-primary be-btn-block"
                  onClick={() => navigate('/login', { replace: true })}
                >
                  <IonIcon icon={arrowBackOutline} />
                  Volver al inicio de sesión
                </button>
              </>
            ) : (
              <>
                <VaultChestIcon size={92} mode={abriendo ? 'opening' : 'breathing'} />
                <h2 style={{ margin: '12px 0 6px 0', fontSize: '1.35rem', color: 'var(--be-text)' }}>
                  {abriendo ? '¡Identidad verificada!' : 'Validando cuenta con Google...'}
                </h2>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--be-text-muted)' }}>
                  {abriendo ? 'Abriendo tu Baúl Eterno...' : 'Intercambiando código seguro OAuth 2.0 + PKCE...'}
                </p>
              </>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GoogleCallback;
