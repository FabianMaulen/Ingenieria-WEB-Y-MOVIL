import React, { useState, useRef } from 'react';
import {
  IonPage,
  IonContent,
  IonIcon,
  IonToast,
  IonSpinner,
  useIonViewWillEnter,
} from '@ionic/react';
import { closeCircleOutline, cloudUploadOutline, documentAttachOutline } from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { VaultLoader } from '../components/VaultLoader';
import { mensajeError } from '../services/api';
import { crearSolicitud, misSolicitudes, SolicitudAlbacea } from '../services/solicitudes.service';
import { normalizarRut, rutValido } from '../utils/rut';
import { fechaHora, tiempoRestante } from '../services/utils/formato';

export const Apertura: React.FC = () => {
  const location = useLocation();
  const rutInicial = (location.state as { rut_titular?: string } | null)?.rut_titular || '';

  const [rutTitular, setRutTitular] = useState(rutInicial);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudAlbacea[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cargarSolicitudes = async () => {
    try {
      setCargandoLista(true);
      const data = await misSolicitudes();
      setSolicitudes(Array.isArray(data) ? data : []);
    } catch {
      setSolicitudes([]);
    } finally {
      setCargandoLista(false);
    }
  };

  useIonViewWillEnter(() => {
    localStorage.setItem('modo_activo', 'ALBACEA');
    if (rutInicial) setRutTitular(rutInicial);
    cargarSolicitudes();
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const nuevosArchivos = Array.from(e.target.files);
      const archivosValidos = nuevosArchivos.filter((file) => file.size <= 5 * 1024 * 1024);

      if (archivosValidos.length < nuevosArchivos.length) {
        setErrorMsg('El archivo supera el límite permitido de 5 MB.');
      } else {
        setErrorMsg('');
      }

      if (archivosValidos.length > 0) {
        setArchivos([archivosValidos[0]]);
      }
    }
  };

  const handleEliminarArchivo = (indexTarget: number) => {
    setArchivos((prev) => prev.filter((_, index) => index !== indexTarget));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!rutTitular.trim()) {
      setErrorMsg('El RUT del titular es obligatorio.');
      return;
    }

    if (!rutValido(rutTitular)) {
      setErrorMsg('El RUT del titular no es válido. Verifica el dígito verificador (Ej: 12345678-5).');
      return;
    }

    if (archivos.length === 0) {
      setErrorMsg('Debes adjuntar el certificado de defunción (PDF, JPG o PNG).');
      return;
    }

    try {
      setCargando(true);
      const rutFormateado = normalizarRut(rutTitular);
      const res = await crearSolicitud(rutFormateado, archivos[0]);

      setToastMsg(res.mensaje || 'Solicitud enviada con éxito. Periodo de gracia iniciado.');
      setShowToast(true);
      setRutTitular('');
      setArchivos([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await cargarSolicitudes();
    } catch (error) {
      setErrorMsg(mensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage id="main-content">
      <HeaderBar title="Apertura por Contingencia" />

      <IonContent className="ion-padding">
        <div className="be-container">
          <div className="be-page-header">
            <div>
              <h2 className="be-page-title">Solicitud de Liberación</h2>
              <p className="be-page-subtitle">
                Adjunta el certificado de defunción para activar el periodo de gracia de 72 horas. Debes figurar como
                albacea validado del titular.
              </p>
            </div>
          </div>

          <form onSubmit={handleSolicitar} className="be-card">
            <div className="be-field">
              <label className="be-label">RUT del titular *</label>
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

            <div className="be-field" style={{ marginBottom: '20px' }}>
              <label className="be-label">Certificado de defunción (PDF, JPG o PNG · Máx. 5 MB) *</label>

              <div
                style={{
                  border: '1.5px dashed var(--be-border)',
                  borderRadius: '12px',
                  padding: '18px',
                  backgroundColor: 'var(--be-surface-alt)',
                  textAlign: 'center',
                }}
              >
                <IonIcon icon={cloudUploadOutline} style={{ fontSize: '2rem', color: 'var(--be-primary)', marginBottom: '6px' }} />
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg"
                    onChange={handleFileChange}
                    style={{ fontSize: '0.84rem', maxWidth: '100%' }}
                  />
                </div>
              </div>

              {archivos.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {archivos.map((arch, index) => (
                    <div
                      key={`${arch.name}-${index}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'var(--be-surface-alt)',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--be-border)',
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--be-text)' }}>
                        {arch.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEliminarArchivo(index)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--be-danger)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        <IonIcon icon={closeCircleOutline} style={{ fontSize: '1.15rem' }} />
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {errorMsg && (
              <p style={{ color: 'var(--be-danger)', fontSize: '0.85rem', margin: '0 0 14px 0', fontWeight: 600 }}>
                {errorMsg}
              </p>
            )}

            <button type="submit" className="be-btn be-btn-danger be-btn-block" disabled={cargando}>
              {cargando ? <IonSpinner name="crescent" color="light" /> : 'Iniciar solicitud de apertura'}
            </button>
          </form>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--be-text)', margin: '0 0 12px 0' }}>
            Mis solicitudes enviadas ({solicitudes.length})
          </h3>

          {cargandoLista ? (
            <VaultLoader texto="Cargando tus solicitudes..." />
          ) : solicitudes.length === 0 ? (
            <div className="be-empty-state" style={{ padding: '26px' }}>
              <IonIcon icon={documentAttachOutline} style={{ fontSize: '2.2rem', marginBottom: '6px', opacity: 0.55 }} />
              <p style={{ margin: 0, fontSize: '0.88rem' }}>No has iniciado solicitudes de apertura todavía.</p>
            </div>
          ) : (
            solicitudes.map((sol) => (
              <div key={sol.id_solicitud} className="be-list-item">
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.98rem', fontWeight: 700, color: 'var(--be-text)' }}>
                    {sol.nombre_titular} {sol.rut_titular ? `(${sol.rut_titular})` : ''}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--be-text-muted)' }}>
                    Enviada: {fechaHora(sol.fecha_solicitud)}
                    {sol.estado_solicitud === 'PENDIENTE' && sol.fecha_limite
                      ? ` · ${tiempoRestante(sol.fecha_limite)}`
                      : ''}
                  </p>
                </div>

                <span
                  className={
                    sol.estado_solicitud === 'APROBADA'
                      ? 'be-badge be-badge-success'
                      : sol.estado_solicitud === 'CANCELADA'
                      ? 'be-badge be-badge-neutral'
                      : 'be-badge be-badge-warning'
                  }
                >
                  {sol.estado_solicitud}
                </span>
              </div>
            ))
          )}
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={4000}
          color="success"
        />
      </IonContent>

      <MobileBottomNav />
    </IonPage>
  );
};

export default Apertura;
