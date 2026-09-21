import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonAvatar, IonChip, IonLabel } from '@ionic/react';

export const AlbaceasPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Directorio de Albaceas</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="dashboard-content">
        <div className="page-container">
          <div className="section-header">
            <h2>Contactos de Confianza</h2>
            <p>Personas autorizadas para solicitar la liberación mediante certificado.</p>
          </div>

          <div className="custom-card">
            <div className="contact-item">
              <IonAvatar className="avatar-placeholder">
                <span>CM</span>
              </IonAvatar>
              <div className="contact-info">
                <h3>Camila Morales</h3>
                <p>RUT: 20123456-7 | camila@email.com</p>
              </div>
              <IonChip color="primary">Hija</IonChip>
            </div>

            <div className="contact-item">
              <IonAvatar className="avatar-placeholder">
                <span>MV</span>
              </IonAvatar>
              <div className="contact-info">
                <h3>Marcela Valenzuela</h3>
                <p>RUT: 16987654-3 | marcela@email.com</p>
              </div>
              <IonChip color="primary">Cónyuge</IonChip>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};