import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonPopover,
} from '@ionic/react';
import {
  arrowBackOutline,
  moonOutline,
  sunnyOutline,
  bulbOutline,
  checkmarkCircleOutline,
  chevronForwardOutline,
  sparklesOutline,
  mailOutline,
  shieldCheckmarkOutline,
  peopleOutline,
  folderOpenOutline,
  heartOutline,
  lockClosedOutline,
} from 'ionicons/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { alternarTema, obtenerTemaOscuro } from '../utils/theme';
import { esSoloAlbacea, obtenerPerfil, obtenerToken, Usuario, usuarioGuardado } from '../services/auth.service';

interface HeaderBarProps {
  title?: string;
  showBack?: boolean;
}

interface SugerenciaItem {
  id: string;
  titulo: string;
  descripcion: string;
  ruta: string;
  icon: string;
  completada: boolean;
}

const RUTAS_PRINCIPALES = ['/dashboard', '/guia'];

export const HeaderBar: React.FC<HeaderBarProps> = ({ title, showBack }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isDark, setIsDark] = useState<boolean>(() => obtenerTemaOscuro());
  const [nombreUsuario, setNombreUsuario] = useState<string>('');
  const [perfil, setPerfil] = useState<Usuario | null>(() => usuarioGuardado());
  const [popoverAbierto, setPopoverAbierto] = useState(false);
  const [popoverEvento, setPopoverEvento] = useState<Event | undefined>(undefined);
  const cargandoPerfilRef = useRef(false);

  const esAdmin =
    pathname.startsWith('/admin') ||
    perfil?.rol === 'ADMIN' ||
    localStorage.getItem('modo_activo') === 'ADMIN';
  const ocultarSugerencias = esAdmin || esSoloAlbacea(perfil);

  const sincronizarPerfil = useCallback(async (refrescarServidor = false) => {
    const local = usuarioGuardado();
    if (local) {
      setPerfil(local);
      setNombreUsuario((local.nombre || '').split(' ')[0]);
    } else {
      const savedName = localStorage.getItem('user_nombre');
      if (savedName) setNombreUsuario(savedName.split(' ')[0]);
    }

    if (!refrescarServidor || !obtenerToken() || cargandoPerfilRef.current) return;
    if (local?.rol === 'ADMIN') return;

    try {
      cargandoPerfilRef.current = true;
      const actualizado = await obtenerPerfil();
      setPerfil(actualizado);
      setNombreUsuario((actualizado.nombre || '').split(' ')[0]);
    } catch {
      // Silencioso: no interrumpir la navegación si falla el refresh en segundo plano
    } finally {
      cargandoPerfilRef.current = false;
    }
  }, []);

  useEffect(() => {
    sincronizarPerfil(true);

    const onThemeChange = () => setIsDark(obtenerTemaOscuro());
    const onAuthUpdated = () => sincronizarPerfil(false);
    const onBovedaActualizada = () => sincronizarPerfil(true);

    window.addEventListener('theme-changed', onThemeChange);
    window.addEventListener('auth-updated', onAuthUpdated);
    window.addEventListener('boveda-actualizada', onBovedaActualizada);
    return () => {
      window.removeEventListener('theme-changed', onThemeChange);
      window.removeEventListener('auth-updated', onAuthUpdated);
      window.removeEventListener('boveda-actualizada', onBovedaActualizada);
    };
  }, [sincronizarPerfil]);

  const sugerencias = useMemo<SugerenciaItem[]>(() => {
    if (!perfil || esAdmin) return [];

    const totalPolizas = perfil.total_polizas ?? 0;
    const totalInventario = perfil.total_inventario ?? 0;
    const totalAlbaceas = perfil.total_albaceas ?? 0;
    const totalMensajes = perfil.total_mensajes ?? 0;

    return [
      {
        id: 'activar',
        titulo: 'Activar y sellar tu bóveda personal',
        descripcion: 'Completa el mínimo inicial y confirma tus condiciones para iniciar tu vigencia.',
        ruta: '/dashboard',
        icon: lockClosedOutline,
        completada: Boolean(perfil.boveda_activa),
      },
      {
        id: 'correo_principal',
        titulo: 'Confirmar tu correo principal',
        descripcion: 'Garantiza que las alertas de seguridad y Check-in lleguen siempre a tu bandeja.',
        ruta: '/configuracion',
        icon: mailOutline,
        completada: Boolean(perfil.correo_verificado),
      },
      {
        id: 'correo_alt',
        titulo: 'Agregar un correo alternativo de respaldo',
        descripcion: 'Recibe copias de alerta si alguna vez pierdes acceso a tu correo principal.',
        ruta: '/configuracion',
        icon: mailOutline,
        completada: Boolean(perfil.correo_alternativo),
      },
      {
        id: 'contacto_48h',
        titulo: 'Registrar persona de confianza (aviso 48h)',
        descripcion: 'Recibirá un aviso 48 horas antes de cualquier liberación automática.',
        ruta: '/configuracion',
        icon: heartOutline,
        completada: Boolean(perfil.correo_contacto_confianza),
      },
      {
        id: 'albaceas',
        titulo:
          totalAlbaceas === 0
            ? 'Designar tu primer albacea'
            : `Sumar un segundo albacea de respaldo (${totalAlbaceas}/5)`,
        descripcion: 'Puedes designar hasta 5 personas de confianza para mayor tranquilidad.',
        ruta: '/albaceas',
        icon: peopleOutline,
        completada: totalAlbaceas >= 2,
      },
      {
        id: 'polizas',
        titulo: 'Registrar tus pólizas de seguro',
        descripcion: 'Centraliza vida, salud o desgravamen para que tu familia no pierda beneficios.',
        ruta: '/polizas',
        icon: shieldCheckmarkOutline,
        completada: totalPolizas >= 1,
      },
      {
        id: 'inventario',
        titulo: 'Documentar tu inventario digital y patrimonial',
        descripcion: 'Deja instrucciones claras sobre cuentas, bancos, archivos y suscripciones.',
        ruta: '/inventario',
        icon: folderOpenOutline,
        completada: totalInventario >= 1,
      },
      {
        id: 'mensajes',
        titulo: 'Escribir tus cartas póstumas selladas',
        descripcion: 'Dedica mensajes personales a tus albaceas o a cualquier ser querido por correo.',
        ruta: '/mensajes',
        icon: sparklesOutline,
        completada: totalMensajes >= 1,
      },
    ];
  }, [perfil, esAdmin]);

  const pendientes = useMemo(() => sugerencias.filter((s) => !s.completada), [sugerencias]);
  const porcentajeCompleto = useMemo(() => {
    if (sugerencias.length === 0) return 0;
    const hechas = sugerencias.length - pendientes.length;
    return Math.round((hechas / sugerencias.length) * 100);
  }, [sugerencias.length, pendientes.length]);

  const handleToggleTheme = () => {
    const nuevo = alternarTema();
    setIsDark(nuevo);
  };

  const handleAbrirSugerencias = (e: React.MouseEvent) => {
    setPopoverEvento(e.nativeEvent);
    setPopoverAbierto(true);
    sincronizarPerfil(true);
  };

  const handleIrSugerencia = (ruta: string) => {
    setPopoverAbierto(false);
    if (ruta === '/dashboard') {
      localStorage.setItem('modo_activo', 'TITULAR');
    }
    navigate(ruta);
  };

  const debeMostrarVolver =
    typeof showBack === 'boolean' ? showBack : !RUTAS_PRINCIPALES.includes(pathname);

  const handleVolver = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      const modo = localStorage.getItem('modo_activo');
      navigate(modo === 'ALBACEA' ? '/guia' : '/dashboard');
    }
  };

  const tituloMostrar = title || (nombreUsuario ? `Baúl de ${nombreUsuario}` : 'Baúl Eterno');

  return (
    <IonHeader className="ion-no-border">
      <IonToolbar
        style={
          {
            '--background': 'var(--ion-toolbar-background)',
            '--color': 'var(--ion-toolbar-color)',
            '--min-height': '56px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          } as React.CSSProperties
        }
      >
        <IonButtons slot="start">
          {debeMostrarVolver && (
            <IonButton
              className="be-back-mobile-only"
              onClick={handleVolver}
              aria-label="Volver atrás"
              title="Volver"
            >
              <IonIcon slot="icon-only" icon={arrowBackOutline} />
            </IonButton>
          )}
          <IonMenuButton autoHide={true} />
        </IonButtons>

        <IonTitle style={{ fontSize: '1.02rem', fontWeight: 700 }}>{tituloMostrar}</IonTitle>

        <IonButtons slot="end">
          {!ocultarSugerencias && obtenerToken() && (
            <IonButton
              onClick={handleAbrirSugerencias}
              title="Sugerencias para completar tu Baúl"
              aria-label="Sugerencias para completar tu Baúl"
              style={{ position: 'relative' }}
            >
              <IonIcon
                slot="icon-only"
                icon={pendientes.length === 0 ? checkmarkCircleOutline : bulbOutline}
                style={{ color: pendientes.length === 0 ? '#6ee7b7' : '#fde68a' }}
              />
              {pendientes.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '2px',
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '999px',
                    backgroundColor: '#f59e0b',
                    color: '#0f172a',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    lineHeight: 1,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {pendientes.length}
                </span>
              )}
            </IonButton>
          )}

          <IonButton
            onClick={handleToggleTheme}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <IonIcon slot="icon-only" icon={isDark ? sunnyOutline : moonOutline} />
          </IonButton>
        </IonButtons>
      </IonToolbar>

      {/* Popover de Sugerencias para completar y mantener al día el Baúl */}
      <IonPopover
        isOpen={popoverAbierto}
        event={popoverEvento}
        onDidDismiss={() => setPopoverAbierto(false)}
        side="bottom"
        alignment="end"
        style={{ '--width': '350px', '--max-width': '92vw' } as React.CSSProperties}
      >
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--be-surface)',
            color: 'var(--be-text)',
            maxHeight: '76vh',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <IonIcon icon={bulbOutline} style={{ color: 'var(--be-warning)', fontSize: '1.15rem' }} />
              <strong style={{ fontSize: '0.96rem', color: 'var(--be-text)' }}>
                Sugerencias para tu Baúl
              </strong>
            </div>
            <span className={porcentajeCompleto === 100 ? 'be-badge be-badge-success' : 'be-badge be-badge-info'}>
              {porcentajeCompleto}%
            </span>
          </div>

          <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: 'var(--be-text-muted)', lineHeight: 1.45 }}>
            Recomendaciones prácticas para dejar tu perfil completo y actualizado sin olvidar ningún detalle.
          </p>

          {/* Barra de progreso */}
          <div
            style={{
              height: '7px',
              borderRadius: '999px',
              backgroundColor: 'var(--be-border)',
              overflow: 'hidden',
              marginBottom: '14px',
            }}
          >
            <div
              style={{
                width: `${porcentajeCompleto}%`,
                height: '100%',
                background:
                  porcentajeCompleto === 100
                    ? 'var(--be-success)'
                    : 'linear-gradient(90deg, var(--be-primary) 0%, #3b82f6 100%)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {pendientes.length === 0 ? (
            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: 'var(--be-surface-alt)',
                border: '1px solid var(--be-border)',
                textAlign: 'center',
              }}
            >
              <IonIcon
                icon={checkmarkCircleOutline}
                style={{ fontSize: '1.9rem', color: 'var(--be-success)', marginBottom: '6px' }}
              />
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--be-text)', marginBottom: '4px' }}>
                ¡Tu Baúl está súper completo!
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: 'var(--be-text-muted)', lineHeight: 1.45 }}>
                Recuerda revisar de vez en cuando si agregaste nuevos seguros, cuentas o cartas que quieras dejar listas.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="be-btn be-btn-outline"
                  style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                  onClick={() => handleIrSugerencia('/polizas')}
                >
                  Revisar pólizas
                </button>
                <button
                  type="button"
                  className="be-btn be-btn-outline"
                  style={{ padding: '6px 10px', fontSize: '0.76rem' }}
                  onClick={() => handleIrSugerencia('/mensajes')}
                >
                  Revisar cartas
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pendientes.map((sug) => (
                <button
                  key={sug.id}
                  type="button"
                  onClick={() => handleIrSugerencia(sug.ruta)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '11px',
                    border: '1px solid var(--be-border)',
                    backgroundColor: 'var(--be-surface-alt)',
                    cursor: 'pointer',
                    color: 'var(--be-text)',
                  }}
                >
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(15, 76, 129, 0.12)',
                      color: 'var(--be-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}
                  >
                    <IonIcon icon={sug.icon} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--be-text)', marginBottom: '2px' }}>
                      {sug.titulo}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--be-text-muted)', lineHeight: 1.35 }}>
                      {sug.descripcion}
                    </div>
                  </div>
                  <IonIcon
                    icon={chevronForwardOutline}
                    style={{ color: 'var(--be-text-muted)', fontSize: '1rem', flexShrink: 0 }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </IonPopover>
    </IonHeader>
  );
};

export default HeaderBar;
