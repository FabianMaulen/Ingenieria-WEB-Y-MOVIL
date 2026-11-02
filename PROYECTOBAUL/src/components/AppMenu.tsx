import React from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonMenuToggle
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';

export const AppMenu: React.FC = () => {
  const history = useHistory();
  const location = useLocation();

  const opcionesNavegacion = [
    { titulo: 'Pólizas', ruta: '/polizas' },
    { titulo: 'Albaceas', ruta: '/albaceas' },
    { titulo: 'Mensajes', ruta: '/mensajes' },
    { titulo: 'Inventario', ruta: '/inventario' },
    { titulo: 'Vigencia', ruta: '/dashboard' },
    { titulo: 'Apertura', ruta: '/apertura' },
    { titulo: 'Guía', ruta: '/guia' }
  ];

  const handleLogout = () => {
    localStorage.clear();
    history.replace('/login');
  };

  return (
    <IonMenu 
      contentId="main-content" 
      type="overlay"
      style={{
        '--width': '220px',
        '--min-width': '220px',
        '--max-width': '220px'
      } as any}
    >
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#1b2431', '--color': '#ffffff', paddingLeft: '4px' } as any}>
          <IonTitle style={{ fontWeight: '700', fontSize: '1.05rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Baúl Eterno
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#1b2431', color: '#ffffff' } as any}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '12px 8px' }}>
          <IonList style={{ background: 'transparent', padding: 0 }}>
            {opcionesNavegacion.map((item) => {
              const activa = location.pathname === item.ruta;
              return (
                <IonMenuToggle key={item.ruta} autoHide={false}>
                  <IonItem
                    button
                    onClick={() => history.push(item.ruta)}
                    lines="none"
                    style={{
                      '--background': activa ? '#2563eb' : 'transparent',
                      '--color': activa ? '#ffffff' : '#94a3b8',
                      '--border-radius': '8px',
                      marginBottom: '4px',
                      minHeight: '40px',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    } as any}
                  >
                    <IonLabel style={{ fontSize: '0.88rem', fontWeight: activa ? '600' : '500' }}>
                      {item.titulo}
                    </IonLabel>
                  </IonItem>
                </IonMenuToggle>
              );
            })}
          </IonList>

          <div style={{ padding: '0 8px 12px 8px' }}>
            <IonMenuToggle autoHide={false}>
              <IonItem
                button
                onClick={() => history.push('/perfil')}
                lines="none"
                style={{ '--background': 'transparent', '--color': '#64748b', minHeight: '36px' } as any}
              >
                <IonLabel style={{ fontSize: '0.82rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Perfil</IonLabel>
              </IonItem>
            </IonMenuToggle>

            <IonItem
              button
              onClick={handleLogout}
              lines="none"
              style={{ '--background': 'transparent', '--color': '#ef4444', minHeight: '36px' } as any}
            >
              <IonLabel style={{ fontSize: '0.85rem', fontWeight: '600', fontFamily: 'system-ui, -apple-system, sans-serif' }}>Cerrar Sesión</IonLabel>
            </IonItem>
          </div>
        </div>
      </IonContent>
    </IonMenu>
  );
};

export default AppMenu;