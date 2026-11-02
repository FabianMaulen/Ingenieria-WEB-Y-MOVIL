import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent
} from '@ionic/react';
import AppMenu from '../components/AppMenu';

export const Guia: React.FC = () => {
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
              Guía y Protocolo de Cobro
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': '#f8fafc' } as any} className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', padding: '0 12px' }}>
            <div style={{
              width: '100%',
              maxWidth: '650px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)',
              padding: '36px 40px'
            }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#2563eb', margin: '0 0 20px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                ¿Cómo funciona Baúl Eterno?
              </h2>

              <ol style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.7', paddingLeft: '20px', margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <li style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#0f172a' }}>Confirmación de Presencia (Check-in):</strong> Ingresa periódicamente para renovar el contador de vigencia.
                </li>
                <li style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#0f172a' }}>Carga de Pólizas e Inventario:</strong> Registra la documentación y credenciales bajo custodia cifrada.
                </li>
                <li>
                  <strong style={{ color: '#0f172a' }}>Albaceas:</strong> Designa contactos que podrán solicitar la apertura adjuntando el certificado de defunción.
                </li>
              </ol>
            </div>
          </div>
        </IonContent>
      </IonPage>
    </>
  );
};

export default Guia;