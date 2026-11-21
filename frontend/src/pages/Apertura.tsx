import React, { useState, useRef } from 'react';
import {
  IonPage,
  IonContent,
  IonIcon,
  IonToast,
  IonSpinner,
  IonBadge,
  useIonViewWillEnter,
} from '@ionic/react';
import { closeCircleOutline } from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import { HeaderBar } from '../components/HeaderBar';
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

      // Llamada exacta a crearSolicitud(rut_titular, certificado) en formato multipart/form-data
      const res = await crearSolicitud(rutFormateado, archivos[0]);

      setToastMsg(res.mensaje || 'Solicitud enviada exitosamente. En periodo de gracia.');
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
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '16px 0' }}>
          <div
            style={{
              width: '100%',
              backgroundColor: 'var(--ion-card-background, #ffffff)',
              color: 'var(--ion-text-color, #0f172a)',
              borderRadius: '16px',
              border: '1px solid var(--ion-color-step-150, #e2e8f0)',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)',
              padding: '32px',
              marginBottom: '28px',
            }}
          >
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', margin: '0 0 6px 0' }}>
              Solicitud de Liberación (Albacea)
            </h2>
            <p style={{ fontSize: '0.88rem', opacity: 0.78, margin: '0 0 24px 0' }}>
              Adjunta el certificado de defunción para iniciar el periodo de gracia de verificación. Debes haber
              aceptado previamente la designación del titular en tu Panel Albacea.
            </p>

            <form onSubmit={handleSolicitar}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  RUT del Titular *
                </label>
                <input
                  type="text"
                  placeholder="Ej: 12345678-5"
                  value={rutTitular}
                  onChange={(e) => setRutTitular(e.target.value)}
                  onBlur={() => {
                    if (rutTitular.trim()) setRutTitular(normalizarRut(rutTitular));
                  }}
                  required
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '0 16px',
                    backgroundColor: 'var(--ion-color-step-100, #f8fafc)',
                    border: '1px solid var(--ion-color-step-200, #cbd5e1)',
                    borderRadius: '8px',
                    fontSize: '0.92rem',
                    color: 'var(--ion-text-color, #0f172a)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                  Certificado de Defunción (PDF, JPG o PNG — Máx. 5 MB) *
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg"
                  onChange={handleFileChange}
                  style={{
                    fontSize: '0.85rem',
                    marginBottom: archivos.length > 0 ? '12px' : '0',
                  }}
                />

                {archivos.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {archivos.map((arch, index) => (
                      <div
                        key={`${arch.name}-${index}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: 'var(--ion-color-step-100, #f1f5f9)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--ion-color-step-200, #cbd5e1)',
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{arch.name}</span>
                        <button
                          type="button"
                          onClick={() => handleEliminarArchivo(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            padding: 0,
                          }}
                        >
                          <IonIcon icon={closeCircleOutline} style={{ fontSize: '1.2rem' }} />
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {errorMsg && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '16px', fontWeight: '500' }}>
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={cargando}
                style={{
                  width: '100%',
                  height: '46px',
                  backgroundColor: cargando ? '#f87171' : '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  cursor: cargando ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {cargando ? <IonSpinner name="crescent" color="light" /> : 'INICIAR SOLICITUD'}
              </button>
            </form>
          </div>

          {/* Historial de Solicitudes del Albacea */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px' }}>
            Mis Solicitudes de Apertura ({solicitudes.length})
          </h3>

          {cargandoLista ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <IonSpinner name="crescent" />
            </div>
          ) : solicitudes.length === 0 ? (
            <div
              style={{
                padding: '24px',
                borderRadius: '12px',
                backgroundColor: 'var(--ion-card-background, #ffffff)',
                border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                textAlign: 'center',
                opacity: 0.75,
                fontSize: '0.9rem',
              }}
            >
              No has iniciado solicitudes de apertura todavía.
            </div>
          ) : (
            solicitudes.map((sol) => (
              <div
                key={sol.id_solicitud}
                style={{
                  backgroundColor: 'var(--ion-card-background, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                  padding: '16px 20px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.98rem', fontWeight: '700' }}>
                    {sol.nombre_titular} {sol.rut_titular ? `(${sol.rut_titular})` : ''}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', opacity: 0.75 }}>
                    Enviada: {fechaHora(sol.fecha_solicitud)}
                    {sol.estado_solicitud === 'PENDIENTE' && sol.fecha_limite
                      ? ` • ${tiempoRestante(sol.fecha_limite)}`
                      : ''}
                  </p>
                </div>

                <IonBadge
                  color={
                    sol.estado_solicitud === 'APROBADA'
                      ? 'success'
                      : sol.estado_solicitud === 'CANCELADA'
                      ? 'medium'
                      : 'warning'
                  }
                >
                  {sol.estado_solicitud}
                </IonBadge>
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
    </IonPage>
  );
};

export default Apertura;
