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
  useIonViewWillEnter
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

// Conexión con los servicios
import { mensajeError } from '../services/api';
import { renovarCheckin } from '../services/checkin.service';
import { listarAlertas, cancelarSolicitud } from '../services/solicitudes.service';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [nombreTitular, setNombreTitular] = useState('Usuario');
  const [daysLeft, setDaysLeft] = useState(140);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [cargandoCheckin, setCargandoCheckin] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Se ejecuta cada vez que la vista entra en pantalla
  useIonViewWillEnter(() => {
    const rol = localStorage.getItem('user_rol');
    
    if (rol === 'ALBACEA') {
      navigate('/guia', { replace: true });
      return;
    }

    setNombreTitular(localStorage.getItem('user_nombre') || 'Usuario');
    cargarAlertasPendientes();
  });

  const cargarAlertasPendientes = async () => {
    try {
      const data = await listarAlertas();
      setAlertas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar alertas:', mensajeError(error));
    }
  };

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

  const handleCancelarApertura = async (idSolicitud: number) => {
    try {
      await cancelarSolicitud(idSolicitud);
      setToastMsg('La solicitud de apertura ha sido cancelada exitosamente.');
      setShowToast(true);
      cargarAlertasPendientes();
    } catch (error) {
      setToastMsg(mensajeError(error));
      setShowToast(true);
    }
  };

  return (
    <IonPage id="main-content">
      <HeaderBar title={`Baúl de ${nombreTitular}`} />

      <IonContent className="ion-padding">
        <IonGrid className="ion-no-padding">
          <IonRow>
            <IonCol size="12">
              
              {/* ALERTA DE SEGURIDAD */}
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
                    <p style={{ marginBottom: '12px', fontWeight: '500', color: '#fff' }}>
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

              {/* Tarjeta de Check-in */}
              <VaultStatusCard 
                daysLeft={daysLeft} 
                status="PROTEGIDA" 
                onCheckin={handleCheckin} 
              />

              {/* Grid de Pólizas y Albaceas */}
              <IonRow>
                <IonCol size="6">
                  <IonCard 
                    className="ion-no-margin ion-margin-bottom" 
                    style={{ 
                      height: '90%',
                      backgroundColor: 'var(--ion-card-background, #ffffff)',
                      color: 'var(--ion-text-color, #0f172a)'
                    }}
                  >
                    <IonCardHeader className="ion-no-padding ion-padding-top ion-padding-horizontal">
                      <IonCardSubtitle style={{ fontSize: '0.75rem', color: 'var(--ion-color-primary, #2563eb)', fontWeight: '600' }}>
                        Patrimonio
                      </IonCardSubtitle>
                      <IonCardTitle style={{ fontSize: '1.2rem', color: 'var(--ion-text-color, #0f172a)', fontWeight: '700' }}>
                        Pólizas
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent className="ion-no-padding ion-padding-horizontal ion-padding-bottom">
                      <p style={{ fontSize: '0.85rem', margin: '6px 0', color: 'var(--ion-text-color, #334155)', opacity: 0.85 }}>
                        Vida, salud y créditos.
                      </p>
                      <IonButton 
                        fill="clear" 
                        size="small" 
                        className="ion-no-padding"
                        onClick={() => navigate('/polizas')}
                        style={{ '--color': 'var(--ion-color-primary, #2563eb)', fontWeight: '600' }}
                      >
                        Ver Bóveda →
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                </IonCol>

                <IonCol size="6">
                  <IonCard 
                    className="ion-no-margin ion-margin-bottom" 
                    style={{ 
                      height: '90%',
                      backgroundColor: 'var(--ion-card-background, #ffffff)',
                      color: 'var(--ion-text-color, #0f172a)'
                    }}
                  >
                    <IonCardHeader className="ion-no-padding ion-padding-top ion-padding-horizontal">
                      <IonCardSubtitle style={{ fontSize: '0.75rem', color: 'var(--ion-color-primary, #2563eb)', fontWeight: '600' }}>
                        Contactos
                      </IonCardSubtitle>
                      <IonCardTitle style={{ fontSize: '1.2rem', color: 'var(--ion-text-color, #0f172a)', fontWeight: '700' }}>
                        Albaceas
                      </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent className="ion-no-padding ion-padding-horizontal ion-padding-bottom">
                      <p style={{ fontSize: '0.85rem', margin: '6px 0', color: 'var(--ion-text-color, #334155)', opacity: 0.85 }}>
                        Contactos validados.
                      </p>
                      <IonButton 
                        fill="clear" 
                        size="small" 
                        className="ion-no-padding"
                        onClick={() => navigate('/albaceas')}
                        style={{ '--color': 'var(--ion-color-primary, #2563eb)', fontWeight: '600' }}
                      >
                        Gestionar →
                      </IonButton>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>

              {/* Tarjeta de Mensajes Sellados */}
              <IonCard 
                className="ion-no-margin ion-margin-bottom"
                style={{
                  backgroundColor: 'var(--ion-card-background, #ffffff)',
                  color: 'var(--ion-text-color, #0f172a)'
                }}
              >
                <IonCardHeader>
                  <IonCardSubtitle style={{ color: 'var(--ion-color-primary, #2563eb)', fontWeight: '600' }}>
                    Memorias y Cartas
                  </IonCardSubtitle>
                  <IonCardTitle style={{ fontSize: '1.2rem', color: 'var(--ion-text-color, #0f172a)', fontWeight: '700' }}>
                    Mensajes Sellados
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ion-text-color, #334155)', opacity: 0.85 }}>
                    Asignados individualmente por RUT. Permanecen bajo custodia cifrada hasta la apertura de la bóveda.
                  </p>
                  <IonButton 
                    fill="outline" 
                    size="small" 
                    className="ion-margin-top"
                    onClick={() => navigate('/mensajes')}
                    style={{ '--color': 'var(--ion-color-primary, #2563eb)', fontWeight: '600' }}
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

      {/* Footer Inferior */}
      <IonFooter>
        <IonToolbar style={{ '--background': 'var(--ion-card-background, #ffffff)', '--color': 'var(--ion-text-color, #0f172a)' }}>
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
              onClick={() => navigate('/dashboard')}
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