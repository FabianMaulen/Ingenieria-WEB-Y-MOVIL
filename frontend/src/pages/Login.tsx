import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner } from '@ionic/react';
import {
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  shieldCheckmarkOutline,
  peopleOutline,
  timeOutline,
  moonOutline,
  sunnyOutline,
  arrowForwardOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { mensajeError } from '../services/api';
import { login } from '../services/auth.service';
import { alternarTema, obtenerTemaOscuro } from '../utils/theme';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cargando, setCargando] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => obtenerTemaOscuro());

  useEffect(() => {
    const onTheme = () => setIsDark(obtenerTemaOscuro());
    window.addEventListener('theme-changed', onTheme);
    return () => window.removeEventListener('theme-changed', onTheme);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Ingresa tu correo electrónico (o RUT) y tu contraseña.');
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
      <IonContent fullscreen>
        <div className="be-auth-wrapper">
          <div className="be-auth-card">
            {/* Panel Izquierdo: Identidad de marca y confianza */}
            <div className="be-auth-brand-panel">
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '26px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #e5ad43 0%, #c58922 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 20px rgba(197, 137, 34, 0.35)',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M12 2L4 5.5V11.5C4 16.8 7.4 21.5 12 23C16.6 21.5 20 16.8 20 11.5V5.5L12 2Z"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="11.5" r="2.2" fill="#FFFFFF" />
                      <path d="M12 13.7V16.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontFamily: 'var(--be-font-display)',
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Baúl Eterno
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#e5ad43', fontWeight: 600, letterSpacing: '0.04em' }}>
                      LEGADO PERSONAL PROTEGIDO
                    </span>
                  </div>
                </div>

                <h1
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '1.85rem',
                    fontWeight: 800,
                    lineHeight: 1.2,
                    color: '#ffffff',
                  }}
                >
                  Protege hoy lo que los tuyos necesitarán mañana.
                </h1>
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'rgba(226, 232, 240, 0.85)', lineHeight: 1.6 }}>
                  Centraliza tus pólizas, activos digitales y cartas póstumas en una bóveda privada bajo tu control.
                </p>
              </div>

              {/* Pilares de confianza (visibles en escritorio) */}
              <div
                className="be-auth-pillars-desktop"
                style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '28px', position: 'relative', zIndex: 1 }}
              >
                <div className="be-auth-pillar">
                  <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: '1.25rem', color: '#e5ad43', marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.84rem' }}>Cifrado AES-256 de extremo a extremo</strong>
                    <span style={{ fontSize: '0.77rem', color: 'rgba(226, 232, 240, 0.78)' }}>
                      Tus mensajes póstumos permanecen sellados hasta una apertura validada.
                    </span>
                  </div>
                </div>

                <div className="be-auth-pillar">
                  <IonIcon icon={peopleOutline} style={{ fontSize: '1.25rem', color: '#e5ad43', marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.84rem' }}>Cuenta dual Titular y Albacea</strong>
                    <span style={{ fontSize: '0.77rem', color: 'rgba(226, 232, 240, 0.78)' }}>
                      Administra tu bóveda y alterna al panel de custodia cuando te designen.
                    </span>
                  </div>
                </div>

                <div className="be-auth-pillar">
                  <IonIcon icon={timeOutline} style={{ fontSize: '1.25rem', color: '#e5ad43', marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.84rem' }}>Periodo de gracia de 72 horas</strong>
                    <span style={{ fontSize: '0.77rem', color: 'rgba(226, 232, 240, 0.78)' }}>
                      Anula cualquier solicitud de apertura con un clic si sigues activo.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Derecho: Formulario de acceso */}
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

              <div style={{ marginBottom: '26px' }}>
                <span className="be-badge be-badge-info" style={{ marginBottom: '10px' }}>
                  Acceso Seguro
                </span>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '1.65rem', fontWeight: 800, color: 'var(--be-text)' }}>
                  Bienvenido de vuelta
                </h2>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--be-text-muted)' }}>
                  Ingresa con tu correo electrónico o RUT chileno para abrir tu bóveda.
                </p>
              </div>

              <form onSubmit={handleLogin}>
                <div className="be-field">
                  <label className="be-label" htmlFor="login-id">
                    Correo electrónico o RUT *
                  </label>
                  <div className="be-input-group">
                    <IonIcon icon={mailOutline} className="be-input-icon" />
                    <input
                      id="login-id"
                      type="text"
                      className="be-input"
                      placeholder="ejemplo@correo.cl o 12345678-5"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="be-field" style={{ marginBottom: '20px' }}>
                  <label className="be-label" htmlFor="login-pass">
                    Contraseña *
                  </label>
                  <div className="be-input-group">
                    <IonIcon icon={lockClosedOutline} className="be-input-icon" />
                    <input
                      id="login-pass"
                      type={mostrarClave ? 'text' : 'password'}
                      className="be-input"
                      style={{ paddingRight: '42px' }}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
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

                {errorMessage && (
                  <div
                    className="be-badge-danger"
                    style={{
                      padding: '11px 14px',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      marginBottom: '16px',
                    }}
                  >
                    {errorMessage}
                  </div>
                )}

                <button type="submit" className="be-btn be-btn-primary be-btn-block" disabled={cargando}>
                  {cargando ? (
                    <IonSpinner name="crescent" color="light" />
                  ) : (
                    <>
                      Ingresar a mi Baúl
                      <IonIcon icon={arrowForwardOutline} />
                    </>
                  )}
                </button>
              </form>

              <div
                style={{
                  textAlign: 'center',
                  marginTop: '24px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--be-border)',
                  fontSize: '0.88rem',
                  color: 'var(--be-text-muted)',
                }}
              >
                ¿Aún no tienes tu bóveda personal?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
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
                  Crear cuenta gratis
                </button>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
