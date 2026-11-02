import React, { useState } from 'react';
import { IonPage, IonContent, IonToast } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { registrarUsuarioApi } from '../services/api';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [rut, setRut] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rut || !nombreUsuario || !correo || !contrasena) {
      setToastMsg('Por favor completa todos los campos.');
      return;
    }

    if (contrasena.length < 8) {
      setToastMsg('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setCargando(true);
    try {
      await registrarUsuarioApi({
        rut,
        nombre_usuario: nombreUsuario,
        correo_usuario: correo,
        password: contrasena,
        rol: 'TITULAR' // Rol por defecto según esquema de BD
      });
      setToastMsg('¡Cuenta creada exitosamente! Redirigiendo al login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error: any) {
      setToastMsg(error.response?.data?.mensaje || 'Error al registrar usuario en la base de datos.');
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
            minHeight: '520px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden'
          }}>
            {/* Panel Lateral Informativo */}
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
                Crea tu cuenta para comenzar a organizar tus pólizas, bienes y mensajes póstumos de forma totalmente protegida.
              </p>
            </div>

            {/* Formulario de Registro */}
            <div style={{
              flex: '1',
              padding: '44px 40px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '600', color: '#0f172a', margin: '0 0 8px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Crear Cuenta
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 20px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Ingresa tus datos para registrarte en la plataforma.
              </p>

              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="RUT (Ej: 12345678-9)"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 16px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Nombre Completo"
                    value={nombreUsuario}
                    onChange={(e) => setNombreUsuario(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 16px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="email"
                    placeholder="Correo Electrónico"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 16px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="password"
                    placeholder="Contraseña (Mínimo 8 caracteres)"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 16px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  style={{
                    width: '100%',
                    height: '46px',
                    backgroundColor: '#1b2431',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    cursor: 'pointer'
                  }}
                >
                  {cargando ? 'REGISTRANDO...' : 'CREAR CUENTA'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '18px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>¿Ya tienes una cuenta? </span>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  INGRESAR
                </button>
              </div>
            </div>
          </div>
        </div>

        <IonToast
          isOpen={!!toastMsg}
          onDidDismiss={() => setToastMsg('')}
          message={toastMsg}
          duration={3000}
        />
      </IonContent>
    </IonPage>
  );
};

export default Register;