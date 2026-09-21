import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCheckbox, IonItem, IonLabel } from '@ionic/react';

export const GuiaCobroPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Guía de Cobro de Seguros</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="dashboard-content">
        <div className="page-container">
          
          <div className="section-header">
            <h2>Gestión de Cobros</h2>
            <p>Marca cada cobertura conforme vayas realizando los trámites correspondientes.</p>
          </div>

          <div className="custom-card">
            <IonItem lines="full">
              <IonCheckbox slot="start" />
              <IonLabel>
                <h3>Banchile Seguros (Desgravamen)</h3>
                <p>Atención Mesa: 600 600 1200</p>
              </IonLabel>
            </IonItem>

            <IonItem lines="full">
              <IonCheckbox slot="start" defaultChecked />
              <IonLabel style={{ textDecoration: 'line-through', opacity: 0.6 }}>
                <h3>SURA (Seguro de Vida)</h3>
                <p>Atención Mesa: 600 411 1000</p>
              </IonLabel>
            </IonItem>

            <IonItem lines="none">
              <IonCheckbox slot="start" />
              <IonLabel>
                <h3>Consorcio (Seguro Automotriz)</h3>
                <p>Atención Mesa: 600 221 0000</p>
              </IonLabel>
            </IonItem>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};