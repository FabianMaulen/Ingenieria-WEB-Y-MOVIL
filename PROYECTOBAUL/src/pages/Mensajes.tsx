import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonToast
} from '@ionic/react';
import AppMenu from '../components/AppMenu';

export const Mensajes: React.FC = () => {
  const [rutDestinatario, setRutDestinatario] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setRutDestinatario('');
    setMensaje('');
  };

  return (
    <>
      <AppMenu />
      <IonPage id="main-content">
        <IonHeader className="ion-no-border">
          <IonToolbar style={{ '--background': '#1b2431', '--color': '#ffffff' } as any}>
            <IonButtons slot="start">
              <IonMenuButton color="light" />
            </IonButtons>
            <IonTitle style={{ fontSize: '1rem', fontWeight: '600', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Mensajes
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': '#f8fafc' } as any} className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh', padding: '20px' }}>
            <div style={{
              width: '100%',
              maxWidth: '650px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)',
              padding: '36px 40px'
            }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0f172a', margin: '0 0 24px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Redactar Carta
              </h2>

              <form onSubmit={handleGuardar}>
                <div style={{ marginBottom: '18px' }}>
                  <input
                    type="text"
                    placeholder="RUT Destinatario"
                    value={rutDestinatario}
                    onChange={(e) => setRutDestinatario(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '48px',
                      padding: '0 16px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.92rem',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <textarea
                    rows={5}
                    placeholder="Mensaje Privado"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.92rem',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    height: '46px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.88rem',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                >
                  GUARDAR
                </button>
              </form>
            </div>
          </div>

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message="Mensaje póstumo guardado bajo custodia cifrada."
            duration={3000}
            color="success"
          />
        </IonContent>
      </IonPage>
    </>
  );
};

export default Mensajes;