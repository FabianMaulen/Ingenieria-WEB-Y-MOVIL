import React, { useEffect, useState, useCallback } from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonBadge,
  IonAlert,
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
  pulseOutline,
  personCircleOutline,
  warningOutline,
  headsetOutline,
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [esAdmin, setEsAdmin] = useState<boolean>(false);
  const [modo, setModo] = useState<ModoApp>(() => {
    const rol = localStorage.getItem('user_rol');
    const guardado = localStorage.getItem('modo_activo') as ModoApp | null;
    if (guardado) return guardado;
    return rol === 'ADMIN' ? 'ADMIN' : 'TITULAR';
  });
  const [tieneDesignaciones, setTieneDesignaciones] = useState<boolean>(false);
  const [pendientes, setPendientes] = useState<number>(0);
  const [confirmarLogout, setConfirmarLogout] = useState<boolean>(false);

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
    setAvatarUrl(usuario?.avatar_url || null);
    const admin = rolGuardado === 'ADMIN';
    setEsAdmin(admin);

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
        const fallbackModo: ModoApp = admin ? 'ADMIN' : 'TITULAR';
        localStorage.setItem('modo_activo', fallbackModo);
        setModo(fallbackModo);
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

  // Sincronización bidireccional de contexto con la ruta actual
  useEffect(() => {
    if (location.pathname === '/admin') {
      setModo('ADMIN');
      localStorage.setItem('modo_activo', 'ADMIN');
    } else if (RUTAS_ALBACEA.includes(location.pathname)) {
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
    if (nuevoModo === 'ADMIN') {
      await navegarYcerrar('/admin?tab=resumen');
    } else if (nuevoModo === 'ALBACEA') {
      await navegarYcerrar('/guia');
    } else {
      await navegarYcerrar('/dashboard');
    }
  };

  const ejecutarLogout = async () => {
    setConfirmarLogout(false);
    await cerrarMenu();
    logout();
    navigate('/login', { replace: true });
  };

  const inicial = nombre.charAt(0).toUpperCase();
  const enModoAdmin = esAdmin && modo === 'ADMIN';
  const enModoAlbacea = modo === 'ALBACEA';
  const tabAdminActual = new URLSearchParams(location.search).get('tab') || 'resumen';

  const rutaActiva = (path: string) => (location.pathname === path ? 'be-menu-active' : '');
  const adminTabActivo = (tab: string) =>
    location.pathname === '/admin' && tabAdminActual === tab ? 'be-menu-active' : '';

  const modosDisponibles: { id: ModoApp; label: string }[] = [];
  if (esAdmin) modosDisponibles.push({ id: 'ADMIN', label: 'Admin' });
  modosDisponibles.push({ id: 'TITULAR', label: 'Mi Baúl' });
  if (tieneDesignaciones) modosDisponibles.push({ id: 'ALBACEA', label: 'Albacea' });

  const estiloItemCompacto = { '--min-height': '40px' } as React.CSSProperties;

  return (
    <IonMenu contentId="main-content" type="overlay">
      <IonHeader className="ion-no-border">
        <IonToolbar
          style={
            {
              '--background': 'var(--ion-toolbar-background)',
              '--color': 'var(--ion-toolbar-color)',
              '--min-height': '52px',
              borderBottom: '1px solid rgba(216, 163, 85, 0.18)',
            } as React.CSSProperties
          }
        >
          <IonTitle style={{ fontFamily: 'var(--be-font-serif)', fontSize: '1.08rem', fontWeight: 700 }}>
            {enModoAdmin ? 'Consola Admin' : enModoAlbacea ? 'Panel Albacea' : 'Baúl Eterno'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Cabecera compacta unificada: perfil + selector inline sin desperdiciar altura */}
        <div
          style={{
            padding: '10px 11px',
            margin: '10px 10px 6px',
            borderRadius: '13px',
            backgroundColor: 'var(--be-surface-alt)',
            border: '1px solid var(--be-border)',
            color: 'var(--be-text)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={nombre}
                referrerPolicy="no-referrer"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  flexShrink: 0,
                  border: '1px solid var(--be-border)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: enModoAdmin
                    ? 'linear-gradient(135deg, #334155 0%, #1e293b 100%)'
                    : enModoAlbacea
                    ? 'linear-gradient(135deg, #6d4b33 0%, #9b704e 100%)'
                    : 'linear-gradient(135deg, #194580 0%, #2d6ec2 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--be-font-serif)',
                  fontWeight: 700,
                  fontSize: '0.96rem',
                  flexShrink: 0,
                }}
              >
                {inicial}
              </div>
            )}

            <div style={{ minWidth: 0, flex: 1 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '0.86rem',
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
                  display: 'block',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: enModoAdmin
                    ? 'var(--be-primary)'
                    : enModoAlbacea
                    ? 'var(--be-accent)'
                    : 'var(--be-text-muted)',
                }}
              >
                {enModoAdmin
                  ? 'Administrador'
                  : enModoAlbacea
                  ? 'Custodia Albacea'
                  : 'Titular de Bóveda'}
              </span>
            </div>

            {pendientes > 0 && (
              <IonBadge color="warning" style={{ fontSize: '0.66rem', flexShrink: 0 }}>
                {pendientes}
              </IonBadge>
            )}
          </div>

          {/* Selector compacto de rol/contexto dentro de la misma tarjeta */}
          {modosDisponibles.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '4px',
                marginTop: '9px',
                padding: '3px',
                borderRadius: '9px',
                backgroundColor: 'var(--be-surface)',
                border: '1px solid var(--be-border)',
              }}
            >
              {modosDisponibles.map((m) => {
                const activo = modo === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (!activo) handleCambioModo(m.id);
                    }}
                    style={{
                      flex: 1,
                      padding: '5px 4px',
                      fontSize: '0.71rem',
                      fontWeight: 700,
                      borderRadius: '7px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: activo ? 'var(--be-primary)' : 'transparent',
                      color: activo ? '#ffffff' : 'var(--be-text-muted)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <IonList lines="none" style={{ paddingTop: '2px', paddingBottom: '4px' }}>
          {/* MENÚ DEDICADO PARA ADMINISTRADOR */}
          {enModoAdmin && (
            <>
              <IonItem
                button
                style={estiloItemCompacto}
                className={adminTabActivo('resumen')}
                onClick={() => navegarYcerrar('/admin?tab=resumen')}
              >
                <IonIcon slot="start" icon={analyticsOutline} />
                <IonLabel>Resumen y Alertas</IonLabel>
              </IonItem>

              <IonItem
                button
                style={estiloItemCompacto}
                className={adminTabActivo('solicitudes')}
                onClick={() => navegarYcerrar('/admin?tab=solicitudes')}
              >
                <IonIcon slot="start" icon={documentAttachOutline} />
                <IonLabel>Solicitudes Albaceas</IonLabel>
              </IonItem>

              <IonItem
                button
                style={estiloItemCompacto}
                className={adminTabActivo('reportes')}
                onClick={() => navegarYcerrar('/admin?tab=reportes')}
              >
                <IonIcon slot="start" icon={warningOutline} />
                <IonLabel>Reportes Familiares</IonLabel>
              </IonItem>

              <IonItem
                button
                style={estiloItemCompacto}
                className={adminTabActivo('tickets')}
                onClick={() => navegarYcerrar('/admin?tab=tickets')}
              >
                <IonIcon slot="start" icon={headsetOutline} />
                <IonLabel>Tickets de Soporte</IonLabel>
              </IonItem>

              <IonItem
                button
                style={estiloItemCompacto}
                className={adminTabActivo('usuarios')}
                onClick={() => navegarYcerrar('/admin?tab=usuarios')}
              >
                <IonIcon slot="start" icon={personCircleOutline} />
                <IonLabel>Gestión de Usuarios</IonLabel>
              </IonItem>

              <IonItem
                button
                style={estiloItemCompacto}
                className={adminTabActivo('auditoria')}
                onClick={() => navegarYcerrar('/admin?tab=auditoria')}
              >
                <IonIcon slot="start" icon={pulseOutline} />
                <IonLabel>Bitácora Auditoría</IonLabel>
              </IonItem>
            </>
          )}

          {/* MENÚ TITULAR */}
          {!enModoAdmin && !enModoAlbacea && (
            <>
              <IonItem
                button
                style={estiloItemCompacto}
                className={rutaActiva('/dashboard')}
                onClick={() => navegarYcerrar('/dashboard')}
              >
                <IonIcon slot="start" icon={homeOutline} />
                <IonLabel>Resumen del Baúl</IonLabel>
              </IonItem>

              <IonItem
                button
                style={estiloItemCompacto}
                className={rutaActiva('/polizas')}
                onClick={() => navegarYcerrar('/polizas')}
              >
                <IonIcon slot="start" icon={shieldCheckmarkOutline} />
                <IonLabel>Pólizas y Seguros</IonLabel>
              </IonItem>

              <IonItem
                button
                style={estiloItemCompacto}
                className={rutaActiva('/inventario')}
                onClick={() => navegarYcerrar('/inventario')}
              >
                <IonIcon slot="start" icon={folderOpenOutline} />
                <IonLabel>Inventario Digital</IonLabel>
              </IonItem>

              <IonItem
                button
                style={estiloItemCompacto}
                className={rutaActiva('/albaceas')}
                onClick={() => navegarYcerrar('/albaceas')}
              >
                <IonIcon slot="start" icon={peopleOutline} />
                <IonLabel>Albaceas</IonLabel>
              </IonItem>

              <IonItem
                button
                style={estiloItemCompacto}
                className={rutaActiva('/mensajes')}
                onClick={() => navegarYcerrar('/mensajes')}
              >
                <IonIcon slot="start" icon={mailOutline} />
                <IonLabel>Mensajes Póstumos</IonLabel>
              </IonItem>
            </>
          )}

          {/* MENÚ ALBACEA */}
          {!enModoAdmin && enModoAlbacea && (
            <>
              <IonItem
                button
                style={estiloItemCompacto}
                className={rutaActiva('/guia')}
                onClick={() => navegarYcerrar('/guia')}
              >
                <IonIcon slot="start" icon={helpCircleOutline} />
                <IonLabel>Guía y Designaciones</IonLabel>
                {pendientes > 0 && (
                  <IonBadge slot="end" color="warning">
                    {pendientes}
                  </IonBadge>
                )}
              </IonItem>

              <IonItem
                button
                style={estiloItemCompacto}
                className={rutaActiva('/apertura')}
                onClick={() => navegarYcerrar('/apertura')}
              >
                <IonIcon slot="start" icon={documentAttachOutline} />
                <IonLabel>Solicitar Apertura</IonLabel>
              </IonItem>
            </>
          )}
        </IonList>
      </IonContent>

      {/* Pie fijo siempre visible sin necesidad de scroll */}
      <IonFooter
        className="ion-no-border"
        style={{
          borderTop: '1px solid var(--be-border)',
          backgroundColor: 'var(--be-surface)',
          padding: '4px 0 6px',
        }}
      >
        <IonList lines="none" style={{ padding: 0, background: 'transparent' }}>
          <IonItem
            button
            style={estiloItemCompacto}
            className={rutaActiva('/configuracion')}
            onClick={() => navegarYcerrar('/configuracion')}
          >
            <IonIcon slot="start" icon={settingsOutline} />
            <IonLabel>Ajustes y Clave</IonLabel>
          </IonItem>

          <IonItem button style={estiloItemCompacto} onClick={() => setConfirmarLogout(true)}>
            <IonIcon slot="start" icon={logOutOutline} color="danger" />
            <IonLabel color="danger">Cerrar Sesión</IonLabel>
          </IonItem>
        </IonList>
      </IonFooter>

      <IonAlert
        isOpen={confirmarLogout}
        onDidDismiss={() => setConfirmarLogout(false)}
        header="¿Cerrar sesión?"
        message="Tu bóveda permanecerá sellada y deberás volver a iniciar sesión para acceder."
        buttons={[
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Cerrar sesión', role: 'confirm', handler: () => ejecutarLogout() },
        ]}
      />
    </IonMenu>
  );
};

export default AppMenu;
