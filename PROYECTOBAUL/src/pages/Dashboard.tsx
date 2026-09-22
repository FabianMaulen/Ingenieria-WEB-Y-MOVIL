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
  IonLabel
} from '@ionic/react';
import {
  homeOutline,
  shieldCheckmarkOutline,
  peopleOutline,
  settingsOutline
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';
import { VaultStatusCard } from '../components/VaultStatusCard';
import { AppMenu } from '../components/AppMenu';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [daysLeft, setDaysLeft] = useState(140);
  const [showToast, setShowToast] = useState(false);

  const handleCheckin = () => {
    setDaysLeft(180);
    setShowToast(true);
  };

  return (
    <>
      {}
      <AppMenu />

      {}
      <IonPage id="main-content">
        <HeaderBar title="Baúl de Roberto" />

        <IonContent className="ion-padding">
          <IonGrid className="ion-no-padding">
            <IonRow>
              <IonCol size="12">
                {}
                <VaultStatusCard 
                  daysLeft={daysLeft} 
                  status="PROTEGIDA" 
                  onCheckin={handleCheckin} 
                />

                {}
                <IonRow>
                  <IonCol size="6">
                    <IonCard className="ion-no-margin ion-margin-bottom" style={{ height: '90%' }}>
                      <IonCardHeader className="ion-no-padding ion-padding-top ion-padding-horizontal">
                        <IonCardSubtitle style={{ fontSize: '0.75rem' }}>Patrimonio</IonCardSubtitle>
                        <IonCardTitle style={{ fontSize: '1.2rem' }}>4 Pólizas</IonCardTitle>
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
                        <IonCardTitle style={{ fontSize: '1.2rem' }}>2 Albaceas</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent className="ion-no-padding ion-padding-horizontal ion-padding-bottom">
                        <p style={{ fontSize: '0.8rem', margin: '6px 0' }}>Contactos validados.</p>
                        <IonButton fill="clear" size="small" className="ion-no-padding">
                          Gestionar →
                        </IonButton>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>

                {}
                <IonCard className="ion-no-margin ion-margin-bottom">
                  <IonCardHeader>
                    <IonCardSubtitle>Memorias y Cartas</IonCardSubtitle>
                    <IonCardTitle style={{ fontSize: '1.2rem' }}>3 Mensajes Sellados</IonCardTitle>
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
            message="Check-in completado exitosamente. Vigencia extendida por 180 días."
            duration={3000}
            color="success"
          />
        </IonContent>

        {}
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
                onClick={() => navigate('/dashboard')}
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