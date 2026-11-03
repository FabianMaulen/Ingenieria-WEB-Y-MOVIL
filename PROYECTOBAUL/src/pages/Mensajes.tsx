import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonIcon,
  IonSpinner,
  IonToast,
  IonButton,
  useIonViewWillEnter
} from '@ionic/react';
import { 
  lockClosedOutline, 
  mailOpenOutline, 
  sparklesOutline, 
  trashOutline, 
  heartOutline, 
  documentTextOutline,
  peopleOutline
} from 'ionicons/icons';
import { HeaderBar } from '../components/HeaderBar';

import { getMensajes, crearMensaje, eliminarMensaje, MensajeResumen } from '../services/mensajes.service';
import { getAlbaceas, Albacea } from '../services/albaceas.service';
import { mensajeError } from '../services/api';

export const Mensajes: React.FC = () => {
  const [mensajes, setMensajes] = useState<MensajeResumen[]>([]);
  const [albaceas, setAlbaceas] = useState<Albacea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Formulario
  const [rutDestinatario, setRutDestinatario] = useState('');
  const [contenido, setContenido] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [dataMensajes, dataAlbaceas] = await Promise.all([
        getMensajes(),
        getAlbaceas()
      ]);
      setMensajes(Array.isArray(dataMensajes) ? dataMensajes : []);
      setAlbaceas(Array.isArray(dataAlbaceas) ? dataAlbaceas : []);
      
      // Auto-seleccionar el primer albacea si existe
      if (Array.isArray(dataAlbaceas) && dataAlbaceas.length > 0) {
        setRutDestinatario(dataAlbaceas[0].rut);
      }
    } catch (error) {
      console.error('Error al cargar datos:', mensajeError(error));
    } finally {
      setCargando(false);
    }
  };

  useIonViewWillEnter(() => {
    cargarDatos();
  });

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!rutDestinatario.trim() || !contenido.trim()) {
      setErrorMsg('Debes seleccionar un destinatario y escribir un mensaje.');
      return;
    }

    try {
      setEnviando(true);
      // Llama al servicio con los 2 argumentos separados como requiere tu service
      await crearMensaje(rutDestinatario.trim(), contenido.trim());

      setContenido('');
      setToastMsg('Carta sellada y cifrada con éxito.');
      await cargarDatos();
    } catch (error) {
      setErrorMsg(mensajeError(error));
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await eliminarMensaje(id);
      setToastMsg('Mensaje póstumo eliminado.');
      await cargarDatos();
    } catch (error) {
      setToastMsg(mensajeError(error));
    }
  };

  const aplicarPlantilla = (texto: string) => {
    setContenido((prev) => (prev ? `${prev}\n\n${texto}` : texto));
  };

  return (
    <IonPage id="main-content">
      <HeaderBar title="Mensajes Sellados" />

      <IonContent className="ion-padding">
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '12px 0' }}>

          {/* Banner de Contexto y Legado */}
          <div style={{
            backgroundColor: 'var(--ion-color-step-50, #eff6ff)',
            border: '1px solid var(--ion-color-primary, #2563eb)',
            borderRadius: '14px',
            padding: '20px 24px',
            marginBottom: '28px',
            color: 'var(--ion-text-color, #0f172a)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <IonIcon icon={heartOutline} style={{ fontSize: '1.4rem', color: 'var(--ion-color-primary, #2563eb)' }} />
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '700' }}>
                Tu Legado de Palabras
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.85, lineHeight: '1.5' }}>
              Los mensajes póstumos se cifran con <strong>AES-256</strong>. Solo los destinatarios designados en tu Directorio de Albaceas podrán desbloquearlas una vez activada la apertura oficial de tu bóveda.
            </p>
          </div>

          {/* Formulario de Redacción */}
          <form 
            onSubmit={handleGuardar}
            style={{
              backgroundColor: 'var(--ion-card-background, #ffffff)',
              color: 'var(--ion-text-color, #0f172a)',
              borderRadius: '14px',
              border: '1px solid var(--ion-color-step-150, #e2e8f0)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
              padding: '24px 28px',
              marginBottom: '32px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700' }}>
                ✍️ Redactar Nueva Carta Sellada
              </h3>
              <span style={{ 
                fontSize: '0.75rem', 
                backgroundColor: 'var(--ion-color-step-100, #f1f5f9)', 
                padding: '4px 10px', 
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: '600'
              }}>
                <IonIcon icon={lockClosedOutline} /> AES-256 Encrypted
              </span>
            </div>

            {/* Desplegable de Albaceas Autorizados */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                Destinatario (Contactos de tu Directorio de Albaceas) *
              </label>
              
              {albaceas.length === 0 ? (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--ion-color-step-100, #fef3c7)',
                  color: '#92400e',
                  fontSize: '0.85rem'
                }}>
                  ⚠️ No tienes albaceas registrados. Debes agregar al menos un contacto en la sección <strong>Albaceas</strong> para poder asignarle cartas selladas.
                </div>
              ) : (
                <select
                  value={rutDestinatario}
                  onChange={(e) => setRutDestinatario(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--ion-color-step-200, #cbd5e1)',
                    backgroundColor: 'var(--ion-background-color, #f8fafc)',
                    color: 'var(--ion-text-color, #0f172a)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {albaceas.map((a) => (
                    <option key={a.id_directorio} value={a.rut}>
                      {a.nombre_usuario} (RUT: {a.rut}) - {a.parentesco}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Inspiración rápida */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--ion-color-step-600, #64748b)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                <IonIcon icon={sparklesOutline} /> Ideas para iniciar tu redacción:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => aplicarPlantilla('Quiero darte las gracias por todo el tiempo compartido y recordarte que...')}
                  style={{
                    backgroundColor: 'var(--ion-color-step-100, #f1f5f9)',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    color: 'var(--ion-text-color, #334155)',
                    cursor: 'pointer'
                  }}
                >
                  ❤️ Palabras de Agradecimiento
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPlantilla('Respecto a mis pertenencias y documentos personales, mi deseo es que...')}
                  style={{
                    backgroundColor: 'var(--ion-color-step-100, #f1f5f9)',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    color: 'var(--ion-text-color, #334155)',
                    cursor: 'pointer'
                  }}
                >
                  📋 Instrucciones Personales
                </button>
                <button
                  type="button"
                  onClick={() => aplicarPlantilla('Las llaves y accesos digitales principales los guardo en...')}
                  style={{
                    backgroundColor: 'var(--ion-color-step-100, #f1f5f9)',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    color: 'var(--ion-text-color, #334155)',
                    cursor: 'pointer'
                  }}
                >
                  🔑 Accesos y Claves
                </button>
              </div>
            </div>

            {/* Áreas de texto para mensaje */}
            <div style={{ marginBottom: '20px' }}>
              <textarea
                rows={6}
                placeholder="Escribe tu mensaje privado aquí..."
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                disabled={albaceas.length === 0}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--ion-color-step-200, #cbd5e1)',
                  backgroundColor: 'var(--ion-background-color, #f8fafc)',
                  color: 'var(--ion-text-color, #0f172a)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  lineHeight: '1.5'
                }}
              />
            </div>

            {errorMsg && (
              <p style={{ color: 'var(--ion-color-danger, #ef4444)', fontSize: '0.85rem', margin: '0 0 14px 0' }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando || albaceas.length === 0}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: albaceas.length === 0 ? '#94a3b8' : 'var(--ion-color-primary, #2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: albaceas.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {enviando ? <IonSpinner name="crescent" /> : (
                <>
                  <IonIcon icon={lockClosedOutline} /> SELLAR Y GUARDAR MENSAJE
                </>
              )}
            </button>
          </form>

          {/* Lista de Mensajes Custodiados */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--ion-text-color, #0f172a)', marginBottom: '16px' }}>
            📬 Cartas bajo Custodia ({mensajes.length})
          </h3>

          {cargando ? (
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <IonSpinner name="crescent" />
            </div>
          ) : mensajes.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '36px',
              backgroundColor: 'var(--ion-card-background, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--ion-color-step-150, #e2e8f0)',
              color: 'var(--ion-text-color, #64748b)'
            }}>
              <IonIcon icon={mailOpenOutline} style={{ fontSize: '2.2rem', marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No tienes mensajes póstumos registrados aún.</p>
            </div>
          ) : (
            mensajes.map((m) => (
              <div
                key={m.id_mensaje}
                style={{
                  backgroundColor: 'var(--ion-card-background, #ffffff)',
                  color: 'var(--ion-text-color, #0f172a)',
                  borderRadius: '12px',
                  border: '1px solid var(--ion-color-step-150, #e2e8f0)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  padding: '18px 22px',
                  marginBottom: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--ion-color-step-50, #eff6ff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IonIcon icon={documentTextOutline} style={{ fontSize: '1.3rem', color: 'var(--ion-color-primary, #2563eb)' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700' }}>
                      Carta para: {m.nombre_destinatario || `RUT ${m.rut_destinatario}`}
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--ion-color-step-600, #64748b)' }}>
                      RUT: {m.rut_destinatario} | Creado: {new Date(m.fecha_creacion).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                </div>

                <IonButton
                  fill="clear"
                  color="danger"
                  size="small"
                  onClick={() => handleEliminar(m.id_mensaje)}
                  title="Eliminar carta"
                >
                  <IonIcon slot="icon-only" icon={trashOutline} />
                </IonButton>
              </div>
            ))
          )}

        </div>

        <IonToast
          isOpen={!!toastMsg}
          onDidDismiss={() => setToastMsg('')}
          message={toastMsg}
          duration={3000}
        />
      </IonContent>
    </IonPage>
  );
};

export default Mensajes;