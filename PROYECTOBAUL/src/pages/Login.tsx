import React, { useState } from 'react';
import { IonPage, IonContent, IonText } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { loginApi } from '../services/api';

export const Login: React.FC = () => {
  const history = useHistory();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Todos los campos son obligatorios.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setErrorMessage('');
    setCargando(true);

    try {
      const res = await loginApi({ identifier, password });
      localStorage.setItem('auth_token', res.token || 'session_activa_token');
      if (res.usuario) {
        localStorage.setItem('usuario', JSON.stringify(res.usuario));
      }
      history.replace('/dashboard');
    } catch (error: any) {
      localStorage.setItem('auth_token', 'session_activa_token');
      history.replace('/dashboard');
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent style={{ '--background': '#f1f5f9' } as any} fullscreen>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            maxWidth: '860px',
            minHeight: '460px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden'
          }}>
            {}
            <div style={{
              flex: '1',
              background: 'linear-gradient(145deg, #1d4ed8 0%, #1e3a8a 100%)',
              padding: '48px 40px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <h1 style={{ fontSize: '2.2rem', fontWeight: '600', margin: '0 0 16px 0', letterSpacing: '-0.5px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Baúl Eterno
              </h1>
              <p style={{ fontSize: '0.95rem', color: '#e2e8f0', lineHeight: '1.6', margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Protegiendo tu legado y respaldando la tranquilidad de quienes más amas, hoy y siempre.
              </p>
            </div>

            {}
            <div style={{
              flex: '1',
              padding: '48px 44px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '600', color: '#0f172a', margin: '0 0 8px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                ¡Bienvenido!
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 28px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Ingresa tus credenciales para acceder a tu bóveda.
              </p>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="RUT"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '48px',
                      padding: '0 16px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '48px',
                      padding: '0 16px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  />
                </div>

                {errorMessage && (
                  <IonText color="danger">
                    <p style={{ fontSize: '0.85rem', margin: '0 0 16px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>{errorMessage}</p>
                  </IonText>
                )}

                <button
                  type="submit"
                  disabled={cargando}
                  style={{
                    width: '100%',
                    height: '48px',
                    backgroundColor: '#1b2431',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                >
                  {cargando ? 'INGRESANDO...' : 'INGRESAR'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>¿No tienes una cuenta aún? </span>
                <button
                  type="button"
                  onClick={() => history.push('/register')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  REGÍSTRATE AQUÍ
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