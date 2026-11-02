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

export const Inventario: React.FC = () => {
  const [plataforma, setPlataforma] = useState('');
  const [instruccion, setInstruccion] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [activos, setActivos] = useState([
    { id: 1, servicio: 'Google Drive / Fotos', instruccion: 'Descargar respaldo y cerrar cuenta', tipo: 'Familiar Directo' },
    { id: 2, servicio: 'Instagram', instruccion: 'Convertir cuenta en conmemorativa', tipo: 'Público' },
    { id: 3, servicio: 'Suscripción Spotify', instruccion: 'Cancelar cobro recurrente', tipo: 'Financiero' }
  ]);

  const handleAgregar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plataforma || !instruccion) return;

    const nuevo = {
      id: Date.now(),
      servicio: plataforma,
      instruccion: instruccion,
      tipo: 'General'
    };

    setActivos([nuevo, ...activos]);
    setPlataforma('');
    setInstruccion('');
    setToastMsg('Activo digital agregado correctamente.');
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
              Patrimonio
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': '#f8fafc' } as any} className="ion-padding">
          <div style={{ maxWidth: '800px', margin: '0 auto', padding: '12px 0' }}>
            
            {}
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              padding: '28px 32px',
              marginBottom: '32px'
            }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a', margin: '0 0 20px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Nuevo Activo
              </h2>

              <form onSubmit={handleAgregar}>
                <div style={{ marginBottom: '14px' }}>
                  <input
                    type="text"
                    placeholder="Plataforma (Ej: iCloud, Google Drive)"
                    value={plataforma}
                    onChange={(e) => setPlataforma(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '46px',
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

                <div style={{ marginBottom: '20px' }}>
                  <input
                    type="text"
                    placeholder="Instrucción Póstuma"
                    value={instruccion}
                    onChange={(e) => setInstruccion(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '46px',
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

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    height: '44px',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                >
                  AGREGAR
                </button>
              </form>
            </div>

            {}
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a', marginBottom: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              Inventario Registrado
            </h2>

            {activos.map((a) => (
              <div
                key={a.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
                  padding: '18px 24px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h3 style={{ fontWeight: '700', fontSize: '1.05rem', color: '#0f172a', margin: '0 0 4px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    {a.servicio}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    {a.instruccion}
                  </p>
                </div>

                <span
                  style={{
                    backgroundColor: a.tipo === 'Financiero' ? '#f3e8ff' : '#f1f5f9',
                    color: a.tipo === 'Financiero' ? '#7e22ce' : '#475569',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    whiteSpace: 'nowrap',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                >
                  {a.tipo}
                </span>
              </div>
            ))}
          </div>

          <IonToast
            isOpen={!!toastMsg}
            onDidDismiss={() => setToastMsg('')}
            message={toastMsg}
            duration={3000}
            color="success"
          />
        </IonContent>
      </IonPage>
    </>
  );
};

export default Inventario;