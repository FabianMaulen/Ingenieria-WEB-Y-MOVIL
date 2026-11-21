import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonToast, IonIcon, IonSpinner } from '@ionic/react';
import {
  personOutline,
  lockClosedOutline,
  logOutOutline,
  shieldCheckmarkOutline,
  eyeOutline,
  eyeOffOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { mensajeError } from '../services/api';
import { cambiarPassword, logout, usuarioGuardado } from '../services/auth.service';

export const Configuracion: React.FC = () => {
  const navigate = useNavigate();

  const [nombreTitular, setNombreTitular] = useState('Usuario');
  const [correoUsuario, setCorreoUsuario] = useState('');
  const [rutUsuario, setRutUsuario] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mostrarClaves, setMostrarClaves] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  useEffect(() => {
    const usuario = usuarioGuardado();
    setNombreTitular(usuario?.nombre || localStorage.getItem('user_nombre') || 'Usuario');
    setCorreoUsuario(usuario?.correo || '');
    setRutUsuario(usuario?.rut || '');
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setToastMsg('Completa todos los campos de contraseña.');
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    if (newPassword.length < 8) {
      setToastMsg('La nueva contraseña debe tener al menos 8 caracteres.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setToastMsg('La nueva contraseña y su confirmación no coinciden.');
      setToastColor('danger');
      setShowToast(true);
      return;
    }

    try {
      setEnviando(true);
      const res = await cambiarPassword(currentPassword, newPassword);
      setToastMsg(res.mensaje || 'Contraseña actualizada exitosamente.');
      setToastColor('success');
      setShowToast(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setToastMsg(mensajeError(error));
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <IonPage id="main-content">
      <HeaderBar title="Ajustes y Seguridad" />

      <IonContent className="ion-padding">
        <div className="be-container">
          <div className="be-page-header">
            <div>
              <h2 className="be-page-title">Configuración de Cuenta</h2>
              <p className="be-page-subtitle">
                Consulta tus datos de acceso, actualiza tu contraseña o cierra tu sesión de forma segura.
              </p>
            </div>
          </div>

          {/* 1. Perfil */}
          <div className="be-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="be-icon-box">
                  <IonIcon icon={personOutline} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--be-text)' }}>
                    Perfil del Usuario
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--be-text-muted)' }}>
                    Identidad vinculada a tu bóveda
                  </span>
                </div>
              </div>
              <span className="be-badge be-badge-info">Cuenta Dual</span>
            </div>

            <div className="be-grid-2">
              <div className="be-field" style={{ marginBottom: 0 }}>
                <label className="be-label">Nombre registrado</label>
                <input className="be-input" value={nombreTitular} readOnly />
              </div>

              {rutUsuario && (
                <div className="be-field" style={{ marginBottom: 0 }}>
                  <label className="be-label">RUT chileno</label>
                  <input className="be-input" value={rutUsuario} readOnly />
                </div>
              )}
            </div>

            {correoUsuario && (
              <div className="be-field" style={{ marginTop: '14px', marginBottom: 0 }}>
                <label className="be-label">Correo electrónico</label>
                <input className="be-input" value={correoUsuario} readOnly />
              </div>
            )}
          </div>

          {/* 2. Cambio de contraseña conectado a PUT /api/auth/change-password */}
          <form onSubmit={handlePasswordChange} className="be-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="be-icon-box be-icon-box-accent">
                  <IonIcon icon={lockClosedOutline} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--be-text)' }}>
                    Cambiar Contraseña
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--be-text-muted)' }}>
                    Verificada en servidor con bcrypt
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="be-btn be-btn-outline"
                style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                onClick={() => setMostrarClaves((v) => !v)}
              >
                <IonIcon icon={mostrarClaves ? eyeOffOutline : eyeOutline} />
                {mostrarClaves ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>

            <div className="be-field">
              <label className="be-label" htmlFor="cfg-pass-actual">
                Contraseña actual *
              </label>
              <input
                id="cfg-pass-actual"
                type={mostrarClaves ? 'text' : 'password'}
                className="be-input"
                placeholder="Ingresa tu contraseña actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="be-grid-2">
              <div className="be-field">
                <label className="be-label" htmlFor="cfg-pass-nueva">
                  Nueva contraseña *
                </label>
                <input
                  id="cfg-pass-nueva"
                  type={mostrarClaves ? 'text' : 'password'}
                  className="be-input"
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="be-field">
                <label className="be-label" htmlFor="cfg-pass-confirm">
                  Confirmar nueva contraseña *
                </label>
                <input
                  id="cfg-pass-confirm"
                  type={mostrarClaves ? 'text' : 'password'}
                  className="be-input"
                  placeholder="Repite la nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button type="submit" className="be-btn be-btn-primary be-btn-block" disabled={enviando}>
              {enviando ? <IonSpinner name="crescent" color="light" /> : 'Actualizar contraseña'}
            </button>
          </form>

          {/* 3. Sesión */}
          <div className="be-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="be-icon-box">
                  <IonIcon icon={shieldCheckmarkOutline} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--be-text)' }}>
                  Seguridad y Sesión
                </h3>
              </div>
              <span className="be-badge be-badge-success">AES-256 · JWT</span>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: 'var(--be-text-muted)', lineHeight: 1.5 }}>
              Al cerrar sesión, el token local se elimina de este dispositivo y tu bóveda permanece sellada hasta tu
              próximo ingreso.
            </p>

            <button type="button" className="be-btn be-btn-danger be-btn-block" onClick={handleLogout}>
              <IonIcon icon={logOutOutline} />
              Cerrar sesión activa
            </button>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={3500}
          color={toastColor}
        />
      </IonContent>

      <MobileBottomNav />
    </IonPage>
  );
};

export default Configuracion;
