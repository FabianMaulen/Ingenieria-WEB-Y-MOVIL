import React, { useEffect, useRef, useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import {
  shieldCheckmarkOutline,
  timeOutline,
  notificationsOutline,
  checkmarkCircle,
  ellipseOutline,
  peopleOutline,
  documentTextOutline,
  folderOpenOutline,
  mailOutline,
  mailUnreadOutline,
  lockClosedOutline,
  arrowForwardOutline,
  arrowBackOutline,
  sparklesOutline,
  sendOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { VaultChestIcon } from './VaultChestIcon';
import {
  confirmarVerificacionCorreo,
  enviarVerificacionCorreo,
} from '../services/auth.service';
import { mensajeError } from '../services/api';

interface OnboardingBovedaProps {
  nombreTitular: string;
  correoUsuario: string;
  correoVerificado: boolean;
  cantAlbaceas: number;
  cantPolizas: number;
  cantInventario: number;
  cantMensajes: number;
  frecuenciaDias: number;
  plazoGraciaDias: number;
  activando: boolean;
  onActivar: () => Promise<void>;
  onCorreoConfirmado: () => Promise<void>;
  onNotificar?: (msg: string) => void;
}

const STORAGE_SLIDE_KEY = 'be_onboarding_paso';

export const OnboardingBoveda: React.FC<OnboardingBovedaProps> = ({
  nombreTitular,
  correoUsuario,
  correoVerificado,
  cantAlbaceas,
  cantPolizas,
  cantInventario,
  cantMensajes,
  frecuenciaDias,
  plazoGraciaDias,
  activando,
  onActivar,
  onCorreoConfirmado,
  onNotificar,
}) => {
  const navigate = useNavigate();

  // Si el usuario ya avanzó hacia la configuración o ya agregó algún elemento, retomar directo en el paso final (3)
  const [pasoActual, setPasoActual] = useState<number>(() => {
    const guardado = Number(sessionStorage.getItem(STORAGE_SLIDE_KEY));
    if (!Number.isNaN(guardado) && guardado >= 0 && guardado <= 3) return guardado;
    return cantAlbaceas > 0 || cantPolizas + cantInventario + cantMensajes > 0 ? 3 : 0;
  });

  // Confirmación de correo integrada con código de 6 dígitos
  const [codigoCorreo, setCodigoCorreo] = useState('');
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const [confirmandoCodigo, setConfirmandoCodigo] = useState(false);
  const [mensajeVerif, setMensajeVerif] = useState('');
  const [errorVerif, setErrorVerif] = useState('');

  // Confirmación de deberes y condiciones
  const [aceptaCorreos, setAceptaCorreos] = useState(false);
  const [aceptaDeberCheckin, setAceptaDeberCheckin] = useState(false);
  const [aceptaReglasApertura, setAceptaReglasApertura] = useState(false);

  // Soporte táctil (swipe izquierda/derecha)
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_SLIDE_KEY, String(pasoActual));
  }, [pasoActual]);

  // Si el usuario regresa tras crear su primer albacea o registro y estaba en el paso 0, avanzar automáticamente al paso 3
  useEffect(() => {
    if (
      (cantAlbaceas > 0 || cantPolizas + cantInventario + cantMensajes > 0) &&
      sessionStorage.getItem(STORAGE_SLIDE_KEY) === '3'
    ) {
      setPasoActual(3);
    }
  }, [cantAlbaceas, cantPolizas, cantInventario, cantMensajes]);

  const primerNombre = (nombreTitular || 'Usuario').split(' ')[0];
  const totalRegistros = cantPolizas + cantInventario + cantMensajes;
  const tieneAlbacea = cantAlbaceas >= 1;
  const tieneRegistro = totalRegistros >= 1;
  const condicionesCompletas = aceptaCorreos && aceptaDeberCheckin && aceptaReglasApertura;
  const listoParaActivar = correoVerificado && tieneAlbacea && tieneRegistro && condicionesCompletas;

  const requisitosCumplidos =
    (correoVerificado ? 1 : 0) + (tieneAlbacea ? 1 : 0) + (tieneRegistro ? 1 : 0);

  const irAPaso = (indice: number) => {
    const seguro = Math.max(0, Math.min(3, indice));
    setPasoActual(seguro);
  };

  const irAConfigurar = (ruta: string) => {
    sessionStorage.setItem(STORAGE_SLIDE_KEY, '3');
    navigate(ruta);
  };

  const handleEnviarCodigo = async () => {
    try {
      setEnviandoCodigo(true);
      setErrorVerif('');
      const res = await enviarVerificacionCorreo('PRINCIPAL');
      const msg = res.mensaje || `Enviamos un código de 6 dígitos a ${correoUsuario}.`;
      setMensajeVerif(msg);
      onNotificar?.(msg);
    } catch (err) {
      setErrorVerif(mensajeError(err));
    } finally {
      setEnviandoCodigo(false);
    }
  };

  const handleConfirmarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = codigoCorreo.trim();
    if (!limpio) {
      setErrorVerif('Ingresa el código de 6 dígitos que enviamos a tu correo.');
      return;
    }
    try {
      setConfirmandoCodigo(true);
      setErrorVerif('');
      const res = await confirmarVerificacionCorreo('PRINCIPAL', limpio);
      const msg = res.mensaje || '¡Correo principal confirmado correctamente!';
      setCodigoCorreo('');
      setMensajeVerif(msg);
      onNotificar?.(msg);
      await onCorreoConfirmado();
    } catch (err) {
      setErrorVerif(mensajeError(err));
    } finally {
      setConfirmandoCodigo(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(diff) < 55) return;
    if (diff > 0 && pasoActual < 3) irAPaso(pasoActual + 1);
    if (diff < 0 && pasoActual > 0) irAPaso(pasoActual - 1);
  };

  const faltantesTexto = () => {
    const lista: string[] = [];
    if (!correoVerificado) lista.push('confirmar tu correo electrónico');
    if (!tieneAlbacea) lista.push('designar al menos 1 albacea');
    if (!tieneRegistro) lista.push('guardar al menos 1 póliza, activo o carta');
    if (!condicionesCompletas) lista.push('marcar las 3 confirmaciones de deberes');
    return lista.length > 0 ? `Falta para activar: ${lista.join(' · ')}.` : '';
  };

  const etiquetasPasos = [
    { idx: 0, titulo: '1. Tu espacio' },
    { idx: 1, titulo: '2. Vigencia' },
    { idx: 2, titulo: '3. Respaldo' },
    { idx: 3, titulo: '4. Configurar y activar' },
  ];

  const slidesIntro = [
    {
      etiqueta: 'BIENVENIDA · PASO 1 DE 3',
      titulo: `Bienvenido/a, ${primerNombre}. Este es tu espacio personal.`,
      subtitulo: 'Un cofre privado y sereno para resguardar lo más importante',
      texto:
        'En Baúl Eterno puedes ordenar tus seguros, cuentas digitales y cartas póstumas en un solo lugar protegido con cifrado de alto estándar. Mientras sigas activo, nadie tiene acceso a tu contenido.',
      destacado: 'Tu bóveda está en preparación: aún no corre ningún plazo ni aviso automático.',
      icon: shieldCheckmarkOutline,
      mostrarCofre: true,
    },
    {
      etiqueta: 'CÓMO FUNCIONA · PASO 2 DE 3',
      titulo: 'Tu vigencia avanza solo a tu ritmo',
      subtitulo: `Check-in periódico cada ${frecuenciaDias} días (modificable cuando quieras)`,
      texto:
        'Cuando decidas sellar y activar tu bóveda, comenzará tu ciclo de Check-in. Antes de que venza, te enviaremos recordatorios a tu correo para que confirmes con un solo clic que te encuentras bien y renueves tu resguardo.',
      destacado: 'Puedes cambiar la frecuencia (30, 90, 180 o 365 días) en Configuración en cualquier momento.',
      icon: timeOutline,
      mostrarCofre: false,
    },
    {
      etiqueta: 'PROTECCIÓN ACTIVA · PASO 3 DE 3',
      titulo: 'Plazo de gracia y red de respaldo 48h',
      subtitulo: `${plazoGraciaDias} días de gracia antes de cualquier apertura`,
      texto:
        'Si algún albacea o familiar inicia una contingencia —o si venciera tu ciclo— te alertaremos de inmediato por correo (principal y alternativo) y avisaremos 48 horas antes a tu persona de confianza. Con un clic puedes anular la solicitud al instante.',
      destacado: 'Ahora solo falta tu configuración mínima inicial y confirmar tus deberes para activar tu baúl.',
      icon: notificationsOutline,
      mostrarCofre: false,
    },
  ];

  return (
    <div className="be-onboarding-priority">
      {/* Franja superior de alta prioridad / acción obligatoria */}
      <div
        style={{
          background: 'linear-gradient(135deg, #123666 0%, #1f5499 72%, #5c3f2b 100%)',
          color: '#ffffff',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span className="be-priority-dot" />
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 800,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            }}
          >
            Acción prioritaria · Paso obligatorio para activar tu bóveda
          </span>
        </div>

        <span
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.16)',
            border: '1px solid rgba(255, 255, 255, 0.26)',
            borderRadius: '999px',
            padding: '4px 11px',
            fontSize: '0.73rem',
            fontWeight: 700,
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <IonIcon icon={sparklesOutline} />
          Paso {pasoActual + 1} de 4 · {requisitosCumplidos}/3 requisitos listos
        </span>
      </div>

      {/* Sub-barra de navegación por etapas + barra de progreso */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--be-border)',
          backgroundColor: 'var(--be-surface-alt)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ fontSize: '0.79rem', fontWeight: 600, color: 'var(--be-text-muted)' }}>
          Tu contador de vigencia permanecerá pausado hasta sellar tu bóveda.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {etiquetasPasos.map((p) => {
            const activo = pasoActual === p.idx;
            const completado = pasoActual > p.idx;
            return (
              <button
                key={p.idx}
                type="button"
                onClick={() => irAPaso(p.idx)}
                style={{
                  border: activo
                    ? '1.5px solid var(--be-primary)'
                    : '1px solid var(--be-border)',
                  backgroundColor: activo
                    ? 'var(--be-primary)'
                    : completado
                    ? 'rgba(15, 76, 129, 0.12)'
                    : 'var(--be-surface)',
                  color: activo
                    ? '#ffffff'
                    : completado
                    ? 'var(--be-primary)'
                    : 'var(--be-text-muted)',
                  borderRadius: '999px',
                  padding: '5px 11px',
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {p.titulo}
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra lineal de avance del paso a paso */}
      <div style={{ height: '4px', width: '100%', backgroundColor: 'var(--be-border)' }}>
        <div
          style={{
            height: '100%',
            width: `${((pasoActual + 1) / 4) * 100}%`,
            background: 'linear-gradient(90deg, var(--be-primary) 0%, var(--be-accent) 100%)',
            transition: 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>

      {/* Carrusel horizontal deslizable */}
      <div
        style={{ overflow: 'hidden', width: '100%' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            transform: `translateX(-${pasoActual * 100}%)`,
            transition: 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
            alignItems: 'flex-start',
          }}
        >
          {/* SLIDES 1, 2 y 3: Bienvenida y explicación grande y clara */}
          {slidesIntro.map((slide, idx) => (
            <div
              key={slide.etiqueta}
              style={{
                flex: '0 0 100%',
                width: '100%',
                boxSizing: 'border-box',
                padding: '30px 26px 26px',
              }}
            >
              <div
                style={{
                  maxWidth: '680px',
                  margin: '0 auto',
                  textAlign: 'center',
                }}
              >
                {/* Emblema o ícono grande */}
                <div
                  style={{
                    width: '86px',
                    height: '86px',
                    borderRadius: '24px',
                    margin: '0 auto 18px',
                    background:
                      'linear-gradient(135deg, rgba(15, 76, 129, 0.14) 0%, rgba(139, 94, 60, 0.14) 100%)',
                    border: '1px solid var(--be-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {slide.mostrarCofre ? (
                    <VaultChestIcon size={64} mode="breathing" />
                  ) : (
                    <IonIcon
                      icon={slide.icon}
                      style={{ fontSize: '2.6rem', color: 'var(--be-primary)' }}
                    />
                  )}
                </div>

                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.73rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: 'var(--be-primary)',
                    marginBottom: '8px',
                  }}
                >
                  {slide.etiqueta}
                </span>

                <h3
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '1.48rem',
                    fontWeight: 800,
                    color: 'var(--be-text)',
                    lineHeight: 1.25,
                  }}
                >
                  {slide.titulo}
                </h3>

                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--be-accent)',
                    marginBottom: '14px',
                  }}
                >
                  {slide.subtitulo}
                </div>

                <p
                  style={{
                    margin: '0 auto 20px',
                    maxWidth: '580px',
                    fontSize: '0.94rem',
                    color: 'var(--be-text-muted)',
                    lineHeight: 1.65,
                  }}
                >
                  {slide.texto}
                </p>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--be-surface-alt)',
                    border: '1px solid var(--be-border)',
                    fontSize: '0.83rem',
                    color: 'var(--be-text)',
                    fontWeight: 600,
                    marginBottom: '26px',
                  }}
                >
                  <IonIcon
                    icon={shieldCheckmarkOutline}
                    style={{ color: 'var(--be-primary)', fontSize: '1.1rem', flexShrink: 0 }}
                  />
                  <span>{slide.destacado}</span>
                </div>

                {/* Controles del carrusel */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--be-border)',
                  }}
                >
                  <div>
                    {idx > 0 ? (
                      <button
                        type="button"
                        className="be-btn be-btn-outline"
                        style={{ padding: '9px 16px', fontSize: '0.84rem' }}
                        onClick={() => irAPaso(idx - 1)}
                      >
                        <IonIcon icon={arrowBackOutline} />
                        Anterior
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => irAPaso(3)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--be-text-muted)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '6px 4px',
                          textDecoration: 'underline',
                        }}
                      >
                        Ir directo a configurar
                      </button>
                    )}
                  </div>

                  {/* Puntos indicadores */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    {[0, 1, 2, 3].map((dot) => (
                      <button
                        key={dot}
                        type="button"
                        aria-label={`Ir al paso ${dot + 1}`}
                        onClick={() => irAPaso(dot)}
                        style={{
                          width: pasoActual === dot ? '24px' : '9px',
                          height: '9px',
                          borderRadius: '999px',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          backgroundColor:
                            pasoActual === dot ? 'var(--be-primary)' : 'var(--be-border)',
                          transition: 'all 0.25s ease',
                        }}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    className="be-btn be-btn-primary"
                    style={{ padding: '10px 20px', fontSize: '0.88rem' }}
                    onClick={() => irAPaso(idx + 1)}
                  >
                    {idx === 2 ? 'Ir a configuración mínima' : 'Siguiente paso'}
                    <IonIcon icon={arrowForwardOutline} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* SLIDE 4: Configuración mínima inicial (con verificación de correo integrada) + Confirmación de deberes */}
          <div
            style={{
              flex: '0 0 100%',
              width: '100%',
              boxSizing: 'border-box',
              padding: '24px 24px 26px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.73rem',
                    fontWeight: 800,
                    letterSpacing: '0.07em',
                    color: 'var(--be-primary)',
                    marginBottom: '4px',
                  }}
                >
                  PASO FINAL · CONFIGURACIÓN MÍNIMA Y ACTIVACIÓN
                </span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--be-text)' }}>
                  Deja lista tu base y sella tu Baúl Eterno
                </h3>
              </div>
              <span
                className={
                  requisitosCumplidos === 3
                    ? 'be-badge be-badge-success'
                    : 'be-badge be-badge-info'
                }
              >
                {requisitosCumplidos} / 3 requisitos listos
              </span>
            </div>

            {/* BLOQUE A: Configuración mínima (3 requisitos integrados) */}
            <div
              style={{
                backgroundColor: 'var(--be-surface-alt)',
                border: '1px solid var(--be-border)',
                borderRadius: '14px',
                padding: '16px 18px',
                marginBottom: '18px',
              }}
            >
              {/* Requisito 1: Confirmar correo electrónico con código integrado */}
              <div
                style={{
                  paddingBottom: '14px',
                  marginBottom: '14px',
                  borderBottom: '1px solid var(--be-border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 240px' }}>
                    <IonIcon
                      icon={correoVerificado ? checkmarkCircle : mailUnreadOutline}
                      style={{
                        fontSize: '1.35rem',
                        color: correoVerificado ? 'var(--be-success)' : 'var(--be-warning)',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--be-text)' }}>
                        1. Confirmar tu correo electrónico principal
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--be-text-muted)' }}>
                        {correoVerificado
                          ? `¡Correo verificado! (${correoUsuario || 'Cuenta verificada'})`
                          : `Ingresa el código de 6 dígitos enviado a ${correoUsuario || 'tu correo'} para garantizar las alertas.`}
                      </div>
                    </div>
                  </div>

                  {correoVerificado ? (
                    <span className="be-badge be-badge-success">Confirmado</span>
                  ) : (
                    <button
                      type="button"
                      className="be-btn be-btn-outline"
                      style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                      disabled={enviandoCodigo}
                      onClick={handleEnviarCodigo}
                    >
                      {enviandoCodigo ? (
                        <IonSpinner name="crescent" />
                      ) : (
                        <>
                          <IonIcon icon={sendOutline} />
                          Reenviar código
                        </>
                      )}
                    </button>
                  )}
                </div>

                {!correoVerificado && (
                  <form
                    onSubmit={handleConfirmarCodigo}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap',
                      marginTop: '12px',
                      paddingLeft: '32px',
                    }}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="be-input"
                      style={{ flex: '1 1 170px', maxWidth: '220px', letterSpacing: '0.16em', fontWeight: 700 }}
                      placeholder="Código 6 dígitos"
                      value={codigoCorreo}
                      onChange={(e) => setCodigoCorreo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                    <button
                      type="submit"
                      className="be-btn be-btn-primary"
                      style={{ padding: '9px 16px', fontSize: '0.82rem' }}
                      disabled={confirmandoCodigo || codigoCorreo.trim().length < 6}
                    >
                      {confirmandoCodigo ? 'Verificando...' : 'Confirmar correo'}
                    </button>
                  </form>
                )}

                {!correoVerificado && (mensajeVerif || errorVerif) && (
                  <div
                    style={{
                      marginTop: '8px',
                      paddingLeft: '32px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: errorVerif ? 'var(--be-danger)' : 'var(--be-success)',
                    }}
                  >
                    {errorVerif || mensajeVerif}
                  </div>
                )}
              </div>

              {/* Requisito 2: Al menos 1 albacea */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  paddingBottom: '14px',
                  marginBottom: '14px',
                  borderBottom: '1px solid var(--be-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 240px' }}>
                  <IonIcon
                    icon={tieneAlbacea ? checkmarkCircle : ellipseOutline}
                    style={{
                      fontSize: '1.35rem',
                      color: tieneAlbacea ? 'var(--be-success)' : 'var(--be-text-muted)',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--be-text)' }}>
                      2. Designar al menos 1 albacea de confianza
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--be-text-muted)' }}>
                      {tieneAlbacea
                        ? `¡Listo! Ya tienes ${cantAlbaceas} albacea(s) designado(s).`
                        : 'Elige a la persona de confianza que custodiará tu acceso de contingencia.'}
                    </div>
                  </div>
                </div>

                {tieneAlbacea ? (
                  <span className="be-badge be-badge-success">Completado</span>
                ) : (
                  <button
                    type="button"
                    className="be-btn be-btn-outline"
                    style={{ padding: '7px 13px', fontSize: '0.8rem' }}
                    onClick={() => irAConfigurar('/albaceas')}
                  >
                    <IonIcon icon={peopleOutline} />
                    Ir a Albaceas
                  </button>
                )}
              </div>

              {/* Requisito 3: Al menos 1 registro guardado */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 240px' }}>
                  <IonIcon
                    icon={tieneRegistro ? checkmarkCircle : ellipseOutline}
                    style={{
                      fontSize: '1.35rem',
                      color: tieneRegistro ? 'var(--be-success)' : 'var(--be-text-muted)',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--be-text)' }}>
                      3. Guardar al menos 1 elemento en tu baúl
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--be-text-muted)' }}>
                      {tieneRegistro
                        ? `¡Listo! Ya guardaste ${totalRegistros} elemento(s) (${cantPolizas} pólizas, ${cantInventario} activos, ${cantMensajes} cartas).`
                        : 'Registra tu primera póliza de seguro, un activo en inventario digital o una carta póstuma.'}
                    </div>
                  </div>
                </div>

                {tieneRegistro ? (
                  <span className="be-badge be-badge-success">Completado</span>
                ) : (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="be-btn be-btn-outline"
                      style={{ padding: '6px 11px', fontSize: '0.78rem' }}
                      onClick={() => irAConfigurar('/polizas')}
                    >
                      <IonIcon icon={documentTextOutline} />
                      Póliza
                    </button>
                    <button
                      type="button"
                      className="be-btn be-btn-outline"
                      style={{ padding: '6px 11px', fontSize: '0.78rem' }}
                      onClick={() => irAConfigurar('/inventario')}
                    >
                      <IonIcon icon={folderOpenOutline} />
                      Inventario
                    </button>
                    <button
                      type="button"
                      className="be-btn be-btn-outline"
                      style={{ padding: '6px 11px', fontSize: '0.78rem' }}
                      onClick={() => irAConfigurar('/mensajes')}
                    >
                      <IonIcon icon={mailOutline} />
                      Carta
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* BLOQUE B: Aceptación de deberes y condiciones */}
            <div
              style={{
                backgroundColor: 'var(--be-surface-alt)',
                border: '1px solid var(--be-border)',
                borderRadius: '14px',
                padding: '16px 18px',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  color: 'var(--be-primary)',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                }}
              >
                Confirmación de deberes y condiciones de vigencia
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  color: 'var(--be-text)',
                  lineHeight: 1.45,
                }}
              >
                <input
                  type="checkbox"
                  checked={aceptaCorreos}
                  onChange={(e) => setAceptaCorreos(e.target.checked)}
                  style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: 'var(--be-primary)' }}
                />
                <span>
                  Acepto ser contactado por correo electrónico con recordatorios de vigencia y alertas de seguridad
                  sobre mi bóveda.
                </span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  color: 'var(--be-text)',
                  lineHeight: 1.45,
                }}
              >
                <input
                  type="checkbox"
                  checked={aceptaDeberCheckin}
                  onChange={(e) => setAceptaDeberCheckin(e.target.checked)}
                  style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: 'var(--be-primary)' }}
                />
                <span>
                  Comprendo mi deber de realizar el Check-in dentro del plazo configurado (actualmente{' '}
                  <strong>{frecuenciaDias} días</strong>) para mantener mi información privada y sellada.
                </span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  color: 'var(--be-text)',
                  lineHeight: 1.45,
                }}
              >
                <input
                  type="checkbox"
                  checked={aceptaReglasApertura}
                  onChange={(e) => setAceptaReglasApertura(e.target.checked)}
                  style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: 'var(--be-primary)' }}
                />
                <span>
                  Entiendo que, si no respondo durante el plazo de gracia ante una contingencia o vencimiento, mi bóveda
                  podrá liberarse a mis albaceas validados.
                </span>
              </label>
            </div>

            {/* Acciones finales */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="be-btn be-btn-outline"
                style={{ padding: '11px 16px', fontSize: '0.85rem' }}
                onClick={() => irAPaso(2)}
              >
                <IonIcon icon={arrowBackOutline} />
                Ver introducción
              </button>

              <button
                type="button"
                className="be-btn be-btn-primary"
                style={{
                  flex: '1 1 240px',
                  opacity: listoParaActivar ? 1 : 0.6,
                  cursor: listoParaActivar ? 'pointer' : 'not-allowed',
                }}
                disabled={!listoParaActivar || activando}
                onClick={() => {
                  sessionStorage.removeItem(STORAGE_SLIDE_KEY);
                  onActivar();
                }}
              >
                {activando ? (
                  <IonSpinner name="crescent" color="light" />
                ) : (
                  <>
                    <IonIcon icon={lockClosedOutline} />
                    Sellar y activar mi Bóveda ahora
                    <IonIcon icon={arrowForwardOutline} />
                  </>
                )}
              </button>
            </div>

            {!listoParaActivar && (
              <p
                style={{
                  margin: '10px 0 0 0',
                  fontSize: '0.79rem',
                  color: 'var(--be-text-muted)',
                  textAlign: 'center',
                }}
              >
                {faltantesTexto()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingBoveda;
