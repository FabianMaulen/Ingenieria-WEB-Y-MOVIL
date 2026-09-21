import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonInput,
  IonTextarea,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonNote
} from '@ionic/react';

export const MensajesPage: React.FC = () => {
  const [rut, setRut] = useState('');
  const [mensaje, setMensaje] = useState('');

  return (
    <IonPage>
      {}
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#1b222c', '--color': '#ffffff' } as React.CSSProperties}>
          <IonTitle style={{ fontWeight: 600 }}>Mensajes</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding" style={{ '--background': '#f8fafc' } as React.CSSProperties}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          
          {}
          <IonCard style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
            <IonCardHeader>
              <IonCardTitle style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                Redactar Carta
              </IonCardTitle>
            </IonCardHeader>

            <IonCardContent style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {}
              <IonInput
                fill="outline"
                label="RUT Destinatario"
                labelPlacement="floating"
                placeholder="12345678-9"
                value={rut}
                onIonInput={e => setRut(e.detail.value!)}
              />

              {}
              <IonTextarea
                fill="outline"
                label="Mensaje Privado"
                labelPlacement="floating"
                rows={4}
                value={mensaje}
                onIonInput={e => setMensaje(e.detail.value!)}
              />

              {}
              <IonButton
                expand="block"
                style={{
                  '--background': '#2563eb',
                  '--border-radius': '8px',
                  fontWeight: 600,
                  marginTop: '8px'
                } as React.CSSProperties}
              >
                Guardar
              </IonButton>
            </IonCardContent>
          </IonCard>

          {}
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
              Mensajes Guardados
            </h2>

            <IonCard style={{ borderRadius: '12px', margin: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <IonCardContent>
                <IonList lines="none">
                  <IonItem style={{ '--padding-start': '0px' } as React.CSSProperties}>
                    <IonLabel>
                      <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
                        RUT: 20123456-7
                      </h3>
                      <p style={{ color: '#64748b', marginTop: '4px' }}>
                        Carta de despedida y consejos para el futuro.
                      </p>
                      <IonNote style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginTop: '6px' }}>
                        Fecha: 10/09/2026
                      </IonNote>
                    </IonLabel>
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default MensajesPage;