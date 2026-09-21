import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonChip } from '@ionic/react';

export const InventarioDigitalPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Patrimonio</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="dashboard-content">
        <div className="page-container">
          
          <div className="custom-card mb-24">
            <div className="card-header-title">
              <span>Nuevo Activo</span>
            </div>
            <form onSubmit={(e) => e.preventDefault()}>
              <IonInput label="Plataforma (Ej: iCloud, Google Drive)" labelPlacement="floating" fill="outline" className="custom-input" />
              <IonInput label="Instrucción Póstuma" labelPlacement="floating" fill="outline" className="custom-input" />
              <IonButton expand="block" type="submit" className="btn-primary">
                Agregar
              </IonButton>
            </form>
          </div>

          <div className="section-header">
            <h2>Inventario Registrado</h2>
          </div>

          <div className="policy-card">
            <div className="policy-info">
              <h3>Google Drive / Fotos</h3>
              <p>Descargar respaldo y cerrar cuenta</p>
            </div>
            <IonChip color="dark">Familiar Directo</IonChip>
          </div>

          <div className="policy-card">
            <div className="policy-info">
              <h3>Instagram</h3>
              <p>Convertir cuenta en conmemorativa</p>
            </div>
            <IonChip color="medium">Público</IonChip>
          </div>

          <div className="policy-card">
            <div className="policy-info">
              <h3>Suscripción Spotify</h3>
              <p>Cancelar cobro recurrente</p>
            </div>
            <IonChip color="tertiary">Financiero</IonChip>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default InventarioDigitalPage;