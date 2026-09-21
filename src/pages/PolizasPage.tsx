import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFab, IonFabButton, IonIcon } from '@ionic/react';
import { addOutline } from 'ionicons/icons';

interface Poliza {
  id: string;
  aseguradora: string;
  tipo: string;
  numero: string;
  monto: string;
}

const mockPolizas: Poliza[] = [
  { id: '1', aseguradora: 'Banchile Seguros', tipo: 'Desgravamen Hipotecario', numero: 'POL-99281', monto: '$45.000.000' },
  { id: '2', aseguradora: 'SURA', tipo: 'Seguro de Vida', numero: 'SV-10492', monto: '$20.000.000' },
  { id: '3', aseguradora: 'Consorcio', tipo: 'Automotriz Full', numero: 'SA-55412', monto: '$12.000.000' }
];

export const PolizasPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Pólizas</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="dashboard-content">
        <div className="page-container">
          <div className="section-header">
            <h2>Pólizas Guardadas</h2>
            <p>Instrumentos de protección patrimonial activos en bóveda.</p>
          </div>

          <div className="policy-list">
            {mockPolizas.map((poliza) => (
              <div key={poliza.id} className="policy-card">
                <div className="policy-info">
                  <h3>{poliza.aseguradora}</h3>
                  <p>{poliza.tipo} — N° {poliza.numero}</p>
                </div>
                <div className="amount-badge">
                  {poliza.monto}
                </div>
              </div>
            ))}
          </div>
        </div>

        <IonFab vertical="bottom" horizontal="end" slot="fixed" style={{ margin: '16px' }}>
          <IonFabButton className="custom-fab">
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default PolizasPage;