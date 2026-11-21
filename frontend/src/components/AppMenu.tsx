import React, { useEffect, useState, useCallback } from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonAvatar,
  IonBadge,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import {
  homeOutline,
  shieldCheckmarkOutline,
  peopleOutline,
  mailOutline,
  settingsOutline,
  logOutOutline,
  helpCircleOutline,
  folderOpenOutline,
  documentAttachOutline,
} from 'ionicons/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, ModoApp, usuarioGuardado } from '../services/auth.service';
import { obtenerDesignaciones } from '../services/guia.service';

export const AppMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [nombre, setNombre] = useState<string>('Usuario');
  const [modo, setModo] = useState<ModoApp>(
    (localStorage.getItem('modo_activo') as ModoApp) || 'TITULAR'
  );
  const [tieneDesignaciones, setTieneDesignaciones] = useState<boolean>(false);
  const [pendientes, setPendientes] = useState<number>(0);

  const cargarContextoUsuario = useCallback(async () => {
    const usuario = usuarioGuardado();
    const nombreGuardado = usuario?.nombre || localStorage.getItem('user_nombre');
    if (nombreGuardado) setNombre(nombreGuardado);

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const designaciones = await obtenerDesignaciones();
      const total = Array.isArray(designaciones) ? designaciones.length : 0;
      const cantPendientes = (Array.isArray(designaciones) ? designaciones : []).filter(
        (d) => d.estado_validacion === 'PENDIENTE'
      ).length;

      setTieneDesignaciones(total > 0);
      setPendientes(cantPendientes);

      if (total === 0 && localStorage.getItem('modo_activo') === 'ALBACEA') {
        localStorage.setItem('modo_activo', 'TITULAR');
        setModo('TITULAR');
      }
    } catch {
      // Si falla la consulta de designaciones, mantenemos el estado previo sin interrumpir la navegación
      if (usuario?.es_albacea) {
        setTieneDesignaciones(true);
        setPendientes(usuario.designaciones_pendientes || 0);
      }
    }
  }, []);

  useEffect(() => {
    cargarContextoUsuario();
  }, [cargarContextoUsuario]);

  useEffect(() => {
    const refrescar = () => {
      cargarContextoUsuario();
    };
    window.addEventListener('auth-updated', refrescar);
    window.addEventListener('designaciones-actualizadas', refrescar);
    return () => {
      window.removeEventListener('auth-updated', refrescar);
      window.removeEventListener('designaciones-actualizadas', refrescar);
    };
  }, [cargarContextoUsuario]);

  // Sincroniza visualmente el selector si el usuario navega directamente a rutas de Albacea
  useEffect(() => {
    if (location.pathname === '/guia' || location.pathname === '/apertura') {
      setModo('ALBACEA');
      localStorage.setItem('modo_activo', 'ALBACEA');
    }
  }, [location.pathname]);

  const handleCambioModo = (nuevoModo: ModoApp) => {
    setModo(nuevoModo);
    localStorage.setItem('modo_activo', nuevoModo);
    if (nuevoModo === 'ALBACEA') {
      navigate('/guia');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const inicial = nombre.charAt(0).toUpperCase();
  const enModoAlbacea = modo === 'ALBACEA';

  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>{enModoAlbacea ? 'Panel Albacea' : 'Mi Baúl'}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Cabecera con datos del Usuario Activo */}
        <div
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--ion-color-step-100, #f8fafc)',
            borderBottom: '1px solid var(--ion-color-step-200, #e2e8f0)',
            color: 'var(--ion-text-color, #0f172a)',
          }}
        >
          <IonAvatar
            style={{
              width: '42px',
              height: '42px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              flexShrink: 0,
            }}
          >
            {inicial}
          </IonAvatar>

          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: '600',
                color: 'var(--ion-text-color)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {nombre}
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                opacity: 0.75,
                color: 'var(--ion-text-color)',
              }}
            >
              {enModoAlbacea ? 'Modo Albacea' : 'Modo Titular'}
            </span>
          </div>
        </div>

        {/* Selector de Modo Dual (visible cuando el usuario posee designaciones en DIRECTORIO_ALBACEAS) */}
        {tieneDesignaciones && (
          <div
            style={{
              padding: '12px 12px 8px 12px',
              borderBottom: '1px solid var(--ion-color-step-200, #e2e8f0)',
            }}
          >
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--ion-color-step-600, #64748b)',
                marginBottom: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Cambiar contexto</span>
              {pendientes > 0 && (
                <IonBadge color="warning" style={{ fontSize: '0.68rem' }}>
                  {pendientes} nueva{pendientes > 1 ? 's' : ''}
                </IonBadge>
              )}
            </div>
            <IonSegment
              value={modo}
              onIonChange={(e) => {
                const val = e.detail.value as ModoApp;
                if (val === 'TITULAR' || val === 'ALBACEA') {
                  handleCambioModo(val);
                }
              }}
            >
              <IonSegmentButton value="TITULAR" style={{ minHeight: '32px' }}>
                <IonLabel style={{ fontSize: '0.72rem', fontWeight: '600' }}>Mi Baúl</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="ALBACEA" style={{ minHeight: '32px' }}>
                <IonLabel style={{ fontSize: '0.72rem', fontWeight: '600' }}>Albacea</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>
        )}

        <IonList lines="none" style={{ background: 'transparent' }}>
          <IonMenuToggle autoHide={false}>
            {/* Opciones de Mi Baúl (Titular) */}
            {!enModoAlbacea && (
              <>
                <IonItem button onClick={() => navigate('/dashboard')}>
                  <IonIcon slot="start" icon={homeOutline} />
                  <IonLabel>Inicio (Resumen)</IonLabel>
                </IonItem>

                <IonItem button onClick={() => navigate('/polizas')}>
                  <IonIcon slot="start" icon={shieldCheckmarkOutline} />
                  <IonLabel>Pólizas y Seguros</IonLabel>
                </IonItem>

                <IonItem button onClick={() => navigate('/inventario')}>
                  <IonIcon slot="start" icon={folderOpenOutline} />
                  <IonLabel>Inventario Digital</IonLabel>
                </IonItem>

                <IonItem button onClick={() => navigate('/albaceas')}>
                  <IonIcon slot="start" icon={peopleOutline} />
                  <IonLabel>Albaceas Designados</IonLabel>
                </IonItem>

                <IonItem button onClick={() => navigate('/mensajes')}>
                  <IonIcon slot="start" icon={mailOutline} />
                  <IonLabel>Mensajes Póstumos</IonLabel>
                </IonItem>
              </>
            )}

            {/* Opciones de Panel Albacea */}
            {enModoAlbacea && (
              <>
                <IonItem button onClick={() => navigate('/guia')}>
                  <IonIcon slot="start" icon={helpCircleOutline} />
                  <IonLabel>Guía y Designaciones</IonLabel>
                  {pendientes > 0 && (
                    <IonBadge slot="end" color="warning">
                      {pendientes}
                    </IonBadge>
                  )}
                </IonItem>

                <IonItem button onClick={() => navigate('/apertura')}>
                  <IonIcon slot="start" icon={documentAttachOutline} />
                  <IonLabel>Solicitar Apertura</IonLabel>
                </IonItem>
              </>
            )}

            {/* Opciones Comunes */}
            <IonItem button onClick={() => navigate('/configuracion')}>
              <IonIcon slot="start" icon={settingsOutline} />
              <IonLabel>Ajustes</IonLabel>
            </IonItem>

            <IonItem button onClick={handleLogout} style={{ marginTop: '16px' }}>
              <IonIcon slot="start" icon={logOutOutline} color="danger" />
              <IonLabel color="danger">Cerrar Sesión</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default AppMenu;
