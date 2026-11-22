import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonToast,
  IonIcon,
  IonSpinner,
  IonAlert,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  personOutline,
  lockClosedOutline,
  logOutOutline,
  shieldCheckmarkOutline,
  eyeOutline,
  eyeOffOutline,
  notificationsOutline,
  checkmarkCircleOutline,
  mailUnreadOutline,
  sendOutline,
  headsetOutline,
  documentTextOutline,
  downloadOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { SoporteModal } from '../components/SoporteModal';
import { mensajeError } from '../services/api';
import { descargarKitEmergenciaPdf } from '../services/boveda.service';
import {
  cambiarPassword,
  logout,
  obtenerPerfil,
  actualizarPreferencias,
  enviarVerificacionCorreo,
  confirmarVerificacionCorreo,
  usuarioGuardado,
} from '../services/auth.service';
import { emailValido } from '../utils/rut';
import { misTicketsSoporte, TicketSoporte } from '../services/soporte.service';

export const Configuracion: React.FC = () => {
  const navigate = useNavigate();

  const [nombreTitular, setNombreTitular] = useState('Usuario');
  const [correoUsuario, setCorreoUsuario] = useState('');
  const [rutUsuario, setRutUsuario] = useState('');
  const [correoVerificado, setCorreoVerificado] = useState<boolean>(false);

  // Preferencias de vigilancia y correos de respaldo
  const [frecuenciaDias, setFrecuenciaDias] = useState<number>(180);
  const [plazoGraciaDias, setPlazoGraciaDias] = useState<number>(7);
  const [correoAlternativo, setCorreoAlternativo] = useState<string>('');
  const [correoAltVerificado, setCorreoAltVerificado] = useState<boolean>(false);
  const [nombreConfianza, setNombreConfianza] = useState<string>('');
  const [correoConfianza, setCorreoConfianza] = useState<string>('');
  const [notificarRecordatorios, setNotificarRecordatorios] = useState<boolean>(true);
  const [guardandoPref, setGuardandoPref] = useState<boolean>(false);

  // Verificación de correo principal / alternativo con código de 6 dígitos
  const [codigoPrincipal, setCodigoPrincipal] = useState('');
  const [mostrandoVerifPrincipal, setMostrandoVerifPrincipal] = useState(false);
  const [codigoAlt, setCodigoAlt] = useState('');
  const [mostrandoVerifAlt, setMostrandoVerifAlt] = useState(false);
  const [procesandoVerif, setProcesandoVerif] = useState(false);

  // Cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mostrarClaves, setMostrarClaves] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [confirmarLogout, setConfirmarLogout] = useState(false);
  const [descargandoKit, setDescargandoKit] = useState(false);
  const [abriendoSoporte, setAbriendoSoporte] = useState(false);
  const [misTickets, setMisTickets] = useState<TicketSoporte[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  const cargarPerfil = async () => {
    const local = usuarioGuardado();
    if (local) {
      setNombreTitular(local.nombre || 'Usuario');
      setCorreoUsuario(local.correo || '');
      setRutUsuario(local.rut || '');
    }
    try {
      const [p, tks] = await Promise.all([
        obtenerPerfil(),
        misTicketsSoporte().catch(() => []),
      ]);
      setMisTickets(Array.isArray(tks) ? tks : []);
      setNombreTitular(p.nombre || 'Usuario');
      setCorreoUsuario(p.correo || '');
      setRutUsuario(p.rut || '');
      setCorreoVerificado(Boolean(p.correo_verificado));
      setFrecuenciaDias(Number(p.frecuencia_checkin_dias) || 180);
      setPlazoGraciaDias(Number(p.plazo_gracia_dias) || 7);
      setCorreoAlternativo(p.correo_alternativo || '');
      setCorreoAltVerificado(Boolean(p.correo_alternativo_verificado));
      setNombreConfianza(p.nombre_contacto_confianza || '');
      setCorreoConfianza(p.correo_contacto_confianza || '');
      setNotificarRecordatorios(p.notificar_recordatorios !== false);
    } catch {
      // Mantiene datos locales
    }
  };

  useIonViewWillEnter(() => {
    cargarPerfil();
  });

  const mostrarAviso = (msg: string, color: 'success' | 'danger' | 'warning' = 'success') => {
    setToastMsg(msg);
    setToastColor(color);
    setShowToast(true);
  };

  const handleGuardarPreferencias = async (e: React.FormEvent) => {
    e.preventDefault();

    if (correoAlternativo.trim() && !emailValido(correoAlternativo)) {
      mostrarAviso('El correo alternativo ingresado no tiene un formato válido.', 'danger');
      return;
    }

    if (correoConfianza.trim() && !emailValido(correoConfianza)) {
      mostrarAviso('El correo del contacto de confianza no tiene un formato válido.', 'danger');
      return;
    }

    try {
      setGuardandoPref(true);
      const res = await actualizarPreferencias({
        frecuencia_checkin_dias: frecuenciaDias,
        plazo_gracia_dias: plazoGraciaDias,
        correo_alternativo: correoAlternativo.trim().toLowerCase(),
        nombre_contacto_confianza: nombreConfianza.trim(),
        correo_contacto_confianza: correoConfianza.trim().toLowerCase(),
        notificar_recordatorios: notificarRecordatorios,
      });
      mostrarAviso(res.mensaje || 'Preferencias guardadas correctamente.', 'success');
      if (correoAlternativo.trim() && res.mensaje?.includes('código')) {
        setMostrandoVerifAlt(true);
      }
      await cargarPerfil();
    } catch (error) {
      mostrarAviso(mensajeError(error), 'danger');
    } finally {
      setGuardandoPref(false);
    }
  };

  const handleEnviarCodigo = async (tipo: 'PRINCIPAL' | 'ALTERNATIVO') => {
    try {
      setProcesandoVerif(true);
      const res = await enviarVerificacionCorreo(tipo);
      mostrarAviso(res.mensaje || 'Código enviado a tu correo.', 'success');
      if (tipo === 'PRINCIPAL') setMostrandoVerifPrincipal(true);
      else setMostrandoVerifAlt(true);
    } catch (error) {
      mostrarAviso(mensajeError(error), 'danger');
    } finally {
      setProcesandoVerif(false);
    }
  };

  const handleConfirmarCodigo = async (tipo: 'PRINCIPAL' | 'ALTERNATIVO') => {
    const codigo = tipo === 'PRINCIPAL' ? codigoPrincipal.trim() : codigoAlt.trim();
    if (codigo.length < 6) {
      mostrarAviso('Ingresa el código de 6 dígitos enviado a tu correo.', 'warning');
      return;
    }
    try {
      setProcesandoVerif(true);
      const res = await confirmarVerificacionCorreo(tipo, codigo);
      mostrarAviso(res.mensaje || 'Correo confirmado correctamente.', 'success');
      if (tipo === 'PRINCIPAL') {
        setCodigoPrincipal('');
        setMostrandoVerifPrincipal(false);
      } else {
        setCodigoAlt('');
        setMostrandoVerifAlt(false);
      }
      await cargarPerfil();
    } catch (error) {
      mostrarAviso(mensajeError(error), 'danger');
    } finally {
      setProcesandoVerif(false);
    }
  };

  const handleDescargarKit = async () => {
    try {
      setDescargandoKit(true);
      await descargarKitEmergenciaPdf();
      mostrarAviso('Kit de Emergencia descargado en PDF. Guárdalo en un lugar seguro.', 'success');
    } catch (error) {
      mostrarAviso(mensajeError(error), 'danger');
    } finally {
      setDescargandoKit(false);
    }
  };

  const handleLogoutConfirmado = () => {
    setConfirmarLogout(false);
    logout();
    navigate('/login', { replace: true });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      mostrarAviso('Completa todos los campos de contraseña.', 'warning');
      return;
    }

    if (newPassword.length < 8) {
      mostrarAviso('La nueva contraseña debe tener al menos 8 caracteres.', 'danger');
      return;
    }

    if (newPassword !== confirmPassword) {
      mostrarAviso('La nueva contraseña y su confirmación no coinciden.', 'danger');
      return;
    }

    try {
      setEnviando(true);
      const res = await cambiarPassword(currentPassword, newPassword);
      mostrarAviso(res.mensaje || 'Contraseña actualizada exitosamente.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      mostrarAviso(mensajeError(error), 'danger');
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
                Personaliza tu ciclo de Check-in, correos de respaldo, persona de confianza y seguridad de acceso.
              </p>
            </div>
          </div>

          {/* 1. Perfil + Verificación de Correo Principal */}
          <div className="be-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                  <label className="be-label" style={{ marginBottom: 0 }}>
                    Correo electrónico principal
                  </label>
                  {correoVerificado ? (
                    <span className="be-badge be-badge-success">
                      <IonIcon icon={checkmarkCircleOutline} /> Confirmado
                    </span>
                  ) : (
                    <span className="be-badge be-badge-warning">
                      <IonIcon icon={mailUnreadOutline} /> Pendiente de confirmar
                    </span>
                  )}
                </div>
                <input className="be-input" value={correoUsuario} readOnly />

                {!correoVerificado && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="be-btn be-btn-outline"
                        style={{ padding: '7px 12px', fontSize: '0.8rem' }}
                        disabled={procesandoVerif}
                        onClick={() => handleEnviarCodigo('PRINCIPAL')}
                      >
                        <IonIcon icon={sendOutline} /> Enviar código de confirmación
                      </button>
                      {!mostrandoVerifPrincipal && (
                        <button
                          type="button"
                          className="be-btn be-btn-outline"
                          style={{ padding: '7px 12px', fontSize: '0.8rem' }}
                          onClick={() => setMostrandoVerifPrincipal(true)}
                        >
                          Ya tengo mi código
                        </button>
                      )}
                    </div>

                    {mostrandoVerifPrincipal && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          maxLength={6}
                          className="be-input"
                          style={{ flex: '1 1 160px', letterSpacing: '3px', fontWeight: 700 }}
                          placeholder="Código 6 dígitos"
                          value={codigoPrincipal}
                          onChange={(e) => setCodigoPrincipal(e.target.value)}
                        />
                        <button
                          type="button"
                          className="be-btn be-btn-primary"
                          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                          disabled={procesandoVerif}
                          onClick={() => handleConfirmarCodigo('PRINCIPAL')}
                        >
                          Confirmar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 1b. Kit de Emergencia Patrimonial en PDF con QR */}
          <div
            className="be-card"
            style={{
              borderColor: 'var(--be-primary)',
              background: 'linear-gradient(135deg, var(--be-surface) 0%, var(--be-surface-alt) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 260px' }}>
                <div className="be-icon-box">
                  <IonIcon icon={documentTextOutline} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 3px 0', fontSize: '1.02rem', fontWeight: 800, color: 'var(--be-text)' }}>
                    Aviso Discreto de Bóveda / Kit QR (PDF)
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.81rem', color: 'var(--be-text-muted)', lineHeight: 1.45 }}>
                    Descarga una hoja imprimible con un <strong>código QR</strong> para orientar a tu familia hacia tu
                    baúl en caso de contingencia, <strong>sin revelar montos, pólizas ni datos privados</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="be-btn be-btn-primary"
                disabled={descargandoKit}
                onClick={handleDescargarKit}
              >
                {descargandoKit ? (
                  <>
                    <IonSpinner name="crescent" color="light" style={{ width: '16px', height: '16px' }} />
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <IonIcon icon={downloadOutline} />
                    Descargar PDF con QR
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. Vigencia de Bóveda, Correos de Respaldo y Notificaciones */}
          <form onSubmit={handleGuardarPreferencias} className="be-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="be-icon-box be-icon-box-accent">
                  <IonIcon icon={notificationsOutline} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--be-text)' }}>
                    Vigencia, Notificaciones y Respaldo por Correo
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--be-text-muted)' }}>
                    Define cada cuánto confirmar actividad y a quién avisar antes de liberar tu bóveda
                  </span>
                </div>
              </div>
            </div>

            <div className="be-grid-2">
              <div className="be-field">
                <label className="be-label">Frecuencia de Check-in (vigencia)</label>
                <select
                  className="be-select"
                  value={frecuenciaDias}
                  onChange={(e) => setFrecuenciaDias(Number(e.target.value))}
                >
                  <option value={30}>Cada 30 días (1 mes)</option>
                  <option value={90}>Cada 90 días (3 meses)</option>
                  <option value={180}>Cada 180 días (6 meses · Recomendado)</option>
                  <option value={365}>Cada 365 días (1 año)</option>
                </select>
              </div>

              <div className="be-field">
                <label className="be-label">Plazo de gracia ante solicitud de apertura</label>
                <select
                  className="be-select"
                  value={plazoGraciaDias}
                  onChange={(e) => setPlazoGraciaDias(Number(e.target.value))}
                >
                  <option value={3}>3 días (72 horas)</option>
                  <option value={7}>7 días (1 semana · Recomendado)</option>
                  <option value={14}>14 días (2 semanas)</option>
                </select>
              </div>
            </div>

            {/* Correo alternativo */}
            <div className="be-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                <label className="be-label" style={{ marginBottom: 0 }}>
                  Correo alternativo personal (opcional)
                </label>
                {correoAlternativo.trim() && (
                  <span className={correoAltVerificado ? 'be-badge be-badge-success' : 'be-badge be-badge-warning'}>
                    {correoAltVerificado ? 'Confirmado' : 'Pendiente de confirmar'}
                  </span>
                )}
              </div>
              <input
                type="email"
                className="be-input"
                placeholder="tu.otro.correo@gmail.com"
                value={correoAlternativo}
                onChange={(e) => setCorreoAlternativo(e.target.value)}
              />
              <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--be-text-muted)', marginTop: '4px' }}>
                Recibe los mismos recordatorios de Check-in y alertas críticas que tu correo principal.
              </span>

              {correoAlternativo.trim() && !correoAltVerificado && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="be-btn be-btn-outline"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      disabled={procesandoVerif}
                      onClick={() => handleEnviarCodigo('ALTERNATIVO')}
                    >
                      <IonIcon icon={sendOutline} /> Reenviar código al alternativo
                    </button>
                    {!mostrandoVerifAlt && (
                      <button
                        type="button"
                        className="be-btn be-btn-outline"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        onClick={() => setMostrandoVerifAlt(true)}
                      >
                        Ingresar código
                      </button>
                    )}
                  </div>

                  {mostrandoVerifAlt && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        maxLength={6}
                        className="be-input"
                        style={{ flex: '1 1 160px', letterSpacing: '3px', fontWeight: 700 }}
                        placeholder="Código 6 dígitos"
                        value={codigoAlt}
                        onChange={(e) => setCodigoAlt(e.target.value)}
                      />
                      <button
                        type="button"
                        className="be-btn be-btn-primary"
                        style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                        disabled={procesandoVerif}
                        onClick={() => handleConfirmarCodigo('ALTERNATIVO')}
                      >
                        Confirmar alternativo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contacto de confianza 48h antes */}
            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: 'var(--be-surface-alt)',
                border: '1px solid var(--be-border)',
                marginBottom: '14px',
              }}
            >
              <strong style={{ display: 'block', fontSize: '0.86rem', color: 'var(--be-text)', marginBottom: '4px' }}>
                Persona de confianza de aviso final (48 horas antes)
              </strong>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: 'var(--be-text-muted)', lineHeight: 1.45 }}>
                Si alguna vez no respondes a tiempo, esta persona recibirá un correo <strong>48 horas antes</strong> de
                la apertura para verificar si te encuentras bien y avisarte.
              </p>

              <div className="be-grid-2">
                <div className="be-field" style={{ marginBottom: 0 }}>
                  <label className="be-label">Nombre de la persona</label>
                  <input
                    type="text"
                    className="be-input"
                    placeholder="Ej: Camila Pérez"
                    value={nombreConfianza}
                    onChange={(e) => setNombreConfianza(e.target.value)}
                  />
                </div>
                <div className="be-field" style={{ marginBottom: 0 }}>
                  <label className="be-label">Correo de aviso final</label>
                  <input
                    type="email"
                    className="be-input"
                    placeholder="camila@correo.cl"
                    value={correoConfianza}
                    onChange={(e) => setCorreoConfianza(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.84rem',
                color: 'var(--be-text)',
                marginBottom: '14px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={notificarRecordatorios}
                onChange={(e) => setNotificarRecordatorios(e.target.checked)}
                style={{ width: '17px', height: '17px' }}
              />
              <span>
                Activar recordatorios progresivos por correo (15 días, 7 días y 48 h antes) y trigger automático hacia
                mis albaceas si vence el ciclo de Check-in.
              </span>
            </label>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--be-surface-alt)',
                borderLeft: '3px solid var(--be-primary)',
                fontSize: '0.79rem',
                color: 'var(--be-text-muted)',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}
            >
              <strong style={{ color: 'var(--be-text)' }}>Resumen de tu protocolo actual:</strong> Confirmas actividad
              cada <strong>{frecuenciaDias} días</strong>. Si alguien solicita apertura, tendrás{' '}
              <strong>{plazoGraciaDias} días</strong> con avisos a tu correo principal
              {correoAlternativo.trim() ? ' y alternativo' : ''}; a las <strong>48 horas finales</strong> avisaremos{' '}
              {correoConfianza.trim() ? `también a ${nombreConfianza || correoConfianza}` : 'con alerta urgente'}. Si
              no hay respuesta, tu bóveda se liberará automáticamente.
            </div>

            <button type="submit" className="be-btn be-btn-primary be-btn-block" disabled={guardandoPref}>
              {guardandoPref ? <IonSpinner name="crescent" color="light" /> : 'Guardar preferencias de vigilancia'}
            </button>
          </form>

          {/* 3. Cambio de contraseña */}
          <form onSubmit={handlePasswordChange} className="be-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="be-icon-box">
                  <IonIcon icon={lockClosedOutline} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--be-text)' }}>
                    Cambiar Contraseña
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--be-text-muted)' }}>
                    Envía alerta de seguridad por correo al modificarse
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

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {(currentPassword || newPassword || confirmPassword) && (
                <button
                  type="button"
                  className="be-btn be-btn-outline"
                  style={{ flex: '1 1 130px' }}
                  onClick={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="be-btn be-btn-primary"
                style={{ flex: '2 1 200px' }}
                disabled={enviando}
              >
                {enviando ? <IonSpinner name="crescent" color="light" /> : 'Actualizar contraseña'}
              </button>
            </div>
          </form>

          {/* 4. Soporte y ayuda directa */}
          <div className="be-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="be-icon-box be-icon-box-accent">
                  <IonIcon icon={headsetOutline} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--be-text)' }}>
                    Soporte y Ayuda
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--be-text-muted)' }}>
                    Comunicación directa ante cualquier inconveniente
                  </span>
                </div>
              </div>
            </div>

            <p style={{ margin: '0 0 14px 0', fontSize: '0.86rem', color: 'var(--be-text-muted)', lineHeight: 1.5 }}>
              ¿Tuviste un problema con tu cuenta, una alerta inesperada o una solicitud de apertura? Escríbenos
              directamente y te responderemos a tu correo registrado.
            </p>

            <button
              type="button"
              className="be-btn be-btn-outline be-btn-block"
              onClick={() => setAbriendoSoporte(true)}
            >
              <IonIcon icon={headsetOutline} />
              Crear nuevo ticket de soporte
            </button>

            {misTickets.length > 0 && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--be-border)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--be-text-muted)', marginBottom: '8px' }}>
                  Mis tickets registrados ({misTickets.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {misTickets.slice(0, 5).map((tk) => (
                    <div
                      key={tk.id_ticket}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--be-surface-alt)',
                        border: '1px solid var(--be-border)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <strong style={{ color: 'var(--be-text)' }}>
                          {tk.codigo_ticket} · {tk.categoria}
                        </strong>
                        <span
                          className={
                            tk.estado_ticket === 'RESUELTO' || tk.estado_ticket === 'CERRADO'
                              ? 'be-badge be-badge-success'
                              : tk.estado_ticket === 'EN_PROCESO'
                              ? 'be-badge be-badge-info'
                              : 'be-badge be-badge-warning'
                          }
                        >
                          {tk.estado_ticket}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 4px 0', color: 'var(--be-text-muted)' }}>{tk.mensaje}</p>
                      {tk.respuesta_admin && (
                        <div style={{ marginTop: '6px', padding: '7px 10px', borderRadius: '8px', backgroundColor: 'var(--be-surface)', borderLeft: '3px solid var(--be-primary)', color: 'var(--be-text)' }}>
                          <strong>Respuesta soporte:</strong> {tk.respuesta_admin}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Sesión con confirmación */}
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
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: 'var(--be-text-muted)', lineHeight: 1.5 }}>
              Al cerrar sesión, tu acceso en este dispositivo se cierra de forma segura y tu bóveda permanece sellada
              hasta tu próximo ingreso.
            </p>

            <button
              type="button"
              className="be-btn be-btn-danger be-btn-block"
              onClick={() => setConfirmarLogout(true)}
            >
              <IonIcon icon={logOutOutline} />
              Cerrar sesión activa
            </button>
          </div>
        </div>

        <SoporteModal
          isOpen={abriendoSoporte}
          onClose={() => setAbriendoSoporte(false)}
          categoriaInicial="Problema de acceso o cuenta"
          onEnviado={(msg) => {
            mostrarAviso(msg, 'success');
            cargarPerfil();
          }}
        />

        <IonAlert
          isOpen={confirmarLogout}
          onDidDismiss={() => setConfirmarLogout(false)}
          header="¿Cerrar sesión?"
          message="Tu bóveda permanecerá sellada y deberás volver a iniciar sesión para acceder."
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Cerrar sesión', role: 'confirm', handler: () => handleLogoutConfirmado() },
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={3800}
          color={toastColor}
        />
      </IonContent>

      <MobileBottomNav />
    </IonPage>
  );
};

export default Configuracion;
