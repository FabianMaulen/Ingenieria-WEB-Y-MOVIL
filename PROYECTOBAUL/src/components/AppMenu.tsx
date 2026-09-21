import React from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle
} from '@ionic/react';
import {
  homeOutline,
  shieldCheckmarkOutline,
  peopleOutline,
  mailOutline,
  settingsOutline
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

export const AppMenu: React.FC = () => {
  const navigate = useNavigate();

  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Menú Principal</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonMenuToggle autoHide={false}>
            <IonItem button onClick={() => navigate('/dashboard')}>
              <IonIcon slot="start" icon={homeOutline} />
              <IonLabel>Inicio (Dashboard)</IonLabel>
            </IonItem>

            <IonItem button onClick={() => navigate('/polizas')}>
              <IonIcon slot="start" icon={shieldCheckmarkOutline} />
              <IonLabel>Pólizas y Seguros</IonLabel>
            </IonItem>

            <IonItem button onClick={() => navigate('/dashboard')}>
              <IonIcon slot="start" icon={peopleOutline} />
              <IonLabel>Albaceas Designados</IonLabel>
            </IonItem>

            <IonItem button onClick={() => navigate('/mensajes')}>
              <IonIcon slot="start" icon={mailOutline} />
              <IonLabel>Mensajes Póstumos</IonLabel>
            </IonItem>

            <IonItem button onClick={() => navigate('/dashboard')}>
              <IonIcon slot="start" icon={settingsOutline} />
              <IonLabel>Configuración</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};