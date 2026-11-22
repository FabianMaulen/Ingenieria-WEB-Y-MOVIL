import React, { useState, useRef, useEffect } from 'react';
import { IonPage, IonContent, IonIcon, IonSpinner, IonToast } from '@ionic/react';
import {
  arrowBackOutline,
  moonOutline,
  sunnyOutline,
  searchOutline,
  cloudUploadOutline,
  checkmarkCircleOutline,
  openOutline,
  closeOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { mensajeError } from '../services/api';
import {
  consultarBaulFamiliar,
  enviarReporteFamiliar,
  ReporteFamiliarResultado,
} from '../services/contingencia.service';
import { normalizarRut, rutValido, emailValido } from '../utils/rut';
import { alternarTema, obtenerTemaOscuro } from '../utils/theme';
import { VaultChestIcon } from '../components/VaultChestIcon';

export const ConsultaFamiliar: React.FC = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => obtenerTemaOscuro());

  const [paso, setPaso] = useState<'consultar' | 'reportar' | 'confirmado'>('consultar');
  const [rutTitular, setRutTitular] = useState('');
  const [consultaMensaje, setConsultaMensaje] = useState('');
  const [noExisteMsg, setNoExisteMsg] = useState('');

  const [nombreFamiliar, setNombreFamiliar] = useState('');
  const [rutFamiliar, setRutFamiliar] = useState('');
  const [correoFamiliar, setCorreoFamiliar] = useState('');
  const [parentesco, setParentesco] = useState('Hijo/a');
  const [archivo, setArchivo] = useState<File | null>(null);

  const [comprobante, setComprobante] = useState<ReporteFamiliarResultado | null>(null);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const onTheme = () => setIsDark(obtenerTemaOscuro());
    window.addEventListener('theme-changed', onTheme);
    return () => window.removeEventListener('theme-changed', onTheme);
  }, []);

  const handleConsultar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setNoExisteMsg('');

    if (!rutValido(rutTitular)) {
      setErrorMsg('Ingresa un RUT chileno válido con dígito verificador (Ej: 12345678-5).');
      return;
    }

    try {
      setCargando(true);
      const res = await consultarBaulFamiliar(normalizarRut(rutTitular));
      setRutTitular(res.data.rut_consultado);
      if (res.data.existe_baul) {
        setConsultaMensaje(res.mensaje);
        setPaso('reportar');
      } else {
        setNoExisteMsg(res.mensaje);
      }
    } catch (error) {
      setErrorMsg(mensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  const handleReportar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nombreFamiliar.trim() || !rutValido(rutFamiliar) || !emailValido(correoFamiliar)) {
      setErrorMsg('Verifica tu nombre completo, RUT chileno válido y correo electrónico.');
      return;
    }

    if (!archivo) {
      setErrorMsg('Debes adjuntar el certificado de defunción (PDF, JPG o PNG, máx. 5 MB).');
      return;
    }

    try {
      setCargando(true);
      const res = await enviarReporteFamiliar({
        rut_titular: normalizarRut(rutTitular),
        nombre_familiar: nombreFamiliar.trim(),
        rut_familiar: normalizarRut(rutFamiliar),
        correo_familiar: correoFamiliar.trim().toLowerCase(),
        parentesco,
        certificado: archivo,
      });
      setComprobante(res.data);
      setToastMsg(res.mensaje || 'Reporte registrado con éxito.');
      setPaso('confirmado');
    } catch (error) {
      setErrorMsg(mensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="be-auth-wrapper">
          <div className="be-card" style={{ width: '100%', maxWidth: '580px', padding: '24px 30px 32px', borderRadius: '22px' }}>
            {/* Barra superior: Volver + Tema */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <button
                type="button"
                className="be-btn be-btn-outline"
                style={{ padding: '7px 12px', fontSize: '0.8rem' }}
                onClick={() => (paso === 'reportar' ? setPaso('consultar') : navigate('/login'))}
              >
                <IonIcon icon={arrowBackOutline} />
                {paso === 'reportar' ? 'Cambiar RUT' : 'Volver al Login'}
              </button>

              <button
                type="button"
                onClick={() => setIsDark(alternarTema())}
                title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid var(--be-border)',
                  backgroundColor: 'var(--be-surface-alt)',
                  color: 'var(--be-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1.15rem',
                }}
              >
                <IonIcon icon={isDark ? sunnyOutline : moonOutline} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <VaultChestIcon size={64} mode="static" />
              <h2 style={{ margin: '10px 0 6px 0', fontSize: '1.48rem', color: 'var(--be-text)' }}>
                Consulta y Reporte Familiar
              </h2>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--be-text-muted)', lineHeight: 1.5 }}>
                Si un ser querido falleció y aún no tienes cuenta en Baúl Eterno, verifica si mantenía una bóveda
                activa y envía el certificado de defunción para revisión oficial.
              </p>
            </div>

            {paso === 'consultar' && (
              <form onSubmit={handleConsultar}>
                <div className="be-field">
                  <label className="be-label">RUT del familiar titular *</label>
                  <input
                    type="text"
                    className="be-input"
                    placeholder="Ej: 12345678-5"
                    value={rutTitular}
                    onChange={(e) => setRutTitular(e.target.value)}
                    onBlur={() => {
                      if (rutTitular.trim()) setRutTitular(normalizarRut(rutTitular));
                    }}
                    required
                  />
                </div>

                {errorMsg && (
                  <p style={{ color: 'var(--be-danger)', fontSize: '0.84rem', fontWeight: 600, margin: '0 0 12px 0' }}>
                    {errorMsg}
                  </p>
                )}

                {noExisteMsg && (
                  <div className="be-badge-warning" style={{ padding: '12px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '14px' }}>
                    {noExisteMsg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="be-btn be-btn-outline"
                    style={{ flex: '1 1 120px' }}
                    onClick={() => navigate('/login')}
                  >
                    <IonIcon icon={closeOutline} /> Cancelar
                  </button>
                  <button
                    type="submit"
                    className="be-btn be-btn-primary"
                    style={{ flex: '2 1 200px' }}
                    disabled={cargando}
                  >
                    {cargando ? (
                      <IonSpinner name="crescent" color="light" />
                    ) : (
                      <>
                        <IonIcon icon={searchOutline} /> Consultar existencia de baúl
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {paso === 'reportar' && (
              <form onSubmit={handleReportar}>
                <div
                  className="be-badge-success"
                  style={{ padding: '12px 14px', borderRadius: '12px', fontSize: '0.84rem', lineHeight: 1.45, marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}
                >
                  <IonIcon icon={shieldCheckmarkOutline} style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: '2px' }} />
                  <span>{consultaMensaje}</span>
                </div>

                <div className="be-grid-2">
                  <div className="be-field">
                    <label className="be-label">Tu nombre completo *</label>
                    <input
                      type="text"
                      className="be-input"
                      placeholder="Ej: Sofía Morales"
                      value={nombreFamiliar}
                      onChange={(e) => setNombreFamiliar(e.target.value)}
                      required
                    />
                  </div>

                  <div className="be-field">
                    <label className="be-label">Tu RUT chileno *</label>
                    <input
                      type="text"
                      className="be-input"
                      placeholder="Ej: 19876543-0"
                      value={rutFamiliar}
                      onChange={(e) => setRutFamiliar(e.target.value)}
                      onBlur={() => {
                        if (rutFamiliar.trim()) setRutFamiliar(normalizarRut(rutFamiliar));
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="be-grid-2">
                  <div className="be-field">
                    <label className="be-label">Tu correo de contacto *</label>
                    <input
                      type="email"
                      className="be-input"
                      placeholder="correo@ejemplo.cl"
                      value={correoFamiliar}
                      onChange={(e) => setCorreoFamiliar(e.target.value)}
                      required
                    />
                  </div>

                  <div className="be-field">
                    <label className="be-label">Parentesco *</label>
                    <select className="be-select" value={parentesco} onChange={(e) => setParentesco(e.target.value)}>
                      <option value="Hijo/a">Hijo/a</option>
                      <option value="Cónyuge">Cónyuge</option>
                      <option value="Hermano/a">Hermano/a</option>
                      <option value="Padre/Madre">Padre/Madre</option>
                      <option value="Familiar">Otro familiar</option>
                      <option value="Abogado/a">Representante legal</option>
                    </select>
                  </div>
                </div>

                <div className="be-field" style={{ marginBottom: '18px' }}>
                  <label className="be-label">Certificado de defunción (PDF, JPG o PNG · Máx. 5 MB) *</label>
                  <div
                    style={{
                      border: '1.5px dashed var(--be-border)',
                      borderRadius: '12px',
                      padding: '16px',
                      backgroundColor: 'var(--be-surface-alt)',
                      textAlign: 'center',
                    }}
                  >
                    <IonIcon icon={cloudUploadOutline} style={{ fontSize: '1.8rem', color: 'var(--be-primary)' }} />
                    <div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,image/jpeg,image/png"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          if (f && f.size > 5 * 1024 * 1024) {
                            setErrorMsg('El archivo supera el límite de 5 MB.');
                            setArchivo(null);
                          } else {
                            setErrorMsg('');
                            setArchivo(f);
                          }
                        }}
                        style={{ fontSize: '0.84rem', maxWidth: '100%' }}
                      />
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <p style={{ color: 'var(--be-danger)', fontSize: '0.84rem', fontWeight: 600, margin: '0 0 12px 0' }}>
                    {errorMsg}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="be-btn be-btn-outline"
                    style={{ flex: '1 1 120px' }}
                    onClick={() => navigate('/login')}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="be-btn be-btn-danger"
                    style={{ flex: '2 1 200px' }}
                    disabled={cargando}
                  >
                    {cargando ? <IonSpinner name="crescent" color="light" /> : 'Enviar certificado y reporte'}
                  </button>
                </div>
              </form>
            )}

            {paso === 'confirmado' && comprobante && (
              <div style={{ textAlign: 'center' }}>
                <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '3rem', color: 'var(--be-success)', marginBottom: '8px' }} />
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>
                  Reporte #{comprobante.id_reporte} registrado
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: 'var(--be-text-muted)', lineHeight: 1.55 }}>
                  Sellamos tu certificado con huella criptográfica SHA-256 y notificamos a soporte para su validación en
                  el Registro Civil de Chile.
                </p>

                <div
                  style={{
                    textAlign: 'left',
                    backgroundColor: 'var(--be-surface-alt)',
                    border: '1px solid var(--be-border)',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '0.8rem',
                    marginBottom: '18px',
                    wordBreak: 'break-all',
                  }}
                >
                  <div>
                    <strong>RUT consultado:</strong> {comprobante.rut_titular_consultado}
                  </div>
                  {comprobante.folio_extraido && (
                    <div>
                      <strong>Folio / Código detectado (IA):</strong> {comprobante.folio_extraido}
                    </div>
                  )}
                  <div>
                    <strong>SHA-256:</strong> <code>{comprobante.hash_documento}</code>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a
                    href={comprobante.portal_registro_civil}
                    target="_blank"
                    rel="noreferrer"
                    className="be-btn be-btn-outline be-btn-block"
                    style={{ textDecoration: 'none' }}
                  >
                    <IonIcon icon={openOutline} /> Portal oficial de verificación (Registro Civil)
                  </a>
                  <button
                    type="button"
                    className="be-btn be-btn-primary be-btn-block"
                    onClick={() => navigate('/login', { replace: true })}
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <IonToast
          isOpen={!!toastMsg}
          onDidDismiss={() => setToastMsg('')}
          message={toastMsg}
          duration={3500}
          color="success"
        />
      </IonContent>
    </IonPage>
  );
};

export default ConsultaFamiliar;
