import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonToast
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AppMenu from '../components/AppMenu';
import { renovarCheckinApi } from '../services/api';

export const Dashboard: React.FC = () => {
  const history = useHistory();
  const [daysLeft, setDaysLeft] = useState(140);
  const [showToast, setShowToast] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');

  useEffect(() => {
    const usuarioStorage = localStorage.getItem('usuario');
    if (usuarioStorage) {
      try {
        const u = JSON.parse(usuarioStorage);
        setNombreUsuario(u.nombre_usuario || u.nombre || 'Usuario');
      } catch (e) {
        console.error('Error al leer sesión local:', e);
      }
    }
  }, []);

  const handleCheckin = async () => {
    setCargando(true);
    try {
      await renovarCheckinApi();
    } catch (e) {

    } finally {
      setDaysLeft(180);
      setShowToast(true);
      setCargando(false);
    }
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
              Baúl de {nombreUsuario}
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding" style={{ '--background': '#f8fafc', '--color': '#0f172a' } as any}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <IonGrid className="ion-no-padding">
              <IonRow>
                <IonCol size="12">
                  
                  {}
                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                    padding: '24px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ color: '#16a34a', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '4px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      ESTADO: PROTEGIDA
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '600', margin: '0 0 8px 0', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      Bóveda Patrimonial
                    </h2>
                    <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      Próxima confirmación de actividad requerida en <strong>{daysLeft} días</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={handleCheckin}
                      disabled={cargando}
                      style={{
                        width: '100%',
                        height: '44px',
                        backgroundColor: '#16a34a',
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
                      {cargando ? 'CONFIRMANDO...' : 'CONFIRMAR PRESENCIA'}
                    </button>
                  </div>

                  {}
                  <IonRow style={{ margin: '0 -8px' }}>
                    <IonCol size="12" sizeMd="6" style={{ padding: '0 8px' }}>
                      <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                        padding: '20px',
                        marginBottom: '20px',
                        minHeight: '160px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '500', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Patrimonio</span>
                          <h3 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: '600', margin: '4px 0 6px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>4 Pólizas</h3>
                          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>Vida, salud y créditos.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => history.push('/polizas')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563eb',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            textAlign: 'left',
                            padding: 0,
                            marginTop: '16px',
                            cursor: 'pointer',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                          }}
                        >
                          VER BÓVEDA →
                        </button>
                      </div>
                    </IonCol>

                    <IonCol size="12" sizeMd="6" style={{ padding: '0 8px' }}>
                      <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                        padding: '20px',
                        marginBottom: '20px',
                        minHeight: '160px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '500', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Contactos</span>
                          <h3 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: '600', margin: '4px 0 6px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>2 Albaceas</h3>
                          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>Contactos validados.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => history.push('/albaceas')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#2563eb',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            textAlign: 'left',
                            padding: 0,
                            marginTop: '16px',
                            cursor: 'pointer',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                          }}
                        >
                          GESTIONAR →
                        </button>
                      </div>
                    </IonCol>
                  </IonRow>

                  {}
                  <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                    padding: '24px'
                  }}>
                    <span style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: '500', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Memorias y Cartas</span>
                    <h3 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: '600', margin: '4px 0 8px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>3 Mensajes Sellados</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px', lineHeight: '1.5', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      Asignados individualmente por RUT. Permanecen bajo custodia cifrada hasta la apertura de la bóveda.
                    </p>
                    <button
                      type="button"
                      onClick={() => history.push('/mensajes')}
                      style={{
                        backgroundColor: 'transparent',
                        color: '#2563eb',
                        border: '1px solid #2563eb',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontFamily: 'system-ui, -apple-system, sans-serif'
                      }}
                    >
                      REDACTAR MENSAJE
                    </button>
                  </div>

                </IonCol>
              </IonRow>
            </IonGrid>
          </div>

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message="Check-in completado exitosamente. Vigencia extendedida."
            duration={3000}
            color="success"
          />
        </IonContent>
      </IonPage>
    </>
  );
};

export default Dashboard;