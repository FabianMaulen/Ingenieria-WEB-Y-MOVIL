import React, { useState } from 'react';
import { IonPage, IonContent, IonToast, IonIcon, useIonViewWillEnter } from '@ionic/react';
import {
  shieldCheckmarkOutline,
  peopleOutline,
  folderOpenOutline,
  mailOutline,
  warningOutline,
  arrowForwardOutline,
  handLeftOutline,
  mailUnreadOutline,
  lockOpenOutline,
  headsetOutline,
  downloadOutline,
  documentTextOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';
import { VaultStatusCard } from '../components/VaultStatusCard';
import { OnboardingBoveda } from '../components/OnboardingBoveda';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { SoporteModal } from '../components/SoporteModal';

import { mensajeError } from '../services/api';
import { descargarKitEmergenciaPdf } from '../services/boveda.service';
import {
  activarBovedaPersonal,
  completarRutUsuario,
  obtenerPerfil,
  usuarioGuardado,
} from '../services/auth.service';
import { normalizarRut, rutValido } from '../utils/rut';
import { obtenerCheckin, renovarCheckin } from '../services/checkin.service';
import {
  listarAlertas,
  cancelarSolicitud,
  cancelarReporteFamiliar,
  Alerta,
} from '../services/solicitudes.service';
import { listarPolizas } from '../services/polizas.service';
import { getAlbaceas } from '../services/albaceas.service';
import { getMensajes } from '../services/mensajes.service';
import { listarInventario } from '../services/inventario.service';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [nombreTitular, setNombreTitular] = useState('Usuario');
  const [correoUsuario, setCorreoUsuario] = useState(() => usuarioGuardado()?.correo || '');
  const [daysLeft, setDaysLeft] = useState(180);
  const [frecuenciaDias, setFrecuenciaDias] = useState(180);
  const [plazoGraciaDias, setPlazoGraciaDias] = useState(7);
  const [bovedaActiva, setBovedaActiva] = useState<boolean>(
    () => usuarioGuardado()?.boveda_activa !== false
  );
  const [activandoBoveda, setActivandoBoveda] = useState(false);
  const [descargandoKit, setDescargandoKit] = useState(false);
  const [correoVerificado, setCorreoVerificado] = useState<boolean>(true);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [alertasLiberadas, setAlertasLiberadas] = useState<Alerta[]>([]);
  const [abriendoSoporte, setAbriendoSoporte] = useState(false);
  const [casoSoporte, setCasoSoporte] = useState<{
    idSolicitud?: number | null;
    idReporte?: number | null;
    label?: string;
  }>({});
  const [cargandoCheckin, setCargandoCheckin] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [cantPolizas, setCantPolizas] = useState<number>(0);
  const [cantAlbaceas, setCantAlbaceas] = useState<number>(0);
  const [cantMensajes, setCantMensajes] = useState<number>(0);
  const [cantInventario, setCantInventario] = useState<number>(0);

  // Para usuarios creados con Google OAuth que aún deben registrar su RUT chileno
  const [requiereRut, setRequiereRut] = useState<boolean>(false);
  const [rutPendiente, setRutPendiente] = useState<string>('');
  const [guardandoRut, setGuardandoRut] = useState<boolean>(false);

  useIonViewWillEnter(() => {
    const u = usuarioGuardado();
    setNombreTitular(u?.nombre || localStorage.getItem('user_nombre') || 'Usuario');
    setRequiereRut(Boolean(u && (!u.rut || u.requiere_rut)));
    if (u?.correo_verificado !== undefined) setCorreoVerificado(Boolean(u.correo_verificado));
    localStorage.setItem('modo_activo', 'TITULAR');
    cargarDatosDashboard();
  });

  const handleGuardarRutOAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rutValido(rutPendiente)) {
      setToastMsg('Ingresa un RUT chileno válido con dígito verificador (Ej: 12345678-5).');
      setShowToast(true);
      return;
    }
    try {
      setGuardandoRut(true);
      const res = await completarRutUsuario(normalizarRut(rutPendiente));
      setRequiereRut(false);
      setRutPendiente('');
      setToastMsg(res.mensaje || 'RUT guardado correctamente.');
      setShowToast(true);
      await cargarDatosDashboard();
    } catch (error) {
      setToastMsg(mensajeError(error));
      setShowToast(true);
    } finally {
      setGuardandoRut(false);
    }
  };

  const cargarDatosDashboard = async () => {
    try {
      const [perfilActual, dataCheckin, dataAlertas, dataPolizas, dataAlbaceas, dataMensajes, dataInventario] =
        await Promise.all([
          obtenerPerfil().catch(() => null),
          obtenerCheckin().catch(() => null),
          listarAlertas().catch(() => []),
          listarPolizas().catch(() => []),
          getAlbaceas().catch(() => []),
          getMensajes().catch(() => []),
          listarInventario().catch(() => []),
        ]);

      if (perfilActual) {
        setNombreTitular(perfilActual.nombre || 'Usuario');
        setCorreoUsuario(perfilActual.correo || '');
        setRequiereRut(Boolean(!perfilActual.rut || perfilActual.requiere_rut));
        setCorreoVerificado(Boolean(perfilActual.correo_verificado));
        setBovedaActiva(Boolean(perfilActual.boveda_activa));
        if (perfilActual.plazo_gracia_dias) setPlazoGraciaDias(Number(perfilActual.plazo_gracia_dias));
      } else if (dataCheckin && typeof dataCheckin.boveda_activa === 'boolean') {
        setBovedaActiva(dataCheckin.boveda_activa);
      }

      const listaAlertas = Array.isArray(dataAlertas) ? dataAlertas : [];
      const alertasPendientes = listaAlertas.filter((a) => a.estado_solicitud === 'PENDIENTE');
      const liberadas = listaAlertas.filter((a) => a.estado_solicitud === 'APROBADA');

      setAlertas(alertasPendientes);
      setAlertasLiberadas(liberadas);
      setCantPolizas(Array.isArray(dataPolizas) ? dataPolizas.length : 0);
      setCantAlbaceas(
        Array.isArray(dataAlbaceas)
          ? dataAlbaceas.filter((a) => a.estado_validacion !== 'RECHAZADO').length
          : 0
      );
      setCantMensajes(Array.isArray(dataMensajes) ? dataMensajes.length : 0);
      setCantInventario(Array.isArray(dataInventario) ? dataInventario.length : 0);

      const freq = Number(dataCheckin?.frecuencia_checkin_dias || perfilActual?.frecuencia_checkin_dias || 180);
      setFrecuenciaDias(freq);
      if (dataCheckin?.plazo_gracia_dias) setPlazoGraciaDias(Number(dataCheckin.plazo_gracia_dias));

      if (alertasPendientes.length > 0) {
        const horasMin = Math.min(
          ...alertasPendientes.map((a) => Number(a.horas_restantes ?? a.plazo_gracia_horas ?? 168))
        );
        setDaysLeft(Math.max(1, Math.ceil(horasMin / 24)));
      } else if (dataCheckin && typeof dataCheckin.dias_restantes === 'number') {
        setDaysLeft(dataCheckin.dias_restantes);
      } else if (dataCheckin && typeof dataCheckin.dias_desde_ultimo === 'number') {
        setDaysLeft(Math.max(0, freq - dataCheckin.dias_desde_ultimo));
      } else {
        setDaysLeft(freq);
      }
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', mensajeError(error));
    }
  };

  const handleActivarBoveda = async () => {
    try {
      setActivandoBoveda(true);
      const res = await activarBovedaPersonal(true);
      setBovedaActiva(true);
      setToastMsg(res.mensaje || '¡Tu Baúl Eterno quedó sellado y activo!');
      setShowToast(true);
      await cargarDatosDashboard();
    } catch (error) {
      setToastMsg(mensajeError(error));
      setShowToast(true);
    } finally {
      setActivandoBoveda(false);
    }
  };

  const handleDescargarKit = async () => {
    try {
      setDescargandoKit(true);
      await descargarKitEmergenciaPdf();
      setToastMsg('Kit de Emergencia Patrimonial descargado en PDF.');
      setShowToast(true);
    } catch (error) {
      setToastMsg(mensajeError(error));
      setShowToast(true);
    } finally {
      setDescargandoKit(false);
    }
  };

  const handleCheckin = async () => {
    try {
      setCargandoCheckin(true);
      const res = await renovarCheckin();
      const nuevoCiclo = res.data?.frecuencia_checkin_dias || frecuenciaDias;
      setDaysLeft(nuevoCiclo);
      setToastMsg(
        res.mensaje || `Presencia confirmada. Tu bóveda queda sellada por un nuevo periodo de ${nuevoCiclo} días.`
      );
      setShowToast(true);
      await cargarDatosDashboard();
    } catch (error) {
      setToastMsg(mensajeError(error));
      setShowToast(true);
    } finally {
      setCargandoCheckin(false);
    }
  };

  const handleCancelarApertura = async (alerta: Alerta) => {
    try {
      setCargandoCheckin(true);
      if (alerta.origen === 'FAMILIAR') {
        await cancelarReporteFamiliar(alerta.id_solicitud);
      } else {
        await cancelarSolicitud(alerta.id_solicitud);
      }
      setToastMsg('Solicitud de apertura anulada y vigencia renovada. Notificamos al solicitante.');
      setShowToast(true);
      await cargarDatosDashboard();
    } catch (error) {
      setToastMsg(mensajeError(error));
      setShowToast(true);
    } finally {
      setCargandoCheckin(false);
    }
  };

  const formatearTiempoRestante = (horas?: number) => {
    if (horas === undefined || horas === null) return 'En periodo de gracia';
    const dias = Math.floor(horas / 24);
    const hrs = horas % 24;
    if (dias > 0) return `${dias} día(s) y ${hrs} h restantes`;
    return `${hrs} hora(s) restantes`;
  };

  const primerNombre = nombreTitular.split(' ')[0];

  const modulos = [
    {
      path: '/polizas',
      kicker: 'PATRIMONIO Y COBERTURAS',
      titulo: 'Pólizas de Seguro',
      descripcion:
        'Centraliza seguros de vida, salud y desgravamen con valoración en vivo UF / CLP para tus beneficiarios.',
      badge: `${cantPolizas} guardada${cantPolizas === 1 ? '' : 's'}`,
      badgeClass: 'be-badge be-badge-info',
      cta: cantPolizas === 0 ? 'Agregar primera póliza' : 'Gestionar pólizas',
      icon: shieldCheckmarkOutline,
      accent: false,
    },
    {
      path: '/albaceas',
      kicker: 'RED DE CONFIANZA',
      titulo: 'Albaceas Designados',
      descripcion:
        'Elige hasta 5 personas de confianza (incluso si aún no crean cuenta) para custodiar tu bóveda.',
      badge: `${cantAlbaceas} / 5 designados`,
      badgeClass: cantAlbaceas > 0 ? 'be-badge be-badge-success' : 'be-badge be-badge-warning',
      cta: cantAlbaceas === 0 ? 'Designar albacea' : 'Administrar albaceas',
      icon: peopleOutline,
      accent: true,
    },
    {
      path: '/inventario',
      kicker: 'ACTIVOS Y CUENTAS',
      titulo: 'Inventario Patrimonial',
      descripcion:
        'Registra plataformas digitales, suscripciones y bienes con instrucciones claras para tu familia.',
      badge: `${cantInventario} activo${cantInventario === 1 ? '' : 's'}`,
      badgeClass: 'be-badge be-badge-neutral',
      cta: cantInventario === 0 ? 'Registrar activo' : 'Ver inventario',
      icon: folderOpenOutline,
      accent: false,
    },
    {
      path: '/mensajes',
      kicker: 'CUSTODIA CIFRADA',
      titulo: 'Mensajes Póstumos',
      descripcion:
        'Redacta cartas personales o instrucciones confidenciales cifradas que solo se abren tras la liberación.',
      badge: `${cantMensajes} carta${cantMensajes === 1 ? '' : 's'} sellada${cantMensajes === 1 ? '' : 's'}`,
      badgeClass: 'be-badge be-badge-info',
      cta: cantMensajes === 0 ? 'Redactar primer mensaje' : 'Ver mensajes sellados',
      icon: mailOutline,
      accent: true,
    },
  ];

  return (
    <IonPage id="main-content">
      <HeaderBar title="Resumen del Baúl" showBack={false} />

      <IonContent className="ion-padding">
        <div className="be-container">
          {/* Saludo editorial compacto */}
          <div
            className="be-hero-banner be-hero-banner-compact"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <h2>Hola, {primerNombre}</h2>
              <p>
                {bovedaActiva
                  ? 'Tu bóveda personal resguarda tu patrimonio y voluntades con cifrado de alto nivel.'
                  : 'Completa el paso a paso prioritario de abajo para sellar y activar tu bóveda.'}
              </p>
            </div>
            {!bovedaActiva && (
              <span
                style={{
                  backgroundColor: 'rgba(251, 191, 36, 0.2)',
                  border: '1px solid rgba(251, 191, 36, 0.5)',
                  color: '#fef3c7',
                  borderRadius: '999px',
                  padding: '4px 11px',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                }}
              >
                Activación pendiente
              </span>
            )}
          </div>

          {/* Aviso de confirmación de correo principal (solo si la bóveda ya está activa; si no, va integrado en el paso a paso) */}
          {bovedaActiva && !correoVerificado && (
            <div
              className="be-card"
              style={{
                borderColor: 'var(--be-warning)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                padding: '14px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 240px' }}>
                <IonIcon icon={mailUnreadOutline} style={{ fontSize: '1.4rem', color: 'var(--be-warning)', flexShrink: 0 }} />
                <div style={{ fontSize: '0.84rem', color: 'var(--be-text)' }}>
                  <strong>Confirma tu correo electrónico principal</strong> para garantizar la entrega de alertas de
                  apertura y recordatorios de Check-in.
                </div>
              </div>
              <button
                type="button"
                className="be-btn be-btn-outline"
                style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                onClick={() => navigate('/configuracion')}
              >
                Confirmar ahora
              </button>
            </div>
          )}

          {/* Tarjeta para completar RUT en cuentas nuevas creadas vía Google OAuth */}
          {requiereRut && (
            <form onSubmit={handleGuardarRutOAuth} className="be-card" style={{ borderColor: 'var(--be-primary)' }}>
              <span className="be-badge be-badge-info" style={{ marginBottom: '8px' }}>
                Paso final de cuenta Google
              </span>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.08rem', fontWeight: 700, color: 'var(--be-text)' }}>
                Registra tu RUT chileno para completar tu bóveda
              </h3>
              <p style={{ margin: '0 0 14px 0', fontSize: '0.86rem', color: 'var(--be-text-muted)' }}>
                Tu RUT permite vincular automáticamente cualquier invitación de albacea que otros usuarios hayan creado
                para ti.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="be-input"
                  style={{ flex: '1 1 200px' }}
                  placeholder="Ej: 12345678-5"
                  value={rutPendiente}
                  onChange={(e) => setRutPendiente(e.target.value)}
                  onBlur={() => {
                    if (rutPendiente.trim()) setRutPendiente(normalizarRut(rutPendiente));
                  }}
                  required
                />
                <button type="submit" className="be-btn be-btn-primary" disabled={guardandoRut}>
                  {guardandoRut ? 'Guardando...' : 'Guardar RUT'}
                </button>
              </div>
            </form>
          )}

          {/* AVISO IMPORTANTE: BÓVEDA YA LIBERADA / AUTORIZADA */}
          {alertasLiberadas.map((lib) => (
            <div
              key={`lib-${lib.origen || 'ALBACEA'}-${lib.id_solicitud}`}
              style={{
                background: 'linear-gradient(135deg, #4c1d95 0%, #7c2d12 100%)',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '22px 24px',
                marginBottom: '20px',
                boxShadow: '0 12px 28px rgba(76, 29, 149, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '6px' }}>
                <IonIcon icon={lockOpenOutline} style={{ fontSize: '1.2rem' }} />
                ESTADO DE BÓVEDA — APERTURA AUTORIZADA
              </div>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                Tu bóveda fue liberada para tus albaceas designados
              </h3>
              <p style={{ margin: '0 0 14px 0', fontSize: '0.88rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.92)' }}>
                Se autorizó la apertura asociada a{' '}
                <strong>
                  {lib.nombre_albacea || 'un solicitante'} ({lib.parentesco || 'Contacto'})
                </strong>
                . Tus albaceas validados ya tienen acceso a la guía de cobro y contenido liberado. Si te encuentras
                activo y esto fue un error, comunícate de inmediato con soporte para revertir el estado.
              </p>
              <button
                type="button"
                className="be-btn be-btn-block"
                onClick={() => {
                  const esFam = lib.origen === 'FAMILIAR';
                  setCasoSoporte({
                    idSolicitud: esFam ? null : lib.id_solicitud,
                    idReporte: esFam ? lib.id_solicitud : null,
                    label: esFam
                      ? `Reporte familiar #${lib.id_solicitud} (${lib.nombre_albacea})`
                      : `Solicitud de apertura #${lib.id_solicitud} (${lib.nombre_albacea})`,
                  });
                  setAbriendoSoporte(true);
                }}
                style={{ backgroundColor: '#ffffff', color: '#4c1d95' }}
              >
                <IonIcon icon={headsetOutline} />
                Apelar apertura / Reportar error a Soporte
              </button>
            </div>
          ))}

          {/* ALERTA CRÍTICA DE APERTURA EN CURSO (ALBACEAS + FAMILIARES EXTERNOS UNIFICADOS) */}
          {alertas.map((alerta) => (
            <div
              key={`${alerta.origen || 'ALBACEA'}-${alerta.id_solicitud}`}
              style={{
                background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '22px 24px',
                marginBottom: '20px',
                boxShadow: '0 12px 28px rgba(220, 38, 38, 0.28)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                  <IonIcon icon={warningOutline} style={{ fontSize: '1.2rem' }} />
                  ALERTA CRÍTICA — SOLICITUD DE APERTURA DETECTADA
                </div>
                <span
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                  }}
                >
                  {formatearTiempoRestante(alerta.horas_restantes)}
                </span>
              </div>

              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                {alerta.origen === 'FAMILIAR'
                  ? 'Un familiar externo solicitó abrir tu bóveda'
                  : 'Un albacea solicitó liberar tu bóveda'}
              </h3>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  fontSize: '0.88rem',
                  lineHeight: 1.55,
                }}
              >
                <div>
                  <strong>Solicitante:</strong> {alerta.nombre_albacea || 'Contacto registrado'} ({alerta.parentesco || 'Familiar'}) · RUT{' '}
                  {alerta.rut_albacea || 'No disponible'}
                </div>
                <div>
                  <strong>Origen:</strong>{' '}
                  {alerta.origen === 'FAMILIAR'
                    ? 'Reporte familiar externo desde el acceso público'
                    : 'Albacea designado en tu directorio'}
                </div>
                <div>
                  <strong>¿Sigues activo?</strong> Si presionas anular (o haces Check-in), desactivas de inmediato el
                  contador y notificamos al solicitante que tu bóveda sigue sellada.
                </div>
              </div>

              <button
                type="button"
                className="be-btn be-btn-block"
                disabled={cargandoCheckin}
                onClick={() => handleCancelarApertura(alerta)}
                style={{ backgroundColor: '#ffffff', color: '#b91c1c' }}
              >
                <IonIcon icon={handLeftOutline} />
                Anular solicitud de apertura y confirmar que estoy activo
              </button>
            </div>
          ))}

          {/* Onboarding consciente de bóveda O Tarjeta de Vigencia y Check-in */}
          {!bovedaActiva ? (
            <OnboardingBoveda
              nombreTitular={nombreTitular}
              correoUsuario={correoUsuario}
              correoVerificado={correoVerificado}
              cantAlbaceas={cantAlbaceas}
              cantPolizas={cantPolizas}
              cantInventario={cantInventario}
              cantMensajes={cantMensajes}
              frecuenciaDias={frecuenciaDias}
              plazoGraciaDias={plazoGraciaDias}
              activando={activandoBoveda}
              onActivar={handleActivarBoveda}
              onCorreoConfirmado={async () => {
                setCorreoVerificado(true);
                window.dispatchEvent(new Event('boveda-actualizada'));
                await cargarDatosDashboard();
              }}
              onNotificar={(msg) => {
                setToastMsg(msg);
                setShowToast(true);
              }}
            />
          ) : (
            <>
              <VaultStatusCard
                daysLeft={alertasLiberadas.length > 0 ? 0 : daysLeft}
                totalCycleDays={frecuenciaDias}
                status={
                  alertasLiberadas.length > 0
                    ? 'LIBERADA'
                    : alertas.length > 0
                    ? 'EN_REVISION'
                    : 'PROTEGIDA'
                }
                onCheckin={handleCheckin}
                loading={cargandoCheckin}
              />

              {/* Acceso directo al Kit de Emergencia Patrimonial (PDF con QR) */}
              <div
                className="be-card"
                style={{
                  padding: '14px 18px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  background: 'linear-gradient(135deg, var(--be-surface) 0%, var(--be-surface-alt) 100%)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 240px' }}>
                  <div className="be-icon-box be-icon-box-accent" style={{ width: '38px', height: '38px', fontSize: '1.15rem' }}>
                    <IonIcon icon={documentTextOutline} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--be-text)' }}>
                      Aviso Discreto de Bóveda / Kit QR (PDF)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--be-text-muted)' }}>
                      Hoja privada con código QR para que tu familia sepa dónde consultar, sin exponer datos sensibles.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="be-btn be-btn-outline"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                  disabled={descargandoKit}
                  onClick={handleDescargarKit}
                >
                  <IonIcon icon={downloadOutline} />
                  {descargandoKit ? 'Generando PDF...' : 'Descargar Kit PDF'}
                </button>
              </div>
            </>
          )}

          {/* Módulos del Baúl (visualmente subordinados mientras la activación sea la prioridad) */}
          {!bovedaActiva && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '12px',
                paddingTop: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--be-text-muted)',
                }}
              >
                Accesos rápidos para cargar tus primeros datos
              </span>
              <span style={{ fontSize: '0.77rem', color: 'var(--be-text-muted)' }}>
                Luego vuelve aquí para sellar y activar tu bóveda
              </span>
            </div>
          )}

          <div className={bovedaActiva ? 'be-grid-2' : 'be-grid-2 be-secondary-dimmed'}>
            {modulos.map((mod) => (
              <div
                key={mod.path}
                className="be-card be-card-interactive"
                style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => navigate(mod.path)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div className={mod.accent ? 'be-icon-box be-icon-box-accent' : 'be-icon-box'}>
                      <IonIcon icon={mod.icon} />
                    </div>
                    <span className={mod.badgeClass}>{mod.badge}</span>
                  </div>

                  <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--be-text-muted)' }}>
                    {mod.kicker}
                  </span>
                  <h3 style={{ margin: '3px 0 8px 0', fontSize: '1.12rem', fontWeight: 800, color: 'var(--be-text)' }}>
                    {mod.titulo}
                  </h3>
                  <p style={{ margin: '0 0 18px 0', fontSize: '0.86rem', color: 'var(--be-text-muted)', lineHeight: 1.5 }}>
                    {mod.descripcion}
                  </p>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--be-primary)' }}>
                  {mod.cta}
                  <IonIcon icon={arrowForwardOutline} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <SoporteModal
          isOpen={abriendoSoporte}
          onClose={() => setAbriendoSoporte(false)}
          categoriaInicial="Error en apertura de bóveda"
          idSolicitudAsociada={casoSoporte.idSolicitud || null}
          idReporteAsociado={casoSoporte.idReporte || null}
          referenciaLabel={casoSoporte.label}
          onEnviado={(msg) => {
            setToastMsg(msg);
            setShowToast(true);
          }}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={3800}
          color={toastMsg.includes('anulada') ? 'warning' : 'success'}
        />
      </IonContent>

      <MobileBottomNav />
    </IonPage>
  );
};

export default Dashboard;
