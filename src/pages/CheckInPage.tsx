import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/react';
import { checkmarkCircleOutline } from 'ionicons/icons';

export const CheckInPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Vigencia de Bóveda</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="dashboard-content">
        <div className="page-container">
          
          <div className="custom-card text-center" style={{ textAlign: 'center', padding: '32px 20px' }}>
            <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '64px', color: '#10b981', marginBottom: '12px' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>Bóveda Operativa</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '4px' }}>Última validación registrada: <strong>15/08/2026</strong></p>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '24px' }}>Confirma periódicamente para evitar la activación involuntaria.</p>
            
            <IonButton
              expand="block"
              style={{
                '--background': '#2563eb',
                '--border-radius': '8px',
                fontWeight: 600
              } as React.CSSProperties}
            >
              Confirmar Vigencia
            </IonButton>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default CheckInPage;