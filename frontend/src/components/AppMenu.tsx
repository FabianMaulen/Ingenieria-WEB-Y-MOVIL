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
  IonBadge,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import { menuController } from '@ionic/core/components';
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
  analyticsOutline,
} from 'ionicons/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, ModoApp, usuarioGuardado } from '../services/auth.service';
import { obtenerDesignaciones } from '../services/guia.service';

const RUTAS_ALBACEA = ['/guia', '/apertura'];
const RUTAS_TITULAR = ['/dashboard', '/polizas', '/inventario', '/albaceas', '/mensajes'];

export const AppMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [nombre, setNombre] = useState<string>('Usuario');
  const [esAdmin, setEsAdmin] = useState<boolean>(false);
  const [modo, setModo] = useState<ModoApp>(
    (localStorage.getItem('modo_activo') as ModoApp) || 'TITULAR'
  );
  const [tieneDesignaciones, setTieneDesignaciones] = useState<boolean>(false);
  const [pendientes, setPendientes] = useState<number>(0);

  const cerrarMenu = async () => {
    try {
      await menuController.close();
    } catch {
      // En escritorio con IonSplitPane fijo, close() es un no-op seguro
    }
  };

  const navegarYcerrar = async (ruta: string) => {
    navigate(ruta);
    await cerrarMenu();
  };

  const cargarContextoUsuario = useCallback(async () => {
    const usuario = usuarioGuardado();
    const nombreGuardado = usuario?.nombre || localStorage.getItem('user_nombre');
    const rolGuardado = usuario?.rol || localStorage.getItem('user_rol');
    if (nombreGuardado) setNombre(nombreGuardado);
    setEsAdmin(rolGuardado === 'ADMIN');

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
    const sincronizarModo = () => {
      const guardado = (localStorage.getItem('modo_activo') as ModoApp) || 'TITULAR';
      setModo(guardado);
    };

    window.addEventListener('auth-updated', refrescar);
    window.addEventListener('designaciones-actualizadas', refrescar);
    window.addEventListener('modo-cambiado', sincronizarModo);
    return () => {
      window.removeEventListener('auth-updated', refrescar);
      window.removeEventListener('designaciones-actualizadas', refrescar);
      window.removeEventListener('modo-cambiado', sincronizarModo);
    };
  }, [cargarContextoUsuario]);

  // Sincronización bidireccional: tanto al pasar a Albacea como al volver a Mi Baúl desde barra inferior
  useEffect(() => {
    if (RUTAS_ALBACEA.includes(location.pathname)) {
      setModo('ALBACEA');
      localStorage.setItem('modo_activo', 'ALBACEA');
    } else if (RUTAS_TITULAR.includes(location.pathname)) {
      setModo('TITULAR');
      localStorage.setItem('modo_activo', 'TITULAR');
    }
  }, [location.pathname]);

  const handleCambioModo = async (nuevoModo: ModoApp) => {
    setModo(nuevoModo);
    localStorage.setItem('modo_activo', nuevoModo);
    window.dispatchEvent(new Event('modo-cambiado'));
    if (nuevoModo === 'ALBACEA') {
      await navegarYcerrar('/guia');
    } else {
      await navegarYcerrar('/dashboard');
    }
  };

  const handleLogout = async () => {
    await cerrarMenu();
    logout();
    navigate('/login', { replace: true });
  };

  const inicial = nombre.charAt(0).toUpperCase();
  const enModoAlbacea = modo === 'ALBACEA';
  const rutaActiva = (path: string) => (location.pathname === path ? 'be-menu-active' : '');

  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonHeader className="ion-no-border">
        <IonToolbar
          style={
            {
              '--background': 'var(--ion-toolbar-background)',
              '--color': 'var(--ion-toolbar-color)',
              '--min-height': '56px',
              borderBottom: '1px solid rgba(216, 163, 85, 0.18)',
            } as React.CSSProperties
          }
        >
          <IonTitle style={{ fontFamily: 'var(--be-font-serif)', fontSize: '1.12rem', fontWeight: 700 }}>
            {enModoAlbacea ? 'Panel Albacea' : 'Baúl Eterno'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Cabecera de perfil */}
        <div
          style={{
            padding: '15px 14px',
            margin: '12px 10px 8px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--be-surface-alt)',
            border: '1px solid var(--be-border)',
            color: 'var(--be-text)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: enModoAlbacea
                ? 'linear-gradient(135deg, #6d4b33 0%, #9b704e 100%)'
                : 'linear-gradient(135deg, #194580 0%, #2d6ec2 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--be-font-serif)',
              fontWeight: 700,
              fontSize: '1.1rem',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.18)',
            }}
          >
            {inicial}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              style={{
                margin: 0,
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--be-text)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {nombre}
            </h3>
            <span
              style={{
                display: 'inline-block',
                marginTop: '2px',
                fontSize: '0.73rem',
                fontWeight: 600,
                color: enModoAlbacea ? 'var(--be-accent)' : 'var(--be-text-muted)',
              }}
            >
              {enModoAlbacea ? 'Custodia como Albacea' : 'Bóveda Personal (Titular)'}
            </span>
          </div>
        </div>

        {/* Selector de Modo Dual sincronizado */}
        {tieneDesignaciones && (
          <div
            style={{
              padding: '8px 12px 12px',
              borderBottom: '1px solid var(--be-border)',
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--be-text-muted)',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Contexto activo</span>
              {pendientes > 0 && (
                <IonBadge color="warning" style={{ fontSize: '0.68rem' }}>
                  {pendientes} pendiente{pendientes > 1 ? 's' : ''}
                </IonBadge>
              )}
            </div>
            <IonSegment
              value={modo}
              style={{ '--background': 'var(--be-surface-alt)' } as React.CSSProperties}
              onIonChange={(e) => {
                const val = e.detail.value as ModoApp;
                if ((val === 'TITULAR' || val === 'ALBACEA') && val !== modo) {
                  handleCambioModo(val);
                }
              }}
            >
              <IonSegmentButton value="TITULAR" style={{ minHeight: '34px' }}>
                <IonLabel style={{ fontSize: '0.74rem', fontWeight: 700 }}>Mi Baúl</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="ALBACEA" style={{ minHeight: '34px' }}>
                <IonLabel style={{ fontSize: '0.74rem', fontWeight: 700 }}>Albacea</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>
        )}

        <IonList lines="none">
          {!enModoAlbacea && (
            <>
              <IonItem button className={rutaActiva('/dashboard')} onClick={() => navegarYcerrar('/dashboard')}>
                <IonIcon slot="start" icon={homeOutline} />
                <IonLabel>Resumen del Baúl</IonLabel>
              </IonItem>

              <IonItem button className={rutaActiva('/polizas')} onClick={() => navegarYcerrar('/polizas')}>
                <IonIcon slot="start" icon={shieldCheckmarkOutline} />
                <IonLabel>Pólizas y Seguros</IonLabel>
              </IonItem>

              <IonItem button className={rutaActiva('/inventario')} onClick={() => navegarYcerrar('/inventario')}>
                <IonIcon slot="start" icon={folderOpenOutline} />
                <IonLabel>Inventario Digital</IonLabel>
              </IonItem>

              <IonItem button className={rutaActiva('/albaceas')} onClick={() => navegarYcerrar('/albaceas')}>
                <IonIcon slot="start" icon={peopleOutline} />
                <IonLabel>Albaceas</IonLabel>
              </IonItem>

              <IonItem button className={rutaActiva('/mensajes')} onClick={() => navegarYcerrar('/mensajes')}>
                <IonIcon slot="start" icon={mailOutline} />
                <IonLabel>Mensajes Póstumos</IonLabel>
              </IonItem>
            </>
          )}

          {enModoAlbacea && (
            <>
              <IonItem button className={rutaActiva('/guia')} onClick={() => navegarYcerrar('/guia')}>
                <IonIcon slot="start" icon={helpCircleOutline} />
                <IonLabel>Guía y Designaciones</IonLabel>
                {pendientes > 0 && (
                  <IonBadge slot="end" color="warning">
                    {pendientes}
                  </IonBadge>
                )}
              </IonItem>

              <IonItem button className={rutaActiva('/apertura')} onClick={() => navegarYcerrar('/apertura')}>
                <IonIcon slot="start" icon={documentAttachOutline} />
                <IonLabel>Solicitar Apertura</IonLabel>
              </IonItem>
            </>
          )}

          <div style={{ height: '1px', backgroundColor: 'var(--be-border)', margin: '10px 6px' }} />

          {esAdmin && (
            <IonItem button className={rutaActiva('/admin')} onClick={() => navegarYcerrar('/admin')}>
              <IonIcon slot="start" icon={analyticsOutline} />
              <IonLabel>Panel Administración</IonLabel>
            </IonItem>
          )}

          <IonItem button className={rutaActiva('/configuracion')} onClick={() => navegarYcerrar('/configuracion')}>
            <IonIcon slot="start" icon={settingsOutline} />
            <IonLabel>Ajustes y Clave</IonLabel>
          </IonItem>

          <IonItem button onClick={handleLogout} style={{ marginTop: '4px' }}>
            <IonIcon slot="start" icon={logOutOutline} color="danger" />
            <IonLabel color="danger">Cerrar Sesión</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default AppMenu;
