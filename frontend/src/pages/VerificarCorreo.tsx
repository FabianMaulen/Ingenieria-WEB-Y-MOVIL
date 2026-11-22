import React, { useEffect, useRef, useState } from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner } from '@ionic/react';
import { checkmarkCircleOutline, alertCircleOutline, arrowForwardOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { confirmarVerificacionEnlace, obtenerToken } from '../services/auth.service';
import { mensajeError } from '../services/api';
import { VaultChestIcon } from '../components/VaultChestIcon';

export const VerificarCorreo: React.FC = () => {
  const navigate = useNavigate();
  const ejecutado = useRef(false);
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'error'>('cargando');
  const [mensaje, setMensaje] = useState('Confirmando tu correo electrónico...');

  useEffect(() => {
    if (ejecutado.current) return;
    ejecutado.current = true;

    const params = new URLSearchParams(window.location.search);
    const correo = params.get('correo') || '';
    const tipo = params.get('tipo') || 'PRINCIPAL';
    const codigo = params.get('codigo') || '';

    if (!correo || !codigo) {
      setEstado('error');
      setMensaje('El enlace de confirmación está incompleto o es inválido.');
      return;
    }

    confirmarVerificacionEnlace(correo, tipo, codigo)
      .then((res) => {
        setEstado('ok');
        setMensaje(res.mensaje || 'Tu correo electrónico fue confirmado correctamente.');
      })
      .catch((err) => {
        setEstado('error');
        setMensaje(mensajeError(err));
      });
  }, []);

  const destino = obtenerToken() ? '/configuracion' : '/login';

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="be-auth-wrapper">
          <div
            className="be-card"
            style={{ width: '100%', maxWidth: '460px', textAlign: 'center', padding: '36px 28px', borderRadius: '22px' }}
          >
            <VaultChestIcon size={72} mode={estado === 'ok' ? 'opening' : 'static'} />

            {estado === 'cargando' && (
              <div style={{ marginTop: '16px' }}>
                <IonSpinner name="crescent" color="primary" />
                <p style={{ marginTop: '12px', color: 'var(--be-text-muted)' }}>{mensaje}</p>
              </div>
            )}

            {estado === 'ok' && (
              <>
                <IonIcon
                  icon={checkmarkCircleOutline}
                  style={{ fontSize: '2.8rem', color: 'var(--be-success)', marginTop: '12px' }}
                />
                <h2 style={{ margin: '8px 0 8px 0', fontSize: '1.35rem', color: 'var(--be-text)' }}>
                  ¡Correo Confirmado!
                </h2>
                <p style={{ margin: '0 0 22px 0', fontSize: '0.9rem', color: 'var(--be-text-muted)', lineHeight: 1.55 }}>
                  {mensaje}
                </p>
                <button
                  type="button"
                  className="be-btn be-btn-primary be-btn-block"
                  onClick={() => navigate(destino, { replace: true })}
                >
                  {obtenerToken() ? 'Ir a Ajustes' : 'Ir a Iniciar Sesión'}
                  <IonIcon icon={arrowForwardOutline} />
                </button>
              </>
            )}

            {estado === 'error' && (
              <>
                <IonIcon
                  icon={alertCircleOutline}
                  style={{ fontSize: '2.8rem', color: 'var(--be-danger)', marginTop: '12px' }}
                />
                <h2 style={{ margin: '8px 0 8px 0', fontSize: '1.35rem', color: 'var(--be-text)' }}>
                  No se pudo confirmar
                </h2>
                <p style={{ margin: '0 0 22px 0', fontSize: '0.9rem', color: 'var(--be-text-muted)', lineHeight: 1.55 }}>
                  {mensaje}
                </p>
                <button
                  type="button"
                  className="be-btn be-btn-primary be-btn-block"
                  onClick={() => navigate(destino, { replace: true })}
                >
                  Volver a Baúl Eterno
                </button>
              </>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default VerificarCorreo;
