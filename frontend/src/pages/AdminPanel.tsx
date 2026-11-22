import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon,
  IonToast,
  IonAlert,
  IonSpinner,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  peopleOutline,
  shieldCheckmarkOutline,
  folderOpenOutline,
  mailOutline,
  documentAttachOutline,
  openOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  pulseOutline,
  trashOutline,
  banOutline,
  playOutline,
  documentOutline,
  searchOutline,
  shieldOutline,
  createOutline,
  closeOutline,
  headsetOutline,
  warningOutline,
  arrowForwardOutline,
  refreshOutline,
} from 'ionicons/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { VaultLoader } from '../components/VaultLoader';
import { mensajeError } from '../services/api';
import { usuarioGuardado } from '../services/auth.service';
import { normalizarRut } from '../utils/rut';
import {
  obtenerResumenAdmin,
  listarUsuariosAdmin,
  actualizarUsuarioAdmin,
  eliminarUsuarioAdmin,
  listarAuditoriaAdmin,
  listarSolicitudesAdmin,
  actualizarEstadoSolicitudAdmin,
  listarReportesFamiliaresAdmin,
  actualizarEstadoReporteFamiliarAdmin,
  abrirCertificadoAdmin,
  ejecutarVigilanciaAdmin,
  listarTicketsAdmin,
  gestionarTicketAdmin,
  ResumenAdmin,
  UsuarioAdmin,
  EventoAuditoria,
  SolicitudAdmin,
  ReporteFamiliarAdmin,
  ResultadoVigilancia,
  TicketSoporteAdmin,
} from '../services/admin.service';
import { dinero, fechaHora } from '../services/utils/formato';

type TabAdmin = 'resumen' | 'solicitudes' | 'reportes' | 'tickets' | 'usuarios' | 'auditoria';
const TABS_VALIDAS: TabAdmin[] = ['resumen', 'solicitudes', 'reportes', 'tickets', 'usuarios', 'auditoria'];

interface ConfirmacionAccion {
  titulo: string;
  mensaje: string;
  textoBoton: string;
  onConfirmar: () => Promise<void>;
}

