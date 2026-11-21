import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner, IonToast } from '@ionic/react';
import {
  mailOutline,
  keyOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  arrowBackOutline,
} from 'ionicons/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mensajeError } from '../services/api';
import { solicitarRecuperacion, restablecerPassword } from '../services/auth.service';
import { emailValido } from '../utils/rut';
import { VaultChestIcon } from '../components/VaultChestIcon';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [paso, setPaso] = useState<1 | 2>(1);
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  // Si el usuario llegó desde el enlace del correo (?correo=...&codigo=...)
  useEffect(() => {
    const correoUrl = searchParams.get('correo');
    const codigoUrl = searchParams.get('codigo');
    if (correoUrl) setCorreo(correoUrl);
    if (codigoUrl) {
      setCodigo(codigoUrl);
      setPaso(2);
    }
  }, [searchParams]);

  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!emailValido(correo)) {
      setErrorMsg('Ingresa un correo electrónico válido.');
      return;
    }

    try {
      setCargando(true);
      const res = await solicitarRecuperacion(correo.trim().toLowerCase());
      setToastColor('success');
      setToastMsg(res.mensaje || 'Si el correo está registrado, enviamos tu código de 6 dígitos.');
      setPaso(2);
    } catch (error) {
      setErrorMsg(mensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  const handleRestablecer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!codigo.trim() || codigo.trim().length < 6) {
      setErrorMsg('Ingresa el código de 6 dígitos enviado a tu correo.');
      return;
    }

    if (nuevaPassword.length < 8) {
      setErrorMsg('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    try {
      setCargando(true);
      const res = await restablecerPassword(correo.trim().toLowerCase(), codigo.trim(), nuevaPassword);
      setToastColor('success');
      setToastMsg(res.mensaje || 'Contraseña restablecida con éxito.');
      setTimeout(() => navigate('/login', { replace: true }), 1600);
    } catch (error) {
      setErrorMsg(mensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="be-auth-wrapper">
          <div className="be-card" style={{ width: '100%', maxWidth: '470px', padding: '34px 30px', borderRadius: '22px' }}>
            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <VaultChestIcon size={64} mode="static" />
              <h2 style={{ margin: '10px 0 6px 0', fontSize: '1.5rem', color: 'var(--be-text)' }}>
                Recuperar acceso a tu Baúl
              </h2>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--be-text-muted)' }}>
                {paso === 1
                  ? 'Te enviaremos un código temporal de 6 dígitos válido por 30 minutos.'
                  : 'Ingresa el código recibido y define tu nueva contraseña.'}
              </p>
            </div>

            {paso === 1 ? (
              <form onSubmit={handleSolicitarCodigo}>
                <div className="be-field">
                  <label className="be-label">Correo electrónico registrado *</label>
                  <div className="be-input-group">
                    <IonIcon icon={mailOutline} className="be-input-icon" />
                    <input
                      type="email"
                      className="be-input"
                      placeholder="tu@correo.cl"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p style={{ color: 'var(--be-danger)', fontSize: '0.84rem', fontWeight: 600, margin: '0 0 14px 0' }}>
                    {errorMsg}
                  </p>
                )}

                <button type="submit" className="be-btn be-btn-primary be-btn-block" disabled={cargando}>
                  {cargando ? <IonSpinner name="crescent" color="light" /> : 'Enviar código de recuperación'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRestablecer}>
                <div className="be-field">
                  <label className="be-label">Correo electrónico</label>
                  <input
                    type="email"
                    className="be-input"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                  />
                </div>

                <div className="be-field">
                  <label className="be-label">Código de 6 dígitos *</label>
                  <div className="be-input-group">
                    <IonIcon icon={keyOutline} className="be-input-icon" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="be-input"
                      placeholder="Ej: 482910"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                </div>

                <div className="be-field">
                  <label className="be-label">Nueva contraseña *</label>
                  <div className="be-input-group">
                    <IonIcon icon={lockClosedOutline} className="be-input-icon" />
                    <input
                      type={mostrarClave ? 'text' : 'password'}
                      className="be-input"
                      style={{ paddingRight: '42px' }}
                      placeholder="Mínimo 8 caracteres"
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="be-input-trailing"
                      onClick={() => setMostrarClave((v) => !v)}
                    >
                      <IonIcon icon={mostrarClave ? eyeOffOutline : eyeOutline} />
                    </button>
                  </div>
                </div>

                <div className="be-field" style={{ marginBottom: '18px' }}>
                  <label className="be-label">Confirmar nueva contraseña *</label>
                  <input
                    type={mostrarClave ? 'text' : 'password'}
                    className="be-input"
                    placeholder="Repite la nueva contraseña"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    required
                  />
                </div>

                {errorMsg && (
                  <p style={{ color: 'var(--be-danger)', fontSize: '0.84rem', fontWeight: 600, margin: '0 0 14px 0' }}>
                    {errorMsg}
                  </p>
                )}

                <button type="submit" className="be-btn be-btn-primary be-btn-block" disabled={cargando}>
                  {cargando ? <IonSpinner name="crescent" color="light" /> : 'Restablecer contraseña'}
                </button>

                <button
                  type="button"
                  className="be-btn be-btn-outline be-btn-block"
                  style={{ marginTop: '10px' }}
                  onClick={() => setPaso(1)}
                >
                  Reenviar código
                </button>
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--be-border)' }}>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--be-primary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.88rem',
                }}
              >
                <IonIcon icon={arrowBackOutline} />
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        </div>

        <IonToast
          isOpen={!!toastMsg}
          onDidDismiss={() => setToastMsg('')}
          message={toastMsg}
          duration={3500}
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;
