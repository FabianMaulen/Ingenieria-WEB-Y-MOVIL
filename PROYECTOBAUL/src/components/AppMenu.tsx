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
  logOutOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

export const AppMenu: React.FC = () => {
  const history = useHistory();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    history.replace('/login');
  };

  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Baúl Eterno</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonList>
          <IonMenuToggle autoHide={false}>
            <IonItem button onClick={() => history.push('/dashboard')}>
              <IonIcon slot="start" icon={homeOutline} />
              <IonLabel>Inicio (Dashboard)</IonLabel>
            </IonItem>

            <IonItem button onClick={() => history.push('/dashboard')}>

              <IonIcon slot="start" icon={shieldCheckmarkOutline} />
              <IonLabel>Pólizas y Seguros</IonLabel>
            </IonItem>

            <IonItem button onClick={() => history.push('/dashboard')}>
              <IonIcon slot="start" icon={peopleOutline} />
              <IonLabel>Albaceas Designados</IonLabel>
            </IonItem>

            <IonItem button onClick={() => history.push('/dashboard')}>
              <IonIcon slot="start" icon={mailOutline} />
              <IonLabel>Mensajes Póstumos</IonLabel>
            </IonItem>

            <IonItem button onClick={handleLogout} lines="none" className="ion-margin-top">
              <IonIcon slot="start" icon={logOutOutline} color="danger" />
              <IonLabel color="danger">Cerrar Sesión</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};