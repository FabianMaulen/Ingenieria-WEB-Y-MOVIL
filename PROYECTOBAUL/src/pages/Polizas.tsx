import React, { useState } from 'react';
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
import { add } from 'ionicons/icons';
import AppMenu from '../components/AppMenu';

export const Polizas: React.FC = () => {
  const [listaPolizas] = useState([
    { id: 1, institucion: 'Banchile Seguros', detalle: 'Desgravamen Hipotecario — N° POL-99281', monto: '$45.000.000' },
    { id: 2, institucion: 'SURA', detalle: 'Seguro de Vida — N° SV-10492', monto: '$20.000.000' },
    { id: 3, institucion: 'Consorcio', detalle: 'Automotriz Full — N° SA-55412', monto: '$12.000.000' }
  ]);

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
              Mis Pólizas y Coberturas
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': '#f8fafc' } as any} className="ion-padding">
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '12px 0' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Pólizas Guardadas
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Instrumentos de protección patrimonial activos en bóveda.
            </p>

            {listaPolizas.map((p) => (
              <div 
                key={p.id} 
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
                <div>
                  <h3 style={{ fontWeight: '700', fontSize: '1.05rem', color: '#0f172a', margin: '0 0 4px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    {p.institucion}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    {p.detalle}
                  </p>
                </div>
                <span 
                  style={{ 
                    backgroundColor: '#e6f4ea', 
                    color: '#0f9d58', 
                    fontWeight: '700', 
                    fontSize: '0.85rem', 
                    padding: '8px 16px', 
                    borderRadius: '20px',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                >
                  {p.monto}
                </span>
              </div>
            ))}
          </div>

          {}
          <button
            type="button"
            onClick={() => alert('Formulario para añadir nueva póliza')}
            style={{
              position: 'fixed',
              bottom: '28px',
              right: '28px',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 6px 16px rgba(37, 99, 235, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 999
            }}
          >
            <IonIcon icon={add} style={{ fontSize: '2rem', color: '#ffffff' }} />
          </button>
        </IonContent>
      </IonPage>
    </>
  );
};

export default Polizas;