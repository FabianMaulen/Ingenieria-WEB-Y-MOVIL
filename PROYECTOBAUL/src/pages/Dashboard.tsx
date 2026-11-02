import React, { useState, useEffect } from 'react';
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
  IonSpinner
} from '@ionic/react';
import {
  homeOutline,
  shieldCheckmarkOutline,
  peopleOutline,
  settingsOutline,
  warningOutline
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';
import { VaultStatusCard } from '../components/VaultStatusCard';
import { AppMenu } from '../components/AppMenu';

// Conexión con los servicios entregados en el zip
import  mensajeError  from '../services/api';
import { renovarCheckin } from '../services/checkin.service';
import { listarAlertas, cancelarSolicitud } from '../services/solicitudes.service';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados dinámicos
  const [nombreTitular, setNombreTitular] = useState('Usuario');
  const [daysLeft, setDaysLeft] = useState(140);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [cargandoCheckin, setCargandoCheckin] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Verificación de seguridad y carga inicial
  useEffect(() => {
    const rol = localStorage.getItem('user_rol');
    
    // Aislamiento estricto de roles: Expulsar si es Albacea
    if (rol === 'ALBACEA') {
      navigate('/guia', { replace: true });
      return;
    }

    setNombreTitular(localStorage.getItem('user_nombre') || 'Usuario');
    cargarAlertasPendientes();
  }, [navigate]);

  // Obtener alertas de seguridad (RF-06)[cite: 4]
  const cargarAlertasPendientes = async () => {
    try {
      const data = await listarAlertas();
      setAlertas(data);
    } catch (error) {
      console.error('Error al cargar alertas:', mensajeError(error));
    }
  };

  // RF-04: Confirmar vigencia[cite: 4]
  const handleCheckin = async () => {
    try {
      setCargandoCheckin(true);
      await renovarCheckin();
      setDaysLeft(180);
      setToastMsg('Check-in completado exitosamente. Vigencia extendida por 180 días.');
      setShowToast(true);
    } catch (error) {
      setToastMsg(mensajeError(error));
      setShowToast(true);
    } finally {
      setCargandoCheckin(false);
    }
  };

  // RF-06: Frenar proceso de apertura por gracia[cite: 4]
  const handleCancelarApertura = async (idSolicitud: number) => {
    try {
      await cancelarSolicitud(idSolicitud);
      setToastMsg('La solicitud de apertura ha sido cancelada exitosamente.');
      setShowToast(true);
      cargarAlertasPendientes(); // Recargar la lista para quitar la alerta
    } catch (error) {
      setToastMsg(mensajeError(error));
      setShowToast(true);
    }
  };

  return (
    <>
      <AppMenu />

      <IonPage id="main-content">
        <HeaderBar title={`Baúl de ${nombreTitular}`} />

        <IonContent className="ion-padding">
          <IonGrid className="ion-no-padding">
            <IonRow>
              <IonCol size="12">
                
                {/* ALERTA DE SEGURIDAD (RF-06) - Solo se muestra si hay aperturas pendientes[cite: 4] */}
                {alertas.map((alerta) => (
                  <IonCard key={alerta.id_solicitud} color="danger" className="ion-margin-bottom">
                    <IonCardHeader>
                      <IonCardSubtitle style={{ color: '#fff' }}>
                        <IonIcon icon={warningOutline} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                        ALERTA DE SEGURIDAD CRÍTICA
                      </IonCardSubtitle>
                      <IonCardTitle style={{ fontSize: '1.1rem', color: '#fff' }}>
                        Solicitud de Apertura en Curso
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                      <p style={{ marginBottom: '12px', fontWeight: '500' }}>
                        El albacea RUT {alerta.rut_albacea} ha solicitado la liberación de tu bóveda. 
                        El proceso de gracia está activo.
                      </p>
                      <IonButton 
                        expand="block" 
                        color="light" 
                        onClick={() => handleCancelarApertura(alerta.id_solicitud)}
                      >
                        ✋ CANCELAR APERTURA
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                ))}

                {/* RF-04: Tarjeta de Check-in de Vigencia[cite: 4] */}
                <VaultStatusCard 
                  daysLeft={daysLeft} 
                  status="PROTEGIDA" 
                  onCheckin={handleCheckin} 
                />

                <IonRow>
                  <IonCol size="6">
                    <IonCard className="ion-no-margin ion-margin-bottom" style={{ height: '90%' }}>
                      <IonCardHeader className="ion-no-padding ion-padding-top ion-padding-horizontal">
                        <IonCardSubtitle style={{ fontSize: '0.75rem' }}>Patrimonio</IonCardSubtitle>
                        <IonCardTitle style={{ fontSize: '1.2rem' }}>Pólizas</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent className="ion-no-padding ion-padding-horizontal ion-padding-bottom">
                        <p style={{ fontSize: '0.8rem', margin: '6px 0' }}>Vida, salud y créditos.</p>
                        <IonButton 
                          fill="clear" 
                          size="small" 
                          className="ion-no-padding"
                          onClick={() => navigate('/polizas')}
                        >
                          Ver Bóveda →
                        </IonButton>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>

                  <IonCol size="6">
                    <IonCard className="ion-no-margin ion-margin-bottom" style={{ height: '90%' }}>
                      <IonCardHeader className="ion-no-padding ion-padding-top ion-padding-horizontal">
                        <IonCardSubtitle style={{ fontSize: '0.75rem' }}>Contactos</IonCardSubtitle>
                        <IonCardTitle style={{ fontSize: '1.2rem' }}>Albaceas</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent className="ion-no-padding ion-padding-horizontal ion-padding-bottom">
                        <p style={{ fontSize: '0.8rem', margin: '6px 0' }}>Contactos validados.</p>
                        <IonButton 
                          fill="clear" 
                          size="small" 
                          className="ion-no-padding"
                          onClick={() => navigate('/albaceas')}
                        >
                          Gestionar →
                        </IonButton>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>

                <IonCard className="ion-no-margin ion-margin-bottom">
                  <IonCardHeader>
                    <IonCardSubtitle>Memorias y Cartas</IonCardSubtitle>
                    <IonCardTitle style={{ fontSize: '1.2rem' }}>Mensajes Sellados</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <p style={{ fontSize: '0.85rem' }}>
                      Asignados individualmente por RUT. Permanecen bajo custodia cifrada hasta la apertura de la bóveda.
                    </p>
                    <IonButton 
                      fill="outline" 
                      size="small" 
                      className="ion-margin-top"
                      onClick={() => navigate('/mensajes')}
                    >
                      Redactar Mensaje
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message={toastMsg}
            duration={3000}
            color={toastMsg.includes('cancelada') ? 'warning' : 'success'}
          />
        </IonContent>

        <IonFooter>
          <IonToolbar color="light">
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
                color="medium" 
                style={{ display: 'flex', flexDirection: 'column' }}
                onClick={() => navigate('/polizas')}
              >
                <IonIcon icon={shieldCheckmarkOutline} />
                <IonLabel style={{ fontSize: '0.7rem' }}>Pólizas</IonLabel>
              </IonButton>

              <IonButton 
                fill="clear" 
                color="medium" 
                style={{ display: 'flex', flexDirection: 'column' }}
                onClick={() => navigate('/albaceas')}
              >
                <IonIcon icon={peopleOutline} />
                <IonLabel style={{ fontSize: '0.7rem' }}>Albaceas</IonLabel>
              </IonButton>

              <IonButton 
                fill="clear" 
                color="medium" 
                style={{ display: 'flex', flexDirection: 'column' }}
                onClick={() => navigate('/dashboard')}
              >
                <IonIcon icon={settingsOutline} />
                <IonLabel style={{ fontSize: '0.7rem' }}>Ajustes</IonLabel>
              </IonButton>
            </div>
          </IonToolbar>
        </IonFooter>
      </IonPage>
    </>
  );
};