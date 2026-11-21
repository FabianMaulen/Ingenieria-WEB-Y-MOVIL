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
  // Colores de estado adaptados con alto contraste
  const getStatusColor = () => {
    switch (status) {
      case 'PROTEGIDA':
        return 'var(--ion-color-success, #16a34a)';
      case 'EN_REVISION':
        return 'var(--ion-color-warning, #d97706)';
      case 'LIBERADA':
        return 'var(--ion-color-danger, #dc2626)';
      default:
        return 'var(--ion-color-primary, #2563eb)';
    }
  };

  return (
    <IonCard className="ion-no-margin ion-margin-bottom" style={{
      background: 'var(--ion-card-background, #ffffff)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      borderRadius: '12px'
    }}>
      <IonCardHeader>
        <IonCardSubtitle style={{ 
          color: getStatusColor(), 
          fontWeight: '700',
          letterSpacing: '0.5px'
        }}>
          ESTADO: {status}
        </IonCardSubtitle>
        
        <IonCardTitle style={{ 
          color: 'var(--ion-text-color, #0f172a)',
          fontWeight: '600',
          fontSize: '1.25rem'
        }}>
          Bóveda Patrimonial
        </IonCardTitle>
      </IonCardHeader>

      <IonCardContent>
        <p style={{ 
          marginBottom: '16px', 
          color: 'var(--ion-text-color, #334155)',
          fontSize: '0.95rem',
          lineHeight: '1.5'
        }}>
          Próxima confirmación de actividad requerida en{' '}
          <strong style={{ color: 'var(--ion-text-color, #0f172a)' }}>
            {daysLeft} días
          </strong>.
        </p>
        
        <IonButton 
          expand="block" 
          color="warning" 
          onClick={onCheckin}
          style={{ fontWeight: '600' }}
        >
          Confirmar Presencia (Check-in)
        </IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default VaultStatusCard;