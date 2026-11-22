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
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';
import { VaultStatusCard } from '../components/VaultStatusCard';
import { MobileBottomNav } from '../components/MobileBottomNav';

import { mensajeError } from '../services/api';
import { completarRutUsuario, usuarioGuardado } from '../services/auth.service';
import { normalizarRut, rutValido } from '../utils/rut';
import { obtenerCheckin, renovarCheckin } from '../services/checkin.service';
import { listarAlertas, cancelarSolicitud } from '../services/solicitudes.service';
import { listarPolizas } from '../services/polizas.service';
import { getAlbaceas } from '../services/albaceas.service';
import { getMensajes } from '../services/mensajes.service';
import { listarInventario } from '../services/inventario.service';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [nombreTitular, setNombreTitular] = useState('Usuario');
  const [daysLeft, setDaysLeft] = useState(180);
  const [alertas, setAlertas] = useState<any[]>([]);
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
      const [dataCheckin, dataAlertas, dataPolizas, dataAlbaceas, dataMensajes, dataInventario] =
        await Promise.all([
          obtenerCheckin().catch(() => null),
          listarAlertas().catch(() => []),
          listarPolizas().catch(() => []),
          getAlbaceas().catch(() => []),
          getMensajes().catch(() => []),
          listarInventario().catch(() => []),
        ]);

      const alertasPendientes = (Array.isArray(dataAlertas) ? dataAlertas : []).filter(
        (a: any) => a.estado_solicitud === 'PENDIENTE'
      );

      setAlertas(alertasPendientes);
      setCantPolizas(Array.isArray(dataPolizas) ? dataPolizas.length : 0);
      setCantAlbaceas(Array.isArray(dataAlbaceas) ? dataAlbaceas.length : 0);
      setCantMensajes(Array.isArray(dataMensajes) ? dataMensajes.length : 0);
      setCantInventario(Array.isArray(dataInventario) ? dataInventario.length : 0);

      if (alertasPendientes.length > 0) {
        setDaysLeft(3);
      } else if (dataCheckin && typeof dataCheckin.dias_desde_ultimo === 'number') {
        setDaysLeft(Math.max(0, 180 - dataCheckin.dias_desde_ultimo));
      } else {
        setDaysLeft(180);
      }
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', mensajeError(error));
    }
  };

  const handleCheckin = async () => {
    try {
      setCargandoCheckin(true);
      await renovarCheckin();
      setDaysLeft(180);
      setToastMsg('Presencia confirmada. Tu bóveda queda sellada por un nuevo periodo de 180 días.');
      setShowToast(true);
      await cargarDatosDashboard();
    } catch (error) {
      setToastMsg(mensajeError(error));
      setShowToast(true);
    } finally {
      setCargandoCheckin(false);
    }
  };

  const handleCancelarApertura = async (idSolicitud: number) => {
    try {
      await cancelarSolicitud(idSolicitud);
      setToastMsg('Solicitud de apertura anulada. Tu bóveda continúa bajo tu custodia.');
      setShowToast(true);
      await cargarDatosDashboard();
    } catch (error) {
      setToastMsg(mensajeError(error));
      setShowToast(true);
    }
  };

  const primerNombre = nombreTitular.split(' ')[0];

  const modulos = [
    {
      path: '/polizas',
      kicker: 'PATRIMONIO Y COBERTURAS',
      titulo: 'Pólizas de Seguro',
      descripcion:
        'Centraliza seguros de vida, salud y desgravamen para que tus beneficiarios puedan cobrarlos sin trabas.',
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
        'Elige hasta 3 personas de confianza (incluso si aún no crean cuenta) para custodiar tu bóveda.',
      badge: `${cantAlbaceas} / 3 designados`,
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
      kicker: 'CUSTODIA AES-256',
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
          {/* Saludo editorial */}
          <div className="be-hero-banner">
            <h2>Hola, {primerNombre}</h2>
            <p>
              Tu bóveda personal resguarda tu patrimonio y voluntades con cifrado de alto nivel. Revisa tu vigencia o
              actualiza tus registros cuando lo necesites.
            </p>
          </div>

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

          {/* ALERTA CRÍTICA DE APERTURA EN CURSO */}
          {alertas.map((alerta) => (
            <div
              key={alerta.id_solicitud}
              style={{
                background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
                color: '#ffffff',
                borderRadius: '16px',
                padding: '22px 24px',
                marginBottom: '20px',
                boxShadow: '0 12px 28px rgba(220, 38, 38, 0.28)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em', marginBottom: '6px' }}>
                <IonIcon icon={warningOutline} style={{ fontSize: '1.2rem' }} />
                ALERTA CRÍTICA — PROCESO DE APERTURA DETECTADO
              </div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                Un albacea solicitó liberar tu bóveda
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
                  <strong>Albacea solicitante:</strong> {alerta.nombre_albacea || 'Contacto registrado'} (RUT{' '}
                  {alerta.rut_albacea || 'No disponible'})
                </div>
                <div>
                  <strong>Estado:</strong> Pendiente en periodo de gracia — puedes anular esta solicitud de inmediato si
                  fue un error o prueba.
                </div>
              </div>

              <button
                type="button"
                className="be-btn be-btn-block"
                disabled={cargandoCheckin}
                onClick={() => handleCancelarApertura(alerta.id_solicitud)}
                style={{ backgroundColor: '#ffffff', color: '#b91c1c' }}
              >
                <IonIcon icon={handLeftOutline} />
                Anular solicitud de apertura y proteger bóveda
              </button>
            </div>
          ))}

          {/* Tarjeta de Vigencia y Check-in */}
          <VaultStatusCard
            daysLeft={daysLeft}
            status={alertas.length > 0 ? 'EN_REVISION' : 'PROTEGIDA'}
            onCheckin={handleCheckin}
            loading={cargandoCheckin}
          />

          {/* Módulos del Baúl (2 columnas en tablet/PC, 1 columna en móvil) */}
          <div className="be-grid-2">
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

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={3500}
          color={toastMsg.includes('anulada') ? 'warning' : 'success'}
        />
      </IonContent>

      <MobileBottomNav />
    </IonPage>
  );
};

export default Dashboard;
