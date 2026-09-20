import React from 'react';
import { 
  IonCard, 
  IonCardHeader, 
  IonCardSubtitle, 
  IonCardTitle, 
  IonCardContent, 
  IonButton 
} from '@ionic/react';

interface VaultStatusProps {
  daysLeft: number;
  status: 'PROTEGIDA' | 'EN_REVISION' | 'LIBERADA';
  onCheckin: () => void;
}

export const VaultStatusCard: React.FC<VaultStatusProps> = ({ daysLeft, status, onCheckin }) => {
  return (
    <IonCard className="ion-no-margin ion-margin-bottom">
      <IonCardHeader>
        <IonCardSubtitle style={{ color: status === 'PROTEGIDA' ? '#059669' : '#E11D48', fontWeight: 'bold' }}>
          ESTADO: {status}
        </IonCardSubtitle>
        <IonCardTitle>Bóveda Patrimonial</IonCardTitle>
      </IonCardHeader>

      <IonCardContent>
        <p style={{ marginBottom: '12px' }}>
          Próxima confirmación de actividad requerida en <strong>{daysLeft} días</strong>.
        </p>
        <IonButton 
          expand="block" 
          color="warning" 
          onClick={onCheckin}
        >
          Confirmar Presencia (Check-in)
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};