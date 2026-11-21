import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  IonToast,
  IonButton,
  IonCheckbox,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  peopleOutline,
  mailUnreadOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  shieldCheckmarkOutline,
  documentTextOutline,
  callOutline,
  globeOutline,
  mailOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { VaultLoader } from '../components/VaultLoader';
import { mensajeError } from '../services/api';
import {
  obtenerDesignaciones,
  responderDesignacion,
  obtenerGuia,
  marcarTramitada,
  DesignacionAlbacea,
  Guia as GuiaData,
} from '../services/guia.service';
import { dinero } from '../services/utils/formato';

export const Guia: React.FC = () => {
  const navigate = useNavigate();
  const [designaciones, setDesignaciones] = useState<DesignacionAlbacea[]>([]);
  const [guia, setGuia] = useState<GuiaData>({ polizas: [], resumen: { total: 0, tramitadas: 0 } });
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  const cargarDatosAlbacea = async () => {
    try {
      setCargando(true);
      const [listaDesig, dataGuia] = await Promise.all([
        obtenerDesignaciones().catch(() => []),
        obtenerGuia().catch(() => ({ polizas: [], resumen: { total: 0, tramitadas: 0 } })),
      ]);
      setDesignaciones(Array.isArray(listaDesig) ? listaDesig : []);
      setGuia(dataGuia);
    } catch (error) {
      setToastColor('danger');
      setToastMsg(mensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  useIonViewWillEnter(() => {
    localStorage.setItem('modo_activo', 'ALBACEA');
    cargarDatosAlbacea();
  });

  const handleResponder = async (idDirectorio: number, nuevoEstado: 'VALIDADO' | 'RECHAZADO') => {
    try {
      setProcesandoId(idDirectorio);
      const res = await responderDesignacion(idDirectorio, nuevoEstado);
      setToastColor(nuevoEstado === 'VALIDADO' ? 'success' : 'warning');
      setToastMsg(
        res.mensaje ||
          (nuevoEstado === 'VALIDADO' ? 'Designación aceptada.' : 'Designación rechazada.')
      );
      await cargarDatosAlbacea();
    } catch (error) {
      setToastColor('danger');
      setToastMsg(mensajeError(error));
    } finally {
      setProcesandoId(null);
    }
  };

  const handleToggleTramitada = async (idPoliza: number, tramitada: boolean) => {
    try {
      await marcarTramitada(idPoliza, tramitada);
      setToastColor('success');
      setToastMsg(tramitada ? 'Póliza marcada como tramitada.' : 'Póliza marcada como pendiente.');
      await cargarDatosAlbacea();
    } catch (error) {
      setToastColor('danger');
      setToastMsg(mensajeError(error));
    }
  };

  const solicitudesPendientes = designaciones.filter((d) => d.estado_validacion === 'PENDIENTE');
  const titularesAutorizados = designaciones.filter((d) => d.estado_validacion === 'VALIDADO');

  return (
    <IonPage id="main-content">
      <HeaderBar title="Panel Albacea" showBack={false} />

      <IonContent className="ion-padding">
        <div className="be-container">
          <div className="be-hero-banner">
            <h2>Custodia y Guía de Albacea</h2>
            <p>
              Acepta o rechaza las designaciones recibidas, inicia solicitudes de apertura cuando corresponda y
              gestiona el cobro de pólizas liberadas con el checklist oficial.
            </p>
          </div>

          {cargando ? (
            <VaultLoader texto="Consultando designaciones y pólizas..." />
          ) : (
            <>
              {/* 1. DESIGNACIONES PENDIENTES */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.06rem', fontWeight: 800, color: 'var(--be-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={mailUnreadOutline} style={{ color: 'var(--be-warning)' }} />
                    Invitaciones por responder
                  </h3>
                  <span className={solicitudesPendientes.length > 0 ? 'be-badge be-badge-warning' : 'be-badge be-badge-neutral'}>
                    {solicitudesPendientes.length} pendiente{solicitudesPendientes.length === 1 ? '' : 's'}
                  </span>
                </div>

                {solicitudesPendientes.length === 0 ? (
                  <div className="be-empty-state" style={{ padding: '24px' }}>
                    <p style={{ margin: 0, fontSize: '0.88rem' }}>
                      No tienes designaciones pendientes por responder.
                    </p>
                  </div>
                ) : (
                  solicitudesPendientes.map((sol) => (
                    <div key={sol.id_directorio} className="be-card" style={{ padding: '18px 20px' }}>
                      <div style={{ marginBottom: '14px' }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--be-text)' }}>
                          {sol.nombre_titular} te designó como Albacea ({sol.parentesco})
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--be-text-muted)' }}>
                          RUT: {sol.rut_titular}
                          {sol.correo_titular ? ` · ${sol.correo_titular}` : ''} ·{' '}
                          {new Date(sol.fecha_designacion).toLocaleDateString('es-CL')}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <IonButton
                          fill="outline"
                          color="danger"
                          size="small"
                          disabled={procesandoId === sol.id_directorio}
                          onClick={() => handleResponder(sol.id_directorio, 'RECHAZADO')}
                        >
                          <IonIcon slot="start" icon={closeCircleOutline} />
                          Rechazar
                        </IonButton>

                        <IonButton
                          fill="solid"
                          color="success"
                          size="small"
                          disabled={procesandoId === sol.id_directorio}
                          onClick={() => handleResponder(sol.id_directorio, 'VALIDADO')}
                        >
                          {procesandoId === sol.id_directorio ? (
                            <IonSpinner name="crescent" />
                          ) : (
                            <>
                              <IonIcon slot="start" icon={checkmarkCircleOutline} />
                              Aceptar designación
                            </>
                          )}
                        </IonButton>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 2. TITULARES CUSTODIADOS */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.06rem', fontWeight: 800, color: 'var(--be-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={shieldCheckmarkOutline} style={{ color: 'var(--be-success)' }} />
                    Titulares bajo tu custodia
                  </h3>
                  <span className="be-badge be-badge-success">{titularesAutorizados.length} activos</span>
                </div>

                {titularesAutorizados.length === 0 ? (
                  <div className="be-empty-state" style={{ padding: '24px' }}>
                    <p style={{ margin: 0, fontSize: '0.88rem' }}>
                      Aún no has aceptado tu rol de albacea para ningún titular.
                    </p>
                  </div>
                ) : (
                  titularesAutorizados.map((tit) => (
                    <div key={tit.id_directorio} className="be-list-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 220px', minWidth: 0 }}>
                        <div className="be-icon-box">
                          <IonIcon icon={peopleOutline} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ margin: '0 0 2px 0', fontSize: '0.98rem', fontWeight: 700, color: 'var(--be-text)' }}>
                            {tit.nombre_titular}
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--be-text-muted)' }}>
                            RUT: {tit.rut_titular} · {tit.parentesco}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="be-badge be-badge-success">VALIDADO</span>
                        <IonButton
                          size="small"
                          fill="outline"
                          color="danger"
                          onClick={() => navigate('/apertura', { state: { rut_titular: tit.rut_titular } })}
                        >
                          Solicitar apertura
                        </IonButton>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 3. GUÍA DE COBRO DE PÓLIZAS LIBERADAS */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.06rem', fontWeight: 800, color: 'var(--be-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={documentTextOutline} style={{ color: 'var(--be-primary)' }} />
                    Guía de cobro de pólizas liberadas
                  </h3>
                  <span className="be-badge be-badge-info">
                    {guia.resumen.tramitadas} / {guia.resumen.total} tramitadas
                  </span>
                </div>

                {guia.polizas.length === 0 ? (
                  <div className="be-empty-state" style={{ padding: '24px' }}>
                    <p style={{ margin: 0, fontSize: '0.88rem' }}>
                      {guia.mensaje || 'Aún no tienes pólizas liberadas tras una apertura aprobada.'}
                    </p>
                  </div>
                ) : (
                  guia.polizas.map((pol) => (
                    <div key={pol.id_poliza} className="be-card" style={{ padding: '18px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ flex: '1 1 260px' }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--be-text)' }}>
                            {pol.aseguradora} · {pol.tipo_seguro}
                          </h4>
                          <p style={{ margin: '0 0 4px 0', fontSize: '0.84rem', color: 'var(--be-text-muted)' }}>
                            Titular: <strong style={{ color: 'var(--be-text)' }}>{pol.nombre_titular}</strong> · Póliza:{' '}
                            <strong style={{ color: 'var(--be-text)' }}>{pol.numero_poliza}</strong> ·{' '}
                            <strong style={{ color: 'var(--be-success)' }}>{dinero(pol.monto_referencial)}</strong>
                          </p>
                          <p style={{ margin: '0 0 8px 0', fontSize: '0.82rem', color: 'var(--be-text-muted)' }}>
                            Ubicación: {pol.ubicacion_fisica}
                          </p>
                          {pol.contacto && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.8rem', color: 'var(--be-primary)' }}>
                              {pol.contacto.telefono && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <IonIcon icon={callOutline} /> {pol.contacto.telefono}
                                </span>
                              )}
                              {pol.contacto.correo && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <IonIcon icon={mailOutline} /> {pol.contacto.correo}
                                </span>
                              )}
                              {pol.contacto.web && (
                                <a href={pol.contacto.web} target="_blank" rel="noreferrer" style={{ color: 'var(--be-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <IonIcon icon={globeOutline} /> Portal Web
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <IonCheckbox
                            checked={pol.tramitada}
                            onIonChange={(e) => handleToggleTramitada(pol.id_poliza, !!e.detail.checked)}
                          />
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--be-text)' }}>
                            {pol.tramitada ? 'Tramitada' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
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

export default Guia;
