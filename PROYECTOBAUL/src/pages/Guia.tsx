import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonSpinner,
  IonToast,
  IonButton,
  IonBadge,
  useIonViewWillEnter
} from '@ionic/react';
import { 
  peopleOutline, 
  mailUnreadOutline, 
  checkmarkCircleOutline, 
  closeCircleOutline, 
  shieldCheckmarkOutline,
  informationCircleOutline
} from 'ionicons/icons';
import AppMenu from '../components/AppMenu';
import { mensajeError, api } from '../services/api';

interface Titularidad {
  id_directorio: number;
  id_usuario_titular: number;
  nombre_titular: string;
  rut_titular: string;
  email_titular?: string;
  estado_designacion: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  fecha_designacion: string;
}

export const Guia: React.FC = () => {
  const [titularidades, setTitularidades] = useState<Titularidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState('');

  const cargarDatosAlbacea = async () => {
    try {
      setCargando(true);
      // Petición al endpoint que lista las designaciones asociadas al albacea autenticado
      const res = await api.get('/albaceas/mis-designaciones').catch(() => ({ data: [] }));
      setTitularidades(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error al cargar solicitudes de albacea:', mensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  useIonViewWillEnter(() => {
    cargarDatosAlbacea();
  });

  const responderSolicitud = async (idDirectorio: number, nuevoEstado: 'ACEPTADA' | 'RECHAZADA') => {
    try {
      setProcesandoId(idDirectorio);
      await api.put(`/albaceas/designacion/${idDirectorio}`, { estado: nuevoEstado });
      setToastMsg(nuevoEstado === 'ACEPTADA' ? 'Designación aceptada exitosamente.' : 'Designación rechazada.');
      await cargarDatosAlbacea();
    } catch (error) {
      setToastMsg(mensajeError(error));
    } finally {
      setProcesandoId(null);
    }
  };

  const solicitudesPendientes = titularidades.filter(t => t.estado_designacion === 'PENDIENTE');
  const titularesAutorizados = titularidades.filter(t => t.estado_designacion === 'ACEPTADA');

  return (
    <>
      <AppMenu />
      <IonPage id="main-content">
        <IonHeader className="ion-no-border">
          <IonToolbar style={{ '--background': 'var(--ion-color-primary, #2563eb)', '--color': '#ffffff' }}>
            <IonButtons slot="start">
              <IonMenuButton color="light" />
            </IonButtons>
            <IonTitle style={{ fontSize: '1.05rem', fontWeight: '700' }}>
              Panel de Custodia y Albaceas
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          <div style={{ maxWidth: '850px', margin: '0 auto', padding: '12px 0' }}>

            {/* Banner Informativo sobre el rol */}
            <div style={{
              backgroundColor: 'var(--ion-color-step-100, rgba(37, 99, 235, 0.08))',
              border: '1px solid var(--ion-color-primary, #2563eb)',
              borderRadius: '14px',
              padding: '20px 24px',
              marginBottom: '28px',
              color: 'var(--ion-text-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <IonIcon icon={informationCircleOutline} style={{ fontSize: '1.4rem', color: 'var(--ion-color-primary, #2563eb)' }} />
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700', color: 'var(--ion-text-color)' }}>
                  Tu Rol como Albacea Registrado
                </h2>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.85, lineHeight: '1.5', color: 'var(--ion-text-color)' }}>
                Como Albacea autorizado, serás el contacto de confianza responsable de iniciar la validación de apertura de la bóveda digital cuando corresponda.
              </p>
            </div>

            {cargando ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <IonSpinner name="crescent" />
              </div>
            ) : (
              <>
                {/* 1. SECCIÓN DE SOLICITUDES PENDIENTES */}
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
                    <div style={{
                      padding: '24px',
                      backgroundColor: 'var(--ion-card-background, var(--ion-item-background))',
                      borderRadius: '12px',
                      border: '1px solid var(--ion-color-step-150, #cbd5e1)',
                      color: 'var(--ion-color-step-600, #64748b)',
                      fontSize: '0.9rem',
                      textAlign: 'center'
                    }}>
                      No tienes solicitudes de nuevos titulares pendientes por responder.
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
                          gap: '14px'
                        }}
                      >
                        <div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '700', color: 'var(--ion-text-color)' }}>
                            {sol.nombre_titular} te ha designado como su Albacea
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--ion-color-step-600, #64748b)' }}>
                            RUT Titular: {sol.rut_titular} | Fecha solicitud: {new Date(sol.fecha_designacion).toLocaleDateString('es-CL')}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                          <IonButton
                            fill="outline"
                            color="danger"
                            size="small"
                            disabled={procesandoId === sol.id_directorio}
                            onClick={() => responderSolicitud(sol.id_directorio, 'RECHAZADA')}
                          >
                            <IonIcon slot="start" icon={closeCircleOutline} />
                            Rechazar
                          </IonButton>

                          <IonButton
                            fill="solid"
                            color="success"
                            size="small"
                            disabled={procesandoId === sol.id_directorio}
                            onClick={() => responderSolicitud(sol.id_directorio, 'ACEPTADA')}
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

                {/* 2. SECCIÓN DE TITULARES AUTORIZADOS */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--ion-text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IonIcon icon={shieldCheckmarkOutline} color="success" />
                      Titulares que Autorizaste Custodiar
                    </h3>
                    <IonBadge color="success">{titularesAutorizados.length} Activos</IonBadge>
                  </div>

                  {titularesAutorizados.length === 0 ? (
                    <div style={{
                      padding: '24px',
                      backgroundColor: 'var(--ion-card-background, var(--ion-item-background))',
                      borderRadius: '12px',
                      border: '1px solid var(--ion-color-step-150, #cbd5e1)',
                      color: 'var(--ion-color-step-600, #64748b)',
                      fontSize: '0.9rem',
                      textAlign: 'center'
                    }}>
                      Aún no has confirmado tu rol de albacea para ningún titular.
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
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '10px',
                            backgroundColor: 'var(--ion-color-step-100, rgba(37, 99, 235, 0.1))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <IonIcon icon={peopleOutline} style={{ fontSize: '1.4rem', color: 'var(--ion-color-primary, #2563eb)' }} />
                          </div>
                          <div>
                            <h4 style={{ margin: '0 0 2px 0', fontSize: '0.98rem', fontWeight: '700', color: 'var(--ion-text-color)' }}>
                              {tit.nombre_titular}
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ion-color-step-600, #64748b)' }}>
                              RUT: {tit.rut_titular} {tit.email_titular ? `| ${tit.email_titular}` : ''}
                            </p>
                          </div>
                        </div>

                        <IonBadge color="success" style={{ padding: '6px 12px', borderRadius: '12px' }}>
                          AUTORIZADO
                        </IonBadge>
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
            duration={3000}
          />
        </IonContent>
      </IonPage>
    </>
  );
};

export default Guia;