export const AdminPanel: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const adminActualId = usuarioGuardado()?.id || 0;

  const [tab, setTab] = useState<TabAdmin>('resumen');
  const [cargando, setCargando] = useState(true);
  const [resumen, setResumen] = useState<ResumenAdmin | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [auditoria, setAuditoria] = useState<EventoAuditoria[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudAdmin[]>([]);
  const [reportes, setReportes] = useState<ReporteFamiliarAdmin[]>([]);
  const [tickets, setTickets] = useState<TicketSoporteAdmin[]>([]);
  const [portalRC, setPortalRC] = useState(
    'https://www.registrocivil.cl/OficinaInternet/verificacion/verificacioncertificado.srcei'
  );
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [ejecutandoMotor, setEjecutandoMotor] = useState(false);
  const [ultimoCiclo, setUltimoCiclo] = useState<ResultadoVigilancia | null>(null);
  const [casoDestacadoId, setCasoDestacadoId] = useState<string | null>(null);

  // Modal de respuesta de ticket
  const [ticketGestionando, setTicketGestionando] = useState<TicketSoporteAdmin | null>(null);
  const [ticketEstadoEdit, setTicketEstadoEdit] = useState<'ABIERTO' | 'EN_PROCESO' | 'RESUELTO' | 'CERRADO'>('RESUELTO');
  const [ticketRespuestaEdit, setTicketRespuestaEdit] = useState('');
  const [guardandoTicket, setGuardandoTicket] = useState(false);

  // Confirmaciones de acciones críticas
  const [usuarioEliminar, setUsuarioEliminar] = useState<UsuarioAdmin | null>(null);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionAccion | null>(null);

  // Modal de edición de usuario
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioAdmin | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCorreo, setEditCorreo] = useState('');
  const [editRut, setEditRut] = useState('');
  const [editRol, setEditRol] = useState<'TITULAR' | 'ADMIN'>('TITULAR');
  const [editFrecuencia, setEditFrecuencia] = useState(180);
  const [editGracia, setEditGracia] = useState(7);
  const [editCorreoAlt, setEditCorreoAlt] = useState('');
  const [editNombreConf, setEditNombreConf] = useState('');
  const [editCorreoConf, setEditCorreoConf] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  useEffect(() => {
    const paramTab = new URLSearchParams(location.search).get('tab') as TabAdmin | null;
    if (paramTab && TABS_VALIDAS.includes(paramTab)) {
      setTab(paramTab);
    }
  }, [location.search]);

  const cambiarTab = (nuevoTab: TabAdmin) => {
    setTab(nuevoTab);
    navigate(`/admin?tab=${nuevoTab}`, { replace: true });
  };

  const cargarTodo = async () => {
    try {
      setCargando(true);
      const [r, u, a, s, rep, tks] = await Promise.all([
        obtenerResumenAdmin(),
        listarUsuariosAdmin(),
        listarAuditoriaAdmin(),
        listarSolicitudesAdmin(),
        listarReportesFamiliaresAdmin().catch(() => []),
        listarTicketsAdmin().catch(() => []),
      ]);
      setResumen(r);
      setUsuarios(u);
      setAuditoria(a);
      setSolicitudes(s.solicitudes);
      setPortalRC(s.portalRegistroCivil);
      setReportes(rep);
      setTickets(tks);
    } catch (error) {
      setToastColor('danger');
      setToastMsg(mensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  useIonViewWillEnter(() => {
    cargarTodo();
  });

  const handleEjecutarMotor = async () => {
    try {
      setEjecutandoMotor(true);
      const res = await ejecutarVigilanciaAdmin();
      setUltimoCiclo(res);
      setToastColor('success');
      setToastMsg('Motor de vigilancia y recordatorios ejecutado correctamente.');
      await cargarTodo();
    } catch (error) {
      setToastColor('danger');
      setToastMsg(mensajeError(error));
    } finally {
      setEjecutandoMotor(false);
    }
  };

  const pedirConfirmacionSolicitud = (sol: SolicitudAdmin, estado: 'APROBADA' | 'CANCELADA') => {
    const esAprobar = estado === 'APROBADA';
    setConfirmacion({
      titulo: esAprobar ? '¿Autorizar apertura de bóveda?' : '¿Cancelar solicitud de apertura?',
      mensaje: esAprobar
        ? `Al aprobar la solicitud #${sol.id_solicitud}, la bóveda de ${sol.nombre_titular} quedará liberada globalmente para TODOS sus albaceas validados y se enviará aviso por correo al titular.`
        : `¿Confirmas cancelar la solicitud #${sol.id_solicitud} sobre la bóveda de ${sol.nombre_titular}?`,
      textoBoton: esAprobar ? 'Sí, autorizar apertura' : 'Sí, cancelar solicitud',
      onConfirmar: async () => {
        try {
          setProcesandoId(sol.id_solicitud);
          const res = await actualizarEstadoSolicitudAdmin(sol.id_solicitud, estado);
          setToastColor(esAprobar ? 'success' : 'warning');
          setToastMsg(res.mensaje || 'Estado actualizado.');
          await cargarTodo();
        } catch (error) {
          setToastColor('danger');
          setToastMsg(mensajeError(error));
        } finally {
          setProcesandoId(null);
        }
      },
    });
  };

  const pedirConfirmacionReporte = (rep: ReporteFamiliarAdmin, estado: 'VALIDADO' | 'RECHAZADO') => {
    const esValidar = estado === 'VALIDADO';
    setConfirmacion({
      titulo: esValidar ? '¿Validar reporte y liberar bóveda?' : '¿Rechazar reporte familiar?',
      mensaje: esValidar
        ? `Al validar el reporte #${rep.id_reporte}, la bóveda de ${rep.nombre_titular || rep.rut_titular_consultado} quedará liberada globalmente para todos sus albaceas validados y notificaremos al titular y al familiar.`
        : `¿Confirmas rechazar el reporte #${rep.id_reporte} enviado por ${rep.nombre_familiar}? Si la bóveda estaba liberada por este reporte, volverá a estar sellada.`,
      textoBoton: esValidar ? 'Sí, validar y liberar' : 'Sí, rechazar reporte',
      onConfirmar: async () => {
        try {
          setProcesandoId(rep.id_reporte);
          const res = await actualizarEstadoReporteFamiliarAdmin(rep.id_reporte, estado);
          setToastColor(esValidar ? 'success' : 'warning');
          setToastMsg(res.mensaje || 'Estado de reporte actualizado.');
          await cargarTodo();
        } catch (error) {
          setToastColor('danger');
          setToastMsg(mensajeError(error));
        } finally {
          setProcesandoId(null);
        }
      },
    });
  };

  const handleVerCertificado = async (tipo: 'solicitud' | 'reporte', id: number) => {
    try {
      await abrirCertificadoAdmin(tipo, id);
    } catch (error) {
      setToastColor('danger');
      setToastMsg(mensajeError(error));
    }
  };

  const abrirModalEdicion = (u: UsuarioAdmin) => {
    setUsuarioEditando(u);
    setEditNombre(u.nombre_usuario);
    setEditCorreo(u.correo_usuario);
    setEditRut(u.rut || '');
    setEditRol(u.rol === 'ADMIN' ? 'ADMIN' : 'TITULAR');
    setEditFrecuencia(Number(u.frecuencia_checkin_dias) || 180);
    setEditGracia(Number(u.plazo_gracia_dias) || 7);
    setEditCorreoAlt(u.correo_alternativo || '');
    setEditNombreConf(u.nombre_contacto_confianza || '');
    setEditCorreoConf(u.correo_contacto_confianza || '');
  };

  const handleGuardarEdicionUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;
    const esMismo = usuarioEditando.id_usuario === adminActualId;

    try {
      setGuardandoEdicion(true);
      const payload: Record<string, any> = {
        nombre_usuario: editNombre.trim(),
        correo_usuario: editCorreo.trim().toLowerCase(),
        rut: editRut.trim() ? normalizarRut(editRut) : '',
        frecuencia_checkin_dias: editFrecuencia,
        plazo_gracia_dias: editGracia,
        correo_alternativo: editCorreoAlt.trim().toLowerCase(),
        nombre_contacto_confianza: editNombreConf.trim(),
        correo_contacto_confianza: editCorreoConf.trim().toLowerCase(),
      };
      if (!esMismo) {
        payload.rol = editRol;
      }

      const res = await actualizarUsuarioAdmin(usuarioEditando.id_usuario, payload);
      setToastColor('success');
      setToastMsg(res.mensaje || 'Usuario actualizado correctamente.');
      setUsuarioEditando(null);
      await cargarTodo();
    } catch (error) {
      setToastColor('danger');
      setToastMsg(mensajeError(error));
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleActualizarUsuarioRapido = async (
    u: UsuarioAdmin,
    cambios: { rol?: 'TITULAR' | 'ADMIN'; activo?: boolean }
  ) => {
    try {
      setProcesandoId(u.id_usuario);
      const res = await actualizarUsuarioAdmin(u.id_usuario, cambios);
      setToastColor('success');
      setToastMsg(res.mensaje || 'Usuario actualizado.');
      await cargarTodo();
    } catch (error) {
      setToastColor('danger');
      setToastMsg(mensajeError(error));
    } finally {
      setProcesandoId(null);
    }
  };

  const confirmarEliminarUsuario = async () => {
    if (!usuarioEliminar) return;
    try {
      setProcesandoId(usuarioEliminar.id_usuario);
      const res = await eliminarUsuarioAdmin(usuarioEliminar.id_usuario);
      setToastColor('warning');
      setToastMsg(res.mensaje || 'Usuario eliminado.');
      setUsuarioEliminar(null);
      await cargarTodo();
    } catch (error) {
      setToastColor('danger');
      setToastMsg(mensajeError(error));
    } finally {
      setProcesandoId(null);
    }
  };

  const abrirModalTicket = (tk: TicketSoporteAdmin) => {
    setTicketGestionando(tk);
    setTicketEstadoEdit(tk.estado_ticket === 'ABIERTO' ? 'RESUELTO' : tk.estado_ticket);
    setTicketRespuestaEdit(tk.respuesta_admin || '');
  };

  const handleGuardarTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketGestionando) return;
    try {
      setGuardandoTicket(true);
      const res = await gestionarTicketAdmin(ticketGestionando.id_ticket, {
        estado_ticket: ticketEstadoEdit,
        respuesta_admin: ticketRespuestaEdit.trim(),
      });
      setToastColor('success');
      setToastMsg(res.mensaje || 'Ticket actualizado y usuario notificado.');
      setTicketGestionando(null);
      await cargarTodo();
    } catch (error) {
      setToastColor('danger');
      setToastMsg(mensajeError(error));
    } finally {
      setGuardandoTicket(false);
    }
  };

  const pedirConfirmacionRevertirDesdeTicket = (tk: TicketSoporteAdmin) => {
    const refTexto = tk.id_solicitud_asociada
      ? `la solicitud #${tk.id_solicitud_asociada}`
      : `el reporte familiar #${tk.id_reporte_asociado}`;
    setConfirmacion({
      titulo: `¿Revertir apertura (${tk.codigo_ticket})?`,
      mensaje: `Esta acción anulará ${refTexto}, volverá a sellar la bóveda de ${tk.nombre_usuario}, renovará su Check-in, marcará el ticket ${tk.codigo_ticket} como RESUELTO y avisará por correo al titular.`,
      textoBoton: 'Sí, revertir y resolver',
      onConfirmar: async () => {
        try {
          setProcesandoId(tk.id_ticket);
          const res = await gestionarTicketAdmin(tk.id_ticket, { accion_directa: 'REVERTIR_APERTURA' });
          setToastColor('success');
          setToastMsg(res.mensaje || 'Apertura revertida y ticket resuelto.');
          await cargarTodo();
        } catch (error) {
          setToastColor('danger');
          setToastMsg(mensajeError(error));
        } finally {
          setProcesandoId(null);
        }
      },
    });
  };

  const ticketsAbiertosCount = tickets.filter((t) => ['ABIERTO', 'EN_PROCESO'].includes(t.estado_ticket)).length;

  const formatearGracia = (horas?: number) => {
    if (horas === undefined || horas === null) return '';
    if (horas <= 0) return 'Plazo de gracia vencido';
    const d = Math.floor(horas / 24);
    const h = horas % 24;
    return d > 0 ? `Quedan ${d}d ${h}h de plazo de gracia` : `Quedan ${h}h de plazo de gracia`;
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const q = busquedaUsuario.trim().toLowerCase();
    if (!q) return true;
    return (
      u.nombre_usuario.toLowerCase().includes(q) ||
      u.correo_usuario.toLowerCase().includes(q) ||
      (u.rut || '').toLowerCase().includes(q)
    );
  });

  return (
    <IonPage id="main-content">
      <HeaderBar title="Consola de Administración" showBack={false} />

      <IonContent className="ion-padding">
        <div className="be-container">
          <div className="be-hero-banner">
            <h2>Centro de Control y Auditoría</h2>
            <p>
              Supervisión global de Baúl Eterno: administración de cuentas, control del motor automático de alertas,
              revisión de solicitudes de apertura y trazabilidad completa.
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <IonSegment
              value={tab}
              scrollable
              style={{ '--background': 'var(--be-surface-alt)' } as React.CSSProperties}
              onIonChange={(e) => cambiarTab(e.detail.value as TabAdmin)}
            >
              <IonSegmentButton value="resumen">
                <IonLabel style={{ fontSize: '0.8rem', fontWeight: 700 }}>Resumen</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="solicitudes">
                <IonLabel style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  Solicitudes ({solicitudes.length})
                </IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="reportes">
                <IonLabel style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  Familiares ({reportes.length})
                </IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="tickets">
                <IonLabel style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  Soporte ({ticketsAbiertosCount > 0 ? `${ticketsAbiertosCount} ab.` : tickets.length})
                </IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="usuarios">
                <IonLabel style={{ fontSize: '0.8rem', fontWeight: 700 }}>Usuarios ({usuarios.length})</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="auditoria">
                <IonLabel style={{ fontSize: '0.8rem', fontWeight: 700 }}>Auditoría</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          {cargando ? (
            <VaultLoader texto="Cargando consola administrativa..." />
          ) : (
            <>
              {/* 1. RESUMEN KPIs + MOTOR DE VIGILANCIA */}
              {tab === 'resumen' && resumen && (
                <>
                  <div className="be-grid-4" style={{ marginBottom: '18px' }}>
                    <div className="be-card" style={{ marginBottom: 0, padding: '18px' }}>
                      <div className="be-icon-box" style={{ marginBottom: '10px' }}>
                        <IonIcon icon={peopleOutline} />
                      </div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--be-text)' }}>
                        {resumen.usuarios.total}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--be-text-muted)', fontWeight: 600 }}>
                        Usuarios ({resumen.usuarios.admins} admin · {resumen.usuarios.suspendidos || 0} susp.)
                      </div>
                    </div>

                    <div className="be-card" style={{ marginBottom: 0, padding: '18px' }}>
                      <div className="be-icon-box be-icon-box-accent" style={{ marginBottom: '10px' }}>
                        <IonIcon icon={shieldCheckmarkOutline} />
                      </div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--be-text)' }}>
                        {resumen.polizas.total}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--be-text-muted)', fontWeight: 600 }}>
                        Pólizas ({dinero(resumen.polizas.monto_total)})
                      </div>
                    </div>

                    <div className="be-card" style={{ marginBottom: 0, padding: '18px' }}>
                      <div className="be-icon-box" style={{ marginBottom: '10px' }}>
                        <IonIcon icon={folderOpenOutline} />
                      </div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--be-text)' }}>
                        {resumen.inventario.total}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--be-text-muted)', fontWeight: 600 }}>
                        Activos en inventario
                      </div>
                    </div>

                    <div className="be-card" style={{ marginBottom: 0, padding: '18px' }}>
                      <div className="be-icon-box be-icon-box-accent" style={{ marginBottom: '10px' }}>
                        <IonIcon icon={mailOutline} />
                      </div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--be-text)' }}>
                        {resumen.mensajes.total}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--be-text-muted)', fontWeight: 600 }}>
                        Mensajes póstumos cifrados
                      </div>
                    </div>
                  </div>

                  <div className="be-grid-2" style={{ marginBottom: '18px' }}>
                    <div className="be-card" style={{ marginBottom: 0 }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700 }}>
                        Estado de Albaceas ({resumen.albaceas.total})
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <span className="be-badge be-badge-success">{resumen.albaceas.validados} Validados</span>
                        <span className="be-badge be-badge-warning">{resumen.albaceas.pendientes} Pendientes</span>
                        <span className="be-badge be-badge-info">{resumen.albaceas.invitados} Invitados sin cuenta</span>
                      </div>
                    </div>

                    <div className="be-card" style={{ marginBottom: 0 }}>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700 }}>
                        Servicios y Notificaciones
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                        <span className={resumen.servicios.smtp_activo ? 'be-badge be-badge-success' : 'be-badge be-badge-warning'}>
                          Correo SMTP: {resumen.servicios.smtp_activo ? 'Activo (Gmail/SMTP)' : 'Modo Consola'}
                        </span>
                        <span
                          className={(resumen.tickets?.abiertos || 0) > 0 ? 'be-badge be-badge-danger' : 'be-badge be-badge-success'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => cambiarTab('tickets')}
                        >
                          Tickets soporte abiertos: {resumen.tickets?.abiertos || 0}
                        </span>
                        <span className="be-badge be-badge-neutral">{resumen.auditoria.total} eventos auditados</span>
                      </div>
                    </div>
                  </div>

                  {/* Motor automático de vigilancia y correos */}
                  <div className="be-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: '1 1 280px' }}>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700 }}>
                          Motor Automático de Vigilancia, Check-in y Correos
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--be-text-muted)', lineHeight: 1.5 }}>
                          Se ejecuta automáticamente cada 30 minutos en segundo plano: envía recordatorios de Check-in
                          (15d / 7d / 48h), reintentos en plazo de gracia, avisos al contacto de confianza y dispara la
                          liberación automática cuando vence el plazo sin respuesta del titular.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="be-btn be-btn-primary"
                        disabled={ejecutandoMotor}
                        onClick={handleEjecutarMotor}
                      >
                        {ejecutandoMotor ? (
                          <IonSpinner name="crescent" color="light" style={{ width: '16px', height: '16px' }} />
                        ) : (
                          <>
                            <IonIcon icon={playOutline} /> Ejecutar revisión ahora
                          </>
                        )}
                      </button>
                    </div>

                    {ultimoCiclo && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--be-border)' }}>
                        <span className="be-badge be-badge-info">
                          Recordatorios Check-in: {ultimoCiclo.recordatorios_checkin}
                        </span>
                        <span className="be-badge be-badge-warning">
                          Reintentos gracia: {ultimoCiclo.reintentos_enviados}
                        </span>
                        <span className="be-badge be-badge-danger">
                          Avisos 48h confianza: {ultimoCiclo.avisos_48h_enviados}
                        </span>
                        <span className="be-badge be-badge-success">
                          Aprobadas/validadas: {ultimoCiclo.solicitudes_aprobadas + ultimoCiclo.reportes_validados}
                        </span>
                        <span className="be-badge be-badge-neutral">
                          Triggers inactividad: {ultimoCiclo.triggers_vencimiento_checkin}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 2. SOLICITUDES DE APERTURA (ALBACEAS) */}
              {tab === 'solicitudes' && (
                <div>
                  {solicitudes.length === 0 ? (
                    <div className="be-empty-state">
                      <IonIcon icon={documentAttachOutline} style={{ fontSize: '2.2rem', marginBottom: '8px', opacity: 0.55 }} />
                      <p style={{ margin: 0 }}>No existen solicitudes de apertura de albaceas registradas.</p>
                    </div>
                  ) : (
                    solicitudes.map((sol) => (
                      <div
                        key={sol.id_solicitud}
                        className="be-card"
                        style={{
                          padding: '18px 20px',
                          borderColor:
                            casoDestacadoId === `sol-${sol.id_solicitud}`
                              ? 'var(--be-primary)'
                              : (sol.tickets_abiertos || 0) > 0
                              ? 'var(--be-danger)'
                              : undefined,
                          boxShadow:
                            casoDestacadoId === `sol-${sol.id_solicitud}`
                              ? '0 0 0 2px var(--be-primary)'
                              : undefined,
                        }}
                      >
                        {(sol.tickets_abiertos || 0) > 0 && (
                          <div
                            className="be-badge-danger"
                            style={{
                              padding: '10px 12px',
                              borderRadius: '10px',
                              marginBottom: '12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '8px',
                              fontSize: '0.82rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 220px' }}>
                              <IonIcon icon={warningOutline} style={{ fontSize: '1.15rem', flexShrink: 0 }} />
                              <span>
                                <strong>Discrepancia / Apelación activa ({sol.ultimo_ticket_codigo}):</strong>{' '}
                                {sol.ultimo_ticket_mensaje?.slice(0, 120)}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="be-btn be-btn-outline"
                              style={{ padding: '5px 10px', fontSize: '0.76rem', backgroundColor: 'var(--be-surface)' }}
                              onClick={() => cambiarTab('tickets')}
                            >
                              Atender ticket
                            </button>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700 }}>
                              Solicitud #{sol.id_solicitud} · Titular: {sol.nombre_titular} ({sol.rut_titular})
                            </h4>
                            <p style={{ margin: '0 0 6px 0', fontSize: '0.83rem', color: 'var(--be-text-muted)' }}>
                              Albacea: <strong>{sol.nombre_albacea}</strong> ({sol.rut_albacea}, {sol.parentesco}) ·{' '}
                              {fechaHora(sol.fecha_solicitud)}
                            </p>
                            {sol.estado_solicitud === 'PENDIENTE' && (
                              <span className="be-badge be-badge-info">
                                {formatearGracia(sol.horas_restantes)} · El titular ya fue notificado
                              </span>
                            )}
                          </div>

                          <span
                            className={
                              sol.estado_solicitud === 'APROBADA'
                                ? 'be-badge be-badge-success'
                                : sol.estado_solicitud === 'CANCELADA'
                                ? 'be-badge be-badge-neutral'
                                : 'be-badge be-badge-warning'
                            }
                          >
                            {sol.estado_solicitud}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {sol.certificado_defuncion !== 'TRIGGER_INACTIVIDAD' && (
                              <button
                                type="button"
                                className="be-btn be-btn-outline"
                                style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                                onClick={() => handleVerCertificado('solicitud', sol.id_solicitud)}
                              >
                                <IonIcon icon={documentOutline} /> Ver archivo adjunto
                              </button>
                            )}
                            <a
                              href={portalRC}
                              target="_blank"
                              rel="noreferrer"
                              className="be-btn be-btn-outline"
                              style={{ padding: '8px 12px', fontSize: '0.8rem', textDecoration: 'none' }}
                            >
                              <IonIcon icon={openOutline} /> Registro Civil (opcional)
                            </a>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="be-btn be-btn-primary"
                              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                              disabled={procesandoId === sol.id_solicitud || sol.estado_solicitud === 'APROBADA'}
                              onClick={() => pedirConfirmacionSolicitud(sol, 'APROBADA')}
                            >
                              <IonIcon icon={checkmarkCircleOutline} /> Aprobar ahora
                            </button>
                            <button
                              type="button"
                              className="be-btn be-btn-danger"
                              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                              disabled={procesandoId === sol.id_solicitud || sol.estado_solicitud === 'CANCELADA'}
                              onClick={() => pedirConfirmacionSolicitud(sol, 'CANCELADA')}
                            >
                              <IonIcon icon={closeCircleOutline} /> Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 3. REPORTES FAMILIARES EXTERNOS */}
              {tab === 'reportes' && (
                <div>
                  {reportes.length === 0 ? (
                    <div className="be-empty-state">
                      <p style={{ margin: 0 }}>No existen reportes de familiares externos registrados.</p>
                    </div>
                  ) : (
                    reportes.map((rep) => (
                      <div
                        key={rep.id_reporte}
                        className="be-card"
                        style={{
                          padding: '18px 20px',
                          borderColor:
                            casoDestacadoId === `rep-${rep.id_reporte}`
                              ? 'var(--be-primary)'
                              : (rep.tickets_abiertos || 0) > 0
                              ? 'var(--be-danger)'
                              : undefined,
                          boxShadow:
                            casoDestacadoId === `rep-${rep.id_reporte}`
                              ? '0 0 0 2px var(--be-primary)'
                              : undefined,
                        }}
                      >
                        {(rep.tickets_abiertos || 0) > 0 && (
                          <div
                            className="be-badge-danger"
                            style={{
                              padding: '10px 12px',
                              borderRadius: '10px',
                              marginBottom: '12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '8px',
                              fontSize: '0.82rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 220px' }}>
                              <IonIcon icon={warningOutline} style={{ fontSize: '1.15rem', flexShrink: 0 }} />
                              <span>
                                <strong>Discrepancia / Apelación activa ({rep.ultimo_ticket_codigo}):</strong>{' '}
                                {rep.ultimo_ticket_mensaje?.slice(0, 120)}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="be-btn be-btn-outline"
                              style={{ padding: '5px 10px', fontSize: '0.76rem', backgroundColor: 'var(--be-surface)' }}
                              onClick={() => cambiarTab('tickets')}
                            >
                              Atender ticket
                            </button>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700 }}>
                              Reporte #{rep.id_reporte} · Titular: {rep.nombre_titular || 'Registrado'} ({rep.rut_titular_consultado})
                            </h4>
                            <p style={{ margin: '0 0 6px 0', fontSize: '0.83rem', color: 'var(--be-text-muted)' }}>
                              Familiar: <strong>{rep.nombre_familiar}</strong> ({rep.rut_familiar}, {rep.parentesco}) ·{' '}
                              {rep.correo_familiar} · {fechaHora(rep.fecha_reporte)}
                            </p>
                            {['RECIBIDO', 'EN_REVISION'].includes(rep.estado_reporte) && (
                              <span className="be-badge be-badge-info" style={{ marginBottom: '6px' }}>
                                {formatearGracia(rep.horas_restantes)} · Alerta activa en Dashboard y correo del titular
                              </span>
                            )}
                            {rep.folio_extraido && (
                              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--be-primary)', fontWeight: 600 }}>
                                Folio detectado del certificado: <code>{rep.folio_extraido}</code>
                              </p>
                            )}
                          </div>

                          <span
                            className={
                              rep.estado_reporte === 'VALIDADO'
                                ? 'be-badge be-badge-success'
                                : rep.estado_reporte === 'RECHAZADO'
                                ? 'be-badge be-badge-danger'
                                : rep.estado_reporte === 'CANCELADO_TITULAR'
                                ? 'be-badge be-badge-neutral'
                                : 'be-badge be-badge-warning'
                            }
                          >
                            {rep.estado_reporte === 'CANCELADO_TITULAR'
                              ? 'ANULADO POR TITULAR'
                              : rep.estado_reporte}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="be-btn be-btn-outline"
                              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                              onClick={() => handleVerCertificado('reporte', rep.id_reporte)}
                            >
                              <IonIcon icon={documentOutline} /> Ver certificado adjunto
                            </button>
                            <a
                              href={portalRC}
                              target="_blank"
                              rel="noreferrer"
                              className="be-btn be-btn-outline"
                              style={{ padding: '8px 12px', fontSize: '0.8rem', textDecoration: 'none' }}
                            >
                              <IonIcon icon={openOutline} /> Registro Civil (opcional)
                            </a>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="be-btn be-btn-primary"
                              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                              disabled={procesandoId === rep.id_reporte || rep.estado_reporte === 'VALIDADO'}
                              onClick={() => pedirConfirmacionReporte(rep, 'VALIDADO')}
                            >
                              <IonIcon icon={checkmarkCircleOutline} /> Validar
                            </button>
                            <button
                              type="button"
                              className="be-btn be-btn-danger"
                              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                              disabled={procesandoId === rep.id_reporte || rep.estado_reporte === 'RECHAZADO'}
                              onClick={() => pedirConfirmacionReporte(rep, 'RECHAZADO')}
                            >
                              <IonIcon icon={closeCircleOutline} /> Rechazar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 3b. TICKETS DE SOPORTE Y APELACIONES */}
              {tab === 'tickets' && (
                <div>
                  {tickets.length === 0 ? (
                    <div className="be-empty-state">
                      <IonIcon icon={headsetOutline} style={{ fontSize: '2.2rem', marginBottom: '8px', opacity: 0.55 }} />
                      <p style={{ margin: 0 }}>No hay tickets de soporte registrados todavía.</p>
                    </div>
                  ) : (
                    tickets.map((tk) => {
                      const tieneCasoApertura = Boolean(tk.id_solicitud_asociada || tk.id_reporte_asociado);
                      const casoAunAbiertoOAprobado =
                        tk.estado_solicitud_asociada === 'APROBADA' ||
                        tk.estado_solicitud_asociada === 'PENDIENTE' ||
                        tk.estado_reporte_asociado === 'VALIDADO' ||
                        tk.estado_reporte_asociado === 'RECIBIDO' ||
                        tk.estado_reporte_asociado === 'EN_REVISION';

                      return (
                        <div
                          key={tk.id_ticket}
                          className="be-card"
                          style={{
                            padding: '18px 20px',
                            borderLeft:
                              tk.estado_ticket === 'ABIERTO'
                                ? '4px solid var(--be-danger)'
                                : tk.estado_ticket === 'EN_PROCESO'
                                ? '4px solid var(--be-warning)'
                                : '4px solid var(--be-success)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                            <div>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--be-text)' }}>
                                {tk.codigo_ticket} · {tk.categoria}
                              </h4>
                              <p style={{ margin: '0 0 4px 0', fontSize: '0.82rem', color: 'var(--be-text-muted)' }}>
                                Usuario: <strong>{tk.nombre_usuario}</strong> ({tk.correo_usuario} · RUT {tk.rut || 'Sin RUT'}) ·{' '}
                                {fechaHora(tk.fecha_creacion)}
                              </p>
                              {tieneCasoApertura && (
                                <span className="be-badge be-badge-warning">
                                  {tk.id_solicitud_asociada
                                    ? `Vinculado a Solicitud #${tk.id_solicitud_asociada} (${tk.estado_solicitud_asociada || '—'})`
                                    : `Vinculado a Reporte familiar #${tk.id_reporte_asociado} (${tk.estado_reporte_asociado || '—'})`}
                                </span>
                              )}
                            </div>

                            <span
                              className={
                                tk.estado_ticket === 'RESUELTO' || tk.estado_ticket === 'CERRADO'
                                  ? 'be-badge be-badge-success'
                                  : tk.estado_ticket === 'EN_PROCESO'
                                  ? 'be-badge be-badge-info'
                                  : 'be-badge be-badge-danger'
                              }
                            >
                              {tk.estado_ticket}
                            </span>
                          </div>

                          <div
                            style={{
                              padding: '12px 14px',
                              borderRadius: '10px',
                              backgroundColor: 'var(--be-surface-alt)',
                              fontSize: '0.86rem',
                              color: 'var(--be-text)',
                              lineHeight: 1.5,
                              whiteSpace: 'pre-wrap',
                              marginBottom: '12px',
                            }}
                          >
                            {tk.mensaje}
                          </div>

                          {tk.respuesta_admin && (
                            <div
                              style={{
                                padding: '10px 12px',
                                borderRadius: '10px',
                                backgroundColor: 'var(--be-primary-soft)',
                                borderLeft: '3px solid var(--be-primary)',
                                fontSize: '0.82rem',
                                color: 'var(--be-text)',
                                marginBottom: '12px',
                              }}
                            >
                              <strong>Respuesta enviada:</strong> {tk.respuesta_admin}
                            </div>
                          )}

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            {tieneCasoApertura && (
                              <button
                                type="button"
                                className="be-btn be-btn-outline"
                                style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                                onClick={() => {
                                  if (tk.id_solicitud_asociada) {
                                    setCasoDestacadoId(`sol-${tk.id_solicitud_asociada}`);
                                    cambiarTab('solicitudes');
                                  } else if (tk.id_reporte_asociado) {
                                    setCasoDestacadoId(`rep-${tk.id_reporte_asociado}`);
                                    cambiarTab('reportes');
                                  }
                                }}
                              >
                                <IonIcon icon={arrowForwardOutline} /> Ir al caso asociado
                              </button>
                            )}

                            {tieneCasoApertura && casoAunAbiertoOAprobado && (
                              <button
                                type="button"
                                className="be-btn be-btn-danger"
                                style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                                disabled={procesandoId === tk.id_ticket}
                                onClick={() => pedirConfirmacionRevertirDesdeTicket(tk)}
                              >
                                <IonIcon icon={refreshOutline} /> Revertir apertura y sellar bóveda
                              </button>
                            )}

                            <button
                              type="button"
                              className="be-btn be-btn-primary"
                              style={{ padding: '7px 12px', fontSize: '0.78rem', marginLeft: 'auto' }}
                              onClick={() => abrirModalTicket(tk)}
                            >
                              <IonIcon icon={createOutline} /> Responder / Cambiar estado
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* 4. GESTIÓN COMPLETA DE USUARIOS (EDITAR, ROL, SUSPENDER, ELIMINAR) */}
              {tab === 'usuarios' && (
                <div>
                  <div className="be-card" style={{ padding: '14px 16px', marginBottom: '14px' }}>
                    <div className="be-input-group">
                      <IonIcon icon={searchOutline} className="be-input-icon" />
                      <input
                        type="text"
                        className="be-input"
                        placeholder="Buscar usuario por nombre, correo o RUT..."
                        value={busquedaUsuario}
                        onChange={(e) => setBusquedaUsuario(e.target.value)}
                      />
                    </div>
                  </div>

                  {usuariosFiltrados.map((u) => {
                    const esMismoAdmin = u.id_usuario === adminActualId;
                    const suspendido = u.activo === false;

                    return (
                      <div
                        key={u.id_usuario}
                        className="be-card"
                        style={{
                          padding: '16px 18px',
                          opacity: suspendido ? 0.78 : 1,
                          borderColor: suspendido ? 'var(--be-danger)' : undefined,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--be-text)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {u.nombre_usuario}
                              <span className={u.rol === 'ADMIN' ? 'be-badge be-badge-warning' : 'be-badge be-badge-info'}>
                                {u.rol}
                              </span>
                              {suspendido ? (
                                <span className="be-badge be-badge-danger">SUSPENDIDO</span>
                              ) : (
                                <span className="be-badge be-badge-success">ACTIVO</span>
                              )}
                              {esMismoAdmin && <span className="be-badge be-badge-neutral">Tu cuenta</span>}
                            </h4>
                            <p style={{ margin: '0 0 4px 0', fontSize: '0.82rem', color: 'var(--be-text-muted)' }}>
                              RUT: <strong>{u.rut || 'Sin RUT'}</strong> · {u.correo_usuario}{' '}
                              {u.correo_verificado ? '(Confirmado)' : '(Sin confirmar)'}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.77rem', color: 'var(--be-text-muted)' }}>
                              Check-in cada <strong>{u.frecuencia_checkin_dias || 180}d</strong> · Gracia{' '}
                              <strong>{u.plazo_gracia_dias || 7}d</strong>
                              {u.correo_alternativo ? ` · Alt: ${u.correo_alternativo}` : ''}
                              {u.correo_contacto_confianza ? ` · Confianza 48h: ${u.correo_contacto_confianza}` : ''}
                            </p>
                          </div>

                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span className="be-badge be-badge-neutral">{u.total_polizas} pólizas</span>
                            <span className="be-badge be-badge-neutral">{u.total_albaceas} albaceas</span>
                            <span className="be-badge be-badge-neutral">{u.total_inventario} activos</span>
                            <span className="be-badge be-badge-neutral">{u.total_mensajes || 0} mensajes</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--be-border)' }}>
                          <button
                            type="button"
                            className="be-btn be-btn-outline"
                            style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                            disabled={procesandoId === u.id_usuario}
                            onClick={() => abrirModalEdicion(u)}
                          >
                            <IonIcon icon={createOutline} /> Editar datos
                          </button>

                          {!esMismoAdmin && (
                            <>
                              <button
                                type="button"
                                className="be-btn be-btn-outline"
                                style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                                disabled={procesandoId === u.id_usuario}
                                onClick={() =>
                                  handleActualizarUsuarioRapido(u, { rol: u.rol === 'ADMIN' ? 'TITULAR' : 'ADMIN' })
                                }
                              >
                                <IonIcon icon={shieldOutline} />
                                {u.rol === 'ADMIN' ? 'Pasar a Titular' : 'Promover a Admin'}
                              </button>

                              <button
                                type="button"
                                className="be-btn be-btn-outline"
                                style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                                disabled={procesandoId === u.id_usuario}
                                onClick={() => handleActualizarUsuarioRapido(u, { activo: suspendido })}
                              >
                                <IonIcon icon={banOutline} />
                                {suspendido ? 'Reactivar cuenta' : 'Suspender cuenta'}
                              </button>

                              <button
                                type="button"
                                className="be-btn be-btn-danger"
                                style={{ padding: '7px 12px', fontSize: '0.78rem', marginLeft: 'auto' }}
                                disabled={procesandoId === u.id_usuario}
                                onClick={() => setUsuarioEliminar(u)}
                              >
                                <IonIcon icon={trashOutline} /> Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 5. AUDITORÍA */}
              {tab === 'auditoria' && (
                <div>
                  {auditoria.length === 0 ? (
                    <div className="be-empty-state">
                      <p style={{ margin: 0 }}>Sin eventos de auditoría registrados.</p>
                    </div>
                  ) : (
                    auditoria.map((ev) => (
                      <div key={ev.id_evento} className="be-list-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 280px' }}>
                          <div className="be-icon-box" style={{ width: '38px', height: '38px', fontSize: '1.1rem' }}>
                            <IonIcon icon={pulseOutline} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--be-text)' }}>
                              {ev.accion}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--be-text-muted)' }}>
                              {ev.nombre_usuario ? `${ev.nombre_usuario} (${ev.correo_usuario})` : 'Sistema'} · IP{' '}
                              {ev.direccion_ip}
                            </div>
                          </div>
                        </div>
                        <span className="be-badge be-badge-neutral">{fechaHora(ev.fecha_hora)}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal de respuesta / gestión de ticket de soporte */}
        <IonModal isOpen={!!ticketGestionando} onDidDismiss={() => setTicketGestionando(null)}>
          <IonHeader className="ion-no-border">
            <IonToolbar
              style={
                {
                  '--background': 'var(--ion-toolbar-background)',
                  '--color': 'var(--ion-toolbar-color)',
                } as React.CSSProperties
              }
            >
              <IonTitle style={{ fontSize: '1.02rem', fontWeight: 700 }}>
                Gestionar Ticket {ticketGestionando?.codigo_ticket}
              </IonTitle>
              <button
                type="button"
                slot="end"
                onClick={() => setTicketGestionando(null)}
                aria-label="Cerrar"
                style={{
                  background: 'rgba(255,255,255,0.14)',
                  border: 'none',
                  color: '#ffffff',
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  marginRight: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                <IonIcon icon={closeOutline} />
              </button>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            <form onSubmit={handleGuardarTicket} style={{ maxWidth: '520px', margin: '8px auto' }}>
              <div className="be-field">
                <label className="be-label">Estado del ticket</label>
                <select
                  className="be-select"
                  value={ticketEstadoEdit}
                  onChange={(e) => setTicketEstadoEdit(e.target.value as any)}
                >
                  <option value="ABIERTO">ABIERTO</option>
                  <option value="EN_PROCESO">EN PROCESO</option>
                  <option value="RESUELTO">RESUELTO</option>
                  <option value="CERRADO">CERRADO</option>
                </select>
              </div>

              <div className="be-field">
                <label className="be-label">Respuesta para el usuario (se enviará por correo)</label>
                <textarea
                  className="be-textarea"
                  rows={5}
                  placeholder="Escribe las acciones tomadas o indicaciones para el usuario..."
                  value={ticketRespuestaEdit}
                  onChange={(e) => setTicketRespuestaEdit(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="be-btn be-btn-outline"
                  style={{ flex: '1 1 120px' }}
                  onClick={() => setTicketGestionando(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="be-btn be-btn-primary"
                  style={{ flex: '2 1 180px' }}
                  disabled={guardandoTicket}
                >
                  {guardandoTicket ? <IonSpinner name="crescent" color="light" /> : 'Guardar y notificar por correo'}
                </button>
              </div>
            </form>
          </IonContent>
        </IonModal>

        {/* Modal de edición completa de usuario */}
        <IonModal isOpen={!!usuarioEditando} onDidDismiss={() => setUsuarioEditando(null)}>
          <IonHeader className="ion-no-border">
            <IonToolbar
              style={
                {
                  '--background': 'var(--ion-toolbar-background)',
                  '--color': 'var(--ion-toolbar-color)',
                } as React.CSSProperties
              }
            >
              <IonTitle style={{ fontSize: '1.02rem', fontWeight: 700 }}>
                Editar Usuario #{usuarioEditando?.id_usuario}
              </IonTitle>
              <button
                type="button"
                slot="end"
                onClick={() => setUsuarioEditando(null)}
                aria-label="Cerrar"
                style={{
                  background: 'rgba(255,255,255,0.14)',
                  border: 'none',
                  color: '#ffffff',
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  marginRight: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                <IonIcon icon={closeOutline} />
              </button>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            <form onSubmit={handleGuardarEdicionUsuario} style={{ maxWidth: '520px', margin: '8px auto' }}>
              <div className="be-field">
                <label className="be-label">Nombre completo *</label>
                <input
                  type="text"
                  className="be-input"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  required
                />
              </div>

              <div className="be-grid-2">
                <div className="be-field">
                  <label className="be-label">Correo electrónico *</label>
                  <input
                    type="email"
                    className="be-input"
                    value={editCorreo}
                    onChange={(e) => setEditCorreo(e.target.value)}
                    required
                  />
                </div>
                <div className="be-field">
                  <label className="be-label">RUT chileno</label>
                  <input
                    type="text"
                    className="be-input"
                    placeholder="Ej: 12345678-5"
                    value={editRut}
                    onChange={(e) => setEditRut(e.target.value)}
                    onBlur={() => {
                      if (editRut.trim()) setEditRut(normalizarRut(editRut));
                    }}
                  />
                </div>
              </div>

              <div className="be-grid-2">
                <div className="be-field">
                  <label className="be-label">Frecuencia Check-in</label>
                  <select
                    className="be-select"
                    value={editFrecuencia}
                    onChange={(e) => setEditFrecuencia(Number(e.target.value))}
                  >
                    <option value={30}>Cada 30 días</option>
                    <option value={90}>Cada 90 días</option>
                    <option value={180}>Cada 180 días</option>
                    <option value={365}>Cada 365 días</option>
                  </select>
                </div>
                <div className="be-field">
                  <label className="be-label">Plazo de gracia</label>
                  <select
                    className="be-select"
                    value={editGracia}
                    onChange={(e) => setEditGracia(Number(e.target.value))}
                  >
                    <option value={3}>3 días (72h)</option>
                    <option value={7}>7 días (1 semana)</option>
                    <option value={14}>14 días (2 semanas)</option>
                  </select>
                </div>
              </div>

              {usuarioEditando?.id_usuario !== adminActualId && (
                <div className="be-field">
                  <label className="be-label">Rol de la cuenta</label>
                  <select
                    className="be-select"
                    value={editRol}
                    onChange={(e) => setEditRol(e.target.value as 'TITULAR' | 'ADMIN')}
                  >
                    <option value="TITULAR">Titular / Albacea</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              )}

              <div className="be-field">
                <label className="be-label">Correo alternativo de respaldo</label>
                <input
                  type="email"
                  className="be-input"
                  placeholder="Opcional"
                  value={editCorreoAlt}
                  onChange={(e) => setEditCorreoAlt(e.target.value)}
                />
              </div>

              <div className="be-grid-2">
                <div className="be-field">
                  <label className="be-label">Nombre contacto confianza (48h)</label>
                  <input
                    type="text"
                    className="be-input"
                    placeholder="Opcional"
                    value={editNombreConf}
                    onChange={(e) => setEditNombreConf(e.target.value)}
                  />
                </div>
                <div className="be-field">
                  <label className="be-label">Correo contacto confianza (48h)</label>
                  <input
                    type="email"
                    className="be-input"
                    placeholder="Opcional"
                    value={editCorreoConf}
                    onChange={(e) => setEditCorreoConf(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                <button
                  type="button"
                  className="be-btn be-btn-outline"
                  style={{ flex: '1 1 120px' }}
                  onClick={() => setUsuarioEditando(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="be-btn be-btn-primary"
                  style={{ flex: '2 1 180px' }}
                  disabled={guardandoEdicion}
                >
                  {guardandoEdicion ? <IonSpinner name="crescent" color="light" /> : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </IonContent>
        </IonModal>

        {/* Confirmación de acciones críticas sobre solicitudes / reportes */}
        <IonAlert
          isOpen={!!confirmacion}
          onDidDismiss={() => setConfirmacion(null)}
          header={confirmacion?.titulo || 'Confirmar acción'}
          message={confirmacion?.mensaje || ''}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: confirmacion?.textoBoton || 'Confirmar',
              role: 'confirm',
              handler: () => {
                if (confirmacion) confirmacion.onConfirmar();
              },
            },
          ]}
        />

        {/* Confirmación de eliminación permanente de usuario */}
        <IonAlert
          isOpen={!!usuarioEliminar}
          onDidDismiss={() => setUsuarioEliminar(null)}
          header="Eliminar usuario permanentemente"
          message={`¿Deseas eliminar la cuenta de ${usuarioEliminar?.nombre_usuario || ''} (${usuarioEliminar?.correo_usuario || ''})? Se eliminarán sus pólizas, inventario y mensajes de forma irreversible.`}
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Eliminar', role: 'destructive', handler: () => confirmarEliminarUsuario() },
          ]}
        />

        <IonToast
          isOpen={!!toastMsg}
          onDidDismiss={() => setToastMsg('')}
          message={toastMsg}
          duration={3800}
          color={toastColor}
        />
      </IonContent>

      <MobileBottomNav />
    </IonPage>
  );
};

export default AdminPanel;
