import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonToast,
  IonFooter,
  IonToolbar,
  IonIcon,
  IonLabel,
  IonBadge,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  homeOutline,
  shieldCheckmarkOutline,
  peopleOutline,
  settingsOutline,
  warningOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';
import { VaultStatusCard } from '../components/VaultStatusCard';

import { mensajeError } from '../services/api';
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

  useIonViewWillEnter(() => {
    setNombreTitular(localStorage.getItem('user_nombre') || 'Usuario');
    localStorage.setItem('modo_activo', 'TITULAR');
    cargarDatosDashboard();
  });

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

  // Check-in (RF-04): Confirma actividad del titular y extiende vigencia a 180 días
  const handleCheckin = async () => {
    try {
      setCargandoCheckin(true);
      await renovarCheckin();
      setDaysLeft(180);
      setToastMsg('Presencia confirmada con éxito. Bóveda sellada por un nuevo periodo de 180 días.');
      setShowToast(true);
      await cargarDatosDashboard();
    } catch (error) {
      setToastMsg(mensajeError(error));
      setShowToast(true);
    } finally {
      setCargandoCheckin(false);
    }
  };

  // Frenar proceso de apertura por gracia (RF-06)
  const handleCancelarApertura = async (idSolicitud: number) => {
    try {
      await cancelarSolicitud(idSolicitud);
      setToastMsg('Solicitud de apertura anulada exitosamente. Tu bóveda sigue bajo tu custodia.');
      setShowToast(true);
      await cargarDatosDashboard();
    } catch (error) {
      setToastMsg(mensajeError(error));
      setShowToast(true);
    }
  };

  return (
    <IonPage id="main-content">
      <HeaderBar title={`Bienvenido a tu Baúl, ${nombreTitular}`} />

      <IonContent className="ion-padding">
        <IonGrid className="ion-no-padding" style={{ maxWidth: '900px', margin: '0 auto' }}>
          <IonRow>
            <IonCol size="12">
              {/* ALERTA CRÍTICA DE APERTURA EN CURSO */}
              {alertas.map((alerta) => (
                <IonCard
                  key={alerta.id_solicitud}
                  color="danger"
                  className="ion-margin-bottom"
                  style={{ borderRadius: '14px' }}
                >
                  <IonCardHeader>
                    <IonCardSubtitle
                      style={{ color: '#fff', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <IonIcon icon={warningOutline} style={{ fontSize: '1.2rem' }} />
                      ALERTA DE SEGURIDAD CRÍTICA — PROCESO DE APERTURA DETECTADO
                    </IonCardSubtitle>
                    <IonCardTitle style={{ fontSize: '1.15rem', color: '#fff', fontWeight: '700' }}>
                      Solicitud de Apertura Ingresada
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent color="light">
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        padding: '14px',
                        borderRadius: '8px',
                        marginBottom: '14px',
                        color: '#fff',
                      }}
                    >
                      <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem' }}>
                        <strong>Albacea Solicitante:</strong> RUT {alerta.rut_albacea || 'Contacto registrado'} (
                        {alerta.nombre_albacea || 'Nombre no disponible'})
                      </p>
                      <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem' }}>
                        <strong>Estado del Trámite:</strong> PENDIENTE (En Periodo de Gracia)
                      </p>
                      <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
                        🛡️ <strong>Periodo de Gracia Activo:</strong> Tienes este plazo para anular la apertura si se
                        trata de un error o una prueba.
                      </p>
                    </div>

                    <IonButton
                      expand="block"
                      color="light"
                      disabled={cargandoCheckin}
                      style={{ fontWeight: '700', color: '#dc2626' }}
                      onClick={() => handleCancelarApertura(alerta.id_solicitud)}
                    >
                      ✋ ANULAR SOLICITUD DE APERTURA Y PROTEGER BÓVEDA
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              ))}

              {/* Tarjeta de Estado y Renovación (Check-in) */}
              <VaultStatusCard
                daysLeft={daysLeft}
                status={alertas.length > 0 ? 'EN_REVISION' : 'PROTEGIDA'}
                onCheckin={handleCheckin}
              />

              {/* MÓDULOS DE RESUMEN */}
              <IonRow>
                {/* 1. Pólizas */}
                <IonCol size="12" sizeMd="6">
                  <IonCard
                    className="ion-no-margin ion-margin-bottom"
                    style={{
                      height: '92%',
                      backgroundColor: 'var(--ion-card-background, #ffffff)',
                      color: 'var(--ion-text-color, #0f172a)',
                      borderRadius: '14px',
                      border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                    }}
                  >
                    <IonCardHeader>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <IonCardSubtitle
                          style={{ fontSize: '0.78rem', color: 'var(--ion-color-primary, #2563eb)', fontWeight: '700' }}
                        >
                          PATRIMONIO Y COBERTURAS
                        </IonCardSubtitle>
                        <IonBadge color="primary">{cantPolizas} Guardadas</IonBadge>
                      </div>
                      <IonCardTitle
                        style={{ fontSize: '1.2rem', color: 'var(--ion-text-color, #0f172a)', fontWeight: '700' }}
                      >
                        Pólizas de Seguro
                      </IonCardTitle>
                    </IonCardHeader>

                    <IonCardContent>
                      <p
                        style={{
                          fontSize: '0.88rem',
                          color: 'var(--ion-text-color, #334155)',
                          opacity: 0.85,
                          lineHeight: '1.4',
                          marginBottom: '16px',
                        }}
                      >
                        Mantén tus pólizas de vida, desgravamen y salud centralizadas para que tus beneficiarios no
                        pierdan sus coberturas.
                      </p>

                      <IonButton
                        fill="outline"
                        size="small"
                        onClick={() => navigate('/polizas')}
                        style={{ '--color': 'var(--ion-color-primary, #2563eb)', fontWeight: '600' }}
                      >
                        {cantPolizas === 0 ? '+ Agregar Primera Póliza' : 'Gestionar Pólizas →'}
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                {/* 2. Albaceas */}
                <IonCol size="12" sizeMd="6">
                  <IonCard
                    className="ion-no-margin ion-margin-bottom"
                    style={{
                      height: '92%',
                      backgroundColor: 'var(--ion-card-background, #ffffff)',
                      color: 'var(--ion-text-color, #0f172a)',
                      borderRadius: '14px',
                      border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                    }}
                  >
                    <IonCardHeader>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <IonCardSubtitle
                          style={{ fontSize: '0.78rem', color: 'var(--ion-color-primary, #2563eb)', fontWeight: '700' }}
                        >
                          CONTACTOS AUTORIZADOS
                        </IonCardSubtitle>
                        <IonBadge color={cantAlbaceas > 0 ? 'success' : 'warning'}>
                          {cantAlbaceas} / 3 Designados
                        </IonBadge>
                      </div>
                      <IonCardTitle
                        style={{ fontSize: '1.2rem', color: 'var(--ion-text-color, #0f172a)', fontWeight: '700' }}
                      >
                        Albaceas Designados
                      </IonCardTitle>
                    </IonCardHeader>

                    <IonCardContent>
                      <p
                        style={{
                          fontSize: '0.88rem',
                          color: 'var(--ion-text-color, #334155)',
                          opacity: 0.85,
                          lineHeight: '1.4',
                          marginBottom: '16px',
                        }}
                      >
                        Asigna hasta 3 personas de confianza (incluso si aún no crean cuenta) para custodiar tu legado.
                      </p>

                      <IonButton
                        fill="outline"
                        size="small"
                        onClick={() => navigate('/albaceas')}
                        style={{ '--color': 'var(--ion-color-primary, #2563eb)', fontWeight: '600' }}
                      >
                        {cantAlbaceas === 0 ? '+ Asignar Albacea' : 'Ver Albaceas →'}
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                {/* 3. Inventario Digital */}
                <IonCol size="12" sizeMd="6">
                  <IonCard
                    className="ion-no-margin ion-margin-bottom"
                    style={{
                      height: '92%',
                      backgroundColor: 'var(--ion-card-background, #ffffff)',
                      color: 'var(--ion-text-color, #0f172a)',
                      borderRadius: '14px',
                      border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                    }}
                  >
                    <IonCardHeader>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <IonCardSubtitle
                          style={{ fontSize: '0.78rem', color: 'var(--ion-color-primary, #2563eb)', fontWeight: '700' }}
                        >
                          ACTIVOS Y CUENTAS
                        </IonCardSubtitle>
                        <IonBadge color="tertiary">{cantInventario} Activos</IonBadge>
                      </div>
                      <IonCardTitle
                        style={{ fontSize: '1.2rem', color: 'var(--ion-text-color, #0f172a)', fontWeight: '700' }}
                      >
                        Inventario Patrimonial
                      </IonCardTitle>
                    </IonCardHeader>

                    <IonCardContent>
                      <p
                        style={{
                          fontSize: '0.88rem',
                          color: 'var(--ion-text-color, #334155)',
                          opacity: 0.85,
                          lineHeight: '1.4',
                          marginBottom: '16px',
                        }}
                      >
                        Registra tus plataformas digitales, suscripciones y bienes con instrucciones claras para tu
                        familia.
                      </p>

                      <IonButton
                        fill="outline"
                        size="small"
                        onClick={() => navigate('/inventario')}
                        style={{ '--color': 'var(--ion-color-primary, #2563eb)', fontWeight: '600' }}
                      >
                        {cantInventario === 0 ? '+ Registrar Activo' : 'Ver Inventario →'}
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                {/* 4. Mensajes Póstumos */}
                <IonCol size="12" sizeMd="6">
                  <IonCard
                    className="ion-no-margin ion-margin-bottom"
                    style={{
                      height: '92%',
                      backgroundColor: 'var(--ion-card-background, #ffffff)',
                      color: 'var(--ion-text-color, #0f172a)',
                      borderRadius: '14px',
                      border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                    }}
                  >
                    <IonCardHeader>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <IonCardSubtitle
                          style={{ fontSize: '0.78rem', color: 'var(--ion-color-primary, #2563eb)', fontWeight: '700' }}
                        >
                          CUSTODIA CIFRADA AES-256
                        </IonCardSubtitle>
                        <IonBadge color="medium">{cantMensajes} Cartas Selladas</IonBadge>
                      </div>
                      <IonCardTitle
                        style={{ fontSize: '1.2rem', color: 'var(--ion-text-color, #0f172a)', fontWeight: '700' }}
                      >
                        Mensajes Póstumos
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p
                        style={{
                          fontSize: '0.88rem',
                          color: 'var(--ion-text-color, #334155)',
                          opacity: 0.85,
                          lineHeight: '1.4',
                          marginBottom: '16px',
                        }}
                      >
                        Redacta cartas personales o instrucciones bajo cifrado AES-256 que solo se revelan tras la
                        apertura confirmada.
                      </p>
                      <IonButton
                        fill="solid"
                        color="primary"
                        size="small"
                        onClick={() => navigate('/mensajes')}
                        style={{ fontWeight: '600' }}
                      >
                        {cantMensajes === 0 ? '✍️ Redactar Mensaje' : 'Ver Mensajes Sellados →'}
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={3500}
          color={toastMsg.includes('anulada') ? 'warning' : 'success'}
        />
      </IonContent>

      {/* Footer Inferior Navegable */}
      <IonFooter>
        <IonToolbar
          style={
            {
              '--background': 'var(--ion-card-background, #ffffff)',
              '--color': 'var(--ion-text-color, #0f172a)',
            } as React.CSSProperties
          }
        >
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <IonButton
              fill="clear"
              color="primary"
              style={{ display: 'flex', flexDirection: 'column' }}
              onClick={() => navigate('/dashboard')}
            >
              <IonIcon icon={homeOutline} />
              <IonLabel style={{ fontSize: '0.7rem' }}>Inicio</IonLabel>
            </IonButton>

            <IonButton
              fill="clear"
              style={{ display: 'flex', flexDirection: 'column', '--color': 'var(--ion-text-color)' }}
              onClick={() => navigate('/polizas')}
            >
              <IonIcon icon={shieldCheckmarkOutline} />
              <IonLabel style={{ fontSize: '0.7rem' }}>Pólizas</IonLabel>
            </IonButton>

            <IonButton
              fill="clear"
              style={{ display: 'flex', flexDirection: 'column', '--color': 'var(--ion-text-color)' }}
              onClick={() => navigate('/albaceas')}
            >
              <IonIcon icon={peopleOutline} />
              <IonLabel style={{ fontSize: '0.7rem' }}>Albaceas</IonLabel>
            </IonButton>

            <IonButton
              fill="clear"
              style={{ display: 'flex', flexDirection: 'column', '--color': 'var(--ion-text-color)' }}
              onClick={() => navigate('/configuracion')}
            >
              <IonIcon icon={settingsOutline} />
              <IonLabel style={{ fontSize: '0.7rem' }}>Ajustes</IonLabel>
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default Dashboard;
