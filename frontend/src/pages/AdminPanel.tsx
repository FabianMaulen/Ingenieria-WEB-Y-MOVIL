import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon,
  IonToast,
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
} from 'ionicons/icons';
import { HeaderBar } from '../components/HeaderBar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { VaultLoader } from '../components/VaultLoader';
import { mensajeError } from '../services/api';
import {
  obtenerResumenAdmin,
  listarUsuariosAdmin,
  listarAuditoriaAdmin,
  listarSolicitudesAdmin,
  actualizarEstadoSolicitudAdmin,
  ResumenAdmin,
  UsuarioAdmin,
  EventoAuditoria,
  SolicitudAdmin,
} from '../services/admin.service';
import { dinero, fechaHora } from '../services/utils/formato';

type TabAdmin = 'resumen' | 'solicitudes' | 'auditoria' | 'usuarios';

export const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<TabAdmin>('resumen');
  const [cargando, setCargando] = useState(true);
  const [resumen, setResumen] = useState<ResumenAdmin | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [auditoria, setAuditoria] = useState<EventoAuditoria[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudAdmin[]>([]);
  const [portalRC, setPortalRC] = useState(
    'https://www.registrocivil.cl/OficinaInternet/verificacion/verificacioncertificado.srcei'
  );
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  const cargarTodo = async () => {
    try {
      setCargando(true);
      const [r, u, a, s] = await Promise.all([
        obtenerResumenAdmin(),
        listarUsuariosAdmin(),
        listarAuditoriaAdmin(),
        listarSolicitudesAdmin(),
      ]);
      setResumen(r);
      setUsuarios(u);
      setAuditoria(a);
      setSolicitudes(s.solicitudes);
      setPortalRC(s.portalRegistroCivil);
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

  const handleCambiarEstado = async (id: number, estado: 'APROBADA' | 'CANCELADA') => {
    try {
      setProcesandoId(id);
      const res = await actualizarEstadoSolicitudAdmin(id, estado);
      setToastColor(estado === 'APROBADA' ? 'success' : 'warning');
      setToastMsg(res.mensaje || 'Estado actualizado.');
      await cargarTodo();
    } catch (error) {
      setToastColor('danger');
      setToastMsg(mensajeError(error));
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <IonPage id="main-content">
      <HeaderBar title="Administración y Auditoría" />

      <IonContent className="ion-padding">
        <div className="be-container">
          <div className="be-hero-banner">
            <h2>Centro de Control y Auditoría</h2>
            <p>
              Supervisión global de Baúl Eterno: métricas de plataforma, trazabilidad de eventos críticos y revisión
              manual de solicitudes de apertura.
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <IonSegment
              value={tab}
              scrollable
              style={{ '--background': 'var(--be-surface-alt)' } as React.CSSProperties}
              onIonChange={(e) => setTab(e.detail.value as TabAdmin)}
            >
              <IonSegmentButton value="resumen">
                <IonLabel style={{ fontSize: '0.8rem', fontWeight: 700 }}>Resumen</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="solicitudes">
                <IonLabel style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  Solicitudes ({solicitudes.length})
                </IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="auditoria">
                <IonLabel style={{ fontSize: '0.8rem', fontWeight: 700 }}>Auditoría</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="usuarios">
                <IonLabel style={{ fontSize: '0.8rem', fontWeight: 700 }}>Usuarios ({usuarios.length})</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          {cargando ? (
            <VaultLoader texto="Cargando métricas de administración..." />
          ) : (
            <>
              {/* 1. RESUMEN KPIs */}
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
                        Usuarios registrados
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
                        Mensajes AES-256
                      </div>
                    </div>
                  </div>

                  <div className="be-grid-2">
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
                          Correo SMTP: {resumen.servicios.smtp_activo ? 'Activo (Gmail/SMTP)' : 'Modo Consola (sin SMTP_USER)'}
                        </span>
                        <span className="be-badge be-badge-neutral">{resumen.auditoria.total} eventos auditados</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 2. SOLICITUDES DE APERTURA */}
              {tab === 'solicitudes' && (
                <div>
                  {solicitudes.length === 0 ? (
                    <div className="be-empty-state">
                      <IonIcon icon={documentAttachOutline} style={{ fontSize: '2.2rem', marginBottom: '8px', opacity: 0.55 }} />
                      <p style={{ margin: 0 }}>No existen solicitudes de apertura registradas.</p>
                    </div>
                  ) : (
                    solicitudes.map((sol) => (
                      <div key={sol.id_solicitud} className="be-card" style={{ padding: '18px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700 }}>
                              Solicitud #{sol.id_solicitud} · Titular: {sol.nombre_titular} ({sol.rut_titular})
                            </h4>
                            <p style={{ margin: '0 0 4px 0', fontSize: '0.83rem', color: 'var(--be-text-muted)' }}>
                              Albacea: <strong>{sol.nombre_albacea}</strong> ({sol.rut_albacea}, {sol.parentesco}) ·{' '}
                              {fechaHora(sol.fecha_solicitud)}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--be-text-muted)', wordBreak: 'break-all' }}>
                              SHA-256: <code>{sol.hash_documento}</code>
                            </p>
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
                          <a
                            href={portalRC}
                            target="_blank"
                            rel="noreferrer"
                            className="be-btn be-btn-outline"
                            style={{ padding: '8px 12px', fontSize: '0.8rem', textDecoration: 'none' }}
                          >
                            <IonIcon icon={openOutline} />
                            Verificar en Registro Civil
                          </a>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="be-btn be-btn-primary"
                              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                              disabled={procesandoId === sol.id_solicitud || sol.estado_solicitud === 'APROBADA'}
                              onClick={() => handleCambiarEstado(sol.id_solicitud, 'APROBADA')}
                            >
                              <IonIcon icon={checkmarkCircleOutline} /> Aprobar
                            </button>
                            <button
                              type="button"
                              className="be-btn be-btn-danger"
                              style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                              disabled={procesandoId === sol.id_solicitud || sol.estado_solicitud === 'CANCELADA'}
                              onClick={() => handleCambiarEstado(sol.id_solicitud, 'CANCELADA')}
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

              {/* 3. AUDITORÍA */}
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

              {/* 4. USUARIOS */}
              {tab === 'usuarios' && (
                <div>
                  {usuarios.map((u) => (
                    <div key={u.id_usuario} className="be-list-item">
                      <div>
                        <h4 style={{ margin: '0 0 3px 0', fontSize: '0.98rem', fontWeight: 700, color: 'var(--be-text)' }}>
                          {u.nombre_usuario}{' '}
                          <span className={u.rol === 'ADMIN' ? 'be-badge be-badge-warning' : 'be-badge be-badge-info'}>
                            {u.rol}
                          </span>
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--be-text-muted)' }}>
                          RUT: {u.rut} · {u.correo_usuario}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="be-badge be-badge-neutral">{u.total_polizas} pólizas</span>
                        <span className="be-badge be-badge-neutral">{u.total_albaceas} albaceas</span>
                        <span className="be-badge be-badge-neutral">{u.total_inventario} activos</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <IonToast
          isOpen={!!toastMsg}
          onDidDismiss={() => setToastMsg('')}
          message={toastMsg}
          duration={3500}
          color={toastColor}
        />
      </IonContent>

      <MobileBottomNav />
    </IonPage>
  );
};

export default AdminPanel;
