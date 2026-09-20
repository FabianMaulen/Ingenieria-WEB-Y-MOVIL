import React from 'react';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonMenuButton, 
  IonButton, 
  IonIcon 
} from '@ionic/react';
import { notificationsOutline, personCircleOutline } from 'ionicons/icons';

interface HeaderBarProps {
  title: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ title }) => {
  return (
    <IonHeader translucent={true}>
      <IonToolbar color="primary">
        {/* Botón hamburguesa que abre la barra lateral */}
        <IonButtons slot="start">
          <IonMenuButton />
        </IonButtons>

        <IonTitle>{title}</IonTitle>

        {/* Iconos de Notificaciones y Perfil */}
        <IonButtons slot="end">
          <IonButton onClick={() => alert('No tienes notificaciones pendientes')}>
            <IonIcon slot="icon-only" icon={notificationsOutline} />
          </IonButton>
          <IonButton onClick={() => alert('Perfil: Roberto Morales')}>
            <IonIcon slot="icon-only" icon={personCircleOutline} />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};