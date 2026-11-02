import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonIcon
} from '@ionic/react';
import { personOutline } from 'ionicons/icons';
import AppMenu from '../components/AppMenu';

export const Albaceas: React.FC = () => {
  const albaceas = [
    { id: 1, nombre: 'Carlos Mendoza', rut: '15.482.901-3', estado: 'Confirmado', correo: 'carlos@ejemplo.cl' },
    { id: 2, nombre: 'Mariana Silva', rut: '18.302.114-K', estado: 'Pendiente', correo: 'mariana@ejemplo.cl' }
  ];

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
              Albaceas Designados
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': '#f8fafc' } as any} className="ion-padding">
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '12px 0' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Contactos de Confianza
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Personas autorizadas para solicitar la apertura de la bóveda.
            </p>

            {albaceas.map((a) => (
              <div
                key={a.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                  padding: '20px 24px',
                  marginBottom: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IonIcon icon={personOutline} style={{ fontSize: '1.4rem', color: '#2563eb' }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: '700', fontSize: '1.05rem', color: '#0f172a', margin: '0 0 4px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      {a.nombre}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      RUT: {a.rut} | {a.correo}
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    backgroundColor: a.estado === 'Confirmado' ? '#e6f4ea' : '#fef3c7',
                    color: a.estado === 'Confirmado' ? '#0f9d58' : '#d97706',
                    fontWeight: '700',
                    fontSize: '0.82rem',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                >
                  {a.estado}
                </span>
              </div>
            ))}
          </div>
        </IonContent>
      </IonPage>
    </>
  );
};

export default Albaceas;