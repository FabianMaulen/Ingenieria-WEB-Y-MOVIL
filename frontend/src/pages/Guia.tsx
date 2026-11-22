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
  folderOpenOutline,
  lockOpenOutline,
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

const GUIA_VACIA: GuiaData = {
  titulares_liberados: [],
  polizas: [],
  inventario: [],
  mensajes: [],
  resumen: { total: 0, tramitadas: 0 },
};

export const Guia: React.FC = () => {
  const navigate = useNavigate();
  const [designaciones, setDesignaciones] = useState<DesignacionAlbacea[]>([]);
  const [guia, setGuia] = useState<GuiaData>(GUIA_VACIA);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger' | 'warning'>('success');

  const cargarDatosAlbacea = async () => {
    try {
      setCargando(true);
      const [listaDesig, dataGuia] = await Promise.all([
        obtenerDesignaciones().catch(() => []),
        obtenerGuia().catch(() => GUIA_VACIA),
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
              Acepta o rechaza las designaciones recibidas, consulta el estado global de las bóvedas bajo tu custodia y
              accede a pólizas, inventario y cartas liberadas cuando corresponda.
            </p>
          </div>

          {cargando ? (
            <VaultLoader texto="Consultando designaciones y contenido liberado..." />
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

              {/* 2. TITULARES CUSTODIADOS (CON ESTADO GLOBAL DE APERTURA) */}
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
                        <div className={tit.boveda_liberada ? 'be-icon-box be-icon-box-accent' : 'be-icon-box'}>
                          <IonIcon icon={tit.boveda_liberada ? lockOpenOutline : peopleOutline} />
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
                        {tit.boveda_liberada ? (
                          <span className="be-badge be-badge-success">
                            <IonIcon icon={lockOpenOutline} /> BÓVEDA LIBERADA
                          </span>
                        ) : tit.apertura_en_curso ? (
                          <span className="be-badge be-badge-warning">APERTURA EN CURSO</span>
                        ) : (
                          <>
                            <span className="be-badge be-badge-info">CUSTODIA ACTIVA</span>
                            <IonButton
                              size="small"
                              fill="outline"
                              color="danger"
                              onClick={() => navigate('/apertura', { state: { rut_titular: tit.rut_titular } })}
                            >
                              Solicitar apertura
                            </IonButton>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 3. GUÍA DE COBRO DE PÓLIZAS LIBERADAS */}
              <div style={{ marginBottom: '28px' }}>
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
                      {guia.titulares_liberados.length > 0
                        ? 'La bóveda está liberada, pero el titular no registró pólizas de seguro.'
                        : guia.mensaje || 'Aún no tienes pólizas liberadas tras una apertura aprobada.'}
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
                                <a
                                  href={pol.contacto.web}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: 'var(--be-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
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

              {/* 4. INVENTARIO DIGITAL LIBERADO */}
              {guia.titulares_liberados.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.06rem', fontWeight: 800, color: 'var(--be-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IonIcon icon={folderOpenOutline} style={{ color: 'var(--be-accent)' }} />
                      Inventario digital y patrimonial liberado
                    </h3>
                    <span className="be-badge be-badge-neutral">{guia.inventario.length} activos</span>
                  </div>

                  {guia.inventario.length === 0 ? (
                    <div className="be-empty-state" style={{ padding: '20px' }}>
                      <p style={{ margin: 0, fontSize: '0.86rem' }}>El titular no dejó activos en su inventario digital.</p>
                    </div>
                  ) : (
                    guia.inventario.map((inv) => (
                      <div key={inv.id_inventario} className="be-card" style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--be-text)' }}>
                            {inv.plataforma}
                          </h4>
                          <span className="be-badge be-badge-info">{inv.categoria}</span>
                        </div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--be-text-muted)' }}>
                          Titular: <strong>{inv.nombre_titular}</strong>
                        </p>
                        <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--be-text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {inv.instruccion}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 5. MENSAJES PÓSTUMOS DIRIGIDOS A TU RUT (DESCIFRADOS TRAS LIBERACIÓN) */}
              {guia.titulares_liberados.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.06rem', fontWeight: 800, color: 'var(--be-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IonIcon icon={mailOutline} style={{ color: 'var(--be-primary)' }} />
                      Mensajes póstumos dirigidos a ti
                    </h3>
                    <span className="be-badge be-badge-info">{guia.mensajes.length} carta(s)</span>
                  </div>

                  {guia.mensajes.length === 0 ? (
                    <div className="be-empty-state" style={{ padding: '20px' }}>
                      <p style={{ margin: 0, fontSize: '0.86rem' }}>
                        No hay mensajes póstumos dirigidos específicamente a tu RUT en las bóvedas liberadas.
                      </p>
                    </div>
                  ) : (
                    guia.mensajes.map((msg) => (
                      <div
                        key={msg.id_mensaje}
                        className="be-card"
                        style={{ padding: '18px 20px', borderLeft: '4px solid var(--be-accent)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                          <strong style={{ fontSize: '0.94rem', color: 'var(--be-text)' }}>
                            Carta de {msg.nombre_titular}
                          </strong>
                          <span className="be-badge be-badge-neutral">
                            {new Date(msg.fecha_creacion).toLocaleDateString('es-CL')}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--be-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {msg.contenido}
                        </p>
                      </div>
                    ))
                  )}
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

export default Guia;
