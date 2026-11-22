import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonToast, IonIcon, IonSpinner } from '@ionic/react';
import {
  cardOutline,
  personOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  moonOutline,
  sunnyOutline,
  sparklesOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { mensajeError } from '../services/api';
import { registrar } from '../services/auth.service';
import { normalizarRut, rutValido, emailValido } from '../utils/rut';
import { alternarTema, obtenerTemaOscuro } from '../utils/theme';
import { VaultChestIcon } from '../components/VaultChestIcon';
import { GoogleAuthButton } from '../components/GoogleAuthButton';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [rut, setRut] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');
  const [isDark, setIsDark] = useState<boolean>(() => obtenerTemaOscuro());

  useEffect(() => {
    const onTheme = () => setIsDark(obtenerTemaOscuro());
    window.addEventListener('theme-changed', onTheme);
    return () => window.removeEventListener('theme-changed', onTheme);
  }, []);

  const rutNormalizado = rut.trim() ? normalizarRut(rut) : '';
  const rutEsValido = rut.trim().length > 0 && rutValido(rut);
  const mostrarErrorRut = rut.trim().length >= 3 && !rutEsValido;

  const correoEsValido = correo.trim().length > 0 && emailValido(correo);
  const mostrarErrorCorreo = correo.trim().length > 0 && !correoEsValido;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rut.trim() || !nombreUsuario.trim() || !correo.trim() || !contrasena) {
      setToastColor('warning');
      setToastMsg('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (!rutValido(rut)) {
      setToastColor('danger');
      setToastMsg('El RUT ingresado no es válido. Verifica el dígito verificador (Ej: 12345678-5).');
      return;
    }

    if (!emailValido(correo)) {
      setToastColor('danger');
      setToastMsg('El formato del correo electrónico no es válido.');
      return;
    }

    if (contrasena.length < 8) {
      setToastColor('danger');
      setToastMsg('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setCargando(true);
    try {
      const res = await registrar({
        rut: normalizarRut(rut),
        nombre_usuario: nombreUsuario.trim(),
        correo_usuario: correo.trim().toLowerCase(),
        password: contrasena,
      });
      setToastColor('success');
      setToastMsg(res.mensaje || '¡Cuenta creada con éxito! Redirigiendo al inicio de sesión...');
      setTimeout(() => navigate('/login'), 1700);
    } catch (error: any) {
      setToastColor('danger');
      setToastMsg(mensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="be-auth-wrapper">
          <div className="be-auth-card">
            <div className="be-auth-brand-panel">
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '26px' }}>
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: '1px solid rgba(255, 255, 255, 0.22)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <VaultChestIcon size={46} mode="static" />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontFamily: 'var(--be-font-serif)', fontSize: '1.35rem', fontWeight: 700 }}>
                      Baúl Eterno
                    </span>
                    <span style={{ fontSize: '0.73rem', color: '#d8c3ae', fontWeight: 600, letterSpacing: '0.06em' }}>
                      CUENTA DUAL UNIFICADA
                    </span>
                  </div>
                </div>

                <h1 style={{ margin: '0 0 12px 0', fontSize: '1.8rem', fontWeight: 700, lineHeight: 1.2, color: '#ffffff' }}>
                  Tu tranquilidad y la de tu familia en un solo cofre.
                </h1>
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'rgba(241, 246, 252, 0.88)', lineHeight: 1.6 }}>
                  Con una sola cuenta puedes organizar tu patrimonio y, al mismo tiempo, aceptar designaciones como
                  albacea de personas que confían en ti.
                </p>
              </div>

              <div
                className="be-auth-pillars-desktop"
                style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '28px', position: 'relative', zIndex: 1 }}
              >
                <div className="be-auth-pillar">
                  <IonIcon icon={sparklesOutline} style={{ fontSize: '1.25rem', color: '#d8c3ae', marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.84rem' }}>Vinculación automática por RUT</strong>
                    <span style={{ fontSize: '0.77rem', color: 'rgba(241, 246, 252, 0.8)' }}>
                      Si alguien te invitó antes de registrarte, tu designación aparecerá lista al entrar.
                    </span>
                  </div>
                </div>

                <div className="be-auth-pillar">
                  <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: '1.25rem', color: '#d8c3ae', marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.84rem' }}>Privacidad absoluta</strong>
                    <span style={{ fontSize: '0.77rem', color: 'rgba(241, 246, 252, 0.8)' }}>
                      Solo tú accedes a tu información mientras tu bóveda permanezca sellada.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="be-auth-form-panel">
              <button
                type="button"
                onClick={() => setIsDark(alternarTema())}
                title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid var(--be-border)',
                  backgroundColor: 'var(--be-surface-alt)',
                  color: 'var(--be-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.15rem',
                }}
              >
                <IonIcon icon={isDark ? sunnyOutline : moonOutline} />
              </button>

              <div style={{ marginBottom: '22px' }}>
                <span className="be-badge be-badge-info" style={{ marginBottom: '10px' }}>
                  Nuevo Registro
                </span>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: 700, color: 'var(--be-text)' }}>
                  Crea tu Baúl Eterno
                </h2>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--be-text-muted)' }}>
                  Completa tus datos reales para validar tu identidad y vincular tus designaciones.
                </p>
              </div>

              <form onSubmit={handleRegister}>
                <div className="be-field">
                  <label className="be-label" htmlFor="reg-rut">
                    RUT chileno *
                  </label>
                  <div className="be-input-group">
                    <IonIcon icon={cardOutline} className="be-input-icon" />
                    <input
                      id="reg-rut"
                      type="text"
                      className="be-input"
                      placeholder="Ej: 12345678-5"
                      value={rut}
                      onChange={(e) => setRut(e.target.value)}
                      onBlur={() => {
                        if (rut.trim()) setRut(normalizarRut(rut));
                      }}
                      required
                      style={{
                        borderColor: mostrarErrorRut
                          ? 'var(--be-danger)'
                          : rutEsValido
                          ? 'var(--be-success)'
                          : undefined,
                      }}
                    />
                  </div>
                  {mostrarErrorRut && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--be-danger)', marginTop: '4px', fontWeight: 600 }}>
                      <IonIcon icon={alertCircleOutline} /> RUT inválido. Verifica el dígito verificador.
                    </span>
                  )}
                  {rutEsValido && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--be-success)', marginTop: '4px', fontWeight: 600 }}>
                      <IonIcon icon={checkmarkCircleOutline} /> RUT validado: {rutNormalizado}
                    </span>
                  )}
                </div>

                <div className="be-field">
                  <label className="be-label" htmlFor="reg-nombre">
                    Nombre completo *
                  </label>
                  <div className="be-input-group">
                    <IonIcon icon={personOutline} className="be-input-icon" />
                    <input
                      id="reg-nombre"
                      type="text"
                      className="be-input"
                      placeholder="Ej: Camila Morales"
                      value={nombreUsuario}
                      onChange={(e) => setNombreUsuario(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="be-field">
                  <label className="be-label" htmlFor="reg-email">
                    Correo electrónico *
                  </label>
                  <div className="be-input-group">
                    <IonIcon icon={mailOutline} className="be-input-icon" />
                    <input
                      id="reg-email"
                      type="email"
                      className="be-input"
                      placeholder="nombre@correo.cl"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      required
                      style={{
                        borderColor: mostrarErrorCorreo
                          ? 'var(--be-danger)'
                          : correoEsValido
                          ? 'var(--be-success)'
                          : undefined,
                      }}
                    />
                  </div>
                  {mostrarErrorCorreo && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--be-danger)', marginTop: '4px', fontWeight: 600 }}>
                      <IonIcon icon={alertCircleOutline} /> Ingresa un correo electrónico válido.
                    </span>
                  )}
                </div>

                <div className="be-field" style={{ marginBottom: '20px' }}>
                  <label className="be-label" htmlFor="reg-pass">
                    Contraseña *
                  </label>
                  <div className="be-input-group">
                    <IonIcon icon={lockClosedOutline} className="be-input-icon" />
                    <input
                      id="reg-pass"
                      type={mostrarClave ? 'text' : 'password'}
                      className="be-input"
                      style={{ paddingRight: '42px' }}
                      placeholder="Mínimo 8 caracteres"
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="be-input-trailing"
                      onClick={() => setMostrarClave((v) => !v)}
                      aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <IonIcon icon={mostrarClave ? eyeOffOutline : eyeOutline} />
                    </button>
                  </div>
                </div>

                <button type="submit" className="be-btn be-btn-primary be-btn-block" disabled={cargando}>
                  {cargando ? <IonSpinner name="crescent" color="light" /> : 'Crear mi cuenta'}
                </button>
              </form>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  margin: '16px 0 12px',
                  color: 'var(--be-text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                }}
              >
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--be-border)' }} />
                <span>o regístrate con</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--be-border)' }} />
              </div>

              <GoogleAuthButton
                texto="Registrarse con Google"
                onError={(msg) => {
                  setToastColor('danger');
                  setToastMsg(msg);
                }}
              />

              <div
                style={{
                  textAlign: 'center',
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--be-border)',
                  fontSize: '0.88rem',
                  color: 'var(--be-text-muted)',
                }}
              >
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--be-primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    padding: 0,
                  }}
                >
                  Iniciar sesión
                </button>
              </div>
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

export default Register;
