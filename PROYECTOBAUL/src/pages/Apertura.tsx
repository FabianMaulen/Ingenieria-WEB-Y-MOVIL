import React, { useState, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonIcon,
  IonToast,
  IonSpinner
} from '@ionic/react';
import { closeCircleOutline } from 'ionicons/icons';
import AppMenu from '../components/AppMenu';

// --- IMPORTACIONES DE CONEXIÓN AL BACKEND ---
import { mensajeError } from '../services/api';
import { crearSolicitud } from '../services/solicitudes.service';
import { normalizarRut } from '../utils/rut';

export const Apertura: React.FC = () => {
  const [rutTitular, setRutTitular] = useState('');
  const [archivos, setArchivos] = useState<File[]>([]);
  const [showToast, setShowToast] = useState(false);
  
  // Estados para manejo de conexión
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const nuevosArchivos = Array.from(e.target.files);
      // Validar peso si es necesario (Claude mencionó Máximo 5MB)
      const archivosValidos = nuevosArchivos.filter(file => file.size <= 5 * 1024 * 1024);
      
      if (archivosValidos.length < nuevosArchivos.length) {
        setErrorMsg('Algunos archivos superan el límite de 5 MB y fueron omitidos.');
      } else {
        setErrorMsg('');
      }

      setArchivos(prev => [...prev, ...archivosValidos]);
    }
  };

  const handleEliminarArchivo = (indexTarget: number) => {
    setArchivos(prev => prev.filter((_, index) => index !== indexTarget));
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

    if (archivos.length === 0) {
      setErrorMsg('Debe adjuntar al menos un documento (Certificado de defunción).');
      return;
    }

    try {
      setCargando(true);
      
      // 1. Normalizar RUT para que coincida exactamente con la BD
      const rutFormateado = normalizarRut(rutTitular);

      // 2. Construir el FormData para envío multipart (Archivos)
      const formData = new FormData();
      formData.append('rut_titular', rutFormateado);
      
      // Enviamos el primer archivo bajo el campo 'certificado' exigido por el backend
      formData.append('certificado', archivos[0]); 

      // 3. Petición al backend
      await crearSolicitud(formData);

      // 4. Limpiar y avisar éxito
      setShowToast(true);
      setRutTitular('');
      setArchivos([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      setErrorMsg(mensajeError(error));
    } finally {
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
              Apertura por Contingencia
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent style={{ '--background': '#f8fafc' } as any} className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh', padding: '20px' }}>
            <div style={{
              width: '100%',
              maxWidth: '650px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.03)',
              padding: '36px 40px'
            }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Solicitud de Liberación (Albacea)
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 24px 0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Adjunta el certificado de defunción y documentos de respaldo para validar la solicitud.
              </p>

              <form onSubmit={handleSolicitar}>
                <div style={{ marginBottom: '18px' }}>
                  <input
                    type="text"
                    placeholder="RUT del Titular"
                    value={rutTitular}
                    onChange={(e) => setRutTitular(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '48px',
                      padding: '0 16px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.92rem',
                      color: '#0f172a',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '0.82rem', color: '#64748b', display: 'block', marginBottom: '8px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    Certificados o Documentos (PDF o Imagen, Máx 5MB):
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg"
                    onChange={handleFileChange}
                    style={{
                      fontSize: '0.85rem',
                      color: '#475569',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      marginBottom: archivos.length > 0 ? '12px' : '0'
                    }}
                  />

                  {archivos.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {archivos.map((arch, index) => (
                        <div key={`${arch.name}-${index}`} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#f1f5f9',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: '500', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            {arch.name}
                          </span>
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
                              padding: 0
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

                {/* Mostrar error si la API o la validación fallan */}
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
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                >
                  {cargando ? <IonSpinner name="crescent" color="light" /> : 'INICIAR SOLICITUD'}
                </button>
              </form>
            </div>
          </div>

          <IonToast
            isOpen={showToast}
            onDidDismiss={() => setShowToast(false)}
            message="Solicitud enviada exitosamente. En proceso de verificación."
            duration={4000}
            color="success"
          />
        </IonContent>
      </IonPage>
    </>
  );
};

export default Apertura;