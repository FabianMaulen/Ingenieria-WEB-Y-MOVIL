import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  IonToast,
  IonButton,
  IonBadge,
  IonCheckbox,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  peopleOutline,
  mailUnreadOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  shieldCheckmarkOutline,
  informationCircleOutline,
  documentTextOutline,
  callOutline,
  globeOutline,
  mailOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';
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
          (nuevoEstado === 'VALIDADO'
            ? 'Designación aceptada exitosamente.'
            : 'Designación rechazada.')
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
      <HeaderBar title="Panel Albacea y Guía de Cobro" />

      <IonContent className="ion-padding">
        <div style={{ maxWidth: '850px', margin: '0 auto', padding: '12px 0' }}>
          {/* Banner Informativo */}
          <div
            style={{
              backgroundColor: 'var(--ion-color-step-100, rgba(37, 99, 235, 0.08))',
              border: '1px solid var(--ion-color-primary, #2563eb)',
              borderRadius: '14px',
              padding: '20px 24px',
              marginBottom: '28px',
              color: 'var(--ion-text-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <IonIcon icon={informationCircleOutline} style={{ fontSize: '1.4rem', color: 'var(--ion-color-primary, #2563eb)' }} />
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: 'var(--ion-text-color)' }}>
                Tu Rol como Albacea de Confianza
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.85, lineHeight: '1.5', color: 'var(--ion-text-color)' }}>
              Aquí puedes aceptar o rechazar las designaciones recibidas, iniciar procesos de apertura por contingencia
              y consultar la guía de cobro de pólizas una vez aprobada una apertura.
            </p>
          </div>

          {cargando ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="crescent" />
            </div>
          ) : (
            <>
              {/* 1. SOLICITUDES DE DESIGNACIÓN PENDIENTES */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--ion-text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={mailUnreadOutline} color="warning" />
                    Solicitudes de Designación Pendientes
                  </h3>
                  <IonBadge color={solicitudesPendientes.length > 0 ? 'warning' : 'medium'}>
                    {solicitudesPendientes.length} Pendientes
                  </IonBadge>
                </div>

                {solicitudesPendientes.length === 0 ? (
                  <div
                    style={{
                      padding: '24px',
                      backgroundColor: 'var(--ion-card-background, var(--ion-item-background))',
                      borderRadius: '12px',
                      border: '1px solid var(--ion-color-step-150, #cbd5e1)',
                      color: 'var(--ion-color-step-600, #64748b)',
                      fontSize: '0.9rem',
                      textAlign: 'center',
                    }}
                  >
                    No tienes solicitudes de designación pendientes por responder.
                  </div>
                ) : (
                  solicitudesPendientes.map((sol) => (
                    <div
                      key={sol.id_directorio}
                      style={{
                        backgroundColor: 'var(--ion-card-background, var(--ion-item-background))',
                        color: 'var(--ion-text-color)',
                        borderRadius: '12px',
                        border: '1px solid var(--ion-color-step-150, #cbd5e1)',
                        padding: '20px 24px',
                        marginBottom: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                      }}
                    >
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '700', color: 'var(--ion-text-color)' }}>
                          {sol.nombre_titular} te ha designado como su Albacea ({sol.parentesco})
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--ion-color-step-600, #64748b)' }}>
                          RUT Titular: {sol.rut_titular}
                          {sol.correo_titular ? ` | ${sol.correo_titular}` : ''} | Fecha:{' '}
                          {new Date(sol.fecha_designacion).toLocaleDateString('es-CL')}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
                              Aceptar Designación
                            </>
                          )}
                        </IonButton>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 2. TITULARES QUE CUSTODIAS (VALIDADOS) */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--ion-text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={shieldCheckmarkOutline} color="success" />
                    Titulares que Autorizaste Custodiar
                  </h3>
                  <IonBadge color="success">{titularesAutorizados.length} Activos</IonBadge>
                </div>

                {titularesAutorizados.length === 0 ? (
                  <div
                    style={{
                      padding: '24px',
                      backgroundColor: 'var(--ion-card-background, var(--ion-item-background))',
                      borderRadius: '12px',
                      border: '1px solid var(--ion-color-step-150, #cbd5e1)',
                      color: 'var(--ion-color-step-600, #64748b)',
                      fontSize: '0.9rem',
                      textAlign: 'center',
                    }}
                  >
                    Aún no has aceptado tu rol de albacea para ningún titular.
                  </div>
                ) : (
                  titularesAutorizados.map((tit) => (
                    <div
                      key={tit.id_directorio}
                      style={{
                        backgroundColor: 'var(--ion-card-background, var(--ion-item-background))',
                        color: 'var(--ion-text-color)',
                        borderRadius: '12px',
                        border: '1px solid var(--ion-color-step-150, #cbd5e1)',
                        padding: '18px 22px',
                        marginBottom: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            backgroundColor: 'var(--ion-color-step-100, rgba(37, 99, 235, 0.1))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IonIcon icon={peopleOutline} style={{ fontSize: '1.4rem', color: 'var(--ion-color-primary, #2563eb)' }} />
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 2px 0', fontSize: '0.98rem', fontWeight: '700', color: 'var(--ion-text-color)' }}>
                            {tit.nombre_titular}
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ion-color-step-600, #64748b)' }}>
                            RUT: {tit.rut_titular} {tit.correo_titular ? `| ${tit.correo_titular}` : ''} | {tit.parentesco}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <IonBadge color="success" style={{ padding: '6px 12px', borderRadius: '12px' }}>
                          VALIDADO
                        </IonBadge>
                        <IonButton
                          size="small"
                          fill="outline"
                          color="danger"
                          onClick={() => navigate('/apertura', { state: { rut_titular: tit.rut_titular } })}
                        >
                          Solicitar Apertura
                        </IonButton>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 3. GUÍA DE COBRO DE PÓLIZAS LIBERADAS (RF-07) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--ion-text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={documentTextOutline} color="primary" />
                    Guía de Cobro de Pólizas Liberadas
                  </h3>
                  <IonBadge color="primary">
                    {guia.resumen.tramitadas} / {guia.resumen.total} Tramitadas
                  </IonBadge>
                </div>

                {guia.polizas.length === 0 ? (
                  <div
                    style={{
                      padding: '24px',
                      backgroundColor: 'var(--ion-card-background, var(--ion-item-background))',
                      borderRadius: '12px',
                      border: '1px solid var(--ion-color-step-150, #cbd5e1)',
                      color: 'var(--ion-color-step-600, #64748b)',
                      fontSize: '0.9rem',
                      textAlign: 'center',
                    }}
                  >
                    {guia.mensaje || 'Aún no tienes pólizas liberadas tras una apertura aprobada.'}
                  </div>
                ) : (
                  guia.polizas.map((pol) => (
                    <div
                      key={pol.id_poliza}
                      style={{
                        backgroundColor: 'var(--ion-card-background, var(--ion-item-background))',
                        color: 'var(--ion-text-color)',
                        borderRadius: '12px',
                        border: '1px solid var(--ion-color-step-150, #cbd5e1)',
                        padding: '18px 22px',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '700' }}>
                            {pol.aseguradora} — {pol.tipo_seguro}
                          </h4>
                          <p style={{ margin: '0 0 4px 0', fontSize: '0.84rem', color: 'var(--ion-color-step-600, #64748b)' }}>
                            Titular: <strong>{pol.nombre_titular}</strong> | N° Póliza: <strong>{pol.numero_poliza}</strong> | Monto:{' '}
                            <strong>{dinero(pol.monto_referencial)}</strong>
                          </p>
                          <p style={{ margin: '0 0 8px 0', fontSize: '0.82rem', color: 'var(--ion-color-step-600, #64748b)' }}>
                            📍 Ubicación documento: {pol.ubicacion_fisica}
                          </p>
                          {pol.contacto && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.8rem', marginTop: '6px' }}>
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
                                <a href={pol.contacto.web} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
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
                          <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>
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
    </IonPage>
  );
};

export default Guia;
