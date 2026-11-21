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
  keyOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { mensajeError } from '../services/api';
import { login } from '../services/auth.service';
import { alternarTema, obtenerTemaOscuro } from '../utils/theme';
import { VaultChestIcon } from '../components/VaultChestIcon';
import { VaultUnlockOverlay } from '../components/VaultUnlockOverlay';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarClave, setMostrarClave] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cargando, setCargando] = useState(false);
  const [abriendoBaul, setAbriendoBaul] = useState(false);
  const [nombreBienvenida, setNombreBienvenida] = useState('');
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
      const usuario = await login(identifier.trim(), password);
      localStorage.setItem('modo_activo', 'TITULAR');
      setNombreBienvenida((usuario.nombre || '').split(' ')[0]);
      setAbriendoBaul(true);

      // Animación suave de apertura del baúl antes de entrar al Dashboard
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 920);
    } catch (error: any) {
      setErrorMessage(mensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <VaultUnlockOverlay visible={abriendoBaul} nombre={nombreBienvenida} />

        <div className="be-auth-wrapper">
          <div className="be-auth-card">
            {/* Panel Izquierdo: Emblema del Baúl + Confianza */}
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
                    <span
                      style={{
                        display: 'block',
                        fontFamily: 'var(--be-font-serif)',
                        fontSize: '1.35rem',
                        fontWeight: 700,
                      }}
                    >
                      Baúl Eterno
                    </span>
                    <span style={{ fontSize: '0.73rem', color: '#d8c3ae', fontWeight: 600, letterSpacing: '0.06em' }}>
                      RESGUARDO Y LEGADO PERSONAL
                    </span>
                  </div>
                </div>

                <h1
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '1.85rem',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    color: '#ffffff',
                  }}
                >
                  Resguarda con serenidad lo que tus seres queridos necesitarán.
                </h1>
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'rgba(241, 246, 252, 0.88)', lineHeight: 1.6 }}>
                  Mantén tus pólizas, activos digitales y cartas póstumas en un cofre digital privado, íntegro y
                  protegido.
                </p>
              </div>

              <div
                className="be-auth-pillars-desktop"
                style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '28px', position: 'relative', zIndex: 1 }}
              >
                <div className="be-auth-pillar">
                  <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: '1.25rem', color: '#d8c3ae', marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.84rem' }}>Custodia cifrada AES-256</strong>
                    <span style={{ fontSize: '0.77rem', color: 'rgba(241, 246, 252, 0.8)' }}>
                      Tus cartas póstumas permanecen selladas hasta la apertura validada.
                    </span>
                  </div>
                </div>

                <div className="be-auth-pillar">
                  <IonIcon icon={peopleOutline} style={{ fontSize: '1.25rem', color: '#d8c3ae', marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.84rem' }}>Cuenta dual Titular y Albacea</strong>
                    <span style={{ fontSize: '0.77rem', color: 'rgba(241, 246, 252, 0.8)' }}>
                      Administra tu bóveda y alterna al panel de custodia cuando te designen.
                    </span>
                  </div>
                </div>

                <div className="be-auth-pillar">
                  <IonIcon icon={timeOutline} style={{ fontSize: '1.25rem', color: '#d8c3ae', marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.84rem' }}>Periodo de gracia de 72 horas</strong>
                    <span style={{ fontSize: '0.77rem', color: 'rgba(241, 246, 252, 0.8)' }}>
                      Notificación inmediata y anulación en un clic si continúas activo.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Derecho: Formulario */}
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

              <div style={{ marginBottom: '24px' }}>
                <span className="be-badge be-badge-info" style={{ marginBottom: '10px' }}>
                  Acceso Seguro
                </span>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '1.65rem', fontWeight: 700, color: 'var(--be-text)' }}>
                  Abre tu Baúl
                </h2>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--be-text-muted)' }}>
                  Ingresa con tu correo electrónico o RUT chileno.
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

                <div className="be-field" style={{ marginBottom: '10px' }}>
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

                <div style={{ textAlign: 'right', marginBottom: '18px' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/recuperar')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--be-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0,
                    }}
                  >
                    <IonIcon icon={keyOutline} />
                    ¿Olvidaste tu contraseña?
                  </button>
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

                <button type="submit" className="be-btn be-btn-primary be-btn-block" disabled={cargando || abriendoBaul}>
                  {cargando ? (
                    <IonSpinner name="crescent" color="light" />
                  ) : (
                    <>
                      Abrir mi Baúl
                      <IonIcon icon={arrowForwardOutline} />
                    </>
                  )}
                </button>
              </form>

              <div
                style={{
                  textAlign: 'center',
                  marginTop: '22px',
                  paddingTop: '18px',
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
